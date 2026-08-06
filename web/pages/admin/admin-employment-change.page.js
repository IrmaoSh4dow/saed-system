import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  approveEmploymentChangeRequest,
  EMPLOYMENT_CHANGE_STATUS_LABELS,
  getEmploymentChangeDashboard,
  listEmploymentChangeRequests,
  markEmploymentChangeUnderReview,
  rejectEmploymentChangeRequest,
} from '../../services/employment-change.service.js';
import { formatDateTimeLabel } from '../../utils/date.js';
import { navigate } from '../../utils/router.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function characterName(character) {
  if (!character) return '—';
  return `${character.firstName ?? ''} ${character.lastName ?? ''}`.trim() || '—';
}

function metricCard(label, value, tone = 'neutral') {
  const tones = {
    neutral: 'border-white/10 text-white',
    success: 'border-emerald-400/30 text-emerald-200',
    danger: 'border-rose-400/30 text-rose-200',
    warn: 'border-amber-400/30 text-amber-200',
    info: 'border-sky-400/30 text-sky-200',
  };
  return `
    <article class="rounded-2xl border bg-white/[0.02] px-4 py-4 ${tones[tone] ?? tones.neutral}">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight">${escapeHtml(String(value))}</p>
    </article>
  `;
}

export function adminEmploymentChangePage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (
    !can(PERMISSIONS.EMPLOYMENT_CHANGE_REVIEW) &&
    !can(PERMISSIONS.EMPLOYMENT_CHANGE_MANAGE) &&
    !can('*') &&
    !can(PERMISSIONS.ADMIN_ACCESS)
  ) {
    void navigate('/admin', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  const canReview = can(PERMISSIONS.EMPLOYMENT_CHANGE_REVIEW) || can('*');

  const content = `
    ${renderAuthAlert({ id: 'employment-change-alert' })}
    <div id="employment-change-root" class="space-y-6">
      <p class="text-sm text-ink-400">Cargando solicitudes de cambio de empleo…</p>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Solicitudes de Cambio de Empleo',
      currentPath: '/admin/employment-change',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Solicitudes de Cambio de Empleo');

      const paint = async () => {
        const host = root.querySelector('#employment-change-root');
        if (!host) return;
        try {
          const [dashboard, requests] = await Promise.all([
            getEmploymentChangeDashboard(),
            listEmploymentChangeRequests({}),
          ]);

          host.innerHTML = `
            <section class="space-y-2">
              <p class="landing-eyebrow">Gestión laboral</p>
              <h2 class="text-2xl font-semibold text-white">Solicitudes de Cambio de Empleo</h2>
              <p class="max-w-3xl text-sm text-ink-400">
                Revisa, aprueba o rechaza cambios de organización de personajes civiles.
              </p>
            </section>

            <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              ${metricCard('Pendientes', dashboard.pending, 'warn')}
              ${metricCard('En revisión', dashboard.underReview, 'info')}
              ${metricCard('Aprobadas', dashboard.approved, 'success')}
              ${metricCard('Rechazadas', dashboard.rejected, 'danger')}
              ${metricCard('Canceladas', dashboard.cancelled)}
            </section>

            <section class="panel p-4 md:p-5">
              <form id="ec-filters" class="grid gap-3 md:grid-cols-[1fr_200px_auto]">
                <div>
                  <label class="form-label" for="ec-q">Buscar</label>
                  <input id="ec-q" class="form-input" placeholder="Personaje, cuenta, organización…" />
                </div>
                <div>
                  <label class="form-label" for="ec-status">Estado</label>
                  <select id="ec-status" class="form-input">
                    <option value="">Todos</option>
                    ${Object.entries(EMPLOYMENT_CHANGE_STATUS_LABELS)
                      .map(([value, label]) => `<option value="${value}">${label}</option>`)
                      .join('')}
                  </select>
                </div>
                <div class="flex items-end">
                  <button type="submit" class="btn-primary w-full md:w-auto">Filtrar</button>
                </div>
              </form>
            </section>

            <section id="ec-results" class="space-y-3">
              ${renderRows(requests, canReview)}
            </section>
          `;

          root.querySelector('#ec-filters')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
              const filtered = await listEmploymentChangeRequests({
                q: root.querySelector('#ec-q')?.value?.trim() || undefined,
                status: root.querySelector('#ec-status')?.value || undefined,
              });
              const results = root.querySelector('#ec-results');
              if (results) results.innerHTML = renderRows(filtered, canReview);
              bindActions(root, paint);
            } catch (error) {
              setAuthAlert(root, {
                id: 'employment-change-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });

          bindActions(root, paint);
        } catch (error) {
          host.innerHTML = `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      void paint();
      return cleanup;
    },
  };
}

