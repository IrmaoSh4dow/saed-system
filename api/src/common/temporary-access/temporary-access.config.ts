/**
 * Central configuration for temporary resource access grants.
 * Keep durations out of domain services so they can change without code rewrites.
 */
export const TEMPORARY_ACCESS_CONFIG = {
  MEDICAL_RECORD_DURATION_MS: 24 * 60 * 60 * 1000,
  MEDICAL_REPORT_DURATION_MS: 24 * 60 * 60 * 1000,
  /** Prepared for future “expires soon” notifications. */
  EXPIRY_WARNING_MS: 60 * 60 * 1000,
  /** Optional override ceiling when callers pass a custom durationHours. */
  MAX_DURATION_HOURS: 168,
} as const;
