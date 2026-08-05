import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  StaffStatus,
  Prisma,
  ReportEvidenceType,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@prisma/client';
import { MediaStorageService } from '../../common/storage/media-storage.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateReportDto,
  CreateReportEvidenceDto,
  TransferReportDto,
  UpdateReportDto,
} from './dto/report.dto';

const officerCardSelect = {
  id: true,
  employeeNumber: true,
  status: true,
  departmentId: true,
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      accountId: true,
    },
  },
  rank: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} as const;

const reportInclude = {
  department: { select: { id: true, name: true, imageUrl: true } },
  leadStaff: { select: officerCardSelect },
  createdByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  participants: {
    include: { staffProfile: { select: officerCardSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
  evidence: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      uploadedByCharacter: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
  transfers: {
    include: {
      fromDepartment: { select: { id: true, name: true } },
      toDepartment: { select: { id: true, name: true } },
      transferredByCharacter: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.ReportInclude;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

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
                          contains: parts.slice(1).join(' '),
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
      orderBy: { employeeNumber: 'asc' as const },
      select: officerCardSelect,
    });
  }

  async list(
    characterId: string,
    permissions: string[],
    scope: 'all' | 'mine' | 'department' = 'mine',
  ) {
    const officer = await this.getOfficerByCharacter(characterId);
    const where = await this.buildListWhere(characterId, officer, permissions, scope);

    return this.prismaService.report.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        leadStaff: { select: officerCardSelect },
        _count: { select: { participants: true, evidence: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, characterId: string, permissions: string[]) {
    const report = await this.prismaService.report.findUnique({
      where: { id },
      include: reportInclude,
    });
    if (!report) {
      throw new NotFoundException('Report was not found');
    }

    const access = await this.resolveAccess(report, characterId, permissions);
    if (!access.canView) {
      throw new ForbiddenException('You cannot view this report');
    }

    return { ...report, access };
  }

  async create(
    dto: CreateReportDto,
    actor: { accountId: string; characterId: string },
  ) {
    const creatorOfficer = await this.getOfficerByCharacter(actor.characterId);
    if (!creatorOfficer) {
      throw new ForbiddenException('Only officers can create reports');
    }

    let leadStaffId = dto.leadStaffId ?? null;
    if (dto.assignSelfAsLead || !leadStaffId) {
      leadStaffId = creatorOfficer.id;
    }
    if (dto.leadStaffId && !dto.assignSelfAsLead) {
      leadStaffId = dto.leadStaffId;
    }

    if (leadStaffId) {
      await this.assertOfficerExists(leadStaffId);
    }

    const departmentId =
      dto.departmentId ??
      (leadStaffId
        ? (
            await this.prismaService.staffProfile.findUnique({
              where: { id: leadStaffId },
              select: { departmentId: true },
            })
          )?.departmentId
        : creatorOfficer.departmentId) ??
      null;

    if (dto.departmentId) {
      await this.assertDepartmentExists(dto.departmentId);
    }

    const involved = (dto.involvedOfficerIds ?? []).filter(
      (id) => id !== leadStaffId,
    );
    for (const staffId of involved) {
      await this.assertOfficerExists(staffId);
    }

    const report = await this.prismaService.report.create({
      data: {
        title: dto.title.trim(),
        type: dto.type ?? ReportType.CONSULTATION,
        description: dto.description.trim(),
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : null,
        location: dto.location?.trim() || null,
        status: dto.status ?? ReportStatus.PENDING,
        priority: dto.priority ?? ReportPriority.MEDIUM,
        departmentId,
        leadStaffId,
        createdByCharacterId: actor.characterId,
        participants: {
          create: involved.map((staffProfileId) => ({ staffProfileId })),
        },
      },
      include: reportInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'reports.created',
      targetType: AUDIT_TARGET.REPORT,
      targetId: report.id,
      metadata: {
        reportNumber: report.reportNumber,
        title: report.title,
        leadStaffId,
        departmentId,
        involved,
      },
    });

    if (leadStaffId && leadStaffId !== creatorOfficer.id) {
      await this.notifyOfficer(
        leadStaffId,
        NotificationType.REPORT_ASSIGNED,
        `Encargado del informe #${report.reportNumber}`,
        report.title,
        `/reports?id=${report.id}`,
      );
    }

    for (const staffId of involved) {
      await this.notifyOfficer(
        staffId,
        NotificationType.REPORT_PARTICIPANT,
        `Involucrado en informe #${report.reportNumber}`,
        report.title,
        `/reports?id=${report.id}`,
      );
    }

    return report;
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const existing = await this.requireReport(id);
    const access = await this.resolveAccess(existing, actor.characterId, permissions);
    if (!access.canCollaborate) {
      throw new ForbiddenException('You cannot edit this report');
    }

    const wantsManageFields =
      dto.title !== undefined ||
      dto.type !== undefined ||
      dto.incidentDate !== undefined ||
      dto.location !== undefined ||
      dto.leadStaffId !== undefined;

    if (wantsManageFields && !access.canManage) {
      throw new ForbiddenException(
        'Involved officers can only update description, status and priority',
      );
    }

    if (dto.leadStaffId) {
      await this.assertOfficerExists(dto.leadStaffId);
    }

    const previous = {
      status: existing.status,
      leadStaffId: existing.leadStaffId,
      description: existing.description,
    };

    const report = await this.prismaService.report.update({
      where: { id },
      data: {
        title: access.canManage ? dto.title?.trim() : undefined,
        type: access.canManage ? dto.type : undefined,
        description: dto.description?.trim(),
        incidentDate: access.canManage
          ? dto.incidentDate === undefined
            ? undefined
            : dto.incidentDate
              ? new Date(dto.incidentDate)
              : null
          : undefined,
        location: access.canManage
          ? dto.location === undefined
            ? undefined
            : dto.location?.trim() || null
          : undefined,
        status: dto.status,
        priority: dto.priority,
        leadStaffId: access.canManage
          ? dto.leadStaffId === undefined
            ? undefined
            : dto.leadStaffId
          : undefined,
      },
      include: reportInclude,
    });

    if (dto.status && dto.status !== previous.status) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'reports.status_changed',
        targetType: AUDIT_TARGET.REPORT,
        targetId: id,
        metadata: { fromStatus: previous.status, toStatus: report.status },
      });
      await this.notifyReportParties(
        report,
        NotificationType.REPORT_STATUS,
        `Estado del informe #${report.reportNumber}`,
        `${previous.status} → ${report.status}`,
      );
    }

    if (
      access.canManage &&
      dto.leadStaffId !== undefined &&
      dto.leadStaffId !== previous.leadStaffId
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'reports.lead_changed',
        targetType: AUDIT_TARGET.REPORT,
        targetId: id,
        metadata: {
          fromLeadOfficerId: previous.leadStaffId,
          toLeadOfficerId: report.leadStaffId,
        },
      });
      if (report.leadStaffId) {
        await this.notifyOfficer(
          report.leadStaffId,
          NotificationType.REPORT_ASSIGNED,
          `Encargado del informe #${report.reportNumber}`,
          report.title,
          `/reports?id=${report.id}`,
        );
      }
    }

    if (
      dto.description !== undefined &&
      dto.description.trim() !== previous.description
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'reports.description_updated',
        targetType: AUDIT_TARGET.REPORT,
        targetId: id,
        metadata: {},
      });
    }

    if (
      dto.title ||
      dto.type ||
      dto.priority ||
      dto.location !== undefined ||
      dto.incidentDate !== undefined
    ) {
      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'reports.updated',
        targetType: AUDIT_TARGET.REPORT,
        targetId: id,
        metadata: {
          title: dto.title,
          type: dto.type,
          priority: dto.priority,
          location: dto.location,
          incidentDate: dto.incidentDate,
        },
      });
    }

    return report;
  }

  async transfer(
    id: string,
    dto: TransferReportDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    if (!canTransferReports(permissions)) {
      throw new ForbiddenException('Only command staff can transfer reports');
    }

    const existing = await this.requireReport(id);
    await this.assertDepartmentExists(dto.toDepartmentId);

    if (existing.departmentId === dto.toDepartmentId) {
      throw new BadRequestException('Report already belongs to this department');
    }

    const fromDepartmentId = existing.departmentId;

    const report = await this.prismaService.$transaction(async (tx) => {
      await tx.reportTransfer.create({
        data: {
          reportId: id,
          fromDepartmentId,
          toDepartmentId: dto.toDepartmentId,
          transferredByCharacterId: actor.characterId,
          notes: dto.notes?.trim() || null,
        },
      });

      return tx.report.update({
        where: { id },
        data: { departmentId: dto.toDepartmentId },
        include: reportInclude,
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'reports.transferred',
      targetType: AUDIT_TARGET.REPORT,
      targetId: id,
      metadata: {
        fromDepartmentId,
        toDepartmentId: dto.toDepartmentId,
        notes: dto.notes ?? null,
      },
    });

    const supervisors = await this.prismaService.departmentSupervisor.findMany({
      where: { departmentId: dto.toDepartmentId },
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
        type: NotificationType.REPORT_TRANSFERRED,
        title: `Informe derivado #${report.reportNumber}`,
        body: report.title,
        href: `/reports?id=${report.id}`,
        metadata: { reportId: report.id, toDepartmentId: dto.toDepartmentId },
      })),
    );

    return report;
  }

  async addParticipant(
    id: string,
    staffProfileId: string,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const existing = await this.requireReport(id);
    const access = await this.resolveAccess(existing, actor.characterId, permissions);
    if (!access.canManageParticipants) {
      throw new ForbiddenException('You cannot manage participants on this report');
    }

    await this.assertOfficerExists(staffProfileId);
    if (existing.leadStaffId === staffProfileId) {
      throw new BadRequestException('Lead officer is already responsible for this report');
    }

    try {
      await this.prismaService.reportParticipant.create({
        data: { reportId: id, staffProfileId },
      });
    } catch {
      throw new BadRequestException('Officer is already involved in this report');
    }

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'reports.participant_added',
      targetType: AUDIT_TARGET.REPORT,
      targetId: id,
      metadata: { staffProfileId },
    });

    await this.notifyOfficer(
      staffProfileId,
      NotificationType.REPORT_PARTICIPANT,
      `Involucrado en informe #${existing.reportNumber}`,
      existing.title,
      `/reports?id=${id}`,
    );

    return this.getById(id, actor.characterId, permissions);
  }

  async removeParticipant(
    id: string,
    staffProfileId: string,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const existing = await this.requireReport(id);
    const access = await this.resolveAccess(existing, actor.characterId, permissions);
    if (!access.canManageParticipants) {
      throw new ForbiddenException('You cannot manage participants on this report');
    }

    const row = await this.prismaService.reportParticipant.findUnique({
      where: {
        reportId_staffProfileId: { reportId: id, staffProfileId },
      },
    });
    if (!row) {
      throw new NotFoundException('Participant was not found');
    }

    await this.prismaService.reportParticipant.delete({ where: { id: row.id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'reports.participant_removed',
      targetType: AUDIT_TARGET.REPORT,
      targetId: id,
      metadata: { staffProfileId },
    });

    return this.getById(id, actor.characterId, permissions);
  }

  async addEvidence(
    id: string,
    dto: CreateReportEvidenceDto,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const existing = await this.requireReport(id);
    const access = await this.resolveAccess(existing, actor.characterId, permissions);
    if (!access.canCollaborate) {
      throw new ForbiddenException('You cannot add evidence to this report');
    }

    if (dto.type === ReportEvidenceType.IMAGE) {
      throw new BadRequestException(
        'Image evidence must be uploaded via multipart/form-data to POST /reports/:id/evidence/upload',
      );
    }

    const value = dto.value.trim();
    if (value.startsWith('data:')) {
      throw new BadRequestException('Base64 payloads are not accepted; use a URL or file upload');
    }

    const evidence = await this.prismaService.reportEvidence.create({
      data: {
        reportId: id,
        type: dto.type,
        value,
        label: dto.label?.trim() || null,
        originalName: null,
        uploadedByCharacterId: actor.characterId,
      },
      include: {
        uploadedByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'reports.evidence_added',
      targetType: AUDIT_TARGET.REPORT,
      targetId: id,
      metadata: { evidenceId: evidence.id, type: dto.type },
    });

    await this.notifyReportParties(
      existing,
      NotificationType.REPORT_EVIDENCE,
      `Nueva evidencia · informe #${existing.reportNumber}`,
      dto.label?.trim() || dto.type,
    );

    return evidence;
  }

  async uploadEvidenceImage(
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
    label: string | undefined,
    actor: { accountId: string; characterId: string },
    permissions: string[],
  ) {
    const existing = await this.requireReport(id);
    const access = await this.resolveAccess(existing, actor.characterId, permissions);
    if (!access.canCollaborate) {
      throw new ForbiddenException('You cannot add evidence to this report');
    }

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const storedPath = this.mediaStorageService.saveUploadedImage(file, 'reports', id);
    const originalName = sanitizeOriginalName(file.originalname);

    const evidence = await this.prismaService.reportEvidence.create({
      data: {
        reportId: id,
        type: ReportEvidenceType.IMAGE,
        value: storedPath,
        label: label?.trim() || null,
        originalName,
        uploadedByCharacterId: actor.characterId,
      },
      include: {
        uploadedByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'reports.evidence_added',
      targetType: AUDIT_TARGET.REPORT,
      targetId: id,
      metadata: {
        evidenceId: evidence.id,
        type: ReportEvidenceType.IMAGE,
        originalName,
        path: storedPath,
      },
    });

    await this.notifyReportParties(
      existing,
      NotificationType.REPORT_EVIDENCE,
      `Nueva evidencia · informe #${existing.reportNumber}`,
      label?.trim() || originalName || 'Imagen',
    );

    return evidence;
  }

  private async buildListWhere(
    characterId: string,
    officer: { id: string; departmentId: string | null } | null,
    permissions: string[],
    scope: 'all' | 'mine' | 'department',
  ): Promise<Prisma.ReportWhereInput> {
    if (scope === 'all' && canViewAllReports(permissions)) {
      return {};
    }

    if (scope === 'department') {
      if (canViewAllReports(permissions)) {
        return {};
      }
      const departmentIds = officer ? await this.getStaffDepartmentIds(officer.id) : [];
      if (!departmentIds.length) {
        return { id: '00000000-0000-0000-0000-000000000000' };
      }
      return { departmentId: { in: departmentIds } };
    }

    // mine: created, lead, or participant
    const or: Prisma.ReportWhereInput[] = [{ createdByCharacterId: characterId }];
    if (officer) {
      or.push({ leadStaffId: officer.id });
      or.push({ participants: { some: { staffProfileId: officer.id } } });
    }
    if (canViewAllReports(permissions)) {
      return {};
    }
    return { OR: or };
  }

  private async resolveAccess(
    report: {
      id: string;
      departmentId: string | null;
      leadStaffId: string | null;
      createdByCharacterId: string;
    },
    characterId: string,
    permissions: string[],
  ) {
    const isAdmin = canViewAllReports(permissions);
    const canTransfer = canTransferReports(permissions);
    const officer = await this.getOfficerByCharacter(characterId);

    const isCreator = report.createdByCharacterId === characterId;
    const isLead = Boolean(officer && report.leadStaffId === officer.id);
    const isParticipant = officer
      ? Boolean(
          await this.prismaService.reportParticipant.findUnique({
            where: {
              reportId_staffProfileId: {
                reportId: report.id,
                staffProfileId: officer.id,
              },
            },
          }),
        )
      : false;

    const departmentIds = officer ? await this.getStaffDepartmentIds(officer.id) : [];
    const sameDepartment = Boolean(
      report.departmentId && departmentIds.includes(report.departmentId),
    );

    const managesDepartment = Boolean(
      officer &&
        report.departmentId &&
        (await this.prismaService.staffDepartment.findFirst({
          where: {
            staffProfileId: officer.id,
            departmentId: report.departmentId,
            isActive: true,
            role: { in: ['LEAD', 'SUPERVISOR'] },
          },
          select: { id: true, isPrimary: true },
        })),
    );

    const primaryDepartmentId = officer
      ? (
          await this.prismaService.staffDepartment.findFirst({
            where: { staffProfileId: officer.id, isActive: true, isPrimary: true },
            select: { departmentId: true },
          })
        )?.departmentId ?? officer.departmentId
      : null;

    const isPrimaryDepartment = Boolean(
      report.departmentId && primaryDepartmentId === report.departmentId,
    );

    const canView = isAdmin || isCreator || isLead || isParticipant || sameDepartment;
    /** Manage rights come from LEAD/SUPERVISOR on the report's department (primary or alternate). */
    const canManage = isAdmin || isLead || managesDepartment;
    const canCollaborate = canManage || isParticipant;
    const canManageParticipants = canManage;

    return {
      canView,
      /** @deprecated Prefer canCollaborate / canManage */
      canEdit: canCollaborate,
      canCollaborate,
      canManage,
      canManageParticipants,
      canTransfer,
      isLead,
      isCreator,
      isParticipant,
      sameDepartment,
      isPrimaryDepartment,
    };
  }

  private async requireReport(id: string) {
    const report = await this.prismaService.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report was not found');
    }
    return report;
  }

  private async assertOfficerExists(staffProfileId: string) {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
    });
    if (!officer || officer.status === StaffStatus.RETIRED) {
      throw new BadRequestException('Officer profile was not found');
    }
  }

  private async assertDepartmentExists(departmentId: string) {
    const department = await this.prismaService.department.findFirst({
      where: { id: departmentId, isActive: true },
    });
    if (!department) {
      throw new BadRequestException('Department was not found');
    }
  }

  private getOfficerByCharacter(characterId: string) {
    return this.prismaService.staffProfile.findUnique({
      where: { characterId },
      select: { id: true, departmentId: true, characterId: true },
    });
  }

  private async getStaffDepartmentIds(staffProfileId: string): Promise<string[]> {
    const rows = await this.prismaService.staffDepartment.findMany({
      where: { staffProfileId, isActive: true },
      select: { departmentId: true },
    });
    return rows.map((row) => row.departmentId);
  }

  private async notifyOfficer(
    staffProfileId: string,
    type: NotificationType,
    title: string,
    body: string,
    href?: string,
  ) {
    const officer = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      select: { character: { select: { id: true, accountId: true } } },
    });
    if (!officer) return;

    await this.notificationsService.create({
      accountId: officer.character.accountId,
      characterId: officer.character.id,
      type,
      title,
      body,
      href: href ?? null,
    });
  }

  private async notifyReportParties(
    report: {
      id: string;
      reportNumber: number;
      title: string;
      leadStaffId: string | null;
    },
    type: NotificationType,
    title: string,
    body: string,
  ) {
    const ids = new Set<string>();
    if (report.leadStaffId) {
      ids.add(report.leadStaffId);
    }
    const participants = await this.prismaService.reportParticipant.findMany({
      where: { reportId: report.id },
      select: { staffProfileId: true },
    });
    for (const item of participants) {
      ids.add(item.staffProfileId);
    }
    for (const staffId of ids) {
      await this.notifyOfficer(staffId, type, title, body, `/reports?id=${report.id}`);
    }
  }
}

function canViewAllReports(permissions: string[]) {
  const set = new Set(permissions ?? []);
  return set.has('*') || set.has('admin.access') || set.has('reports.transfer');
}

function canTransferReports(permissions: string[]) {
  const set = new Set(permissions ?? []);
  return set.has('*') || set.has('admin.access') || set.has('reports.transfer');
}

function sanitizeOriginalName(name?: string | null): string | null {
  if (!name) {
    return null;
  }
  const base = name.replace(/[/\\]/g, '').trim().slice(0, 200);
  return base || null;
}
