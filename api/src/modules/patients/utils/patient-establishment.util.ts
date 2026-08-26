import { supportsInstitutionalBadge } from '../../../common/constants/institutional-partners';

const BADGE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/**
 * Badge/placa eligibility. Every institutional partner that issues badges
 * (LSPD placa, LSCSO estrella) qualifies; civilian establishments never do.
 */
export function supportsBadgeNumber(
  establishment?: { slug?: string | null; name?: string | null } | null,
): boolean {
  return supportsInstitutionalBadge(establishment);
}

export function normalizeBadgeNumber(value?: string | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim().toUpperCase();
  return trimmed || null;
}

export function isValidBadgeNumber(value: string): boolean {
  return BADGE_PATTERN.test(value) && value.length >= 1 && value.length <= 32;
}
