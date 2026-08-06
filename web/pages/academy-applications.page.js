import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  createAcademyApplication,
  listAcademyIntake,
  listMyAcademyApplications,
} from '../services/academy.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { canSubmitAcademyApplication } from '../utils/character.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { navigate } from '../utils/router.js';

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

const TYPE_DESCRIPTIONS = {
  ACADEMY: 'Ingreso a la Academia Médica del SAED.',
  TRANSFER: 'Traslado desde otra jurisdicción o departamento.',
};

export function academyApplicationsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  const { activeCharacter } = getAuthState();
  if (!canSubmitAcademyApplication(activeCharacter)) {
    void navigate('/dashboard', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.ACADEMY_APPLY)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'academy-apps-alert' })}
      <div>
        <p class="landing-eyebrow">Ingreso</p>
        <h2 class="mt-1 text-2xl font-semibold text-white">Postulaciones</h2>
        <p class="mt-2 max-w-2xl text-sm text-ink-300">
          Consulta el estado de las convocatorias y de tus solicitudes.
        </p>
      </div>
      <section id="academy-intake-root" class="grid gap-4 md:grid-cols-2">
        <p class="text-sm text-ink-400 md:col-span-2">Cargando convocatorias…</p>
      </section>
      <div id="academy-apps-root"><p class="text-sm text-ink-400">Cargando tus postulaciones…</p></div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Postulaciones',
      currentPath: '/academy/applications',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);

      void Promise.all([listAcademyIntake(), listMyAcademyApplications()])
        .then(([intake, items]) => {
          const intakeHost = root.querySelector('#academy-intake-root');
          const appsHost = root.querySelector('#academy-apps-root');
          const byType = Object.fromEntries((intake ?? []).map((row) => [row.type, row]));

          if (intakeHost) {
            intakeHost.innerHTML = ['ACADEMY', 'TRANSFER']
              .map((type) => {
                const config = byType[type] ?? { type, isOpen: false };
                const open = Boolean(config.isOpen);
                const href = type === 'ACADEMY' ? '/academy/apply' : '/academy/apply/transfer';
                return `
                  <article class="panel relative overflow-hidden p-5">
                    <div class="pointer-events-none absolute inset-0 ${open ? 'bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),_transparent_50%)]' : 'bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.10),_transparent_50%)]'}"></div>
                    <div class="relative">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <h3 class="text-lg font-semibold text-white">${TYPE_LABELS[type]}</h3>
                          <p class="mt-1 text-sm text-ink-400">${TYPE_DESCRIPTIONS[type]}</p>
                        </div>
                        <span class="rounded-full border px-3 py-1 text-xs font-semibold ${open ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-rose-400/30 bg-rose-500/15 text-rose-300'}">
                          ${open ? 'Convocatoria abierta' : 'Convocatoria cerrada'}
                        </span>
                      </div>
                      <div class="mt-5">
                        ${
                          open
                            ? `<a data-link href="${href}" class="btn-primary">Postular ahora</a>`
                            : `<button type="button" class="btn-secondary cursor-not-allowed opacity-60" disabled>Postulaciones cerradas</button>`
                        }
                      </div>
                    </div>
                  </article>
                `;
              })
              .join('');
          }

          if (appsHost) {
            appsHost.innerHTML = `
              <section class="panel p-5">
                <h3 class="text-sm font-semibold text-white">Mis solicitudes</h3>
                <div class="mt-4 space-y-3">
                  ${
                    items.length
                      ? items
                          .map(
                            (item) => `
                          <div class="rounded-xl border border-white/10 px-4 py-3">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                              <p class="text-sm font-medium text-white">${TYPE_LABELS[item.type] ?? item.type}</p>
                              <span class="text-xs text-ink-400">${STATUS_LABELS[item.status] ?? item.status}</span>
                            </div>
                            <p class="mt-1 text-xs text-ink-500">${formatDateTimeLabel(item.createdAt)}</p>
                            ${
                              item.discordUsername || item.formData?.discordUsername
                                ? `<p class="mt-1 text-xs text-ink-400">Discord: ${escapeHtml(item.discordUsername || item.formData.discordUsername)}</p>`
                                : ''
                            }
                            ${
                              item.reviewNotes
                                ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(item.reviewNotes)}</p>`
                                : ''
                            }
                          </div>
                        `,
                          )
                          .join('')
                      : `<p class="text-sm text-ink-400">No tienes postulaciones todavía.</p>`
                  }
                </div>
              </section>
            `;
          }
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'academy-apps-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        });

      return cleanup;
    },
  };
}

export function academyApplyPage() {
  return renderApplicationForm({
    type: 'ACADEMY',
    title: 'Postulación a Academia',
    description: 'Solicitud formal de ingreso al SAED. Completa todos los campos con seriedad roleplay.',
    path: '/academy/apply',
    fields: [
      { id: 'fullName', label: 'Nombre completo', required: true },
      { id: 'discordUsername', label: 'Usuario de Discord', required: true, hint: 'Ejemplo: grantmercer o grantmercer#0001' },
      { id: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: true },
      { id: 'phone', label: 'Teléfono', required: true },
      { id: 'email', label: 'Correo electrónico', type: 'email' },
      { id: 'educationLevel', label: 'Nivel educativo', required: true },
      { id: 'currentOccupation', label: 'Ocupación actual', required: true },
      { id: 'workHistory', label: 'Antecedentes laborales', type: 'textarea', required: true },
      { id: 'motivation', label: 'Motivación para ingresar al SAED', type: 'textarea', required: true },
      { id: 'whyAccept', label: '¿Por qué deberíamos aceptarte?', type: 'textarea', required: true },
      { id: 'securityExperience', label: 'Experiencia previa en cuerpos de seguridad (RP)', type: 'textarea' },
      { id: 'availability', label: 'Disponibilidad horaria', type: 'textarea', required: true },
      { id: 'additionalNotes', label: 'Observaciones adicionales', type: 'textarea' },
    ],
  });
}

export function academyTransferApplyPage() {
  return renderApplicationForm({
    type: 'TRANSFER',
    title: 'Solicitud de Traslado',
    description: 'Para personal proveniente de otra jurisdicción o departamento.',
    path: '/academy/apply/transfer',
    fields: [
      { id: 'fullName', label: 'Nombre completo', required: true },
      { id: 'discordUsername', label: 'Usuario de Discord', required: true, hint: 'Ejemplo: grantmercer o grantmercer#0001' },
      { id: 'originDepartment', label: 'Departamento de origen', required: true },
      { id: 'currentRank', label: 'Rango actual', required: true },
      { id: 'serviceTime', label: 'Tiempo de servicio', required: true },
      { id: 'currentDepartment', label: 'Departamento actual' },
      { id: 'transferReason', label: 'Motivo del traslado', type: 'textarea', required: true },
      { id: 'experience', label: 'Experiencia', type: 'textarea', required: true },
      { id: 'decorations', label: 'Condecoraciones relevantes', type: 'textarea' },
      { id: 'disciplinary', label: 'Medidas disciplinarias (si aplica)', type: 'textarea' },
      { id: 'additionalInfo', label: 'Información adicional', type: 'textarea' },
    ],
  });
}

function renderApplicationForm({ type, title, description, path, fields }) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  const { activeCharacter } = getAuthState();
  if (!canSubmitAcademyApplication(activeCharacter)) {
    void navigate('/dashboard', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.ACADEMY_APPLY)) {
    return { html: '', afterMount: () => {} };
  }

  const prefillName = `${activeCharacter.firstName ?? ''} ${activeCharacter.lastName ?? ''}`.trim();

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'academy-apply-alert' })}
      <div id="academy-apply-closed" class="hidden panel border-rose-400/20 bg-rose-500/5 p-5">
        <p class="text-sm font-semibold text-rose-200">Convocatoria cerrada</p>
        <p class="mt-2 text-sm text-ink-300">Esta convocatoria no acepta nuevas postulaciones en este momento.</p>
        <a data-link href="/academy/applications" class="btn-secondary mt-4 inline-flex">Volver a postulaciones</a>
      </div>
      <section id="academy-apply-panel" class="panel p-5 md:p-8">
        <div class="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="landing-eyebrow">Postulación</p>
            <h2 class="mt-1 text-2xl font-semibold text-white">${title}</h2>
            <p class="mt-2 max-w-2xl text-sm text-ink-300">${description}</p>
          </div>
          <a data-link href="/academy/applications" class="btn-secondary">Volver</a>
        </div>
        <form id="academy-apply-form" class="mt-6 grid gap-5 md:grid-cols-2" novalidate>
          ${fields
            .map((field) => {
              const span = field.type === 'textarea' ? 'md:col-span-2' : '';
              const value = field.id === 'fullName' ? prefillName : '';
              if (field.type === 'textarea') {
                return `
                  <div class="${span}">
                    <label class="form-label" for="${field.id}">${field.label}</label>
                    <textarea id="${field.id}" class="form-input min-h-28" ${field.required ? 'required' : ''} maxlength="4000"></textarea>
                  </div>
                `;
              }
              return `
                <div class="${span}">
                  <label class="form-label" for="${field.id}">${field.label}</label>
                  <input id="${field.id}" type="${field.type ?? 'text'}" class="form-input" ${field.required ? 'required' : ''} maxlength="500" value="${escapeHtml(value)}" placeholder="${field.id === 'discordUsername' ? 'grantmercer' : ''}" />
                  ${field.hint ? `<p class="form-hint">${escapeHtml(field.hint)}</p>` : ''}
                </div>
              `;
            })
            .join('')}
          <div class="md:col-span-2 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <a data-link href="/academy/applications" class="btn-secondary text-center">Cancelar</a>
            <button type="submit" class="btn-primary">Enviar solicitud</button>
          </div>
        </form>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title, currentPath: path }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);

      void listAcademyIntake()
        .then((intake) => {
          const config = (intake ?? []).find((item) => item.type === type);
          if (config && !config.isOpen) {
            root.querySelector('#academy-apply-closed')?.classList.remove('hidden');
            root.querySelector('#academy-apply-panel')?.classList.add('hidden');
          }
        })
        .catch(() => {});

      root.querySelector('#academy-apply-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {};
        for (const field of fields) {
          if (field.id === 'discordUsername') continue;
          const el = root.querySelector(`#${field.id}`);
          formData[field.id] = el?.value?.trim?.() ?? '';
        }
        const discordUsername = root.querySelector('#discordUsername')?.value?.trim?.() ?? '';

        try {
          await createAcademyApplication({ type, discordUsername, formData });
          setAuthAlert(root, {
            id: 'academy-apply-alert',
            type: 'success',
            message: 'Solicitud enviada correctamente.',
          });
          void navigate('/academy/applications', { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'academy-apply-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });
      return cleanup;
    },
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
