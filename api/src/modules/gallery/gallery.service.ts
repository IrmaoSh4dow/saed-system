import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GalleryItemStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { randomUUID } from 'crypto';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';

export class CreateGalleryMetaDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(GalleryItemStatus)
  status?: GalleryItemStatus;
}

export class UpdateGalleryItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(GalleryItemStatus)
  status?: GalleryItemStatus;
}

class GalleryOrderItemDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderGalleryDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GalleryOrderItemDto)
  items!: GalleryOrderItemDto[];
}

@Injectable()
export class GalleryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  listActive() {
    return this.prismaService.galleryItem.findMany({
      where: { status: GalleryItemStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listAll() {
    return this.prismaService.galleryItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    const item = await this.prismaService.galleryItem.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException('Gallery item was not found');
    }
    return item;
  }

  async createFromUpload(
    file: Express.Multer.File | undefined,
    dto: CreateGalleryMetaDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const id = randomUUID();
    const maxOrder = await this.prismaService.galleryItem.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

    const imageUrl = this.mediaStorageService.saveUploadedImage(file, 'gallery', id);

    const item = await this.prismaService.galleryItem.create({
      data: {
        id,
        imageUrl,
        title: dto.title?.trim() || null,
        description: dto.description?.trim() || null,
        sortOrder,
        status: dto.status ?? GalleryItemStatus.ACTIVE,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'gallery.image_uploaded',
      targetType: AUDIT_TARGET.GALLERY,
      targetId: item.id,
      metadata: { title: item.title, sortOrder: item.sortOrder },
    });

    if (item.status === GalleryItemStatus.ACTIVE) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'gallery.image_published',
        targetType: AUDIT_TARGET.GALLERY,
        targetId: item.id,
      });
    }

    return item;
  }

  async update(
    id: string,
    dto: UpdateGalleryItemDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.findById(id);

    const item = await this.prismaService.galleryItem.update({
      where: { id },
      data: {
        title:
          dto.title === undefined
            ? undefined
            : dto.title?.trim() || null,
        description:
          dto.description === undefined
            ? undefined
            : dto.description?.trim() || null,
        sortOrder: dto.sortOrder,
        status: dto.status,
      },
    });

    if (
      dto.status === GalleryItemStatus.HIDDEN &&
      existing.status !== GalleryItemStatus.HIDDEN
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'gallery.image_hidden',
        targetType: AUDIT_TARGET.GALLERY,
        targetId: item.id,
      });
    }

    if (
      dto.status === GalleryItemStatus.ACTIVE &&
      existing.status !== GalleryItemStatus.ACTIVE
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'gallery.image_published',
        targetType: AUDIT_TARGET.GALLERY,
        targetId: item.id,
      });
    }

    if (dto.sortOrder !== undefined && dto.sortOrder !== existing.sortOrder) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'gallery.order_changed',
        targetType: AUDIT_TARGET.GALLERY,
        targetId: item.id,
        metadata: { from: existing.sortOrder, to: item.sortOrder },
      });
    }

    return item;
  }

  async reorder(
    dto: ReorderGalleryDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    await this.prismaService.$transaction(
      dto.items.map((item) =>
        this.prismaService.galleryItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'gallery.order_changed',
      targetType: AUDIT_TARGET.GALLERY,
      targetId: null,
      metadata: {
        items: dto.items.map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
        })),
      },
    });

    return this.listAll();
  }

  async remove(
    id: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.findById(id);
    await this.prismaService.galleryItem.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'gallery.image_deleted',
      targetType: AUDIT_TARGET.GALLERY,
      targetId: id,
      metadata: { title: existing.title, sortOrder: existing.sortOrder },
    });

    return { id };
  }
}
