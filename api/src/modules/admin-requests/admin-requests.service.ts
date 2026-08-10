import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminRequestEventType,
  AdminRequestPriority,
  AdminRequestStatus,
  AdminRequestType,
  NotificationType,
  Prisma,
  StaffStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { assertCaseChatOpen } from '../../common/utils/case-chat.util';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { StaffRatingsService } from '../staff-ratings/staff-ratings.service';
import {
  AssignAdminRequestDto,
  CreateAdminRequestDto,
  CreateAdminRequestMessageDto,
  CreateAdminRequestNoteDto,
  SearchAdminRequestsDto,
  UpdateAdminRequestPriorityDto,
  UpdateAdminRequestStatusDto,
} from './dto/admin-request.dto';

export const ADMIN_REQUEST_MANAGE_PERMISSIONS = [
  'admin-requests.manage',
  'admin-requests.assign',
  '*',
] as const;

const HIGH_COMMAND_ROLE_SLUGS = [
  'medical-director',
  'deputy-medical-director',
  'administrator',
] as const;

const INTERNAL_EVENT_TYPES = new Set<AdminRequestEventType>([
  AdminRequestEventType.INTERNAL_NOTE_ADDED,
]);

const OPEN_STATUSES: AdminRequestStatus[] = [
  AdminRequestStatus.PENDING,
  AdminRequestStatus.UNDER_REVIEW,
  AdminRequestStatus.IN_PROCESS,
  AdminRequestStatus.APPROVED,
];

const TERMINAL_ADMIN_REQUEST_STATUSES = new Set<AdminRequestStatus>([
  AdminRequestStatus.REJECTED,
  AdminRequestStatus.COMPLETED,
  AdminRequestStatus.CANCELLED,
]);

const characterSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  accountId: true,
} satisfies Prisma.CharacterSelect;

