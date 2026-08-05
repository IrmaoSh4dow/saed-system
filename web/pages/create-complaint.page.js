import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { createComplaint, searchComplaintOfficers } from '../services/complaints.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { getApiBaseUrl } from '../utils/env.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { navigate } from '../utils/router.js';

export function createComplaintPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.COMPLAINTS_CREATE)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'create-complaint-alert' })}

      <section class="surface-card p-5 md:p-6 lg:p-8">
        <div class="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <p class="landing-eyebrow">Denuncias</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">Nueva denuncia</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
              Presenta una denuncia contra personal SAED. Debes seleccionar personal existente por nº de empleado o nombre.
            </p>
          </div>
          <a data-link href="/complaints" class="btn-secondary shrink-0 self-start sm:self-auto">Volver al listado</a>
        </div>

        <form id="create-complaint-form" class="mt-6 space-y-8" novalidate>
          <div class="grid gap-6 lg:grid-cols-12">
            <div class="space-y-5 lg:col-span-7">
              <div>
                <label class="form-label" for="complaint-title">Título</label>
                <input id="complaint-title" class="form-input" required maxlength="160" placeholder="Resumen breve del incidente" />
              </div>
              <div>
                <label class="form-label" for="complaint-description">Descripción</label>
                <textarea id="complaint-description" class="form-input min-h-[180px] resize-y" required maxlength="5000" placeholder="Describe los hechos con el mayor detalle posible..."></textarea>
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="complaint-date">Fecha del incidente</label>
                  <input id="complaint-date" type="date" class="form-input" />
                </div>
                <div>
                  <label class="form-label" for="complaint-location">Lugar</label>
                  <input id="complaint-location" class="form-input" maxlength="200" placeholder="Ej. Mission Row, Legion Square..." />
                </div>
              </div>
            </div>

            <div class="space-y-5 lg:col-span-5">
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <label class="form-label" for="officer-query">Personal denunciado</label>
                <div class="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input id="officer-query" class="form-input min-w-0 flex-1" placeholder="Nº de empleado o nombre..." autocomplete="off" />
                  <button type="button" id="officer-search" class="btn-secondary shrink-0">Buscar</button>
                </div>
                <input type="hidden" id="accused-officer-id" />
                <div id="accused-officer-selected" class="mt-3 hidden rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-3 text-sm text-brand-200"></div>
                <p id="accused-officer-empty" class="mt-3 text-sm text-ink-400">Ningún personal seleccionado</p>
                <div id="officer-results" class="mt-3 max-h-56 space-y-2 overflow-y-auto"></div>
              </div>

              <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <p class="text-sm font-semibold text-white">Evidencias</p>
                <div>
                  <label class="form-label" for="evidence-image">Imagen</label>
                  <input id="evidence-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
                  <p class="form-hint">JPG, PNG, WebP o GIF · máximo 8 MB</p>
                </div>
                <div>
                  <label class="form-label" for="evidence-video">URL de video</label>
                  <input id="evidence-video" class="form-input" placeholder="https://medal.tv / youtu.be / streamable..." />
                  <p class="form-hint">Medal, YouTube o Streamable.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <a data-link href="/complaints" class="btn-secondary text-center">Cancelar</a>
            <button type="submit" class="btn-primary">Enviar denuncia</button>
          </div>
        </form>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Nueva denuncia',
      currentPath: '/complaints',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Nueva denuncia · SAED';
      let imageDataUrl = null;
      let searchTimer = null;

      const selectedBox = root.querySelector('#accused-officer-selected');
      const emptyLabel = root.querySelector('#accused-officer-empty');

      const runSearch = async () => {
        const query = root.querySelector('#officer-query').value.trim();
        const host = root.querySelector('#officer-results');
        if (query.length < 2) {
          host.innerHTML = `<p class="text-xs text-ink-500">Escribe al menos 2 caracteres.</p>`;
          return;
        }
        try {
          const results = await searchComplaintOfficers(query);
          host.innerHTML = results.length
            ? results
                .map((officer) => {
                  const avatar = resolveUploadUrl(officer.character.avatarUrl);
                  const initials =
                    `${officer.character.firstName?.[0] ?? ''}${officer.character.lastName?.[0] ?? ''}`.toUpperCase();
                  return `
                    <button type="button" class="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                      data-pick-officer="${officer.id}"
                      data-pick-label="${officer.character.firstName} ${officer.character.lastName}"
                      data-pick-badge="${officer.employeeNumber}"
                      data-pick-avatar="${avatar ?? ''}">
                      <div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface-950">
                        ${
                          avatar
                            ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
                            : `<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-ink-300">${initials}</div>`
                        }
                      </div>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-medium text-white">${officer.character.firstName} ${officer.character.lastName}</span>
                        <span class="block truncate text-xs text-ink-400">${officer.employeeNumber} · ${officer.rank?.name ?? '—'} · ${officer.department?.name ?? 'Sin departamento'}</span>
                      </span>
                    </button>
                  `;
                })
                .join('')
            : `<p class="text-sm text-ink-400">Sin resultados.</p>`;
        } catch (error) {
          setAuthAlert(root, {
            id: 'create-complaint-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      root.querySelector('#evidence-image')?.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        imageDataUrl = file ? await readFileAsDataUrl(file) : null;
      });

      root.querySelector('#officer-search')?.addEventListener('click', () => {
        void runSearch();
      });

      root.querySelector('#officer-query')?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => void runSearch(), 280);
      });

      root.addEventListener('click', (event) => {
        const pick = event.target.closest('[data-pick-officer]');
        if (!pick) return;
        root.querySelector('#accused-officer-id').value = pick.getAttribute('data-pick-officer');
        const label = pick.getAttribute('data-pick-label');
        const badge = pick.getAttribute('data-pick-badge');
        const avatar = pick.getAttribute('data-pick-avatar');
        selectedBox.classList.remove('hidden');
        emptyLabel.classList.add('hidden');
        selectedBox.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface-950">
              ${avatar ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />` : ''}
            </div>
            <div>
              <p class="font-medium text-white">${label}</p>
              <p class="text-xs text-brand-300">Nº ${badge}</p>
            </div>
          </div>
        `;
        root.querySelector('#officer-results').innerHTML = '';
      });

      root.querySelector('#create-complaint-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accusedStaffId = root.querySelector('#accused-officer-id').value;
        if (!accusedStaffId) {
          setAuthAlert(root, {
            id: 'create-complaint-alert',
            type: 'error',
            message: 'Debes seleccionar un personal existente.',
          });
          return;
        }

        const evidence = [];
        if (imageDataUrl) {
          evidence.push({ type: 'IMAGE', value: imageDataUrl, label: 'Evidencia fotográfica' });
        }
        const videoUrl = root.querySelector('#evidence-video').value.trim();
        if (videoUrl) {
          evidence.push({ type: 'VIDEO_URL', value: videoUrl, label: 'Clip de video' });
        }

        try {
          const complaint = await createComplaint({
            title: root.querySelector('#complaint-title').value.trim(),
            description: root.querySelector('#complaint-description').value.trim(),
            incidentDate: root.querySelector('#complaint-date').value || undefined,
            location: root.querySelector('#complaint-location').value.trim() || undefined,
            accusedStaffId,
            evidence,
          });
          void navigate(`/complaints?id=${complaint.id}`, { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'create-complaint-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      return () => {
        clearTimeout(searchTimer);
        cleanup?.();
      };
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
