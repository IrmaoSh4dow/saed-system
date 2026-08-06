import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { can, getAuthState } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createAcademyAnnouncement,
  createAcademyTraining,
  getAcademyApplication,
  getApplicationStats,
  listAcademyAnnouncements,
  listAcademyApplications,
  listAcademyTrainings,
  reviewAcademyApplication,
  setApplicationIntake,
} from '../../services/academy.service.js';
import { formatDateTimeLabel } from '../../utils/date.js';
import { navigate } from '../../utils/router.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

const TYPE_LABELS = {
  ACADEMY: 'Academia',
  TRANSFER: 'Traslado',
};

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En revisión',
  ACCEPTED: 'Aprobada',
  REJECTED: 'Rechazada',
  WITHDRAWN: 'Cancelada',
};

const FIELD_LABELS = {
  fullName: 'Nombre completo',
  discordUsername: 'Usuario de Discord',
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
  ACADEMY: ['discordUsername', 'motivation', 'availability'],
  TRANSFER: ['discordUsername', 'originDepartment', 'transferReason'],
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
        <p class="text-sm text-ink-300">Administra entrenamientos, anuncios y revisa postulaciones.</p>
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
            <label class="form-label" for="admin-training-location">Ubicación</label>
            <input id="admin-training-location" class="form-input" maxlength="200" />
          </div>
          <button type="submit" class="btn-primary">Crear entrenamiento</button>
        </form>
      </article>
      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Publicar anuncio</h3>
        <form id="admin-announcement-form" class="mt-4 space-y-3">
          <div>
            <label class="form-label" for="admin-announcement-title">Título</label>
            <input id="admin-announcement-title" class="form-input" required maxlength="200" />
          </div>
          <div>
            <label class="form-label" for="admin-announcement-content">Contenido</label>
            <textarea id="admin-announcement-content" class="form-input min-h-24" required></textarea>
          </div>
          <div>
            <label class="form-label" for="admin-announcement-priority">Prioridad</label>
            <select id="admin-announcement-priority" class="form-input">
              <option value="NORMAL">Normal</option>
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
    html: renderAdminShell(content, {
      title: 'Academia',
      currentPath: '/admin/academy',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Academia');

      const refreshSummary = async () => {
        const [trainings, announcements] = await Promise.all([
          listAcademyTrainings().catch(() => []),
          listAcademyAnnouncements().catch(() => []),
        ]);
        const host = root.querySelector('#admin-academy-summary');
        if (host) {
          host.innerHTML = `
            <p>${trainings.length} entrenamientos · ${announcements.length} anuncios</p>
            <p class="mt-2"><a data-link href="/admin/academy/applications" class="text-brand-300 hover:text-brand-200">Ir a postulaciones →</a></p>
          `;
        }
      };

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
            location: root.querySelector('#admin-training-location').value.trim() || undefined,
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

      void refreshSummary().catch(() => {});
      return cleanup;
    },
  };
}

