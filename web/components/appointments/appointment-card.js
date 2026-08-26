import { renderStatusBadge, toneForAppointmentStatus } from '../ui/status-badge.js';

export const APPOINTMENT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  SCHEDULED: 'Programada',
  IN_PROGRESS: 'En curso',
  WAITING_FOR_CITIZEN: 'Esperando ciudadano',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  REJECTED: 'Rechazada',
  NO_SHOW: 'No se presentó',
};

export const APPOINTMENT_TYPE_LABELS = {
  MEDICAL: 'Médica',
  PSYCHOTECHNICAL_CIVIL: 'Psicotécnico civil',
  PSYCHOTECHNICAL_LSPD: 'Psicotécnico LSPD',
  PSYCHOTECHNICAL_LSCSO: 'Psicotécnico LSCSO',
};

/**
 * Enriched appointment case card.
 */
export function renderAppointmentCard(item, { dateLabel = '—' } = {}) {
  const assignee = item.assignee
    ? `${item.assignee.firstName} ${item.assignee.lastName}`
    : 'Sin asignar';
  const tone = toneForAppointmentStatus(item.status);

  return `
    <a data-link href="/appointments?id=${item.id}" class="record-card group">
      <div class="record-card-rail record-card-rail-${tone}"></div>
      <div class="record-card-body">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Cita #${escapeHtml(item.caseNumber)}</span>
              ${renderStatusBadge({
                label: APPOINTMENT_STATUS_LABELS[item.status] ?? item.status,
                tone,
              })}
            </div>
            <h3 class="mt-2 text-base font-semibold text-white transition group-hover:text-brand-300">${escapeHtml(item.title)}</h3>
            <p class="mt-2 text-sm text-ink-400">
              ${escapeHtml(APPOINTMENT_TYPE_LABELS[item.type] ?? item.type)}
            </p>
          </div>
          <div class="text-right">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Personal asignado</p>
            <p class="mt-1 text-sm text-ink-200">${escapeHtml(assignee)}</p>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.04] pt-3">
          <p class="text-xs text-ink-500">${escapeHtml(dateLabel)}</p>
          <span class="text-xs font-medium text-brand-300 opacity-80 transition group-hover:opacity-100">Abrir cita →</span>
        </div>
      </div>
    </a>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
