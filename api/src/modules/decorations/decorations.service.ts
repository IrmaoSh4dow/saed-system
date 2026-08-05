import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { randomUUID } from 'crypto';
import { MediaStorageService, MAX_IMAGE_DATA_URL_LENGTH } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';

export class CreateDecorationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  imageUrl?: string;
}

export class UpdateDecorationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Injectable()
export class DecorationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  findAll() {
    return this.prismaService.decoration.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { staffDecorations: true } } },
    });
  }

  async findById(id: string) {
    const decoration = await this.prismaService.decoration.findUnique({
      where: { id },
      include: {
        staffDecorations: {
          include: {
            staffProfile: {
              include: {
                character: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!decoration) {
      throw new NotFoundException('Decoration was not found');
    }
    return decoration;
  }

  async create(
    dto: CreateDecorationDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.prismaService.decoration.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Decoration name already exists');
    }

    const id = randomUUID();
    const imageUrl = await this.mediaStorageService.resolveImageUrl(
      dto.imageUrl,
      'decorations',
      id,
    );

    const decoration = await this.prismaService.decoration.create({
      data: {
        id,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        imageUrl,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'decorations.create',
      targetType: 'Decoration',
      targetId: decoration.id,
      metadata: { name: decoration.name },
    });

    return decoration;
  }

  async update(
    id: string,
    dto: UpdateDecorationDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    await this.findById(id);

    const imageUrl =
      dto.imageUrl === undefined
        ? undefined
        : await this.mediaStorageService.resolveImageUrl(dto.imageUrl, 'decorations', id);

    const decoration = await this.prismaService.decoration.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description:
          dto.description === undefined ? undefined : dto.description.trim() || null,
        imageUrl,
        isActive: dto.isActive,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'decorations.update',
      targetType: 'Decoration',
      targetId: decoration.id,
      metadata: { ...dto },
    });

    return decoration;
  }

  listForOfficer(staffProfileId: string) {
    return this.prismaService.staffDecoration.findMany({
      where: { staffProfileId },
      include: { decoration: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async award(
    staffProfileId: string,
    decorationId: string,
    notes: string | undefined,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
    });
    if (!officer) {
      throw new NotFoundException('Officer profile was not found');
    }

    const decoration = await this.prismaService.decoration.findFirst({
      where: { id: decorationId, isActive: true },
    });
    if (!decoration) {
      throw new NotFoundException('Decoration was not found or is inactive');
    }

    const existing = await this.prismaService.staffDecoration.findUnique({
      where: {
        staffProfileId_decorationId: { staffProfileId, decorationId },
      },
    });
    if (existing) {
      throw new ConflictException('Officer already has this decoration');
    }

    const award = await this.prismaService.staffDecoration.create({
      data: {
        staffProfileId,
        decorationId,
        notes: notes?.trim() || null,
      },
      include: { decoration: true },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'decorations.award',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: staffProfileId,
      metadata: {
        staffDecorationId: award.id,
        staffProfileId,
        decorationId,
        decorationName: decoration.name,
        notes: notes?.trim() || null,
      },
    });

    return award;
  }

  async revoke(
    staffDecorationId: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.prismaService.staffDecoration.findUnique({
      where: { id: staffDecorationId },
      include: { decoration: true },
    });
    if (!existing) {
      throw new NotFoundException('Officer decoration was not found');
    }

    await this.prismaService.staffDecoration.delete({
      where: { id: staffDecorationId },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'decorations.revoke',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: existing.staffProfileId,
      metadata: {
        staffDecorationId,
        staffProfileId: existing.staffProfileId,
        decorationId: existing.decorationId,
        decorationName: existing.decoration?.name ?? null,
      },
    });

    return { deleted: true, id: staffDecorationId };
  }
}
