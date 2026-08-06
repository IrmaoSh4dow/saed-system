import {
  renderStatusBadge,
  toneForReportPriority,
  toneForReportStatus,
} from '../ui/status-badge.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  UNDER_REVIEW: 'En revisión',
  COMPLETED: 'Finalizado',
  ARCHIVED: 'Archivado',
};

const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const TYPE_LABELS = {
  CONSULTATION: 'Consulta',
  DIAGNOSTIC: 'Diagnóstico',
  PROCEDURE: 'Procedimiento',
  HOSPITALIZATION: 'Hospitalización',
  INTERNAL: 'Interno',
  OTHER: 'Otro',
};

/**
 * Enriched report row for feed layouts.
 */
export function renderReportCard(item, { dateLabel = '—' } = {}) {
  const lead = item.leadStaff
    ? `${item.leadStaff.character.firstName} ${item.leadStaff.character.lastName}`
    : 'Sin encargado';
  const department = item.department?.name ?? 'Sin departamento';
  const patient = item.patient
    ? `HC #${item.patient.recordNumber} · ${item.patient.firstName} ${item.patient.lastName}`
    : 'Sin paciente';
  const priorityTone = toneForReportPriority(item.priority);

  return `
    <a data-link href="/reports?id=${item.id}" class="record-card group">
      <div class="record-card-rail record-card-rail-${priorityTone}"></div>
      <div class="record-card-body">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">#${escapeHtml(item.reportNumber)}</span>
              <span class="text-[11px] text-ink-500">${TYPE_LABELS[item.type] ?? item.type}</span>
            </div>
            <h3 class="mt-2 text-base font-semibold text-white transition group-hover:text-brand-300">${escapeHtml(item.title)}</h3>
            <p class="mt-1 text-xs text-ink-400">${escapeHtml(patient)}</p>
            <p class="mt-2 text-sm text-ink-400">
              ${escapeHtml(lead)}
              <span class="text-ink-500"> · </span>
              ${escapeHtml(department)}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            ${renderStatusBadge({
              label: PRIORITY_LABELS[item.priority] ?? item.priority,
              tone: priorityTone,
            })}
            ${renderStatusBadge({
              label: STATUS_LABELS[item.status] ?? item.status,
              tone: toneForReportStatus(item.status),
            })}
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.04] pt-3">
          <p class="text-xs text-ink-500">${escapeHtml(dateLabel)}</p>
          <span class="text-xs font-medium text-brand-300 opacity-80 transition group-hover:opacity-100">Abrir informe →</span>
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
