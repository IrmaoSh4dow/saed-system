import { renderStatusBadge } from '../ui/status-badge.js';

export const INCENTIVE_STATUS_LABELS = {
  AVAILABLE: 'Disponible para pagar',
  NOT_AVAILABLE: 'Aún no disponible',
  PAID_RECENTLY: 'Pagado recientemente',
  OVERDUE: 'Pago vencido',
  NO_CONFIGURATION: 'Sin configuración',
  INACTIVE_STAFF: 'Personal inactivo',
};

export function toneForIncentiveStatus(status) {
  return (
    {
      AVAILABLE: 'success',
      NOT_AVAILABLE: 'muted',
      PAID_RECENTLY: 'brand',
      OVERDUE: 'danger',
      NO_CONFIGURATION: 'warning',
      INACTIVE_STAFF: 'muted',
    }[status] ?? 'default'
  );
}

export function renderIncentiveStatusBadge(status) {
  return renderStatusBadge({
    label: INCENTIVE_STATUS_LABELS[status] ?? status ?? '—',
    tone: toneForIncentiveStatus(status),
  });
}

export function railToneForIncentiveStatus(status) {
  const tone = toneForIncentiveStatus(status);
  if (tone === 'success') return 'success';
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'brand') return 'brand';
  return 'muted';
}
