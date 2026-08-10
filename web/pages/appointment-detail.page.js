import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from '../components/appointments/appointment-card.js';
import { bindStarRating, renderStarRating } from '../components/ratings/star-rating.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  addAppointmentNote,
  assignAppointmentStaff,
  getAppointment,
  listAppointmentDepartments,
  searchAppointmentStaff,
  sendAppointmentMessage,
  transferAppointmentDepartment,
  updateAppointmentStatus,
} from '../services/appointments.service.js';
import { createStaffRating } from '../services/staff-ratings.service.js';
import { subscribeCaseRoom } from '../services/room-subscription.js';
import { formatDateLabel, formatDateTimeLabel } from '../utils/date.js';
import { requireActiveCharacter } from '../utils/auth-guard.js';
import { getApiBaseUrl } from '../utils/env.js';

const STATUS_OPTIONS = Object.keys(APPOINTMENT_STATUS_LABELS);

export function appointmentDetailPage(appointmentId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'appointment-detail-alert' })}
      <a data-link href="/appointments" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al listado</a>
      <div id="appointment-detail-root">
        <p class="text-sm text-ink-400">Cargando cita...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Cita',
      currentPath: '/appointments',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Cita · SAED';
      const { activeCharacter } = getAuthState();
      let socketCleanup = null;

      const load = async () => {
        try {
          const appointment = await getAppointment(appointmentId);
          renderDetail(root, appointment, activeCharacter);
          bindActions(root, appointment, activeCharacter, load);
          socketCleanup?.();
          socketCleanup = bindSocket(appointment, load);
        } catch (error) {
          setAuthAlert(root, {
            id: 'appointment-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      void load();

      return () => {
        cleanupLayout?.();
        socketCleanup?.();
      };
    },
  };
}

function renderDetail(root, appointment, activeCharacter) {
  const host = root.querySelector('#appointment-detail-root');
  if (!host) return;

  const canManage = Boolean(appointment.canManage);
  const canSeeInternal = Boolean(appointment.canSeeInternal);
  const assignee = appointment.assignee;
  const assigneeCard = renderAssigneeCard(assignee);

  host.innerHTML = `
    <div class="space-y-6">
    <section class="panel p-5 md:p-6 lg:p-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 flex-1">
          <p class="landing-eyebrow">Cita #${appointment.caseNumber} · ${escapeHtml(APPOINTMENT_TYPE_LABELS[appointment.type] ?? appointment.type)}</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">${escapeHtml(appointment.title)}</h2>
          <p class="mt-2 text-sm text-ink-300">${APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}</p>
        </div>
        <div class="shrink-0 lg:max-w-xs lg:w-72">
          ${assigneeCard}
        </div>
      </div>

      <p class="mt-6 text-sm leading-relaxed text-ink-200 whitespace-pre-wrap">${escapeHtml(appointment.description)}</p>

      <dl class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${metaCard('Fecha preferida', formatDateLabel(appointment.preferredDate))}
        ${metaCard('Fecha programada', appointment.scheduledAt ? formatDateTimeLabel(appointment.scheduledAt) : '—')}
        ${metaCard('Solicitante', `${appointment.requester.firstName} ${appointment.requester.lastName}`)}
        ${metaCard('Departamento', appointment.department?.name ?? 'Sin asignar')}
      </dl>
    </section>

    <section class="grid gap-6 xl:grid-cols-12 xl:items-start">
      <article class="complaint-chat-panel panel flex h-[min(70vh,40rem)] min-h-[28rem] flex-col overflow-hidden p-0 xl:col-span-7">
        <div class="shrink-0 border-b border-white/10 px-5 py-4">
          <h3 class="text-sm font-semibold text-white">Chat</h3>
          <p class="mt-1 text-xs text-ink-500">Sala appointment-${appointment.caseNumber}</p>
        </div>
        <div id="appointment-messages" class="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          ${
            (appointment.messages ?? []).length
              ? (appointment.messages ?? [])
                  .map((message) => {
                    const mine = message.authorId === activeCharacter.id;
                    return `
                      <div class="flex ${mine ? 'justify-end' : 'justify-start'}">
                        <div class="max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                          mine
                            ? 'bg-brand-500/20 text-white'
                            : 'border border-white/10 bg-white/[0.03] text-ink-100'
                        }">
                          <p class="text-[11px] ${mine ? 'text-brand-200' : 'text-ink-500'}">
                            ${escapeHtml(message.author.firstName)} ${escapeHtml(message.author.lastName)} · ${formatDateTimeLabel(message.createdAt)}
                          </p>
                          <p class="mt-1 text-sm whitespace-pre-wrap">${escapeHtml(message.body)}</p>
                        </div>
                      </div>
                    `;
                  })
                  .join('')
              : '<p class="text-sm text-ink-400">Sin mensajes aún. Inicia la conversación.</p>'
          }
        </div>
        <form id="appointment-message-form" class="shrink-0 border-t border-white/10 p-4">
          <div class="flex flex-col gap-2 sm:flex-row">
            <input id="appointment-message-input" class="form-input min-w-0 flex-1" placeholder="Escribe un mensaje..." required maxlength="4000" />
            <button type="submit" class="btn-primary shrink-0">Enviar</button>
          </div>
        </form>
      </article>

      <aside class="complaint-side-panel space-y-5 xl:col-span-5 xl:sticky xl:top-6 xl:max-h-[min(70vh,40rem)] xl:overflow-y-auto xl:pr-1">
        ${renderRatingPanel(appointment)}
        <article class="panel p-5">
          <h3 class="text-sm font-semibold text-white">Historial</h3>
          <ul class="mt-4 max-h-44 space-y-2 overflow-y-auto">
            ${
              (appointment.events ?? []).length
                ? (appointment.events ?? [])
                    .map(
                      (event) => `
                        <li class="rounded-lg border border-white/5 px-3 py-2 text-xs text-ink-300">
                          <span class="text-ink-500">${formatDateTimeLabel(event.createdAt)}</span>
                          · ${escapeHtml(event.message)}
                        </li>
                      `,
                    )
                    .join('')
                : '<li class="text-sm text-ink-400">Sin eventos.</li>'
            }
          </ul>
        </article>

        ${
          canManage
            ? `
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Gestión</h3>
            <form id="appointment-status-form" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="min-w-0 flex-1">
                <label class="form-label" for="appointment-status">Estado</label>
                <select id="appointment-status" class="form-input">
                  ${STATUS_OPTIONS.map(
                    (status) =>
                      `<option value="${status}" ${appointment.status === status ? 'selected' : ''}>${APPOINTMENT_STATUS_LABELS[status]}</option>`,
                  ).join('')}
                </select>
              </div>
              <button type="submit" class="btn-secondary shrink-0">Actualizar</button>
            </form>

            <div class="mt-5 space-y-3 border-t border-white/10 pt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Asignar personal</p>
              <button type="button" id="assign-self" class="btn-secondary w-full">Asignarme a mí</button>
              <div>
                <label class="form-label" for="staff-query">Buscar personal</label>
                <input id="staff-query" class="form-input" placeholder="Nombre, apellido o nº de empleado..." autocomplete="off" />
                <input type="hidden" id="assign-character-id" />
                <p id="staff-picked" class="mt-2 hidden text-sm text-brand-300"></p>
                <div id="staff-results" class="mt-2 max-h-40 space-y-2 overflow-y-auto"></div>
              </div>
              <button type="button" id="assign-selected" class="btn-primary w-full">Asignar seleccionado</button>
            </div>

            <div class="mt-5 space-y-3 border-t border-white/10 pt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Derivar departamento</p>
              <div>
                <label class="form-label" for="transfer-department">Departamento</label>
                <select id="transfer-department" class="form-input">
                  <option value="">Selecciona un departamento...</option>
                </select>
              </div>
              <button type="button" id="transfer-selected" class="btn-secondary w-full">Derivar</button>
            </div>
          </article>
        `
            : ''
        }

        ${
          canSeeInternal
            ? `
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Notas internas</h3>
            <p class="mt-1 text-xs text-ink-500">Solo visibles para gestión / personal asignado.</p>
            <div class="mt-4 max-h-40 space-y-3 overflow-y-auto">
              ${
                (appointment.internalNotes ?? []).length
                  ? (appointment.internalNotes ?? [])
                      .map(
                        (note) => `
                          <div class="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                            <p class="text-xs text-ink-500">${escapeHtml(note.author.firstName)} ${escapeHtml(note.author.lastName)} · ${formatDateTimeLabel(note.createdAt)}</p>
                            <p class="mt-1 text-sm text-ink-100 whitespace-pre-wrap">${escapeHtml(note.body)}</p>
                          </div>
                        `,
                      )
                      .join('')
                  : '<p class="text-sm text-ink-400">Sin notas.</p>'
              }
            </div>
            <form id="appointment-note-form" class="mt-4 space-y-3">
              <textarea id="appointment-note-input" class="form-input min-h-[80px]" required maxlength="4000"></textarea>
              <button type="submit" class="btn-secondary">Añadir nota</button>
            </form>
          </article>
        `
            : ''
        }
      </aside>
    </section>
    </div>
  `;

  if (canManage) {
    void populateDepartments(root);
  }
  bindStarRating(root, 'appointment-rating-score');
}

