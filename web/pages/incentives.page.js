import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderIncentiveCard } from '../components/incentives/incentive-card.js';
import {
  INCENTIVE_STATUS_LABELS,
  renderIncentiveStatusBadge,
} from '../components/incentives/incentive-status.js';
import {
  bindAppModal,
  closeAppModal,
  openAppModal,
  renderAppModal,
  setAppModalContent,
} from '../components/ui/modal.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  formatIncentiveMoney,
  getIncentiveStaffDetail,
  getIncentivesDashboard,
  listIncentiveStaff,
  payIncentive,
} from '../services/incentives.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { resolveUploadUrl } from '../utils/media.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { incentivesConfigurationPage } from './incentives-configuration.page.js';
import { incentivesHistoryPage } from './incentives-history.page.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderModuleNav(active = 'roster') {
  const canConfig = can(PERMISSIONS.INCENTIVES_CONFIGURATION);
  const items = [
    { id: 'roster', href: '/incentives', label: 'Personal' },
    { id: 'history', href: '/incentives/history', label: 'Historial global' },
    ...(canConfig
      ? [{ id: 'configuration', href: '/incentives/configuration', label: 'Configuración' }]
      : []),
  ];

  return `
    <nav class="flex flex-wrap gap-2" aria-label="Secciones de incentivos">
      ${items
        .map(
          (item) => `
        <a
          data-link
          href="${item.href}"
          class="rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
            item.id === active
              ? 'border-brand-500/40 bg-brand-500/15 text-brand-200'
              : 'border-white/10 bg-white/[0.02] text-ink-300 hover:border-white/20 hover:text-white'
          }"
        >${item.label}</a>`,
        )
        .join('')}
    </nav>
  `;
}

