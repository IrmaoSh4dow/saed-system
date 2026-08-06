import { LSPD_ESTABLISHMENT_SLUG } from '../../../common/constants/workplaces';

const BADGE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

export function isLspdEstablishment(establishment?: {
  slug?: string | null;
  name?: string | null;
} | null): boolean {
  if (!establishment) {
    return false;
  }
  if (establishment.slug?.toLowerCase() === LSPD_ESTABLISHMENT_SLUG) {
    return true;
  }
  return (establishment.name ?? '').trim().toLowerCase() === 'lspd';
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
