/** Institutional incentive cycle length in days. */
export const INCENTIVE_CYCLE_DAYS = 7;

/** Hours after payment to still show "paid recently" while waiting for next cycle. */
export const INCENTIVE_RECENT_HOURS = 48;

/** Days past eligibility without payment → overdue. */
export const INCENTIVE_OVERDUE_DAYS = 7;

export enum IncentiveEligibilityStatus {
  AVAILABLE = 'AVAILABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  PAID_RECENTLY = 'PAID_RECENTLY',
  OVERDUE = 'OVERDUE',
  NO_CONFIGURATION = 'NO_CONFIGURATION',
  INACTIVE_STAFF = 'INACTIVE_STAFF',
}

/** Default amounts keyed by rank slug (seed / bootstrap only). */
export const DEFAULT_INCENTIVE_AMOUNTS: Record<string, number> = {
  intern: 2500,
  resident: 5000,
  doctor: 8000,
  specialist: 10000,
  'department-chief': 15000,
  'deputy-medical-director': 20000,
  'medical-director': 25000,
  administrator: 25000,
};
