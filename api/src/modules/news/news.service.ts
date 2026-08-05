import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { randomUUID } from 'crypto';
import { MediaStorageService, MAX_IMAGE_DATA_URL_LENGTH } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';

export class CreateNewsArticleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summary!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50_000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  coverImageUrl?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  authorName!: string;

  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}

export class UpdateNewsArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50_000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  authorName?: string;

  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}

@Injectable()
export class NewsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  listPublished(limit = 12) {
    return this.prismaService.newsArticle
      .findMany({
        where: { status: NewsStatus.PUBLISHED },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(Math.max(limit, 1), 50),
      })
      .then((items) => items.map((item) => this.mapPublicArticle(item)));
  }

  listAll() {
    return this.prismaService.newsArticle.findMany({
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findPublishedById(id: string) {
    const article = await this.prismaService.newsArticle.findFirst({
      where: { id, status: NewsStatus.PUBLISHED },
    });
    if (!article) {
      throw new NotFoundException('News article was not found');
    }
    return this.mapPublicArticle(article);
  }

  async findById(id: string) {
    const article = await this.prismaService.newsArticle.findUnique({
      where: { id },
    });
    if (!article) {
      throw new NotFoundException('News article was not found');
    }
    return article;
  }

  async create(
    dto: CreateNewsArticleDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const id = randomUUID();
    const status = dto.status ?? NewsStatus.DRAFT;
    if (status === NewsStatus.PUBLISHED && !dto.coverImageUrl) {
      // Cover is recommended but not strictly required for drafts; allow publish without image.
    }

    const coverImageUrl = await this.mediaStorageService.resolveImageUrl(
      dto.coverImageUrl,
      'news',
      id,
    );

    const article = await this.prismaService.newsArticle.create({
      data: {
        id,
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        content: dto.content.trim(),
        coverImageUrl,
        authorName: dto.authorName.trim(),
        authorCharacterId: actor.characterId ?? null,
        status,
        publishedAt: status === NewsStatus.PUBLISHED ? new Date() : null,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'news.created',
      targetType: AUDIT_TARGET.NEWS,
      targetId: article.id,
      metadata: { title: article.title, status: article.status },
    });

    if (article.status === NewsStatus.PUBLISHED) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'news.published',
        targetType: AUDIT_TARGET.NEWS,
        targetId: article.id,
        metadata: { title: article.title },
      });
    }

    return article;
  }

  async update(
    id: string,
    dto: UpdateNewsArticleDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.findById(id);
    const nextStatus = dto.status ?? existing.status;

    let coverImageUrl = existing.coverImageUrl;
    if (dto.coverImageUrl !== undefined) {
      coverImageUrl = await this.mediaStorageService.resolveImageUrl(
        dto.coverImageUrl || undefined,
        'news',
        id,
      );
    }

    let publishedAt = existing.publishedAt;
    if (nextStatus === NewsStatus.PUBLISHED && existing.status !== NewsStatus.PUBLISHED) {
      publishedAt = new Date();
    }
    if (nextStatus !== NewsStatus.PUBLISHED && existing.status === NewsStatus.PUBLISHED) {
      // Keep original publishedAt for history when hiding/drafting.
      publishedAt = existing.publishedAt;
    }

    const article = await this.prismaService.newsArticle.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        summary: dto.summary?.trim(),
        content: dto.content?.trim(),
        coverImageUrl,
        authorName: dto.authorName?.trim(),
        status: nextStatus,
        publishedAt,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'news.updated',
      targetType: AUDIT_TARGET.NEWS,
      targetId: article.id,
      metadata: {
        fromStatus: existing.status,
        toStatus: article.status,
      },
    });

    if (
      article.status === NewsStatus.PUBLISHED &&
      existing.status !== NewsStatus.PUBLISHED
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'news.published',
        targetType: AUDIT_TARGET.NEWS,
        targetId: article.id,
        metadata: { title: article.title },
      });
    }

    return article;
  }

  async remove(
    id: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.findById(id);
    await this.prismaService.newsArticle.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'news.deleted',
      targetType: AUDIT_TARGET.NEWS,
      targetId: id,
      metadata: { title: existing.title, status: existing.status },
    });

    return { id };
  }

  /**
   * Public DTO shape. `images` is ready for a future multi-image gallery;
   * today it only contains the cover when present.
   */
  private mapPublicArticle(article: {
    id: string;
    title: string;
    summary: string;
    content: string;
    coverImageUrl: string | null;
    authorName: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    status: NewsStatus;
  }) {
    const images = article.coverImageUrl
      ? [{ url: article.coverImageUrl, caption: null, sortOrder: 0 }]
      : [];

    return {
      ...article,
      images,
    };
  }
}
