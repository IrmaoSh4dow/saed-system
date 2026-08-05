import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createDecoration,
  listDecorations,
  updateDecoration,
} from '../../services/decorations.service.js';
import { can } from '../../services/auth-context.js';
import { getApiBaseUrl } from '../../utils/env.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

export function adminDecorationsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.DECORATIONS_MANAGE) && !can(PERMISSIONS.DECORATIONS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const canManage = can(PERMISSIONS.DECORATIONS_MANAGE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-decorations-alert' })}
      ${
        canManage
          ? `
        <section class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Nueva condecoración</h3>
          <form id="create-decoration-form" class="mt-4 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="decoration-name">Nombre</label>
                <input id="decoration-name" class="form-input" required maxlength="120" />
              </div>
              <div>
                <label class="form-label" for="decoration-image">Imagen</label>
                <input id="decoration-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
                <p class="form-hint">JPG, PNG, WebP o GIF · máximo 8 MB</p>
              </div>
            </div>
            <div>
              <label class="form-label" for="decoration-description">Descripción</label>
              <textarea id="decoration-description" class="form-input min-h-[88px]" maxlength="1000"></textarea>
            </div>
            <button type="submit" class="btn-primary">Crear condecoración</button>
          </form>
        </section>
      `
          : ''
      }
      <section class="grid gap-4 md:grid-cols-2 lg:grid-cols-3" id="decorations-grid"></section>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Condecoraciones',
      currentPath: '/admin/decorations',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Condecoraciones');
      let imageDataUrl = null;

      const load = async () => {
        try {
          const decorations = await listDecorations();
          const grid = root.querySelector('#decorations-grid');
          grid.innerHTML = decorations.length
            ? decorations
                .map((item) => {
                  const image = resolveUploadUrl(item.imageUrl);
                  return `
                    <article class="surface-card overflow-hidden">
                      <div class="h-36 w-full overflow-hidden bg-surface-950">
                        ${
                          image
                            ? `<img src="${image}" alt="${item.name}" class="h-full w-full object-contain p-4" />`
                            : `<div class="flex h-full items-center justify-center text-sm text-ink-500">Sin imagen</div>`
                        }
                      </div>
                      <div class="p-5">
                        <div class="flex items-start justify-between gap-3">
                          <h3 class="font-semibold text-white">${item.name}</h3>
                          <span class="text-[11px] uppercase tracking-wide ${item.isActive ? 'text-emerald-300' : 'text-ink-500'}">${item.isActive ? 'Activa' : 'Inactiva'}</span>
                        </div>
                        <p class="mt-2 text-sm text-ink-300">${item.description ?? 'Sin descripción'}</p>
                        <p class="mt-3 text-xs text-ink-500">${item._count?.officers ?? 0} otorgadas · ${formatDate(item.createdAt)}</p>
                        ${
                          canManage
                            ? `<button type="button" class="mt-4 text-xs font-medium text-brand-300" data-toggle-decoration="${item.id}" data-active="${item.isActive}">${item.isActive ? 'Desactivar' : 'Activar'}</button>`
                            : ''
                        }
                      </div>
                    </article>
                  `;
                })
                .join('')
            : `<p class="text-sm text-ink-400 md:col-span-3">No hay condecoraciones registradas.</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-decorations-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#decoration-image')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        imageDataUrl = file ? await readFileAsDataUrl(file) : null;
      });

      root.querySelector('#create-decoration-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await createDecoration({
            name: root.querySelector('#decoration-name').value.trim(),
            description: root.querySelector('#decoration-description').value.trim() || undefined,
            imageUrl: imageDataUrl || undefined,
          });
          event.target.reset();
          imageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-decorations-alert',
            type: 'success',
            message: 'Condecoración creada.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-decorations-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      root.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-toggle-decoration]');
        if (!button || !canManage) {
          return;
        }
        const id = button.getAttribute('data-toggle-decoration');
        const isActive = button.getAttribute('data-active') === 'true';
        try {
          await updateDecoration(id, { isActive: !isActive });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-decorations-alert',
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
