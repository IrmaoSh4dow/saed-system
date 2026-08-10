import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  addComplaintNote,
  assignComplaintInvestigator,
  getComplaint,
  searchInvestigators,
  sendComplaintMessage,
  updateComplaintStatus,
} from '../services/complaints.service.js';
import { subscribeCaseRoom } from '../services/room-subscription.js';
import { canSendCaseChatMessage, renderClosedChatNotice } from '../utils/case-chat.js';
import { formatDateLabel, formatDateTimeLabel } from '../utils/date.js';
import { requireActiveCharacter } from '../utils/auth-guard.js';
import { getApiBaseUrl } from '../utils/env.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_INVESTIGATION: 'En investigación',
  WAITING_FOR_CITIZEN: 'Esperando ciudadano',
  RESOLVED: 'Resuelta',
  REJECTED: 'Rechazada',
  CLOSED: 'Cerrada',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export function complaintDetailPage(complaintId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'complaint-detail-alert' })}
      <a data-link href="/complaints" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al listado</a>
      <div id="complaint-detail-root">
        <p class="text-sm text-ink-400">Cargando queja...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Queja',
      currentPath: '/complaints',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Queja · SAED';
      const { activeCharacter } = getAuthState();
      let socketCleanup = null;

      const load = async () => {
        try {
          const complaint = await getComplaint(complaintId);
          renderDetail(root, complaint, activeCharacter);
          bindActions(root, complaint, activeCharacter, load);
          socketCleanup?.();
          socketCleanup = bindSocket(complaint, load);
        } catch (error) {
          setAuthAlert(root, {
            id: 'complaint-detail-alert',
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

function renderDetail(root, complaint, activeCharacter) {
  const host = root.querySelector('#complaint-detail-root');
  if (!host) return;

  const officer = complaint.accusedStaff;
  const canManage = Boolean(complaint.canManage);
  const canSendMessages = canSendCaseChatMessage(complaint);
  const canSeeInternal = Boolean(complaint.canSeeInternal);
  const investigator = complaint.investigator;
  const investigatorCard = renderInvestigatorCard(investigator);

  host.innerHTML = `
    <div class="space-y-6">
    <section class="panel p-5 md:p-6 lg:p-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0 flex-1">
          <p class="landing-eyebrow">Caso #${complaint.caseNumber}</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">${escapeHtml(complaint.title)}</h2>
          <p class="mt-2 text-sm text-ink-300">${STATUS_LABELS[complaint.status] ?? complaint.status}</p>
        </div>
        <div class="shrink-0 lg:max-w-xs lg:w-72">
          ${investigatorCard}
        </div>
      </div>

      <p class="mt-6 text-sm leading-relaxed text-ink-200 whitespace-pre-wrap">${escapeHtml(complaint.description)}</p>

      <dl class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${metaCard('Lugar', complaint.location ?? '—')}
        ${metaCard('Incidente', formatDateLabel(complaint.incidentDate))}
        ${metaCard('Quejoso', `${complaint.complainant.firstName} ${complaint.complainant.lastName}`)}
        ${metaCard('Personal', officer ? `${officer.character.firstName} ${officer.character.lastName} · ${officer.employeeNumber}` : '—')}
      </dl>
    </section>

    <section class="grid gap-6 xl:grid-cols-12 xl:items-start">
      <article class="complaint-chat-panel panel flex h-[min(70vh,40rem)] min-h-[28rem] flex-col overflow-hidden p-0 xl:col-span-7">
        <div class="shrink-0 border-b border-white/10 px-5 py-4">
          <h3 class="text-sm font-semibold text-white">Chat</h3>
          <p class="mt-1 text-xs text-ink-500">Sala complaint-${complaint.caseNumber}</p>
        </div>
        <div id="complaint-messages" class="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          ${
            (complaint.messages ?? []).length
              ? (complaint.messages ?? [])
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
        ${
          canSendMessages
            ? `
        <form id="complaint-message-form" class="shrink-0 border-t border-white/10 p-4">
          <div class="flex flex-col gap-2 sm:flex-row">
            <input id="complaint-message-input" class="form-input min-w-0 flex-1" placeholder="Escribe un mensaje..." required maxlength="4000" />
            <button type="submit" class="btn-primary shrink-0">Enviar</button>
          </div>
        </form>`
            : `<div class="shrink-0 border-t border-white/10 p-4">${renderClosedChatNotice(
                'Esta queja ha finalizado. Puedes consultar el historial del chat, pero ya no se pueden enviar mensajes.',
              )}</div>`
        }
      </article>

      <aside class="complaint-side-panel space-y-5 xl:col-span-5 xl:sticky xl:top-6 xl:max-h-[min(70vh,40rem)] xl:overflow-y-auto xl:pr-1">
        <article class="panel p-5">
          <h3 class="text-sm font-semibold text-white">Evidencias</h3>
          <div class="mt-4 space-y-3">
            ${
              (complaint.evidence ?? []).length
                ? (complaint.evidence ?? [])
                    .map((item) => {
                      if (item.type === 'IMAGE') {
                        const src = resolveUploadUrl(item.value);
                        return `
                          <div class="overflow-hidden rounded-xl border border-white/10">
                            <div class="h-36 bg-surface-950">
                              <img src="${src}" alt="${escapeHtml(item.label ?? 'Evidencia')}" class="h-full w-full object-contain" />
                            </div>
                            <p class="px-3 py-2 text-xs text-ink-400">${escapeHtml(item.label ?? 'Imagen')}</p>
                          </div>
                        `;
                      }
                      return `
                        <a href="${escapeHtml(item.value)}" target="_blank" rel="noopener noreferrer" class="block truncate rounded-xl border border-white/10 px-3 py-3 text-sm text-brand-300 hover:text-brand-200">
                          ${escapeHtml(item.label ?? 'Video')} · ${escapeHtml(item.value)}
                        </a>
                      `;
                    })
                    .join('')
                : '<p class="text-sm text-ink-400">Sin evidencias.</p>'
            }
          </div>
        </article>

        <article class="panel p-5">
          <h3 class="text-sm font-semibold text-white">Historial</h3>
          <ul class="mt-4 max-h-44 space-y-2 overflow-y-auto">
            ${
              (complaint.events ?? []).length
                ? (complaint.events ?? [])
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
            <form id="complaint-status-form" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="min-w-0 flex-1">
                <label class="form-label" for="complaint-status">Estado</label>
                <select id="complaint-status" class="form-input">
                  ${STATUS_OPTIONS.map(
                    (status) =>
                      `<option value="${status}" ${complaint.status === status ? 'selected' : ''}>${STATUS_LABELS[status]}</option>`,
                  ).join('')}
                </select>
              </div>
              <button type="submit" class="btn-secondary shrink-0">Actualizar</button>
            </form>

            <div class="mt-5 space-y-3 border-t border-white/10 pt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Asignar investigador</p>
              <button type="button" id="assign-self" class="btn-secondary w-full">Asignarme a mí</button>
              <div>
                <label class="form-label" for="investigator-query">Buscar investigador</label>
                <input id="investigator-query" class="form-input" placeholder="Nombre, apellido o nº de empleado..." autocomplete="off" />
                <input type="hidden" id="assign-character-id" />
                <p id="investigator-picked" class="mt-2 hidden text-sm text-brand-300"></p>
                <div id="investigator-results" class="mt-2 max-h-40 space-y-2 overflow-y-auto"></div>
              </div>
              <button type="button" id="assign-selected" class="btn-primary w-full">Asignar seleccionado</button>
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
            <p class="mt-1 text-xs text-ink-500">Solo visibles para Chief / Internal Affairs / investigadores.</p>
            <div class="mt-4 max-h-40 space-y-3 overflow-y-auto">
              ${
                (complaint.internalNotes ?? []).length
                  ? (complaint.internalNotes ?? [])
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
            <form id="complaint-note-form" class="mt-4 space-y-3">
              <textarea id="complaint-note-input" class="form-input min-h-[80px]" required maxlength="4000"></textarea>
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
}

function renderInvestigatorCard(investigator) {
  if (!investigator) {
    return `
      <div class="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3">
        <p class="text-[11px] uppercase tracking-wide text-ink-500">Investigador asignado</p>
        <p class="mt-1 text-sm font-medium text-ink-300">Sin asignar</p>
      </div>
    `;
  }

  const avatar = resolveUploadUrl(investigator.avatarUrl);
  const initials =
    `${investigator.firstName?.[0] ?? ''}${investigator.lastName?.[0] ?? ''}`.toUpperCase();

  return `
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p class="text-[11px] uppercase tracking-wide text-ink-500">Investigador asignado</p>
      <div class="mt-2 flex items-center gap-3">
        <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-950">
          ${
            avatar
              ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
              : `<div class="flex h-full w-full items-center justify-center text-xs font-semibold text-ink-300">${initials}</div>`
          }
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-white">${escapeHtml(investigator.firstName)} ${escapeHtml(investigator.lastName)}</p>
          <p class="truncate text-xs text-ink-400">
            ${investigator.employeeNumber ? `Nº ${escapeHtml(investigator.employeeNumber)}` : 'Sin nº de empleado'}
            ${investigator.departmentName ? ` · ${escapeHtml(investigator.departmentName)}` : ''}
          </p>
        </div>
      </div>
    </div>
  `;
}

function bindActions(root, complaint, activeCharacter, reload) {
  let searchTimer = null;

  root.querySelector('#complaint-message-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = root.querySelector('#complaint-message-input');
    try {
      await sendComplaintMessage(complaint.id, input.value.trim());
      input.value = '';
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#complaint-status-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await updateComplaintStatus(complaint.id, root.querySelector('#complaint-status').value);
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#assign-self')?.addEventListener('click', async () => {
    try {
      await assignComplaintInvestigator(complaint.id, {
        characterId: activeCharacter.id,
        isPrimary: true,
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  const runInvestigatorSearch = async () => {
    const query = root.querySelector('#investigator-query')?.value?.trim() ?? '';
    const host = root.querySelector('#investigator-results');
    if (!host) return;
    if (query.length < 2) {
      host.innerHTML = '';
      return;
    }
    try {
      const results = await searchInvestigators(query);
      host.innerHTML = results.length
        ? results
            .map((item) => {
              const avatar = resolveUploadUrl(item.avatarUrl);
              return `
                <button type="button" class="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/[0.04]"
                  data-pick-investigator="${item.id}"
                  data-pick-name="${item.firstName} ${item.lastName}"
                  data-pick-meta="${item.employeeNumber ? `Nº ${item.employeeNumber}` : ''}${item.departmentName ? ` · ${item.departmentName}` : ''}">
                  <div class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-950">
                    ${
                      avatar
                        ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
                        : ''
                    }
                  </div>
                  <span class="min-w-0">
                    <span class="block truncate text-sm text-white">${item.firstName} ${item.lastName}</span>
                    <span class="block truncate text-xs text-ink-400">${item.employeeNumber ?? '—'} · ${item.departmentName ?? item.roles?.[0] ?? '—'}</span>
                  </span>
                </button>
              `;
            })
            .join('')
        : `<p class="text-xs text-ink-500">Sin resultados elegibles.</p>`;
    } catch (error) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  };

  root.querySelector('#investigator-query')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => void runInvestigatorSearch(), 280);
  });

  root.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-pick-investigator]');
    if (!pick) return;
    root.querySelector('#assign-character-id').value = pick.getAttribute('data-pick-investigator');
    const picked = root.querySelector('#investigator-picked');
    picked.classList.remove('hidden');
    picked.textContent = `Seleccionado: ${pick.getAttribute('data-pick-name')} ${pick.getAttribute('data-pick-meta') || ''}`;
    root.querySelector('#investigator-results').innerHTML = '';
  });

  root.querySelector('#assign-selected')?.addEventListener('click', async () => {
    const characterId = root.querySelector('#assign-character-id')?.value?.trim();
    if (!characterId) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: 'Selecciona un investigador de los resultados.',
      });
      return;
    }
    try {
      await assignComplaintInvestigator(complaint.id, {
        characterId,
        isPrimary: true,
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#complaint-note-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = root.querySelector('#complaint-note-input');
    try {
      await addComplaintNote(complaint.id, input.value.trim());
      input.value = '';
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'complaint-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });
}

function bindSocket(complaint, reload) {
  const room = complaint.room ?? `complaint-${complaint.caseNumber}`;
  return subscribeCaseRoom({
    joinEvent: 'complaints:join',
    leaveEvent: 'complaints:leave',
    joinPayload: { room, caseNumber: complaint.caseNumber },
    events: {
      'complaints:message': (payload) => {
        if (payload?.complaintId && payload.complaintId !== complaint.id) return;
        void reload();
      },
      'complaints:updated': () => {
        void reload();
      },
      'complaints:note': () => {
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
