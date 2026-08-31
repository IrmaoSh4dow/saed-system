import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  createEventParticipation,
  listEventParticipations,
} from '../services/event-participations.service.js';
import { listOfficers } from '../services/staff.service.js';
import { formatDateShort, formatDateTimeLabel } from '../utils/date.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function staffFullName(officer) {
  return `${officer.character?.firstName ?? ''} ${officer.character?.lastName ?? ''}`.trim();
}

export function eventParticipationsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.EVENT_PARTICIPATIONS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const canCreate = can(PERMISSIONS.EVENT_PARTICIPATIONS_CREATE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'events-alert' })}
      ${renderPageHeader({
        eyebrow: 'Operaciones',
        title: 'Participación de Eventos',
        description:
          'Registra la plantilla institucional cuando el SAED asiste a un evento: fecha, organizadores, autorización y personal participante.',
      })}

      ${
        canCreate
          ? `
      <section class="panel p-6 md:p-8">
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Nueva plantilla</p>
        <h3 class="mt-1 text-lg font-semibold text-white">Registrar participación</h3>
        <form id="event-form" class="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label class="form-label" for="event-date">Día del evento</label>
            <input id="event-date" type="date" class="form-input" required />
          </div>
          <div>
            <label class="form-label" for="event-organizers">Organizadores del evento</label>
            <input id="event-organizers" class="form-input" required maxlength="240" placeholder="Los Santos Customs - Astro Monkey" />
          </div>
          <div class="md:col-span-2">
            <label class="form-label" for="event-payer">Persona encargada de abonar al SAED el evento</label>
            <input id="event-payer" class="form-input" required maxlength="160" placeholder="Nombre y apellido" />
            <p class="form-hint">Nombre y apellido de quien abonará el evento al SAED.</p>
          </div>
          <div>
            <label class="form-label" for="event-authorizer">Alto mando que autorizó ir al evento</label>
            <input id="event-authorizer" class="form-input" list="event-staff-list" required maxlength="160" placeholder="Grant Mercer" />
          </div>
          <div>
            <label class="form-label" for="event-lead">Encargado del SAED del evento</label>
            <input id="event-lead" class="form-input" list="event-staff-list" required maxlength="160" placeholder="Grant Mercer" />
          </div>
          <div class="md:col-span-2">
            <label class="form-label" for="event-participant-input">SAED participantes en dicho evento</label>
            <div class="flex flex-col gap-3 sm:flex-row">
              <input id="event-participant-input" class="form-input" list="event-staff-list" maxlength="160" placeholder="Nombre y apellido" />
              <button type="button" id="event-add-participant" class="btn-secondary shrink-0">Añadir</button>
            </div>
            <p class="form-hint">Añade cada participante. Puedes escribir el nombre o elegir del directorio SAED.</p>
            <div id="event-participant-chips" class="mt-3 flex flex-wrap gap-2"></div>
          </div>
          <datalist id="event-staff-list"></datalist>
          <div class="md:col-span-2">
            <button type="submit" id="event-submit" class="btn-primary">Registrar y enviar a Discord</button>
          </div>
        </form>
      </section>
      `
          : ''
      }

      <section class="panel overflow-hidden">
        <div class="border-b border-white/8 px-5 py-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Historial</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Participaciones registradas</h3>
        </div>
        <div id="events-list" class="p-4 md:p-5">
          <p class="text-sm text-ink-400">Cargando registros...</p>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Participación de Eventos',
      currentPath: '/event-participations',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Participación de Eventos · SAED';

      const participants = [];
      const chips = root.querySelector('#event-participant-chips');
      const participantInput = root.querySelector('#event-participant-input');
      const staffList = root.querySelector('#event-staff-list');
      let staffDirectory = [];

      const paintChips = () => {
        if (!chips) return;
        if (!participants.length) {
          chips.innerHTML = `<p class="text-xs text-ink-500">Todavía no hay participantes añadidos.</p>`;
          return;
        }
        chips.innerHTML = participants
          .map(
            (item, index) => `
              <button type="button" data-remove-participant="${index}" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-100 transition hover:border-rose-400/40 hover:text-white">
                ${escapeHtml(item.fullName)}
                <span class="text-ink-500">×</span>
              </button>
            `,
          )
          .join('');
      };

      const addParticipant = (fullName, characterId = null) => {
        const name = String(fullName ?? '').trim();
        if (!name) return;
        const exists = participants.some(
          (item) =>
            item.fullName.toLowerCase() === name.toLowerCase() &&
            (item.characterId ?? null) === (characterId ?? null),
        );
        if (exists) return;
        const match = staffDirectory.find((officer) => staffFullName(officer) === name);
        participants.push({
          fullName: name,
          characterId: characterId || match?.character?.id || null,
        });
        paintChips();
        if (participantInput) participantInput.value = '';
      };

      paintChips();

      void listOfficers()
        .then((officers) => {
          staffDirectory = Array.isArray(officers) ? officers : [];
          if (staffList) {
            staffList.innerHTML = staffDirectory
              .map((officer) => `<option value="${escapeHtml(staffFullName(officer))}"></option>`)
              .join('');
          }
        })
        .catch(() => {
          staffDirectory = [];
        });

      const loadList = async () => {
        const host = root.querySelector('#events-list');
        try {
          const result = await listEventParticipations({ limit: 40 });
          const items = result.items ?? [];
          if (!items.length) {
            host.innerHTML = renderEmptyState({
              title: 'Sin participaciones',
              description: 'Cuando registres un evento, aparecerá aquí con el mismo formato de la plantilla.',
              iconName: 'calendar',
            });
            return;
          }
          host.innerHTML = `
            <div class="space-y-4">
              ${items.map((item) => renderEventCard(item)).join('')}
            </div>
          `;
        } catch (error) {
          setAuthAlert(root, {
            id: 'events-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudieron cargar las participaciones.'),
          });
        }
      };

      root.querySelector('#event-add-participant')?.addEventListener('click', () => {
        addParticipant(participantInput?.value);
      });

      participantInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addParticipant(participantInput.value);
        }
      });

      chips?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-participant]');
        if (!button) return;
        const index = Number.parseInt(button.dataset.removeParticipant, 10);
        if (!Number.isFinite(index)) return;
        participants.splice(index, 1);
        paintChips();
      });

      root.querySelector('#event-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submit = root.querySelector('#event-submit');
        if (participantInput?.value.trim()) {
          addParticipant(participantInput.value);
        }
        if (!participants.length) {
          setAuthAlert(root, {
            id: 'events-alert',
            type: 'error',
            message: 'Añade al menos un participante del SAED.',
          });
          return;
        }

        submit.disabled = true;
        try {
          await createEventParticipation({
            eventDate: root.querySelector('#event-date')?.value,
            organizers: root.querySelector('#event-organizers')?.value,
            payerFullName: root.querySelector('#event-payer')?.value,
            authorizingOfficerName: root.querySelector('#event-authorizer')?.value,
            saedLeadName: root.querySelector('#event-lead')?.value,
            participants,
          });
          event.target.reset();
          participants.splice(0, participants.length);
          paintChips();
          setAuthAlert(root, {
            id: 'events-alert',
            type: 'success',
            message: 'Participación registrada. El envío a Discord se ha intentado automáticamente.',
          });
          await loadList();
        } catch (error) {
          setAuthAlert(root, {
            id: 'events-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo registrar la participación.'),
          });
        } finally {
          submit.disabled = false;
        }
      });

      void loadList();

      return () => cleanupLayout?.();
    },
  };
}

