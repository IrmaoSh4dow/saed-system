import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminRequestStatus,
  AdminRequestType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateStaffRatingDto } from './dto/staff-rating.dto';

const HIGH_COMMAND_READ_PERMISSIONS = [
  'staff-ratings.read',
  'staff-ratings.dashboard',
  '*',
] as const;

@Injectable()
export class StaffRatingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  canReadRatings(permissions: string[] = []) {
    return hasAnyPermission(permissions, [...HIGH_COMMAND_READ_PERMISSIONS]);
  }

  async create(
    dto: CreateStaffRatingDto,
    actor: { accountId: string; characterId: string },
  ) {
    const score = Number(dto.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new BadRequestException('score must be an integer between 1 and 5');
    }

    const request = await this.prismaService.adminRequest.findUnique({
      where: { id: dto.adminRequestId },
      include: {
        staffRating: { select: { id: true } },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            accountId: true,
            staffProfile: {
              select: {
                id: true,
                employeeNumber: true,
                character: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Administrative request was not found');
    }

    if (request.requesterId !== actor.characterId) {
      throw new ForbiddenException(
        'Only the citizen who requested the appointment can leave a rating',
      );
    }

    if (request.type !== AdminRequestType.ADMINISTRATIVE_APPOINTMENT) {
      throw new BadRequestException(
        'Ratings are only available for administrative appointments',
      );
    }

    if (request.status !== AdminRequestStatus.COMPLETED) {
      throw new BadRequestException(
        'Ratings can only be submitted after the appointment is completed',
      );
    }

    if (request.staffRating) {
      throw new ConflictException(
        'This appointment already has a rating',
      );
    }

    const staffProfile = request.assignee?.staffProfile;
    if (!staffProfile) {
      throw new BadRequestException(
        'No medical staff profile is linked to the appointment assignee',
      );
    }

    const comment = dto.comment?.trim() || null;

    try {
      const created = await this.prismaService.staffRating.create({
        data: {
          staffProfileId: staffProfile.id,
          reviewerCharacterId: actor.characterId,
          adminRequestId: request.id,
          score,
          comment,
        },
        include: this.ratingInclude(),
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'staff-ratings.created',
        targetType: AUDIT_TARGET.STAFF_RATING,
        targetId: created.id,
        metadata: {
          staffProfileId: staffProfile.id,
          adminRequestId: request.id,
          score,
          hasComment: Boolean(comment),
        },
      });

      if (request.assignee?.accountId) {
        await this.notificationsService.create({
          accountId: request.assignee.accountId,
          characterId: request.assignee.id,
          type: NotificationType.STAFF_RATING_CREATED,
          title: 'Nueva valoración recibida',
          body: `Has recibido una valoración de ${score}★ por la cita administrativa #${request.requestNumber}.`,
          href: `/staff-ratings`,
          metadata: {
            staffRatingId: created.id,
            adminRequestId: request.id,
            score,
          },
        }).catch(() => undefined);
      }

      return this.toDto(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This appointment already has a rating',
        );
      }
      throw error;
    }
  }

  async getEligibility(
    adminRequestId: string,
    actorCharacterId: string,
  ) {
    const request = await this.prismaService.adminRequest.findUnique({
      where: { id: adminRequestId },
      include: {
        staffRating: {
          include: this.ratingInclude(),
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffProfile: {
              select: {
                id: true,
                employeeNumber: true,
                character: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    const staffProfile = request.assignee?.staffProfile ?? null;
    const existing = request.staffRating ? this.toDto(request.staffRating) : null;
    const canRate =
      request.requesterId === actorCharacterId &&
      request.type === AdminRequestType.ADMINISTRATIVE_APPOINTMENT &&
      request.status === AdminRequestStatus.COMPLETED &&
      !request.staffRating &&
      Boolean(staffProfile);

    return {
      canRate,
      reason: !canRate
        ? this.explainIneligibility(request, actorCharacterId, staffProfile)
        : null,
      existing,
      evaluatedStaff: staffProfile
        ? {
            id: staffProfile.id,
            employeeNumber: staffProfile.employeeNumber,
            fullName: `${staffProfile.character.firstName} ${staffProfile.character.lastName}`,
          }
        : null,
    };
  }

  async listForStaff(
    staffProfileId: string,
    permissions: string[],
    take = 20,
  ) {
    if (!this.canReadRatings(permissions)) {
      throw new ForbiddenException('Insufficient permissions to view ratings');
    }

    const staff = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      select: {
        id: true,
        employeeNumber: true,
        character: { select: { firstName: true, lastName: true } },
      },
    });
    if (!staff) {
      throw new NotFoundException('Staff profile was not found');
    }

    const [rows, aggregate, distribution] = await Promise.all([
      this.prismaService.staffRating.findMany({
        where: { staffProfileId },
        include: this.ratingInclude(),
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(take, 1), 100),
      }),
      this.prismaService.staffRating.aggregate({
        where: { staffProfileId },
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prismaService.staffRating.groupBy({
        by: ['score'],
        where: { staffProfileId },
        _count: { _all: true },
      }),
    ]);

    const byScore = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distribution) {
      byScore[row.score as 1 | 2 | 3 | 4 | 5] = row._count._all;
    }

    return {
      staff: {
        id: staff.id,
        employeeNumber: staff.employeeNumber,
        fullName: `${staff.character.firstName} ${staff.character.lastName}`,
      },
      summary: {
        averageScore: roundOne(aggregate._avg.score),
        totalRatings: aggregate._count._all,
        distribution: byScore,
      },
      items: rows.map((row) => this.toDto(row)),
    };
  }

  async getDashboard(permissions: string[]) {
    if (!this.canReadRatings(permissions)) {
      throw new ForbiddenException('Insufficient permissions to view ratings');
    }

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const [
      aggregate,
      monthCount,
      topRated,
      mostRated,
      pendingCount,
      recent,
    ] = await Promise.all([
      this.prismaService.staffRating.aggregate({
        _avg: { score: true },
        _count: { _all: true },
      }),
      this.prismaService.staffRating.count({
        where: { createdAt: { gte: monthStart } },
      }),
      this.prismaService.staffRating.groupBy({
        by: ['staffProfileId'],
        _avg: { score: true },
        _count: { _all: true },
        having: { staffProfileId: { _count: { gte: 1 } } },
        orderBy: { _avg: { score: 'desc' } },
        take: 5,
      }),
      this.prismaService.staffRating.groupBy({
        by: ['staffProfileId'],
        _count: { _all: true },
        _avg: { score: true },
        orderBy: { _count: { staffProfileId: 'desc' } },
        take: 5,
      }),
      this.prismaService.adminRequest.count({
        where: {
          type: AdminRequestType.ADMINISTRATIVE_APPOINTMENT,
          status: AdminRequestStatus.COMPLETED,
          staffRating: { is: null },
          assignee: { staffProfile: { isNot: null } },
        },
      }),
      this.prismaService.staffRating.findMany({
        include: this.ratingInclude(),
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const staffIds = [
      ...new Set([
        ...topRated.map((item) => item.staffProfileId),
        ...mostRated.map((item) => item.staffProfileId),
      ]),
    ];

    const staffRows = staffIds.length
      ? await this.prismaService.staffProfile.findMany({
          where: { id: { in: staffIds } },
          select: {
            id: true,
            employeeNumber: true,
            character: { select: { firstName: true, lastName: true } },
          },
        })
      : [];

    const staffMap = new Map(
      staffRows.map((item) => [
        item.id,
        {
          id: item.id,
          employeeNumber: item.employeeNumber,
          fullName: `${item.character.firstName} ${item.character.lastName}`,
        },
      ]),
    );

    return {
      hospitalAverage: roundOne(aggregate._avg.score),
      totalRatings: aggregate._count._all,
      ratingsThisMonth: monthCount,
      pendingRatings: pendingCount,
      topRated: topRated.map((item) => ({
        staff: staffMap.get(item.staffProfileId) ?? null,
        averageScore: roundOne(item._avg.score),
        totalRatings: item._count._all,
      })),
      mostRated: mostRated.map((item) => ({
        staff: staffMap.get(item.staffProfileId) ?? null,
        averageScore: roundOne(item._avg.score),
        totalRatings: item._count._all,
      })),
      recent: recent.map((row) => this.toDto(row)),
    };
  }

  async listMinePending(actorCharacterId: string) {
    const rows = await this.prismaService.adminRequest.findMany({
      where: {
        requesterId: actorCharacterId,
        type: AdminRequestType.ADMINISTRATIVE_APPOINTMENT,
        status: AdminRequestStatus.COMPLETED,
        staffRating: { is: null },
        assignee: { staffProfile: { isNot: null } },
      },
      include: {
        assignee: {
          select: {
            staffProfile: {
              select: {
                id: true,
                employeeNumber: true,
                character: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return rows.map((row) => ({
      adminRequestId: row.id,
      requestNumber: row.requestNumber,
      subject: row.subject,
      completedAt: row.updatedAt.toISOString(),
      evaluatedStaff: row.assignee?.staffProfile
        ? {
            id: row.assignee.staffProfile.id,
            employeeNumber: row.assignee.staffProfile.employeeNumber,
            fullName: `${row.assignee.staffProfile.character.firstName} ${row.assignee.staffProfile.character.lastName}`,
          }
        : null,
    }));
  }

  private explainIneligibility(
    request: {
      requesterId: string;
      type: AdminRequestType;
      status: AdminRequestStatus;
      staffRating: { id: string } | null;
    },
    actorCharacterId: string,
    staffProfile: unknown,
  ) {
    if (request.requesterId !== actorCharacterId) {
      return 'Only the appointment requester can rate this visit';
    }
    if (request.type !== AdminRequestType.ADMINISTRATIVE_APPOINTMENT) {
      return 'This request type is not eligible for ratings';
    }
    if (request.status !== AdminRequestStatus.COMPLETED) {
      return 'The appointment must be completed before rating';
    }
    if (request.staffRating) {
      return 'A rating already exists for this appointment';
    }
    if (!staffProfile) {
      return 'No medical staff assignee is available to rate';
    }
    return 'Rating is not available';
  }

  private ratingInclude() {
    return {
      staffProfile: {
        select: {
          id: true,
          employeeNumber: true,
          character: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      reviewerCharacter: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      adminRequest: {
        select: {
          id: true,
          requestNumber: true,
          subject: true,
          type: true,
          status: true,
        },
      },
    } satisfies Prisma.StaffRatingInclude;
  }

  private toDto(
    row: Prisma.StaffRatingGetPayload<{ include: ReturnType<StaffRatingsService['ratingInclude']> }>,
  ) {
    return {
      id: row.id,
      ratingNumber: row.ratingNumber,
      score: row.score,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      staffProfile: {
        id: row.staffProfile.id,
        employeeNumber: row.staffProfile.employeeNumber,
        fullName: `${row.staffProfile.character.firstName} ${row.staffProfile.character.lastName}`,
        avatarUrl: row.staffProfile.character.avatarUrl,
      },
      reviewerCharacter: {
        id: row.reviewerCharacter.id,
        fullName: `${row.reviewerCharacter.firstName} ${row.reviewerCharacter.lastName}`,
        avatarUrl: row.reviewerCharacter.avatarUrl,
      },
      adminRequest: {
        id: row.adminRequest.id,
        requestNumber: row.adminRequest.requestNumber,
        subject: row.adminRequest.subject,
        type: row.adminRequest.type,
        status: row.adminRequest.status,
      },
    };
  }
}

function roundOne(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value) * 10) / 10;
}
