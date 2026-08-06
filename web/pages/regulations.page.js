import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { bindRichEditor, renderRichEditor } from '../components/regulations/rich-editor.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  createRegulationCategory,
  createRegulationDocument,
  deleteRegulationAttachment,
  deleteRegulationDocument,
  getRegulationDocument,
  getRegulationsDashboard,
  listRegulationCategories,
  listRegulationDocuments,
  restoreRegulationVersion,
  updateRegulationDocument,
  uploadRegulationAttachment,
} from '../services/regulations.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateLabel, formatDateTimeLabel } from '../utils/date.js';
import { resolveUploadUrl } from '../utils/media.js';
import { navigate } from '../utils/router.js';
import { sanitizeHtml } from '../utils/sanitize-html.js';
import { PERMISSIONS } from '../utils/permissions.js';

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

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

export function regulationsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }
  if (!requirePermission(PERMISSIONS.REGULATIONS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const params = new URLSearchParams(window.location.search);
  const documentId = params.get('id');
  const mode = params.get('mode'); // edit | new | manage
  const canCreate = can(PERMISSIONS.REGULATIONS_CREATE) || can('*');
  const canUpdate = can(PERMISSIONS.REGULATIONS_UPDATE) || can('*');
  const canDelete = can(PERMISSIONS.REGULATIONS_DELETE) || can('*');
  const canPublish = can(PERMISSIONS.REGULATIONS_PUBLISH) || can('*');

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'regulations-alert' })}
      <div id="regulations-root">
        <p class="text-sm text-ink-400">Cargando biblioteca normativa…</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Reglamento',
      currentPath: '/regulations',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Reglamento · SAED';

      const paint = async () => {
        const host = root.querySelector('#regulations-root');
        if (!host) return;
        try {
          if (mode === 'new' || (mode === 'edit' && documentId)) {
            if (!canCreate && !canUpdate) {
              void navigate('/regulations', { replace: true });
              return;
            }
            await paintEditor(root, host, {
              documentId: mode === 'edit' ? documentId : null,
              canPublish,
              canDelete,
            });
          } else if (documentId) {
            await paintReader(root, host, documentId, { canUpdate, canDelete });
          } else {
            await paintLibrary(root, host, { canCreate });
          }
        } catch (error) {
          host.innerHTML = `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      void paint();
      return cleanup;
    },
  };
}

async function paintLibrary(root, host, { canCreate }) {
  const [dashboard, categories, documents] = await Promise.all([
    getRegulationsDashboard(),
    listRegulationCategories(),
    listRegulationDocuments({}),
  ]);

  const grouped = categories.map((category) => ({
    ...category,
    documents: documents.filter((item) => item.category?.id === category.id),
  }));

  host.innerHTML = `
    <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950 p-5 md:p-8">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.12),_transparent_50%)]"></div>
      <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="landing-eyebrow">Biblioteca institucional</p>
          <h2 class="mt-1 text-3xl font-semibold tracking-tight text-white">Reglamento SAED</h2>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
            Fuente oficial de protocolos, procedimientos y normativa interna. Organizada por categorías, con historial de versiones.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${canCreate ? `<a data-link href="/regulations?mode=new" class="btn-primary">Nuevo documento</a>` : ''}
          ${canCreate ? `<button type="button" id="toggle-category-form" class="btn-secondary">Nueva categoría</button>` : ''}
        </div>
      </div>
      <div class="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${metric('Publicados', dashboard.published)}
        ${metric('Borradores', dashboard.drafts)}
        ${metric('Categorías', dashboard.categories)}
        ${metric('Archivados', dashboard.archived)}
      </div>
    </section>

    <section class="panel p-4 md:p-5">
      <form id="regulations-search" class="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <div>
          <label class="form-label" for="reg-q">Buscar</label>
          <input id="reg-q" class="form-input" placeholder="Título, contenido, categoría o autor…" />
        </div>
        <div>
          <label class="form-label" for="reg-category">Categoría</label>
          <select id="reg-category" class="form-input">
            <option value="">Todas</option>
            ${categories.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}
          </select>
        </div>
        <div class="flex items-end">
          <button type="submit" class="btn-primary w-full md:w-auto">Buscar</button>
        </div>
      </form>
      ${
        canCreate
          ? `
            <form id="category-create-form" class="mt-4 hidden grid gap-3 border-t border-white/10 pt-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label class="form-label" for="cat-name">Nombre</label>
                <input id="cat-name" class="form-input" required maxlength="120" />
              </div>
              <div>
                <label class="form-label" for="cat-description">Descripción</label>
                <input id="cat-description" class="form-input" maxlength="500" />
              </div>
              <div class="flex items-end">
                <button type="submit" class="btn-secondary">Crear categoría</button>
              </div>
            </form>
          `
          : ''
      }
    </section>

    <section id="regulations-results" class="space-y-4">
      ${renderLibraryGroups(grouped)}
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Actualizados recientemente</h3>
        <div class="mt-3 space-y-2">${renderMiniList(dashboard.recentUpdated)}</div>
      </article>
      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Últimos creados</h3>
        <div class="mt-3 space-y-2">${renderMiniList(dashboard.recentCreated)}</div>
      </article>
    </section>
  `;

  root.querySelector('#toggle-category-form')?.addEventListener('click', () => {
    root.querySelector('#category-create-form')?.classList.toggle('hidden');
  });

  root.querySelector('#category-create-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await createRegulationCategory({
        name: root.querySelector('#cat-name').value.trim(),
        description: root.querySelector('#cat-description').value.trim() || undefined,
      });
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'success',
        message: 'Categoría creada.',
      });
      void navigate('/regulations', { replace: true });
    } catch (error) {
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#regulations-search')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const q = root.querySelector('#reg-q')?.value?.trim() || undefined;
    const categoryId = root.querySelector('#reg-category')?.value || undefined;
    try {
      const results = await listRegulationDocuments({ q, categoryId });
      const resultsHost = root.querySelector('#regulations-results');
      if (!resultsHost) return;
      if (!results.length) {
        resultsHost.innerHTML = `<p class="text-sm text-ink-400">Sin resultados para esa búsqueda.</p>`;
        return;
      }
      const byCategory = categories.map((category) => ({
        ...category,
        documents: results.filter((item) => item.category?.id === category.id),
      }));
      resultsHost.innerHTML = renderLibraryGroups(byCategory.filter((item) => item.documents.length));
    } catch (error) {
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });
}

function renderLibraryGroups(groups) {
  if (!groups.length) {
    return `<p class="text-sm text-ink-400">Aún no hay documentos en la biblioteca.</p>`;
  }

  return groups
    .map((category) => {
      const docs = category.documents ?? [];
      return `
        <article class="panel overflow-hidden">
          <div class="border-b border-white/10 px-5 py-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold text-white">${escapeHtml(category.name)}</h3>
                <p class="mt-1 text-xs text-ink-500">${escapeHtml(category.description || 'Sin descripción')} · ${docs.length} documento(s)</p>
              </div>
            </div>
          </div>
          <div class="divide-y divide-white/5">
            ${
              docs.length
                ? docs
                    .map(
                      (doc) => `
                        <a data-link href="/regulations?id=${doc.id}" class="flex items-start justify-between gap-3 px-5 py-4 transition hover:bg-white/[0.03]">
                          <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-white">${escapeHtml(doc.title)}</p>
                            <p class="mt-1 text-xs text-ink-500">
                              ${STATUS_LABELS[doc.status] ?? doc.status}
                              · v${doc.versionNumber}
                              · Actualizado ${escapeHtml(formatDateLabel(doc.updatedAt))}
                              ${doc.lastEditorCharacter ? ` · ${escapeHtml(characterName(doc.lastEditorCharacter))}` : ''}
                            </p>
                          </div>
                          <span class="shrink-0 text-xs text-brand-300">Abrir →</span>
                        </a>
                      `,
                    )
                    .join('')
                : `<p class="px-5 py-4 text-sm text-ink-500">Sin documentos en esta categoría.</p>`
            }
          </div>
        </article>
      `;
    })
    .join('');
}

function renderMiniList(items = []) {
  if (!items.length) return `<p class="text-sm text-ink-500">Sin actividad reciente.</p>`;
  return items
    .map(
      (item) => `
        <a data-link href="/regulations?id=${item.id}" class="block rounded-xl border border-white/10 px-3 py-2.5 hover:bg-white/[0.03]">
          <p class="truncate text-sm text-white">${escapeHtml(item.title)}</p>
          <p class="mt-1 text-[11px] text-ink-500">${escapeHtml(item.category?.name ?? '—')} · ${escapeHtml(formatDateLabel(item.updatedAt || item.createdAt))}</p>
        </a>
      `,
    )
    .join('');
}

async function paintReader(root, host, documentId, { canUpdate, canDelete }) {
  const doc = await getRegulationDocument(documentId);
  const toc = buildToc(doc.contentHtml);

  host.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <nav class="text-sm text-ink-400">
        <a data-link href="/regulations" class="text-brand-300 hover:text-brand-200">Reglamento</a>
        <span class="mx-2 text-ink-600">/</span>
        <span>${escapeHtml(doc.category?.name ?? 'Documento')}</span>
      </nav>
      <div class="flex flex-wrap gap-2">
        ${canUpdate ? `<a data-link href="/regulations?mode=edit&id=${doc.id}" class="btn-secondary">Editar</a>` : ''}
        ${canDelete ? `<button type="button" id="delete-document" class="btn-secondary">Eliminar</button>` : ''}
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <article class="panel p-4">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">Índice</p>
          <nav class="mt-3 space-y-1.5" id="regulation-toc">
            ${
              toc.length
                ? toc
                    .map(
                      (item) => `
                        <a href="#${item.id}" class="block text-sm text-ink-300 transition hover:text-white ${item.level > 2 ? 'pl-3 text-xs' : ''}">
                          ${escapeHtml(item.text)}
                        </a>
                      `,
                    )
                    .join('')
                : `<p class="text-xs text-ink-500">Sin encabezados detectados.</p>`
            }
          </nav>
        </article>
        <article class="panel p-4">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">Metadatos</p>
          <dl class="mt-3 space-y-2 text-xs text-ink-400">
            <div><dt class="text-ink-500">Estado</dt><dd class="text-white">${STATUS_LABELS[doc.status] ?? doc.status}</dd></div>
            <div><dt class="text-ink-500">Versión</dt><dd class="text-white">v${doc.versionNumber}</dd></div>
            <div><dt class="text-ink-500">Autor</dt><dd class="text-white">${escapeHtml(characterName(doc.authorCharacter))}</dd></div>
            <div><dt class="text-ink-500">Último editor</dt><dd class="text-white">${escapeHtml(characterName(doc.lastEditorCharacter))}</dd></div>
            <div><dt class="text-ink-500">Actualizado</dt><dd class="text-white">${escapeHtml(formatDateTimeLabel(doc.updatedAt))}</dd></div>
          </dl>
        </article>
        ${
          doc.attachments?.length
            ? `
              <article class="panel p-4">
                <p class="text-[11px] uppercase tracking-wide text-ink-500">Adjuntos</p>
                <div class="mt-3 space-y-2">
                  ${doc.attachments
                    .map(
                      (file) => `
                        <a href="${escapeHtml(resolveUploadUrl(file.fileUrl))}" target="_blank" rel="noopener"
                          class="block rounded-xl border border-white/10 px-3 py-2 text-xs text-brand-300 hover:bg-white/[0.03]">
                          ${escapeHtml(file.fileName)}
                        </a>
                      `,
                    )
                    .join('')}
                </div>
              </article>
            `
            : ''
        }
        ${
          canUpdate && doc.versions?.length
            ? `
              <article class="panel p-4">
                <p class="text-[11px] uppercase tracking-wide text-ink-500">Historial</p>
                <div class="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  ${doc.versions
                    .map(
                      (version) => `
                        <div class="rounded-xl border border-white/10 px-3 py-2">
                          <p class="text-xs font-medium text-white">v${version.versionNumber}</p>
                          <p class="mt-1 text-[11px] text-ink-500">${escapeHtml(version.changeSummary || 'Sin resumen')} · ${escapeHtml(formatDateTimeLabel(version.createdAt))}</p>
                          <button type="button" class="mt-2 text-[11px] text-brand-300" data-restore-version="${version.id}">Restaurar</button>
                        </div>
                      `,
                    )
                    .join('')}
                </div>
              </article>
            `
            : ''
        }
      </aside>

      <article class="panel overflow-hidden">
        <div class="border-b border-white/10 px-6 py-6 md:px-10">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">${escapeHtml(doc.category?.name ?? 'Documento')}</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">${escapeHtml(doc.title)}</h1>
          ${doc.summary ? `<p class="mt-3 max-w-3xl text-base leading-relaxed text-ink-300">${escapeHtml(doc.summary)}</p>` : ''}
        </div>
        <div class="regulation-prose px-6 py-8 md:px-10 md:py-10">
          ${prepareReadableHtml(doc.contentHtml, toc)}
        </div>
      </article>
    </div>
  `;

  root.querySelector('#delete-document')?.addEventListener('click', async () => {
    try {
      await deleteRegulationDocument(doc.id);
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'success',
        message: 'Documento eliminado.',
      });
      void navigate('/regulations', { replace: true });
    } catch (error) {
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-restore-version]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await restoreRegulationVersion(doc.id, button.getAttribute('data-restore-version'));
        setAuthAlert(root, {
          id: 'regulations-alert',
          type: 'success',
          message: 'Versión restaurada. Se creó una nueva revisión.',
        });
        void navigate(`/regulations?id=${doc.id}`, { replace: true });
      } catch (error) {
        setAuthAlert(root, {
          id: 'regulations-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelectorAll('#regulation-toc a').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href?.startsWith('#')) return;
      event.preventDefault();
      const target = root.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

async function paintEditor(root, host, { documentId, canPublish, canDelete }) {
  const [categories, existing] = await Promise.all([
    listRegulationCategories({ includeInactive: false }),
    documentId ? getRegulationDocument(documentId) : Promise.resolve(null),
  ]);

  host.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <a data-link href="${existing ? `/regulations?id=${existing.id}` : '/regulations'}" class="text-sm text-brand-300 hover:text-brand-200">← Volver</a>
      <p class="text-xs text-ink-500">${existing ? `Editando · v${existing.versionNumber}` : 'Nuevo documento'}</p>
    </div>

    <section class="panel p-5 md:p-8 space-y-5">
      <div>
        <p class="landing-eyebrow">Editor normativo</p>
        <h2 class="mt-1 text-2xl font-semibold text-white">${existing ? 'Editar documento' : 'Crear documento'}</h2>
      </div>
      <form id="regulation-editor-form" class="space-y-5">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="form-label" for="doc-title">Título</label>
            <input id="doc-title" class="form-input" required maxlength="200" value="${escapeHtml(existing?.title ?? '')}" />
          </div>
          <div>
            <label class="form-label" for="doc-category">Categoría</label>
            <select id="doc-category" class="form-input" required>
              ${categories
                .map(
                  (item) =>
                    `<option value="${item.id}" ${existing?.category?.id === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`,
                )
                .join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="form-label" for="doc-summary">Resumen</label>
          <textarea id="doc-summary" class="form-input min-h-20" maxlength="1000">${escapeHtml(existing?.summary ?? '')}</textarea>
        </div>
        <div>
          <label class="form-label">Contenido</label>
          ${renderRichEditor({ id: 'regulation-editor', initialHtml: existing?.contentHtml || '<h2>Introducción</h2><p>Escribe el contenido normativo aquí.</p>' })}
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="form-label" for="doc-status">Estado</label>
            <select id="doc-status" class="form-input" ${canPublish ? '' : 'disabled'}>
              ${Object.entries(STATUS_LABELS)
                .map(
                  ([value, label]) =>
                    `<option value="${value}" ${(existing?.status || 'DRAFT') === value ? 'selected' : ''}>${label}</option>`,
                )
                .join('')}
            </select>
          </div>
          <div>
            <label class="form-label" for="doc-change">Resumen del cambio</label>
            <input id="doc-change" class="form-input" maxlength="500" placeholder="Qué se modificó en esta versión" />
          </div>
        </div>
        ${
          existing
            ? `
              <div class="rounded-2xl border border-white/10 p-4">
                <p class="text-sm font-medium text-white">Adjuntos</p>
                <div id="attachment-list" class="mt-3 space-y-2">
                  ${(existing.attachments || [])
                    .map(
                      (file) => `
                        <div class="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-xs">
                          <a href="${escapeHtml(resolveUploadUrl(file.fileUrl))}" target="_blank" class="text-brand-300">${escapeHtml(file.fileName)}</a>
                          <button type="button" class="text-rose-300" data-remove-attachment="${file.id}">Quitar</button>
                        </div>
                      `,
                    )
                    .join('') || '<p class="text-xs text-ink-500">Sin adjuntos.</p>'}
                </div>
                <div class="mt-3">
                  <label class="form-label" for="doc-attachment">Añadir archivo</label>
                  <input id="doc-attachment" type="file" class="form-input" />
                </div>
              </div>
            `
            : ''
        }
        <div class="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-5">
          ${
            existing && canDelete
              ? `<button type="button" id="editor-delete" class="btn-secondary">Eliminar</button>`
              : ''
          }
          <button type="submit" class="btn-primary">Guardar</button>
        </div>
      </form>
    </section>
  `;

  const editor = bindRichEditor(root, 'regulation-editor');

  root.querySelector('#regulation-editor-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      title: root.querySelector('#doc-title').value.trim(),
      categoryId: root.querySelector('#doc-category').value,
      summary: root.querySelector('#doc-summary').value.trim() || null,
      contentHtml: editor.getHtml(),
      status: root.querySelector('#doc-status').value,
      changeSummary: root.querySelector('#doc-change').value.trim() || undefined,
    };

    try {
      const saved = existing
        ? await updateRegulationDocument(existing.id, payload)
        : await createRegulationDocument(payload);

      const fileInput = root.querySelector('#doc-attachment');
      if (fileInput?.files?.[0]) {
        await uploadRegulationAttachment(saved.id, fileInput.files[0]);
      }

      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'success',
        message: existing ? 'Documento actualizado.' : 'Documento creado.',
      });
      void navigate(`/regulations?id=${saved.id}`, { replace: true });
    } catch (error) {
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#editor-delete')?.addEventListener('click', async () => {
    try {
      await deleteRegulationDocument(existing.id);
      void navigate('/regulations', { replace: true });
    } catch (error) {
      setAuthAlert(root, {
        id: 'regulations-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-remove-attachment]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await deleteRegulationAttachment(existing.id, button.getAttribute('data-remove-attachment'));
        void navigate(`/regulations?mode=edit&id=${existing.id}`, { replace: true });
      } catch (error) {
        setAuthAlert(root, {
          id: 'regulations-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

function metric(label, value) {
  return `
    <article class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <p class="text-[11px] uppercase tracking-wide text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold text-white">${escapeHtml(String(value ?? 0))}</p>
    </article>
  `;
}

function buildToc(html) {
  const container = document.createElement('div');
  container.innerHTML = sanitizeHtml(html);
  const headings = [...container.querySelectorAll('h1, h2, h3')];
  return headings.map((heading, index) => {
    const id = `section-${index + 1}`;
    return {
      id,
      text: heading.textContent?.trim() || `Sección ${index + 1}`,
      level: Number(heading.tagName.replace('H', '')) || 2,
    };
  });
}

function prepareReadableHtml(html, toc) {
  const container = document.createElement('div');
  container.innerHTML = sanitizeHtml(html);
  const headings = [...container.querySelectorAll('h1, h2, h3')];
  headings.forEach((heading, index) => {
    heading.id = toc[index]?.id || `section-${index + 1}`;
  });
  return container.innerHTML;
}
