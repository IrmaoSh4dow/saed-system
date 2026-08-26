import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MedicalRecordAccessStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { hasAnyPermission } from '../../common/utils/permission.util';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import {
  canAccessPartner,
  findPartnerByOccupation,
  findPartnerByOrganization,
  getInstitutionalPartner,
  INSTITUTIONAL_PARTNERS,
  type InstitutionalPartnerKey,
} from '../../common/constants/institutional-partners';
import { TEMPORARY_ACCESS_CONFIG } from '../../common/temporary-access/temporary-access.config';

const ACCESS_DURATION_MS = TEMPORARY_ACCESS_CONFIG.MEDICAL_RECORD_DURATION_MS;

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
} satisfies Prisma.CharacterSelect;

@Injectable()
export class MedicalRecordAccessService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async canReview(characterId: string, permissions: string[] = []) {
    if (
      hasAnyPermission(permissions, [
        'medical-record-access.review',
        '*',
      ])
    ) {
      return true;
    }
    const roles = await this.permissionsService.getRoleSlugsForCharacter(characterId);
    return HIGH_COMMAND_ROLE_SLUGS.some((slug) => roles.includes(slug));
  }

  async expireStaleGrants() {
    const now = new Date();
    await this.prismaService.medicalRecordAccessRequest.updateMany({
      where: {
        status: MedicalRecordAccessStatus.APPROVED,
        expiresAt: { lt: now },
      },
      data: {
        status: MedicalRecordAccessStatus.EXPIRED,
        revokedAt: now,
      },
    });
  }

  async hasActiveAccess(patientId: string, requesterCharacterId: string) {
    await this.expireStaleGrants();
    const now = new Date();
    const grant = await this.prismaService.medicalRecordAccessRequest.findFirst({
      where: {
        patientId,
        requesterCharacterId,
        status: MedicalRecordAccessStatus.APPROVED,
        expiresAt: { gt: now },
        OR: [{ revokedAt: null }, { revokedAt: { gt: now } }],
      },
      orderBy: { expiresAt: 'desc' },
    });
    return grant;
  }

  async create(
    input: { patientId: string; reason: string },
    actor: {
      accountId: string;
      characterId: string;
      roles?: string[];
      permissions?: string[];
    },
    partnerKey: InstitutionalPartnerKey,
  ) {
    const partner = getInstitutionalPartner(partnerKey);
    if (!canAccessPartner(partnerKey, actor)) {
      throw new ForbiddenException(`You cannot operate on ${partner.name} records`);
    }

    const reason = input.reason?.trim();
    if (!reason || reason.length < 8) {
      throw new BadRequestException('reason must be at least 8 characters');
    }

    const patient = await this.prismaService.patient.findUnique({
      where: { id: input.patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        recordNumber: true,
        linkedCharacterId: true,
        linkedCharacter: {
          select: {
            occupations: {
              where: { isActive: true },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
              take: 1,
              include: { establishment: { select: { slug: true, name: true } } },
            },
          },
        },
      },
    });
    if (!patient) {
      throw new NotFoundException('Patient was not found');
    }

    const occupation = patient.linkedCharacter?.occupations?.[0];
    if (findPartnerByOccupation(occupation)?.key !== partnerKey) {
      throw new BadRequestException(
        `Medical record access can only be requested for ${partner.name}-linked patients`,
      );
    }

    const pending = await this.prismaService.medicalRecordAccessRequest.findFirst({
      where: {
        patientId: patient.id,
        requesterCharacterId: actor.characterId,
        status: MedicalRecordAccessStatus.PENDING,
      },
    });
    if (pending) {
      throw new BadRequestException('A pending access request already exists for this patient');
    }

    const active = await this.hasActiveAccess(patient.id, actor.characterId);
    if (active) {
      throw new BadRequestException('An active access grant already exists for this patient');
    }

    const created = await this.prismaService.medicalRecordAccessRequest.create({
      data: {
        patientId: patient.id,
        requesterCharacterId: actor.characterId,
        requesterOrganization: partner.name,
        reason,
        status: MedicalRecordAccessStatus.PENDING,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, recordNumber: true },
        },
        requesterCharacter: { select: characterSelect },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-record-access.created',
      targetType: AUDIT_TARGET.MEDICAL_RECORD_ACCESS_REQUEST,
      targetId: created.id,
      metadata: {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        reason,
        requesterOrganization: created.requesterOrganization,
      },
    });

    await this.notifyHighCommand(created);

    return this.toDto(created);
  }

  async list(
    actor: { characterId: string; permissions: string[]; roles?: string[] },
    query: { status?: MedicalRecordAccessStatus; q?: string } = {},
    partnerKey?: InstitutionalPartnerKey,
  ) {
    await this.expireStaleGrants();
    const canReview = await this.canReview(actor.characterId, actor.permissions);

    if (partnerKey && !canAccessPartner(partnerKey, actor)) {
      throw new ForbiddenException(
        `You cannot operate on ${getInstitutionalPartner(partnerKey).name} records`,
      );
    }

    const where: Prisma.MedicalRecordAccessRequestWhereInput = canReview
      ? {}
      : { requesterCharacterId: actor.characterId };

    if (partnerKey) {
      where.requesterOrganization = {
        in: [...getInstitutionalPartner(partnerKey).aliases],
        mode: 'insensitive',
      };
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { patient: { firstName: { contains: term, mode: 'insensitive' } } },
        { patient: { lastName: { contains: term, mode: 'insensitive' } } },
        { reason: { contains: term, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prismaService.medicalRecordAccessRequest.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, recordNumber: true },
        },
        requesterCharacter: { select: characterSelect },
        reviewedByCharacter: { select: characterSelect },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
    });

    return rows.map((row) => this.toDto(row));
  }

  async approve(
    id: string,
    actor: { accountId: string; characterId: string; permissions: string[] },
    decisionNotes?: string,
    partnerKey?: InstitutionalPartnerKey,
  ) {
    if (!(await this.canReview(actor.characterId, actor.permissions))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.requireRequest(id, partnerKey);
    if (existing.status !== MedicalRecordAccessStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const approvedAt = new Date();
    const expiresAt = new Date(approvedAt.getTime() + ACCESS_DURATION_MS);

    const updated = await this.prismaService.medicalRecordAccessRequest.update({
      where: { id },
      data: {
        status: MedicalRecordAccessStatus.APPROVED,
        reviewedByCharacterId: actor.characterId,
        reviewedAt: approvedAt,
        approvedAt,
        expiresAt,
        decisionNotes: decisionNotes?.trim() || null,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, recordNumber: true },
        },
        requesterCharacter: { select: characterSelect },
        reviewedByCharacter: { select: characterSelect },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-record-access.approved',
      targetType: AUDIT_TARGET.MEDICAL_RECORD_ACCESS_REQUEST,
      targetId: id,
      metadata: {
        patientId: updated.patientId,
        expiresAt: expiresAt.toISOString(),
        approvedAt: approvedAt.toISOString(),
      },
    });

    await this.notifyRequester(updated, true);
    return this.toDto(updated);
  }

  async reject(
    id: string,
    actor: { accountId: string; characterId: string; permissions: string[] },
    decisionNotes?: string,
    partnerKey?: InstitutionalPartnerKey,
  ) {
    if (!(await this.canReview(actor.characterId, actor.permissions))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.requireRequest(id, partnerKey);
    if (existing.status !== MedicalRecordAccessStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const reviewedAt = new Date();
    const updated = await this.prismaService.medicalRecordAccessRequest.update({
      where: { id },
      data: {
        status: MedicalRecordAccessStatus.REJECTED,
        reviewedByCharacterId: actor.characterId,
        reviewedAt,
        decisionNotes: decisionNotes?.trim() || null,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, recordNumber: true },
        },
        requesterCharacter: { select: characterSelect },
        reviewedByCharacter: { select: characterSelect },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-record-access.rejected',
      targetType: AUDIT_TARGET.MEDICAL_RECORD_ACCESS_REQUEST,
      targetId: id,
      metadata: {
        patientId: updated.patientId,
        decisionNotes: updated.decisionNotes,
      },
    });

    await this.notifyRequester(updated, false);
    return this.toDto(updated);
  }

  async revoke(
    id: string,
    actor: { accountId: string; characterId: string; permissions: string[] },
    partnerKey?: InstitutionalPartnerKey,
  ) {
    if (!(await this.canReview(actor.characterId, actor.permissions))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existing = await this.requireRequest(id, partnerKey);
    if (existing.status !== MedicalRecordAccessStatus.APPROVED) {
      throw new BadRequestException('Only approved grants can be revoked');
    }

    const revokedAt = new Date();
    const updated = await this.prismaService.medicalRecordAccessRequest.update({
      where: { id },
      data: {
        status: MedicalRecordAccessStatus.REVOKED,
        revokedAt,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, recordNumber: true },
        },
        requesterCharacter: { select: characterSelect },
        reviewedByCharacter: { select: characterSelect },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-record-access.revoked',
      targetType: AUDIT_TARGET.MEDICAL_RECORD_ACCESS_REQUEST,
      targetId: id,
      metadata: { patientId: updated.patientId, revokedAt: revokedAt.toISOString() },
    });

    return this.toDto(updated);
  }

  private async requireRequest(id: string, partnerKey?: InstitutionalPartnerKey) {
    const row = await this.prismaService.medicalRecordAccessRequest.findUnique({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('Access request was not found');
    }
    if (partnerKey && findPartnerByOrganization(row.requesterOrganization)?.key !== partnerKey) {
      throw new NotFoundException('Access request was not found');
    }
    return row;
  }

  /** Route a notification to the module of the agency that owns the request. */
  private resolveRoutePath(organization: string): string {
    return (
      findPartnerByOrganization(organization)?.routePath ??
      INSTITUTIONAL_PARTNERS.LSPD.routePath
    );
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

  private async notifyHighCommand(
    request: Prisma.MedicalRecordAccessRequestGetPayload<{
      include: {
        patient: { select: { firstName: true; lastName: true; recordNumber: true } };
        requesterCharacter: { select: typeof characterSelect };
      };
    }>,
  ) {
    const recipients = await this.findHighCommand();
    const title = 'Solicitud de expediente médico';
    const body = `${request.requesterCharacter.firstName} ${request.requesterCharacter.lastName} solicita acceso al expediente de ${request.patient.firstName} ${request.patient.lastName} (HC #${request.patient.recordNumber}).`;

    await this.notificationsService.createMany(
      recipients.map((character) => ({
        accountId: character.accountId,
        characterId: character.id,
        type: NotificationType.MEDICAL_RECORD_ACCESS_CREATED,
        title,
        body,
        href: `${this.resolveRoutePath(request.requesterOrganization)}?tab=access`,
        metadata: {
          accessRequestId: request.id,
          requestNumber: request.requestNumber,
          patientId: request.patientId,
        },
      })),
    );
  }

  private async notifyRequester(
    request: Prisma.MedicalRecordAccessRequestGetPayload<{
      include: {
        patient: { select: { firstName: true; lastName: true; recordNumber: true } };
        requesterCharacter: { select: typeof characterSelect };
      };
    }>,
    approved: boolean,
  ) {
    const title = approved
      ? 'Acceso al expediente aprobado'
      : 'Acceso al expediente rechazado';
    const body = approved
      ? `Tu solicitud para ${request.patient.firstName} ${request.patient.lastName} fue aprobada. Acceso válido por 24 horas.`
      : `Tu solicitud para ${request.patient.firstName} ${request.patient.lastName} fue rechazada.`;

    await this.notificationsService.create({
      accountId: request.requesterCharacter.accountId,
      characterId: request.requesterCharacter.id,
      type: NotificationType.MEDICAL_RECORD_ACCESS_STATUS,
      title,
      body,
      href: `${this.resolveRoutePath(request.requesterOrganization)}?patient=${request.patientId}`,
      metadata: {
        accessRequestId: request.id,
        status: request.status,
        expiresAt: request.expiresAt?.toISOString() ?? null,
      },
    });
  }

  private toDto(row: {
    id: string;
    requestNumber: number;
    patientId: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      recordNumber: number;
    };
    requesterCharacter: {
      id: string;
      accountId: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    reviewedByCharacter?: {
      id: string;
      accountId: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    } | null;
    requesterOrganization: string;
    reason: string;
    status: MedicalRecordAccessStatus;
    reviewedAt: Date | null;
    decisionNotes: string | null;
    approvedAt: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const now = Date.now();
    const isActive =
      row.status === MedicalRecordAccessStatus.APPROVED &&
      !!row.expiresAt &&
      row.expiresAt.getTime() > now &&
      !row.revokedAt;

    return {
      id: row.id,
      requestNumber: row.requestNumber,
      patientId: row.patientId,
      patient: {
        id: row.patient.id,
        recordNumber: row.patient.recordNumber,
        fullName: `${row.patient.firstName} ${row.patient.lastName}`,
      },
      requesterCharacter: row.requesterCharacter,
      requesterOrganization: row.requesterOrganization,
      reason: row.reason,
      status: row.status,
      reviewedByCharacter: row.reviewedByCharacter ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      decisionNotes: row.decisionNotes,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
