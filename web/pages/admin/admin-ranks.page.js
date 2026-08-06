import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createRank,
  deleteRank,
  listRanksAdmin,
  updateRank,
} from '../../services/ranks.service.js';
import { can } from '../../services/auth-context.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

export function adminRanksPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const canCreate = can(PERMISSIONS.RANKS_CREATE);
  const canUpdate = can(PERMISSIONS.RANKS_UPDATE);
  const canDelete = can(PERMISSIONS.RANKS_DELETE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-ranks-alert' })}
      ${
        canCreate
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Crear rango</h3>
          <form id="create-rank-form" class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="rank-name">Nombre</label>
              <input id="rank-name" name="name" class="form-input" required />
            </div>
            <div>
              <label class="form-label" for="rank-order">Orden jerárquico</label>
              <input id="rank-order" name="sortOrder" type="number" min="0" class="form-input" value="0" />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label" for="rank-description">Descripción</label>
              <input id="rank-description" name="description" class="form-input" />
            </div>
            <button type="submit" class="btn-primary sm:col-span-2 sm:w-fit">Crear rango</button>
          </form>
        </section>
      `
          : ''
      }
      <section class="panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-white/[0.02] text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-5 py-3">Orden</th>
                <th class="px-5 py-3">Nombre</th>
                <th class="px-5 py-3">Slug</th>
                <th class="px-5 py-3">Uso</th>
                <th class="px-5 py-3">Estado</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody id="ranks-table-body" class="divide-y divide-white/5"></tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderAdminShell(content, { title: 'Gestión de rangos', currentPath: '/admin/ranks' }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Rangos');

      const load = async () => {
        try {
          const ranks = await listRanksAdmin();
          const body = root.querySelector('#ranks-table-body');
          body.innerHTML = ranks
            .map((rank) => {
              const usage = (rank._count?.characters ?? 0) + (rank._count?.officers ?? 0);
              return `
                <tr>
                  <td class="px-5 py-3 text-ink-300">${rank.sortOrder}</td>
                  <td class="px-5 py-3 font-medium text-white">${rank.name}</td>
                  <td class="px-5 py-3 text-ink-400">${rank.slug}</td>
                  <td class="px-5 py-3 text-ink-300">${usage}</td>
                  <td class="px-5 py-3 text-ink-300">${rank.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td class="px-5 py-3 text-right space-x-3">
                    ${
                      canUpdate
                        ? `<button type="button" class="text-xs text-brand-300" data-toggle-rank="${rank.id}" data-active="${rank.isActive}">${rank.isActive ? 'Desactivar' : 'Activar'}</button>`
                        : ''
                    }
                    ${
                      canDelete && usage === 0
                        ? `<button type="button" class="text-xs text-rose-300" data-delete-rank="${rank.id}">Eliminar</button>`
                        : ''
                    }
                  </td>
                </tr>
              `;
            })
            .join('');
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-ranks-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onCreate = async (event) => {
        event.preventDefault();
        try {
          await createRank({
            name: root.querySelector('#rank-name').value.trim(),
            sortOrder: Number(root.querySelector('#rank-order').value || 0),
            description: root.querySelector('#rank-description').value.trim() || undefined,
          });
          event.target.reset();
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-ranks-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const onClick = async (event) => {
        const toggle = event.target.closest('[data-toggle-rank]');
        if (toggle) {
          const id = toggle.getAttribute('data-toggle-rank');
          const isActive = toggle.getAttribute('data-active') === 'true';
          try {
            await updateRank(id, { isActive: !isActive });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-ranks-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        }

        const remove = event.target.closest('[data-delete-rank]');
        if (remove) {
          try {
            await deleteRank(remove.getAttribute('data-delete-rank'));
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-ranks-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        }
      };

      root.querySelector('#create-rank-form')?.addEventListener('submit', onCreate);
      root.addEventListener('click', onClick);
      void load();

      return () => {
        cleanup?.();
        root.querySelector('#create-rank-form')?.removeEventListener('submit', onCreate);
        root.removeEventListener('click', onClick);
      };
    },
  };
}
