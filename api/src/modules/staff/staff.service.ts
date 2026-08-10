import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SAED_ORGANIZATION } from '../../common/constants/workplaces';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { RolesService } from '../roles/roles.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffIdentityDto } from './dto/update-staff-identity.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import {
  DepartmentMembershipRole,
  CharacterStatus,
  OccupationType,
  StaffStatus,
  Prisma,
} from '@prisma/client';

const SYSTEM_ADMIN_ROLE_SLUG = 'administrator';
const SYSTEM_ROLE_ASSIGN_PERMISSIONS = ['roles.assign', 'accounts.manage'] as const;

const officerInclude = {
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      avatarUrl: true,
      accountId: true,
    },
  },
  rank: true,
  department: true,
  departmentMemberships: {
    where: { isActive: true },
    include: { department: true },
    orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
  },
} satisfies Prisma.StaffProfileInclude;

const officerDetailInclude = {
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      avatarUrl: true,
      accountId: true,
      nationality: true,
      birthDate: true,
      sex: true,
      joinedAt: true,
    },
  },
  rank: true,
  department: true,
  departmentMemberships: {
    where: { isActive: true },
    include: { department: true },
    orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
  },
  decorations: {
    include: { decoration: true },
    orderBy: { awardedAt: 'desc' },
  },
  licenses: {
    include: { license: true },
    orderBy: { assignedAt: 'desc' },
  },
} satisfies Prisma.StaffProfileInclude;

