import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { renderEmptyState } from '../../components/ui/empty-state.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  deleteEventParticipation,
  listEventParticipations,
} from '../../services/event-participations.service.js';
import { formatDateShort, formatDateTimeLabel } from '../../utils/date.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function adminEventParticipationsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (
    !can(PERMISSIONS.EVENT_PARTICIPATIONS_MANAGE) &&
    !can(PERMISSIONS.EVENT_PARTICIPATIONS_READ) &&
    !can(PERMISSIONS.ADMIN_ACCESS)
  ) {
    return { html: '', afterMount: () => {} };
  }

  const canManage = can(PERMISSIONS.EVENT_PARTICIPATIONS_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-events-alert' })}
      <section class="panel p-5">
        <form id="admin-events-filters" class="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label class="form-label" for="admin-events-q">Buscar</label>
            <input id="admin-events-q" class="form-input" placeholder="Organizadores, encargado, participante…" />
          </div>
          <div>
            <label class="form-label" for="admin-events-from">Desde</label>
            <input id="admin-events-from" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="admin-events-to">Hasta</label>
            <input id="admin-events-to" type="date" class="form-input" />
          </div>
          <div class="flex items-end">
            <button type="submit" class="btn-primary w-full">Filtrar</button>
          </div>
        </form>
      </section>
      <section class="panel overflow-hidden">
        <div class="border-b border-white/8 px-5 py-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Administración</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Todas las participaciones</h3>
        </div>
        <div id="admin-events-table" class="overflow-x-auto"></div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Participación de Eventos',
      currentPath: '/admin/event-participations',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Eventos');
      const canDelete = canManage;

      const load = async () => {
        const host = root.querySelector('#admin-events-table');
        try {
          const result = await listEventParticipations({
            q: root.querySelector('#admin-events-q')?.value?.trim() || undefined,
            from: root.querySelector('#admin-events-from')?.value || undefined,
            to: root.querySelector('#admin-events-to')?.value || undefined,
            limit: 100,
          });
          const items = result.items ?? [];
          if (!items.length) {
            host.innerHTML = `<div class="p-5">${renderEmptyState({
              title: 'Sin registros',
              description: 'No hay participaciones de eventos con esos filtros.',
              iconName: 'calendar',
            })}</div>`;
            return;
          }

          host.innerHTML = `
            <table class="w-full min-w-[860px] text-left text-sm">
              <thead class="text-[11px] uppercase tracking-wide text-ink-500">
                <tr class="border-b border-white/8">
                  <th class="px-4 py-3 font-medium">Día</th>
                  <th class="px-4 py-3 font-medium">Organizadores</th>
                  <th class="px-4 py-3 font-medium">Abona</th>
                  <th class="px-4 py-3 font-medium">Autorizó</th>
                  <th class="px-4 py-3 font-medium">Encargado SAED</th>
                  <th class="px-4 py-3 font-medium">Participantes</th>
                  <th class="px-4 py-3 font-medium">Discord</th>
                  ${canDelete ? '<th class="px-4 py-3 font-medium"></th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${items.map((item) => renderAdminRow(item, canDelete)).join('')}
              </tbody>
            </table>
          `;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-events-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudieron cargar las participaciones.'),
          });
        }
      };

      root.querySelector('#admin-events-filters')?.addEventListener('submit', (event) => {
        event.preventDefault();
        void load();
      });

      root.querySelector('#admin-events-table')?.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-delete-event]');
        if (!button || !canDelete) return;
        const id = button.getAttribute('data-delete-event');
        if (!id) return;
        button.disabled = true;
        try {
          await deleteEventParticipation(id);
          setAuthAlert(root, {
            id: 'admin-events-alert',
            type: 'success',
            message: 'Participación eliminada.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-events-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo eliminar el registro.'),
          });
          button.disabled = false;
        }
      });

      void load();
      return cleanup;
    },
  };
}

function renderAdminRow(item, canDelete) {
  const names = (item.participants ?? []).map((participant) => participant.fullName).join(', ');
  return `
    <tr class="border-b border-white/6 align-top">
      <td class="px-4 py-3 text-ink-100">${escapeHtml(formatDateShort(item.eventDate))}</td>
      <td class="px-4 py-3 text-white">${escapeHtml(item.organizers)}</td>
      <td class="px-4 py-3 text-ink-200">${escapeHtml(item.payerFullName)}</td>
      <td class="px-4 py-3 text-ink-200">${escapeHtml(item.authorizingOfficerName)}</td>
      <td class="px-4 py-3 text-ink-200">${escapeHtml(item.saedLeadName)}</td>
      <td class="px-4 py-3 text-ink-200">
        ${escapeHtml(names || '—')}
        <p class="mt-1 text-[11px] text-ink-500">Por ${escapeHtml(item.submittedBy?.fullName ?? '—')} · ${escapeHtml(formatDateTimeLabel(item.createdAt))}</p>
      </td>
      <td class="px-4 py-3">
        <span class="${item.discordDelivered ? 'text-emerald-300' : 'text-amber-300'}">
          ${item.discordDelivered ? 'Enviado' : 'Pendiente'}
        </span>
      </td>
      ${
        canDelete
          ? `<td class="px-4 py-3 text-right">
              <button type="button" data-delete-event="${escapeHtml(item.id)}" class="btn-secondary !px-3 !py-1.5 text-xs">Eliminar</button>
            </td>`
          : ''
      }
    </tr>
  `;
}
