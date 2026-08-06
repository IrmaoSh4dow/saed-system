import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  createAcademyApplication,
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
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  WITHDRAWN: 'Retirada',
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
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="landing-eyebrow">Ingreso</p>
          <h2 class="mt-1 text-2xl font-semibold text-white">Postulaciones</h2>
          <p class="mt-2 max-w-2xl text-sm text-ink-300">Consulta el estado de tus solicitudes o inicia una nueva.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a data-link href="/academy/apply" class="btn-primary">Postulación a Academia</a>
          <a data-link href="/academy/apply/transfer" class="btn-secondary">Solicitud de Traslado</a>
        </div>
      </div>
      <div id="academy-apps-root"><p class="text-sm text-ink-400">Cargando...</p></div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Postulaciones',
      currentPath: '/academy/applications',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);

      void listMyAcademyApplications()
        .then((items) => {
          const host = root.querySelector('#academy-apps-root');
          if (!host) return;
          host.innerHTML = `
            <section class="panel p-5">
              <div class="space-y-3">
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
      <section class="panel p-5 md:p-8">
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
                  <input id="${field.id}" type="${field.type ?? 'text'}" class="form-input" ${field.required ? 'required' : ''} maxlength="500" value="${escapeHtml(value)}" />
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
      root.querySelector('#academy-apply-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {};
        for (const field of fields) {
          const el = root.querySelector(`#${field.id}`);
          formData[field.id] = el?.value?.trim?.() ?? '';
        }

        try {
          await createAcademyApplication({ type, formData });
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
