import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { can } from '../../services/auth-context.js';
import {
  deleteGalleryItem,
  listGalleryItems,
  reorderGalleryItems,
  updateGalleryItem,
  uploadGalleryItem,
} from '../../services/gallery.service.js';
import { formatDateTimeLabel } from '../../utils/date.js';
import { validateImageUploadFile } from '../../utils/image-upload.js';
import { resolveUploadUrl } from '../../utils/media.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

const STATUS_LABELS = {
  ACTIVE: 'Activa',
  HIDDEN: 'Oculta',
};

export function adminGalleryPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.GALLERY_MANAGE) && !can(PERMISSIONS.ADMIN_ACCESS)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-gallery-alert' })}
      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Subir imagen</h3>
        <form id="create-gallery-form" class="mt-4 space-y-4">
          <div>
            <label class="form-label" for="gallery-image">Archivo</label>
            <input id="gallery-image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" class="form-input" required />
            <p class="mt-2 text-xs text-ink-500">JPG, PNG o WebP · máximo 8 MB</p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="gallery-title">Título (opcional)</label>
              <input id="gallery-title" class="form-input" maxlength="200" />
            </div>
            <div>
              <label class="form-label" for="gallery-description">Descripción (opcional)</label>
              <input id="gallery-description" class="form-input" maxlength="1000" />
            </div>
          </div>
          <div class="mt-2">
            <button type="submit" class="btn-primary">Subir imagen</button>
          </div>
        </form>
      </section>
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="gallery-grid"></section>
    </div>
  `;

  return {
    html: renderAdminShell(content, { title: 'Galería', currentPath: '/admin/gallery' }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Galería');
      let selectedFile = null;
      let itemsCache = [];

      const load = async () => {
        try {
          itemsCache = await listGalleryItems();
          const grid = root.querySelector('#gallery-grid');
          grid.innerHTML = itemsCache.length
            ? itemsCache.map((item, index) => renderGalleryCard(item, index, itemsCache.length)).join('')
            : `<p class="text-sm text-ink-400 md:col-span-3">No hay imágenes en la galería.</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-gallery-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#gallery-image')?.addEventListener('change', (event) => {
        const file = event.target.files?.[0] ?? null;
        selectedFile = null;
        if (!file) return;

        const validation = validateImageUploadFile(file, { required: true });
        if (!validation.ok) {
          event.target.value = '';
          setAuthAlert(root, {
            id: 'admin-gallery-alert',
            type: 'error',
            message: validation.message,
          });
          return;
        }

        selectedFile = validation.file;
      });

      root.querySelector('#create-gallery-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedFile) {
          setAuthAlert(root, {
            id: 'admin-gallery-alert',
            type: 'error',
            message: 'Selecciona una imagen válida (JPG, PNG o WebP, máx. 8 MB).',
          });
          return;
        }
        try {
          await uploadGalleryItem({
            file: selectedFile,
            title: root.querySelector('#gallery-title').value.trim() || undefined,
            description: root.querySelector('#gallery-description').value.trim() || undefined,
            status: 'ACTIVE',
          });
          event.target.reset();
          selectedFile = null;
          setAuthAlert(root, {
            id: 'admin-gallery-alert',
            type: 'success',
            message: 'Imagen subida.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-gallery-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo subir la imagen.'),
          });
        }
      });

      root.addEventListener('click', async (event) => {
        const toggle = event.target.closest('[data-gallery-status]');
        const remove = event.target.closest('[data-gallery-delete]');
        const move = event.target.closest('[data-gallery-move]');
        const saveMeta = event.target.closest('[data-gallery-save]');

        try {
          if (toggle) {
            await updateGalleryItem(toggle.getAttribute('data-gallery-id'), {
              status: toggle.getAttribute('data-gallery-status'),
            });
            await load();
          }
          if (remove) {
            await deleteGalleryItem(remove.getAttribute('data-gallery-delete'));
            setAuthAlert(root, {
              id: 'admin-gallery-alert',
              type: 'success',
              message: 'Imagen eliminada.',
            });
            await load();
          }
          if (move) {
            const id = move.getAttribute('data-gallery-move');
            const direction = move.getAttribute('data-direction');
            const ordered = [...itemsCache].sort((a, b) => a.sortOrder - b.sortOrder);
            const index = ordered.findIndex((item) => item.id === id);
            const swapWith = direction === 'up' ? index - 1 : index + 1;
            if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
            const a = ordered[index];
            const b = ordered[swapWith];
            await reorderGalleryItems([
              { id: a.id, sortOrder: b.sortOrder },
              { id: b.id, sortOrder: a.sortOrder },
            ]);
            await load();
          }
          if (saveMeta) {
            const id = saveMeta.getAttribute('data-gallery-save');
            const card = saveMeta.closest('[data-gallery-card]');
            await updateGalleryItem(id, {
              title: card.querySelector('[data-gallery-title]')?.value.trim() || null,
              description: card.querySelector('[data-gallery-description]')?.value.trim() || null,
            });
            setAuthAlert(root, {
              id: 'admin-gallery-alert',
              type: 'success',
              message: 'Metadatos actualizados.',
            });
            await load();
          }
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-gallery-alert',
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

function renderGalleryCard(item, index, total) {
  const image = resolveUploadUrl(item.imageUrl);
  return `
    <article class="surface-card overflow-hidden" data-gallery-card data-gallery-id="${item.id}">
      <div class="aspect-[4/3] overflow-hidden bg-surface-950">
        ${
          image
            ? `<img src="${escapeHtml(image)}" alt="" class="h-full w-full object-cover" />`
            : `<div class="flex h-full items-center justify-center text-sm text-ink-500">Sin imagen</div>`
        }
      </div>
      <div class="space-y-3 p-5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] uppercase tracking-wide ${item.status === 'ACTIVE' ? 'text-emerald-300' : 'text-ink-500'}">${STATUS_LABELS[item.status] ?? item.status}</span>
          <span class="text-[11px] text-ink-500">Orden ${item.sortOrder}</span>
        </div>
        <div>
          <label class="form-label" for="gallery-title-${item.id}">Título</label>
          <input id="gallery-title-${item.id}" class="form-input" data-gallery-title value="${escapeAttr(item.title)}" maxlength="200" />
        </div>
        <div>
          <label class="form-label" for="gallery-desc-${item.id}">Descripción</label>
          <input id="gallery-desc-${item.id}" class="form-input" data-gallery-description value="${escapeAttr(item.description)}" maxlength="1000" />
        </div>
        <p class="text-xs text-ink-500">${formatDateTimeLabel(item.createdAt)}</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" data-gallery-save="${item.id}">Guardar</button>
          <button type="button" class="btn-secondary" data-gallery-move="${item.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn-secondary" data-gallery-move="${item.id}" data-direction="down" ${index >= total - 1 ? 'disabled' : ''}>↓</button>
          ${
            item.status === 'ACTIVE'
              ? `<button type="button" class="btn-secondary" data-gallery-id="${item.id}" data-gallery-status="HIDDEN">Ocultar</button>`
              : `<button type="button" class="btn-primary" data-gallery-id="${item.id}" data-gallery-status="ACTIVE">Publicar</button>`
          }
          <button type="button" class="btn-secondary text-rose-300" data-gallery-delete="${item.id}">Eliminar</button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}
