import { BadRequestException, Injectable } from '@nestjs/common';
import { MedicalLeaveStatus, Prisma, PsychotechnicalResult } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  INSTITUTIONAL_PARTNERS,
  PSYCHOTECHNICAL_EXPIRING_SOON_DAYS,
  type InstitutionalPartnerKey,
} from './occupational-health.constants';
import { MedicalLeavesService } from './medical-leaves.service';
import { PsychotechnicalEvaluationsService } from './psychotechnical-evaluations.service';
import {
  addUtcDays,
  parseDateOnly,
  resolvePsychotechnicalValidity,
  startOfUtcDay,
  toDateOnlyString,
} from './occupational-health.utils';
import { SearchOccupationalHealthDto } from './dto/occupational-health.dto';

function parseDateOnlySafe(value?: string) {
  return parseDateOnly(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class OccupationalHealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly psychotechnicalEvaluationsService: PsychotechnicalEvaluationsService,
    private readonly medicalLeavesService: MedicalLeavesService,
  ) {}

  async getPatientOccupationalSummary(patientId: string) {
    const [currentPsychotechnical, activeMedicalLeave, psychotechnicalHistory, medicalLeaveHistory] =
      await Promise.all([
        this.psychotechnicalEvaluationsService.resolveCurrentForPatient(patientId),
        this.medicalLeavesService.resolveActiveForPatient(patientId),
        this.psychotechnicalEvaluationsService.listByPatient(patientId),
        this.medicalLeavesService.listByPatient(patientId),
      ]);

    return {
      currentPsychotechnical,
      activeMedicalLeave,
      psychotechnicalHistory,
      medicalLeaveHistory,
    };
  }

  async getDashboard() {
    const today = startOfUtcDay();
    const soon = addUtcDays(today, PSYCHOTECHNICAL_EXPIRING_SOON_DAYS);

    const linkedPatients = await this.prismaService.patient.findMany({
      where: {
        linkedCharacterId: { not: null },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        psychotechnicalEvaluations: {
          orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: { result: true, expiresAt: true },
        },
        medicalLeaves: {
          where: { status: MedicalLeaveStatus.ACTIVE },
          orderBy: { startsAt: 'desc' },
          take: 5,
          select: { status: true, startsAt: true, endsAt: true },
        },
      },
    });

    let currentPsychotechnical = 0;
    let expiringSoon = 0;
    let expired = 0;
    let none = 0;
    let fit = 0;
    let fitWithObservations = 0;
    let unfit = 0;
    let activeLeaves = 0;

    for (const patient of linkedPatients) {
      const evaluation = patient.psychotechnicalEvaluations[0] ?? null;
      const validity = resolvePsychotechnicalValidity(evaluation);

      if (validity === 'NONE') {
        none += 1;
      } else if (validity === 'EXPIRED') {
        expired += 1;
      } else if (validity === 'EXPIRING_SOON') {
        expiringSoon += 1;
        currentPsychotechnical += 1;
      } else {
        currentPsychotechnical += 1;
      }

      if (evaluation && validity !== 'EXPIRED' && validity !== 'NONE') {
        if (evaluation.result === PsychotechnicalResult.FIT) fit += 1;
        if (evaluation.result === PsychotechnicalResult.FIT_WITH_OBSERVATIONS) {
          fitWithObservations += 1;
        }
        if (evaluation.result === PsychotechnicalResult.UNFIT) unfit += 1;
      }

      const hasActiveLeave = patient.medicalLeaves.some(
        (leave) =>
          leave.status === MedicalLeaveStatus.ACTIVE &&
          startOfUtcDay(leave.startsAt) <= today &&
          (!leave.endsAt || startOfUtcDay(leave.endsAt) >= today),
      );
      if (hasActiveLeave) {
        activeLeaves += 1;
      }
    }

    const [completedLeaves, cancelledLeaves, alerts] = await Promise.all([
      this.prismaService.medicalLeave.count({
        where: { status: MedicalLeaveStatus.COMPLETED },
      }),
      this.prismaService.medicalLeave.count({
        where: { status: MedicalLeaveStatus.CANCELLED },
      }),
      this.prismaService.psychotechnicalEvaluation.findMany({
        where: {
          expiresAt: { gte: today, lte: soon },
        },
        orderBy: { expiresAt: 'asc' },
        take: 20,
        select: {
          id: true,
          expiresAt: true,
          result: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              recordNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      currentPsychotechnical,
      expiringSoon,
      expired,
      withoutPsychotechnical: none,
      fit,
      fitWithObservations,
      unfit,
      activeMedicalLeaves: activeLeaves,
      completedMedicalLeaves: completedLeaves,
      cancelledMedicalLeaves: cancelledLeaves,
      expiringSoonDays: PSYCHOTECHNICAL_EXPIRING_SOON_DAYS,
      /** Prepared for future automatic notifications. */
      alerts: {
        psychotechnicalExpiringSoon: alerts.map((item) => ({
          evaluationId: item.id,
          patientId: item.patient.id,
          patientName: `${item.patient.firstName} ${item.patient.lastName}`,
          recordNumber: item.patient.recordNumber,
          result: item.result,
          expiresAt: toDateOnlyString(item.expiresAt),
        })),
      },
    };
  }

  /**
   * Redacted roster for external agency interop (LSPD Medical Supervisor).
   * Never exposes diagnoses, reports, hospitalizations or clinical notes.
   */
  async listInteropRoster(query: SearchOccupationalHealthDto = {}) {
    const partnerKey = this.resolvePartnerKey(query.partner);
    const partner = INSTITUTIONAL_PARTNERS[partnerKey];
    const term = query.q?.trim() ?? '';

    const occupationFilter: Prisma.OccupationWhereInput = {
      isActive: true,
      OR: [
        { establishment: { slug: partner.slug } },
        {
          organization: {
            in: [...partner.aliases],
            mode: 'insensitive',
          },
        },
      ],
    };

    const patients = await this.prismaService.patient.findMany({
      where: {
        status: 'ACTIVE',
        linkedCharacterId: { not: null },
        linkedCharacter: {
          occupations: { some: occupationFilter },
        },
        ...(term
          ? {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { searchKey: { contains: term.toLowerCase() } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        recordNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
        linkedCharacter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            occupations: {
              where: { isActive: true },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
              take: 1,
              select: {
                organization: true,
                position: true,
                establishment: { select: { slug: true, name: true } },
              },
            },
          },
        },
        psychotechnicalEvaluations: {
          orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: {
            id: true,
            result: true,
            issuedAt: true,
            expiresAt: true,
            observations: true,
          },
        },
        medicalLeaves: {
          where: { status: MedicalLeaveStatus.ACTIVE },
          orderBy: { startsAt: 'desc' },
          take: 3,
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 200,
    });

    return {
      partner: partnerKey,
      items: patients.map((patient) => {
        const evaluation = patient.psychotechnicalEvaluations[0] ?? null;
        const validity = resolvePsychotechnicalValidity(evaluation);
        const today = startOfUtcDay();
        const activeLeave =
          patient.medicalLeaves.find(
            (leave) =>
              leave.status === MedicalLeaveStatus.ACTIVE &&
              startOfUtcDay(leave.startsAt) <= today &&
              (!leave.endsAt || startOfUtcDay(leave.endsAt) >= today),
          ) ?? null;
        const occupation = patient.linkedCharacter?.occupations?.[0] ?? null;

        return {
          patientId: patient.id,
          recordNumber: patient.recordNumber,
          fullName: [patient.firstName, patient.middleName, patient.lastName]
            .filter(Boolean)
            .join(' '),
          characterId: patient.linkedCharacter?.id ?? null,
          organization:
            occupation?.establishment?.name ?? occupation?.organization ?? partner.name,
          position: occupation?.position ?? null,
          psychotechnical: evaluation
            ? {
                result: evaluation.result,
                validity,
                expiresAt: toDateOnlyString(evaluation.expiresAt),
                issuedAt: toDateOnlyString(evaluation.issuedAt),
                hasPsychotechnical: true,
                isExpired: validity === 'EXPIRED',
                isExpiringSoon: validity === 'EXPIRING_SOON',
                // Observations only when FIT_WITH_OBSERVATIONS (authorized LSPD viewers).
                observations:
                  evaluation.result === PsychotechnicalResult.FIT_WITH_OBSERVATIONS
                    ? evaluation.observations
                    : null,
              }
            : {
                result: null,
                validity: 'NONE' as const,
                expiresAt: null,
                issuedAt: null,
                hasPsychotechnical: false,
                isExpired: false,
                isExpiringSoon: false,
                observations: null,
              },
          medicalLeave: {
            hasActiveLeave: Boolean(activeLeave),
            endsAt: activeLeave ? toDateOnlyString(activeLeave.endsAt) : null,
            startsAt: activeLeave ? toDateOnlyString(activeLeave.startsAt) : null,
          },
        };
      }),
    };
  }

  /**
   * Institutional financial summary for LSPD (uses immutable invoice billing snapshots).
   */
  async getInstitutionalFinance(query: {
    partner?: string;
    days?: number;
    from?: string;
    to?: string;
  } = {}) {
    const partnerKey = this.resolvePartnerKey(query.partner);
    const partner = INSTITUTIONAL_PARTNERS[partnerKey];

    let fromDate: Date;
    let toDate: Date;

    if (query.from && query.to) {
      const from = parseDateOnlySafe(query.from);
      const to = parseDateOnlySafe(query.to);
      if (!from || !to) {
        throw new BadRequestException('Invalid date range');
      }
      if (to < from) {
        throw new BadRequestException('to must be on or after from');
      }
      fromDate = from;
      toDate = to;
    } else {
      const days = [7, 15, 30].includes(Number(query.days)) ? Number(query.days) : 7;
      toDate = startOfUtcDay();
      fromDate = addUtcDays(toDate, -(days - 1));
    }

    const where: Prisma.PatientInvoiceWhereInput = {
      issuedAt: { gte: fromDate, lte: toDate },
      OR: [
        { billingEstablishmentSlug: partner.slug },
        {
          billingOrganization: {
            in: [...partner.aliases],
            mode: 'insensitive',
          },
        },
      ],
    };

    const [invoices, presets] = await Promise.all([
      this.prismaService.patientInvoice.findMany({
        where,
        orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          originalAmount: true,
          discountAmount: true,
          treatmentName: true,
          issuedAt: true,
          billingOrganization: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              recordNumber: true,
            },
          },
        },
      }),
      this.computePresetTotals(partner),
    ]);

    const totalBilled = invoices.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const agentIds = new Set(invoices.map((item) => item.patient.id));
    const lastInvoice = invoices[0] ?? null;

    return {
      partner: partnerKey,
      range: {
        from: toDateOnlyString(fromDate),
        to: toDateOnlyString(toDate),
      },
      presets,
      summary: {
        totalBilled: roundMoney(totalBilled),
        invoiceCount: invoices.length,
        averageInvoice:
          invoices.length > 0 ? roundMoney(totalBilled / invoices.length) : 0,
        agentsServed: agentIds.size,
        lastInvoiceAt: lastInvoice ? toDateOnlyString(lastInvoice.issuedAt) : null,
        lastInvoiceNumber: lastInvoice?.invoiceNumber ?? null,
      },
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        originalAmount: Number(invoice.originalAmount),
        discountAmount: Number(invoice.discountAmount),
        treatmentName: invoice.treatmentName,
        issuedAt: toDateOnlyString(invoice.issuedAt),
        billingOrganization: invoice.billingOrganization,
        patient: {
          id: invoice.patient.id,
          recordNumber: invoice.patient.recordNumber,
          fullName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
        },
      })),
    };
  }

  private async computePresetTotals(partner: (typeof INSTITUTIONAL_PARTNERS)['LSPD']) {
    const today = startOfUtcDay();
    const ranges = [7, 15, 30] as const;
    const result: Record<string, number> = {};

    for (const days of ranges) {
      const from = addUtcDays(today, -(days - 1));
      const agg = await this.prismaService.patientInvoice.aggregate({
        where: {
          issuedAt: { gte: from, lte: today },
          OR: [
            { billingEstablishmentSlug: partner.slug },
            {
              billingOrganization: {
                in: [...partner.aliases],
                mode: 'insensitive',
              },
            },
          ],
        },
        _sum: { amount: true },
      });
      result[`days${days}`] = roundMoney(Number(agg._sum.amount ?? 0));
    }

    return result;
  }

  /**
   * Redacted patient occupational card for interop roles.
   */
  async getInteropPatientCard(patientId: string) {
    const roster = await this.listInteropRoster({});
    const item = roster.items.find((entry) => entry.patientId === patientId);
    if (!item) {
      const patient = await this.prismaService.patient.findUnique({
        where: { id: patientId },
        select: { id: true },
      });
      if (!patient) {
        return null;
      }
      // Patient exists but is not part of the partner roster.
      return null;
    }
    return item;
  }

  private resolvePartnerKey(raw?: string): InstitutionalPartnerKey {
    const value = (raw ?? 'LSPD').trim().toUpperCase();
    if (value in INSTITUTIONAL_PARTNERS) {
      return value as InstitutionalPartnerKey;
    }
    return 'LSPD';
  }
}
