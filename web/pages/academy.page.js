import {
  bindTrainingCalendar,
  dateKey,
  renderTrainingCalendar,
} from '../components/academy/training-calendar.js';
import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can, canAny, getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  createAcademyAnnouncement,
  createAcademyTraining,
  getAcademyDashboard,
  getAcademyTraining,
  respondAcademyAttendance,
  searchAcademyOfficers,
  updateAcademyTraining,
} from '../services/academy.service.js';
import { requireActiveCharacter } from '../utils/auth-guard.js';
import { canSubmitAcademyApplication, isCadetCharacter } from '../utils/character.js';
import { formatDateLabel, formatDateTimeLabel } from '../utils/date.js';
import { navigate } from '../utils/router.js';
import { PERMISSIONS } from '../utils/permissions.js';

const ATTENDANCE_LABELS = {
  PENDING: 'Pendiente de confirmar',
  CONFIRMED: 'Asistencia confirmada',
  DECLINED: 'No asistirá',
};

const PRIORITY_LABELS = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const STATUS_LABELS = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export function academyPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!canAny([PERMISSIONS.ACADEMY_READ, PERMISSIONS.ACADEMY_MANAGE, PERMISSIONS.ADMIN_ACCESS])) {
    void navigate('/dashboard', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  const canManage = can(PERMISSIONS.ACADEMY_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS);
  const { activeCharacter } = getAuthState();
  const showApplications = canSubmitAcademyApplication(activeCharacter);
  const isCadet = isCadetCharacter(activeCharacter) && !canManage;
  const trainingId = new URLSearchParams(window.location.search).get('trainingId');

  const content = `
    <div class="space-y-8">
      ${renderAuthAlert({ id: 'academy-alert' })}
      ${renderPageHeader({
        eyebrow: 'Formación médica',
        title: 'Academia SAED',
        description:
          'Centro de entrenamiento: calendario, anuncios, asistencia y seguimiento de cursos.',
        actionsHtml: `
          ${showApplications ? `<a data-link href="/academy/applications" class="btn-secondary !py-2.5">Mis postulaciones</a>` : ''}
          ${canManage ? `<a data-link href="/admin/academy" class="btn-secondary !py-2.5">Administrar</a>` : ''}
        `,
      })}
      <div id="academy-root"><p class="text-sm text-ink-400">Cargando academia...</p></div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Academia', currentPath: '/academy' }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      let calendarCleanup = null;

      const refresh = async () => {
        calendarCleanup?.();
        const data = await getAcademyDashboard();
        if (trainingId) {
          const training = await getAcademyTraining(trainingId);
          paintTrainingDetail(root, training, {
            canManage,
            isCadet: Boolean(data.access?.canRespondAttendance ?? isCadet),
            onReload: refresh,
          });
          return;
        }
        calendarCleanup = paint(root, data, {
          canManage,
          isCadet: Boolean(data.access?.canRespondAttendance ?? isCadet),
          onReload: refresh,
        });
      };

      void refresh().catch((error) => {
        setAuthAlert(root, {
          id: 'academy-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      });

      return () => {
        calendarCleanup?.();
        cleanup?.();
      };
    },
  };
}

function paint(root, data, { canManage, isCadet, onReload }) {
  const host = root.querySelector('#academy-root');
  if (!host) return () => {};

  const announcements = data.announcements ?? [];
  const upcoming = data.upcomingTrainings ?? [];
  const history = data.trainingHistory ?? [];
  const events = data.calendar?.events ?? [];
  const selectedDay = dateKey(new Date());

  const { html: calendarHtml } = renderTrainingCalendar({
    events,
    monthDate: new Date(),
    selectedDate: new Date(),
    canManage,
  });

  host.innerHTML = `
    <section class="grid gap-6 xl:grid-cols-12">
      <article class="panel relative overflow-hidden p-5 md:p-6 xl:col-span-8">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(217,30,30,0.08),_transparent_45%)]"></div>
        <div class="relative" data-calendar-host>${calendarHtml}</div>
      </article>

      <article class="panel flex flex-col gap-5 p-5 md:p-6 xl:col-span-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Comunicados</p>
            <h3 class="mt-1 text-sm font-semibold text-white">Anuncios de academia</h3>
          </div>
          <span class="rounded-full border border-white/10 px-2.5 py-1 text-xs text-ink-300">${announcements.length}</span>
        </div>
        <div class="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
          ${
            announcements.length
              ? announcements
                  .map(
                    (item) => `
                <article class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 transition hover:border-brand-400/20">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-medium text-white">${escapeHtml(item.title)}</p>
                    <span class="rounded-lg bg-brand-500/15 px-2 py-0.5 text-[11px] text-brand-300">${PRIORITY_LABELS[item.priority] ?? item.priority}</span>
                  </div>
                  <p class="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-300">${escapeHtml(item.content)}</p>
                  <p class="mt-3 text-[11px] text-ink-500">
                    ${escapeHtml(item.authorCharacter?.firstName ?? '')} ${escapeHtml(item.authorCharacter?.lastName ?? '')}
                    · ${formatDateTimeLabel(item.publishedAt)}
                  </p>
                </article>
              `,
                  )
                  .join('')
              : `<p class="text-sm text-ink-400">No hay anuncios publicados.</p>`
          }
        </div>
      </article>
    </section>

    <section class="mt-6 grid gap-6 xl:grid-cols-2">
      <article class="panel space-y-5 p-5 md:p-6">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Próximos</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Entrenamientos programados</h3>
        </div>
        <div class="space-y-3">
          ${
            upcoming.length
              ? upcoming.map((item) => renderTrainingSummary(item, { isCadet, canManage })).join('')
              : `<p class="text-sm text-ink-400">No hay entrenamientos programados.</p>`
          }
        </div>
      </article>

      <article class="panel space-y-5 p-5 md:p-6">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Registro</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Historial académico</h3>
        </div>
        <div class="space-y-3">
          ${
            history.length
              ? history
                  .map((item) => {
                    const mine = item.myAttendance;
                    return `
                      <a data-link href="/academy?trainingId=${item.id}" class="record-card group">
                        <div class="record-card-rail record-card-rail-brand"></div>
                        <div class="record-card-body !py-3.5">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <p class="font-medium text-white transition group-hover:text-brand-300">${escapeHtml(item.title)}</p>
                            <span class="text-xs text-ink-500">${isCadet ? ATTENDANCE_LABELS[mine?.status] ?? 'Sin respuesta' : STATUS_LABELS[item.status] ?? item.status}</span>
                          </div>
                          <p class="mt-1 text-xs text-ink-400">${formatDateTimeLabel(item.startsAt)} · ${escapeHtml(item.location)}</p>
                        </div>
                      </a>
                    `;
                  })
                  .join('')
              : `<p class="text-sm text-ink-400">Aún no hay historial.</p>`
          }
        </div>
      </article>
    </section>

    ${
      canManage
        ? `
      <section class="mt-8 grid gap-8 xl:grid-cols-2">
        <article class="panel p-5 md:p-6">
          <h3 class="text-sm font-semibold text-white">Nuevo entrenamiento</h3>
          <form id="training-form" class="mt-5 space-y-4">
            <div>
              <label class="form-label" for="training-title">Título</label>
              <input id="training-title" class="form-input" required maxlength="200" />
            </div>
            <div>
              <label class="form-label" for="training-description">Descripción</label>
              <textarea id="training-description" class="form-input min-h-24" required maxlength="8000"></textarea>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="training-starts">Fecha y hora</label>
                <input id="training-starts" type="datetime-local" class="form-input" required />
              </div>
              <div>
                <label class="form-label" for="training-capacity">Cupo (opcional)</label>
                <input id="training-capacity" type="number" min="1" max="500" class="form-input" />
              </div>
            </div>
            <div>
              <label class="form-label" for="training-location">Lugar</label>
              <input id="training-location" class="form-input" required maxlength="200" value="Academia SAED" />
            </div>
            <div>
              <label class="form-label" for="support-query">Personal de apoyo</label>
              <input id="support-query" class="form-input" placeholder="Buscar por nombre o badge..." autocomplete="off" />
              <div id="support-results" class="mt-2 space-y-2"></div>
              <div id="support-selected" class="mt-3 flex flex-wrap gap-2"></div>
            </div>
            <button type="submit" class="btn-primary">Crear entrenamiento</button>
          </form>
        </article>
        <article class="panel p-5 md:p-6">
          <h3 class="text-sm font-semibold text-white">Nuevo anuncio</h3>
          <form id="announcement-form" class="mt-5 space-y-4">
            <div>
              <label class="form-label" for="announcement-title">Título</label>
              <input id="announcement-title" class="form-input" required maxlength="200" />
            </div>
            <div>
              <label class="form-label" for="announcement-content">Contenido</label>
              <textarea id="announcement-content" class="form-input min-h-28" required maxlength="8000"></textarea>
            </div>
            <div>
              <label class="form-label" for="announcement-priority">Prioridad</label>
              <select id="announcement-priority" class="form-input">
                ${Object.entries(PRIORITY_LABELS)
                  .map(
                    ([value, label]) =>
                      `<option value="${value}" ${value === 'NORMAL' ? 'selected' : ''}>${label}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <div class="mt-6">
              <button type="submit" class="btn-primary">Publicar anuncio</button>
            </div>
          </form>
        </article>
      </section>
    `
        : ''
    }
  `;

  const calendarCleanup = bindTrainingCalendar(host, {
    events,
    canManage,
    initialMonth: new Date(),
    initialSelected: new Date(),
  });

  const selectedSupport = new Map();
  let supportTimer = null;

  const paintSelectedSupport = () => {
    const box = host.querySelector('#support-selected');
    if (!box) return;
    box.innerHTML = [...selectedSupport.values()]
      .map(
        (item) => `
        <span class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-ink-200">
          ${escapeHtml(item.character.firstName)} ${escapeHtml(item.character.lastName)} · ${escapeHtml(item.employeeNumber)}
          <button type="button" class="text-rose-300" data-remove-support="${item.id}">×</button>
        </span>
      `,
      )
      .join('');
    box.querySelectorAll('[data-remove-support]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedSupport.delete(button.getAttribute('data-remove-support'));
        paintSelectedSupport();
      });
    });
  };

  host.querySelector('#support-query')?.addEventListener('input', (event) => {
    clearTimeout(supportTimer);
    supportTimer = setTimeout(async () => {
      const q = event.target.value.trim();
      const results = host.querySelector('#support-results');
      if (!results) return;
      if (q.length < 2) {
        results.innerHTML = '';
        return;
      }
      try {
        const items = await searchAcademyOfficers(q);
        results.innerHTML = items
          .map((item) => {
            const name = `${item.character.firstName} ${item.character.lastName}`;
            return `
              <button type="button" class="block w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm hover:bg-white/[0.04]" data-add-support="${item.id}">
                ${escapeHtml(name)} · ${escapeHtml(item.employeeNumber)}
              </button>
            `;
          })
          .join('');
        results.querySelectorAll('[data-add-support]').forEach((button) => {
          button.addEventListener('click', () => {
            const id = button.getAttribute('data-add-support');
            const officer = items.find((item) => item.id === id);
            if (officer) {
              selectedSupport.set(id, officer);
              paintSelectedSupport();
            }
          });
        });
      } catch (error) {
        results.innerHTML = `<p class="text-xs text-rose-300">${getApiErrorMessage(error)}</p>`;
      }
    }, 250);
  });

  host.querySelectorAll('[data-attendance]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await respondAcademyAttendance(button.getAttribute('data-training'), {
          status: button.getAttribute('data-attendance'),
        });
        setAuthAlert(root, {
          id: 'academy-alert',
          type: 'success',
          message: 'Asistencia actualizada.',
        });
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'academy-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  host.querySelector('#training-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { activeCharacter: actor } = getAuthState();
    try {
      const capacityRaw = host.querySelector('#training-capacity').value;
      const created = await createAcademyTraining({
        title: host.querySelector('#training-title').value.trim(),
        description: host.querySelector('#training-description').value.trim(),
        instructorCharacterId: actor.id,
        startsAt: new Date(host.querySelector('#training-starts').value).toISOString(),
        location: host.querySelector('#training-location').value.trim(),
        capacity: capacityRaw ? Number(capacityRaw) : undefined,
        supportOfficerIds: [...selectedSupport.keys()],
      });
      setAuthAlert(root, {
        id: 'academy-alert',
        type: 'success',
        message: 'Entrenamiento creado.',
      });
      void navigate(`/academy?trainingId=${created.id}`, { replace: true });
    } catch (error) {
      setAuthAlert(root, {
        id: 'academy-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  host.querySelector('#announcement-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await createAcademyAnnouncement({
        title: host.querySelector('#announcement-title').value.trim(),
        content: host.querySelector('#announcement-content').value.trim(),
        priority: host.querySelector('#announcement-priority').value,
      });
      setAuthAlert(root, {
        id: 'academy-alert',
        type: 'success',
        message: 'Anuncio publicado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'academy-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  void selectedDay;
  return calendarCleanup;
}

function paintTrainingDetail(root, training, { canManage, isCadet, onReload }) {
  const host = root.querySelector('#academy-root');
  if (!host || !training) return;

  const instructor = training.instructorCharacter;
  const instructorName = instructor
    ? `${instructor.firstName} ${instructor.lastName}`
    : 'Sin instructor';
  const support = training.supportStaff ?? [];
  const canRespond = Boolean(training.access?.canRespondAttendance ?? isCadet);
  const mine = training.myAttendance;

  host.innerHTML = `
    <section class="space-y-8">
      <div>
        <a data-link href="/academy" class="text-sm font-medium text-brand-300 hover:text-brand-200">← Volver a academia</a>
      </div>

      <article class="panel p-5 md:p-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="landing-eyebrow">Entrenamiento</p>
            <h2 class="mt-1 text-2xl font-semibold text-white">${escapeHtml(training.title)}</h2>
            <p class="mt-2 text-sm text-ink-300">${STATUS_LABELS[training.status] ?? training.status}</p>
          </div>
          ${
            canRespond
              ? `
            <div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" class="btn-primary" data-attendance="CONFIRMED" data-training="${training.id}">Confirmar asistencia</button>
              <button type="button" class="btn-secondary" data-attendance="DECLINED" data-training="${training.id}">No asistir</button>
            </div>
          `
              : ''
          }
        </div>

        <p class="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-200">${escapeHtml(training.description)}</p>

        <dl class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          ${meta('Instructor', instructorName)}
          ${meta('Fecha', formatDateLabel(training.startsAt))}
          ${meta('Hora', formatTime(training.startsAt))}
          ${meta('Lugar', training.location)}
        </dl>

        ${
          mine && canRespond
            ? `<p class="mt-5 text-sm text-brand-200">Tu estado: ${ATTENDANCE_LABELS[mine.status] ?? mine.status}</p>`
            : ''
        }
      </article>

      <section class="grid gap-8 xl:grid-cols-2">
        <article class="panel space-y-4 p-5 md:p-6">
          <h3 class="text-sm font-semibold text-white">Personal de apoyo</h3>
          <div class="space-y-3">
            ${
              support.length
                ? support
                    .map((officer) => {
                      const name = `${officer.character.firstName} ${officer.character.lastName}`;
                      return `
                        <div class="rounded-xl border border-white/10 px-3 py-3 text-sm">
                          <p class="font-medium text-white">${escapeHtml(name)}</p>
                          <p class="mt-1 text-xs text-ink-400">${escapeHtml(officer.employeeNumber)} · ${escapeHtml(officer.rank?.name ?? '—')}</p>
                        </div>
                      `;
                    })
                    .join('')
                : `<p class="text-sm text-ink-400">Sin personal de apoyo asignado.</p>`
            }
          </div>
        </article>

        <article class="panel space-y-4 p-5 md:p-6">
          <h3 class="text-sm font-semibold text-white">Internos inscritos</h3>
          <p class="text-xs text-ink-500">Confirmados: ${training.confirmedCount ?? 0}${training.capacity ? ` / ${training.capacity}` : ''}</p>
          <div class="space-y-2">
            ${
              canManage && training.attendances?.length
                ? training.attendances
                    .map((row) => {
                      const name = `${row.character.firstName} ${row.character.lastName}`;
                      return `
                        <div class="rounded-xl border border-white/10 px-3 py-2 text-sm text-ink-300">
                          ${escapeHtml(name)} · ${ATTENDANCE_LABELS[row.status] ?? row.status}
                        </div>
                      `;
                    })
                    .join('')
                : canManage
                  ? `<p class="text-sm text-ink-400">Nadie ha respondido todavía.</p>`
                  : `<p class="text-sm text-ink-400">El listado completo está disponible para RTD.</p>`
            }
          </div>
        </article>
      </section>

      ${
        canManage
          ? `
        <article class="panel p-5 md:p-6">
          <h3 class="text-sm font-semibold text-white">Editar entrenamiento</h3>
          <form id="edit-training-form" class="mt-5 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="form-label" for="edit-title">Título</label>
              <input id="edit-title" class="form-input" required value="${escapeHtml(training.title)}" />
            </div>
            <div class="sm:col-span-2">
              <label class="form-label" for="edit-description">Descripción</label>
              <textarea id="edit-description" class="form-input min-h-28" required>${escapeHtml(training.description)}</textarea>
            </div>
            <div>
              <label class="form-label" for="edit-location">Lugar</label>
              <input id="edit-location" class="form-input" required value="${escapeHtml(training.location)}" />
            </div>
            <div>
              <label class="form-label" for="edit-status">Estado</label>
              <select id="edit-status" class="form-input">
                ${Object.entries(STATUS_LABELS)
                  .map(
                    ([value, label]) =>
                      `<option value="${value}" ${training.status === value ? 'selected' : ''}>${label}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="form-label" for="edit-support-query">Personal de apoyo</label>
              <input id="edit-support-query" class="form-input" placeholder="Buscar por nombre o badge..." autocomplete="off" />
              <div id="edit-support-results" class="mt-2 space-y-2"></div>
              <div id="edit-support-selected" class="mt-3 flex flex-wrap gap-2"></div>
            </div>
            <div class="sm:col-span-2">
              <button type="submit" class="btn-primary">Guardar cambios</button>
            </div>
          </form>
        </article>
      `
          : ''
      }
    </section>
  `;

  const selectedSupport = new Map(
    (support ?? []).map((item) => [item.id, item]),
  );

  const paintSelected = () => {
    const box = host.querySelector('#edit-support-selected');
    if (!box) return;
    box.innerHTML = [...selectedSupport.values()]
      .map(
        (item) => `
        <span class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-ink-200">
          ${escapeHtml(item.character.firstName)} ${escapeHtml(item.character.lastName)} · ${escapeHtml(item.employeeNumber)}
          <button type="button" class="text-rose-300" data-remove-support="${item.id}">×</button>
        </span>
      `,
      )
      .join('');
    box.querySelectorAll('[data-remove-support]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedSupport.delete(button.getAttribute('data-remove-support'));
        paintSelected();
      });
    });
  };
  paintSelected();

  let timer = null;
  host.querySelector('#edit-support-query')?.addEventListener('input', (event) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = event.target.value.trim();
      const results = host.querySelector('#edit-support-results');
      if (!results) return;
      if (q.length < 2) {
        results.innerHTML = '';
        return;
      }
      try {
        const items = await searchAcademyOfficers(q);
        results.innerHTML = items
          .map((item) => {
            const name = `${item.character.firstName} ${item.character.lastName}`;
            return `
              <button type="button" class="block w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm hover:bg-white/[0.04]" data-add-support="${item.id}">
                ${escapeHtml(name)} · ${escapeHtml(item.employeeNumber)}
              </button>
            `;
          })
          .join('');
        results.querySelectorAll('[data-add-support]').forEach((button) => {
          button.addEventListener('click', () => {
            const id = button.getAttribute('data-add-support');
            const officer = items.find((item) => item.id === id);
            if (officer) {
              selectedSupport.set(id, officer);
              paintSelected();
            }
          });
        });
      } catch (error) {
        results.innerHTML = `<p class="text-xs text-rose-300">${getApiErrorMessage(error)}</p>`;
      }
    }, 250);
  });

  host.querySelectorAll('[data-attendance]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await respondAcademyAttendance(button.getAttribute('data-training'), {
          status: button.getAttribute('data-attendance'),
        });
        setAuthAlert(root, {
          id: 'academy-alert',
          type: 'success',
          message: 'Asistencia actualizada.',
        });
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'academy-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  host.querySelector('#edit-training-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await updateAcademyTraining(training.id, {
        title: host.querySelector('#edit-title').value.trim(),
        description: host.querySelector('#edit-description').value.trim(),
        location: host.querySelector('#edit-location').value.trim(),
        status: host.querySelector('#edit-status').value,
        supportOfficerIds: [...selectedSupport.keys()],
      });
      setAuthAlert(root, {
        id: 'academy-alert',
        type: 'success',
        message: 'Entrenamiento actualizado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'academy-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });
}

function renderTrainingSummary(item, { isCadet, canManage }) {
  const instructor = item.instructorCharacter;
  const instructorName = instructor
    ? `${instructor.firstName} ${instructor.lastName}`
    : 'Sin instructor';
  const mine = item.myAttendance;
  const canRespond = Boolean(item.access?.canRespondAttendance ?? isCadet);

  return `
    <article class="record-card">
      <div class="record-card-rail record-card-rail-brand"></div>
      <div class="record-card-body">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <a data-link href="/academy?trainingId=${item.id}" class="text-sm font-semibold text-white hover:text-brand-300">
              ${escapeHtml(item.title)}
            </a>
            <p class="mt-1 text-xs text-ink-400">${STATUS_LABELS[item.status] ?? item.status} · ${formatDateTimeLabel(item.startsAt)}</p>
            <p class="mt-3 text-xs text-ink-400">Instructor: ${escapeHtml(instructorName)} · ${escapeHtml(item.location)}</p>
            ${
              canRespond && mine
                ? `<p class="mt-2 text-xs text-brand-300">${ATTENDANCE_LABELS[mine.status] ?? mine.status}</p>`
                : ''
            }
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:min-w-[9.5rem]">
            <a data-link href="/academy?trainingId=${item.id}" class="btn-secondary !py-2.5 text-center">${canManage ? 'Gestionar' : 'Ver detalle'}</a>
            ${
              canRespond
                ? `
              <button type="button" class="btn-primary !py-2.5" data-training="${item.id}" data-attendance="CONFIRMED">Confirmar</button>
              <button type="button" class="btn-secondary !py-2.5" data-training="${item.id}" data-attendance="DECLINED">No asistir</button>
            `
                : ''
            }
          </div>
        </div>
      </div>
    </article>
  `;
}

function meta(label, value) {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3">
      <dt class="text-[11px] uppercase tracking-wide text-ink-500">${label}</dt>
      <dd class="mt-1 font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
