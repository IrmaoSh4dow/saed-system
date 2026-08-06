import { formatIncentiveMoney } from '../../services/incentives.service.js';
import { formatDateShort, formatDateTimeLabel } from '../../utils/date.js';
import { resolveUploadUrl } from '../../utils/media.js';
import {
  railToneForIncentiveStatus,
  renderIncentiveStatusBadge,
} from './incentive-status.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Institutional staff incentive card for the roster grid.
 */
export function renderIncentiveCard(item, { canPay = false } = {}) {
  const initials =
    `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const rail = railToneForIncentiveStatus(item.status);
  const showPay = Boolean(canPay && item.canPay);
  const avatarUrl = resolveUploadUrl(item.avatarUrl);

  return `
    <article class="record-card group" data-incentive-card data-staff-id="${escapeHtml(item.staffProfileId)}">
      <div class="record-card-rail record-card-rail-${rail}"></div>
      <div class="record-card-body">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-950 text-sm font-semibold text-brand-300">
              ${
                avatarUrl
                  ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                  : escapeHtml(initials)
              }
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                  #${escapeHtml(item.employeeNumber)}
                </span>
                ${renderIncentiveStatusBadge(item.status)}
              </div>
              <h3 class="mt-2 text-base font-semibold text-white">
                ${escapeHtml(item.fullName)}
              </h3>
              <p class="mt-1 text-sm text-ink-400">
                ${escapeHtml(item.rank?.name ?? '—')}
                ${item.callsign ? ` · ${escapeHtml(item.callsign)}` : ''}
                ${item.department?.name ? ` · ${escapeHtml(item.department.name)}` : ''}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Incentivo</p>
            <p class="mt-1 text-lg font-semibold text-white">$${formatIncentiveMoney(item.incentiveAmount)}</p>
          </div>
        </div>

        <dl class="mt-4 grid gap-3 border-t border-white/[0.04] pt-3 sm:grid-cols-2">
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Último pago</dt>
            <dd class="mt-1 text-sm text-ink-200">${escapeHtml(formatDateTimeLabel(item.lastPaidAt))}</dd>
          </div>
          <div>
            <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Próximo disponible</dt>
            <dd class="mt-1 text-sm text-ink-200">${escapeHtml(formatDateShort(item.nextEligibleAt))}</dd>
          </div>
        </dl>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <a
            data-link
            href="/incentives?staff=${escapeHtml(item.staffProfileId)}"
            class="text-xs font-medium text-brand-300 transition hover:text-brand-200"
          >
            Ver historial →
          </a>
          ${
            showPay
              ? `<button
                  type="button"
                  class="btn-primary !py-2 !text-sm"
                  data-pay-incentive
                  data-staff-id="${escapeHtml(item.staffProfileId)}"
                  data-staff-name="${escapeHtml(item.fullName)}"
                  data-amount="${escapeHtml(item.incentiveAmount)}"
                >
                  Pagar incentivo
                </button>`
              : `<span class="text-xs text-ink-500">Sin acción disponible</span>`
          }
        </div>
      </div>
    </article>
  `;
}
