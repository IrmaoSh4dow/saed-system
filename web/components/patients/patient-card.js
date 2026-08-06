import { renderStatusBadge } from '../ui/status-badge.js';

export const PATIENT_STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  DECEASED: 'Fallecido',
  ARCHIVED: 'Archivado',
};

export const BLOOD_TYPE_LABELS = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  UNKNOWN: 'Desconocido',
};

export const SEX_LABELS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
};

function toneForStatus(status) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'INACTIVE') return 'warning';
  if (status === 'DECEASED') return 'danger';
  return 'muted';
}

/**
 * Visual patient registry card (clinical identity, not Character).
 */
export function renderPatientCard(item, { dateLabel = '—' } = {}) {
  const initials =
    `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const tone = toneForStatus(item.status);
  const blood = BLOOD_TYPE_LABELS[item.bloodType] ?? item.bloodType ?? '—';

  return `
    <a data-link href="/patients?id=${item.id}" class="record-card group">
      <div class="record-card-rail record-card-rail-${tone}"></div>
      <div class="record-card-body">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <div class="flex h-12 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface-950 text-sm font-semibold text-brand-300">
              ${
                item.avatarUrl
                  ? `<img src="${escapeHtml(item.avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                  : escapeHtml(initials)
              }
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">HC #${escapeHtml(item.recordNumber)}</span>
                ${renderStatusBadge({
                  label: PATIENT_STATUS_LABELS[item.status] ?? item.status,
                  tone,
                })}
              </div>
              <h3 class="mt-2 text-base font-semibold text-white transition group-hover:text-brand-300">
                ${escapeHtml(item.fullName ?? `${item.firstName} ${item.lastName}`)}
              </h3>
              <p class="mt-2 text-sm text-ink-400">
                ${item.birthDate ? escapeHtml(item.birthDate) : 'Sin fecha de nacimiento'}
                ${item.phone ? ` · ${escapeHtml(item.phone)}` : ''}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Grupo</p>
            <p class="mt-1 text-sm text-ink-200">${escapeHtml(blood)}</p>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.04] pt-3">
          <p class="text-xs text-ink-500">${escapeHtml(dateLabel)}</p>
          <span class="text-xs font-medium text-brand-300 opacity-80 transition group-hover:opacity-100">Abrir expediente →</span>
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
