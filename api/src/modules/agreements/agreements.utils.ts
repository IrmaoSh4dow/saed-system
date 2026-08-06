import { AgreementStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

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

/** Calendar day in UTC for agreement validity checks. */
export function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * An agreement is currently enforceable when status is ACTIVE and today is within [startsAt, endsAt].
 * Expired-by-date ACTIVE rows are treated as not active (callers may persist EXPIRED separately).
 */
export function isAgreementCurrentlyActive(agreement: {
  status: AgreementStatus;
  startsAt: Date;
  endsAt: Date | null;
}): boolean {
  if (agreement.status !== AgreementStatus.ACTIVE) {
    return false;
  }

  const today = startOfUtcDay();
  const startsAt = startOfUtcDay(agreement.startsAt);
  if (startsAt > today) {
    return false;
  }

  if (agreement.endsAt) {
    const endsAt = startOfUtcDay(agreement.endsAt);
    if (endsAt < today) {
      return false;
    }
  }

  return true;
}

export function computeDiscount(originalAmount: number, discountPercent: number) {
  const safeOriginal = Math.max(0, Number(originalAmount) || 0);
  const safePercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = Math.round(((safeOriginal * safePercent) / 100) * 100) / 100;
  const finalAmount = Math.round((safeOriginal - discountAmount) * 100) / 100;

  return {
    originalAmount: safeOriginal,
    discountPercent: safePercent,
    discountAmount,
    finalAmount,
  };
}

export function slugifyEstablishmentName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
