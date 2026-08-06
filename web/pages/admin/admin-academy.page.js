import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createAcademyAnnouncement,
  createAcademyTraining,
  getAcademyApplication,
  listAcademyAnnouncements,
  listAcademyApplications,
  listAcademyTrainings,
  reviewAcademyApplication,
} from '../../services/academy.service.js';
import { getAuthState } from '../../services/auth-context.js';
import { formatDateTimeLabel } from '../../utils/date.js';
import { navigate } from '../../utils/router.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

const TYPE_LABELS = {
  ACADEMY: 'Academia',
  TRANSFER: 'Traslado',
};

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En revisión',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  WITHDRAWN: 'Retirada',
};

const FIELD_LABELS = {
  fullName: 'Nombre completo',
  birthDate: 'Fecha de nacimiento',
  phone: 'Teléfono',
  email: 'Correo',
  educationLevel: 'Nivel educativo',
  currentOccupation: 'Ocupación actual',
  workHistory: 'Antecedentes laborales',
  motivation: 'Motivación',
  whyAccept: '¿Por qué aceptarte?',
  securityExperience: 'Experiencia en seguridad',
  availability: 'Disponibilidad',
  additionalNotes: 'Observaciones',
  originDepartment: 'Departamento de origen',
  currentRank: 'Rango actual',
  serviceTime: 'Tiempo de servicio',
  currentDepartment: 'Departamento actual',
  transferReason: 'Motivo del traslado',
  experience: 'Experiencia',
  decorations: 'Condecoraciones',
  disciplinary: 'Medidas disciplinarias',
  additionalInfo: 'Información adicional',
};

const SUMMARY_FIELDS = {
  ACADEMY: ['motivation', 'whyAccept', 'availability'],
  TRANSFER: ['originDepartment', 'transferReason', 'experience'],
};

