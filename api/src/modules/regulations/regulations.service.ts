import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RegulationDocumentStatus } from '@prisma/client';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import {
  CreateRegulationCategoryDto,
  CreateRegulationDocumentDto,
  SearchRegulationsDto,
  UpdateRegulationCategoryDto,
  UpdateRegulationDocumentDto,
} from './dto/regulation.dto';
import {
  htmlToPlainText,
  sanitizeRegulationHtml,
  slugify,
} from './utils/regulation.utils';

const characterSelect = {
  id: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.CharacterSelect;

const documentInclude = {
  category: true,
  authorCharacter: { select: characterSelect },
  lastEditorCharacter: { select: characterSelect },
  attachments: { orderBy: { sortOrder: 'asc' as const } },
  versions: {
    orderBy: { versionNumber: 'desc' as const },
    take: 30,
    include: {
      createdByCharacter: { select: characterSelect },
    },
  },
} satisfies Prisma.RegulationDocumentInclude;

type DocumentRow = Prisma.RegulationDocumentGetPayload<{ include: typeof documentInclude }>;

@Injectable()
export class RegulationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  async getDashboard(permissions: string[]) {
    const canManage = this.canManage(permissions);
    const [published, drafts, archived, categories, recentUpdated, recentCreated] =
      await Promise.all([
        this.prismaService.regulationDocument.count({
          where: { status: RegulationDocumentStatus.PUBLISHED },
        }),
        canManage
          ? this.prismaService.regulationDocument.count({
              where: { status: RegulationDocumentStatus.DRAFT },
            })
          : Promise.resolve(0),
        canManage
          ? this.prismaService.regulationDocument.count({
              where: { status: RegulationDocumentStatus.ARCHIVED },
            })
          : Promise.resolve(0),
        this.prismaService.regulationCategory.count({ where: { isActive: true } }),
        this.prismaService.regulationDocument.findMany({
          where: canManage ? undefined : { status: RegulationDocumentStatus.PUBLISHED },
          orderBy: { updatedAt: 'desc' },
          take: 6,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            lastEditorCharacter: { select: characterSelect },
          },
        }),
        this.prismaService.regulationDocument.findMany({
          where: canManage ? undefined : { status: RegulationDocumentStatus.PUBLISHED },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            authorCharacter: { select: characterSelect },
          },
        }),
      ]);

    return {
      published,
      drafts,
      archived,
      categories,
      recentUpdated: recentUpdated.map((item) => this.toSummary(item)),
      recentCreated: recentCreated.map((item) => this.toSummary(item)),
    };
  }

  async listCategories(includeInactive = false) {
    const rows = await this.prismaService.regulationCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            documents: {
              where: { status: RegulationDocumentStatus.PUBLISHED },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      publishedCount: row._count.documents,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async createCategory(
    dto: CreateRegulationCategoryDto,
    actor: { accountId: string; characterId: string },
  ) {
    const name = dto.name.trim();
    const slug = await this.uniqueCategorySlug(slugify(name));
    const created = await this.prismaService.regulationCategory.create({
      data: {
        name,
        slug,
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 100,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'regulations.category_created',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: created.id,
      metadata: { name, slug },
    });

    return created;
  }

  async updateCategory(
    id: string,
    dto: UpdateRegulationCategoryDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.prismaService.regulationCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category was not found');
    }

    const name = dto.name?.trim() ?? existing.name;
    const slug =
      dto.name && dto.name.trim() !== existing.name
        ? await this.uniqueCategorySlug(slugify(name), id)
        : existing.slug;

    const updated = await this.prismaService.regulationCategory.update({
      where: { id },
      data: {
        name,
        slug,
        description:
          dto.description === undefined ? existing.description : dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? existing.sortOrder,
        isActive: dto.isActive ?? existing.isActive,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'regulations.category_updated',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: id,
      metadata: { name: updated.name, isActive: updated.isActive },
    });

    return updated;
  }

  async listDocuments(query: SearchRegulationsDto, permissions: string[]) {
    const canManage = this.canManage(permissions);
    const where: Prisma.RegulationDocumentWhereInput = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      if (!canManage && query.status !== RegulationDocumentStatus.PUBLISHED) {
        throw new ForbiddenException('Insufficient permissions');
      }
      where.status = query.status;
    } else if (!canManage) {
      where.status = RegulationDocumentStatus.PUBLISHED;
    }

    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { contentText: { contains: q, mode: 'insensitive' } },
        {
          authorCharacter: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const rows = await this.prismaService.regulationDocument.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 100,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        authorCharacter: { select: characterSelect },
        lastEditorCharacter: { select: characterSelect },
      },
    });

    return rows.map((row) => this.toSummary(row));
  }

  async getDocument(id: string, permissions: string[]) {
    const document = await this.requireDocument(id);
    if (
      document.status !== RegulationDocumentStatus.PUBLISHED &&
      !this.canManage(permissions)
    ) {
      throw new ForbiddenException('Document is not published');
    }
    return this.toDetail(document);
  }

  async createDocument(
    dto: CreateRegulationDocumentDto,
    actor: { accountId: string; characterId: string },
    permissions: string[] = [],
  ) {
    await this.requireCategory(dto.categoryId);
    const title = dto.title.trim();
    const contentHtml = sanitizeRegulationHtml(dto.contentHtml);
    const contentText = htmlToPlainText(contentHtml);
    const status = dto.status ?? RegulationDocumentStatus.DRAFT;
    this.assertCanSetStatus(status, RegulationDocumentStatus.DRAFT, permissions);
    const slug = await this.uniqueDocumentSlug(slugify(title));

    const created = await this.prismaService.regulationDocument.create({
      data: {
        categoryId: dto.categoryId,
        title,
        slug,
        summary: dto.summary?.trim() || null,
        contentHtml,
        contentText,
        status,
        versionNumber: 1,
        authorCharacterId: actor.characterId,
        lastEditorCharacterId: actor.characterId,
        publishedAt: status === RegulationDocumentStatus.PUBLISHED ? new Date() : null,
        versions: {
          create: {
            versionNumber: 1,
            title,
            summary: dto.summary?.trim() || null,
            contentHtml,
            contentText,
            status,
            changeSummary: dto.changeSummary?.trim() || 'Versión inicial',
            createdByCharacterId: actor.characterId,
          },
        },
      },
      include: documentInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action:
        status === RegulationDocumentStatus.PUBLISHED
          ? 'regulations.published'
          : 'regulations.created',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: created.id,
      metadata: { title, status, categoryId: dto.categoryId },
    });

    return this.toDetail(created);
  }

  async updateDocument(
    id: string,
    dto: UpdateRegulationDocumentDto,
    actor: { accountId: string; characterId: string },
    permissions: string[] = [],
  ) {
    const existing = await this.requireDocument(id);
    if (dto.categoryId) {
      await this.requireCategory(dto.categoryId);
    }

    const title = dto.title?.trim() ?? existing.title;
    const contentHtml =
      dto.contentHtml !== undefined
        ? sanitizeRegulationHtml(dto.contentHtml)
        : existing.contentHtml;
    const contentText = htmlToPlainText(contentHtml);
    const summary =
      dto.summary === undefined ? existing.summary : dto.summary?.trim() || null;
    const status = dto.status ?? existing.status;
    this.assertCanSetStatus(status, existing.status, permissions);
    const contentChanged =
      contentHtml !== existing.contentHtml ||
      title !== existing.title ||
      summary !== existing.summary;

    const nextVersion = contentChanged ? existing.versionNumber + 1 : existing.versionNumber;
    const publishedAt =
      status === RegulationDocumentStatus.PUBLISHED
        ? existing.publishedAt ?? new Date()
        : existing.publishedAt;

    const updated = await this.prismaService.$transaction(async (tx) => {
      if (contentChanged) {
        await tx.regulationDocumentVersion.create({
          data: {
            documentId: id,
            versionNumber: nextVersion,
            title,
            summary,
            contentHtml,
            contentText,
            status,
            changeSummary: dto.changeSummary?.trim() || 'Actualización de contenido',
            createdByCharacterId: actor.characterId,
          },
        });
      }

      return tx.regulationDocument.update({
        where: { id },
        data: {
          categoryId: dto.categoryId ?? existing.categoryId,
          title,
          summary,
          contentHtml,
          contentText,
          status,
          versionNumber: nextVersion,
          lastEditorCharacterId: actor.characterId,
          publishedAt,
        },
        include: documentInclude,
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action:
        status === RegulationDocumentStatus.ARCHIVED
          ? 'regulations.archived'
          : status === RegulationDocumentStatus.PUBLISHED &&
              existing.status !== RegulationDocumentStatus.PUBLISHED
            ? 'regulations.published'
            : 'regulations.updated',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: id,
      metadata: {
        title,
        status,
        versionNumber: nextVersion,
        contentChanged,
        changeSummary: dto.changeSummary?.trim() || null,
      },
    });

    return this.toDetail(updated);
  }

  async restoreVersion(
    documentId: string,
    versionId: string,
    actor: { accountId: string; characterId: string },
    permissions: string[] = [],
  ) {
    const document = await this.requireDocument(documentId);
    const version = await this.prismaService.regulationDocumentVersion.findFirst({
      where: { id: versionId, documentId },
    });
    if (!version) {
      throw new NotFoundException('Version was not found');
    }

    return this.updateDocument(
      documentId,
      {
        title: version.title,
        summary: version.summary,
        contentHtml: version.contentHtml,
        status: document.status,
        changeSummary: `Restauración de la versión ${version.versionNumber}`,
      },
      actor,
      permissions,
    );
  }

  async deleteDocument(id: string, actor: { accountId: string; characterId: string }) {
    const existing = await this.requireDocument(id);
    await this.prismaService.regulationDocument.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'regulations.deleted',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: id,
      metadata: { title: existing.title, status: existing.status },
    });

    return { id, deleted: true };
  }

  async addAttachment(
    documentId: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
    actor: { accountId: string; characterId: string },
  ) {
    await this.requireDocument(documentId);
    const saved = this.mediaStorageService.saveUploadedDocument(
      file,
      'regulations',
      documentId,
    );

    const attachment = await this.prismaService.regulationAttachment.create({
      data: {
        documentId,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        uploadedByCharacterId: actor.characterId,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'regulations.attachment_added',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: documentId,
      metadata: {
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      },
    });

    return attachment;
  }

  async removeAttachment(
    documentId: string,
    attachmentId: string,
    actor: { accountId: string; characterId: string },
  ) {
    const attachment = await this.prismaService.regulationAttachment.findFirst({
      where: { id: attachmentId, documentId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment was not found');
    }

    await this.prismaService.regulationAttachment.delete({ where: { id: attachmentId } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'regulations.attachment_removed',
      targetType: AUDIT_TARGET.REGULATION,
      targetId: documentId,
      metadata: { attachmentId, fileName: attachment.fileName },
    });

    return { id: attachmentId, deleted: true };
  }

  private canManage(permissions: string[]) {
    const set = new Set(permissions ?? []);
    return (
      set.has('*') ||
      set.has('regulations.create') ||
      set.has('regulations.update') ||
      set.has('regulations.publish') ||
      set.has('regulations.delete')
    );
  }

  private canPublish(permissions: string[]) {
    const set = new Set(permissions ?? []);
    return set.has('*') || set.has('regulations.publish');
  }

  private assertCanSetStatus(
    nextStatus: RegulationDocumentStatus,
    currentStatus: RegulationDocumentStatus,
    permissions: string[],
  ) {
    if (nextStatus === currentStatus) {
      return;
    }
    if (
      (nextStatus === RegulationDocumentStatus.PUBLISHED ||
        nextStatus === RegulationDocumentStatus.ARCHIVED ||
        currentStatus === RegulationDocumentStatus.PUBLISHED ||
        currentStatus === RegulationDocumentStatus.ARCHIVED) &&
      !this.canPublish(permissions)
    ) {
      throw new ForbiddenException('Missing regulations.publish permission');
    }
  }

  private async requireCategory(id: string) {
    const category = await this.prismaService.regulationCategory.findUnique({ where: { id } });
    if (!category || !category.isActive) {
      throw new BadRequestException('Category was not found or is inactive');
    }
    return category;
  }

  private async requireDocument(id: string) {
    const document = await this.prismaService.regulationDocument.findUnique({
      where: { id },
      include: documentInclude,
    });
    if (!document) {
      throw new NotFoundException('Document was not found');
    }
    return document;
  }

  private async uniqueCategorySlug(base: string, excludeId?: string) {
    let slug = base || 'categoria';
    let index = 1;
    while (true) {
      const existing = await this.prismaService.regulationCategory.findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (!existing) return slug;
      index += 1;
      slug = `${base}-${index}`;
    }
  }

  private async uniqueDocumentSlug(base: string) {
    let slug = base || 'documento';
    let index = 1;
    while (true) {
      const existing = await this.prismaService.regulationDocument.findFirst({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      index += 1;
      slug = `${base}-${index}`;
    }
  }

  private toSummary(document: {
    id: string;
    title: string;
    slug: string;
    summary?: string | null;
    status: RegulationDocumentStatus;
    versionNumber: number;
    publishedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; name: string; slug: string } | null;
    authorCharacter?: { id: string; firstName: string; lastName: string } | null;
    lastEditorCharacter?: { id: string; firstName: string; lastName: string } | null;
  }) {
    return {
      id: document.id,
      title: document.title,
      slug: document.slug,
      summary: document.summary ?? null,
      status: document.status,
      versionNumber: document.versionNumber,
      category: document.category ?? null,
      authorCharacter: document.authorCharacter ?? null,
      lastEditorCharacter: document.lastEditorCharacter ?? null,
      publishedAt: document.publishedAt?.toISOString() ?? null,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  private toDetail(document: DocumentRow) {
    return {
      ...this.toSummary(document),
      contentHtml: document.contentHtml,
      contentText: document.contentText,
      attachments: document.attachments.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        createdAt: item.createdAt.toISOString(),
      })),
      versions: document.versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        title: version.title,
        summary: version.summary,
        status: version.status,
        changeSummary: version.changeSummary,
        createdByCharacter: version.createdByCharacter,
        createdAt: version.createdAt.toISOString(),
      })),
    };
  }
}
