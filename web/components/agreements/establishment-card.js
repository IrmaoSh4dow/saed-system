import { formatDiscountPercent } from '../../services/agreements.service.js';
import { resolveUploadUrl } from '../../utils/media.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDateLabel(value) {
  if (!value) return 'Sin vencimiento';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function renderEstablishmentAgreementCard(item, { canManage = false } = {}) {
  const logo = resolveUploadUrl(item.logoUrl);
  const agreement = item.activeAgreement;
  const hasAgreement = Boolean(agreement);

  return `
    <article class="panel group relative overflow-hidden transition duration-200 hover:border-brand-400/30">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.10),_transparent_50%)] opacity-0 transition duration-200 group-hover:opacity-100"></div>
      <div class="relative p-5">
        <div class="flex items-start gap-4">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-950">
            ${
              logo
                ? `<img src="${escapeHtml(logo)}" alt="" class="h-full w-full object-contain p-2" />`
                : `<span class="text-lg font-semibold text-brand-300">${escapeHtml((item.name ?? '?').slice(0, 1))}</span>`
            }
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate text-base font-semibold text-white">${escapeHtml(item.name)}</h3>
                <p class="mt-1 line-clamp-2 text-xs text-ink-400">${escapeHtml(item.description || 'Sin descripción')}</p>
              </div>
              <span class="status-pill ${hasAgreement ? 'status-pill-success' : ''}">
                ${hasAgreement ? 'Convenio activo' : 'Sin convenio'}
              </span>
            </div>
          </div>
        </div>

        <dl class="mt-5 grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
            <dt class="text-[11px] uppercase tracking-wide text-ink-500">Descuento</dt>
            <dd class="mt-1 text-sm font-semibold ${hasAgreement ? 'text-emerald-300' : 'text-ink-400'}">
              ${hasAgreement ? escapeHtml(formatDiscountPercent(agreement.discountPercent)) : '—'}
            </dd>
          </div>
          <div class="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
            <dt class="text-[11px] uppercase tracking-wide text-ink-500">Vigencia</dt>
            <dd class="mt-1 text-sm font-medium text-ink-200">
              ${
                hasAgreement
                  ? `${escapeHtml(formatDateLabel(agreement.startsAt))}${agreement.endsAt ? ` → ${escapeHtml(formatDateLabel(agreement.endsAt))}` : ''}`
                  : '—'
              }
            </dd>
          </div>
        </dl>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-ink-500">${item.activeOccupationCount ?? 0} ocupaciones activas</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" data-open-establishment="${escapeHtml(item.id)}">
              Ver detalle
            </button>
            ${
              canManage
                ? `<button type="button" class="btn-primary !px-3 !py-1.5 text-xs" data-manage-agreement="${escapeHtml(item.id)}" data-establishment-name="${escapeHtml(item.name)}" data-active-agreement="${agreement?.id ?? ''}">
                    ${hasAgreement ? 'Editar convenio' : 'Crear convenio'}
                  </button>`
                : ''
            }
          </div>
        </div>
      </div>
    </article>
  `;
}