export function adminAcademyPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    ${renderAuthAlert({ id: 'admin-academy-alert' })}
    <section class="grid gap-6 xl:grid-cols-2">
      <article class="panel p-5 space-y-3">
        <h3 class="text-sm font-semibold text-white">Gestión rápida</h3>
        <p class="text-sm text-ink-300">Administra entrenamientos, anuncios y revisa postulaciones (RTD / comando).</p>
        <div class="flex flex-wrap gap-2">
          <a data-link href="/admin/academy/applications" class="btn-primary">Postulaciones</a>
          <a data-link href="/academy" class="btn-secondary">Portal academia</a>
        </div>
      </article>
      <article class="panel p-5 space-y-3">
        <h3 class="text-sm font-semibold text-white">Resumen</h3>
        <div id="admin-academy-summary" class="text-sm text-ink-400">Cargando...</div>
      </article>
    </section>
    <section class="grid gap-6 xl:grid-cols-2 mt-6">
      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Crear entrenamiento</h3>
        <form id="admin-training-form" class="mt-4 space-y-3">
          <div>
            <label class="form-label" for="admin-training-title">Título</label>
            <input id="admin-training-title" class="form-input" required maxlength="200" />
          </div>
          <div>
            <label class="form-label" for="admin-training-description">Descripción</label>
            <textarea id="admin-training-description" class="form-input min-h-24" required></textarea>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="form-label" for="admin-training-starts">Fecha y hora</label>
              <input id="admin-training-starts" type="datetime-local" class="form-input" required />
            </div>
            <div>
              <label class="form-label" for="admin-training-capacity">Cupo</label>
              <input id="admin-training-capacity" type="number" min="1" class="form-input" />
            </div>
          </div>
          <div>
            <label class="form-label" for="admin-training-location">Lugar</label>
            <input id="admin-training-location" class="form-input" required value="Academia SAED" />
          </div>
          <button type="submit" class="btn-primary">Crear</button>
        </form>
      </article>
      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Publicar anuncio</h3>
        <form id="admin-announcement-form" class="mt-4 space-y-3">
          <div>
            <label class="form-label" for="admin-announcement-title">Título</label>
            <input id="admin-announcement-title" class="form-input" required />
          </div>
          <div>
            <label class="form-label" for="admin-announcement-content">Contenido</label>
            <textarea id="admin-announcement-content" class="form-input min-h-28" required></textarea>
          </div>
          <div>
            <label class="form-label" for="admin-announcement-priority">Prioridad</label>
            <select id="admin-announcement-priority" class="form-input">
              <option value="LOW">Baja</option>
              <option value="NORMAL" selected>Normal</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
          <button type="submit" class="btn-primary">Publicar</button>
        </form>
      </article>
    </section>
  `;

  return {
    html: renderAdminShell(content, { title: 'Academias', currentPath: '/admin/academy' }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Academias');

      const refreshSummary = async () => {
        const [trainings, announcements, applications] = await Promise.all([
          listAcademyTrainings().catch(() => []),
          listAcademyAnnouncements().catch(() => []),
          listAcademyApplications().catch(() => []),
        ]);
        const summary = root.querySelector('#admin-academy-summary');
        if (summary) {
          summary.innerHTML = `
            <ul class="space-y-2 text-sm text-ink-300">
              <li>Entrenamientos: <span class="text-white">${trainings.length}</span></li>
              <li>Anuncios: <span class="text-white">${announcements.length}</span></li>
              <li>Postulaciones pendientes: <span class="text-white">${applications.filter((item) => item.status === 'PENDING' || item.status === 'UNDER_REVIEW').length}</span></li>
            </ul>
          `;
        }
      };

      void refreshSummary().catch((error) => {
        setAuthAlert(root, {
          id: 'admin-academy-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      });

      root.querySelector('#admin-training-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const { activeCharacter } = getAuthState();
        try {
          const capacityRaw = root.querySelector('#admin-training-capacity').value;
          await createAcademyTraining({
            title: root.querySelector('#admin-training-title').value.trim(),
            description: root.querySelector('#admin-training-description').value.trim(),
            instructorCharacterId: activeCharacter.id,
            startsAt: new Date(root.querySelector('#admin-training-starts').value).toISOString(),
            location: root.querySelector('#admin-training-location').value.trim(),
            capacity: capacityRaw ? Number(capacityRaw) : undefined,
          });
          setAuthAlert(root, {
            id: 'admin-academy-alert',
            type: 'success',
            message: 'Entrenamiento creado.',
          });
          event.target.reset();
          await refreshSummary();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-academy-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      root.querySelector('#admin-announcement-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await createAcademyAnnouncement({
            title: root.querySelector('#admin-announcement-title').value.trim(),
            content: root.querySelector('#admin-announcement-content').value.trim(),
            priority: root.querySelector('#admin-announcement-priority').value,
          });
          setAuthAlert(root, {
            id: 'admin-academy-alert',
            type: 'success',
            message: 'Anuncio publicado.',
          });
          event.target.reset();
          await refreshSummary();
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-academy-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      return cleanup;
    },
  };
}

export function adminAcademyApplicationsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const detailId = new URLSearchParams(window.location.search).get('id');

  const content = `
    ${renderAuthAlert({ id: 'admin-academy-apps-alert' })}
    <section class="panel p-5">
      <div id="admin-apps-root"><p class="text-sm text-ink-400">Cargando...</p></div>
    </section>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Postulaciones',
      currentPath: '/admin/academy/applications',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Postulaciones');
      let typeFilter = '';

      const paintList = async () => {
        const items = await listAcademyApplications(typeFilter ? { type: typeFilter } : {});
        const host = root.querySelector('#admin-apps-root');
        if (!host) return;

        host.innerHTML = `
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary" data-filter-type="">Todas</button>
            <button type="button" class="btn-secondary" data-filter-type="ACADEMY">Academia</button>
            <button type="button" class="btn-secondary" data-filter-type="TRANSFER">Traslado</button>
          </div>
          <div class="mt-5 grid gap-3">
            ${
              items.length
                ? items.map((item) => renderApplicationRow(item)).join('')
                : `<p class="text-sm text-ink-400">No hay postulaciones.</p>`
            }
          </div>
        `;

        host.querySelectorAll('[data-filter-type]').forEach((button) => {
          button.addEventListener('click', () => {
            typeFilter = button.getAttribute('data-filter-type') || '';
            void paintList().catch(showError(root));
          });
        });
      };

      const paintDetail = async (id) => {
        const item = await getAcademyApplication(id);
        const host = root.querySelector('#admin-apps-root');
        if (!host) return;

        const name = `${item.character?.firstName ?? ''} ${item.character?.lastName ?? ''}`.trim();
        const form = item.formData ?? {};
        const canAct = item.status === 'PENDING' || item.status === 'UNDER_REVIEW';

        host.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <a data-link href="/admin/academy/applications" class="text-sm text-brand-300 hover:text-brand-200">← Volver al listado</a>
              <h3 class="mt-2 text-lg font-semibold text-white">${escapeHtml(name)}</h3>
              <p class="mt-1 text-xs text-ink-400">
                ${TYPE_LABELS[item.type] ?? item.type} · ${STATUS_LABELS[item.status] ?? item.status} · ${formatDateTimeLabel(item.createdAt)}
              </p>
            </div>
          </div>
          <div class="mt-5 grid gap-3 md:grid-cols-2">
            ${Object.entries(form)
              .map(
                ([key, value]) => `
                <div class="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 ${isLongField(value) ? 'md:col-span-2' : ''}">
                  <p class="text-[11px] uppercase tracking-wide text-ink-500">${escapeHtml(FIELD_LABELS[key] ?? key)}</p>
                  <p class="mt-2 whitespace-pre-wrap break-words text-sm text-ink-200">${escapeHtml(value)}</p>
                </div>
              `,
              )
              .join('')}
          </div>
          ${
            canAct
              ? `
            <form id="review-form" class="mt-6 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="review-notes">Observaciones al postulante</label>
                <textarea id="review-notes" class="form-input min-h-24" maxlength="4000"></textarea>
              </div>
              <div>
                <label class="form-label" for="internal-notes">Notas internas</label>
                <textarea id="internal-notes" class="form-input min-h-24" maxlength="4000"></textarea>
              </div>
              <div class="sm:col-span-2 flex flex-wrap gap-2">
                <button type="button" class="btn-primary" data-review-status="ACCEPTED">Aceptar</button>
                <button type="button" class="btn-secondary" data-review-status="REJECTED">Rechazar</button>
                <button type="button" class="btn-secondary" data-review-status="UNDER_REVIEW">Marcar en revisión</button>
              </div>
            </form>
          `
              : item.reviewNotes
                ? `<p class="mt-4 text-sm text-ink-300">${escapeHtml(item.reviewNotes)}</p>`
                : ''
          }
        `;

        host.querySelectorAll('[data-review-status]').forEach((button) => {
          button.addEventListener('click', async () => {
            try {
              await reviewAcademyApplication(id, {
                status: button.getAttribute('data-review-status'),
                reviewNotes: host.querySelector('#review-notes')?.value.trim() || undefined,
                internalNotes: host.querySelector('#internal-notes')?.value.trim() || undefined,
              });
              setAuthAlert(root, {
                id: 'admin-academy-apps-alert',
                type: 'success',
                message: 'Postulación actualizada.',
              });
              void navigate('/admin/academy/applications', { replace: true });
            } catch (error) {
              showError(root)(error);
            }
          });
        });
      };

      if (detailId) {
        void paintDetail(detailId).catch(showError(root));
      } else {
        void paintList().catch(showError(root));
      }

      return cleanup;
    },
  };
}

function renderApplicationRow(item) {
  const name = `${item.character?.firstName ?? ''} ${item.character?.lastName ?? ''}`.trim();
  const form = item.formData ?? {};
  const summaryKeys = SUMMARY_FIELDS[item.type] ?? Object.keys(form).slice(0, 3);

  return `
    <article class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate text-sm font-semibold text-white">${escapeHtml(name || 'Sin nombre')}</p>
            <span class="rounded-lg bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-300">${TYPE_LABELS[item.type] ?? item.type}</span>
            <span class="rounded-lg bg-brand-500/15 px-2 py-0.5 text-[11px] text-brand-200">${STATUS_LABELS[item.status] ?? item.status}</span>
          </div>
          <p class="mt-1 text-xs text-ink-500">${formatDateTimeLabel(item.createdAt)}</p>
          <dl class="mt-3 grid gap-2 sm:grid-cols-3">
            ${summaryKeys
              .map((key) => {
                const value = form[key];
                if (!value) return '';
                return `
                  <div class="min-w-0 rounded-xl border border-white/5 px-3 py-2">
                    <dt class="text-[11px] uppercase tracking-wide text-ink-500">${escapeHtml(FIELD_LABELS[key] ?? key)}</dt>
                    <dd class="mt-1 line-clamp-2 break-words text-sm text-ink-300">${escapeHtml(value)}</dd>
                  </div>
                `;
              })
              .join('')}
          </dl>
        </div>
        <a data-link href="/admin/academy/applications?id=${item.id}" class="btn-secondary shrink-0 self-start">Ver detalle</a>
      </div>
    </article>
  `;
}

function isLongField(value) {
  return String(value ?? '').length > 120;
}

function showError(root) {
  return (error) => {
    setAuthAlert(root, {
      id: 'admin-academy-apps-alert',
      type: 'error',
      message: getApiErrorMessage(error),
    });
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