@Injectable()
export class StaffService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prismaService.staffProfile.findMany({
      include: officerInclude,
      orderBy: { employeeNumber: 'asc' },
    });
  }

  /**
   * Public landing roster: active SAED members only (no PII beyond display fields).
   * Includes Directiva (system administrator rank) as part of the institutional roster.
   */
  listPublicPersonnel(limit = 24) {
    return this.prismaService.staffProfile.findMany({
      where: {
        status: StaffStatus.ACTIVE,
        character: {
          status: {
            in: [
              CharacterStatus.MEDICAL_STAFF,
              CharacterStatus.INTERN,
            ],
          },
        },
      },
      take: Math.min(Math.max(limit, 1), 60),
      orderBy: [
        { rank: { sortOrder: 'desc' } },
        { employeeNumber: 'asc' },
      ],
      select: {
        id: true,
        employeeNumber: true,
        callsign: true,
        character: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            occupations: {
              where: { isActive: true, isPrimary: true },
              take: 1,
              select: { position: true, organization: true },
            },
          },
        },
        rank: { select: { name: true, sortOrder: true } },
        department: { select: { name: true } },
        departmentMemberships: {
          where: { isActive: true },
          select: {
            role: true,
            isPrimary: true,
            department: { select: { name: true } },
          },
        },
        supervisedDepartments: {
          take: 1,
          select: {
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id },
      include: officerDetailInclude,
    });

    if (!officer) {
      throw new NotFoundException('Officer profile was not found');
    }

    return officer;
  }

  /**
   * Operational directory lookup — Directiva profiles are part of the roster.
   */
  async findOperationalById(
    id: string,
    _viewer: { characterId?: string | null; permissions?: string[] },
  ) {
    return this.findById(id);
  }

  private async isSystemAdministratorProfile(characterId: string): Promise<boolean> {
    const row = await this.prismaService.characterRole.findFirst({
      where: {
        characterId,
        role: { slug: SYSTEM_ADMIN_ROLE_SLUG },
      },
      select: { characterId: true },
    });
    return Boolean(row);
  }

  private assertCanAssignSystemRole(roleSlug: string, permissions: string[]) {
    if (roleSlug !== SYSTEM_ADMIN_ROLE_SLUG) {
      return;
    }
    if (!hasAnyPermission(permissions, [...SYSTEM_ROLE_ASSIGN_PERMISSIONS])) {
      throw new ForbiddenException(
        'Only system administrators can assign the Administrator role',
      );
    }
  }

  async searchCandidates(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    return this.prismaService.character.findMany({
      where: {
        staffProfile: null,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        avatarUrl: true,
        occupations: {
          where: { isActive: true, isPrimary: true },
          take: 1,
          select: { organization: true, position: true },
        },
      },
    });
  }

  async create(
    dto: CreateStaffDto,
    actor: { accountId: string; characterId?: string | null; permissions?: string[] },
  ) {
    const character = await this.prismaService.character.findUnique({
      where: { id: dto.characterId },
      include: { staffProfile: true },
    });

    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    if (character.staffProfile) {
      throw new ConflictException('Character already has a medical staff profile');
    }

    await this.assertRankExists(dto.rankId);
    if (dto.departmentId) {
      await this.assertDepartmentExists(dto.departmentId);
    }

    const employeeNumber = dto.employeeNumber.trim();
    const existingBadge = await this.prismaService.staffProfile.findUnique({
      where: { employeeNumber },
    });
    if (existingBadge) {
      throw new ConflictException('Badge number is already in use');
    }

    const roleSlug = dto.roleSlug?.trim() || 'doctor';
    this.assertCanAssignSystemRole(roleSlug, actor.permissions ?? []);
    const role = await this.rolesService.findBySlug(roleSlug);
    const rank = await this.prismaService.rank.findUnique({ where: { id: dto.rankId } });
    const joinedAt = dto.joinedAt ? new Date(dto.joinedAt) : new Date();
    if (Number.isNaN(joinedAt.getTime())) {
      throw new BadRequestException('Invalid joinedAt date');
    }

    const officer = await this.prismaService.$transaction(async (tx) => {
      const profile = await tx.staffProfile.create({
        data: {
          characterId: character.id,
          employeeNumber,
          rankId: dto.rankId,
          departmentId: dto.departmentId ?? null,
          callsign: dto.callsign?.trim() || null,
          status: StaffStatus.ACTIVE,
          joinedAt,
        },
      });

      if (dto.departmentId) {
        await tx.staffDepartment.create({
          data: {
            staffProfileId: profile.id,
            departmentId: dto.departmentId,
            role: DepartmentMembershipRole.MEMBER,
            isPrimary: true,
            isActive: true,
          },
        });
      }

      await tx.character.update({
        where: { id: character.id },
        data: {
          status: CharacterStatus.MEDICAL_STAFF,
          rankId: dto.rankId,
        },
      });

      await tx.occupation.updateMany({
        where: { characterId: character.id, isActive: true },
        data: {
          isActive: false,
          isPrimary: false,
          endedAt: joinedAt,
        },
      });

      await tx.occupation.create({
        data: {
          characterId: character.id,
          type: OccupationType.DEPARTMENT,
          organization: SAED_ORGANIZATION,
          position: rank?.name ?? 'Médico',
          isPrimary: true,
          isActive: true,
          startedAt: joinedAt,
        },
      });

      await tx.characterRole.upsert({
        where: {
          characterId_roleId: {
            characterId: character.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          characterId: character.id,
          roleId: role.id,
        },
      });

      return tx.staffProfile.findUniqueOrThrow({
        where: { id: profile.id },
        include: officerInclude,
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'staff.promote',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: officer.id,
      metadata: {
        event: 'joined',
        characterId: character.id,
        characterName: `${character.firstName} ${character.lastName}`,
        employeeNumber,
        rankId: dto.rankId,
        rankName: officer.rank?.name ?? rank?.name ?? null,
        departmentId: dto.departmentId ?? null,
        departmentName: officer.department?.name ?? null,
        roleSlug,
        joinedAt: joinedAt.toISOString().slice(0, 10),
      },
    });

    return officer;
  }

  async update(
    id: string,
    dto: UpdateStaffDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.findById(id);

    if (dto.rankId) {
      await this.assertRankExists(dto.rankId);
    }

    if (dto.departmentId) {
      await this.assertDepartmentExists(dto.departmentId);
    }

    const previous = {
      rankId: existing.rankId,
      rankName: existing.rank?.name ?? null,
      departmentId: existing.departmentId,
      departmentName: existing.department?.name ?? null,
      status: existing.status,
    };

    const officer = await this.prismaService.$transaction(async (tx) => {
      const updated = await tx.staffProfile.update({
        where: { id },
        data: {
          rankId: dto.rankId,
          departmentId: dto.departmentId === undefined ? undefined : dto.departmentId,
          status: dto.status,
        },
        include: officerInclude,
      });

      if (dto.departmentId !== undefined) {
        if (dto.departmentId === null) {
          await tx.staffDepartment.updateMany({
            where: { staffProfileId: id, isPrimary: true },
            data: { isPrimary: false },
          });
        } else {
          await tx.staffDepartment.updateMany({
            where: { staffProfileId: id, isPrimary: true, NOT: { departmentId: dto.departmentId } },
            data: { isPrimary: false },
          });
          await tx.staffDepartment.upsert({
            where: {
              staffProfileId_departmentId: {
                staffProfileId: id,
                departmentId: dto.departmentId,
              },
            },
            update: { isPrimary: true, isActive: true },
            create: {
              staffProfileId: id,
              departmentId: dto.departmentId,
              role: DepartmentMembershipRole.MEMBER,
              isPrimary: true,
              isActive: true,
            },
          });
        }
        await this.ensureSinglePrimaryDepartment(tx, id);
      }

      const characterData: Prisma.CharacterUpdateInput = {};
      if (dto.rankId) {
        characterData.rank = { connect: { id: dto.rankId } };
      }
      if (dto.status === StaffStatus.RETIRED) {
        characterData.status = CharacterStatus.RETIRED;
      } else if (dto.status === StaffStatus.SUSPENDED) {
        characterData.status = CharacterStatus.SUSPENDED;
      } else if (dto.status === StaffStatus.ACTIVE || dto.status === StaffStatus.INACTIVE) {
        characterData.status = CharacterStatus.MEDICAL_STAFF;
      }

      if (Object.keys(characterData).length) {
        await tx.character.update({
          where: { id: existing.characterId },
          data: characterData,
        });
      }

      if (dto.rankId && updated.rank) {
        await tx.occupation.updateMany({
          where: {
            characterId: existing.characterId,
            isActive: true,
            organization: SAED_ORGANIZATION,
          },
          data: {
            position: updated.rank.name,
          },
        });
      }

      return tx.staffProfile.findUniqueOrThrow({
        where: { id },
        include: officerDetailInclude,
      });
    });

    const actorPayload = {
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      targetType: AUDIT_TARGET.OFFICER,
      targetId: officer.id,
    };

    if (dto.rankId && dto.rankId !== previous.rankId) {
      const fromName = previous.rankName;
      const toName = officer.rank?.name ?? null;
      const fromOrder = existing.rank?.sortOrder ?? 0;
      const toOrder = officer.rank?.sortOrder ?? 0;
      await this.auditService.create({
        ...actorPayload,
        action:
          toOrder > fromOrder ? 'staff.rank_promoted' : 'staff.rank_demoted',
        metadata: {
          fromRankId: previous.rankId,
          fromRankName: fromName,
          toRankId: officer.rankId,
          toRankName: toName,
        },
      });
    }

    if (dto.departmentId !== undefined && dto.departmentId !== previous.departmentId) {
      const officerName =
        `${existing.character.firstName} ${existing.character.lastName}`.trim();
      await this.auditService.create({
        ...actorPayload,
        action: 'staff.department_changed',
        metadata: {
          officerName,
          fromDepartmentId: previous.departmentId,
          fromDepartmentName: previous.departmentName,
          toDepartmentId: officer.departmentId,
          toDepartmentName: officer.department?.name ?? null,
          message: dto.departmentId
            ? `Se asignó ${officer.department?.name ?? 'departamento'} al personal ${officerName}`
            : `Se removió el departamento primario del personal ${officerName}`,
        },
      });
    }

    if (dto.status && dto.status !== previous.status) {
      await this.auditService.create({
        ...actorPayload,
        action: 'staff.status_changed',
        metadata: {
          fromStatus: previous.status,
          toStatus: officer.status,
        },
      });
    }

    return officer;
  }

  async assignDepartment(
    staffProfileId: string,
    input: {
      departmentId: string;
      role?: DepartmentMembershipRole;
      isPrimary?: boolean;
      notes?: string;
    },
    actor: { accountId: string; characterId?: string | null },
  ) {
    const officer = await this.findById(staffProfileId);
    await this.assertDepartmentExists(input.departmentId);
    const role = input.role ?? DepartmentMembershipRole.MEMBER;
    const officerName =
      `${officer.character.firstName} ${officer.character.lastName}`.trim();

    const membership = await this.prismaService.$transaction(async (tx) => {
      const activeMemberships = await tx.staffDepartment.findMany({
        where: { staffProfileId, isActive: true },
        select: { id: true, departmentId: true, isPrimary: true },
      });
      const hasPrimary = activeMemberships.some((row) => row.isPrimary);
      const isExisting = activeMemberships.some(
        (row) => row.departmentId === input.departmentId,
      );
      const makePrimary =
        Boolean(input.isPrimary) || (!hasPrimary && !isExisting) || activeMemberships.length === 0;

      if (makePrimary) {
        await tx.staffDepartment.updateMany({
          where: { staffProfileId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const row = await tx.staffDepartment.upsert({
        where: {
          staffProfileId_departmentId: {
            staffProfileId,
            departmentId: input.departmentId,
          },
        },
        update: {
          role,
          isActive: true,
          isPrimary: makePrimary ? true : input.isPrimary === false ? false : undefined,
          notes: input.notes?.trim() || null,
        },
        create: {
          staffProfileId,
          departmentId: input.departmentId,
          role,
          isPrimary: makePrimary,
          isActive: true,
          notes: input.notes?.trim() || null,
        },
        include: { department: true },
      });

      if (role === DepartmentMembershipRole.SUPERVISOR) {
        await tx.departmentSupervisor.upsert({
          where: {
            departmentId_staffProfileId: {
              departmentId: input.departmentId,
              staffProfileId,
            },
          },
          update: {},
          create: { departmentId: input.departmentId, staffProfileId },
        });
      }

      await this.ensureSinglePrimaryDepartment(tx, staffProfileId);
      return tx.staffDepartment.findUniqueOrThrow({
        where: { id: row.id },
        include: { department: true },
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'staff.department_assigned',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: staffProfileId,
      metadata: {
        officerName,
        departmentId: membership.departmentId,
        departmentName: membership.department.name,
        role: membership.role,
        isPrimary: membership.isPrimary,
        message: membership.isPrimary
          ? `Se asignó ${membership.department.name} como departamento principal al personal ${officerName}`
          : `Se asignó ${membership.department.name} como departamento alterno al personal ${officerName}`,
      },
    });

    return membership;
  }

  async removeDepartment(
    staffDepartmentId: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.prismaService.staffDepartment.findUnique({
      where: { id: staffDepartmentId },
      include: {
        department: true,
        staffProfile: {
          include: {
            character: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Officer department membership was not found');
    }

    const officerName =
      `${existing.staffProfile.character.firstName} ${existing.staffProfile.character.lastName}`.trim();

    await this.prismaService.$transaction(async (tx) => {
      await tx.staffDepartment.delete({ where: { id: staffDepartmentId } });
      await tx.departmentSupervisor.deleteMany({
        where: {
          staffProfileId: existing.staffProfileId,
          departmentId: existing.departmentId,
        },
      });
      await this.ensureSinglePrimaryDepartment(tx, existing.staffProfileId);
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'staff.department_removed',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: existing.staffProfileId,
      metadata: {
        officerName,
        departmentId: existing.departmentId,
        departmentName: existing.department.name,
        role: existing.role,
        wasPrimary: existing.isPrimary,
        message: `Se removió ${existing.department.name} del personal ${officerName}`,
      },
    });

    return { deleted: true, id: staffDepartmentId };
  }

  /**
   * Exactly one active primary membership when the officer has any departments.
   * Syncs StaffProfile.departmentId to the primary.
   */
  private async ensureSinglePrimaryDepartment(
    tx: Prisma.TransactionClient,
    staffProfileId: string,
  ) {
    const active = await tx.staffDepartment.findMany({
      where: { staffProfileId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
    });

    if (!active.length) {
      await tx.staffProfile.update({
        where: { id: staffProfileId },
        data: { departmentId: null },
      });
      return;
    }

    const primaries = active.filter((row) => row.isPrimary);
    let primary = primaries[0] ?? null;

    if (primaries.length > 1) {
      for (const extra of primaries.slice(1)) {
        await tx.staffDepartment.update({
          where: { id: extra.id },
          data: { isPrimary: false },
        });
      }
    }

    if (!primary) {
      primary = active[0];
      await tx.staffDepartment.update({
        where: { id: primary.id },
        data: { isPrimary: true },
      });
    }

    await tx.staffProfile.update({
      where: { id: staffProfileId },
      data: { departmentId: primary.departmentId },
    });
  }

  async updateIdentity(
    id: string,
    dto: UpdateStaffIdentityDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    if (dto.employeeNumber === undefined && dto.callsign === undefined) {
      throw new BadRequestException('Provide employeeNumber and/or callsign to update');
    }

    const existing = await this.findById(id);
    const officerName =
      `${existing.character.firstName} ${existing.character.lastName}`.trim();

    if (dto.employeeNumber && dto.employeeNumber.trim() !== existing.employeeNumber) {
      const badgeOwner = await this.prismaService.staffProfile.findUnique({
        where: { employeeNumber: dto.employeeNumber.trim() },
      });
      if (badgeOwner && badgeOwner.id !== id) {
        throw new ConflictException('Badge number is already in use');
      }
    }

    const previous = {
      employeeNumber: existing.employeeNumber,
      callsign: existing.callsign,
    };

    const officer = await this.prismaService.staffProfile.update({
      where: { id },
      data: {
        employeeNumber: dto.employeeNumber?.trim(),
        callsign:
          dto.callsign === undefined ? undefined : dto.callsign?.trim() || null,
      },
      include: officerInclude,
    });

    const actorPayload = {
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      targetType: AUDIT_TARGET.OFFICER,
      targetId: officer.id,
    };

    if (dto.employeeNumber && dto.employeeNumber.trim() !== previous.employeeNumber) {
      await this.auditService.create({
        ...actorPayload,
        action: 'staff.badge_changed',
        metadata: {
          officerName,
          fromEmployeeNumber: previous.employeeNumber,
          toEmployeeNumber: officer.employeeNumber,
          message: `Se modificó el nº de empleado del personal ${officerName}`,
        },
      });
    }

    if (
      dto.callsign !== undefined &&
      (dto.callsign?.trim() || null) !== previous.callsign
    ) {
      await this.auditService.create({
        ...actorPayload,
        action: 'staff.callsign_changed',
        metadata: {
          officerName,
          fromCallsign: previous.callsign,
          toCallsign: officer.callsign,
          message: `Se modificó el indicativo del personal ${officerName}`,
        },
      });
    }

    return officer;
  }

  async retire(
    id: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.findById(id);

    const officer = await this.prismaService.$transaction(async (tx) => {
      const updated = await tx.staffProfile.update({
        where: { id },
        data: { status: StaffStatus.RETIRED },
        include: officerInclude,
      });

      await tx.character.update({
        where: { id: existing.characterId },
        data: { status: CharacterStatus.RETIRED },
      });

      return updated;
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'staff.retire',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: officer.id,
      metadata: {
        characterId: existing.characterId,
        employeeNumber: existing.employeeNumber,
        fromStatus: existing.status,
        toStatus: StaffStatus.RETIRED,
      },
    });

    return officer;
  }

  private async assertRankExists(rankId: string) {
    const rank = await this.prismaService.rank.findFirst({
      where: { id: rankId, isActive: true },
    });
    if (!rank) {
      throw new BadRequestException('Rank was not found or is inactive');
    }
  }

  private async assertDepartmentExists(departmentId: string) {
    const department = await this.prismaService.department.findFirst({
      where: { id: departmentId, isActive: true },
    });
    if (!department) {
      throw new BadRequestException('Department was not found or is inactive');
    }
  }
}
