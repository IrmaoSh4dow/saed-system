import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DepartmentMembershipRole,
  DepartmentOpeningStatus,
  InterestLetterStatus,
  NotificationType,
  StaffStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { excludeSystemAdministrator } from '../../common/constants/staff-filters';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import {
  CreateInterestLetterDto,
  CreateOpeningDto,
  ReviewInterestLetterDto,
  UpdateOpeningDto,
} from './dto/department-recruitment.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

const officerCardSelect = {
  id: true,
  employeeNumber: true,
  status: true,
  callsign: true,
  departmentId: true,
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      accountId: true,
      status: true,
    },
  },
  rank: { select: { id: true, name: true, slug: true, sortOrder: true } },
  department: { select: { id: true, name: true } },
} as const;

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly mediaStorageService: MediaStorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll() {
    return this.prismaService.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            staffProfiles: true,
            supervisors: true,
          },
        },
        openings: {
          where: { status: DepartmentOpeningStatus.OPEN },
          select: { id: true, title: true, status: true },
          take: 1,
        },
      },
    });
  }

  findAllAdmin() {
    return this.prismaService.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            staffProfiles: true,
            supervisors: true,
          },
        },
      },
    });
  }

  async findById(id: string, viewerCharacterId?: string | null, viewerPermissions: string[] = []) {
    const department = await this.prismaService.department.findUnique({
      where: { id },
      include: {
        supervisors: {
          include: { staffProfile: { select: officerCardSelect } },
          orderBy: { assignedAt: 'asc' },
        },
        memberships: {
          where: {
            isActive: true,
            staffProfile: excludeSystemAdministrator,
          },
          include: {
            staffProfile: {
              include: {
                character: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    status: true,
                  },
                },
                rank: { select: { id: true, name: true, sortOrder: true } },
              },
            },
          },
          orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
        },
        staffProfiles: {
          where: excludeSystemAdministrator,
          include: {
            character: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                status: true,
              },
            },
            rank: { select: { id: true, name: true, sortOrder: true } },
          },
          orderBy: { employeeNumber: 'asc' },
        },
        openings: {
          include: {
            minRank: { select: { id: true, name: true, sortOrder: true } },
            _count: { select: { interestLetters: true } },
          },
          orderBy: { openedAt: 'desc' },
        },
        _count: {
          select: { staffProfiles: true, supervisors: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department was not found');
    }

    let canManage = hasAdminDepartmentPower(viewerPermissions);
    let myPendingLetterId: string | null = null;

    if (viewerCharacterId) {
      if (!canManage) {
        canManage = await this.canManageDepartment(department.id, viewerCharacterId);
      }
      const officer = await this.getOfficerByCharacter(viewerCharacterId);
      if (officer) {
        const pending = await this.prismaService.interestLetter.findFirst({
          where: {
            departmentId: department.id,
            staffProfileId: officer.id,
            status: InterestLetterStatus.PENDING,
          },
          select: { id: true },
        });
        myPendingLetterId = pending?.id ?? null;
      }
    }

    return {
      ...department,
      officers: department.memberships.map((item) => ({
        ...item.staffProfile,
        membershipRole: item.role,
        isPrimaryMembership: item.isPrimary,
        staffDepartmentId: item.id,
      })),
      viewer: {
        canManage,
        myPendingLetterId,
      },
    };
  }

  async create(
    dto: CreateDepartmentDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const slug = (dto.slug ?? slugify(dto.name)).toLowerCase();
    const existing = await this.prismaService.department.findFirst({
      where: { OR: [{ slug }, { name: dto.name.trim() }] },
    });
    if (existing) {
      throw new ConflictException('Department name or slug already exists');
    }

    const departmentId = randomUUID();
    const imageUrl = await this.mediaStorageService.resolveImageUrl(
      dto.imageUrl,
      'departments',
      departmentId,
    );

    const department = await this.prismaService.department.create({
      data: {
        id: departmentId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        imageUrl,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'departments.create',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: department.id,
      metadata: { name: department.name, slug: department.slug },
    });

    return department;
  }

  async update(
    id: string,
    dto: UpdateDepartmentDto,
    actor: { accountId: string; characterId?: string | null },
  ) {
    await this.requireDepartment(id);

    const imageUrl =
      dto.imageUrl === undefined
        ? undefined
        : await this.mediaStorageService.resolveImageUrl(dto.imageUrl, 'departments', id);

    const department = await this.prismaService.department.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description:
          dto.description === undefined ? undefined : dto.description.trim() || null,
        imageUrl: imageUrl === undefined ? undefined : imageUrl,
        isActive: dto.isActive,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'departments.update',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: department.id,
      metadata: { ...dto, imageUrl: imageUrl ?? undefined },
    });

    return department;
  }

  async addSupervisor(
    departmentId: string,
    staffProfileId: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    await this.requireDepartment(departmentId);
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      include: { character: { select: { firstName: true, lastName: true } } },
    });
    if (!officer || officer.status === StaffStatus.RETIRED) {
      throw new NotFoundException('Officer profile was not found');
    }

    try {
      const row = await this.prismaService.departmentSupervisor.create({
        data: { departmentId, staffProfileId },
        include: { staffProfile: { select: officerCardSelect } },
      });

      await this.prismaService.staffDepartment.upsert({
        where: {
          staffProfileId_departmentId: { staffProfileId, departmentId },
        },
        update: {
          role: DepartmentMembershipRole.SUPERVISOR,
          isActive: true,
        },
        create: {
          staffProfileId,
          departmentId,
          role: DepartmentMembershipRole.SUPERVISOR,
          isPrimary: false,
          isActive: true,
        },
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId ?? null,
        action: 'departments.supervisor_added',
        targetType: AUDIT_TARGET.DIVISION,
        targetId: departmentId,
        metadata: {
          staffProfileId,
          officerName: `${officer.character.firstName} ${officer.character.lastName}`,
          employeeNumber: officer.employeeNumber,
        },
      });

      return row;
    } catch {
      throw new ConflictException('Officer is already a supervisor of this department');
    }
  }

  async removeSupervisor(
    departmentId: string,
    staffProfileId: string,
    actor: { accountId: string; characterId?: string | null },
  ) {
    const existing = await this.prismaService.departmentSupervisor.findUnique({
      where: {
        departmentId_staffProfileId: { departmentId, staffProfileId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Supervisor assignment was not found');
    }

    await this.prismaService.departmentSupervisor.delete({
      where: { id: existing.id },
    });

    const membership = await this.prismaService.staffDepartment.findUnique({
      where: {
        staffProfileId_departmentId: { staffProfileId, departmentId },
      },
    });
    if (membership?.role === DepartmentMembershipRole.SUPERVISOR) {
      await this.prismaService.staffDepartment.update({
        where: { id: membership.id },
        data: { role: DepartmentMembershipRole.MEMBER },
      });
    }

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId ?? null,
      action: 'departments.supervisor_removed',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: departmentId,
      metadata: { staffProfileId },
    });

    return { deleted: true };
  }

  async createOpening(
    departmentId: string,
    dto: CreateOpeningDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    await this.assertCanManageDepartment(departmentId, actor.characterId, permissions);
    await this.requireDepartment(departmentId);

    const openExisting = await this.prismaService.departmentOpening.findFirst({
      where: { departmentId, status: DepartmentOpeningStatus.OPEN },
    });
    if (openExisting) {
      throw new ConflictException('This department already has an open recruitment');
    }

    if (dto.minRankId) {
      const rank = await this.prismaService.rank.findFirst({
        where: { id: dto.minRankId, isActive: true },
      });
      if (!rank) {
        throw new BadRequestException('Minimum rank was not found');
      }
    }

    const opening = await this.prismaService.departmentOpening.create({
      data: {
        departmentId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        minRankId: dto.minRankId ?? null,
        status: DepartmentOpeningStatus.OPEN,
        createdByCharacterId: actor.characterId,
      },
      include: {
        department: true,
        minRank: true,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'departments.opening_created',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: departmentId,
      metadata: {
        openingId: opening.id,
        title: opening.title,
        minRankId: opening.minRankId,
      },
    });

    const officers = await this.prismaService.staffProfile.findMany({
      where: { status: StaffStatus.ACTIVE },
      select: {
        character: { select: { id: true, accountId: true } },
      },
    });

    await this.notificationsService.createMany(
      officers.map((item) => ({
        accountId: item.character.accountId,
        characterId: item.character.id,
        type: NotificationType.DEPARTMENT_OPENING,
        title: `Convocatoria: ${opening.department.name}`,
        body: opening.title,
        href: `/departments?id=${departmentId}`,
        metadata: { openingId: opening.id, departmentId },
      })),
    );

    return opening;
  }

  async updateOpening(
    openingId: string,
    dto: UpdateOpeningDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const opening = await this.prismaService.departmentOpening.findUnique({
      where: { id: openingId },
    });
    if (!opening) {
      throw new NotFoundException('Opening was not found');
    }

    await this.assertCanManageDepartment(opening.departmentId, actor.characterId, permissions);

    if (dto.status === DepartmentOpeningStatus.OPEN && opening.status !== DepartmentOpeningStatus.OPEN) {
      const otherOpen = await this.prismaService.departmentOpening.findFirst({
        where: {
          departmentId: opening.departmentId,
          status: DepartmentOpeningStatus.OPEN,
          NOT: { id: openingId },
        },
      });
      if (otherOpen) {
        throw new ConflictException('This department already has an open recruitment');
      }
    }

    const updated = await this.prismaService.departmentOpening.update({
      where: { id: openingId },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        minRankId: dto.minRankId === undefined ? undefined : dto.minRankId,
        status: dto.status as DepartmentOpeningStatus | undefined,
        closedAt:
          dto.status === DepartmentOpeningStatus.CLOSED ||
          dto.status === DepartmentOpeningStatus.COMPLETED
            ? new Date()
            : dto.status === DepartmentOpeningStatus.OPEN
              ? null
              : undefined,
      },
      include: { department: true, minRank: true },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action:
        dto.status && dto.status !== opening.status
          ? `departments.opening_${String(dto.status).toLowerCase()}`
          : 'departments.opening_updated',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: opening.departmentId,
      metadata: { openingId, ...dto },
    });

    return updated;
  }

  async createInterestLetter(
    openingId: string,
    dto: CreateInterestLetterDto,
    actor: { accountId: string; characterId: string },
  ) {
    const opening = await this.prismaService.departmentOpening.findUnique({
      where: { id: openingId },
      include: { department: true, minRank: true },
    });
    if (!opening || opening.status !== DepartmentOpeningStatus.OPEN) {
      throw new BadRequestException('There is no open recruitment for this opening');
    }

    const officer = await this.getOfficerByCharacter(actor.characterId);
    if (!officer) {
      throw new ForbiddenException('Only active officers can apply');
    }

    const alreadyMember = await this.prismaService.staffDepartment.findFirst({
      where: {
        staffProfileId: officer.id,
        departmentId: opening.departmentId,
        isActive: true,
      },
    });
    if (alreadyMember) {
      throw new BadRequestException('You already belong to this department');
    }

    if (opening.minRank && officer.rank.sortOrder < opening.minRank.sortOrder) {
      throw new ForbiddenException(
        `Minimum rank required: ${opening.minRank.name}`,
      );
    }

    try {
      const letter = await this.prismaService.interestLetter.create({
        data: {
          openingId,
          departmentId: opening.departmentId,
          staffProfileId: officer.id,
          motivation: dto.motivation.trim(),
          experience: dto.experience.trim(),
          additionalInfo: dto.additionalInfo?.trim() || null,
        },
        include: {
          staffProfile: { select: officerCardSelect },
          opening: true,
          department: true,
        },
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'departments.interest_letter_submitted',
        targetType: AUDIT_TARGET.DIVISION,
        targetId: opening.departmentId,
        metadata: {
          letterId: letter.id,
          openingId,
          staffProfileId: officer.id,
        },
      });

      const supervisors = await this.prismaService.departmentSupervisor.findMany({
        where: { departmentId: opening.departmentId },
        include: {
          staffProfile: {
            select: {
              character: { select: { id: true, accountId: true } },
            },
          },
        },
      });

      await this.notificationsService.createMany(
        supervisors.map((item) => ({
          accountId: item.staffProfile.character.accountId,
          characterId: item.staffProfile.character.id,
          type: NotificationType.DEPARTMENT_INTEREST_LETTER,
          title: `Nueva carta de interés · ${opening.department.name}`,
          body: `${officer.character.firstName} ${officer.character.lastName} ha postulado.`,
          href: `/departments?id=${opening.departmentId}&tab=applications`,
          metadata: { letterId: letter.id, departmentId: opening.departmentId },
        })),
      );

      return letter;
    } catch {
      throw new ConflictException('You already applied to this recruitment');
    }
  }

  async listInterestLetters(
    departmentId: string,
    actorCharacterId: string,
    permissions: string[],
  ) {
    await this.assertCanManageDepartment(departmentId, actorCharacterId, permissions);

    return this.prismaService.interestLetter.findMany({
      where: { departmentId },
      include: {
        staffProfile: { select: officerCardSelect },
        opening: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyInterestLetters(characterId: string) {
    const officer = await this.getOfficerByCharacter(characterId);
    if (!officer) {
      return [];
    }

    return this.prismaService.interestLetter.findMany({
      where: { staffProfileId: officer.id },
      include: {
        department: { select: { id: true, name: true, imageUrl: true } },
        opening: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInterestLetter(
    letterId: string,
    dto: ReviewInterestLetterDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const letter = await this.requirePendingLetter(letterId);
    await this.assertCanManageDepartment(letter.departmentId, actor.characterId, permissions);

    const previousDepartmentId = letter.staffProfile.departmentId;

    const updated = await this.prismaService.$transaction(async (tx) => {
      const accepted = await tx.interestLetter.update({
        where: { id: letterId },
        data: {
          status: InterestLetterStatus.ACCEPTED,
          reviewNotes: dto.reviewNotes?.trim() || null,
          reviewedByCharacterId: actor.characterId,
          reviewedAt: new Date(),
        },
        include: {
          staffProfile: { select: officerCardSelect },
          department: true,
          opening: true,
        },
      });

      await tx.staffDepartment.updateMany({
        where: { staffProfileId: letter.staffProfileId, isPrimary: true },
        data: { isPrimary: false },
      });

      await tx.staffDepartment.upsert({
        where: {
          staffProfileId_departmentId: {
            staffProfileId: letter.staffProfileId,
            departmentId: letter.departmentId,
          },
        },
        update: {
          isActive: true,
          isPrimary: true,
          role: DepartmentMembershipRole.MEMBER,
        },
        create: {
          staffProfileId: letter.staffProfileId,
          departmentId: letter.departmentId,
          role: DepartmentMembershipRole.MEMBER,
          isPrimary: true,
          isActive: true,
        },
      });

      await tx.staffProfile.update({
        where: { id: letter.staffProfileId },
        data: { departmentId: letter.departmentId },
      });

      return accepted;
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'departments.interest_letter_accepted',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: letter.departmentId,
      metadata: {
        letterId,
        staffProfileId: letter.staffProfileId,
        previousDepartmentId,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'staff.department_changed',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: letter.staffProfileId,
      metadata: {
        fromDepartmentId: previousDepartmentId,
        toDepartmentId: letter.departmentId,
        toDepartmentName: updated.department.name,
        source: 'interest_letter',
        letterId,
      },
    });

    await this.notificationsService.create({
      accountId: letter.staffProfile.character.accountId,
      characterId: letter.staffProfile.character.id,
      type: NotificationType.DEPARTMENT_APPLICATION_ACCEPTED,
      title: `Aceptado en ${updated.department.name}`,
      body: 'Tu carta de interés ha sido aceptada. Has sido asignado a la división.',
      href: `/departments?id=${letter.departmentId}`,
      metadata: { letterId, departmentId: letter.departmentId },
    });

    await this.notificationsService.create({
      accountId: letter.staffProfile.character.accountId,
      characterId: letter.staffProfile.character.id,
      type: NotificationType.DEPARTMENT_ASSIGNED,
      title: 'Cambio de división',
      body: `Ahora perteneces a ${updated.department.name}.`,
      href: `/departments?id=${letter.departmentId}`,
      metadata: { departmentId: letter.departmentId },
    });

    return updated;
  }

  async rejectInterestLetter(
    letterId: string,
    dto: ReviewInterestLetterDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const letter = await this.requirePendingLetter(letterId);
    await this.assertCanManageDepartment(letter.departmentId, actor.characterId, permissions);

    const updated = await this.prismaService.interestLetter.update({
      where: { id: letterId },
      data: {
        status: InterestLetterStatus.REJECTED,
        reviewNotes: dto.reviewNotes?.trim() || null,
        reviewedByCharacterId: actor.characterId,
        reviewedAt: new Date(),
      },
      include: {
        staffProfile: { select: officerCardSelect },
        department: true,
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'departments.interest_letter_rejected',
      targetType: AUDIT_TARGET.DIVISION,
      targetId: letter.departmentId,
      metadata: {
        letterId,
        staffProfileId: letter.staffProfileId,
        reviewNotes: dto.reviewNotes ?? null,
      },
    });

    await this.notificationsService.create({
      accountId: letter.staffProfile.character.accountId,
      characterId: letter.staffProfile.character.id,
      type: NotificationType.DEPARTMENT_APPLICATION_REJECTED,
      title: `Postulación rechazada · ${updated.department.name}`,
      body: dto.reviewNotes?.trim() || 'Tu carta de interés no fue aceptada en esta ocasión.',
      href: `/departments?id=${letter.departmentId}`,
      metadata: { letterId, departmentId: letter.departmentId },
    });

    return updated;
  }

  async canManageDepartment(departmentId: string, characterId: string) {
    const officer = await this.getOfficerByCharacter(characterId);
    if (!officer) {
      return false;
    }

    const membership = await this.prismaService.staffDepartment.findFirst({
      where: {
        departmentId,
        staffProfileId: officer.id,
        isActive: true,
        role: { in: [DepartmentMembershipRole.LEAD, DepartmentMembershipRole.SUPERVISOR] },
      },
      select: { id: true },
    });
    if (membership) {
      return true;
    }

    const supervisor = await this.prismaService.departmentSupervisor.findUnique({
      where: {
        departmentId_staffProfileId: {
          departmentId,
          staffProfileId: officer.id,
        },
      },
    });

    return Boolean(supervisor);
  }

  private async assertCanManageDepartment(
    departmentId: string,
    characterId: string,
    permissions: string[],
  ) {
    if (hasAdminDepartmentPower(permissions)) {
      return;
    }

    const allowed = await this.canManageDepartment(departmentId, characterId);
    if (!allowed) {
      throw new ForbiddenException('You cannot manage this department');
    }
  }

  private async requireDepartment(id: string) {
    const department = await this.prismaService.department.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department was not found');
    }
    return department;
  }

  private async requirePendingLetter(letterId: string) {
    const letter = await this.prismaService.interestLetter.findUnique({
      where: { id: letterId },
      include: {
        staffProfile: { select: officerCardSelect },
        department: true,
      },
    });
    if (!letter) {
      throw new NotFoundException('Interest letter was not found');
    }
    if (letter.status !== InterestLetterStatus.PENDING) {
      throw new BadRequestException('Interest letter is no longer pending');
    }
    return letter;
  }

  private getOfficerByCharacter(characterId: string) {
    return this.prismaService.staffProfile.findUnique({
      where: { characterId },
      include: {
        character: {
          select: { id: true, firstName: true, lastName: true, accountId: true },
        },
        rank: true,
      },
    });
  }
}

function hasAdminDepartmentPower(permissions: string[]) {
  const set = new Set(permissions ?? []);
  return (
    set.has('*') ||
    set.has('admin.access') ||
    set.has('departments.update') ||
    set.has('departments.create')
  );
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
