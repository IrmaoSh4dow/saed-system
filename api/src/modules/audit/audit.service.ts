import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const AUDIT_TARGET = {
  OFFICER: 'Officer',
  DIVISION: 'Department',
  COMPLAINT: 'Complaint',
  CHARACTER: 'Character',
  DECORATION: 'Decoration',
  LICENSE: 'License',
  ACCOUNT: 'Account',
  REPORT: 'Report',
  ACADEMY: 'Academy',
  NEWS: 'News',
  GALLERY: 'Gallery',
  INCENTIVE: 'Incentive',
  INCENTIVE_CONFIGURATION: 'IncentiveConfiguration',
  ADMIN_REQUEST: 'AdminRequest',
  ESTABLISHMENT: 'Establishment',
  AGREEMENT: 'Agreement',
  PSYCHOTECHNICAL_EVALUATION: 'PsychotechnicalEvaluation',
  MEDICAL_LEAVE: 'MedicalLeave',
  MEDICAL_RECORD_ACCESS_REQUEST: 'MedicalRecordAccessRequest',
  MEDICAL_REPORT_ACCESS_GRANT: 'MedicalReportAccessGrant',
  EMPLOYMENT_CHANGE_REQUEST: 'EmploymentChangeRequest',
  STAFF_RATING: 'StaffRating',
  PATIENT: 'Patient',
  PATIENT_INVOICE: 'PatientInvoice',
  INSTITUTIONAL_PAYMENT: 'InstitutionalPayment',
  REGULATION: 'Regulation',
} as const;

export interface ICreateAuditLogInput {
  actorAccountId?: string | null;
  actorCharacterId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

const actorInclude = {
  actorAccount: {
    select: { id: true, username: true, displayName: true },
  },
  actorCharacter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffProfile: {
        select: {
          employeeNumber: true,
          rank: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.AuditLogInclude;

@Injectable()
export class AuditService {
  constructor(private readonly prismaService: PrismaService) {}

  create(input: ICreateAuditLogInput) {
    return this.prismaService.auditLog.create({
      data: {
        actorAccountId: input.actorAccountId ?? null,
        actorCharacterId: input.actorCharacterId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  findRecent(limit = 50) {
    return this.prismaService.auditLog.findMany({
      take: Math.min(limit, 200),
      orderBy: { createdAt: 'desc' },
      include: actorInclude,
    });
  }

  /**
   * Timeline for a single entity (newest first).
   * Also includes legacy StaffProfile targetType and decoration
   * events that stored staffProfileId only in metadata.
   */
  findByTarget(targetType: string, targetId: string, limit = 100) {
    const take = Math.min(Math.max(limit, 1), 300);
    const or: Prisma.AuditLogWhereInput[] = [
      { targetType, targetId },
    ];

    if (targetType === AUDIT_TARGET.OFFICER) {
      or.push(
        { targetType: 'StaffProfile', targetId },
        {
          action: { in: ['decorations.award', 'decorations.revoke', 'licenses.assign', 'licenses.revoke'] },
          metadata: {
            path: ['staffProfileId'],
            equals: targetId,
          },
        },
      );
    }

    return this.prismaService.auditLog.findMany({
      where: { OR: or },
      take,
      orderBy: { createdAt: 'desc' },
      include: actorInclude,
    });
  }
}
