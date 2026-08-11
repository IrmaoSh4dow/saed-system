import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentEventType,
  AppointmentStatus,
  NotificationType,
  StaffStatus,
  Prisma,
} from '@prisma/client';
import { assertCaseChatOpen } from '../../common/utils/case-chat.util';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { StaffRatingsService } from '../staff-ratings/staff-ratings.service';
import {
  AssignAppointmentStaffDto,
  CreateAppointmentDto,
  CreateAppointmentMessageDto,
  CreateAppointmentNoteDto,
  TransferAppointmentDepartmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';

export const APPOINTMENT_MANAGE_PERMISSIONS = [
  'appointments.manage',
  'appointments.assign',
  '*',
] as const;

const MANAGEMENT_ROLE_SLUGS = ['medical-director', 'deputy-medical-director', 'administrator'];

/** Events never shown to the requesting citizen. */
const INTERNAL_EVENT_TYPES = new Set<AppointmentEventType>([
  AppointmentEventType.INTERNAL_NOTE_ADDED,
]);

const TERMINAL_APPOINTMENT_STATUSES = new Set<AppointmentStatus>([
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.REJECTED,
  AppointmentStatus.NO_SHOW,
]);

const appointmentAssignmentInclude = {
  where: { unassignedAt: null },
  include: {
    character: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        accountId: true,
        staffProfile: {
          select: {
            id: true,
            employeeNumber: true,
            status: true,
            department: { select: { id: true, name: true, slug: true, imageUrl: true } },
            rank: { select: { id: true, name: true } },
          },
        },
      },
    },
  },
} as const;