function renderRatingPanel(appointment) {
  const rating = appointment.rating;
  if (!rating) {
    return '';
  }

  if (rating.canRate) {
    return `
      <article class="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
        <h3 class="text-sm font-semibold text-white">Valorar atención</h3>
        <p class="mt-1 text-xs text-ink-300">
          Tu cita fue finalizada.
          ${rating.evaluatedStaff ? ` Evalúa a ${escapeHtml(rating.evaluatedStaff.fullName)}.` : ''}
        </p>
        <form id="appointment-rating-form" class="mt-4 space-y-3">
          ${renderStarRating({ id: 'appointment-rating-score', value: 0, interactive: true, size: 'lg', label: 'Calificación' })}
          <div>
            <label class="form-label" for="appointment-rating-comment">Comentario (opcional)</label>
            <textarea id="appointment-rating-comment" class="form-input min-h-[84px]" maxlength="2000" placeholder="Cuéntanos cómo fue la atención…"></textarea>
          </div>
          <button type="submit" class="btn-primary w-full">Enviar valoración</button>
        </form>
      </article>
    `;
  }

  if (rating.existing) {
    return `
      <article class="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
        <h3 class="text-sm font-semibold text-white">Valoración enviada</h3>
        <div class="mt-3">${renderStarRating({ value: rating.existing.score, interactive: false, label: '' })}</div>
        ${
          rating.existing.comment
            ? `<p class="mt-3 text-sm text-ink-200">${escapeHtml(rating.existing.comment)}</p>`
            : ''
        }
      </article>
    `;
  }

  return '';
}

