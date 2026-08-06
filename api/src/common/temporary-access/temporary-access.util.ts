export interface ITemporaryAccessWindow {
  status?: string | null;
  expiresAt?: Date | string | null;
  revokedAt?: Date | string | null;
  grantedAt?: Date | string | null;
}

export function computeExpiresAt(
  durationMs: number,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + durationMs);
}

export function resolveDurationMs(
  defaultMs: number,
  durationHours?: number | null,
  maxHours = 168,
): number {
  if (durationHours == null || Number.isNaN(durationHours)) {
    return defaultMs;
  }
  const hours = Math.min(Math.max(Number(durationHours), 1), maxHours);
  return Math.round(hours * 60 * 60 * 1000);
}

export function isTemporaryAccessActive(
  grant: ITemporaryAccessWindow,
  now: Date = new Date(),
): boolean {
  if (!grant?.expiresAt) {
    return false;
  }
  if (grant.status && grant.status !== 'ACTIVE' && grant.status !== 'APPROVED') {
    return false;
  }
  if (grant.revokedAt) {
    return false;
  }
  return new Date(grant.expiresAt).getTime() > now.getTime();
}

export function remainingAccessMs(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date(),
): number {
  if (!expiresAt) {
    return 0;
  }
  return Math.max(0, new Date(expiresAt).getTime() - now.getTime());
}

export function shouldWarnExpiry(
  expiresAt: Date | string | null | undefined,
  warningMs: number,
  now: Date = new Date(),
): boolean {
  const remaining = remainingAccessMs(expiresAt, now);
  return remaining > 0 && remaining <= warningMs;
}