@Injectable()
export class AdminRequestsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
    private readonly mediaStorageService: MediaStorageService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly auditService: AuditService,
    private readonly staffRatingsService: StaffRatingsService,
  ) {}

  async canManage(characterId: string, permissions: string[] = []) {
    if (hasAnyPermission(permissions, [...ADMIN_REQUEST_MANAGE_PERMISSIONS])) {
      return true;
    }
    const roles = await this.permissionsService.getRoleSlugsForCharacter(characterId);
    return HIGH_COMMAND_ROLE_SLUGS.some((slug) => roles.includes(slug));
  }

  async getStats(characterId: string, permissions: string[]) {
    const where = await this.visibilityWhere(characterId, permissions);
    const [pending, open, completed, agreements, administrative] = await Promise.all([
      this.prismaService.adminRequest.count({
        where: { ...where, status: AdminRequestStatus.PENDING },
      }),
      this.prismaService.adminRequest.count({
        where: { ...where, status: { in: OPEN_STATUSES } },
      }),
      this.prismaService.adminRequest.count({
        where: { ...where, status: AdminRequestStatus.COMPLETED },
      }),
      this.prismaService.adminRequest.count({
        where: { ...where, type: AdminRequestType.AGREEMENT_SIGNING },
      }),
      this.prismaService.adminRequest.count({
        where: {
          ...where,
          type: {
            in: [
              AdminRequestType.ADMINISTRATIVE_APPOINTMENT,
              AdminRequestType.HIGH_COMMAND_MEETING,
              AdminRequestType.OTHER,
            ],
          },
        },
      }),
    ]);

    return { pending, open, completed, agreements, administrative };
  }

  async list(characterId: string, permissions: string[], query: SearchAdminRequestsDto = {}) {
    const canManage = await this.canManage(characterId, permissions);
    const where = await this.buildSearchWhere(characterId, permissions, query);

    const rows = await this.prismaService.adminRequest.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
      include: {
        requester: { select: characterSelect },
        assignee: { select: characterSelect },
        _count: { select: { messages: true } },
      },
    });

    return rows.map((row) => this.toListItem(row, canManage));
  }

  async getById(id: string, characterId: string, permissions: string[]) {
    const canManage = await this.canManage(characterId, permissions);
    const request = await this.prismaService.adminRequest.findUnique({
      where: { id },
      include: this.detailInclude(),
    });
    if (!request) {
      throw new NotFoundException('Administrative request was not found');
    }
    await this.assertCanView(request, characterId, permissions);

    const messages = await this.prismaService.adminRequestMessage.findMany({
      where: { adminRequestId: id },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: characterSelect } },
    });

    const notes = canManage
      ? await this.prismaService.adminRequestInternalNote.findMany({
          where: { adminRequestId: id },
          orderBy: { createdAt: 'desc' },
          include: { author: { select: characterSelect } },
        })
      : [];

    const events = (request.events ?? []).filter(
      (event) => canManage || !INTERNAL_EVENT_TYPES.has(event.type),
    );

    const rating = await this.staffRatingsService.getEligibility(id, characterId);
    const isRequester = request.requesterId === characterId;
    const isChatClosed = isAdminRequestChatClosed(request.status);

    return {
      ...this.toDetail(request, canManage),
      messages: messages.map((item) => this.toMessage(item)),
      internalNotes: notes.map((item) => this.toNote(item)),
      events: events.map((item) => this.toEvent(item)),
      canManage,
      isRequester,
      isChatClosed,
      canSendMessages: !isChatClosed,
      rating,
    };
  }

  async create(
    dto: CreateAdminRequestDto,
    actor: { accountId: string; characterId: string },
  ) {
    const created = await this.prismaService.adminRequest.create({
      data: {
        type: dto.type,
        subject: dto.subject.trim(),
        reason: dto.reason.trim(),
        priority: dto.priority ?? AdminRequestPriority.MEDIUM,
        requesterId: actor.characterId,
        events: {
          create: {
            actorId: actor.characterId,
            type: AdminRequestEventType.CREATED,
            message: 'Solicitud administrativa creada',
            metadata: { type: dto.type },
          },
        },
      },
      include: {
        requester: { select: characterSelect },
        assignee: { select: characterSelect },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'admin-requests.created',
      targetType: AUDIT_TARGET.ADMIN_REQUEST,
      targetId: created.id,
      metadata: {
        requestNumber: created.requestNumber,
        type: created.type,
        subject: created.subject,
      },
    });

    await this.notifyHighCommandOnCreate(created);

    this.realtimeGateway.emitToRoom(
      `admin-request-${created.requestNumber}`,
      'admin-requests:created',
      { id: created.id, requestNumber: created.requestNumber },
    );

    return this.getById(created.id, actor.characterId, ['admin-requests.read']);
  }

  async updateStatus(
    id: string,
    dto: UpdateAdminRequestStatusDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const current = await this.requireRequest(id);
    if (current.status === dto.status) {
      return this.getById(id, actor.characterId, actor.permissions);
    }

    const updated = await this.prismaService.adminRequest.update({
      where: { id },
      data: { status: dto.status },
      include: {
        requester: { select: characterSelect },
        assignee: { select: characterSelect },
      },
    });

    await this.addEvent(id, actor.characterId, AdminRequestEventType.STATUS_CHANGED, {
      message: `Estado actualizado a ${dto.status}`,
      metadata: { from: current.status, to: dto.status },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'admin-requests.status_changed',
      targetType: AUDIT_TARGET.ADMIN_REQUEST,
      targetId: id,
      metadata: { from: current.status, to: dto.status },
    });

    await this.notifyStatusChange(updated, actor.characterId);

    this.realtimeGateway.emitToRoom(
      `admin-request-${updated.requestNumber}`,
      'admin-requests:updated',
      { id, status: dto.status },
    );

    return this.getById(id, actor.characterId, actor.permissions);
  }

  async updatePriority(
    id: string,
    dto: UpdateAdminRequestPriorityDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const current = await this.requireRequest(id);

    const updated = await this.prismaService.adminRequest.update({
      where: { id },
      data: { priority: dto.priority },
    });

    await this.addEvent(id, actor.characterId, AdminRequestEventType.PRIORITY_CHANGED, {
      message: `Prioridad actualizada a ${dto.priority}`,
      metadata: { from: current.priority, to: dto.priority },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'admin-requests.priority_changed',
      targetType: AUDIT_TARGET.ADMIN_REQUEST,
      targetId: id,
      metadata: { from: current.priority, to: dto.priority },
    });

    this.realtimeGateway.emitToRoom(
      `admin-request-${updated.requestNumber}`,
      'admin-requests:updated',
      { id, priority: dto.priority },
    );

    return this.getById(id, actor.characterId, actor.permissions);
  }

  async assign(
    id: string,
    dto: AssignAdminRequestDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const assignee = await this.prismaService.character.findUnique({
      where: { id: dto.characterId },
      select: characterSelect,
    });
    if (!assignee) {
      throw new NotFoundException('Assignee character was not found');
    }

    const canBeAssignee = await this.canManage(assignee.id, []);
    if (!canBeAssignee) {
      throw new BadRequestException('Solo personal de Alto Mando puede ser asignado');
    }

    const current = await this.requireRequest(id);

    await this.prismaService.$transaction(async (tx) => {
      await tx.adminRequestAssignment.updateMany({
        where: { adminRequestId: id, unassignedAt: null },
        data: { unassignedAt: new Date(), isPrimary: false },
      });

      await tx.adminRequestAssignment.upsert({
        where: {
          adminRequestId_characterId: {
            adminRequestId: id,
            characterId: dto.characterId,
          },
        },
        create: {
          adminRequestId: id,
          characterId: dto.characterId,
          isPrimary: true,
        },
        update: {
          isPrimary: true,
          unassignedAt: null,
          assignedAt: new Date(),
        },
      });

      await tx.adminRequest.update({
        where: { id },
        data: {
          assigneeId: dto.characterId,
          ...(current.status === AdminRequestStatus.PENDING
            ? { status: AdminRequestStatus.UNDER_REVIEW }
            : {}),
        },
      });
    });

    const request = await this.requireRequest(id);

    await this.addEvent(id, actor.characterId, AdminRequestEventType.ASSIGNEE_CHANGED, {
      message: `Asignado a ${assignee.firstName} ${assignee.lastName}`,
      metadata: { assigneeId: assignee.id },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'admin-requests.assigned',
      targetType: AUDIT_TARGET.ADMIN_REQUEST,
      targetId: id,
      metadata: { assigneeId: assignee.id },
    });

    await this.notificationsService.create({
      accountId: assignee.accountId,
      characterId: assignee.id,
      type: NotificationType.ADMIN_REQUEST_ASSIGNED,
      title: `Solicitud #${request.requestNumber}`,
      body: 'Se te ha asignado una solicitud administrativa.',
      href: `/admin-requests?id=${id}`,
      metadata: { adminRequestId: id },
    });

    this.realtimeGateway.emitToRoom(
      `admin-request-${request.requestNumber}`,
      'admin-requests:updated',
      { id, assigneeId: assignee.id },
    );

    return this.getById(id, actor.characterId, actor.permissions);
  }

  async addMessage(
    id: string,
    dto: CreateAdminRequestMessageDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.getById(id, actor.characterId, actor.permissions);
    const request = await this.requireRequest(id);
    assertCaseChatOpen(!isAdminRequestChatClosed(request.status), 'solicitud');

    const body = dto.body?.trim() || null;
    let imageUrl: string | null = null;
    if (dto.imageDataUrl?.trim()) {
      imageUrl = await this.mediaStorageService.resolveImageUrl(
        dto.imageDataUrl,
        'admin-request-chat',
        randomUUID(),
      );
      if (!imageUrl) {
        throw new BadRequestException('Imagen inválida');
      }
    }

    if (!body && !imageUrl) {
      throw new BadRequestException('El mensaje debe incluir texto o una imagen');
    }

    const message = await this.prismaService.adminRequestMessage.create({
      data: {
        adminRequestId: id,
        authorId: actor.characterId,
        body,
        imageUrl,
      },
      include: { author: { select: characterSelect } },
    });

    await this.addEvent(id, actor.characterId, AdminRequestEventType.MESSAGE_SENT, {
      message: 'Nuevo mensaje en el chat',
      metadata: { messageId: message.id, hasImage: Boolean(imageUrl) },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'admin-requests.message_sent',
      targetType: AUDIT_TARGET.ADMIN_REQUEST,
      targetId: id,
      metadata: { messageId: message.id, hasImage: Boolean(imageUrl) },
    });

    const recipients = await this.collectParticipants(request);
    for (const recipient of recipients) {
      if (recipient.characterId === actor.characterId) continue;
      await this.notificationsService.create({
        accountId: recipient.accountId,
        characterId: recipient.characterId,
        type: NotificationType.ADMIN_REQUEST_MESSAGE,
        title: `Solicitud #${request.requestNumber}`,
        body: imageUrl && !body ? 'Nuevo adjunto en el chat.' : 'Nuevo mensaje en el chat.',
        href: `/admin-requests?id=${id}`,
        metadata: { adminRequestId: id },
      });
    }

    const payload = {
      ...this.toMessage(message),
      adminRequestId: id,
      requestNumber: request.requestNumber,
    };
    this.realtimeGateway.emitToRoom(
      `admin-request-${request.requestNumber}`,
      'admin-requests:message',
      payload,
    );
    for (const recipient of recipients) {
      this.realtimeGateway.emitToCharacter(
        recipient.characterId,
        'admin-requests:message',
        payload,
      );
    }

    return payload;
  }

  async addInternalNote(
    id: string,
    dto: CreateAdminRequestNoteDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const request = await this.requireRequest(id);

    const note = await this.prismaService.adminRequestInternalNote.create({
      data: {
        adminRequestId: id,
        authorId: actor.characterId,
        body: dto.body.trim(),
      },
      include: { author: { select: characterSelect } },
    });

    await this.addEvent(id, actor.characterId, AdminRequestEventType.INTERNAL_NOTE_ADDED, {
      message: 'Nota interna agregada',
      metadata: { noteId: note.id },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'admin-requests.note_added',
      targetType: AUDIT_TARGET.ADMIN_REQUEST,
      targetId: id,
      metadata: { noteId: note.id },
    });

    const managers = await this.findHighCommand();
    for (const manager of managers) {
      if (manager.id === actor.characterId) continue;
      await this.notificationsService.create({
        accountId: manager.accountId,
        characterId: manager.id,
        type: NotificationType.ADMIN_REQUEST_NOTE,
        title: `Solicitud #${request.requestNumber}`,
        body: 'Nueva nota interna.',
        href: `/admin-requests?id=${id}`,
        metadata: { adminRequestId: id },
      });
    }

    this.realtimeGateway.emitToRoom(
      `admin-request-${request.requestNumber}`,
      'admin-requests:note',
      { id: note.id },
    );

    return this.toNote(note);
  }

  async searchAssignees(query: string) {
    const term = query.trim();
    if (term.length < 2) return [];

    const characters = await this.prismaService.character.findMany({
      where: {
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          {
            staffProfile: {
              employeeNumber: { contains: term, mode: 'insensitive' },
              status: StaffStatus.ACTIVE,
            },
          },
        ],
      },
      take: 30,
      include: {
        roles: { include: { role: true } },
        staffProfile: {
          select: {
            employeeNumber: true,
            rank: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    const eligible = [];
    for (const character of characters) {
      const roles = character.roles.map((item) => item.role.slug);
      if (!HIGH_COMMAND_ROLE_SLUGS.some((slug) => roles.includes(slug))) continue;
      eligible.push({
        id: character.id,
        firstName: character.firstName,
        lastName: character.lastName,
        avatarUrl: character.avatarUrl,
        employeeNumber: character.staffProfile?.employeeNumber ?? null,
        rankLabel: character.staffProfile?.rank?.name ?? null,
        departmentName: character.staffProfile?.department?.name ?? null,
      });
      if (eligible.length >= 15) break;
    }
    return eligible;
  }

  private async visibilityWhere(characterId: string, permissions: string[]) {
    if (await this.canManage(characterId, permissions)) {
      return {};
    }
    return {
      OR: [
        { requesterId: characterId },
        { assigneeId: characterId },
        {
          assignments: {
            some: { characterId, unassignedAt: null },
          },
        },
      ],
    };
  }

  private async buildSearchWhere(
    characterId: string,
    permissions: string[],
    query: SearchAdminRequestsDto,
  ): Promise<Prisma.AdminRequestWhereInput> {
    const base = await this.visibilityWhere(characterId, permissions);
    const and: Prisma.AdminRequestWhereInput[] = [];
    if (Object.keys(base).length) and.push(base);
    if (query.status) and.push({ status: query.status });
    if (query.type) and.push({ type: query.type });
    if (query.priority) and.push({ priority: query.priority });
    if (query.assigneeId) and.push({ assigneeId: query.assigneeId });
    if (query.from || query.to) {
      and.push({
        createdAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? endOfDay(new Date(query.to)) : undefined,
        },
      });
    }

    const term = query.q?.trim();
    if (term) {
      const asNumber = Number.parseInt(term, 10);
      and.push({
        OR: [
          ...(Number.isFinite(asNumber) ? [{ requestNumber: asNumber }] : []),
          { subject: { contains: term, mode: 'insensitive' } },
          { reason: { contains: term, mode: 'insensitive' } },
          { requester: { firstName: { contains: term, mode: 'insensitive' } } },
          { requester: { lastName: { contains: term, mode: 'insensitive' } } },
          { assignee: { firstName: { contains: term, mode: 'insensitive' } } },
          { assignee: { lastName: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    return and.length ? { AND: and } : {};
  }

  private async assertCanView(
    request: { id: string; requesterId: string; assigneeId: string | null },
    characterId: string,
    permissions: string[],
  ) {
    if (await this.canManage(characterId, permissions)) return;
    if (request.requesterId === characterId) return;
    if (request.assigneeId === characterId) return;

    const assigned = await this.prismaService.adminRequestAssignment.findFirst({
      where: {
        adminRequestId: request.id,
        characterId,
        unassignedAt: null,
      },
    });
    if (assigned) return;

    throw new ForbiddenException('No tienes acceso a esta solicitud');
  }

  private async assertCanManage(characterId: string, permissions: string[]) {
    if (!(await this.canManage(characterId, permissions))) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async requireRequest(id: string) {
    const request = await this.prismaService.adminRequest.findUnique({
      where: { id },
      include: {
        requester: { select: characterSelect },
        assignee: { select: characterSelect },
      },
    });
    if (!request) {
      throw new NotFoundException('Administrative request was not found');
    }
    return request;
  }

  private detailInclude() {
    return {
      requester: { select: characterSelect },
      assignee: { select: characterSelect },
      assignments: {
        where: { unassignedAt: null },
        include: { character: { select: characterSelect } },
      },
      events: {
        orderBy: { createdAt: 'desc' as const },
        take: 40,
        include: {
          actor: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    } satisfies Prisma.AdminRequestInclude;
  }

  private async addEvent(
    adminRequestId: string,
    actorId: string | null,
    type: AdminRequestEventType,
    input: { message: string; metadata?: Prisma.InputJsonValue },
  ) {
    await this.prismaService.adminRequestEvent.create({
      data: {
        adminRequestId,
        actorId,
        type,
        message: input.message,
        metadata: input.metadata,
      },
    });
  }

  private async findHighCommand() {
    return this.prismaService.character.findMany({
      where: {
        roles: {
          some: {
            role: { slug: { in: [...HIGH_COMMAND_ROLE_SLUGS] } },
          },
        },
      },
      select: characterSelect,
    });
  }

  private async notifyHighCommandOnCreate(
    request: {
      id: string;
      requestNumber: number;
      subject: string;
      requesterId: string;
    },
  ) {
    const recipients = await this.findHighCommand();
    await this.notificationsService.createMany(
      recipients
        .filter((item) => item.id !== request.requesterId)
        .map((item) => ({
          accountId: item.accountId,
          characterId: item.id,
          type: NotificationType.ADMIN_REQUEST_CREATED,
          title: `Nueva solicitud #${request.requestNumber}`,
          body: request.subject,
          href: `/admin-requests?id=${request.id}`,
          metadata: { adminRequestId: request.id },
        })),
    );
  }

  private async notifyStatusChange(
    request: {
      id: string;
      requestNumber: number;
      status: AdminRequestStatus;
      type?: AdminRequestType;
      requester: { id: string; accountId: string };
      assignee: { id: string; accountId: string } | null;
    },
    actorCharacterId: string,
  ) {
    const recipients = await this.collectParticipants(request);
    const ratingInvite =
      request.status === AdminRequestStatus.COMPLETED &&
      request.type === AdminRequestType.ADMINISTRATIVE_APPOINTMENT;

    for (const recipient of recipients) {
      if (recipient.characterId === actorCharacterId) continue;
      const isRequester = recipient.characterId === request.requester.id;
      await this.notificationsService.create({
        accountId: recipient.accountId,
        characterId: recipient.characterId,
        type: NotificationType.ADMIN_REQUEST_STATUS,
        title: `Solicitud #${request.requestNumber}`,
        body:
          ratingInvite && isRequester
            ? 'Tu cita administrativa fue finalizada. Ya puedes valorar la atención recibida.'
            : `Estado actualizado: ${request.status}`,
        href: `/admin-requests?id=${request.id}`,
        metadata: {
          adminRequestId: request.id,
          status: request.status,
          ratingEligible: ratingInvite && isRequester,
        },
      });
    }
  }

  private async collectParticipants(request: {
    id?: string;
    requester: { id: string; accountId: string };
    assignee: { id: string; accountId: string } | null;
  }) {
    const map = new Map<string, { characterId: string; accountId: string }>();
    map.set(request.requester.id, {
      characterId: request.requester.id,
      accountId: request.requester.accountId,
    });
    if (request.assignee) {
      map.set(request.assignee.id, {
        characterId: request.assignee.id,
        accountId: request.assignee.accountId,
      });
    }
    if (request.id) {
      const assignments = await this.prismaService.adminRequestAssignment.findMany({
        where: { adminRequestId: request.id, unassignedAt: null },
        include: { character: { select: characterSelect } },
      });
      for (const item of assignments) {
        map.set(item.character.id, {
          characterId: item.character.id,
          accountId: item.character.accountId,
        });
      }
    }
    return [...map.values()];
  }

  private toListItem(
    row: {
      id: string;
      requestNumber: number;
      type: AdminRequestType;
      status: AdminRequestStatus;
      priority: AdminRequestPriority;
      subject: string;
      createdAt: Date;
      updatedAt: Date;
      requester: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
      assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
      _count: { messages: number };
    },
    canManage: boolean,
  ) {
    return {
      id: row.id,
      requestNumber: row.requestNumber,
      type: row.type,
      status: row.status,
      priority: row.priority,
      subject: row.subject,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      messageCount: row._count.messages,
      requester: {
        id: row.requester.id,
        fullName: `${row.requester.firstName} ${row.requester.lastName}`,
        avatarUrl: row.requester.avatarUrl,
      },
      assignee: row.assignee
        ? {
            id: row.assignee.id,
            fullName: `${row.assignee.firstName} ${row.assignee.lastName}`,
            avatarUrl: row.assignee.avatarUrl,
          }
        : null,
      canManage,
    };
  }

  private toDetail(
    row: Prisma.AdminRequestGetPayload<{ include: ReturnType<AdminRequestsService['detailInclude']> }>,
    canManage: boolean,
  ) {
    return {
      id: row.id,
      requestNumber: row.requestNumber,
      type: row.type,
      status: row.status,
      priority: row.priority,
      subject: row.subject,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      requester: {
        id: row.requester.id,
        fullName: `${row.requester.firstName} ${row.requester.lastName}`,
        avatarUrl: row.requester.avatarUrl,
      },
      assignee: row.assignee
        ? {
            id: row.assignee.id,
            fullName: `${row.assignee.firstName} ${row.assignee.lastName}`,
            avatarUrl: row.assignee.avatarUrl,
          }
        : null,
      assignments: row.assignments.map((item) => ({
        id: item.id,
        isPrimary: item.isPrimary,
        character: {
          id: item.character.id,
          fullName: `${item.character.firstName} ${item.character.lastName}`,
          avatarUrl: item.character.avatarUrl,
        },
      })),
      canManage,
    };
  }

  private toMessage(
    message: Prisma.AdminRequestMessageGetPayload<{
      include: { author: { select: typeof characterSelect } };
    }>,
  ) {
    return {
      id: message.id,
      body: message.body,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
      author: {
        id: message.author.id,
        fullName: `${message.author.firstName} ${message.author.lastName}`,
        avatarUrl: message.author.avatarUrl,
      },
    };
  }

  private toNote(
    note: Prisma.AdminRequestInternalNoteGetPayload<{
      include: { author: { select: typeof characterSelect } };
    }>,
  ) {
    return {
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      author: {
        id: note.author.id,
        fullName: `${note.author.firstName} ${note.author.lastName}`,
      },
    };
  }

  private toEvent(
    event: Prisma.AdminRequestEventGetPayload<{
      include: { actor: { select: { id: true; firstName: true; lastName: true } } };
    }>,
  ) {
    return {
      id: event.id,
      type: event.type,
      message: event.message,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
      actor: event.actor
        ? {
            id: event.actor.id,
            fullName: `${event.actor.firstName} ${event.actor.lastName}`,
          }
        : null,
    };
  }
}

function isAdminRequestChatClosed(status: AdminRequestStatus): boolean {
  return TERMINAL_ADMIN_REQUEST_STATUSES.has(status);
}

function endOfDay(date: Date) {
  const next = new Date(date.getTime());
  next.setUTCHours(23, 59, 59, 999);
  return next;
}