function renderAssigneeCard(assignee) {
  if (!assignee) {
    return `
      <div class="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3">
        <p class="text-[11px] uppercase tracking-wide text-ink-500">Personal asignado</p>
        <p class="mt-1 text-sm font-medium text-ink-300">Sin asignar</p>
      </div>
    `;
  }

  const avatar = resolveUploadUrl(assignee.avatarUrl);
  const initials = `${assignee.firstName?.[0] ?? ''}${assignee.lastName?.[0] ?? ''}`.toUpperCase();

  return `
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p class="text-[11px] uppercase tracking-wide text-ink-500">Personal asignado</p>
      <div class="mt-2 flex items-center gap-3">
        <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-950">
          ${
            avatar
              ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
              : `<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-ink-300">${initials}</div>`
          }
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-white">${escapeHtml(assignee.firstName)} ${escapeHtml(assignee.lastName)}</p>
          <p class="truncate text-xs text-ink-400">
            ${assignee.employeeNumber ? `Nº ${escapeHtml(assignee.employeeNumber)}` : 'Sin nº de empleado'}
            ${assignee.departmentName ? ` · ${escapeHtml(assignee.departmentName)}` : ''}
          </p>
        </div>
      </div>
    </div>
  `;
}

async function populateDepartments(root) {
  const select = root.querySelector('#transfer-department');
  if (!select) return;
  try {
    const departments = await listAppointmentDepartments();
    select.innerHTML =
      '<option value="">Selecciona un departamento...</option>' +
      departments.map((dept) => `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`).join('');
  } catch {
    // Silent: transfer panel simply stays with the default option.
  }
}

function bindActions(root, appointment, activeCharacter, reload) {
  let searchTimer = null;

  root.querySelector('#appointment-rating-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const score = Number(root.querySelector('#appointment-rating-score')?.value || 0);
    if (!score) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: 'Selecciona una calificación de 1 a 5 estrellas.',
      });
      return;
    }
    try {
      await createStaffRating({
        appointmentId: appointment.id,
        score,
        comment: root.querySelector('#appointment-rating-comment')?.value?.trim() || undefined,
      });
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'success',
        message: 'Valoración registrada. Gracias por tu feedback.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#appointment-message-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = root.querySelector('#appointment-message-input');
    try {
      await sendAppointmentMessage(appointment.id, input.value.trim());
      input.value = '';
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#appointment-status-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await updateAppointmentStatus(appointment.id, {
        status: root.querySelector('#appointment-status').value,
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#assign-self')?.addEventListener('click', async () => {
    try {
      await assignAppointmentStaff(appointment.id, {
        characterId: activeCharacter.id,
        isPrimary: true,
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  const runStaffSearch = async () => {
    const query = root.querySelector('#staff-query')?.value?.trim() ?? '';
    const host = root.querySelector('#staff-results');
    if (!host) return;
    if (query.length < 2) {
      host.innerHTML = '';
      return;
    }
    try {
      const results = await searchAppointmentStaff(query);
      host.innerHTML = results.length
        ? results
            .map((item) => {
              const avatar = resolveUploadUrl(item.character.avatarUrl);
              return `
                <button type="button" class="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/[0.04]"
                  data-pick-staff="${item.character.id}"
                  data-pick-name="${item.character.firstName} ${item.character.lastName}"
                  data-pick-meta="Nº ${item.employeeNumber}${item.department?.name ? ` · ${item.department.name}` : ''}">
                  <div class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-950">
                    ${avatar ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />` : ''}
                  </div>
                  <span class="min-w-0">
                    <span class="block truncate text-sm text-white">${item.character.firstName} ${item.character.lastName}</span>
                    <span class="block truncate text-xs text-ink-400">Nº ${item.employeeNumber} · ${item.department?.name ?? 'Sin departamento'}</span>
                  </span>
                </button>
              `;
            })
            .join('')
        : `<p class="text-xs text-ink-500">Sin resultados.</p>`;
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  };

  root.querySelector('#staff-query')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => void runStaffSearch(), 280);
  });

  root.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-pick-staff]');
    if (!pick) return;
    root.querySelector('#assign-character-id').value = pick.getAttribute('data-pick-staff');
    const picked = root.querySelector('#staff-picked');
    picked.classList.remove('hidden');
    picked.textContent = `Seleccionado: ${pick.getAttribute('data-pick-name')} ${pick.getAttribute('data-pick-meta') || ''}`;
    root.querySelector('#staff-results').innerHTML = '';
  });

  root.querySelector('#assign-selected')?.addEventListener('click', async () => {
    const characterId = root.querySelector('#assign-character-id')?.value?.trim();
    if (!characterId) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: 'Selecciona personal de los resultados.',
      });
      return;
    }
    try {
      await assignAppointmentStaff(appointment.id, {
        characterId,
        isPrimary: true,
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#transfer-selected')?.addEventListener('click', async () => {
    const departmentId = root.querySelector('#transfer-department')?.value;
    if (!departmentId) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: 'Selecciona un departamento destino.',
      });
      return;
    }
    try {
      await transferAppointmentDepartment(appointment.id, { departmentId });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#appointment-note-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = root.querySelector('#appointment-note-input');
    try {
      await addAppointmentNote(appointment.id, input.value.trim());
      input.value = '';
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'appointment-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });
}

function bindSocket(appointment, reload) {
  const room = appointment.room ?? `appointment-${appointment.caseNumber}`;
  return subscribeCaseRoom({
    joinEvent: 'appointments:join',
    leaveEvent: 'appointments:leave',
    joinPayload: { room, caseNumber: appointment.caseNumber },
    events: {
      'appointments:message': (payload) => {
        if (payload?.appointmentId && payload.appointmentId !== appointment.id) return;
        void reload();
      },
      'appointments:updated': () => {
        void reload();
      },
      'appointments:note': () => {
        void reload();
      },
    },
  });
}

function metaCard(label, value) {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <dt class="text-[11px] uppercase tracking-wide text-ink-500">${label}</dt>
      <dd class="mt-0.5 text-sm font-medium text-white break-words">${escapeHtml(String(value))}</dd>
    </div>
  `;
}

function resolveUploadUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) {
    return `${getApiBaseUrl().replace(/\/api\/v1\/?$/, '')}${url}`;
  }
  return url;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
