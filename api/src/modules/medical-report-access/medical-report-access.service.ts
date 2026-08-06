import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MedicalReportAccessGrantStatus,
  MedicalReportAccessReason,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { TEMPORARY_ACCESS_CONFIG } from '../../common/temporary-access/temporary-access.config';
import {
  computeExpiresAt,
  isTemporaryAccessActive,
  remainingAccessMs,
  resolveDurationMs,
  shouldWarnExpiry,
} from '../../common/temporary-access/temporary-access.util';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  GrantMedicalReportAccessDto,
  SearchMedicalReportAccessDto,
} from './dto/medical-report-access.dto';

const characterSelect = {
  id: true,
  firstName: true,
  lastName: true,
  accountId: true,
  avatarUrl: true,
} satisfies Prisma.CharacterSelect;

const reportSelect = {
  id: true,
  reportNumber: true,
  title: true,
  type: true,
  status: true,
  description: true,
  incidentDate: true,
  location: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: {
      id: true,
      recordNumber: true,
      firstName: true,
      lastName: true,
      middleName: true,
    },
  },
  department: { select: { id: true, name: true } },
  leadStaff: {
    select: {
      id: true,
      employeeNumber: true,
      character: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
} satisfies Prisma.ReportSelect;

const grantInclude = {
  report: { select: reportSelect },
  recipientCharacter: { select: characterSelect },
  grantedByCharacter: { select: characterSelect },
  revokedByCharacter: { select: characterSelect },
} satisfies Prisma.MedicalReportAccessGrantInclude;

const REASON_LABELS: Record<MedicalReportAccessReason, string> = {
  CRIMINAL_INVESTIGATION: 'Investigación criminal',
  FORENSIC_CASE: 'Caso forense',
  COURT_ORDER: 'Orden judicial',
  INTERNAL_INVESTIGATION: 'Investigación interna',
  PROSECUTOR_REQUEST: 'Solicitud del Fiscal',
  OTHER: 'Otro motivo institucional',
};

@Injectable()
export class MedicalReportAccessService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  listReasons() {
    return Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label }));
  }

  async listRecipients() {
    return this.prismaService.character.findMany({
      where: {
        roles: {
          some: { role: { slug: TEMPORARY_ACCESS_CONFIG.RECIPIENT_ROLE_SLUG } },
        },
      },
      select: characterSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async expireStaleGrants() {
    const now = new Date();
    const stale = await this.prismaService.medicalReportAccessGrant.findMany({
      where: {
        status: MedicalReportAccessGrantStatus.ACTIVE,
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        grantNumber: true,
        reportId: true,
        recipientCharacterId: true,
        expiresAt: true,
      },
    });

    if (!stale.length) {
      return 0;
    }

    await this.prismaService.medicalReportAccessGrant.updateMany({
      where: { id: { in: stale.map((item) => item.id) } },
      data: { status: MedicalReportAccessGrantStatus.EXPIRED },
    });

    for (const grant of stale) {
      await this.auditService.create({
        action: 'medical-report-access.expired',
        targetType: AUDIT_TARGET.MEDICAL_REPORT_ACCESS_GRANT,
        targetId: grant.id,
        metadata: {
          grantNumber: grant.grantNumber,
          reportId: grant.reportId,
          recipientCharacterId: grant.recipientCharacterId,
          expiresAt: grant.expiresAt.toISOString(),
        },
      });
    }

    return stale.length;
  }

  async getDashboard(permissions: string[] = []) {
    if (!this.canManageHistory(permissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    await this.expireStaleGrants();
    const now = new Date();
    const [active, expired, revoked, sharedReports, activeSupervisors] =
      await Promise.all([
        this.prismaService.medicalReportAccessGrant.count({
          where: { status: MedicalReportAccessGrantStatus.ACTIVE, expiresAt: { gt: now } },
        }),
        this.prismaService.medicalReportAccessGrant.count({
          where: { status: MedicalReportAccessGrantStatus.EXPIRED },
        }),
        this.prismaService.medicalReportAccessGrant.count({
          where: { status: MedicalReportAccessGrantStatus.REVOKED },
        }),
        this.prismaService.medicalReportAccessGrant.findMany({
          where: { status: MedicalReportAccessGrantStatus.ACTIVE, expiresAt: { gt: now } },
          distinct: ['reportId'],
          select: { reportId: true },
        }),
        this.prismaService.medicalReportAccessGrant.findMany({
          where: { status: MedicalReportAccessGrantStatus.ACTIVE, expiresAt: { gt: now } },
          distinct: ['recipientCharacterId'],
          select: { recipientCharacterId: true },
        }),
      ]);

    const recent = await this.prismaService.medicalReportAccessGrant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: grantInclude,
    });

    return {
      active,
      expired,
      revoked,
      sharedReports: sharedReports.length,
      activeSupervisors: activeSupervisors.length,
      defaultDurationHours: TEMPORARY_ACCESS_CONFIG.MEDICAL_REPORT_DURATION_MS / (60 * 60 * 1000),
      recent: recent.map((item) => this.toSummary(item)),
    };
  }

  async list(query: SearchMedicalReportAccessDto, actor: { characterId: string; permissions: string[] }) {
    if (!this.canManageHistory(actor.permissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    await this.expireStaleGrants();
    const where: Prisma.MedicalReportAccessGrantWhereInput = {};

    if (query.recipientCharacterId) where.recipientCharacterId = query.recipientCharacterId;
    if (query.grantedByCharacterId) where.grantedByCharacterId = query.grantedByCharacterId;
    if (query.reportId) where.reportId = query.reportId;
    if (query.patientId) where.report = { patientId: query.patientId };
    if (query.organization) where.organization = query.organization;
    if (query.status) where.status = query.status;

    const q = query.q?.trim();
    if (q) {
      const reportNumber = Number(q.replace(/\D/g, ''));
      where.OR = [
        { reasonNotes: { contains: q, mode: 'insensitive' } },
        {
          recipientCharacter: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        {
          report: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              ...(Number.isFinite(reportNumber) && reportNumber > 0
                ? [{ reportNumber }]
                : []),
              {
                patient: {
                  OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
        },
      ];
    }

    const rows = await this.prismaService.medicalReportAccessGrant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: grantInclude,
    });

    return rows.map((item) => this.toSummary(item));
  }

  async listForReport(reportId: string, permissions: string[] = []) {
    if (!this.canManageHistory(permissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    await this.expireStaleGrants();
    const rows = await this.prismaService.medicalReportAccessGrant.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
      include: grantInclude,
    });
    return rows.map((item) => this.toSummary(item));
  }

  async listAuthorizedForRecipient(characterId: string) {
    await this.expireStaleGrants();
    const now = new Date();
    const rows = await this.prismaService.medicalReportAccessGrant.findMany({
      where: {
        recipientCharacterId: characterId,
        status: MedicalReportAccessGrantStatus.ACTIVE,
        expiresAt: { gt: now },
        revokedAt: null,
      },
      orderBy: { expiresAt: 'asc' },
      include: grantInclude,
    });
    return rows.map((item) => this.toSummary(item));
  }

  async grant(
    dto: GrantMedicalReportAccessDto,
    actor: { accountId: string; characterId: string },
  ) {
    const report = await this.prismaService.report.findUnique({
      where: { id: dto.reportId },
      select: {
        id: true,
        reportNumber: true,
        title: true,
        patient: { select: { firstName: true, lastName: true, recordNumber: true } },
      },
    });
    if (!report) {
      throw new NotFoundException('Report was not found');
    }

    const recipient = await this.prismaService.character.findFirst({
      where: {
        id: dto.recipientCharacterId,
        roles: {
          some: { role: { slug: TEMPORARY_ACCESS_CONFIG.RECIPIENT_ROLE_SLUG } },
        },
      },
      select: characterSelect,
    });
    if (!recipient) {
      throw new BadRequestException(
        'Recipient must be an active LSPD Medical Supervisor',
      );
    }

    await this.expireStaleGrants();
    const existing = await this.prismaService.medicalReportAccessGrant.findFirst({
      where: {
        reportId: dto.reportId,
        recipientCharacterId: dto.recipientCharacterId,
        status: MedicalReportAccessGrantStatus.ACTIVE,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'This supervisor already has an active grant for this report',
      );
    }

    const durationMs = resolveDurationMs(
      TEMPORARY_ACCESS_CONFIG.MEDICAL_REPORT_DURATION_MS,
      dto.durationHours,
      TEMPORARY_ACCESS_CONFIG.MAX_DURATION_HOURS,
    );
    const grantedAt = new Date();
    const expiresAt = computeExpiresAt(durationMs, grantedAt);
    const reasonNotes = dto.reasonNotes?.trim() || null;

    const created = await this.prismaService.medicalReportAccessGrant.create({
      data: {
        reportId: dto.reportId,
        recipientCharacterId: dto.recipientCharacterId,
        grantedByCharacterId: actor.characterId,
        organization: TEMPORARY_ACCESS_CONFIG.DEFAULT_ORGANIZATION,
        reason: dto.reason,
        reasonNotes,
        status: MedicalReportAccessGrantStatus.ACTIVE,
        grantedAt,
        expiresAt,
      },
      include: grantInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-report-access.granted',
      targetType: AUDIT_TARGET.MEDICAL_REPORT_ACCESS_GRANT,
      targetId: created.id,
      metadata: {
        grantNumber: created.grantNumber,
        reportId: report.id,
        reportNumber: report.reportNumber,
        recipientCharacterId: recipient.id,
        reason: dto.reason,
        reasonNotes,
        durationMs,
        expiresAt: expiresAt.toISOString(),
        organization: created.organization,
      },
    });

    await this.notificationsService.create({
      accountId: recipient.accountId,
      characterId: recipient.id,
      type: NotificationType.MEDICAL_REPORT_ACCESS_GRANTED,
      title: 'Acceso temporal a informe médico',
      body: `Se te concedió acceso al informe #${report.reportNumber} (${REASON_LABELS[dto.reason]}) por ${Math.round(durationMs / 3600000)}h.`,
      href: `/lspd?tab=authorized-reports&grant=${created.id}`,
      metadata: {
        grantId: created.id,
        reportId: report.id,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return this.toSummary(created);
  }

  async revoke(
    grantId: string,
    actor: { accountId: string; characterId: string },
  ) {
    await this.expireStaleGrants();
    const grant = await this.requireGrant(grantId);
    if (grant.status !== MedicalReportAccessGrantStatus.ACTIVE) {
      throw new BadRequestException('Only active grants can be revoked');
    }

    const updated = await this.prismaService.medicalReportAccessGrant.update({
      where: { id: grantId },
      data: {
        status: MedicalReportAccessGrantStatus.REVOKED,
        revokedAt: new Date(),
        revokedByCharacterId: actor.characterId,
      },
      include: grantInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-report-access.revoked',
      targetType: AUDIT_TARGET.MEDICAL_REPORT_ACCESS_GRANT,
      targetId: grantId,
      metadata: {
        grantNumber: grant.grantNumber,
        reportId: grant.reportId,
        reportNumber: grant.report.reportNumber,
        recipientCharacterId: grant.recipientCharacterId,
      },
    });

    await this.notificationsService.create({
      accountId: grant.recipientCharacter.accountId,
      characterId: grant.recipientCharacter.id,
      type: NotificationType.MEDICAL_REPORT_ACCESS_REVOKED,
      title: 'Acceso a informe revocado',
      body: `Tu acceso temporal al informe #${grant.report.reportNumber} fue revocado por el SAED.`,
      href: '/lspd?tab=authorized-reports',
      metadata: { grantId, reportId: grant.reportId },
    });

    return this.toSummary(updated);
  }

  async getAuthorizedReport(
    grantId: string,
    actor: { accountId: string; characterId: string },
  ) {
    await this.expireStaleGrants();
    const grant = await this.requireGrant(grantId);

    if (grant.recipientCharacterId !== actor.characterId) {
      throw new ForbiddenException('This authorization does not belong to you');
    }

    if (!isTemporaryAccessActive(grant)) {
      throw new ForbiddenException('Authorization has expired or was revoked');
    }

    const now = new Date();
    await this.prismaService.$transaction([
      this.prismaService.medicalReportAccessGrant.update({
        where: { id: grantId },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: now,
        },
      }),
      this.prismaService.medicalReportAccessViewLog.create({
        data: {
          grantId,
          viewerCharacterId: actor.characterId,
          viewedAt: now,
        },
      }),
    ]);

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-report-access.viewed',
      targetType: AUDIT_TARGET.MEDICAL_REPORT_ACCESS_GRANT,
      targetId: grantId,
      metadata: {
        grantNumber: grant.grantNumber,
        reportId: grant.reportId,
        reportNumber: grant.report.reportNumber,
        viewCount: grant.viewCount + 1,
      },
    });

    const refreshed = await this.requireGrant(grantId);
    return {
      grant: this.toSummary(refreshed),
      report: this.toAuthorizedReportPayload(refreshed.report),
    };
  }

  /**
   * Prepared hook for future “expires in 1 hour” notifications.
   * No scheduler is wired yet; callers / jobs can invoke this safely.
   */
  async notifyExpiringSoon() {
    await this.expireStaleGrants();
    const now = new Date();
    const warningWindowEnd = new Date(
      now.getTime() + TEMPORARY_ACCESS_CONFIG.EXPIRY_WARNING_MS,
    );

    const grants = await this.prismaService.medicalReportAccessGrant.findMany({
      where: {
        status: MedicalReportAccessGrantStatus.ACTIVE,
        expiresAt: { gt: now, lte: warningWindowEnd },
        revokedAt: null,
      },
      include: {
        recipientCharacter: { select: characterSelect },
        report: { select: { reportNumber: true } },
      },
    });

    let notified = 0;
    for (const grant of grants) {
      if (
        !shouldWarnExpiry(
          grant.expiresAt,
          TEMPORARY_ACCESS_CONFIG.EXPIRY_WARNING_MS,
          now,
        )
      ) {
        continue;
      }
      await this.notificationsService.create({
        accountId: grant.recipientCharacter.accountId,
        characterId: grant.recipientCharacter.id,
        type: NotificationType.MEDICAL_REPORT_ACCESS_EXPIRING,
        title: 'Acceso a informe por expirar',
        body: `Tu acceso al informe #${grant.report.reportNumber} expira en menos de una hora.`,
        href: `/lspd?tab=authorized-reports&grant=${grant.id}`,
        metadata: {
          grantId: grant.id,
          expiresAt: grant.expiresAt.toISOString(),
        },
      });
      notified += 1;
    }
    return { notified };
  }

  /** Full history (all recipients). Recipients use listAuthorizedForRecipient instead. */
  private canManageHistory(permissions: string[]) {
    return hasAnyPermission(permissions, [
      'medical-report-access.grant',
      'medical-report-access.revoke',
      '*',
    ]);
  }

  private async requireGrant(id: string) {
    const grant = await this.prismaService.medicalReportAccessGrant.findUnique({
      where: { id },
      include: grantInclude,
    });
    if (!grant) {
      throw new NotFoundException('Access grant was not found');
    }
    return grant;
  }

  private toAuthorizedReportPayload(
    report: Prisma.ReportGetPayload<{ select: typeof reportSelect }>,
  ) {
    return {
      id: report.id,
      reportNumber: report.reportNumber,
      title: report.title,
      type: report.type,
      status: report.status,
      description: report.description,
      incidentDate: report.incidentDate?.toISOString() ?? null,
      location: report.location,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      patient: report.patient,
      department: report.department,
      leadStaff: report.leadStaff
        ? {
            id: report.leadStaff.id,
            employeeNumber: report.leadStaff.employeeNumber,
            character: report.leadStaff.character,
          }
        : null,
    };
  }

  private toSummary(
    grant: Prisma.MedicalReportAccessGrantGetPayload<{ include: typeof grantInclude }>,
  ) {
    const remainingMs = remainingAccessMs(grant.expiresAt);
    const active = isTemporaryAccessActive(grant);
    return {
      id: grant.id,
      grantNumber: grant.grantNumber,
      organization: grant.organization,
      reason: grant.reason,
      reasonLabel: REASON_LABELS[grant.reason] ?? grant.reason,
      reasonNotes: grant.reasonNotes,
      status: active ? MedicalReportAccessGrantStatus.ACTIVE : grant.status,
      grantedAt: grant.grantedAt.toISOString(),
      expiresAt: grant.expiresAt.toISOString(),
      revokedAt: grant.revokedAt?.toISOString() ?? null,
      remainingMs: active ? remainingMs : 0,
      viewCount: grant.viewCount,
      lastViewedAt: grant.lastViewedAt?.toISOString() ?? null,
      report: grant.report
        ? {
            id: grant.report.id,
            reportNumber: grant.report.reportNumber,
            title: grant.report.title,
            type: grant.report.type,
            createdAt: grant.report.createdAt.toISOString(),
            patient: grant.report.patient,
            leadStaff: grant.report.leadStaff
              ? {
                  id: grant.report.leadStaff.id,
                  employeeNumber: grant.report.leadStaff.employeeNumber,
                  character: grant.report.leadStaff.character,
                }
              : null,
          }
        : null,
      recipientCharacter: grant.recipientCharacter,
      grantedByCharacter: grant.grantedByCharacter,
      revokedByCharacter: grant.revokedByCharacter,
      createdAt: grant.createdAt.toISOString(),
      updatedAt: grant.updatedAt.toISOString(),
    };
  }
}