export function adminAcademyApplicationsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const canManageIntake = can(PERMISSIONS.APPLICATIONS_MANAGE) || can('*');
  const canReview = can(PERMISSIONS.ACADEMY_APPLICATIONS) || can(PERMISSIONS.APPLICATIONS_MANAGE) || can('*');
  const detailId = new URLSearchParams(window.location.search).get('id');

  if (!canManageIntake && !canReview) {
    void navigate('/admin', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  const content = `
    ${renderAuthAlert({ id: 'admin-academy-apps-alert' })}
    <div id="admin-apps-root" class="space-y-6">
      <p class="text-sm text-ink-400">Cargando...</p>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Postulaciones',
      currentPath: '/admin/academy/applications',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Postulaciones');
      let typeFilter = '';
      let statusFilter = '';

      const paintHub = async () => {
        const host = root.querySelector('#admin-apps-root');
        if (!host) return;

        let stats = null;
        if (canManageIntake) {
          try {
            stats = await getApplicationStats();
          } catch {
            stats = null;
          }
        }

        const items = canReview
          ? await listAcademyApplications({
              ...(typeFilter ? { type: typeFilter } : {}),
              ...(statusFilter ? { status: statusFilter } : {}),
            })
          : [];

        host.innerHTML = `
          ${
            stats
              ? `
            <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              ${statCard('Convocatorias abiertas', stats.openConvocations, 'success')}
              ${statCard('Convocatorias cerradas', stats.closedConvocations, 'danger')}
              ${statCard('Pendientes', stats.pending, 'warn')}
              ${statCard('En revisión', stats.underReview, 'brand')}
              ${statCard('Aprobadas', stats.accepted, 'success')}
              ${statCard('Rechazadas', stats.rejected, 'danger')}
              ${statCard('Academia', stats.byType?.ACADEMY ?? 0)}
              ${statCard('Traslado', stats.byType?.TRANSFER ?? 0)}
            </section>

            <section class="grid gap-4 lg:grid-cols-2">
              ${(stats.configurations ?? [])
                .map((config) => renderIntakeCard(config, canManageIntake))
                .join('')}
            </section>
          `
              : ''
          }

          ${
            canReview
              ? `
            <section class="panel p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-white">Solicitudes recibidas</h3>
                  <p class="mt-1 text-xs text-ink-400">Nombre, tipo, Discord, fechas y estado.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <select id="apps-type-filter" class="form-input !w-auto !py-2 text-sm">
                    <option value="">Todos los tipos</option>
                    <option value="ACADEMY" ${typeFilter === 'ACADEMY' ? 'selected' : ''}>Academia</option>
                    <option value="TRANSFER" ${typeFilter === 'TRANSFER' ? 'selected' : ''}>Traslado</option>
                  </select>
                  <select id="apps-status-filter" class="form-input !w-auto !py-2 text-sm">
                    <option value="">Todos los estados</option>
                    ${Object.entries(STATUS_LABELS)
                      .map(
                        ([value, label]) =>
                          `<option value="${value}" ${statusFilter === value ? 'selected' : ''}>${label}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
              </div>
              <div class="mt-5 overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                  <thead class="border-b border-white/10 text-[11px] uppercase tracking-wide text-ink-500">
                    <tr>
                      <th class="px-3 py-2 font-medium">Postulante</th>
                      <th class="px-3 py-2 font-medium">Tipo</th>
                      <th class="px-3 py-2 font-medium">Discord</th>
                      <th class="px-3 py-2 font-medium">Creada</th>
                      <th class="px-3 py-2 font-medium">Actualizada</th>
                      <th class="px-3 py-2 font-medium">Estado</th>
                      <th class="px-3 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    ${
                      items.length
                        ? items.map((item) => renderApplicationTableRow(item)).join('')
                        : `<tr><td colspan="7" class="px-3 py-6 text-ink-400">No hay postulaciones.</td></tr>`
                    }
                  </tbody>
                </table>
              </div>
            </section>
          `
              : ''
          }
        `;

        host.querySelectorAll('[data-toggle-intake]').forEach((button) => {
          button.addEventListener('click', async () => {
            const type = button.getAttribute('data-toggle-intake');
            const nextOpen = button.getAttribute('data-open') !== 'true';
            try {
              await setApplicationIntake(type, nextOpen);
              setAuthAlert(root, {
                id: 'admin-academy-apps-alert',
                type: 'success',
                message: nextOpen
                  ? `Convocatoria de ${TYPE_LABELS[type]} abierta.`
                  : `Convocatoria de ${TYPE_LABELS[type]} cerrada.`,
              });
              await paintHub();
            } catch (error) {
              showError(root)(error);
            }
          });
        });

        host.querySelector('#apps-type-filter')?.addEventListener('change', (event) => {
          typeFilter = event.target.value;
          void paintHub().catch(showError(root));
        });
        host.querySelector('#apps-status-filter')?.addEventListener('change', (event) => {
          statusFilter = event.target.value;
          void paintHub().catch(showError(root));
        });
      };

      const paintDetail = async (id) => {
        const item = await getAcademyApplication(id);
        const host = root.querySelector('#admin-apps-root');
        if (!host) return;

        const name = `${item.character?.firstName ?? ''} ${item.character?.lastName ?? ''}`.trim();
        const form = item.formData ?? {};
        const canAct = item.status === 'PENDING' || item.status === 'UNDER_REVIEW';
        const discord = item.discordUsername || form.discordUsername || '—';

        host.innerHTML = `
          <section class="panel p-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <a data-link href="/admin/academy/applications" class="text-sm text-brand-300 hover:text-brand-200">← Volver al listado</a>
                <h3 class="mt-2 text-lg font-semibold text-white">${escapeHtml(name)}</h3>
                <p class="mt-1 text-xs text-ink-400">
                  ${TYPE_LABELS[item.type] ?? item.type} · ${STATUS_LABELS[item.status] ?? item.status} · Discord: ${escapeHtml(discord)}
                </p>
                <p class="mt-1 text-xs text-ink-500">
                  Creada ${formatDateTimeLabel(item.createdAt)} · Actualizada ${formatDateTimeLabel(item.updatedAt)}
                </p>
              </div>
            </div>
            <div class="mt-5 grid gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-brand-400/20 bg-brand-500/5 px-4 py-3">
                <p class="text-[11px] uppercase tracking-wide text-brand-300">Usuario de Discord</p>
                <p class="mt-2 text-sm font-semibold text-white">${escapeHtml(discord)}</p>
              </div>
              ${Object.entries(form)
                .filter(([key]) => key !== 'discordUsername')
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
                  <button type="button" class="btn-primary" data-review-status="ACCEPTED">Aprobar</button>
                  <button type="button" class="btn-secondary" data-review-status="REJECTED">Rechazar</button>
                  <button type="button" class="btn-secondary" data-review-status="UNDER_REVIEW">Marcar en revisión</button>
                </div>
              </form>
            `
                : item.reviewNotes
                  ? `<p class="mt-4 text-sm text-ink-300">${escapeHtml(item.reviewNotes)}</p>`
                  : ''
            }
          </section>
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
        void paintHub().catch(showError(root));
      }

      return cleanup;
    },
  };
}

