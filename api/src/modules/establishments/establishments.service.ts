import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstablishmentStatus, OccupationType, Prisma } from '@prisma/client';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import {
  isAgreementCurrentlyActive,
  slugifyEstablishmentName,
  toDateOnlyString,
  decimalToNumber,
} from '../agreements/agreements.utils';
import { CreateEstablishmentDto, UpdateEstablishmentDto } from './dto/establishment.dto';

const establishmentInclude = {
  agreements: {
    orderBy: [{ status: 'asc' as const }, { startsAt: 'desc' as const }],
    take: 20,
    include: {
      createdByCharacter: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
  _count: {
    select: {
      occupations: { where: { isActive: true } },
      agreements: true,
    },
  },
} satisfies Prisma.EstablishmentInclude;

@Injectable()
export class EstablishmentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  async list(options?: { includeInactive?: boolean; selectableOnly?: boolean }) {
    const where: Prisma.EstablishmentWhereInput = {};

    if (options?.selectableOnly) {
      where.status = EstablishmentStatus.ACTIVE;
      where.isSelectable = true;
    } else if (!options?.includeInactive) {
      where.status = EstablishmentStatus.ACTIVE;
    }

    const rows = await this.prismaService.establishment.findMany({
      where,
      include: establishmentInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return rows.map((row) => this.toCard(row));
  }

  /** Public catalog for character create/settings (no agreement internals required). */
  async listSelectableCatalog() {
    const rows = await this.prismaService.establishment.findMany({
      where: {
        status: EstablishmentStatus.ACTIVE,
        isSelectable: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        defaultPosition: true,
        occupationType: true,
        logoUrl: true,
      },
    });

    return {
      civilian: rows.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        type: item.occupationType,
        defaultPosition: item.defaultPosition,
        logoUrl: item.logoUrl,
      })),
      saedOrganization: 'SAED',
      note: 'SAED is assigned automatically when a character is promoted to officer.',
    };
  }

  async findSelectableByOrganization(organization: string) {
    const normalized = organization.trim();
    if (!normalized) {
      return null;
    }

    return this.prismaService.establishment.findFirst({
      where: {
        status: EstablishmentStatus.ACTIVE,
        isSelectable: true,
        OR: [
          { name: { equals: normalized, mode: 'insensitive' } },
          { slug: { equals: normalized.toLowerCase(), mode: 'insensitive' } },
        ],
      },
    });
  }

  async getById(id: string) {
    const row = await this.prismaService.establishment.findUnique({
      where: { id },
      include: {
        ...establishmentInclude,
        agreements: {
          orderBy: [{ createdAt: 'desc' }],
          include: {
            createdByCharacter: {
              select: { id: true, firstName: true, lastName: true },
            },
            history: {
              orderBy: { createdAt: 'desc' },
              take: 30,
              include: {
                changedByCharacter: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Establishment was not found');
    }

    return this.toDetail(row);
  }

  async create(
    dto: CreateEstablishmentDto,
    actor: { accountId: string; characterId: string },
  ) {
    const name = dto.name.trim();
    const slug = (dto.slug?.trim() || slugifyEstablishmentName(name)).toLowerCase();
    if (!slug) {
      throw new BadRequestException('Unable to derive establishment slug');
    }

    await this.assertUnique(name, slug);

    const logoUrl = await this.mediaStorageService.resolveImageUrl(
      dto.logoUrl,
      'establishments',
    );

    const created = await this.prismaService.establishment.create({
      data: {
        name,
        slug,
        description: dto.description?.trim() || null,
        logoUrl,
        status: dto.status ?? EstablishmentStatus.ACTIVE,
        defaultPosition: dto.defaultPosition?.trim() || 'Empleado',
        occupationType: dto.occupationType ?? OccupationType.BUSINESS,
        isSelectable: dto.isSelectable ?? true,
        sortOrder: dto.sortOrder ?? 100,
      },
      include: establishmentInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'establishments.created',
      targetType: AUDIT_TARGET.ESTABLISHMENT,
      targetId: created.id,
      metadata: {
        name: created.name,
        slug: created.slug,
        status: created.status,
      },
    });

    return this.toCard(created);
  }

  async update(
    id: string,
    dto: UpdateEstablishmentDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.requireEstablishment(id);
    const nextName = dto.name !== undefined ? dto.name.trim() : existing.name;
    const nextSlug =
      dto.slug !== undefined
        ? dto.slug.trim().toLowerCase()
        : dto.name !== undefined
          ? slugifyEstablishmentName(nextName)
          : existing.slug;

    if (nextName !== existing.name || nextSlug !== existing.slug) {
      await this.assertUnique(nextName, nextSlug, id);
    }

    const logoUrl =
      dto.logoUrl === undefined
        ? undefined
        : await this.mediaStorageService.resolveImageUrl(
            dto.logoUrl,
            'establishments',
            id,
          );

    const updated = await this.prismaService.establishment.update({
      where: { id },
      data: {
        name: nextName,
        slug: nextSlug,
        description:
          dto.description === undefined
            ? undefined
            : dto.description?.trim() || null,
        logoUrl,
        status: dto.status,
        defaultPosition:
          dto.defaultPosition === undefined
            ? undefined
            : dto.defaultPosition.trim() || existing.defaultPosition,
        occupationType: dto.occupationType,
        isSelectable: dto.isSelectable,
        sortOrder: dto.sortOrder,
      },
      include: establishmentInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'establishments.updated',
      targetType: AUDIT_TARGET.ESTABLISHMENT,
      targetId: id,
      metadata: {
        from: {
          name: existing.name,
          status: existing.status,
          isSelectable: existing.isSelectable,
        },
        to: {
          name: updated.name,
          status: updated.status,
          isSelectable: updated.isSelectable,
        },
      },
    });

    return this.toCard(updated);
  }

  async setStatus(
    id: string,
    status: EstablishmentStatus,
    actor: { accountId: string; characterId: string },
  ) {
    return this.update(id, { status }, actor);
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File | undefined,
    actor: { accountId: string; characterId: string },
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    await this.requireEstablishment(id);
    const logoUrl = this.mediaStorageService.saveUploadedImage(
      file,
      'establishments',
      id,
    );

    return this.update(id, { logoUrl }, actor);
  }

  private async requireEstablishment(id: string) {
    const row = await this.prismaService.establishment.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Establishment was not found');
    }
    return row;
  }

  private async assertUnique(name: string, slug: string, excludeId?: string) {
    const conflict = await this.prismaService.establishment.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } },
        ],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, name: true, slug: true },
    });

    if (conflict) {
      throw new ConflictException('An establishment with that name or slug already exists');
    }
  }

  private pickActiveAgreement(
    agreements: Array<{
      id: string;
      status: import('@prisma/client').AgreementStatus;
      startsAt: Date;
      endsAt: Date | null;
      discountPercent: Prisma.Decimal;
      notes: string | null;
    }>,
  ) {
    return (
      agreements.find((agreement) => isAgreementCurrentlyActive(agreement)) ?? null
    );
  }

  private toCard(
    row: Prisma.EstablishmentGetPayload<{ include: typeof establishmentInclude }>,
  ) {
    const activeAgreement = this.pickActiveAgreement(row.agreements);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      logoUrl: row.logoUrl,
      status: row.status,
      defaultPosition: row.defaultPosition,
      occupationType: row.occupationType,
      isSelectable: row.isSelectable,
      sortOrder: row.sortOrder,
      activeOccupationCount: row._count.occupations,
      agreementCount: row._count.agreements,
      activeAgreement: activeAgreement
        ? {
            id: activeAgreement.id,
            status: activeAgreement.status,
            discountPercent: decimalToNumber(activeAgreement.discountPercent),
            startsAt: toDateOnlyString(activeAgreement.startsAt),
            endsAt: toDateOnlyString(activeAgreement.endsAt),
            notes: activeAgreement.notes,
          }
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDetail(row: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    status: import('@prisma/client').EstablishmentStatus;
    defaultPosition: string;
    occupationType: import('@prisma/client').OccupationType;
    isSelectable: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { occupations: number; agreements: number };
    agreements: Array<{
      id: string;
      status: import('@prisma/client').AgreementStatus;
      startsAt: Date;
      endsAt: Date | null;
      discountPercent: Prisma.Decimal;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      createdByCharacter: { id: string; firstName: string; lastName: string } | null;
      history?: Array<Record<string, unknown>>;
    }>;
  }) {
    const card = this.toCard(row as Prisma.EstablishmentGetPayload<{ include: typeof establishmentInclude }>);
    return {
      ...card,
      agreements: row.agreements.map((agreement) => ({
        id: agreement.id,
        status: agreement.status,
        discountPercent: decimalToNumber(agreement.discountPercent),
        startsAt: toDateOnlyString(agreement.startsAt),
        endsAt: toDateOnlyString(agreement.endsAt),
        notes: agreement.notes,
        isCurrentlyActive: isAgreementCurrentlyActive(agreement),
        createdByCharacter: agreement.createdByCharacter,
        createdAt: agreement.createdAt.toISOString(),
        updatedAt: agreement.updatedAt.toISOString(),
        history: Array.isArray(agreement.history) ? agreement.history : [],
      })),
    };
  }
}
