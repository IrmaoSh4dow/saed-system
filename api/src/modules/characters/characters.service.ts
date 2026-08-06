import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CharacterStatus, EstablishmentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { isSaedOrganization, SAED_ORGANIZATION } from '../../common/constants/workplaces';
import { excludeSystemAdministratorCharacter } from '../../common/constants/staff-filters';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from '../roles/roles.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { EstablishmentsService } from '../establishments/establishments.service';
import { isLspdEstablishment } from '../patients/utils/patient-establishment.util';
import { AvatarStorageService } from './avatar-storage.service';
import { MAX_CHARACTERS_PER_ACCOUNT } from './constants/characters.constants';
import { CreateCharacterDto } from './dto/create-character.dto';
import {
  ICharacterResponseDto,
  toCharacterResponseDto,
} from './dto/character-response.dto';
import { ListCharactersDirectoryDto } from './dto/list-characters-directory.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { UpdateMyCharacterDto } from './dto/update-my-character.dto';

const characterInclude = {
  rank: true,
  roles: {
    include: { role: true },
  },
  occupations: {
    where: { isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    include: {
      establishment: {
        select: { id: true, slug: true, name: true, logoUrl: true },
      },
    },
  },
  staffProfile: {
    include: {
      rank: true,
      department: true,
      decorations: {
        include: { decoration: true },
        orderBy: { awardedAt: 'desc' },
      },
      licenses: {
        include: { license: true },
        orderBy: { assignedAt: 'desc' },
      },
      departmentMemberships: {
        where: { isActive: true },
        include: { department: true },
        orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
      },
    },
  },
} satisfies Prisma.CharacterInclude;

@Injectable()
export class CharactersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly rolesService: RolesService,
    private readonly avatarStorageService: AvatarStorageService,
    private readonly auditService: AuditService,
    private readonly establishmentsService: EstablishmentsService,
  ) {}

  listWorkplaces() {
    return this.establishmentsService.listSelectableCatalog();
  }

  async findByAccountId(accountId: string): Promise<ICharacterResponseDto[]> {
    const characters = await this.prismaService.character.findMany({
      where: { accountId },
      include: characterInclude,
      orderBy: { createdAt: 'asc' },
    });

    return characters.map((character) => toCharacterResponseDto(character));
  }

  async findDirectory(dto: ListCharactersDirectoryDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const sortField = dto.sort ?? 'lastName';
    const order = dto.order === 'desc' ? 'desc' : 'asc';
    const term = dto.q?.trim() ?? '';

    const where: Prisma.CharacterWhereInput = {
      ...excludeSystemAdministratorCharacter,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (term.length >= 1) {
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CharacterOrderByWithRelationInput[] =
      sortField === 'firstName'
        ? [{ firstName: order }, { lastName: order }]
        : sortField === 'createdAt'
          ? [{ createdAt: order }]
          : sortField === 'status'
            ? [{ status: order }, { lastName: 'asc' }]
            : sortField === 'birthDate'
              ? [{ birthDate: order }, { lastName: 'asc' }]
              : [{ lastName: order }, { firstName: order }];

    const [total, characters] = await this.prismaService.$transaction([
      this.prismaService.character.count({ where }),
      this.prismaService.character.findMany({
        where,
        include: characterInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: characters.map((character) => toCharacterResponseDto(character)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getByIdAdmin(characterId: string): Promise<ICharacterResponseDto> {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      include: characterInclude,
    });

    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    return toCharacterResponseDto(character);
  }

  async searchAll(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    const characters = await this.prismaService.character.findMany({
      where: {
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 25,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        roles: { include: { role: true } },
        staffProfile: true,
        occupations: {
          where: { isActive: true, isPrimary: true },
          take: 1,
        },
      },
    });

    return characters.map((character) => ({
      id: character.id,
      firstName: character.firstName,
      lastName: character.lastName,
      status: character.status,
      avatarUrl: character.avatarUrl,
      roles: character.roles.map((item) => item.role.slug),
      organization: character.occupations[0]?.organization ?? null,
      hasStaffProfile: Boolean(character.staffProfile),
    }));
  }

  async findByIdForAccount(characterId: string, accountId: string) {
    const character = await this.prismaService.character.findFirst({
      where: { id: characterId, accountId },
      include: characterInclude,
    });

    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    return character;
  }

  async getByIdForAccount(characterId: string, accountId: string): Promise<ICharacterResponseDto> {
    const character = await this.findByIdForAccount(characterId, accountId);
    return toCharacterResponseDto(character);
  }

  async create(accountId: string, dto: CreateCharacterDto): Promise<ICharacterResponseDto> {
    const characterCount = await this.prismaService.character.count({
      where: { accountId },
    });

    if (characterCount >= MAX_CHARACTERS_PER_ACCOUNT) {
      throw new BadRequestException(
        `Each account may have at most ${MAX_CHARACTERS_PER_ACCOUNT} characters`,
      );
    }

    if (isSaedOrganization(dto.organization)) {
      throw new BadRequestException(
        'SAED cannot be selected during character creation. Characters join SAED only when promoted to officer.',
      );
    }

    const workplace = await this.establishmentsService.findSelectableByOrganization(
      dto.organization,
    );
    if (!workplace) {
      throw new BadRequestException(
        'Invalid organization. Select an establishment from the catalog.',
      );
    }

    const citizenRole = await this.rolesService.findBySlug('citizen');
    const defaultRank = await this.prismaService.rank.findUnique({
      where: { slug: 'civilian' },
    });

    const characterId = randomUUID();
    const position = dto.position?.trim() || workplace.defaultPosition;

    const character = await this.prismaService.character.create({
      data: {
        id: characterId,
        accountId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        birthDate: parseOptionalDate(dto.birthDate),
        sex: dto.sex,
        nationality: dto.nationality?.trim() || null,
        avatarUrl: null,
        status: CharacterStatus.CIVIL,
        rankId: defaultRank?.id ?? null,
        fivemCitizenId: dto.fivemCitizenId?.trim() || null,
        joinedAt: new Date(),
        roles: {
          create: {
            roleId: citizenRole.id,
          },
        },
        occupations: {
          create: {
            type: workplace.occupationType,
            organization: workplace.name,
            establishmentId: workplace.id,
            position,
            isPrimary: true,
            isActive: true,
            startedAt: new Date(),
          },
        },
      },
      include: characterInclude,
    });

    return toCharacterResponseDto(character);
  }

  async update(
    characterId: string,
    accountId: string,
    dto: UpdateCharacterDto,
  ): Promise<ICharacterResponseDto> {
    await this.findByIdForAccount(characterId, accountId);

    if (dto.rankId !== undefined && dto.rankId !== null) {
      await this.assertRankExists(dto.rankId);
    }

    if (dto.status === CharacterStatus.MEDICAL_STAFF || dto.status === CharacterStatus.INTERN) {
      throw new BadRequestException(
        'Characters cannot self-assign INTERN or MEDICAL_STAFF status. Use academy approval or staff promotion.',
      );
    }

    const character = await this.prismaService.character.update({
      where: { id: characterId },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        birthDate: dto.birthDate !== undefined ? parseOptionalDate(dto.birthDate) : undefined,
        sex: dto.sex,
        nationality:
          dto.nationality !== undefined ? dto.nationality.trim() || null : undefined,
        rankId: dto.rankId === undefined ? undefined : dto.rankId,
        fivemCitizenId:
          dto.fivemCitizenId === undefined
            ? undefined
            : dto.fivemCitizenId?.trim() || null,
        status: dto.status,
      },
      include: characterInclude,
    });

    return toCharacterResponseDto(character);
  }

  /**
   * Updates the account's currently active character only (settings / self-service).
   */
  async updateActiveProfile(
    accountId: string,
    activeCharacterId: string | null | undefined,
    dto: UpdateMyCharacterDto,
  ): Promise<ICharacterResponseDto> {
    if (!activeCharacterId) {
      throw new BadRequestException('No active character selected');
    }

    const existing = await this.findByIdForAccount(activeCharacterId, accountId);

    if (dto.organization !== undefined) {
      throw new BadRequestException(
        'Employment changes require an approved request. Use Solicitar cambio de empleo.',
      );
    }

    const character = await this.prismaService.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: existing.id },
        data: {
          firstName: dto.firstName?.trim(),
          lastName: dto.lastName?.trim(),
          birthDate:
            dto.birthDate === undefined
              ? undefined
              : dto.birthDate
                ? parseOptionalDate(dto.birthDate)
                : null,
          sex: dto.sex,
          nationality:
            dto.nationality === undefined
              ? undefined
              : dto.nationality?.trim() || null,
          phone: dto.phone === undefined ? undefined : dto.phone?.trim() || null,
          biography:
            dto.biography === undefined
              ? undefined
              : dto.biography?.trim() || null,
        },
        include: characterInclude,
      });

      return tx.character.findUniqueOrThrow({
        where: { id: existing.id },
        include: characterInclude,
      });
    });

    const changedFields: Record<string, unknown> = {};
    if (dto.firstName !== undefined && dto.firstName.trim() !== existing.firstName) {
      changedFields.firstName = { from: existing.firstName, to: character.firstName };
    }
    if (dto.lastName !== undefined && dto.lastName.trim() !== existing.lastName) {
      changedFields.lastName = { from: existing.lastName, to: character.lastName };
    }
    if (dto.birthDate !== undefined) {
      changedFields.birthDate = {
        from: existing.birthDate,
        to: character.birthDate,
      };
    }
    if (dto.sex !== undefined && dto.sex !== existing.sex) {
      changedFields.sex = { from: existing.sex, to: character.sex };
    }
    if (dto.nationality !== undefined) {
      changedFields.nationality = {
        from: existing.nationality,
        to: character.nationality,
      };
    }
    if (dto.phone !== undefined) {
      changedFields.phone = { from: existing.phone ?? null, to: character.phone };
    }
    if (dto.biography !== undefined) {
      changedFields.biography = {
        from: existing.biography ?? null,
        to: character.biography,
      };
    }

    if (Object.keys(changedFields).length > 0) {
      await this.auditService.create({
        actorAccountId: accountId,
        actorCharacterId: character.id,
        action: 'characters.profile_updated',
        targetType: AUDIT_TARGET.CHARACTER,
        targetId: character.id,
        metadata: JSON.parse(JSON.stringify(changedFields)),
      });
    }

    return toCharacterResponseDto(character);
  }

  /**
   * Applies a civilian workplace change (occupation + linked patient sync).
   * Historical invoices/reports/payments are never rewritten.
   */
  async applyCivilianWorkplaceChange(
    characterId: string,
    establishmentId: string,
    actor: { accountId: string; characterId: string },
    options?: { source?: string; reason?: string | null },
  ) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      include: {
        occupations: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          include: { establishment: { select: { id: true, name: true, slug: true } } },
        },
        linkedPatient: {
          select: { id: true, establishmentId: true, badgeNumber: true },
        },
      },
    });
    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    const belongsToSaed = await this.permissionsService.belongsToSaed(characterId);
    if (belongsToSaed) {
      throw new ForbiddenException(
        'SAED members cannot change civilian employment. Organization is managed by the department.',
      );
    }

    const workplace = await this.prismaService.establishment.findFirst({
      where: {
        id: establishmentId,
        status: EstablishmentStatus.ACTIVE,
        isSelectable: true,
      },
    });
    if (!workplace) {
      throw new BadRequestException(
        'Invalid organization. Select an establishment from the catalog.',
      );
    }
    if (isSaedOrganization(workplace.name)) {
      throw new BadRequestException(
        'SAED cannot be selected as a civilian workplace. It is assigned only through department promotion.',
      );
    }

    const previousOccupation = character.occupations?.[0] ?? null;
    const previousOrganization = previousOccupation?.organization ?? null;
    const previousEstablishmentId = previousOccupation?.establishmentId ?? null;
    const joiningLspd = isLspdEstablishment(workplace);

    await this.prismaService.$transaction(async (tx) => {
      await this.syncCivilianOccupation(tx, characterId, workplace.name);

      if (character.linkedPatient) {
        await tx.patient.update({
          where: { id: character.linkedPatient.id },
          data: {
            establishmentId: workplace.id,
            badgeNumber: joiningLspd ? character.linkedPatient.badgeNumber : null,
          },
        });
      }
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'characters.workplace_changed',
      targetType: AUDIT_TARGET.CHARACTER,
      targetId: characterId,
      metadata: {
        source: options?.source ?? 'employment-change',
        reason: options?.reason ?? null,
        from: previousOrganization,
        to: workplace.name,
        fromEstablishmentId: previousEstablishmentId,
        toEstablishmentId: workplace.id,
        linkedPatientSynced: Boolean(character.linkedPatient),
        badgeCleared: Boolean(character.linkedPatient?.badgeNumber) && !joiningLspd,
      },
    });

    return this.prismaService.character.findUniqueOrThrow({
      where: { id: characterId },
      include: characterInclude,
    }).then(toCharacterResponseDto);
  }

  async uploadAvatar(
    characterId: string,
    accountId: string,
    file: Express.Multer.File | undefined,
  ): Promise<ICharacterResponseDto> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    await this.findByIdForAccount(characterId, accountId);
    const avatarUrl = this.avatarStorageService.saveAvatar(file, characterId);

    const character = await this.prismaService.character.update({
      where: { id: characterId },
      data: { avatarUrl },
      include: characterInclude,
    });

    await this.auditService.create({
      actorAccountId: accountId,
      actorCharacterId: characterId,
      action: 'characters.avatar_updated',
      targetType: AUDIT_TARGET.CHARACTER,
      targetId: characterId,
      metadata: { avatarUrl },
    });

    return toCharacterResponseDto(character);
  }

  private async syncCivilianOccupation(
    tx: Prisma.TransactionClient,
    characterId: string,
    organizationName: string | null,
  ) {
    const now = new Date();
    await tx.occupation.updateMany({
      where: {
        characterId,
        isActive: true,
        organization: { not: SAED_ORGANIZATION },
      },
      data: {
        isActive: false,
        isPrimary: false,
        endedAt: now,
      },
    });

    if (!organizationName) {
      return;
    }

    const workplace = await this.establishmentsService.findSelectableByOrganization(
      organizationName,
    );
    if (!workplace) {
      return;
    }

    await tx.occupation.create({
      data: {
        characterId,
        type: workplace.occupationType,
        organization: workplace.name,
        establishmentId: workplace.id,
        position: workplace.defaultPosition,
        isPrimary: true,
        isActive: true,
        startedAt: now,
      },
    });
  }

  async getActivePermissions(accountId: string, activeCharacterId: string | null) {
    if (!activeCharacterId) {
      return {
        characterId: null,
        roles: [] as string[],
        permissions: [] as string[],
      };
    }

    await this.findByIdForAccount(activeCharacterId, accountId);

    const [roles, permissions] = await Promise.all([
      this.permissionsService.getRoleSlugsForCharacter(activeCharacterId),
      this.permissionsService.getPermissionKeysForCharacter(activeCharacterId),
    ]);

    return {
      characterId: activeCharacterId,
      roles,
      permissions,
    };
  }

  async buildAuthContext(characterId: string, accountId: string) {
    const character = await this.findByIdForAccount(characterId, accountId);

    if (character.accountId !== accountId) {
      throw new ForbiddenException('Character does not belong to this account');
    }

    const [roles, permissions] = await Promise.all([
      this.permissionsService.getRoleSlugsForCharacter(character.id),
      this.permissionsService.getPermissionKeysForCharacter(character.id),
    ]);

    return {
      ...toCharacterResponseDto(character, roles),
      permissions,
    };
  }

  private async assertRankExists(rankId: string | null) {
    if (!rankId) {
      return;
    }

    const rank = await this.prismaService.rank.findFirst({
      where: { id: rankId, isActive: true },
    });

    if (!rank) {
      throw new BadRequestException('Rank was not found or is inactive');
    }
  }
}

function parseOptionalDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid date value');
  }

  return date;
}

