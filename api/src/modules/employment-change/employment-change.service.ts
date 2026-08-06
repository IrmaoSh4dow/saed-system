import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmploymentChangeRequestStatus,
  EstablishmentStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { isSaedOrganization } from '../../common/constants/workplaces';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { CharactersService } from '../characters/characters.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import {
  CreateEmploymentChangeRequestDto,
  ReviewEmploymentChangeRequestDto,
  SearchEmploymentChangeRequestDto,
} from './dto/employment-change.dto';

const HIGH_COMMAND_ROLE_SLUGS = [
  'medical-director',
  'deputy-medical-director',
  'administrator',
] as const;

const characterSelect = {
  id: true,
  firstName: true,
  lastName: true,
  accountId: true,
  avatarUrl: true,
  status: true,
} satisfies Prisma.CharacterSelect;

const establishmentSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
} satisfies Prisma.EstablishmentSelect;

const requestInclude = {
  character: {
    select: {
      ...characterSelect,
      account: { select: { id: true, email: true, username: true } },
      occupations: {
        where: { isActive: true },
        orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'desc' as const }],
        take: 1,
        select: {
          organization: true,
          position: true,
          establishmentId: true,
        },
      },
    },
  },
  currentEstablishment: { select: establishmentSelect },
  requestedEstablishment: { select: establishmentSelect },
  approvedByCharacter: { select: characterSelect },
  rejectedByCharacter: { select: characterSelect },
} satisfies Prisma.EmploymentChangeRequestInclude;

const OPEN_STATUSES: EmploymentChangeRequestStatus[] = [
  EmploymentChangeRequestStatus.PENDING,
  EmploymentChangeRequestStatus.UNDER_REVIEW,
];

