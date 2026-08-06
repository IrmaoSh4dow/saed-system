import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import { can } from '../../services/auth-context.js';
import {
  createNewsArticle,
  deleteNewsArticle,
  listNewsArticles,
  updateNewsArticle,
} from '../../services/news.service.js';
import { formatDateTimeLabel } from '../../utils/date.js';
import { resolveUploadUrl } from '../../utils/media.js';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageUploadFile,
} from '../../utils/image-upload.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  HIDDEN: 'Oculto',
};

export function adminNewsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.NEWS_MANAGE) && !can(PERMISSIONS.ADMIN_ACCESS)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-news-alert' })}
      <section class="panel p-6">
        <h3 class="text-sm font-semibold text-white">Nueva noticia</h3>
        <form id="create-news-form" class="mt-4 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="news-title">Título</label>
              <input id="news-title" class="form-input" required maxlength="200" />
            </div>
            <div>
              <label class="form-label" for="news-author">Autor</label>
              <input id="news-author" class="form-input" required maxlength="120" />
            </div>
          </div>
          <div>
            <label class="form-label" for="news-summary">Resumen</label>
            <textarea id="news-summary" class="form-input min-h-[72px]" required maxlength="500"></textarea>
          </div>
          <div>
            <label class="form-label" for="news-content">Contenido</label>
            <textarea id="news-content" class="form-input min-h-[120px]" required maxlength="50000"></textarea>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="form-label" for="news-image">Imagen principal</label>
              <input id="news-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
              <p class="form-hint">JPG, PNG, WebP o GIF · máximo 8 MB</p>
            </div>
            <div>
              <label class="form-label" for="news-status">Estado</label>
              <select id="news-status" class="form-input">
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="HIDDEN">Oculto</option>
              </select>
            </div>
          </div>
          <div class="mt-2">
            <button type="submit" class="btn-primary">Crear noticia</button>
          </div>
        </form>
      </section>
      <section class="space-y-4" id="news-list"></section>
    </div>
  `;

  return {
    html: renderAdminShell(content, { title: 'Noticias', currentPath: '/admin/news' }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Admin · Noticias');
      let imageDataUrl = null;

      const load = async () => {
        try {
          const articles = await listNewsArticles();
          const host = root.querySelector('#news-list');
          host.innerHTML = articles.length
            ? articles.map((item) => renderNewsRow(item)).join('')
            : `<p class="text-sm text-ink-400">No hay noticias registradas.</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-news-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#news-image')?.addEventListener('change', async (event) => {
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
            id: 'admin-news-alert',
            type: 'error',
            message: validation.message,
          });
          return;
        }
        imageDataUrl = await readFileAsDataUrl(file);
      });

      root.querySelector('#create-news-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await createNewsArticle({
            title: root.querySelector('#news-title').value.trim(),
            summary: root.querySelector('#news-summary').value.trim(),
            content: root.querySelector('#news-content').value.trim(),
            authorName: root.querySelector('#news-author').value.trim(),
            status: root.querySelector('#news-status').value,
            coverImageUrl: imageDataUrl || undefined,
          });
          event.target.reset();
          imageDataUrl = null;
          setAuthAlert(root, {
            id: 'admin-news-alert',
            type: 'success',
            message: 'Noticia creada.',
          });
          await load();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-news-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      root.addEventListener('click', async (event) => {
        const publishBtn = event.target.closest('[data-news-status]');
        const deleteBtn = event.target.closest('[data-news-delete]');
        try {
          if (publishBtn) {
            await updateNewsArticle(publishBtn.getAttribute('data-news-id'), {
              status: publishBtn.getAttribute('data-news-status'),
            });
            setAuthAlert(root, {
              id: 'admin-news-alert',
              type: 'success',
              message: 'Estado de la noticia actualizado.',
            });
            await load();
          }
          if (deleteBtn) {
            await deleteNewsArticle(deleteBtn.getAttribute('data-news-delete'));
            setAuthAlert(root, {
              id: 'admin-news-alert',
              type: 'success',
              message: 'Noticia eliminada.',
            });
            await load();
          }
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-news-alert',
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

function renderNewsRow(item) {
  const image = resolveUploadUrl(item.coverImageUrl);
  return `
    <article class="panel overflow-hidden sm:flex">
      <div class="h-36 w-full shrink-0 bg-surface-950 sm:h-auto sm:w-44">
        ${
          image
            ? `<img src="${escapeHtml(image)}" alt="" class="h-full w-full object-cover" />`
            : `<div class="flex h-full min-h-[9rem] items-center justify-center text-xs text-ink-500">Sin imagen</div>`
        }
      </div>
      <div class="flex flex-1 flex-col gap-3 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-white">${escapeHtml(item.title)}</h3>
            <p class="mt-1 text-xs text-ink-500">${escapeHtml(item.authorName)} · ${formatDateTimeLabel(item.publishedAt || item.createdAt)}</p>
          </div>
          <span class="rounded-lg border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-ink-300">${STATUS_LABELS[item.status] ?? item.status}</span>
        </div>
        <p class="text-sm text-ink-300">${escapeHtml(item.summary)}</p>
        <div class="mt-auto flex flex-wrap gap-3">
          ${
            item.status !== 'PUBLISHED'
              ? `<button type="button" class="btn-primary" data-news-id="${item.id}" data-news-status="PUBLISHED">Publicar</button>`
              : `<button type="button" class="btn-secondary" data-news-id="${item.id}" data-news-status="HIDDEN">Despublicar</button>`
          }
          ${
            item.status !== 'DRAFT'
              ? `<button type="button" class="btn-secondary" data-news-id="${item.id}" data-news-status="DRAFT">A borrador</button>`
              : ''
          }
          <button type="button" class="btn-secondary text-rose-300" data-news-delete="${item.id}">Eliminar</button>
        </div>
      </div>
    </article>
  `;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
