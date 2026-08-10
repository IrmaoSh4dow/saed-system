import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderStatusBadge } from '../components/ui/status-badge.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can, getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  ADMIN_REQUEST_PRIORITY_LABELS,
  ADMIN_REQUEST_STATUS_LABELS,
  ADMIN_REQUEST_TYPE_LABELS,
  addAdminRequestNote,
  assignAdminRequest,
  getAdminRequest,
  getAdminRequestStats,
  listAdminRequests,
  searchAdminRequestAssignees,
  sendAdminRequestMessage,
  updateAdminRequestPriority,
  updateAdminRequestStatus,
} from '../services/admin-requests.service.js';
import {
  appendChatMessage,
  renderChatMessageBubble,
} from '../components/chat/chat-message.js';
import { bindStarRating, renderStarRating } from '../components/ratings/star-rating.js';
import { subscribeCaseRoom } from '../services/room-subscription.js';
import { createStaffRating } from '../services/staff-ratings.service.js';
import { requireActiveCharacter, requireAnyPermission } from '../utils/auth-guard.js';
import { canSendCaseChatMessage, renderClosedChatNotice } from '../utils/case-chat.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { validateImageUploadFile } from '../utils/image-upload.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toneForStatus(status) {
  return (
    {
      PENDING: 'warning',
      UNDER_REVIEW: 'brand',
      IN_PROCESS: 'brand',
      APPROVED: 'success',
      REJECTED: 'danger',
      COMPLETED: 'success',
      CANCELLED: 'muted',
    }[status] ?? 'default'
  );
}

function toneForPriority(priority) {
  return (
    {
      LOW: 'muted',
      MEDIUM: 'default',
      HIGH: 'warning',
      URGENT: 'danger',
    }[priority] ?? 'default'
  );
}