@Injectable()
export class EmploymentChangeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly charactersService: CharactersService,
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  canReview(permissions: string[] = []) {
    return hasAnyPermission(permissions, ['employment-change.review', '*']);
  }

  canManage(permissions: string[] = []) {
    return hasAnyPermission(permissions, [
      'employment-change.manage',
      'employment-change.review',
      '*',
    ]);
  }

  async create(
    dto: CreateEmploymentChangeRequestDto,
    actor: { accountId: string; characterId: string },
  ) {
    const reason = dto.reason.trim();
    if (reason.length < 8) {
      throw new BadRequestException('reason must be at least 8 characters');
    }

    const belongsToSaed = await this.permissionsService.belongsToSaed(actor.characterId);
    if (belongsToSaed) {
      throw new ForbiddenException(
        'SAED members cannot request civilian employment changes',
      );
    }

    const character = await this.prismaService.character.findUnique({
      where: { id: actor.characterId },
      include: {
        occupations: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          include: { establishment: { select: establishmentSelect } },
        },
      },
    });
    if (!character) {
      throw new NotFoundException('Character was not found');
    }

    const requested = await this.prismaService.establishment.findFirst({
      where: {
        id: dto.requestedEstablishmentId,
        status: EstablishmentStatus.ACTIVE,
        isSelectable: true,
      },
    });
    if (!requested || isSaedOrganization(requested.name)) {
      throw new BadRequestException(
        'Invalid organization. Select an establishment from the catalog.',
      );
    }

    const currentOccupation = character.occupations?.[0] ?? null;
    const currentEstablishmentId = currentOccupation?.establishmentId ?? null;
    const currentOrganizationName = currentOccupation?.organization ?? null;

    if (currentEstablishmentId === requested.id) {
      throw new BadRequestException('You already belong to that organization');
    }

    const pending = await this.prismaService.employmentChangeRequest.findFirst({
      where: {
        characterId: actor.characterId,
        status: { in: OPEN_STATUSES },
      },
    });
    if (pending) {
      throw new BadRequestException(
        'You already have a pending employment change request',
      );
    }

    const created = await this.prismaService.employmentChangeRequest.create({
      data: {
        characterId: actor.characterId,
        currentEstablishmentId,
        currentOrganizationName,
        requestedEstablishmentId: requested.id,
        requestedOrganizationName: requested.name,
        reason,
        status: EmploymentChangeRequestStatus.PENDING,
      },
      include: requestInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.created',
      targetType: AUDIT_TARGET.EMPLOYMENT_CHANGE_REQUEST,
      targetId: created.id,
      metadata: {
        requestNumber: created.requestNumber,
        from: currentOrganizationName,
        to: requested.name,
        fromEstablishmentId: currentEstablishmentId,
        toEstablishmentId: requested.id,
        reason,
      },
    });

    await this.notifyHighCommand(created);

    return this.toDto(created);
  }

  async listMine(characterId: string) {
    const rows = await this.prismaService.employmentChangeRequest.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: requestInclude,
    });
    return rows.map((item) => this.toDto(item));
  }

  async list(
    query: SearchEmploymentChangeRequestDto,
    permissions: string[],
  ) {
    if (!this.canManage(permissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const where: Prisma.EmploymentChangeRequestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.characterId) where.characterId = query.characterId;
    if (query.requestedEstablishmentId) {
      where.requestedEstablishmentId = query.requestedEstablishmentId;
    }

    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { reason: { contains: q, mode: 'insensitive' } },
        { currentOrganizationName: { contains: q, mode: 'insensitive' } },
        { requestedOrganizationName: { contains: q, mode: 'insensitive' } },
        { rejectionReason: { contains: q, mode: 'insensitive' } },
        {
          character: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { account: { email: { contains: q, mode: 'insensitive' } } },
              { account: { username: { contains: q, mode: 'insensitive' } } },
            ],
          },
        },
      ];
    }

    const rows = await this.prismaService.employmentChangeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: requestInclude,
    });
    return rows.map((item) => this.toDto(item));
  }

  async getDashboard(permissions: string[]) {
    if (!this.canManage(permissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const [pending, underReview, approved, rejected, cancelled, recent] =
      await Promise.all([
        this.prismaService.employmentChangeRequest.count({
          where: { status: EmploymentChangeRequestStatus.PENDING },
        }),
        this.prismaService.employmentChangeRequest.count({
          where: { status: EmploymentChangeRequestStatus.UNDER_REVIEW },
        }),
        this.prismaService.employmentChangeRequest.count({
          where: { status: EmploymentChangeRequestStatus.APPROVED },
        }),
        this.prismaService.employmentChangeRequest.count({
          where: { status: EmploymentChangeRequestStatus.REJECTED },
        }),
        this.prismaService.employmentChangeRequest.count({
          where: { status: EmploymentChangeRequestStatus.CANCELLED },
        }),
        this.prismaService.employmentChangeRequest.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: requestInclude,
        }),
      ]);

    return {
      pending,
      underReview,
      approved,
      rejected,
      cancelled,
      recent: recent.map((item) => this.toDto(item)),
    };
  }

  async markUnderReview(
    id: string,
    actor: { accountId: string; characterId: string },
    dto: ReviewEmploymentChangeRequestDto,
  ) {
    const request = await this.requireOpen(id);
    const updated = await this.prismaService.employmentChangeRequest.update({
      where: { id },
      data: {
        status: EmploymentChangeRequestStatus.UNDER_REVIEW,
        internalNotes:
          dto.internalNotes === undefined
            ? request.internalNotes
            : dto.internalNotes?.trim() || null,
      },
      include: requestInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.under_review',
      targetType: AUDIT_TARGET.EMPLOYMENT_CHANGE_REQUEST,
      targetId: id,
      metadata: { requestNumber: request.requestNumber },
    });

    return this.toDto(updated);
  }

  async approve(
    id: string,
    actor: { accountId: string; characterId: string },
    dto: ReviewEmploymentChangeRequestDto,
  ) {
    const request = await this.requireOpen(id);
    const now = new Date();

    await this.charactersService.applyCivilianWorkplaceChange(
      request.characterId,
      request.requestedEstablishmentId,
      actor,
      {
        source: 'employment-change.approved',
        reason: request.reason,
      },
    );

    const updated = await this.prismaService.employmentChangeRequest.update({
      where: { id },
      data: {
        status: EmploymentChangeRequestStatus.APPROVED,
        approvedAt: now,
        approvedByCharacterId: actor.characterId,
        rejectedAt: null,
        rejectedByCharacterId: null,
        rejectionReason: null,
        internalNotes:
          dto.internalNotes === undefined
            ? request.internalNotes
            : dto.internalNotes?.trim() || null,
      },
      include: requestInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.approved',
      targetType: AUDIT_TARGET.EMPLOYMENT_CHANGE_REQUEST,
      targetId: id,
      metadata: {
        requestNumber: request.requestNumber,
        characterId: request.characterId,
        from: request.currentOrganizationName,
        to: request.requestedOrganizationName,
      },
    });

    await this.notifyRequester(updated, 'aprobada');
    return this.toDto(updated);
  }

  async reject(
    id: string,
    actor: { accountId: string; characterId: string },
    dto: ReviewEmploymentChangeRequestDto,
  ) {
    const request = await this.requireOpen(id);
    const rejectionReason = dto.rejectionReason?.trim();
    if (!rejectionReason || rejectionReason.length < 4) {
      throw new BadRequestException('rejectionReason is required');
    }

    const updated = await this.prismaService.employmentChangeRequest.update({
      where: { id },
      data: {
        status: EmploymentChangeRequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedByCharacterId: actor.characterId,
        rejectionReason,
        internalNotes:
          dto.internalNotes === undefined
            ? request.internalNotes
            : dto.internalNotes?.trim() || null,
      },
      include: requestInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.rejected',
      targetType: AUDIT_TARGET.EMPLOYMENT_CHANGE_REQUEST,
      targetId: id,
      metadata: {
        requestNumber: request.requestNumber,
        characterId: request.characterId,
        rejectionReason,
      },
    });

    await this.notifyRequester(updated, 'rechazada');
    return this.toDto(updated);
  }

  async cancel(
    id: string,
    actor: { accountId: string; characterId: string },
  ) {
    const request = await this.requireOpen(id);
    if (request.characterId !== actor.characterId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    const updated = await this.prismaService.employmentChangeRequest.update({
      where: { id },
      data: { status: EmploymentChangeRequestStatus.CANCELLED },
      include: requestInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.cancelled',
      targetType: AUDIT_TARGET.EMPLOYMENT_CHANGE_REQUEST,
      targetId: id,
      metadata: { requestNumber: request.requestNumber },
    });

    return this.toDto(updated);
  }

  async addInternalNotes(
    id: string,
    actor: { accountId: string; characterId: string },
    dto: ReviewEmploymentChangeRequestDto,
  ) {
    const request = await this.requireRequest(id);
    const notes = dto.internalNotes?.trim();
    if (!notes) {
      throw new BadRequestException('internalNotes is required');
    }

    const updated = await this.prismaService.employmentChangeRequest.update({
      where: { id },
      data: { internalNotes: notes },
      include: requestInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.notes_updated',
      targetType: AUDIT_TARGET.EMPLOYMENT_CHANGE_REQUEST,
      targetId: id,
      metadata: { requestNumber: request.requestNumber },
    });

    return this.toDto(updated);
  }

  async applyManual(
    characterId: string,
    establishmentId: string,
    actor: { accountId: string; characterId: string },
    reason?: string | null,
  ) {
    const updated = await this.charactersService.applyCivilianWorkplaceChange(
      characterId,
      establishmentId,
      actor,
      {
        source: 'employment-change.manual',
        reason: reason?.trim() || 'Manual administrative correction',
      },
    );

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'employment-change.manual_applied',
      targetType: AUDIT_TARGET.CHARACTER,
      targetId: characterId,
      metadata: {
        establishmentId,
        organization: updated.primaryOccupation?.organization ?? null,
        reason: reason?.trim() || null,
      },
    });

    return updated;
  }

  private async requireRequest(id: string) {
    const request = await this.prismaService.employmentChangeRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    if (!request) {
      throw new NotFoundException('Employment change request was not found');
    }
    return request;
  }

  private async requireOpen(id: string) {
    const request = await this.requireRequest(id);
    if (!OPEN_STATUSES.includes(request.status)) {
      throw new BadRequestException('Request is no longer open for review');
    }
    return request;
  }

  private async notifyHighCommand(
    request: Prisma.EmploymentChangeRequestGetPayload<{ include: typeof requestInclude }>,
  ) {
    const recipients = await this.prismaService.character.findMany({
      where: {
        roles: {
          some: { role: { slug: { in: [...HIGH_COMMAND_ROLE_SLUGS] } } },
        },
      },
      select: characterSelect,
    });

    const name = `${request.character.firstName} ${request.character.lastName}`;
    await this.notificationsService.createMany(
      recipients.map((item) => ({
        accountId: item.accountId,
        characterId: item.id,
        type: NotificationType.EMPLOYMENT_CHANGE_CREATED,
        title: 'Solicitud de cambio de empleo',
        body: `${name} solicita pasar de ${request.currentOrganizationName ?? 'Sin empleo'} a ${request.requestedOrganizationName}.`,
        href: '/admin/employment-change',
        metadata: {
          requestId: request.id,
          requestNumber: request.requestNumber,
        },
      })),
    );
  }

  private async notifyRequester(
    request: Prisma.EmploymentChangeRequestGetPayload<{ include: typeof requestInclude }>,
    outcomeLabel: string,
  ) {
    await this.notificationsService.create({
      accountId: request.character.accountId,
      characterId: request.character.id,
      type: NotificationType.EMPLOYMENT_CHANGE_STATUS,
      title: `Solicitud de empleo ${outcomeLabel}`,
      body:
        request.status === EmploymentChangeRequestStatus.APPROVED
          ? `Tu empleo fue actualizado a ${request.requestedOrganizationName}.`
          : `Tu solicitud hacia ${request.requestedOrganizationName} fue rechazada.${
              request.rejectionReason ? ` Motivo: ${request.rejectionReason}` : ''
            }`,
      href: '/settings',
      metadata: {
        requestId: request.id,
        status: request.status,
      },
    });
  }

  private toDto(
    request: Prisma.EmploymentChangeRequestGetPayload<{ include: typeof requestInclude }>,
  ) {
    return {
      id: request.id,
      requestNumber: request.requestNumber,
      status: request.status,
      reason: request.reason,
      internalNotes: request.internalNotes,
      rejectionReason: request.rejectionReason,
      currentOrganizationName: request.currentOrganizationName,
      requestedOrganizationName: request.requestedOrganizationName,
      currentEstablishment: request.currentEstablishment,
      requestedEstablishment: request.requestedEstablishment,
      character: {
        id: request.character.id,
        firstName: request.character.firstName,
        lastName: request.character.lastName,
        avatarUrl: request.character.avatarUrl,
        status: request.character.status,
        account: request.character.account,
        primaryOccupation: request.character.occupations?.[0]
          ? {
              organization: request.character.occupations[0].organization,
              position: request.character.occupations[0].position,
              establishmentId: request.character.occupations[0].establishmentId,
            }
          : null,
      },
      approvedByCharacter: request.approvedByCharacter,
      rejectedByCharacter: request.rejectedByCharacter,
      approvedAt: request.approvedAt?.toISOString() ?? null,
      rejectedAt: request.rejectedAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }
}
