import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createLicense,
  deleteLicense,
  listLicenses,
  updateLicense,
} from '../../services/licenses.service.js';
import { can } from '../../services/auth-context.js';
import { getApiBaseUrl } from '../../utils/env.js';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageUploadFile,
} from '../../utils/image-upload.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

export function adminLicensesPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.LICENSES_MANAGE) && !can(PERMISSIONS.LICENSES_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const canManage = can(PERMISSIONS.LICENSES_MANAGE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-licenses-alert' })}
      ${
        canManage
          ? `
        <section class="panel p-6">
          <h3 class="text-sm font-semibold text-white">Nueva licencia</h3>
          <form id="create-license-form" class="mt-4 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="license-code">Código</label>
                <input id="license-code" class="form-input" required maxlength="32" placeholder="AIR" />
              </div>
              <div>
                <label class="form-label" for="license-name">Nombre</label>
                <input id="license-name" class="form-input" required maxlength="120" placeholder="Air Support Department Certification" />
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="form-label" for="license-description">Descripción</label>
                <textarea id="license-description" class="form-input min-h-[88px]" maxlength="1000"></textarea>
              </div>
              <div>
                <label class="form-label" for="license-image">Imagen / logo</label>
                <input id="license-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
                <p class="form-hint">JPG, PNG, WebP o GIF · máximo 8 MB</p>
              </div>
            </div>
            <button type="submit" class="btn-primary">Crear licencia</button>
          </form>
        </section>
        <section id="edit-license-panel" class="panel hidden p-6">
          <h3 class="text-sm font-semibold text-white">Editar licencia</h3>
          <form id="edit-license-form" class="mt-4 space-y-4">
            <input type="hidden" id="edit-license-id" />
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="edit-license-code">Código</label>
                <input id="edit-license-code" class="form-input" required maxlength="32" />
              </div>
              <div>
                <label class="form-label" for="edit-license-name">Nombre</label>
                <input id="edit-license-name" class="form-input" required maxlength="120" />
              </div>
            </div>
            <div>
              <label class="form-label" for="edit-license-description">Descripción</label>
              <textarea id="edit-license-description" class="form-input min-h-[88px]" maxlength="1000"></textarea>
            </div>
            <div>
              <label class="form-label" for="edit-license-image">Nueva imagen (opcional)</label>
              <input id="edit-license-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
              <p class="form-hint">JPG, PNG, WebP o GIF · máximo 8 MB</p>
            </div>
            <div class="flex items-center gap-3">
              <input id="edit-license-active" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-surface-950 text-brand-500" />
              <label class="text-sm text-ink-200" for="edit-license-active">Licencia activa</label>
            </div>
            <div class="flex flex-wrap gap-3">
              <button type="submit" class="btn-primary">Guardar cambios</button>
              <button type="button" id="edit-license-cancel" class="btn-secondary">Cancelar</button>
            </div>
          </form>
        </section>
      `
          : ''
      }
      <section class="grid gap-4 md:grid-cols-2 lg:grid-cols-3" id="licenses-grid"></section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Licencias',
      currentPath: '/admin/licenses',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Licencias');
      let imageDataUrl = null;
      let editImageDataUrl = null;
      let catalog = [];

      const editPanel = root.querySelector('#edit-license-panel');

      const load = async () => {
        try {
          catalog = await listLicenses();
          const grid = root.querySelector('#licenses-grid');
          grid.innerHTML = catalog.length
            ? catalog
                .map((item) => {
                  const image = resolveUploadUrl(item.imageUrl);
                  return `
                    <article class="panel overflow-hidden">
                      <div class="h-36 w-full overflow-hidden bg-surface-950">
                        ${
                          image
                            ? `<img src="${image}" alt="${escapeHtml(item.name)}" class="h-full w-full object-contain p-4" />`
                            : `<div class="flex h-full items-center justify-center text-lg font-semibold tracking-wide text-brand-300">${escapeHtml(item.code)}</div>`
                        }
                      </div>
                      <div class="p-5">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">${escapeHtml(item.code)}</p>
                            <h3 class="mt-1 font-semibold text-white">${escapeHtml(item.name)}</h3>
                          </div>
                          <span class="text-[11px] uppercase tracking-wide ${item.isActive ? 'text-emerald-300' : 'text-ink-500'}">${item.isActive ? 'Activa' : 'Inactiva'}</span>
                        </div>
                        <p class="mt-2 text-sm text-ink-300">${escapeHtml(item.description ?? 'Sin descripción')}</p>
                        <p class="mt-3 text-xs text-ink-500">${item._count?.officers ?? 0} asignadas · ${formatDate(item.createdAt)}</p>
                        ${
                          canManage
                            ? `<div class="mt-4 flex flex-wrap gap-3">
                                <button type="button" class="text-xs font-medium text-brand-300" data-edit-license="${item.id}">Editar</button>
                                <button type="button" class="text-xs font-medium text-brand-300" data-toggle-license="${item.id}" data-active="${item.isActive}">${item.isActive ? 'Desactivar' : 'Activar'}</button>
                                <button type="button" class="text-xs font-medium text-rose-300" data-delete-license="${item.id}">Eliminar</button>
                              </div>`
                            : ''
                        }
                      </div>
                    </article>
                  `;
                })
                .join('')
            : `<p class="text-sm text-ink-400 md:col-span-3">No hay licencias registradas.</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const openEdit = (id) => {
        const item = catalog.find((row) => row.id === id);
        if (!item || !editPanel) return;
        root.querySelector('#edit-license-id').value = item.id;
        root.querySelector('#edit-license-code').value = item.code;
        root.querySelector('#edit-license-name').value = item.name;
        root.querySelector('#edit-license-description').value = item.description ?? '';
        const activeCheckbox = root.querySelector('#edit-license-active');
        if (activeCheckbox) {
          activeCheckbox.checked = item.isActive !== false;
        }
        editImageDataUrl = null;
        editPanel.classList.remove('hidden');
        editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      root.querySelector('#license-image')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          imageDataUrl = null;
          return;
        }
        const validation = validateImageUploadFile(file, {
          maxBytes: MAX_IMAGE_UPLOAD_BYTES,
          allowGif: true,
        });
        if (!validation.ok) {
          event.target.value = '';
          imageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'error',
            message: validation.message,
          });
          return;
        }
        imageDataUrl = await readFileAsDataUrl(file);
      });

      root.querySelector('#edit-license-image')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          editImageDataUrl = null;
          return;
        }
        const validation = validateImageUploadFile(file, {
          maxBytes: MAX_IMAGE_UPLOAD_BYTES,
          allowGif: true,
        });
        if (!validation.ok) {
          event.target.value = '';
          editImageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'error',
            message: validation.message,
          });
          return;
        }
        editImageDataUrl = await readFileAsDataUrl(file);
      });

      root.querySelector('#edit-license-cancel')?.addEventListener('click', () => {
        editPanel?.classList.add('hidden');
        editImageDataUrl = null;
      });

      root.querySelector('#create-license-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await createLicense({
            code: root.querySelector('#license-code').value.trim(),
            name: root.querySelector('#license-name').value.trim(),
            description: root.querySelector('#license-description').value.trim() || undefined,
            imageUrl: imageDataUrl || undefined,
          });
          event.target.reset();
          imageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'success',
            message: 'Licencia creada.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      root.querySelector('#edit-license-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = root.querySelector('#edit-license-id').value;
        try {
          await updateLicense(id, {
            code: root.querySelector('#edit-license-code').value.trim(),
            name: root.querySelector('#edit-license-name').value.trim(),
            description: root.querySelector('#edit-license-description').value.trim() || null,
            isActive: Boolean(root.querySelector('#edit-license-active')?.checked),
            ...(editImageDataUrl ? { imageUrl: editImageDataUrl } : {}),
          });
          editPanel?.classList.add('hidden');
          editImageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'success',
            message: 'Licencia actualizada.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-licenses-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      root.addEventListener('click', async (event) => {
        if (!canManage) return;

        const editButton = event.target.closest('[data-edit-license]');
        if (editButton) {
          openEdit(editButton.getAttribute('data-edit-license'));
          return;
        }

        const toggleButton = event.target.closest('[data-toggle-license]');
        if (toggleButton) {
          const id = toggleButton.getAttribute('data-toggle-license');
          const isActive = toggleButton.getAttribute('data-active') === 'true';
          try {
            await updateLicense(id, { isActive: !isActive });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-licenses-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
          return;
        }

        const deleteButton = event.target.closest('[data-delete-license]');
        if (deleteButton) {
          const id = deleteButton.getAttribute('data-delete-license');
          const item = catalog.find((row) => row.id === id);
          const confirmId = deleteButton.getAttribute('data-confirm') === 'true';
          if (!confirmId) {
            deleteButton.setAttribute('data-confirm', 'true');
            deleteButton.textContent = 'Confirmar eliminación';
            window.setTimeout(() => {
              if (deleteButton.isConnected) {
                deleteButton.removeAttribute('data-confirm');
                deleteButton.textContent = 'Eliminar';
              }
            }, 4000);
            return;
          }
          try {
            await deleteLicense(id);
            setAuthAlert(root, {
              id: 'admin-licenses-alert',
              type: 'success',
              message: `Licencia ${item?.code ?? ''} eliminada.`,
            });
            await load();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-licenses-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        }
      });

      void load();
      return cleanup;
    },
  };
}

function resolveUploadUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) {
    return `${getApiBaseUrl().replace(/\/api\/v1\/?$/, '')}${url}`;
  }
  return url;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
