import { renderStatusBadge, toneForComplaintStatus } from '../ui/status-badge.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_INVESTIGATION: 'En investigación',
  WAITING_FOR_CITIZEN: 'Esperando ciudadano',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
  CLOSED: 'Cerrada',
};

/**
 * Enriched complaint case card.
 */
export function renderComplaintCard(item, { dateLabel = '—' } = {}) {
  const officer = item.accusedStaff;
  const officerName = officer
    ? `${officer.character.firstName} ${officer.character.lastName}`
    : 'Personal no indicado';
  const investigator = item.investigator
    ? `${item.investigator.firstName} ${item.investigator.lastName}`
    : 'Sin investigador';
  const tone = toneForComplaintStatus(item.status);

  return `
    <a data-link href="/complaints?id=${item.id}" class="record-card group">
      <div class="record-card-rail record-card-rail-${tone}"></div>
      <div class="record-card-body">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Caso #${escapeHtml(item.caseNumber)}</span>
              ${renderStatusBadge({
                label: STATUS_LABELS[item.status] ?? item.status,
                tone,
              })}
            </div>
            <h3 class="mt-2 text-base font-semibold text-white transition group-hover:text-brand-300">${escapeHtml(item.title)}</h3>
            <p class="mt-2 text-sm text-ink-400">
              ${escapeHtml(officerName)}${officer ? ` · ${escapeHtml(officer.employeeNumber)}` : ''}
            </p>
          </div>
          <div class="text-right">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Investigador</p>
            <p class="mt-1 text-sm text-ink-200">${escapeHtml(investigator)}</p>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.04] pt-3">
          <p class="text-xs text-ink-500">${escapeHtml(dateLabel)}</p>
          <span class="text-xs font-medium text-brand-300 opacity-80 transition group-hover:opacity-100">Abrir caso →</span>
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
