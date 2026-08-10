import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplaintEventType,
  ComplaintEvidenceType,
  ComplaintStatus,
  NotificationType,
  StaffStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { assertCaseChatOpen } from '../../common/utils/case-chat.util';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import {
  AssignInvestigatorDto,
  CreateComplaintDto,
  CreateComplaintEvidenceDto,
  CreateComplaintMessageDto,
  CreateComplaintNoteDto,
  UpdateComplaintStatusDto,
} from './dto/complaint.dto';

export const INTERNAL_AFFAIRS_SLUG = 'internal-affairs';
export const COMPLAINT_MANAGE_PERMISSIONS = [
  'complaints.manage',
  'complaints.assign',
  '*',
] as const;

/** Events never shown to the citizen complainant. */
const INTERNAL_EVENT_TYPES = new Set<ComplaintEventType>([
  ComplaintEventType.INTERNAL_NOTE_ADDED,
]);

const TERMINAL_COMPLAINT_STATUSES = new Set<ComplaintStatus>([
  ComplaintStatus.RESOLVED,
  ComplaintStatus.REJECTED,
  ComplaintStatus.CLOSED,
]);

const complaintInclude = {
  complainant: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, accountId: true },
  },
  accusedStaff: {
    include: {
      character: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      rank: true,
      department: true,
    },
  },
  evidence: { orderBy: { createdAt: 'asc' as const } },
  assignments: {
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
              employeeNumber: true,
              department: { select: { id: true, name: true, slug: true, imageUrl: true } },
              rank: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  },
  events: {
    orderBy: { createdAt: 'desc' as const },
    take: 50,
    include: {
      actor: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ComplaintInclude;

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
    private readonly mediaStorageService: MediaStorageService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async canManageComplaints(characterId: string, permissions: string[] = []) {
    if (hasAnyPermission(permissions, [...COMPLAINT_MANAGE_PERMISSIONS])) {
      return true;
    }

    const roles = await this.permissionsService.getRoleSlugsForCharacter(characterId);
    if (
      roles.includes('medical-director') ||
      roles.includes('deputy-medical-director') ||
      roles.includes('administrator')
    ) {
      return true;
    }

    const officer = await this.prismaService.staffProfile.findUnique({
      where: { characterId },
      include: { department: true },
    });

    return officer?.department?.slug === INTERNAL_AFFAIRS_SLUG;
  }

  async searchOfficers(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    return this.prismaService.staffProfile.findMany({
      where: {
        status: { in: [StaffStatus.ACTIVE, StaffStatus.INACTIVE] },
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

  /**
   * Search characters eligible to investigate (Chief / Administrator / Internal Affairs).
   */
  async searchInvestigators(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    const characters = await this.prismaService.character.findMany({
      where: {
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          {
            staffProfile: {
              employeeNumber: { contains: term, mode: 'insensitive' },
            },
          },
        ],
      },
      take: 30,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        roles: { include: { role: true } },
        staffProfile: {
          include: {
            department: true,
            rank: true,
          },
        },
      },
    });

    const eligible = [];
    for (const character of characters) {
      const canManage = await this.canManageComplaints(character.id, []);
      if (!canManage) {
        continue;
      }
      eligible.push({
        id: character.id,
        firstName: character.firstName,
        lastName: character.lastName,
        avatarUrl: character.avatarUrl,
        employeeNumber: character.staffProfile?.employeeNumber ?? null,
        departmentName: character.staffProfile?.department?.name ?? null,
        rankLabel: character.staffProfile?.rank?.name ?? null,
        roles: character.roles.map((item) => item.role.slug),
      });
      if (eligible.length >= 15) {
        break;
      }
    }

    return eligible;
  }

  async listForAccusedOfficer(staffProfileId: string, permissions: string[], characterId: string) {
    await this.assertCanManage(characterId, permissions);

    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      select: { id: true },
    });
    if (!officer) {
      throw new NotFoundException('Officer profile was not found');
    }

    const complaints = await this.prismaService.complaint.findMany({
      where: { accusedStaffId: staffProfileId },
      include: complaintInclude,
      orderBy: { createdAt: 'desc' },
    });

    return complaints.map((complaint) => this.toComplaintSummary(complaint));
  }

  async listForCharacter(
    characterId: string,
    permissions: string[],
  ) {
    const canManage = await this.canManageComplaints(characterId, permissions);

    const complaints = canManage
      ? await this.prismaService.complaint.findMany({
          include: complaintInclude,
          orderBy: { createdAt: 'desc' },
        })
      : await this.prismaService.complaint.findMany({
          where: {
            OR: [
              { complainantId: characterId },
              { assignments: { some: { characterId, unassignedAt: null } } },
            ],
          },
          include: complaintInclude,
          orderBy: { createdAt: 'desc' },
        });

    return complaints.map((complaint) => this.toComplaintSummary(complaint));
  }

  async getById(id: string, characterId: string, permissions: string[]) {
    const complaint = await this.prismaService.complaint.findUnique({
      where: { id },
      include: {
        ...complaintInclude,
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
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint was not found');
    }

    const canManage = await this.canManageComplaints(characterId, permissions);
    const isComplainant = complaint.complainantId === characterId;
    const isAssignee = complaint.assignments.some((item) => item.characterId === characterId);

    if (!canManage && !isComplainant && !isAssignee) {
      throw new ForbiddenException('You cannot access this complaint');
    }

    const canSeeInternal = canManage || isAssignee;
    const visibleEvents = complaint.events
      .filter((event) => canSeeInternal || !INTERNAL_EVENT_TYPES.has(event.type))
      .map((event) => ({
        ...event,
        visibleToCitizen: !INTERNAL_EVENT_TYPES.has(event.type),
        visibleToInvestigators: true,
      }));

    return {
      ...complaint,
      incidentDate: toDateOnlyString(complaint.incidentDate),
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      investigator: pickPrimaryInvestigator(complaint.assignments),
      internalNotes: canSeeInternal ? complaint.internalNotes : [],
      events: visibleEvents,
      room: `complaint-${complaint.caseNumber}`,
      canManage,
      canSeeInternal,
      isComplainant,
      isAssignee,
      isChatClosed: isComplaintChatClosed(complaint.status),
      canSendMessages: !isComplaintChatClosed(complaint.status),
    };
  }

  async create(
    dto: CreateComplaintDto,
    actor: { accountId: string; characterId: string },
  ) {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: dto.accusedStaffId },
      include: {
        character: { select: { firstName: true, lastName: true } },
      },
    });

    if (!officer) {
      throw new BadRequestException('Accused officer was not found');
    }

    const evidenceData = await this.resolveEvidence(dto.evidence ?? []);

    const complaint = await this.prismaService.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: {
          title: dto.title.trim(),
          description: dto.description.trim(),
          incidentDate: parseDateOnly(dto.incidentDate),
          location: dto.location?.trim() || null,
          status: ComplaintStatus.PENDING,
          complainantId: actor.characterId,
          accusedStaffId: officer.id,
          evidence: {
            create: evidenceData,
          },
          events: {
            create: {
              actorId: actor.characterId,
              type: ComplaintEventType.CREATED,
              message: 'Denuncia creada',
              metadata: {
                accusedStaffId: officer.id,
                employeeNumber: officer.employeeNumber,
              },
            },
          },
        },
        include: complaintInclude,
      });

      return created;
    });

    await this.notifyStakeholdersOnCreate(complaint);

    this.realtimeGateway.emitToRoom(
      `complaint-${complaint.caseNumber}`,
      'complaints:created',
      { id: complaint.id, caseNumber: complaint.caseNumber },
    );

    return complaint;
  }

  async updateStatus(
    id: string,
    dto: UpdateComplaintStatusDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    const existing = await this.requireComplaint(id);

    const complaint = await this.prismaService.complaint.update({
      where: { id },
      data: { status: dto.status },
      include: complaintInclude,
    });

    await this.addEvent(id, actor.characterId, ComplaintEventType.STATUS_CHANGED, {
      message: `Estado cambiado a ${dto.status}`,
      metadata: { from: existing.status, to: dto.status },
    });

    await this.notifyStatusChange(complaint, actor.characterId);
    this.realtimeGateway.emitToRoom(`complaint-${complaint.caseNumber}`, 'complaints:updated', {
      id: complaint.id,
      status: complaint.status,
    });

    return complaint;
  }

  async assignInvestigator(
    id: string,
    dto: AssignInvestigatorDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    await this.requireComplaint(id);

    const assignee = await this.prismaService.character.findUnique({
      where: { id: dto.characterId },
      select: { id: true, accountId: true, firstName: true, lastName: true },
    });
    if (!assignee) {
      throw new NotFoundException('Investigator character was not found');
    }

    const canManageAssignee = await this.canManageComplaints(assignee.id, []);
    if (!canManageAssignee) {
      throw new BadRequestException(
        'Investigator must be Chief, Administrator, or Internal Affairs',
      );
    }

    if (dto.isPrimary) {
      await this.prismaService.complaintAssignment.updateMany({
        where: { complaintId: id, unassignedAt: null },
        data: { isPrimary: false },
      });
    }

    const assignment = await this.prismaService.complaintAssignment.upsert({
      where: {
        complaintId_characterId: {
          complaintId: id,
          characterId: assignee.id,
        },
      },
      update: {
        unassignedAt: null,
        isPrimary: dto.isPrimary ?? false,
        assignedAt: new Date(),
      },
      create: {
        complaintId: id,
        characterId: assignee.id,
        isPrimary: dto.isPrimary ?? true,
      },
    });

    await this.addEvent(id, actor.characterId, ComplaintEventType.INVESTIGATOR_ASSIGNED, {
      message: `Investigador asignado: ${assignee.firstName} ${assignee.lastName}`,
      metadata: { characterId: assignee.id },
    });

    const complaint = await this.requireComplaint(id);

    await this.notificationsService.create({
      accountId: assignee.accountId,
      characterId: assignee.id,
      type: NotificationType.COMPLAINT_ASSIGNED,
      title: `Denuncia #${complaint.caseNumber}`,
      body: 'Se te ha asignado como investigador.',
      href: `/complaints/${complaint.id}`,
      metadata: { complaintId: complaint.id },
    });

    if (complaint.status === ComplaintStatus.PENDING) {
      await this.prismaService.complaint.update({
        where: { id },
        data: { status: ComplaintStatus.UNDER_INVESTIGATION },
      });
      await this.addEvent(id, actor.characterId, ComplaintEventType.STATUS_CHANGED, {
        message: 'Estado cambiado a UNDER_INVESTIGATION',
        metadata: { from: ComplaintStatus.PENDING, to: ComplaintStatus.UNDER_INVESTIGATION },
      });
    }

    this.realtimeGateway.emitToRoom(`complaint-${complaint.caseNumber}`, 'complaints:updated', {
      id,
      assignmentId: assignment.id,
    });

    return this.getById(id, actor.characterId, actor.permissions);
  }

  async addMessage(
    id: string,
    dto: CreateComplaintMessageDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.getById(id, actor.characterId, actor.permissions);
    const complaint = await this.requireComplaint(id);
    assertCaseChatOpen(!isComplaintChatClosed(complaint.status), 'queja');

    const message = await this.prismaService.complaintMessage.create({
      data: {
        complaintId: id,
        authorId: actor.characterId,
        body: dto.body.trim(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    await this.addEvent(id, actor.characterId, ComplaintEventType.MESSAGE_SENT, {
      message: 'Nuevo mensaje en el chat',
      metadata: { messageId: message.id },
    });

    const recipients = await this.collectParticipants(complaint);
    for (const recipient of recipients) {
      if (recipient.characterId === actor.characterId) {
        continue;
      }
      await this.notificationsService.create({
        accountId: recipient.accountId,
        characterId: recipient.characterId,
        type: NotificationType.COMPLAINT_MESSAGE,
        title: `Denuncia #${complaint.caseNumber}`,
        body: 'Nuevo mensaje en el chat de la denuncia.',
        href: `/complaints/${complaint.id}`,
        metadata: { complaintId: complaint.id },
      });
    }

    const payload = {
      ...message,
      complaintId: id,
      caseNumber: complaint.caseNumber,
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
      `complaint-${complaint.caseNumber}`,
      'complaints:message',
      payload,
    );
    for (const recipient of recipients) {
      this.realtimeGateway.emitToCharacter(
        recipient.characterId,
        'complaints:message',
        payload,
      );
    }

    return payload;
  }

  async addInternalNote(
    id: string,
    dto: CreateComplaintNoteDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    await this.assertCanManage(actor.characterId, actor.permissions);
    await this.requireComplaint(id);

    const note = await this.prismaService.complaintInternalNote.create({
      data: {
        complaintId: id,
        authorId: actor.characterId,
        body: dto.body.trim(),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.addEvent(id, actor.characterId, ComplaintEventType.INTERNAL_NOTE_ADDED, {
      message: 'Nota interna agregada',
      metadata: { noteId: note.id },
    });

    const complaint = await this.requireComplaint(id);
    this.realtimeGateway.emitToRoom(
      `complaint-${complaint.caseNumber}`,
      'complaints:note',
      { id: note.id },
    );

    return note;
  }

  async addEvidence(
    id: string,
    dto: CreateComplaintEvidenceDto,
    actor: { accountId: string; characterId: string; permissions: string[] },
  ) {
    const complaint = await this.getById(id, actor.characterId, actor.permissions);
    const [resolved] = await this.resolveEvidence([dto]);

    const evidence = await this.prismaService.complaintEvidence.create({
      data: {
        complaintId: id,
        type: resolved.type,
        label: resolved.label,
        value: resolved.value,
      },
    });

    await this.addEvent(id, actor.characterId, ComplaintEventType.EVIDENCE_ADDED, {
      message: 'Evidencia agregada',
      metadata: { evidenceId: evidence.id, type: evidence.type },
    });

    this.realtimeGateway.emitToRoom(
      `complaint-${complaint.caseNumber}`,
      'complaints:updated',
      { id, evidenceId: evidence.id },
    );

    return evidence;
  }

  private async resolveEvidence(items: CreateComplaintEvidenceDto[]) {
    const results: Array<{
      type: ComplaintEvidenceType;
      label: string | null;
      value: string;
    }> = [];

    for (const item of items) {
      if (item.type === ComplaintEvidenceType.VIDEO_URL) {
        const url = item.value.trim();
        if (!/^https?:\/\//i.test(url)) {
          throw new BadRequestException('Video evidence must be an http(s) URL');
        }
        results.push({
          type: item.type,
          label: item.label?.trim() || null,
          value: url.slice(0, 2048),
        });
        continue;
      }

      const imageUrl = await this.mediaStorageService.resolveImageUrl(
        item.value,
        'complaint-evidence',
        randomUUID(),
      );
      if (!imageUrl) {
        throw new BadRequestException('Invalid image evidence');
      }
      results.push({
        type: ComplaintEvidenceType.IMAGE,
        label: item.label?.trim() || null,
        value: imageUrl,
      });
    }

    return results;
  }

  private async notifyStakeholdersOnCreate(
    complaint: Prisma.ComplaintGetPayload<{ include: typeof complaintInclude }>,
  ) {
    const recipients = await this.findChiefAndInternalAffairs();
    await this.notificationsService.createMany(
      recipients.map((recipient) => ({
        accountId: recipient.accountId,
        characterId: recipient.id,
        type: NotificationType.COMPLAINT_CREATED,
        title: `Nueva denuncia #${complaint.caseNumber}`,
        body: complaint.title,
        href: `/complaints/${complaint.id}`,
        metadata: { complaintId: complaint.id },
      })),
    );
  }

  private async notifyStatusChange(
    complaint: Prisma.ComplaintGetPayload<{ include: typeof complaintInclude }>,
    actorCharacterId: string,
  ) {
    const recipients = await this.collectParticipants(complaint);
    for (const recipient of recipients) {
      if (recipient.characterId === actorCharacterId) {
        continue;
      }
      await this.notificationsService.create({
        accountId: recipient.accountId,
        characterId: recipient.characterId,
        type: NotificationType.COMPLAINT_STATUS,
        title: `Denuncia #${complaint.caseNumber}`,
        body: `Estado actualizado: ${complaint.status}`,
        href: `/complaints/${complaint.id}`,
        metadata: { complaintId: complaint.id, status: complaint.status },
      });
    }
  }

  private async findChiefAndInternalAffairs() {
    const [chiefs, iaOfficers] = await Promise.all([
      this.prismaService.character.findMany({
        where: {
          roles: {
            some: {
              role: {
                slug: { in: ['medical-director', 'deputy-medical-director', 'administrator'] },
              },
            },
          },
        },
        select: { id: true, accountId: true },
      }),
      this.prismaService.staffProfile.findMany({
        where: {
          status: { in: [StaffStatus.ACTIVE, StaffStatus.INACTIVE] },
          department: { slug: INTERNAL_AFFAIRS_SLUG },
        },
        select: {
          character: { select: { id: true, accountId: true } },
        },
      }),
    ]);

    const map = new Map<string, { id: string; accountId: string }>();
    for (const chief of chiefs) {
      map.set(chief.id, chief);
    }
    for (const officer of iaOfficers) {
      map.set(officer.character.id, officer.character);
    }
    return [...map.values()];
  }

  private async collectParticipants(
    complaint: Prisma.ComplaintGetPayload<{ include: typeof complaintInclude }>,
  ) {
    const map = new Map<string, { characterId: string; accountId: string }>();
    map.set(complaint.complainantId, {
      characterId: complaint.complainant.id,
      accountId: complaint.complainant.accountId,
    });
    for (const assignment of complaint.assignments) {
      map.set(assignment.characterId, {
        characterId: assignment.character.id,
        accountId: assignment.character.accountId,
      });
    }
    const stakeholders = await this.findChiefAndInternalAffairs();
    for (const stakeholder of stakeholders) {
      map.set(stakeholder.id, {
        characterId: stakeholder.id,
        accountId: stakeholder.accountId,
      });
    }
    return [...map.values()];
  }

  private async addEvent(
    complaintId: string,
    actorId: string | null,
    type: ComplaintEventType,
    payload: { message: string; metadata?: Prisma.InputJsonValue },
  ) {
    return this.prismaService.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        type,
        message: payload.message,
        metadata: payload.metadata,
      },
    });
  }

  private async requireComplaint(id: string) {
    const complaint = await this.prismaService.complaint.findUnique({
      where: { id },
      include: complaintInclude,
    });
    if (!complaint) {
      throw new NotFoundException('Complaint was not found');
    }
    return complaint;
  }

  private async assertCanManage(characterId: string, permissions: string[]) {
    const allowed = await this.canManageComplaints(characterId, permissions);
    if (!allowed) {
      throw new ForbiddenException('Only Chief / Internal Affairs can manage complaints');
    }
  }

  private toComplaintSummary(
    complaint: Prisma.ComplaintGetPayload<{ include: typeof complaintInclude }>,
  ) {
    return {
      ...complaint,
      incidentDate: toDateOnlyString(complaint.incidentDate),
      createdAt: complaint.createdAt.toISOString(),
      updatedAt: complaint.updatedAt.toISOString(),
      investigator: pickPrimaryInvestigator(complaint.assignments),
    };
  }
}

function isComplaintChatClosed(status: ComplaintStatus): boolean {
  return TERMINAL_COMPLAINT_STATUSES.has(status);
}

function pickPrimaryInvestigator(
  assignments: Prisma.ComplaintGetPayload<{ include: typeof complaintInclude }>['assignments'],
) {
  const active = assignments.filter((item) => !item.unassignedAt);
  const primary = active.find((item) => item.isPrimary) ?? active[0] ?? null;
  if (!primary) {
    return null;
  }

  const officer = primary.character.staffProfile;
  return {
    characterId: primary.character.id,
    firstName: primary.character.firstName,
    lastName: primary.character.lastName,
    avatarUrl: primary.character.avatarUrl,
    employeeNumber: officer?.employeeNumber ?? null,
    departmentName: officer?.department?.name ?? null,
    rankLabel: officer?.rank?.name ?? null,
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
    throw new BadRequestException('Invalid incidentDate');
  }
  return date;
}
