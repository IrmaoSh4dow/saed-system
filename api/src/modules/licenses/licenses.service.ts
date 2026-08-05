import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { randomUUID } from 'crypto';
import { MediaStorageService, MAX_IMAGE_DATA_URL_LENGTH } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';

export class CreateLicenseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code!: string;

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

export class UpdateLicenseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code?: string;

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
export class LicensesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  findAll() {
    return this.prismaService.license.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { staffLicenses: true } } },
    });
  }

  async findById(id: string) {
    const license = await this.prismaService.license.findUnique({
      where: { id },
      include: {
        staffLicenses: {
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
    if (!license) {
      throw new NotFoundException('License was not found');
    }
    return license;
  }

  async create(
    dto: CreateLicenseDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();

    const existingCode = await this.prismaService.license.findUnique({ where: { code } });
    if (existingCode) {
      throw new ConflictException('License code already exists');
    }

    const existingName = await this.prismaService.license.findUnique({ where: { name } });
    if (existingName) {
      throw new ConflictException('License name already exists');
    }

    const id = randomUUID();
    const imageUrl = await this.mediaStorageService.resolveImageUrl(
      dto.imageUrl,
      'licenses',
      id,
    );

    const license = await this.prismaService.license.create({
      data: {
        id,
        code,
        name,
        description: dto.description?.trim() || null,
        imageUrl,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'licenses.create',
      targetType: AUDIT_TARGET.LICENSE,
      targetId: license.id,
      metadata: { code: license.code, name: license.name },
    });

    return license;
  }

  async update(
    id: string,
    dto: UpdateLicenseDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    await this.findById(id);

    const imageUrl =
      dto.imageUrl === undefined
        ? undefined
        : await this.mediaStorageService.resolveImageUrl(dto.imageUrl, 'licenses', id);

    const license = await this.prismaService.license.update({
      where: { id },
      data: {
        code: dto.code === undefined ? undefined : dto.code.trim().toUpperCase(),
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
      action: 'licenses.update',
      targetType: AUDIT_TARGET.LICENSE,
      targetId: license.id,
      metadata: { ...dto, code: license.code, name: license.name },
    });

    return license;
  }

  async remove(
    id: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const license = await this.prismaService.license.findUnique({
      where: { id },
      include: { _count: { select: { staffLicenses: true } } },
    });
    if (!license) {
      throw new NotFoundException('License was not found');
    }

    await this.prismaService.license.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'licenses.delete',
      targetType: AUDIT_TARGET.LICENSE,
      targetId: license.id,
      metadata: {
        code: license.code,
        name: license.name,
        assignmentsRemoved: license._count.staffLicenses,
        message: `Administrator eliminó licencia ${license.code}`,
      },
    });

    return { deleted: true, id };
  }

  listForOfficer(staffProfileId: string) {
    return this.prismaService.staffLicense.findMany({
      where: { staffProfileId },
      include: {
        license: true,
        assignedByAccount: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async assign(
    staffProfileId: string,
    licenseId: string,
    notes: string | undefined,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      include: {
        character: { select: { firstName: true, lastName: true } },
      },
    });
    if (!officer) {
      throw new NotFoundException('Officer profile was not found');
    }

    const license = await this.prismaService.license.findFirst({
      where: { id: licenseId, isActive: true },
    });
    if (!license) {
      throw new NotFoundException('License was not found or is inactive');
    }

    const existing = await this.prismaService.staffLicense.findUnique({
      where: {
        staffProfileId_licenseId: { staffProfileId, licenseId },
      },
    });
    if (existing) {
      throw new ConflictException('Officer already has this license');
    }

    const assignment = await this.prismaService.staffLicense.create({
      data: {
        staffProfileId,
        licenseId,
        assignedByAccountId: actor.accountId,
        notes: notes?.trim() || null,
      },
      include: {
        license: true,
        assignedByAccount: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    const officerName = `${officer.character.firstName} ${officer.character.lastName}`.trim();

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'licenses.assign',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: staffProfileId,
      metadata: {
        staffLicenseId: assignment.id,
        staffProfileId,
        licenseId,
        licenseCode: license.code,
        licenseName: license.name,
        officerName,
        notes: notes?.trim() || null,
        message: `Se asignó licencia ${license.code} al oficial ${officerName}`,
      },
    });

    return assignment;
  }

  async revoke(
    staffLicenseId: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.prismaService.staffLicense.findUnique({
      where: { id: staffLicenseId },
      include: {
        license: true,
        staffProfile: {
          include: {
            character: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Officer license was not found');
    }

    await this.prismaService.staffLicense.delete({
      where: { id: staffLicenseId },
    });

    const officerName =
      `${existing.staffProfile.character.firstName} ${existing.staffProfile.character.lastName}`.trim();
    const licenseCode = existing.license?.code ?? '—';

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'licenses.revoke',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: existing.staffProfileId,
      metadata: {
        staffLicenseId,
        staffProfileId: existing.staffProfileId,
        licenseId: existing.licenseId,
        licenseCode,
        licenseName: existing.license?.name ?? null,
        officerName,
        message: `Se retiró licencia ${licenseCode} al oficial ${officerName}`,
      },
    });

    return { deleted: true, id: staffLicenseId };
  }
}