function bindActions(root, reload) {
  root.querySelectorAll('[data-approve-ec]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await approveEmploymentChangeRequest(button.getAttribute('data-approve-ec'), {
          internalNotes: root.querySelector(`#notes-${button.getAttribute('data-approve-ec')}`)?.value?.trim() || undefined,
        });
        setAuthAlert(root, {
          id: 'employment-change-alert',
          type: 'success',
          message: 'Solicitud aprobada. Empleo actualizado.',
        });
        void reload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'employment-change-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelectorAll('[data-review-ec]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await markEmploymentChangeUnderReview(button.getAttribute('data-review-ec'));
        void reload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'employment-change-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelectorAll('[data-reject-ec]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-reject-ec');
      const rejectionReason = root.querySelector(`#reject-${id}`)?.value?.trim();
      if (!rejectionReason || rejectionReason.length < 4) {
        setAuthAlert(root, {
          id: 'employment-change-alert',
          type: 'error',
          message: 'Indica un motivo de rechazo (mínimo 4 caracteres).',
        });
        return;
      }
      try {
        await rejectEmploymentChangeRequest(id, {
          rejectionReason,
          internalNotes: root.querySelector(`#notes-${id}`)?.value?.trim() || undefined,
        });
        setAuthAlert(root, {
          id: 'employment-change-alert',
          type: 'success',
          message: 'Solicitud rechazada.',
        });
        void reload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'employment-change-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

function renderRows(requests, canReview) {
  if (!requests.length) {
    return `<p class="text-sm text-ink-500">No hay solicitudes.</p>`;
  }

  return requests
    .map((item) => {
      const open = item.status === 'PENDING' || item.status === 'UNDER_REVIEW';
      const accountLabel =
        item.character?.account?.username || item.character?.account?.email || '—';
      return `
        <article class="rounded-2xl border border-white/10 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-white">
                #${item.requestNumber} · ${escapeHtml(characterName(item.character))}
              </p>
              <p class="mt-1 text-xs text-ink-400">
                Cuenta: ${escapeHtml(accountLabel)}
                · ${escapeHtml(EMPLOYMENT_CHANGE_STATUS_LABELS[item.status] || item.status)}
                · ${escapeHtml(formatDateTimeLabel(item.createdAt))}
              </p>
              <p class="mt-2 text-sm text-ink-200">
                ${escapeHtml(item.currentOrganizationName || 'Sin empleo')}
                → <span class="text-white font-medium">${escapeHtml(item.requestedOrganizationName)}</span>
              </p>
              <p class="mt-2 text-xs text-ink-400">Motivo: ${escapeHtml(item.reason)}</p>
              ${
                item.rejectionReason
                  ? `<p class="mt-1 text-xs text-rose-300">Rechazo: ${escapeHtml(item.rejectionReason)}</p>`
                  : ''
              }
            </div>
            ${
              item.character?.id
                ? `<a data-link href="/admin/characters?id=${item.character.id}" class="btn-secondary !py-1.5 !px-3 text-xs">Ver personaje</a>`
                : ''
            }
          </div>
          ${
            canReview && open
              ? `
                <div class="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2">
                  <div>
                    <label class="form-label" for="notes-${item.id}">Observaciones internas</label>
                    <textarea id="notes-${item.id}" class="form-input min-h-20" maxlength="2000">${escapeHtml(item.internalNotes || '')}</textarea>
                  </div>
                  <div>
                    <label class="form-label" for="reject-${item.id}">Motivo de rechazo</label>
                    <textarea id="reject-${item.id}" class="form-input min-h-20" maxlength="1000" placeholder="Visible para el solicitante"></textarea>
                  </div>
                  <div class="md:col-span-2 flex flex-wrap gap-2">
                    ${
                      item.status === 'PENDING'
                        ? `<button type="button" class="btn-secondary" data-review-ec="${item.id}">Marcar en revisión</button>`
                        : ''
                    }
                    <button type="button" class="btn-primary" data-approve-ec="${item.id}">Aprobar</button>
                    <button type="button" class="btn-secondary" data-reject-ec="${item.id}">Rechazar</button>
                  </div>
                </div>
              `
              : item.internalNotes
                ? `<p class="mt-3 text-xs text-ink-500">Notas internas: ${escapeHtml(item.internalNotes)}</p>`
                : ''
          }
        </article>
      `;
    })
    .join('');
}
