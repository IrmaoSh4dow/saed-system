import { MedicalLeaveStatus, Prisma, PsychotechnicalResult } from '@prisma/client';
import { PSYCHOTECHNICAL_EXPIRING_SOON_DAYS } from './occupational-health.constants';

export type PsychotechnicalValidity = 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'NONE';

export function decimalToNumber(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

export function toDateOnlyString(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value?: string | null): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolvePsychotechnicalValidity(evaluation: {
  expiresAt: Date | null;
} | null): PsychotechnicalValidity {
  if (!evaluation) {
    return 'NONE';
  }

  if (!evaluation.expiresAt) {
    return 'CURRENT';
  }

  const today = startOfUtcDay();
  const expiresAt = startOfUtcDay(evaluation.expiresAt);
  if (expiresAt < today) {
    return 'EXPIRED';
  }

  const soonThreshold = addUtcDays(today, PSYCHOTECHNICAL_EXPIRING_SOON_DAYS);
  if (expiresAt <= soonThreshold) {
    return 'EXPIRING_SOON';
  }

  return 'CURRENT';
}

export function isMedicalLeaveCurrentlyActive(leave: {
  status: MedicalLeaveStatus;
  startsAt: Date;
  endsAt: Date | null;
}): boolean {
  if (leave.status !== MedicalLeaveStatus.ACTIVE) {
    return false;
  }

  const today = startOfUtcDay();
  if (startOfUtcDay(leave.startsAt) > today) {
    return false;
  }

  if (leave.endsAt && startOfUtcDay(leave.endsAt) < today) {
    return false;
  }

  return true;
}

export function psychotechnicalResultLabel(result: PsychotechnicalResult): string {
  switch (result) {
    case PsychotechnicalResult.FIT:
      return 'Apto';
    case PsychotechnicalResult.FIT_WITH_OBSERVATIONS:
      return 'Apto con Observaciones';
    case PsychotechnicalResult.UNFIT:
      return 'No Apto';
    default:
      return result;
  }
}

export function medicalLeaveStatusLabel(status: MedicalLeaveStatus): string {
  switch (status) {
    case MedicalLeaveStatus.ACTIVE:
      return 'Activa';
    case MedicalLeaveStatus.COMPLETED:
      return 'Finalizada';
    case MedicalLeaveStatus.CANCELLED:
      return 'Cancelada';
    default:
      return status;
  }
}

export function differenceInCalendarDays(startsAt: Date, endsAt: Date | null): number | null {
  if (!endsAt) {
    return null;
  }
  const start = startOfUtcDay(startsAt).getTime();
  const end = startOfUtcDay(endsAt).getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
}