function renderIntakeCard(config, canManage) {
  const open = Boolean(config.isOpen);
  const actor = open ? config.openedByCharacter : config.closedByCharacter;
  const actorName = actor ? `${actor.firstName} ${actor.lastName}` : '—';
  const when = open ? config.openedAt : config.closedAt;

  return `
    <article class="panel relative overflow-hidden p-5">
      <div class="pointer-events-none absolute inset-0 ${open ? 'bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.14),_transparent_45%)]' : 'bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.12),_transparent_45%)]'}"></div>
      <div class="relative">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.18em] text-ink-500">Convocatoria</p>
            <h3 class="mt-1 text-xl font-semibold text-white">${TYPE_LABELS[config.type] ?? config.type}</h3>
          </div>
          <span class="rounded-full border px-3 py-1 text-xs font-semibold ${open ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-rose-400/30 bg-rose-500/15 text-rose-300'}">
            ${open ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
        <p class="mt-3 text-sm text-ink-300">
          ${open ? 'Los ciudadanos pueden enviar postulaciones de este tipo.' : 'No se aceptan nuevas postulaciones de este tipo.'}
        </p>
        <p class="mt-2 text-xs text-ink-500">
          ${open ? 'Abierta' : 'Cerrada'} por ${escapeHtml(actorName)}
          ${when ? ` · ${formatDateTimeLabel(when)}` : ''}
        </p>
        ${
          canManage
            ? `
              <button
                type="button"
                class="btn-primary mt-5"
                data-toggle-intake="${config.type}"
                data-open="${open}"
              >
                ${open ? 'Cerrar convocatoria' : 'Abrir convocatoria'}
              </button>
            `
            : ''
        }
      </div>
    </article>
  `;
}

function renderApplicationTableRow(item) {
  const name = `${item.character?.firstName ?? ''} ${item.character?.lastName ?? ''}`.trim();
  const discord = item.discordUsername || item.formData?.discordUsername || '—';

  return `
    <tr class="hover:bg-white/[0.02]">
      <td class="px-3 py-3 font-medium text-white">${escapeHtml(name || 'Sin nombre')}</td>
      <td class="px-3 py-3 text-ink-300">${TYPE_LABELS[item.type] ?? item.type}</td>
      <td class="px-3 py-3 text-ink-200">${escapeHtml(discord)}</td>
      <td class="px-3 py-3 text-ink-400">${formatDateTimeLabel(item.createdAt)}</td>
      <td class="px-3 py-3 text-ink-400">${formatDateTimeLabel(item.updatedAt)}</td>
      <td class="px-3 py-3"><span class="rounded-lg bg-white/[0.06] px-2 py-1 text-xs text-ink-200">${STATUS_LABELS[item.status] ?? item.status}</span></td>
      <td class="px-3 py-3 text-right">
        <a data-link href="/admin/academy/applications?id=${item.id}" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver</a>
      </td>
    </tr>
  `;
}

function statCard(label, value, tone = 'default') {
  const color =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'warn'
        ? 'text-amber-300'
        : tone === 'danger'
          ? 'text-rose-300'
          : tone === 'brand'
            ? 'text-brand-300'
            : 'text-white';
  return `
    <article class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <p class="text-[11px] uppercase tracking-wide text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold ${color}">${escapeHtml(String(value ?? 0))}</p>
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