function renderEventCard(item) {
  const names = (item.participants ?? []).map((participant) => participant.fullName).join(', ');
  return `
    <article class="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-[11px] uppercase tracking-wide text-brand-300">${escapeHtml(formatDateShort(item.eventDate))}</p>
          <h4 class="mt-1 text-base font-semibold text-white">${escapeHtml(item.organizers)}</h4>
        </div>
        <span class="rounded-full border px-2.5 py-1 text-[11px] ${
          item.discordDelivered
            ? 'border-emerald-400/30 text-emerald-300'
            : 'border-amber-400/30 text-amber-300'
        }">${item.discordDelivered ? 'Enviado a Discord' : 'Pendiente Discord'}</span>
      </div>
      <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-ink-500">Abona al SAED</dt>
          <dd class="text-ink-100">${escapeHtml(item.payerFullName)}</dd>
        </div>
        <div>
          <dt class="text-ink-500">Alto mando que autorizó</dt>
          <dd class="text-ink-100">${escapeHtml(item.authorizingOfficerName)}</dd>
        </div>
        <div>
          <dt class="text-ink-500">Encargado del SAED</dt>
          <dd class="text-ink-100">${escapeHtml(item.saedLeadName)}</dd>
        </div>
        <div>
          <dt class="text-ink-500">Registrado por</dt>
          <dd class="text-ink-100">${escapeHtml(item.submittedBy?.fullName ?? '—')}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-ink-500">SAED participantes</dt>
          <dd class="text-ink-100">${escapeHtml(names || '—')}</dd>
        </div>
      </dl>
      <p class="mt-4 text-xs text-ink-500">Registrado ${escapeHtml(formatDateTimeLabel(item.createdAt))}</p>
    </article>
  `;
}
