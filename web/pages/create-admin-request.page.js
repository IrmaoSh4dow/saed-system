import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderSubmitButton, setButtonLoading } from '../components/auth/submit-button.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import {
  ADMIN_REQUEST_PRIORITY_LABELS,
  ADMIN_REQUEST_TYPE_LABELS,
  createAdminRequest,
} from '../services/admin-requests.service.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { requireActiveCharacter, requireAnyPermission } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function createAdminRequestPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }
  if (!requireAnyPermission([PERMISSIONS.ADMIN_REQUESTS_CREATE])) {
    return { html: '', afterMount: () => {} };
  }

  const typeOptions = Object.entries(ADMIN_REQUEST_TYPE_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
  const priorityOptions = Object.entries(ADMIN_REQUEST_PRIORITY_LABELS)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === 'MEDIUM' ? 'selected' : ''}>${label}</option>`,
    )
    .join('');

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'admin-request-create-alert' })}
      ${renderPageHeader({
        eyebrow: 'Comunicación institucional',
        title: 'Nueva solicitud administrativa',
        description:
          'Solicita una cita, reunión, firma de convenio u otro proceso formal con el Alto Mando del SAED.',
        actionsHtml: `<a data-link href="/admin-requests" class="btn-secondary !py-2.5">Volver</a>`,
      })}

      <form id="admin-request-create-form" class="panel mx-auto max-w-2xl space-y-5 p-6 md:p-8" novalidate>
        <div>
          <label class="form-label" for="ar-type">Tipo de solicitud</label>
          <select id="ar-type" name="type" class="form-input" required>
            ${typeOptions}
          </select>
        </div>
        <div>
          <label class="form-label" for="ar-subject">Asunto</label>
          <input id="ar-subject" name="subject" class="form-input" maxlength="160" required placeholder="Ej. Firma de convenio comercial" />
        </div>
        <div>
          <label class="form-label" for="ar-reason">Motivo</label>
          <textarea id="ar-reason" name="reason" class="form-input min-h-[160px]" maxlength="5000" required placeholder="Describe el motivo de la solicitud con el mayor detalle posible..."></textarea>
        </div>
        <div>
          <label class="form-label" for="ar-priority">Prioridad</label>
          <select id="ar-priority" name="priority" class="form-input">
            ${priorityOptions}
          </select>
        </div>
        ${renderSubmitButton({
          id: 'admin-request-create-submit',
          label: 'Enviar solicitud',
          loadingLabel: 'Enviando...',
        })}
      </form>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Nueva solicitud',
      currentPath: '/admin-requests',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Nueva solicitud · SAED';
      const form = root.querySelector('#admin-request-create-form');
      const submit = root.querySelector('#admin-request-create-submit');

      const onSubmit = async (event) => {
        event.preventDefault();
        const type = form.type.value;
        const subject = form.subject.value.trim();
        const reason = form.reason.value.trim();
        const priority = form.priority.value;

        if (subject.length < 3 || reason.length < 10) {
          setAuthAlert(root, {
            id: 'admin-request-create-alert',
            type: 'error',
            message: 'Completa el asunto (mín. 3) y el motivo (mín. 10 caracteres).',
          });
          return;
        }

        setButtonLoading(submit, true);
        try {
          const created = await createAdminRequest({ type, subject, reason, priority });
          setAuthAlert(root, {
            id: 'admin-request-create-alert',
            type: 'success',
            message: 'Solicitud enviada correctamente.',
          });
          await wait(220);
          void navigate(`/admin-requests?id=${created.id}`, { replace: true });
        } catch (error) {
          setAuthAlert(root, {
            id: 'admin-request-create-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        } finally {
          setButtonLoading(submit, false);
        }
      };

      form?.addEventListener('submit', onSubmit);
      return () => {
        form?.removeEventListener('submit', onSubmit);
        cleanup?.();
      };
    },
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
