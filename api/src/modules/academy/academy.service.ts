import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademyAnnouncementPriority,
  AcademyApplicationStatus,
  AcademyApplicationType,
  AcademyAttendanceStatus,
  AcademyTrainingStatus,
  CharacterStatus,
  NotificationType,
  OccupationType,
  StaffStatus,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { AuthContextCacheService } from '../../common/auth-context/auth-context-cache.service';
import { SAED_ORGANIZATION } from '../../common/constants/workplaces';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from '../roles/roles.service';
import {
  CreateAcademyAnnouncementDto,
  CreateAcademyApplicationDto,
  CreateAcademyTrainingDto,
  RespondTrainingAttendanceDto,
  ReviewAcademyApplicationDto,
  UpdateAcademyAnnouncementDto,
  UpdateAcademyTrainingDto,
} from './dto/academy.dto';
import { ApplicationConfigurationsService } from './application-configurations.service';

const characterCardSelect = {
  id: true,
  firstName: true,
  lastName: true,
  status: true,
  avatarUrl: true,
  staffProfile: {
    select: {
      id: true,
      employeeNumber: true,
      rank: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

const officerCardSelect = {
  id: true,
  employeeNumber: true,
  status: true,
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  rank: { select: { id: true, name: true, slug: true } },
  department: { select: { id: true, name: true } },
} as const;

const trainingInclude = {
  instructorCharacter: { select: characterCardSelect },
  createdByCharacter: { select: characterCardSelect },
  supportStaff: {
    include: { staffProfile: { select: officerCardSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
  attendances: {
    include: { character: { select: characterCardSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.AcademyTrainingInclude;

const applicationInclude = {
  character: { select: characterCardSelect },
  reviewedByCharacter: { select: characterCardSelect },
} satisfies Prisma.AcademyApplicationInclude;

@Injectable()
export class AcademyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly applicationConfigurationsService: ApplicationConfigurationsService,
    private readonly authContextCacheService: AuthContextCacheService,
  ) {}

  async getDashboard(characterId: string, permissions: string[]) {
    this.assertCanAccessAcademy(permissions);

    const now = new Date();
    const isCadet = await this.isCadetCharacter(characterId);
    const [announcements, upcoming, history, allTrainings, myAttendances] =
      await Promise.all([
        this.prismaService.academyAnnouncement.findMany({
          take: 10,
          orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
          include: { authorCharacter: { select: characterCardSelect } },
        }),
        this.prismaService.academyTraining.findMany({
          where: {
            startsAt: { gte: now },
            status: {
              in: [AcademyTrainingStatus.SCHEDULED, AcademyTrainingStatus.IN_PROGRESS],
            },
          },
          orderBy: { startsAt: 'asc' },
          take: 20,
          include: trainingInclude,
        }),
        this.prismaService.academyTraining.findMany({
          where: {
            OR: [
              { startsAt: { lt: now } },
              { status: AcademyTrainingStatus.COMPLETED },
            ],
          },
          orderBy: { startsAt: 'desc' },
          take: 20,
          include: trainingInclude,
        }),
        this.prismaService.academyTraining.findMany({
          where: { status: { not: AcademyTrainingStatus.CANCELLED } },
          orderBy: { startsAt: 'asc' },
          // Calendar payload is tiny: avoid loading full attendance rosters.
          select: {
            id: true,
            title: true,
            startsAt: true,
            location: true,
            status: true,
            attendances: {
              where: { characterId },
              take: 1,
              include: { character: { select: characterCardSelect } },
            },
          },
        }),
        this.prismaService.academyTrainingAttendance.findMany({
          where: { characterId },
          include: {
            training: {
              include: {
                instructorCharacter: { select: characterCardSelect },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

    const mapOpts = { isCadet, permissions };
    const calendarAccess = this.resolveAccess(permissions);
    const canRespondAttendance = isCadet && !calendarAccess.canManage;

    return {
      announcements,
      upcomingTrainings: upcoming.map((item) =>
        this.mapTraining(item, characterId, mapOpts),
      ),
      trainingHistory: history.map((item) =>
        this.mapTraining(item, characterId, mapOpts),
      ),
      myAttendances,
      calendar: {
        ready: true,
        events: allTrainings.map((item) => ({
          id: item.id,
          title: item.title,
          startsAt: item.startsAt,
          location: item.location,
          status: item.status,
          myAttendance: item.attendances[0] ?? null,
          canRespondAttendance,
          canManage: calendarAccess.canManage,
        })),
      },
      access: {
        ...this.resolveAccess(permissions),
        canRespondAttendance: isCadet && !canManageAcademy(permissions),
        isCadet,
      },
    };
  }

  async listTrainings(characterId: string, permissions: string[]) {
    this.assertCanAccessAcademy(permissions);
    const isCadet = await this.isCadetCharacter(characterId);
    const items = await this.prismaService.academyTraining.findMany({
      orderBy: { startsAt: 'desc' },
      include: trainingInclude,
    });
    return items.map((item) =>
      this.mapTraining(item, characterId, { isCadet, permissions }),
    );
  }

  async getTraining(id: string, characterId: string, permissions: string[]) {
    this.assertCanAccessAcademy(permissions);
    const isCadet = await this.isCadetCharacter(characterId);
    const training = await this.requireTraining(id);
    return this.mapTraining(training, characterId, { isCadet, permissions });
  }

  searchOfficers(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    const parts = term.split(/\s+/).filter(Boolean);

    return this.prismaService.staffProfile.findMany({
      where: {
        status: { not: StaffStatus.RETIRED },
        OR: [
          { employeeNumber: { contains: term, mode: 'insensitive' } },
          { character: { firstName: { contains: term, mode: 'insensitive' } } },
          { character: { lastName: { contains: term, mode: 'insensitive' } } },
          ...(parts.length >= 2
            ? [
                {
                  character: {
                    AND: [
                      {
                        firstName: {
                          contains: parts[0],
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        lastName: {
                          contains: parts[1],
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  },
                },
              ]
            : []),
        ],
      },
      take: 20,
      orderBy: [{ employeeNumber: 'asc' }],
      select: officerCardSelect,
    });
  }

  async createTraining(
    dto: CreateAcademyTrainingDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanManage(permissions);
    await this.assertCharacterExists(dto.instructorCharacterId);
    const supportOfficerIds = await this.assertSupportOfficers(dto.supportOfficerIds);

    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Invalid startsAt');
    }

    const training = await this.prismaService.academyTraining.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        instructorCharacterId: dto.instructorCharacterId,
        startsAt,
        location: dto.location.trim(),
        capacity: dto.capacity ?? null,
        status: dto.status ?? AcademyTrainingStatus.SCHEDULED,
        createdByCharacterId: actor.characterId,
        supportStaff: supportOfficerIds.length
          ? {
              create: supportOfficerIds.map((staffProfileId) => ({ staffProfileId })),
            }
          : undefined,
      },
      include: trainingInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.training_created',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: training.id,
      metadata: {
        title: training.title,
        startsAt: training.startsAt.toISOString(),
        supportOfficerIds,
      },
    });

    await this.notifyCadets(
      NotificationType.ACADEMY_TRAINING_CREATED,
      `Nuevo entrenamiento · ${training.title}`,
      `${formatDateTime(training.startsAt)} · ${training.location}`,
      '/academy',
    );

    const isCadet = await this.isCadetCharacter(actor.characterId);
    return this.mapTraining(training, actor.characterId, { isCadet, permissions });
  }

  async updateTraining(
    id: string,
    dto: UpdateAcademyTrainingDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanManage(permissions);
    const existing = await this.requireTraining(id);

    if (dto.instructorCharacterId) {
      await this.assertCharacterExists(dto.instructorCharacterId);
    }

    const startsAt =
      dto.startsAt === undefined
        ? undefined
        : (() => {
            const value = new Date(dto.startsAt);
            if (Number.isNaN(value.getTime())) {
              throw new BadRequestException('Invalid startsAt');
            }
            return value;
          })();

    const previousInstructorId = existing.instructorCharacterId;
    const previousStatus = existing.status;
    const previousSupportIds = existing.supportStaff.map(
      (item) => item.staffProfileId,
    );

    const training = await this.prismaService.academyTraining.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        instructorCharacterId: dto.instructorCharacterId,
        startsAt,
        location: dto.location?.trim(),
        capacity: dto.capacity === undefined ? undefined : dto.capacity,
        status: dto.status,
      },
      include: trainingInclude,
    });

    if (dto.supportOfficerIds !== undefined) {
      await this.syncSupportOfficers(
        id,
        dto.supportOfficerIds,
        previousSupportIds,
        actor,
      );
    }

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.training_updated',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: id,
      metadata: {
        title: dto.title,
        status: dto.status,
        location: dto.location,
      },
    });

    if (
      dto.instructorCharacterId &&
      dto.instructorCharacterId !== previousInstructorId
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'academy.training_instructor_changed',
        targetType: AUDIT_TARGET.ACADEMY,
        targetId: id,
        metadata: {
          fromInstructorCharacterId: previousInstructorId,
          toInstructorCharacterId: dto.instructorCharacterId,
        },
      });
    }

    if (
      dto.status === AcademyTrainingStatus.CANCELLED &&
      previousStatus !== AcademyTrainingStatus.CANCELLED
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'academy.training_cancelled',
        targetType: AUDIT_TARGET.ACADEMY,
        targetId: id,
        metadata: { title: training.title },
      });
    }

    const refreshed = await this.requireTraining(id);
    const isCadet = await this.isCadetCharacter(actor.characterId);
    return this.mapTraining(refreshed, actor.characterId, { isCadet, permissions });
  }

  async respondAttendance(
    trainingId: string,
    dto: RespondTrainingAttendanceDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanAccessAcademy(permissions);

    const isCadet = await this.isCadetCharacter(actor.characterId);
    if (!isCadet || canManageAcademy(permissions)) {
      throw new ForbiddenException('Only cadets can respond to training attendance');
    }

    if (
      dto.status !== AcademyAttendanceStatus.CONFIRMED &&
      dto.status !== AcademyAttendanceStatus.DECLINED
    ) {
      throw new BadRequestException('Attendance response must be CONFIRMED or DECLINED');
    }

    const training = await this.requireTraining(trainingId);
    if (
      training.status === AcademyTrainingStatus.CANCELLED ||
      training.status === AcademyTrainingStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot respond to this training');
    }

    if (dto.status === AcademyAttendanceStatus.CONFIRMED && training.capacity) {
      const confirmed = training.attendances.filter(
        (item) => item.status === AcademyAttendanceStatus.CONFIRMED,
      ).length;
      const already = training.attendances.find(
        (item) => item.characterId === actor.characterId,
      );
      if (
        confirmed >= training.capacity &&
        already?.status !== AcademyAttendanceStatus.CONFIRMED
      ) {
        throw new BadRequestException('Training capacity has been reached');
      }
    }

    const attendance = await this.prismaService.academyTrainingAttendance.upsert({
      where: {
        trainingId_characterId: {
          trainingId,
          characterId: actor.characterId,
        },
      },
      create: {
        trainingId,
        characterId: actor.characterId,
        status: dto.status,
        notes: dto.notes?.trim() || null,
        respondedAt: new Date(),
      },
      update: {
        status: dto.status,
        notes: dto.notes?.trim() || null,
        respondedAt: new Date(),
      },
      include: { character: { select: characterCardSelect } },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.attendance_responded',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: trainingId,
      metadata: { status: dto.status, attendanceId: attendance.id },
    });

    const instructor = await this.prismaService.character.findUnique({
      where: { id: training.instructorCharacterId },
      select: { id: true, accountId: true },
    });
    if (instructor) {
      await this.notificationsService.create({
        accountId: instructor.accountId,
        characterId: instructor.id,
        type: NotificationType.ACADEMY_ATTENDANCE,
        title: `Asistencia · ${training.title}`,
        body: `${attendance.character.firstName} ${attendance.character.lastName}: ${dto.status}`,
        href: `/academy?trainingId=${trainingId}`,
      });
    }

    return this.getTraining(trainingId, actor.characterId, permissions);
  }

  async listAnnouncements(permissions: string[]) {
    this.assertCanAccessAcademy(permissions);
    return this.prismaService.academyAnnouncement.findMany({
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      include: { authorCharacter: { select: characterCardSelect } },
    });
  }

  async createAnnouncement(
    dto: CreateAcademyAnnouncementDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanManage(permissions);

    const announcement = await this.prismaService.academyAnnouncement.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        priority: dto.priority ?? AcademyAnnouncementPriority.NORMAL,
        authorCharacterId: actor.characterId,
      },
      include: { authorCharacter: { select: characterCardSelect } },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.announcement_published',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: announcement.id,
      metadata: { title: announcement.title, priority: announcement.priority },
    });

    await this.notifyCadets(
      NotificationType.ACADEMY_ANNOUNCEMENT,
      `Anuncio · ${announcement.title}`,
      announcement.content.slice(0, 160),
      '/academy',
    );

    return announcement;
  }

  async updateAnnouncement(
    id: string,
    dto: UpdateAcademyAnnouncementDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanManage(permissions);
    const existing = await this.prismaService.academyAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Announcement was not found');
    }

    const announcement = await this.prismaService.academyAnnouncement.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        priority: dto.priority,
      },
      include: { authorCharacter: { select: characterCardSelect } },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.announcement_updated',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: id,
      metadata: { ...dto },
    });

    return announcement;
  }

  async deleteAnnouncement(
    id: string,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanManage(permissions);
    const existing = await this.prismaService.academyAnnouncement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Announcement was not found');
    }

    await this.prismaService.academyAnnouncement.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.announcement_deleted',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: id,
      metadata: { title: existing.title },
    });

    return { id, deleted: true };
  }

  async listMyApplications(characterId: string) {
    if (await this.permissionsService.belongsToSaed(characterId)) {
      throw new ForbiddenException('SAED members cannot access application submissions');
    }

    return this.prismaService.academyApplication.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      include: applicationInclude,
    });
  }

  async listApplications(
    permissions: string[],
    filters: { type?: AcademyApplicationType; status?: AcademyApplicationStatus } = {},
  ) {
    this.assertCanReviewApplications(permissions);
    return this.prismaService.academyApplication.findMany({
      where: {
        type: filters.type,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
      include: applicationInclude,
    });
  }

  async getApplication(id: string, characterId: string, permissions: string[]) {
    const application = await this.requireApplication(id);
    const canReview = canReviewApplications(permissions);
    if (application.characterId !== characterId && !canReview) {
      throw new ForbiddenException('You cannot view this application');
    }
    return application;
  }

  async createApplication(
    dto: CreateAcademyApplicationDto,
    actor: { accountId: string; characterId: string },
  ) {
    await this.applicationConfigurationsService.assertOpen(dto.type);
    this.validateApplicationForm(dto.type, dto.formData);

    const discordUsername = dto.discordUsername.trim();
    if (!discordUsername) {
      throw new BadRequestException('discordUsername is required');
    }

    if (await this.permissionsService.belongsToSaed(actor.characterId)) {
      throw new ForbiddenException(
        'SAED members cannot submit academy or transfer applications',
      );
    }

    const character = await this.prismaService.character.findUnique({
      where: { id: actor.characterId },
      include: { staffProfile: true },
    });
    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    if (character.staffProfile) {
      throw new BadRequestException('Character already has an officer profile');
    }

    const pending = await this.prismaService.academyApplication.findFirst({
      where: {
        characterId: actor.characterId,
        type: dto.type,
        status: {
          in: [AcademyApplicationStatus.PENDING, AcademyApplicationStatus.UNDER_REVIEW],
        },
      },
    });
    if (pending) {
      throw new ConflictException('You already have a pending application of this type');
    }

    const formData = {
      ...dto.formData,
      discordUsername,
    };

    const application = await this.prismaService.academyApplication.create({
      data: {
        type: dto.type,
        characterId: actor.characterId,
        discordUsername,
        formData: formData as Prisma.InputJsonValue,
        status: AcademyApplicationStatus.PENDING,
      },
      include: applicationInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.application_created',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: application.id,
      metadata: { type: dto.type, discordUsername },
    });

    await this.notificationsService.create({
      accountId: actor.accountId,
      characterId: actor.characterId,
      type: NotificationType.ACADEMY_APPLICATION_SUBMITTED,
      title: 'Postulación enviada',
      body:
        dto.type === AcademyApplicationType.ACADEMY
          ? 'Tu postulación a la Academia SAED ha sido recibida.'
          : 'Tu solicitud de traslado ha sido recibida.',
      href: '/academy/applications',
    });

    return application;
  }

  async reviewApplication(
    id: string,
    dto: ReviewAcademyApplicationDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    this.assertCanReviewApplications(permissions);
    const application = await this.requireApplication(id);

    if (
      application.status === AcademyApplicationStatus.ACCEPTED ||
      application.status === AcademyApplicationStatus.REJECTED
    ) {
      throw new BadRequestException('Application was already reviewed');
    }

    if (
      dto.status !== AcademyApplicationStatus.ACCEPTED &&
      dto.status !== AcademyApplicationStatus.REJECTED &&
      dto.status !== AcademyApplicationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Invalid review status');
    }

    if (dto.status === AcademyApplicationStatus.UNDER_REVIEW) {
      const updated = await this.prismaService.academyApplication.update({
        where: { id },
        data: {
          status: AcademyApplicationStatus.UNDER_REVIEW,
          internalNotes: dto.internalNotes?.trim() || application.internalNotes,
          reviewNotes: dto.reviewNotes?.trim() || application.reviewNotes,
        },
        include: applicationInclude,
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'academy.application_status_changed',
        targetType: AUDIT_TARGET.ACADEMY,
        targetId: id,
        metadata: { status: dto.status },
      });

      return updated;
    }

    if (dto.status === AcademyApplicationStatus.REJECTED) {
      const updated = await this.prismaService.academyApplication.update({
        where: { id },
        data: {
          status: AcademyApplicationStatus.REJECTED,
          reviewNotes: dto.reviewNotes?.trim() || null,
          internalNotes: dto.internalNotes?.trim() || application.internalNotes,
          reviewedByCharacterId: actor.characterId,
          reviewedAt: new Date(),
        },
        include: applicationInclude,
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'academy.application_rejected',
        targetType: AUDIT_TARGET.ACADEMY,
        targetId: id,
        metadata: {
          type: application.type,
          reviewNotes: dto.reviewNotes ?? null,
        },
      });

      if (updated.characterId) {
        const recipient = await this.prismaService.character.findUniqueOrThrow({
          where: { id: updated.characterId },
          select: { accountId: true },
        });
        await this.notificationsService.create({
          accountId: recipient.accountId,
          characterId: updated.characterId,
          type: NotificationType.ACADEMY_APPLICATION_REJECTED,
          title: 'Postulación rechazada',
          body: dto.reviewNotes?.trim() || 'Tu solicitud ha sido rechazada.',
          href: '/academy/applications',
        });
      }

      return updated;
    }

    // ACCEPTED
    if (application.type === AcademyApplicationType.ACADEMY) {
      await this.promoteToCadet(application.characterId, dto, actor);
    } else {
      await this.applyTransferAcceptance(application.characterId, application.formData, dto, actor);
    }

    const updated = await this.prismaService.academyApplication.update({
      where: { id },
      data: {
        status: AcademyApplicationStatus.ACCEPTED,
        reviewNotes: dto.reviewNotes?.trim() || null,
        internalNotes: dto.internalNotes?.trim() || application.internalNotes,
        reviewedByCharacterId: actor.characterId,
        reviewedAt: new Date(),
      },
      include: applicationInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.application_accepted',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: id,
      metadata: { type: application.type },
    });

    const account = await this.prismaService.character.findUniqueOrThrow({
      where: { id: updated.characterId },
      select: { accountId: true },
    });

    await this.notificationsService.create({
      accountId: account.accountId,
      characterId: updated.characterId,
      type: NotificationType.ACADEMY_APPLICATION_ACCEPTED,
      title:
        application.type === AcademyApplicationType.ACADEMY
          ? 'Bienvenido a la Academia SAED'
          : 'Traslado aceptado',
      body:
        application.type === AcademyApplicationType.ACADEMY
          ? 'Tu postulación fue aceptada. Ya eres Cadete.'
          : 'Tu solicitud de traslado fue aceptada.',
      href:
        application.type === AcademyApplicationType.ACADEMY
          ? '/academy'
          : '/dashboard',
    });

    return updated;
  }

  private async promoteToCadet(
    characterId: string,
    dto: ReviewAcademyApplicationDto,
    actor: { accountId: string; characterId: string },
  ) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      include: { staffProfile: true },
    });
    if (!character) {
      throw new NotFoundException('Character was not found');
    }
    if (character.staffProfile) {
      throw new ConflictException('Character already has a medical staff profile');
    }

    const internRank =
      (dto.rankId
        ? await this.prismaService.rank.findUnique({ where: { id: dto.rankId } })
        : null) ??
      (await this.prismaService.rank.findUnique({ where: { slug: 'intern' } }));

    if (!internRank) {
      throw new BadRequestException('Intern rank is not configured');
    }

    const internRole = await this.rolesService.findBySlug('intern');
    const employeeNumber =
      (dto.employeeNumber?.trim() || (await this.generateCadetBadge())).trim();
    const existingBadge = await this.prismaService.staffProfile.findUnique({
      where: { employeeNumber },
    });
    if (existingBadge) {
      throw new ConflictException('Employee number is already in use');
    }

    if (dto.departmentId) {
      const department = await this.prismaService.department.findFirst({
        where: { id: dto.departmentId, isActive: true },
      });
      if (!department) {
        throw new BadRequestException('Department was not found');
      }
    }

    const joinedAt = new Date();

    const officer = await this.prismaService.$transaction(async (tx) => {
      const profile = await tx.staffProfile.create({
        data: {
          characterId,
          employeeNumber,
          rankId: internRank.id,
          departmentId: dto.departmentId ?? null,
          status: StaffStatus.ACTIVE,
          joinedAt,
        },
      });

      await tx.character.update({
        where: { id: characterId },
        data: {
          status: CharacterStatus.INTERN,
          rankId: internRank.id,
        },
      });

      await tx.occupation.updateMany({
        where: { characterId, isActive: true },
        data: { isActive: false, isPrimary: false, endedAt: joinedAt },
      });

      await tx.occupation.create({
        data: {
          characterId,
          type: OccupationType.DEPARTMENT,
          organization: SAED_ORGANIZATION,
          position: internRank.name,
          isPrimary: true,
          isActive: true,
          startedAt: joinedAt,
        },
      });

      await tx.characterRole.upsert({
        where: {
          characterId_roleId: {
            characterId,
            roleId: internRole.id,
          },
        },
        update: {},
        create: {
          characterId,
          roleId: internRole.id,
        },
      });

      return profile;
    });

    this.authContextCacheService.invalidateCharacter(characterId);

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.intern_promoted',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: officer.id,
      metadata: {
        characterId,
        employeeNumber,
        rankId: internRank.id,
        event: 'academy_accepted',
      },
    });
  }

  private async applyTransferAcceptance(
    characterId: string,
    formData: Prisma.JsonValue,
    dto: ReviewAcademyApplicationDto,
    actor: { accountId: string; characterId: string },
  ) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      include: { staffProfile: true },
    });
    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    const form = (formData ?? {}) as Record<string, unknown>;
    let rank =
      (dto.rankId
        ? await this.prismaService.rank.findUnique({ where: { id: dto.rankId } })
        : null) ?? null;

    if (!rank && typeof form.rankSlug === 'string') {
      rank = await this.prismaService.rank.findUnique({ where: { slug: form.rankSlug } });
    }

    if (character.staffProfile) {
      const updated = await this.prismaService.staffProfile.update({
        where: { id: character.staffProfile.id },
        data: {
          rankId: rank?.id,
          departmentId: dto.departmentId === undefined ? undefined : dto.departmentId,
          status: StaffStatus.ACTIVE,
        },
      });

      await this.prismaService.character.update({
        where: { id: characterId },
        data: {
          status: CharacterStatus.MEDICAL_STAFF,
          rankId: rank?.id ?? character.rankId,
        },
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'academy.transfer_accepted',
        targetType: AUDIT_TARGET.OFFICER,
        targetId: updated.id,
        metadata: {
          characterId,
          formData: form as Prisma.InputJsonValue,
          rankId: rank?.id ?? null,
        },
      });
      return;
    }

    // External transfer without prior StaffProfile — create as doctor
    if (!rank) {
      rank = await this.prismaService.rank.findUnique({ where: { slug: 'doctor' } });
    }
    if (!rank) {
      throw new BadRequestException('Target rank is required for transfer acceptance');
    }

    const doctorRole = await this.rolesService.findBySlug('doctor');
    const employeeNumber = (dto.employeeNumber?.trim() || (await this.generateCadetBadge('T'))).trim();
    const joinedAt = new Date();

    const profile = await this.prismaService.$transaction(async (tx) => {
      const created = await tx.staffProfile.create({
        data: {
          characterId,
          employeeNumber,
          rankId: rank!.id,
          departmentId: dto.departmentId ?? null,
          status: StaffStatus.ACTIVE,
          joinedAt,
        },
      });

      await tx.character.update({
        where: { id: characterId },
        data: { status: CharacterStatus.MEDICAL_STAFF, rankId: rank!.id },
      });

      await tx.occupation.updateMany({
        where: { characterId, isActive: true },
        data: { isActive: false, isPrimary: false, endedAt: joinedAt },
      });

      await tx.occupation.create({
        data: {
          characterId,
          type: OccupationType.DEPARTMENT,
          organization: SAED_ORGANIZATION,
          position: rank!.name,
          isPrimary: true,
          isActive: true,
          startedAt: joinedAt,
        },
      });

      await tx.characterRole.upsert({
        where: {
          characterId_roleId: { characterId, roleId: doctorRole.id },
        },
        update: {},
        create: { characterId, roleId: doctorRole.id },
      });

      return created;
    });

    this.authContextCacheService.invalidateCharacter(characterId);

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'academy.transfer_accepted',
      targetType: AUDIT_TARGET.OFFICER,
      targetId: profile.id,
      metadata: { characterId, employeeNumber, rankId: rank.id, event: 'transfer_intake' },
    });
  }

  private validateApplicationForm(
    type: AcademyApplicationType,
    formData: Record<string, unknown>,
  ) {
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      throw new BadRequestException('formData must be an object');
    }

    const required =
      type === AcademyApplicationType.ACADEMY
        ? [
            'fullName',
            'birthDate',
            'phone',
            'educationLevel',
            'currentOccupation',
            'workHistory',
            'motivation',
            'whyAccept',
            'availability',
          ]
        : [
            'fullName',
            'originDepartment',
            'currentRank',
            'serviceTime',
            'transferReason',
            'experience',
          ];

    for (const key of required) {
      const value = formData[key];
      if (typeof value !== 'string' || !value.trim()) {
        throw new BadRequestException(`Missing required field: ${key}`);
      }
    }
  }

  private mapTraining(
    training: Prisma.AcademyTrainingGetPayload<{ include: typeof trainingInclude }>,
    characterId: string,
    options: { isCadet?: boolean; permissions?: string[] } = {},
  ) {
    const permissions = options.permissions ?? [];
    const isCadet = Boolean(options.isCadet);
    const access = this.resolveAccess(permissions);
    const canRespondAttendance = isCadet && !access.canManage;
    const mine = training.attendances.find((item) => item.characterId === characterId) ?? null;
    const confirmedCount = training.attendances.filter(
      (item) => item.status === AcademyAttendanceStatus.CONFIRMED,
    ).length;

    return {
      ...training,
      supportStaff: training.supportStaff.map((item) => item.staffProfile),
      myAttendance: mine,
      confirmedCount,
      access: {
        ...access,
        canRespondAttendance,
        canViewAttendanceRoster: access.canManage,
        isCadet,
      },
      attendances: access.canManage ? training.attendances : undefined,
    };
  }

  private async syncSupportOfficers(
    trainingId: string,
    nextIds: string[],
    previousIds: string[],
    actor: { accountId: string; characterId: string },
  ) {
    const uniqueNext = await this.assertSupportOfficers(nextIds);
    const previous = new Set(previousIds);
    const next = new Set(uniqueNext);

    const toAdd = uniqueNext.filter((id) => !previous.has(id));
    const toRemove = previousIds.filter((id) => !next.has(id));

    if (toRemove.length) {
      await this.prismaService.academyTrainingSupportStaff.deleteMany({
        where: {
          trainingId,
          staffProfileId: { in: toRemove },
        },
      });
      for (const staffProfileId of toRemove) {
        await this.auditService.create({
          actorAccountId: actor.accountId,
          actorCharacterId: actor.characterId,
          action: 'academy.training_support_removed',
          targetType: AUDIT_TARGET.ACADEMY,
          targetId: trainingId,
          metadata: { staffProfileId },
        });
      }
    }

    for (const staffProfileId of toAdd) {
      await this.prismaService.academyTrainingSupportStaff.create({
        data: { trainingId, staffProfileId },
      });
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'academy.training_support_added',
        targetType: AUDIT_TARGET.ACADEMY,
        targetId: trainingId,
        metadata: { staffProfileId },
      });
    }
  }

  private async assertSupportOfficers(ids?: string[]) {
    const unique = [...new Set((ids ?? []).filter(Boolean))];
    for (const staffProfileId of unique) {
      const officer = await this.prismaService.staffProfile.findUnique({
        where: { id: staffProfileId },
      });
      if (!officer || officer.status === StaffStatus.RETIRED) {
        throw new BadRequestException('Support officer was not found');
      }
    }
    return unique;
  }

  private async isCadetCharacter(characterId: string) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      select: {
        status: true,
        roles: { include: { role: { select: { slug: true } } } },
      },
    });
    if (!character) {
      return false;
    }
    if (character.status === CharacterStatus.INTERN) {
      return true;
    }
    return character.roles.some((item) => item.role.slug === 'intern');
  }

  private async requireTraining(id: string) {
    const training = await this.prismaService.academyTraining.findUnique({
      where: { id },
      include: trainingInclude,
    });
    if (!training) {
      throw new NotFoundException('Training was not found');
    }
    return training;
  }

  private async requireApplication(id: string) {
    const application = await this.prismaService.academyApplication.findUnique({
      where: { id },
      include: applicationInclude,
    });
    if (!application) {
      throw new NotFoundException('Application was not found');
    }
    return application;
  }

  private async assertCharacterExists(characterId: string) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
    });
    if (!character) {
      throw new BadRequestException('Character was not found');
    }
  }

  private async generateCadetBadge(prefix = 'C') {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = `${prefix}-${String(randomInt(1000, 9999))}`;
      const existing = await this.prismaService.staffProfile.findUnique({
        where: { employeeNumber: candidate },
      });
      if (!existing) {
        return candidate;
      }
    }
    throw new BadRequestException('Could not generate a unique employee number');
  }

  private async notifyCadets(
    type: NotificationType,
    title: string,
    body: string,
    href: string,
  ) {
    const interns = await this.prismaService.character.findMany({
      where: {
        OR: [
          { status: CharacterStatus.INTERN },
          { roles: { some: { role: { slug: 'intern' } } } },
        ],
      },
      select: { id: true, accountId: true },
    });

    await Promise.all(
      interns.map((intern) =>
        this.notificationsService.create({
          accountId: intern.accountId,
          characterId: intern.id,
          type,
          title,
          body,
          href,
        }),
      ),
    );
  }

  private resolveAccess(permissions: string[]) {
    return {
      canManage: canManageAcademy(permissions),
      canReviewApplications: canReviewApplications(permissions),
      canAccess: canAccessAcademy(permissions),
    };
  }

  private assertCanAccessAcademy(permissions: string[]) {
    if (!canAccessAcademy(permissions)) {
      throw new ForbiddenException('Academy access denied');
    }
  }

  private assertCanManage(permissions: string[]) {
    if (!canManageAcademy(permissions)) {
      throw new ForbiddenException('Academy management denied');
    }
  }

  private assertCanReviewApplications(permissions: string[]) {
    if (!canReviewApplications(permissions)) {
      throw new ForbiddenException('Application review denied');
    }
  }
}

function canAccessAcademy(permissions: string[]) {
  const set = new Set(permissions ?? []);
  return (
    set.has('*') ||
    set.has('admin.access') ||
    set.has('academy.read') ||
    set.has('academy.manage')
  );
}

function canManageAcademy(permissions: string[]) {
  const set = new Set(permissions ?? []);
  return set.has('*') || set.has('admin.access') || set.has('academy.manage');
}

function canReviewApplications(permissions: string[]) {
  const set = new Set(permissions ?? []);
  return (
    set.has('*') ||
    set.has('admin.access') ||
    set.has('academy.applications') ||
    set.has('applications.manage') ||
    set.has('academy.manage')
  );
}

function formatDateTime(value: Date) {
  return value.toISOString();
}
