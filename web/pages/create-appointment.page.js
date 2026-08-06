import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { APPOINTMENT_TYPE_LABELS } from '../components/appointments/appointment-card.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { createAppointment } from '../services/appointments.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { navigate } from '../utils/router.js';

export function createAppointmentPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.APPOINTMENTS_CREATE)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'create-appointment-alert' })}

      <section class="panel p-5 md:p-6 lg:p-8">
        <div class="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <p class="landing-eyebrow">Citas</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">Nueva cita</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
              Solicita una cita médica o una evaluación psicotécnica. El personal SAED revisará tu
              solicitud y te contactará para confirmar la fecha.
            </p>
          </div>
          <a data-link href="/appointments" class="btn-secondary shrink-0 self-start sm:self-auto">Volver al listado</a>
        </div>

        <form id="create-appointment-form" class="mt-6 space-y-6" novalidate>
          <div>
            <label class="form-label" for="appointment-type">Tipo de cita</label>
            <select id="appointment-type" class="form-input" required>
              ${Object.entries(APPOINTMENT_TYPE_LABELS)
                .map(([value, label]) => `<option value="${value}">${label}</option>`)
                .join('')}
            </select>
            <p class="form-hint">Selecciona el motivo de tu cita.</p>
          </div>

          <div>
            <label class="form-label" for="appointment-title">Título</label>
            <input id="appointment-title" class="form-input" required maxlength="160" placeholder="Resumen breve del motivo" />
          </div>

          <div>
            <label class="form-label" for="appointment-description">Descripción</label>
            <textarea id="appointment-description" class="form-input min-h-[160px] resize-y" required maxlength="5000" placeholder="Describe el motivo de tu solicitud con el mayor detalle posible..."></textarea>
          </div>

          <div class="sm:max-w-xs">
            <label class="form-label" for="appointment-date">Fecha preferida</label>
            <input id="appointment-date" type="date" class="form-input" />
            <p class="form-hint">Opcional · el personal confirmará disponibilidad.</p>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <a data-link href="/appointments" class="btn-secondary text-center">Cancelar</a>
            <button type="submit" class="btn-primary">Enviar solicitud</button>
          </div>
        </form>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Nueva cita',
      currentPath: '/appointments',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Nueva cita · SAED';

      root.querySelector('#create-appointment-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
          const appointment = await createAppointment({
            type: root.querySelector('#appointment-type').value,
            title: root.querySelector('#appointment-title').value.trim(),
            description: root.querySelector('#appointment-description').value.trim(),
            preferredDate: root.querySelector('#appointment-date').value || undefined,
          });
          void navigate(`/appointments?id=${appointment.id}`, { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'create-appointment-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      return cleanup;
    },
  };
}