export function incentivesPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.INCENTIVES_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const path = window.location.pathname;
  if (path === '/incentives/history') {
    return incentivesHistoryPage({ renderModuleNav });
  }
  if (path === '/incentives/configuration') {
    return incentivesConfigurationPage({ renderModuleNav });
  }

  const staffId = new URLSearchParams(window.location.search).get('staff');
  if (staffId) {
    return incentiveStaffDetailPage(staffId, { renderModuleNav });
  }

  const canPay = can(PERMISSIONS.INCENTIVES_PAY);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'incentives-alert' })}
      ${renderPageHeader({
        eyebrow: 'Administración financiera',
        title: 'Incentivos',
        description:
          'Control institucional del pago periódico al personal SAED. Ciclo de 7 días, montos por rango y trazabilidad completa.',
      })}

      ${renderModuleNav('roster')}

      <div id="incentives-summary">
        ${renderSummaryStrip([
          { label: 'Pagados este mes', value: '—' },
          { label: 'Total mes', value: '—', tone: 'brand' },
          { label: 'Elegibles', value: '—', tone: 'brand' },
          { label: 'Pendientes', value: '—', tone: 'warning' },
        ])}
      </div>

      <section class="panel p-4 md:p-5">
        <form id="incentives-search-form" class="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div>
            <label class="form-label" for="incentives-query">Buscar personal</label>
            <input
              id="incentives-query"
              class="form-input"
              placeholder="Nombre, número de empleado, departamento o rango..."
              autocomplete="off"
            />
          </div>
          <div class="flex items-end">
            <button type="submit" class="btn-secondary w-full">Buscar</button>
          </div>
          <div class="flex items-end">
            <button type="button" id="incentives-search-clear" class="btn-secondary w-full">Limpiar</button>
          </div>
        </form>
      </section>

      <section class="space-y-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Plantilla</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Personal SAED</h3>
        </div>
        <div id="incentives-feed" class="record-feed">
          <p class="text-sm text-ink-400">Cargando personal...</p>
        </div>
      </section>

      ${renderAppModal({
        id: 'incentive-pay-modal',
        title: 'Confirmar pago de incentivo',
        size: 'md',
      })}
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Incentivos', currentPath: '/incentives' }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      const cleanupModal = bindAppModal(root, { modalId: 'incentive-pay-modal' });
      document.title = 'Incentivos · SAED';
      let searchTimer = null;
      let paying = false;

      const paintSummary = (stats) => {
        const summary = root.querySelector('#incentives-summary');
        if (!summary || !stats) return;
        summary.innerHTML = renderSummaryStrip([
          { label: 'Pagados este mes', value: String(stats.paidThisMonth ?? 0) },
          {
            label: 'Total mes',
            value: `$${formatIncentiveMoney(stats.totalPaidThisMonth)}`,
            tone: 'brand',
          },
          {
            label: 'Elegibles',
            value: String(stats.eligibleNow ?? 0),
            tone: 'brand',
          },
          {
            label: 'En ciclo',
            value: String(stats.pendingCycle ?? 0),
            tone: 'warning',
          },
        ]);
      };

      const bindPayButtons = () => {
        root.querySelectorAll('[data-pay-incentive]').forEach((button) => {
          button.addEventListener('click', () => {
            const id = button.getAttribute('data-staff-id');
            const name = button.getAttribute('data-staff-name') || 'empleado';
            const amount = button.getAttribute('data-amount') || '0';
            openPayModal({ staffProfileId: id, fullName: name, amount });
          });
        });
      };

      const openPayModal = ({ staffProfileId, fullName, amount }) => {
        setAppModalContent(root, {
          modalId: 'incentive-pay-modal',
          title: 'Confirmar pago de incentivo',
          bodyHtml: `
            <div class="space-y-4">
              <p class="text-sm text-ink-300">
                Vas a registrar el incentivo de
                <span class="font-semibold text-white">${escapeHtml(fullName)}</span>
                por
                <span class="font-semibold text-brand-300">$${formatIncentiveMoney(amount)}</span>.
              </p>
              <p class="text-sm text-ink-400">
                El ciclo de 7 días se recalculará automáticamente. Este pago quedará en el historial y en la auditoría.
              </p>
              <div>
                <label class="form-label" for="incentive-pay-notes">Observaciones (opcional)</label>
                <textarea
                  id="incentive-pay-notes"
                  class="form-input min-h-[96px]"
                  maxlength="2000"
                  placeholder="Referencia interna, número de transferencia, etc."
                ></textarea>
              </div>
            </div>
          `,
          footerHtml: `
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button
              type="button"
              class="btn-primary"
              id="incentive-pay-confirm"
              data-staff-id="${escapeHtml(staffProfileId)}"
            >
              Confirmar pago
            </button>
          `,
        });
        openAppModal(root, 'incentive-pay-modal');

        root.querySelector('#incentive-pay-confirm')?.addEventListener('click', async (event) => {
          if (paying) return;
          paying = true;
          const confirmBtn = event.currentTarget;
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Registrando...';
          try {
            const notes = root.querySelector('#incentive-pay-notes')?.value?.trim() || undefined;
            await payIncentive(staffProfileId, { notes });
            closeAppModal(root, 'incentive-pay-modal');
            setAuthAlert(root, {
              id: 'incentives-alert',
              type: 'success',
              message: `Incentivo de ${fullName} registrado correctamente.`,
            });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'incentives-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          } finally {
            paying = false;
          }
        });
      };

      const renderStaff = (items) => {
        const list = Array.isArray(items) ? items : [];
        const feed = root.querySelector('#incentives-feed');
        if (feed) {
          feed.innerHTML = list.length
            ? list.map((item) => renderIncentiveCard(item, { canPay })).join('')
            : renderEmptyState({
                title: 'Sin personal',
                description: 'No hay perfiles SAED que coincidan con la búsqueda.',
                iconName: 'users',
              });
        }

        bindPayButtons();
      };

      const load = async (query = '') => {
        try {
          const [dashboard, staff] = await Promise.all([
            getIncentivesDashboard(),
            listIncentiveStaff(query),
          ]);
          paintSummary(dashboard.stats);
          renderStaff(staff);
        } catch (error) {
          setAuthAlert(root, {
            id: 'incentives-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      void load();

      root.querySelector('#incentives-search-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        void load(root.querySelector('#incentives-query')?.value ?? '');
      });

      root.querySelector('#incentives-query')?.addEventListener('input', (event) => {
        clearTimeout(searchTimer);
        const value = event.target.value;
        searchTimer = setTimeout(() => void load(value), 280);
      });

      root.querySelector('#incentives-search-clear')?.addEventListener('click', () => {
        const input = root.querySelector('#incentives-query');
        if (input) input.value = '';
        void load();
      });

      return () => {
        clearTimeout(searchTimer);
        cleanupModal();
        cleanupLayout();
      };
    },
  };
}