export function adminRequestsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }
  if (
    !requireAnyPermission([
      PERMISSIONS.ADMIN_REQUESTS_READ,
      PERMISSIONS.ADMIN_REQUESTS_CREATE,
      PERMISSIONS.ADMIN_REQUESTS_ASSIGN,
      PERMISSIONS.ADMIN_REQUESTS_MANAGE,
    ])
  ) {
    return { html: '', afterMount: () => {} };
  }

  const canCreate = can(PERMISSIONS.ADMIN_REQUESTS_CREATE);
  const selectedId = new URLSearchParams(window.location.search).get('id');

  const statusFilter = Object.entries(ADMIN_REQUEST_STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
  const typeFilter = Object.entries(ADMIN_REQUEST_TYPE_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');

  const content = `
    <div class="space-y-5">
      ${renderAuthAlert({ id: 'admin-requests-alert' })}
      ${renderPageHeader({
        eyebrow: 'Comunicación institucional',
        title: 'Solicitudes administrativas',
        description:
          'Centro de trámites formales con el Alto Mando: citas, convenios, reuniones y solicitudes comerciales.',
        actionsHtml: canCreate
          ? `<a data-link href="/admin-requests/new" class="btn-primary !py-2.5">Nueva solicitud</a>`
          : '',
      })}

      <div id="admin-requests-summary">
        ${renderSummaryStrip([
          { label: 'Pendientes', value: '—' },
          { label: 'Abiertas', value: '—', tone: 'brand' },
          { label: 'Finalizadas', value: '—', tone: 'warning' },
          { label: 'Convenios', value: '—' },
        ])}
      </div>

      <section class="panel overflow-hidden">
        <div class="grid min-h-[70vh] lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
          <aside class="border-b border-white/8 lg:border-b-0 lg:border-r lg:border-white/8">
            <div class="space-y-3 border-b border-white/8 p-4">
              <input id="ar-search" class="form-input" placeholder="Buscar número, nombre, asunto..." />
              <div class="grid grid-cols-2 gap-2">
                <select id="ar-filter-status" class="form-input !py-2.5 text-xs">
                  <option value="">Estado</option>
                  ${statusFilter}
                </select>
                <select id="ar-filter-type" class="form-input !py-2.5 text-xs">
                  <option value="">Tipo</option>
                  ${typeFilter}
                </select>
              </div>
            </div>
            <div id="ar-list" class="max-h-[60vh] overflow-y-auto lg:max-h-[calc(70vh-7rem)]">
              <p class="p-4 text-sm text-ink-400">Cargando solicitudes...</p>
            </div>
          </aside>

          <div id="ar-detail" class="min-h-[28rem] p-4 md:p-6">
            <div class="flex h-full items-center justify-center">
              ${renderEmptyState({
                title: 'Selecciona una solicitud',
                description: 'Elige un caso del panel izquierdo para ver el chat, el estado y las notas.',
                iconName: 'file',
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Solicitudes administrativas',
      currentPath: '/admin-requests',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Solicitudes administrativas · SAED';
      const { activeCharacter } = getAuthState();
      let items = [];
      let selected = selectedId;
      let detail = null;
      let socketCleanup = null;
      let searchTimer = null;
      let pendingImageDataUrl = null;

      const getFilters = () => ({
        q: root.querySelector('#ar-search')?.value?.trim() || undefined,
        status: root.querySelector('#ar-filter-status')?.value || undefined,
        type: root.querySelector('#ar-filter-type')?.value || undefined,
      });

      const paintSummary = (stats) => {
        const host = root.querySelector('#admin-requests-summary');
        if (!host || !stats) return;
        host.innerHTML = renderSummaryStrip([
          { label: 'Pendientes', value: String(stats.pending ?? 0) },
          { label: 'Abiertas', value: String(stats.open ?? 0), tone: 'brand' },
          { label: 'Finalizadas', value: String(stats.completed ?? 0), tone: 'warning' },
          { label: 'Convenios', value: String(stats.agreements ?? 0) },
        ]);
      };

      const paintList = () => {
        const host = root.querySelector('#ar-list');
        if (!host) return;
        if (!items.length) {
          host.innerHTML = `<p class="p-4 text-sm text-ink-400">No hay solicitudes con estos filtros.</p>`;
          return;
        }

        host.innerHTML = items
          .map((item) => {
            const active = item.id === selected;
            return `
              <button
                type="button"
                data-ar-select="${escapeHtml(item.id)}"
                class="w-full border-b border-white/[0.04] px-4 py-3.5 text-left transition ${
                  active ? 'bg-brand-500/10' : 'hover:bg-white/[0.03]'
                }"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                      #${escapeHtml(item.requestNumber)}
                    </p>
                    <p class="mt-1 truncate text-sm font-semibold text-white">${escapeHtml(item.subject)}</p>
                    <p class="mt-1 truncate text-xs text-ink-400">
                      ${escapeHtml(item.requester?.fullName ?? '—')} · ${escapeHtml(ADMIN_REQUEST_TYPE_LABELS[item.type] ?? item.type)}
                    </p>
                  </div>
                  ${renderStatusBadge({
                    label: ADMIN_REQUEST_STATUS_LABELS[item.status] ?? item.status,
                    tone: toneForStatus(item.status),
                  })}
                </div>
              </button>
            `;
          })
          .join('');

        host.querySelectorAll('[data-ar-select]').forEach((button) => {
          button.addEventListener('click', () => {
            selected = button.getAttribute('data-ar-select');
            const url = new URL(window.location.href);
            url.searchParams.set('id', selected);
            window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
            paintList();
            void loadDetail(selected);
          });
        });
      };

      const paintDetail = () => {
        const host = root.querySelector('#ar-detail');
        if (!host) return;
        if (!detail) {
          host.innerHTML = `<div class="flex h-full items-center justify-center">${renderEmptyState({
            title: 'Selecciona una solicitud',
            description: 'Elige un caso del panel izquierdo.',
            iconName: 'file',
          })}</div>`;
          return;
        }

        const canManage = Boolean(detail.canManage);
        const canSendMessages = canSendCaseChatMessage(detail);
        const statusOptions = Object.entries(ADMIN_REQUEST_STATUS_LABELS)
          .map(
            ([value, label]) =>
              `<option value="${value}" ${value === detail.status ? 'selected' : ''}>${label}</option>`,
          )
          .join('');
        const priorityOptions = Object.entries(ADMIN_REQUEST_PRIORITY_LABELS)
          .map(
            ([value, label]) =>
              `<option value="${value}" ${value === detail.priority ? 'selected' : ''}>${label}</option>`,
          )
          .join('');

        host.innerHTML = `
          <div class="flex h-full flex-col gap-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                    Solicitud #${escapeHtml(detail.requestNumber)}
                  </span>
                  ${renderStatusBadge({
                    label: ADMIN_REQUEST_STATUS_LABELS[detail.status] ?? detail.status,
                    tone: toneForStatus(detail.status),
                  })}
                  ${renderStatusBadge({
                    label: ADMIN_REQUEST_PRIORITY_LABELS[detail.priority] ?? detail.priority,
                    tone: toneForPriority(detail.priority),
                  })}
                </div>
                <h2 class="mt-2 text-xl font-semibold text-white">${escapeHtml(detail.subject)}</h2>
                <p class="mt-1 text-sm text-ink-400">
                  ${escapeHtml(ADMIN_REQUEST_TYPE_LABELS[detail.type] ?? detail.type)}
                  · ${escapeHtml(detail.requester?.fullName ?? '—')}
                  · Actualizada ${escapeHtml(formatDateTimeLabel(detail.updatedAt))}
                </p>
              </div>
            </div>

            <div class="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_20rem]">
              <section class="flex min-h-[22rem] flex-col rounded-2xl border border-white/8 bg-white/[0.02]">
                <div class="border-b border-white/8 px-4 py-3">
                  <h3 class="text-sm font-semibold text-white">Chat</h3>
                </div>
                <div id="ar-chat" class="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  ${(detail.messages ?? []).length
                    ? (detail.messages ?? [])
                        .map((message) =>
                          renderChatMessageBubble(message, {
                            activeCharacterId: activeCharacter?.id,
                          }),
                        )
                        .join('')
                    : `<p data-chat-empty class="text-sm text-ink-400">Aún no hay mensajes.</p>`}
                </div>
                ${
                  canSendMessages
                    ? `
                <form id="ar-chat-form" class="space-y-3 border-t border-white/8 p-4">
                  <div id="ar-image-preview" class="hidden overflow-hidden rounded-xl border border-white/10">
                    <img alt="" class="max-h-40 w-full object-cover" />
                  </div>
                  <textarea id="ar-message-body" class="form-input min-h-[84px]" placeholder="Escribe un mensaje..." maxlength="4000"></textarea>
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <label class="btn-secondary !py-2 !text-xs cursor-pointer">
                      Adjuntar imagen
                      <input id="ar-message-image" type="file" accept=".jpg,.jpeg,.png,.webp,image/*" class="hidden" />
                    </label>
                    <button type="submit" class="btn-primary !py-2 !text-sm">Enviar</button>
                  </div>
                </form>`
                    : `<div class="border-t border-white/8 p-4">${renderClosedChatNotice(
                        'Esta solicitud ha finalizado. Puedes consultar el historial del chat, pero ya no se pueden enviar mensajes.',
                      )}</div>`
                }
              </section>

              <aside class="space-y-4">
                <section class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <h3 class="text-sm font-semibold text-white">Información</h3>
                  <dl class="mt-3 space-y-3 text-sm">
                    <div>
                      <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Motivo</dt>
                      <dd class="mt-1 whitespace-pre-wrap text-ink-200">${escapeHtml(detail.reason)}</dd>
                    </div>
                    <div>
                      <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Responsable</dt>
                      <dd class="mt-1 text-ink-200">${escapeHtml(detail.assignee?.fullName ?? 'Sin asignar')}</dd>
                    </div>
                    <div>
                      <dt class="text-[11px] uppercase tracking-[0.14em] text-ink-500">Creada</dt>
                      <dd class="mt-1 text-ink-200">${escapeHtml(formatDateTimeLabel(detail.createdAt))}</dd>
                    </div>
                  </dl>
                </section>

                ${
                  canManage
                    ? `
                <section class="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <h3 class="text-sm font-semibold text-white">Gestión</h3>
                  <div>
                    <label class="form-label" for="ar-status">Estado</label>
                    <select id="ar-status" class="form-input">${statusOptions}</select>
                  </div>
                  <div>
                    <label class="form-label" for="ar-priority">Prioridad</label>
                    <select id="ar-priority" class="form-input">${priorityOptions}</select>
                  </div>
                  <div>
                    <label class="form-label" for="ar-assignee-q">Asignar a Alto Mando</label>
                    <input id="ar-assignee-q" class="form-input" placeholder="Buscar..." />
                    <div id="ar-assignee-results" class="mt-2 space-y-1"></div>
                  </div>
                </section>

                <section class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <h3 class="text-sm font-semibold text-white">Notas internas</h3>
                  <p class="mt-1 text-xs text-ink-500">Solo visibles para personal autorizado.</p>
                  <div id="ar-notes" class="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    ${(detail.internalNotes ?? [])
                      .map(
                        (note) => `
                      <article class="rounded-xl border border-white/8 bg-surface-950/60 px-3 py-2">
                        <p class="text-[11px] text-ink-500">${escapeHtml(note.author?.fullName ?? '—')} · ${escapeHtml(formatDateTimeLabel(note.createdAt))}</p>
                        <p class="mt-1 whitespace-pre-wrap text-sm text-ink-200">${escapeHtml(note.body)}</p>
                      </article>`,
                      )
                      .join('') || `<p class="text-sm text-ink-400">Sin notas internas.</p>`}
                  </div>
                  <form id="ar-note-form" class="mt-3 space-y-2">
                    <textarea id="ar-note-body" class="form-input min-h-[72px]" placeholder="Añadir nota interna..." maxlength="4000"></textarea>
                    <button type="submit" class="btn-secondary w-full !py-2 !text-sm">Guardar nota</button>
                  </form>
                </section>`
                    : ''
                }

                ${
                  detail.rating?.canRate
                    ? `
                <section class="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                  <h3 class="text-sm font-semibold text-white">Valorar atención</h3>
                  <p class="mt-1 text-xs text-ink-300">
                    Tu cita administrativa finalizó.
                    ${detail.rating.evaluatedStaff ? ` Evalúa a ${escapeHtml(detail.rating.evaluatedStaff.fullName)}.` : ''}
                  </p>
                  <form id="ar-rating-form" class="mt-4 space-y-3">
                    ${renderStarRating({ id: 'ar-rating-score', value: 0, interactive: true, size: 'lg', label: 'Calificación' })}
                    <div>
                      <label class="form-label" for="ar-rating-comment">Comentario (opcional)</label>
                      <textarea id="ar-rating-comment" class="form-input min-h-[84px]" maxlength="2000" placeholder="Cuéntanos cómo fue la atención…"></textarea>
                    </div>
                    <button type="submit" class="btn-primary w-full">Enviar valoración</button>
                  </form>
                </section>`
                    : detail.rating?.existing
                      ? `
                <section class="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <h3 class="text-sm font-semibold text-white">Valoración enviada</h3>
                  <div class="mt-3">${renderStarRating({ value: detail.rating.existing.score, interactive: false, label: '' })}</div>
                  ${
                    detail.rating.existing.comment
                      ? `<p class="mt-3 text-sm text-ink-200">${escapeHtml(detail.rating.existing.comment)}</p>`
                      : ''
                  }
                </section>`
                      : ''
                }

                <section class="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <h3 class="text-sm font-semibold text-white">Historial</h3>
                  <div class="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    ${(detail.events ?? [])
                      .map(
                        (event) => `
                      <article class="rounded-xl border border-white/[0.05] px-3 py-2">
                        <p class="text-[11px] text-ink-500">${escapeHtml(formatDateTimeLabel(event.createdAt))}${event.actor ? ` · ${escapeHtml(event.actor.fullName)}` : ''}</p>
                        <p class="mt-1 text-sm text-ink-200">${escapeHtml(event.message)}</p>
                      </article>`,
                      )
                      .join('') || `<p class="text-sm text-ink-400">Sin eventos.</p>`}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        `;

        bindDetailActions();
        bindStarRating(root, 'ar-rating-score');
        const chat = root.querySelector('#ar-chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
      };

      const bindDetailActions = () => {
        root.querySelector('#ar-rating-form')?.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!detail) return;
          const score = Number(root.querySelector('#ar-rating-score')?.value || 0);
          if (!score) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: 'Selecciona una calificación de 1 a 5 estrellas.'
            });
            return;
          }
          try {
            await createStaffRating({
              adminRequestId: detail.id,
              score,
              comment: root.querySelector('#ar-rating-comment')?.value?.trim() || undefined,
            });
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'success',
              message: 'Valoración registrada. Gracias por tu feedback.'
            });
            await loadDetail(detail.id);
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: getApiErrorMessage(error)
            });
          }
        });

        root.querySelector('#ar-chat-form')?.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!detail) return;
          const body = root.querySelector('#ar-message-body')?.value?.trim() || undefined;
          if (!body && !pendingImageDataUrl) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: 'Escribe un mensaje o adjunta una imagen.'
            });
            return;
          }
          try {
            const message = await sendAdminRequestMessage(detail.id, {
              body,
              imageDataUrl: pendingImageDataUrl || undefined,
            });
            pendingImageDataUrl = null;
            const preview = root.querySelector('#ar-image-preview');
            preview?.classList.add('hidden');
            root.querySelector('#ar-message-body').value = '';
            root.querySelector('#ar-message-image').value = '';
            const chat = root.querySelector('#ar-chat');
            const activeCharacter = getAuthState()?.activeCharacter;
            if (chat && message) {
              appendChatMessage(chat, message, {
                activeCharacterId: activeCharacter?.id,
                forceScroll: true,
              });
            } else {
              await loadDetail(detail.id);
            }
            await loadList(false);
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: getApiErrorMessage(error)
            });
          }
        });

        root.querySelector('#ar-message-image')?.addEventListener('change', async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const validation = validateImageUploadFile(file, { required: true });
          if (!validation.ok) {
            pendingImageDataUrl = null;
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: validation.message,
            });
            return;
          }
          try {
            pendingImageDataUrl = await readFileAsDataUrl(file);
            const preview = root.querySelector('#ar-image-preview');
            const img = preview?.querySelector('img');
            if (preview && img) {
              img.src = pendingImageDataUrl;
              preview.classList.remove('hidden');
            }
          } catch {
            pendingImageDataUrl = null;
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: 'No se pudo cargar la imagen.',
            });
          }
        });

        root.querySelector('#ar-status')?.addEventListener('change', async (event) => {
          if (!detail) return;
          try {
            await updateAdminRequestStatus(detail.id, event.target.value);
            await refreshAll();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        });

        root.querySelector('#ar-priority')?.addEventListener('change', async (event) => {
          if (!detail) return;
          try {
            await updateAdminRequestPriority(detail.id, event.target.value);
            await refreshAll();
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        });

        let assigneeTimer = null;
        root.querySelector('#ar-assignee-q')?.addEventListener('input', (event) => {
          clearTimeout(assigneeTimer);
          const value = event.target.value;
          assigneeTimer = setTimeout(async () => {
            const resultsHost = root.querySelector('#ar-assignee-results');
            if (!resultsHost) return;
            if (value.trim().length < 2) {
              resultsHost.innerHTML = '';
              return;
            }
            try {
              const results = await searchAdminRequestAssignees(value.trim());
              resultsHost.innerHTML = results
                .map(
                  (item) => `
                <button type="button" data-assign="${escapeHtml(item.id)}" class="w-full rounded-xl border border-white/8 px-3 py-2 text-left text-sm text-ink-200 transition hover:border-brand-400/30 hover:bg-brand-500/10">
                  ${escapeHtml(`${item.firstName} ${item.lastName}`)}
                  <span class="block text-xs text-ink-500">${escapeHtml(item.rankLabel ?? 'Alto Mando')}</span>
                </button>`,
                )
                .join('');
              resultsHost.querySelectorAll('[data-assign]').forEach((button) => {
                button.addEventListener('click', async () => {
                  try {
                    await assignAdminRequest(detail.id, button.getAttribute('data-assign'));
                    await refreshAll();
                  } catch (error) {
                    setAuthAlert(root, {
                      id: 'admin-requests-alert',
                      type: 'error',
                      message: getApiErrorMessage(error),
                    });
                  }
                });
              });
            } catch {
              resultsHost.innerHTML = '';
            }
          }, 280);
        });

        root.querySelector('#ar-note-form')?.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!detail) return;
          const body = root.querySelector('#ar-note-body')?.value?.trim();
          if (!body) return;
          try {
            await addAdminRequestNote(detail.id, body);
            await loadDetail(detail.id);
          } catch (error) {
            setAuthAlert(root, {
              id: 'admin-requests-alert',
              type: 'error',
              message: getApiErrorMessage(error),
            });
          }
        });
      };

      const bindSocket = (request) => {
        if (!request) return () => {};
        const room = `admin-request-${request.requestNumber}`;
        const activeCharacter = getAuthState()?.activeCharacter;

        return subscribeCaseRoom({
          joinEvent: 'admin-requests:join',
          leaveEvent: 'admin-requests:leave',
          joinPayload: { room, requestNumber: request.requestNumber },
          events: {
            'admin-requests:message': (payload) => {
              if (payload?.adminRequestId && payload.adminRequestId !== request.id) return;
              const chat = root.querySelector('#ar-chat');
              if (chat && payload?.id) {
                appendChatMessage(chat, payload, {
                  activeCharacterId: activeCharacter?.id,
                });
              } else {
                void loadDetail(request.id);
              }
              void loadList(false);
            },
            'admin-requests:updated': () => {
              void refreshAll();
            },
            'admin-requests:note': () => {
              void loadDetail(request.id);
            },
          },
        });
      };

      const loadDetail = async (id) => {
        if (!id) {
          detail = null;
          paintDetail();
          return;
        }
        try {
          detail = await getAdminRequest(id);
          paintDetail();
          socketCleanup?.();
          socketCleanup = bindSocket(detail);
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-requests-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const loadList = async (autoSelect = true) => {
        try {
          items = await listAdminRequests(getFilters());
          paintList();
          if (autoSelect && !selected && items[0]) {
            selected = items[0].id;
            paintList();
            await loadDetail(selected);
          }
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-requests-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const refreshAll = async () => {
        const [stats] = await Promise.all([
          getAdminRequestStats().catch(() => null),
          loadList(false),
        ]);
        if (stats) paintSummary(stats);
        if (selected) await loadDetail(selected);
      };

      void refreshAll().then(() => {
        if (selected) void loadDetail(selected);
      });

      const reloadFilters = () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => void loadList(false), 220);
      };

      root.querySelector('#ar-search')?.addEventListener('input', reloadFilters);
      root.querySelector('#ar-filter-status')?.addEventListener('change', () => void loadList(false));
      root.querySelector('#ar-filter-type')?.addEventListener('change', () => void loadList(false));

      return () => {
        clearTimeout(searchTimer);
        socketCleanup?.();
        cleanupLayout?.();
      };
    },
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
