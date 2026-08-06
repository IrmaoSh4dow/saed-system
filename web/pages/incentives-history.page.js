import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  formatIncentiveMoney,
  listIncentivePayments,
} from '../services/incentives.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { resolveUploadUrl } from '../utils/media.js';
import { PERMISSIONS } from '../utils/permissions.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function incentivesHistoryPage({ renderModuleNav } = {}) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.INCENTIVES_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'incentives-alert' })}
      ${renderPageHeader({
        eyebrow: 'Auditoría financiera',
        title: 'Historial global de incentivos',
        description:
          'Consulta todos los pagos institucionales. Filtra por empleado, rango, fechas o responsable del pago.',
      })}
      ${typeof renderModuleNav === 'function' ? renderModuleNav('history') : ''}

      <section class="panel p-4 md:p-5">
        <form id="incentive-history-form" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="md:col-span-2 xl:col-span-2">
            <label class="form-label" for="history-q">Buscar</label>
            <input id="history-q" class="form-input" placeholder="Empleado, rango o quien pagó..." />
          </div>
          <div>
            <label class="form-label" for="history-from">Desde</label>
            <input id="history-from" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="history-to">Hasta</label>
            <input id="history-to" type="date" class="form-input" />
          </div>
          <div class="md:col-span-2 xl:col-span-4 flex flex-wrap gap-2">
            <button type="submit" class="btn-primary !py-2.5">Filtrar</button>
            <button type="button" id="history-clear" class="btn-secondary !py-2.5">Limpiar</button>
          </div>
        </form>
      </section>

      <section id="incentive-history-feed" class="space-y-3">
        <p class="text-sm text-ink-400">Cargando historial...</p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Historial de incentivos',
      currentPath: '/incentives/history',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Historial de incentivos · SAED';

      const renderList = (items) => {
        const feed = root.querySelector('#incentive-history-feed');
        if (!feed) return;
        const list = Array.isArray(items) ? items : [];

        feed.innerHTML = list.length
          ? list
              .map((payment) => {
                const avatarUrl = resolveUploadUrl(payment.staff?.avatarUrl);
                return `
          <article class="panel px-4 py-4 md:px-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface-950 text-sm font-semibold text-brand-300">
                  ${
                    avatarUrl
                      ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                      : escapeHtml((payment.staff?.fullName || '?').slice(0, 1))
                  }
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-base font-semibold text-white">${escapeHtml(payment.staff?.fullName ?? '—')}</h3>
                    <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                      #${escapeHtml(payment.staff?.employeeNumber ?? '—')}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-ink-400">
                    ${escapeHtml(payment.rankName)}
                    ${payment.staff?.department?.name ? ` · ${escapeHtml(payment.staff.department.name)}` : ''}
                  </p>
                  <p class="mt-2 text-sm text-ink-300">
                    Pagado por <span class="text-white">${escapeHtml(payment.paidBy?.fullName ?? '—')}</span>
                  </p>
                  ${
                    payment.notes
                      ? `<p class="mt-2 text-sm text-ink-400">${escapeHtml(payment.notes)}</p>`
                      : ''
                  }
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold text-white">$${formatIncentiveMoney(payment.amount)}</p>
                <p class="mt-1 text-xs text-ink-500">${escapeHtml(formatDateTimeLabel(payment.paidAt))}</p>
              </div>
            </div>
          </article>`;
              })
              .join('')
          : renderEmptyState({
              title: 'Sin pagos',
              description: 'No hay registros que coincidan con los filtros.',
              iconName: 'archive',
            });
      };

      const load = async () => {
        try {
          const params = {
            q: root.querySelector('#history-q')?.value?.trim() || undefined,
            from: root.querySelector('#history-from')?.value || undefined,
            to: root.querySelector('#history-to')?.value || undefined,
          };
          const items = await listIncentivePayments(params);
          renderList(items);
        } catch (error) {
          setAuthAlert(root, {
            id: 'incentives-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      void load();

      root.querySelector('#incentive-history-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        void load();
      });

      root.querySelector('#history-clear')?.addEventListener('click', () => {
        ['#history-q', '#history-from', '#history-to'].forEach((selector) => {
          const input = root.querySelector(selector);
          if (input) input.value = '';
        });
        void load();
      });

      return cleanupLayout;
    },
  };
}
