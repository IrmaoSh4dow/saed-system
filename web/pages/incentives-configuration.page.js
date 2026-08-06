import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  bindAppModal,
  closeAppModal,
  openAppModal,
  renderAppModal,
  setAppModalContent,
} from '../components/ui/modal.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  formatIncentiveMoney,
  listIncentiveConfigurations,
  updateIncentiveConfiguration,
} from '../services/incentives.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function incentivesConfigurationPage({ renderModuleNav } = {}) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.INCENTIVES_CONFIGURATION)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'incentives-alert' })}
      ${renderPageHeader({
        eyebrow: 'Configuración institucional',
        title: 'Montos por rango',
        description:
          'Define el incentivo económico de cada rango. Los nuevos pagos usarán automáticamente el valor vigente; el historial conserva el monto pagado en su momento.',
      })}
      ${typeof renderModuleNav === 'function' ? renderModuleNav('configuration') : ''}

      <section id="incentive-config-feed" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">Cargando configuración...</p>
      </section>

      ${renderAppModal({
        id: 'incentive-config-modal',
        title: 'Editar incentivo',
        size: 'md',
      })}
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Configuración de incentivos',
      currentPath: '/incentives/configuration',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      const cleanupModal = bindAppModal(root, { modalId: 'incentive-config-modal' });
      document.title = 'Configuración de incentivos · SAED';
      let saving = false;

      const openEditor = (config) => {
        setAppModalContent(root, {
          modalId: 'incentive-config-modal',
          title: `Editar · ${config.rank?.name ?? 'Rango'}`,
          bodyHtml: `
            <div class="space-y-4">
              <p class="text-sm text-ink-400">
                El valor actual es <span class="text-white">$${formatIncentiveMoney(config.amount)}</span>.
                Este cambio aplica a pagos futuros.
              </p>
              <div>
                <label class="form-label" for="incentive-amount-input">Nuevo monto</label>
                <input
                  id="incentive-amount-input"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input"
                  value="${escapeHtml(config.amount)}"
                />
              </div>
            </div>
          `,
          footerHtml: `
            <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
            <button type="button" class="btn-primary" id="incentive-config-save" data-rank-id="${escapeHtml(config.rankId)}">
              Guardar
            </button>
          `,
        });
        openAppModal(root, 'incentive-config-modal');

        root.querySelector('#incentive-config-save')?.addEventListener('click', async () => {
          if (saving) return;
          const amount = Number(root.querySelector('#incentive-amount-input')?.value);
          if (!Number.isFinite(amount) || amount < 0) {
            setAuthAlert(root, {
              id: 'incentives-alert',
              type: 'error',
              message: 'Introduce un monto válido.',
            });
            return;
          }

          saving = true;
          try {
            await updateIncentiveConfiguration(config.rankId, amount);
            closeAppModal(root, 'incentive-config-modal');
            setAuthAlert(root, {
              id: 'incentives-alert',
              type: 'success',
              message: `Incentivo de ${config.rank?.name ?? 'rango'} actualizado.`,
            });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'incentives-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          } finally {
            saving = false;
          }
        });
      };

      const renderList = (items) => {
        const feed = root.querySelector('#incentive-config-feed');
        if (!feed) return;
        const list = Array.isArray(items) ? items : [];

        if (!list.length) {
          feed.innerHTML = renderEmptyState({
            title: 'Sin configuración',
            description: 'No hay rangos institucionales disponibles.',
            iconName: 'settings',
          });
          return;
        }

        feed.innerHTML = list
          .map(
            (config) => `
          <article class="panel flex flex-col justify-between p-5">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                ${escapeHtml(config.rank?.slug ?? '')}
              </p>
              <h3 class="mt-2 text-lg font-semibold text-white">${escapeHtml(config.rank?.name ?? '—')}</h3>
              <p class="mt-4 text-3xl font-semibold tracking-tight text-white">
                $${formatIncentiveMoney(config.amount)}
              </p>
              <p class="mt-3 text-xs text-ink-500">
                ${
                  config.updatedByCharacter
                    ? `Actualizado por ${escapeHtml(`${config.updatedByCharacter.firstName} ${config.updatedByCharacter.lastName}`)} · `
                    : ''
                }
                ${escapeHtml(formatDateTimeLabel(config.updatedAt))}
              </p>
            </div>
            <button
              type="button"
              class="btn-secondary mt-5 !py-2.5"
              data-edit-config
              data-rank-id="${escapeHtml(config.rankId)}"
            >
              Editar
            </button>
          </article>`,
          )
          .join('');

        feed.querySelectorAll('[data-edit-config]').forEach((button) => {
          button.addEventListener('click', () => {
            const rankId = button.getAttribute('data-rank-id');
            const config = list.find((item) => item.rankId === rankId);
            if (config) openEditor(config);
          });
        });
      };

      const load = async () => {
        try {
          const items = await listIncentiveConfigurations();
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

      return () => {
        cleanupModal();
        cleanupLayout();
      };
    },
  };
}