/** Detail/write paths: recent events included. */
const appointmentInclude = {
  requester: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, accountId: true },
  },
  department: { select: { id: true, name: true, slug: true, imageUrl: true } },
  assignments: appointmentAssignmentInclude,
  events: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: {
      actor: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.AppointmentInclude;

/** List cards only need case metadata + assignee — skip events payloads. */
const appointmentListInclude = {
  requester: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, accountId: true },
  },
  department: { select: { id: true, name: true, slug: true, imageUrl: true } },
  assignments: appointmentAssignmentInclude,
} satisfies Prisma.AppointmentInclude;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly staffRatingsService: StaffRatingsService,
  ) {}

  async canManageAppointments(characterId: string, permissions: string[] = []) {
    if (hasAnyPermission(permissions, [...APPOINTMENT_MANAGE_PERMISSIONS])) {
      return true;
    }

    const roles = await this.permissionsService.getRoleSlugsForCharacter(characterId);
    return MANAGEMENT_ROLE_SLUGS.some((slug) => roles.includes(slug));
  }

  async searchStaff(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    return this.prismaService.staffProfile.findMany({
      where: {
        status: StaffStatus.ACTIVE,
        OR: [
          { employeeNumber: { contains: term, mode: 'insensitive' } },
          { character: { firstName: { contains: term, mode: 'insensitive' } } },
          { character: { lastName: { contains: term, mode: 'insensitive' } } },
        ],
      },
      take: 20,
      orderBy: { employeeNumber: 'asc' },
      include: {
        character: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        rank: true,
        department: true,
      },
    });
  }

  searchDepartments() {
    return this.prismaService.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listForCharacter(characterId: string, permissions: string[]) {
    const canManage = await this.canManageAppointments(characterId, permissions);

    const appointments = canManage
      ? await this.prismaService.appointment.findMany({
          include: appointmentListInclude,
          orderBy: { createdAt: 'desc' },
        })
      : await this.prismaService.appointment.findMany({
          where: {
            OR: [
              { requesterId: characterId },
              { assignments: { some: { characterId, unassignedAt: null } } },
            ],
          },
          include: appointmentListInclude,
          orderBy: { createdAt: 'desc' },
        });

    return appointments.map((appointment) => this.toAppointmentSummary(appointment));
  }

  async getById(id: string, characterId: string, permissions: string[]) {
    const appointment = await this.prismaService.appointment.findUnique({
      where: { id },
      include: {
        ...appointmentInclude,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment was not found');
    }

    const canManage = await this.canManageAppointments(characterId, permissions);
    const isRequester = appointment.requesterId === characterId;
    const isAssignee = appointment.assignments.some((item) => item.characterId === characterId);

    if (!canManage && !isRequester && !isAssignee) {
      throw new ForbiddenException('You cannot access this appointment');
    }

    const canSeeInternal = canManage || isAssignee;
    const visibleEvents = appointment.events
      .filter((event) => canSeeInternal || !INTERNAL_EVENT_TYPES.has(event.type))
      .map((event) => ({
        ...event,
        visibleToCitizen: !INTERNAL_EVENT_TYPES.has(event.type),
      }));

    const rating = await this.staffRatingsService.getAppointmentEligibility(
      id,
      characterId,
    );

    return {
      ...appointment,
      preferredDate: toDateOnlyString(appointment.preferredDate),
      scheduledAt: appointment.scheduledAt?.toISOString() ?? null,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      assignee: pickPrimaryAssignee(appointment.assignments),
      internalNotes: canSeeInternal ? appointment.internalNotes : [],
      events: visibleEvents,
      room: `appointment-${appointment.caseNumber}`,
      canManage,
      canSeeInternal,
      isRequester,
      isAssignee,
      isChatClosed: isAppointmentChatClosed(appointment.status),
      canSendMessages: !isAppointmentChatClosed(appointment.status),
      rating,
    };
  }

  async create(dto: CreateAppointmentDto, actor: { accountId: string; characterId: string }) {
    const appointment = await this.prismaService.appointment.create({
      data: {
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description.trim(),
        preferredDate: parseDateOnly(dto.preferredDate),
        status: AppointmentStatus.PENDING,
        requesterId: actor.characterId,
        events: {
          create: {
            actorId: actor.characterId,
            type: AppointmentEventType.CREATED,
            message: 'Cita creada',
            metadata: { type: dto.type },
          },
        },
      },
      include: appointmentInclude,
    });

    await this.notifyManagementOnCreate(appointment);

    this.realtimeGateway.emitToRoom(`appointment-${appointment.caseNumber}`, 'appointments:created', {
      id: appointment.id,
      caseNumber: appointment.caseNumber,
    });

    return appointment;
  }

  async updateStatus(
    id: string,
    dto: UpdateAppointmentStatusDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const existing = await this.requireAppointment(id);

    const appointment = await this.prismaService.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: appointmentInclude,
    });

    await this.addEvent(id, actor.characterId, AppointmentEventType.STATUS_CHANGED, {
      message: `Estado cambiado a ${dto.status}`,
      metadata: { from: existing.status, to: dto.status },
    });

    const ratingInvite =
      appointment.status === AppointmentStatus.COMPLETED &&
      appointment.assignments.some((item) => item.character.staffProfile);

    await this.notifyParticipants(appointment, actor.characterId, {
      type: NotificationType.APPOINTMENT_STATUS,
      title: `Cita #${appointment.caseNumber}`,
      bodyFor: (recipientCharacterId) =>
        ratingInvite && recipientCharacterId === appointment.requesterId
          ? 'Tu cita fue finalizada. Ya puedes valorar la atención recibida.'
          : `Estado actualizado: ${appointment.status}`,
    });

    this.realtimeGateway.emitToRoom(
      `appointment-${appointment.caseNumber}`,
      'appointments:updated',
      { id: appointment.id, status: appointment.status },
    );

    return appointment;
  }

  async assignStaff(
    id: string,
    dto: AssignAppointmentStaffDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    await this.requireAppointment(id);

    const assignee = await this.prismaService.character.findUnique({
      where: { id: dto.characterId },
      select: {
        id: true,
        accountId: true,
        firstName: true,
        lastName: true,
        staffProfile: { select: { status: true } },
      },
    });
    if (!assignee) {
      throw new NotFoundException('Staff character was not found');
    }
    if (assignee.staffProfile?.status !== StaffStatus.ACTIVE) {
      throw new BadRequestException('Only active staff members can be assigned');
    }

    if (dto.isPrimary) {
      await this.prismaService.appointmentAssignment.updateMany({
        where: { appointmentId: id, unassignedAt: null },
        data: { isPrimary: false },
      });
    }

    const assignment = await this.prismaService.appointmentAssignment.upsert({
      where: {
        appointmentId_characterId: {
          appointmentId: id,
          characterId: assignee.id,
        },
      },
      update: {
        unassignedAt: null,
        isPrimary: dto.isPrimary ?? false,
        assignedAt: new Date(),
      },
      create: {
        appointmentId: id,
        characterId: assignee.id,
        isPrimary: dto.isPrimary ?? true,
      },
    });

    await this.addEvent(id, actor.characterId, AppointmentEventType.STAFF_ASSIGNED, {
      message: `Personal asignado: ${assignee.firstName} ${assignee.lastName}`,
      metadata: { characterId: assignee.id },
    });

    let appointment = await this.requireAppointment(id);

    await this.notificationsService.create({
      accountId: assignee.accountId,
      characterId: assignee.id,
      type: NotificationType.APPOINTMENT_ASSIGNED,
      title: `Cita #${appointment.caseNumber}`,
      body: 'Se te ha asignado a esta cita.',
      href: `/appointments?id=${appointment.id}`,
      metadata: { appointmentId: appointment.id },
    });

    if (appointment.status === AppointmentStatus.PENDING) {
      appointment = await this.prismaService.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.SCHEDULED },
        include: appointmentInclude,
      });
      await this.addEvent(id, actor.characterId, AppointmentEventType.STATUS_CHANGED, {
        message: 'Estado cambiado a SCHEDULED',
        metadata: { from: AppointmentStatus.PENDING, to: AppointmentStatus.SCHEDULED },
      });
    }

    this.realtimeGateway.emitToRoom(
      `appointment-${appointment.caseNumber}`,
      'appointments:updated',
      { id, assignmentId: assignment.id },
    );

    return this.getById(id, actor.characterId, actor.permissions);
  }

  async transferDepartment(
    id: string,
    dto: TransferAppointmentDepartmentDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const existing = await this.requireAppointment(id);

    const department = await this.prismaService.department.findFirst({
      where: { id: dto.departmentId, isActive: true },
    });
    if (!department) {
      throw new BadRequestException('Department was not found');
    }

    const appointment = await this.prismaService.appointment.update({
      where: { id },
      data: { departmentId: dto.departmentId },
      include: appointmentInclude,
    });

    await this.addEvent(id, actor.characterId, AppointmentEventType.DEPARTMENT_TRANSFERRED, {
      message: `Derivada al departamento: ${department.name}`,
      metadata: {
        fromDepartmentId: existing.departmentId,
        toDepartmentId: dto.departmentId,
        notes: dto.notes ?? null,
      },
    });

    const supervisors = await this.prismaService.departmentSupervisor.findMany({
      where: { departmentId: dto.departmentId },
      include: {
        staffProfile: {
          select: { character: { select: { id: true, accountId: true } } },
        },
      },
    });

    await this.notificationsService.createMany(
      supervisors.map((item) => ({
        accountId: item.staffProfile.character.accountId,
        characterId: item.staffProfile.character.id,
        type: NotificationType.APPOINTMENT_STATUS,
        title: `Cita derivada #${appointment.caseNumber}`,
        body: appointment.title,
        href: `/appointments?id=${appointment.id}`,
        metadata: { appointmentId: appointment.id, departmentId: dto.departmentId },
      })),
    );

    this.realtimeGateway.emitToRoom(
      `appointment-${appointment.caseNumber}`,
      'appointments:updated',
      { id, departmentId: dto.departmentId },
    );

    return appointment;
  }

  async addMessage(
    id: string,
    dto: CreateAppointmentMessageDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.getById(id, actor.characterId, actor.permissions);
    const appointment = await this.requireAppointment(id);
    assertCaseChatOpen(!isAppointmentChatClosed(appointment.status), 'cita');

    const message = await this.prismaService.appointmentMessage.create({
      data: {
        appointmentId: id,
        authorId: actor.characterId,
        body: dto.body.trim(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await this.addEvent(id, actor.characterId, AppointmentEventType.MESSAGE_SENT, {
      message: 'Nuevo mensaje en el chat',
      metadata: { messageId: message.id },
    });

    await this.notifyParticipants(appointment, actor.characterId, {
      type: NotificationType.APPOINTMENT_MESSAGE,
      title: `Cita #${appointment.caseNumber}`,
      body: 'Nuevo mensaje en el chat de la cita.',
    });

    const payload = {
      ...message,
      appointmentId: id,
      caseNumber: appointment.caseNumber,
      author: message.author
        ? {
            ...message.author,
            fullName: `${message.author.firstName} ${message.author.lastName}`,
          }
        : null,
      createdAt:
        message.createdAt instanceof Date
          ? message.createdAt.toISOString()
          : message.createdAt,
    };

    this.realtimeGateway.emitToRoom(
      `appointment-${appointment.caseNumber}`,
      'appointments:message',
      payload,
    );

    const recipients = await this.collectParticipants(appointment);
    for (const recipient of recipients) {
      this.realtimeGateway.emitToCharacter(
        recipient.characterId,
        'appointments:message',
        payload,
      );
    }

    return payload;
  }

  async addInternalNote(
    id: string,
    dto: CreateAppointmentNoteDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    const appointment = await this.requireAppointment(id);
    await this.assertCanAddNote(appointment, actor.characterId, actor.permissions);

    const note = await this.prismaService.appointmentInternalNote.create({
      data: {
        appointmentId: id,
        authorId: actor.characterId,
        body: dto.body.trim(),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.addEvent(id, actor.characterId, AppointmentEventType.INTERNAL_NOTE_ADDED, {
      message: 'Nota interna agregada',
      metadata: { noteId: note.id },
    });

    this.realtimeGateway.emitToRoom(`appointment-${appointment.caseNumber}`, 'appointments:note', {
      id: note.id,
    });

    return note;
  }

  private async notifyManagementOnCreate(
    appointment: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>,
  ) {
    const managers = await this.findManagementStakeholders();
    await this.notificationsService.createMany(
      managers.map((manager) => ({
        accountId: manager.accountId,
        characterId: manager.id,
        type: NotificationType.APPOINTMENT_CREATED,
        title: `Nueva cita #${appointment.caseNumber}`,
        body: appointment.title,
        href: `/appointments?id=${appointment.id}`,
        metadata: { appointmentId: appointment.id },
      })),
    );
  }

  private async notifyParticipants(
    appointment: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>,
    actorCharacterId: string,
    payload: {
      type: NotificationType;
      title: string;
      body?: string;
      bodyFor?: (recipientCharacterId: string) => string;
    },
  ) {
    const recipients = await this.collectParticipants(appointment);
    for (const recipient of recipients) {
      if (recipient.characterId === actorCharacterId) {
        continue;
      }
      const body =
        payload.bodyFor?.(recipient.characterId) ?? payload.body ?? '';
      await this.notificationsService.create({
        accountId: recipient.accountId,
        characterId: recipient.characterId,
        type: payload.type,
        title: payload.title,
        body,
        href: `/appointments?id=${appointment.id}`,
        metadata: { appointmentId: appointment.id },
      });
    }
  }

  private async findManagementStakeholders() {
    return this.prismaService.character.findMany({
      where: {
        roles: {
          some: { role: { slug: { in: MANAGEMENT_ROLE_SLUGS } } },
        },
      },
      select: { id: true, accountId: true },
    });
  }

  private async collectParticipants(
    appointment: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>,
  ) {
    const map = new Map<string, { characterId: string; accountId: string }>();
    map.set(appointment.requesterId, {
      characterId: appointment.requester.id,
      accountId: appointment.requester.accountId,
    });
    for (const assignment of appointment.assignments) {
      map.set(assignment.characterId, {
        characterId: assignment.character.id,
        accountId: assignment.character.accountId,
      });
    }
    return [...map.values()];
  }

  private async addEvent(
    appointmentId: string,
    actorId: string | null,
    type: AppointmentEventType,
    payload: { message: string; metadata?: Prisma.InputJsonValue },
  ) {
    return this.prismaService.appointmentEvent.create({
      data: {
        appointmentId,
        actorId,
        type,
        message: payload.message,
        metadata: payload.metadata,
      },
    });
  }

  private async requireAppointment(id: string) {
    const appointment = await this.prismaService.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException('Appointment was not found');
    }
    return appointment;
  }

  private async assertCanManage(characterId: string, permissions: string[]) {
    const allowed = await this.canManageAppointments(characterId, permissions);
    if (!allowed) {
      throw new ForbiddenException('Only staff management can manage appointments');
    }
  }

  private async assertCanAddNote(
    appointment: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>,
    characterId: string,
    permissions: string[],
  ) {
    const canManage = await this.canManageAppointments(characterId, permissions);
    const isAssignee = appointment.assignments.some((item) => item.characterId === characterId);
    if (!canManage && !isAssignee) {
      throw new ForbiddenException('Only management or assigned staff can add internal notes');
    }
  }

  private toAppointmentSummary(
    appointment: Prisma.AppointmentGetPayload<{ include: typeof appointmentListInclude }>,
  ) {
    return {
      ...appointment,
      preferredDate: toDateOnlyString(appointment.preferredDate),
      scheduledAt: appointment.scheduledAt?.toISOString() ?? null,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      assignee: pickPrimaryAssignee(appointment.assignments),
    };
  }
}

function isAppointmentChatClosed(status: AppointmentStatus): boolean {
  return TERMINAL_APPOINTMENT_STATUSES.has(status);
}

function pickPrimaryAssignee(
  assignments: Prisma.AppointmentGetPayload<{ include: typeof appointmentListInclude }>['assignments'],
) {
  const active = assignments.filter((item) => !item.unassignedAt);
  const primary = active.find((item) => item.isPrimary) ?? active[0] ?? null;
  if (!primary) {
    return null;
  }

  const staff = primary.character.staffProfile;
  return {
    characterId: primary.character.id,
    firstName: primary.character.firstName,
    lastName: primary.character.lastName,
    avatarUrl: primary.character.avatarUrl,
    employeeNumber: staff?.employeeNumber ?? null,
    departmentName: staff?.department?.name ?? null,
    rankLabel: staff?.rank?.name ?? null,
    isPrimary: primary.isPrimary,
    assignedAt: primary.assignedAt.toISOString(),
  };
}

function toDateOnlyString(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

function parseDateOnly(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid preferredDate');
  }
  return date;
}
