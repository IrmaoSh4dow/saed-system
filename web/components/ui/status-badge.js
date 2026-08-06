const TONE_CLASS = {
  default: 'status-pill',
  brand: 'status-pill status-pill-success',
  success: 'status-pill status-pill-success',
  warning: 'status-pill status-pill-warning',
  danger: 'status-pill status-pill-danger',
  muted: 'status-pill',
};

/**
 * @param {{ label: string, tone?: keyof typeof TONE_CLASS }} options
 */
export function renderStatusBadge({ label = '', tone = 'default' } = {}) {
  return `<span class="${TONE_CLASS[tone] ?? TONE_CLASS.default}">${label}</span>`;
}

export function toneForReportStatus(status) {
  return (
    {
      PENDING: 'warning',
      IN_PROGRESS: 'brand',
      UNDER_REVIEW: 'warning',
      COMPLETED: 'success',
      ARCHIVED: 'muted',
    }[status] ?? 'default'
  );
}

export function toneForReportPriority(priority) {
  return (
    {
      LOW: 'muted',
      MEDIUM: 'default',
      HIGH: 'warning',
      CRITICAL: 'danger',
    }[priority] ?? 'default'
  );
}

export function toneForComplaintStatus(status) {
  return (
    {
      PENDING: 'warning',
      UNDER_INVESTIGATION: 'brand',
      WAITING_FOR_CITIZEN: 'warning',
      RESOLVED: 'success',
      REJECTED: 'danger',
      CLOSED: 'muted',
    }[status] ?? 'default'
  );
}

export function toneForAppointmentStatus(status) {
  return (
    {
      PENDING: 'warning',
      SCHEDULED: 'brand',
      IN_PROGRESS: 'brand',
      WAITING_FOR_CITIZEN: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'muted',
      REJECTED: 'danger',
      NO_SHOW: 'danger',
    }[status] ?? 'default'
  );
}