function incentiveStaffDetailPage(staffProfileId, { renderModuleNav }) {
  const canPay = can(PERMISSIONS.INCENTIVES_PAY);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'incentives-alert' })}
      ${renderPageHeader({
        eyebrow: 'Incentivos',
        title: 'Historial del empleado',
        description: 'Registro inmutable de pagos, montos y rangos utilizados en cada ciclo.',
        actionsHtml: `<a data-link href="/incentives" class="btn-secondary !py-2.5">Volver</a>`,
      })}
      ${renderModuleNav('roster')}
      <section id="incentive-staff-detail" class="panel p-5 md:p-6">
        <p class="text-sm text-ink-400">Cargando ficha...</p>
      </section>
      ${renderAppModal({
        id: 'incentive-pay-modal',
        title: 'Confirmar pago de incentivo',
        size: 'md',
      })}
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Historial de incentivo',
      currentPath: '/incentives',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      const cleanupModal = bindAppModal(root, { modalId: 'incentive-pay-modal' });
      document.title = 'Historial de incentivo · SAED';
      let paying = false;

      const paint = async () => {
        try {
          const detail = await getIncentiveStaffDetail(staffProfileId);
          const host = root.querySelector('#incentive-staff-detail');
          if (!host) return;

          const initials =
            `${detail.firstName?.[0] ?? ''}${detail.lastName?.[0] ?? ''}`.toUpperCase() || '?';
          const avatarUrl = resolveUploadUrl(detail.avatarUrl);

          host.innerHTML = `
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-950 text-base font-semibold text-brand-300">
                  ${
                    avatarUrl
                      ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                      : escapeHtml(initials)
                  }
                </div>
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                      #${escapeHtml(detail.employeeNumber)}
                    </span>
                    ${renderIncentiveStatusBadge(detail.status)}
                  </div>
                  <h2 class="mt-2 text-xl font-semibold text-white">${escapeHtml(detail.fullName)}</h2>
                  <p class="mt-1 text-sm text-ink-400">
                    ${escapeHtml(detail.rank?.name ?? '—')}
                    ${detail.department?.name ? ` · ${escapeHtml(detail.department.name)}` : ''}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Monto actual</p>
                <p class="mt-1 text-2xl font-semibold text-white">$${formatIncentiveMoney(detail.incentiveAmount)}</p>
                ${
                  canPay && detail.canPay
                    ? `<button type="button" class="btn-primary mt-3 !py-2.5" id="incentive-detail-pay">Pagar incentivo</button>`
                    : `<p class="mt-3 text-xs text-ink-500">${escapeHtml(INCENTIVE_STATUS_LABELS[detail.status] ?? '')}</p>`
                }
              </div>
            </div>

            <div class="mt-6 border-t border-white/8 pt-5">
              <h3 class="text-sm font-semibold text-white">Historial de pagos</h3>
              <div class="mt-4 space-y-3">
                ${(detail.history ?? []).length
                  ? detail.history
                      .map(
                        (payment) => `
                  <article class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-medium text-white">$${formatIncentiveMoney(payment.amount)}</p>
                        <p class="mt-1 text-xs text-ink-400">
                          Rango: ${escapeHtml(payment.rankName)} · Pagado por ${escapeHtml(payment.paidBy?.fullName ?? '—')}
                        </p>
                        ${
                          payment.notes
                            ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(payment.notes)}</p>`
                            : ''
                        }
                      </div>
                      <p class="text-xs text-ink-500">${escapeHtml(formatDateTimeLabel(payment.paidAt))}</p>
                    </div>
                  </article>`,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Aún no hay pagos registrados para este empleado.</p>`}
              </div>
            </div>
          `;

          root.querySelector('#incentive-detail-pay')?.addEventListener('click', () => {
            setAppModalContent(root, {
              modalId: 'incentive-pay-modal',
              title: 'Confirmar pago de incentivo',
              bodyHtml: `
                <div class="space-y-4">
                  <p class="text-sm text-ink-300">
                    Registrar incentivo de <span class="font-semibold text-white">${escapeHtml(detail.fullName)}</span>
                    por <span class="font-semibold text-brand-300">$${formatIncentiveMoney(detail.incentiveAmount)}</span>.
                  </p>
                  <div>
                    <label class="form-label" for="incentive-pay-notes">Observaciones (opcional)</label>
                    <textarea id="incentive-pay-notes" class="form-input min-h-[96px]" maxlength="2000"></textarea>
                  </div>
                </div>
              `,
              footerHtml: `
                <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
                <button type="button" class="btn-primary" id="incentive-pay-confirm">Confirmar pago</button>
              `,
            });
            openAppModal(root, 'incentive-pay-modal');
            root.querySelector('#incentive-pay-confirm')?.addEventListener('click', async () => {
              if (paying) return;
              paying = true;
              try {
                const notes = root.querySelector('#incentive-pay-notes')?.value?.trim() || undefined;
                await payIncentive(staffProfileId, { notes });
                closeAppModal(root, 'incentive-pay-modal');
                setAuthAlert(root, {
                  id: 'incentives-alert',
                  type: 'success',
                  message: 'Incentivo registrado correctamente.',
                });
                await paint();
              } catch (error) {
                setAuthAlert(root, {
                  id: 'incentives-alert',
                  type: 'error',
                  message: getApiErrorMessage(error),
                });
              } finally {
                paying = false;
              }
            });
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'incentives-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      void paint();

      return () => {
        cleanupModal();
        cleanupLayout();
      };
    },
  };
}
