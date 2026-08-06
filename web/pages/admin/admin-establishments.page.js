import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  activateEstablishment,
  createEstablishment,
  deactivateEstablishment,
  listEstablishments,
  updateEstablishment,
  uploadEstablishmentLogo,
} from '../../services/establishments.service.js';
import { formatDiscountPercent } from '../../services/agreements.service.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { resolveUploadUrl } from '../../utils/media.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function adminEstablishmentsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.ESTABLISHMENTS_READ) && !can(PERMISSIONS.ESTABLISHMENTS_MANAGE)) {
    return { html: '', afterMount: () => {} };
  }

  const canManage = can(PERMISSIONS.ESTABLISHMENTS_MANAGE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-establishments-alert' })}
      ${
        canManage
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Nuevo establecimiento</h3>
          <form id="create-establishment-form" class="mt-4 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="establishment-name">Nombre</label>
                <input id="establishment-name" class="form-input" required maxlength="120" />
              </div>
              <div>
                <label class="form-label" for="establishment-position">Cargo por defecto</label>
                <input id="establishment-position" class="form-input" value="Empleado" maxlength="120" />
              </div>
            </div>
            <div>
              <label class="form-label" for="establishment-description">Descripción</label>
              <textarea id="establishment-description" class="form-input min-h-[88px]" maxlength="2000"></textarea>
            </div>
            <div>
              <label class="form-label" for="establishment-logo">Logotipo (opcional)</label>
              <input id="establishment-logo" type="file" accept="image/jpeg,image/png,image/webp" class="form-input" />
            </div>
            <button type="submit" class="btn-primary">Crear establecimiento</button>
          </form>
        </section>
      `
          : ''
      }
      <section id="edit-establishment-panel" class="panel hidden p-6">
        <h3 class="text-sm font-semibold text-white">Editar establecimiento</h3>
        <form id="edit-establishment-form" class="mt-4 space-y-4">
          <input type="hidden" id="edit-establishment-id" />
          <div>
            <label class="form-label" for="edit-establishment-name">Nombre</label>
            <input id="edit-establishment-name" class="form-input" required maxlength="120" />
          </div>
          <div>
            <label class="form-label" for="edit-establishment-description">Descripción</label>
            <textarea id="edit-establishment-description" class="form-input min-h-[88px]" maxlength="2000"></textarea>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="submit" class="btn-primary">Guardar</button>
            <button type="button" id="edit-establishment-cancel" class="btn-secondary">Cancelar</button>
          </div>
        </form>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="establishments-grid"></section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Establecimientos',
      currentPath: '/admin/establishments',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Establecimientos');

      const renderGrid = (items) => {
        const grid = root.querySelector('#establishments-grid');
        if (!grid) return;
        grid.innerHTML = items.length
          ? items
              .map((item) => {
                const logo = resolveUploadUrl(item.logoUrl);
                const agreement = item.activeAgreement;
                return `
                  <article class="panel overflow-hidden">
                    <div class="flex h-28 items-center justify-center bg-surface-950">
                      ${
                        logo
                          ? `<img src="${escapeHtml(logo)}" alt="" class="h-full w-full object-contain p-4" />`
                          : `<span class="text-2xl font-semibold text-brand-300">${escapeHtml(item.name.slice(0, 1))}</span>`
                      }
                    </div>
                    <div class="space-y-3 p-5">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <h3 class="font-semibold text-white">${escapeHtml(item.name)}</h3>
                          <p class="mt-1 text-xs text-ink-500">${escapeHtml(item.slug)}</p>
                        </div>
                        <span class="text-[11px] uppercase tracking-wide ${item.status === 'ACTIVE' ? 'text-emerald-300' : 'text-ink-500'}">
                          ${item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p class="text-sm text-ink-300">${escapeHtml(item.description || 'Sin descripción')}</p>
                      <p class="text-xs text-ink-400">
                        ${
                          agreement
                            ? `Convenio ${escapeHtml(formatDiscountPercent(agreement.discountPercent))}`
                            : 'Sin convenio activo'
                        }
                        · ${item.activeOccupationCount ?? 0} ocupaciones
                      </p>
                      ${
                        canManage
                          ? `
                            <div class="flex flex-wrap gap-2 pt-1">
                              <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" data-toggle-establishment="${item.id}" data-status="${item.status}">
                                ${item.status === 'ACTIVE' ? 'Desactivar' : 'Reactivar'}
                              </button>
                              <label class="btn-secondary !px-3 !py-1.5 text-xs cursor-pointer">
                                Logo
                                <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" data-logo-upload="${item.id}" />
                              </label>
                              <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" data-edit-establishment="${item.id}" data-name="${escapeHtml(item.name)}" data-description="${escapeHtml(item.description || '')}">
                                Renombrar
                              </button>
                            </div>
                          `
                          : ''
                      }
                    </div>
                  </article>
                `;
              })
              .join('')
          : `<p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">No hay establecimientos registrados.</p>`;

        grid.querySelectorAll('[data-toggle-establishment]').forEach((button) => {
          button.addEventListener('click', async () => {
            const id = button.getAttribute('data-toggle-establishment');
            const status = button.getAttribute('data-status');
            try {
              if (status === 'ACTIVE') {
                await deactivateEstablishment(id);
              } else {
                await activateEstablishment(id);
              }
              setAuthAlert({
                root,
                id: 'admin-establishments-alert',
                type: 'success',
                message: 'Estado del establecimiento actualizado.',
              });
              await load();
            } catch (error) {
              setAuthAlert({
                root,
                id: 'admin-establishments-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        });

        grid.querySelectorAll('[data-logo-upload]').forEach((input) => {
          input.addEventListener('change', async () => {
            const id = input.getAttribute('data-logo-upload');
            const file = input.files?.[0];
            if (!file) return;
            try {
              await uploadEstablishmentLogo(id, file);
              setAuthAlert({
                root,
                id: 'admin-establishments-alert',
                type: 'success',
                message: 'Logotipo actualizado.',
              });
              await load();
            } catch (error) {
              setAuthAlert({
                root,
                id: 'admin-establishments-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        });

        grid.querySelectorAll('[data-edit-establishment]').forEach((button) => {
          button.addEventListener('click', () => {
            const panel = root.querySelector('#edit-establishment-panel');
            root.querySelector('#edit-establishment-id').value =
              button.getAttribute('data-edit-establishment') || '';
            root.querySelector('#edit-establishment-name').value =
              button.getAttribute('data-name') || '';
            root.querySelector('#edit-establishment-description').value =
              button.getAttribute('data-description') || '';
            panel?.classList.remove('hidden');
            panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        });
      };

      const load = async () => {
        try {
          const items = await listEstablishments({ includeInactive: 'true' });
          renderGrid(items);
        } catch (error) {
          setAuthAlert({
            root,
            id: 'admin-establishments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#edit-establishment-cancel')?.addEventListener('click', () => {
        root.querySelector('#edit-establishment-panel')?.classList.add('hidden');
      });

      root.querySelector('#edit-establishment-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = root.querySelector('#edit-establishment-id').value;
        try {
          await updateEstablishment(id, {
            name: root.querySelector('#edit-establishment-name').value.trim(),
            description: root.querySelector('#edit-establishment-description').value.trim() || null,
          });
          root.querySelector('#edit-establishment-panel')?.classList.add('hidden');
          setAuthAlert({
            root,
            id: 'admin-establishments-alert',
            type: 'success',
            message: 'Establecimiento actualizado.',
          });
          await load();
        } catch (error) {
          setAuthAlert({
            root,
            id: 'admin-establishments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      root.querySelector('#create-establishment-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const created = await createEstablishment({
            name: root.querySelector('#establishment-name').value.trim(),
            defaultPosition: root.querySelector('#establishment-position').value.trim() || 'Empleado',
            description: root.querySelector('#establishment-description').value.trim() || undefined,
          });
          const logoFile = root.querySelector('#establishment-logo')?.files?.[0];
          if (logoFile) {
            await uploadEstablishmentLogo(created.id, logoFile);
          }
          event.currentTarget.reset();
          setAuthAlert({
            root,
            id: 'admin-establishments-alert',
            type: 'success',
            message: 'Establecimiento creado.',
          });
          await load();
        } catch (error) {
          setAuthAlert({
            root,
            id: 'admin-establishments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      void load();
      return cleanup;
    },
  };
}
