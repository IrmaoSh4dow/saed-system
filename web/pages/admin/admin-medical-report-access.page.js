import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  formatRemainingAccess,
  getMedicalReportAccessDashboard,
  listMedicalReportAccessGrants,
  revokeMedicalReportAccess,
} from '../../services/medical-report-access.service.js';
import { formatDateTimeLabel } from '../../utils/date.js';
import { navigate } from '../../utils/router.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function characterName(character) {
  if (!character) return '—';
  return `${character.firstName ?? ''} ${character.lastName ?? ''}`.trim() || '—';
}

function metricCard(label, value, tone = 'neutral') {
  const tones = {
    neutral: 'border-white/10 text-white',
    success: 'border-emerald-400/30 text-emerald-200',
    danger: 'border-rose-400/30 text-rose-200',
    warn: 'border-amber-400/30 text-amber-200',
  };
  return `
    <article class="rounded-2xl border bg-white/[0.02] px-4 py-4 ${tones[tone] ?? tones.neutral}">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight">${escapeHtml(String(value))}</p>
    </article>
  `;
}

export function adminMedicalReportAccessPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (
    !can(PERMISSIONS.MEDICAL_REPORT_ACCESS_GRANT) &&
    !can(PERMISSIONS.MEDICAL_REPORT_ACCESS_REVOKE) &&
    !can('*') &&
    !can(PERMISSIONS.ADMIN_ACCESS)
  ) {
    void navigate('/admin', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  const canRevoke = can(PERMISSIONS.MEDICAL_REPORT_ACCESS_REVOKE) || can('*');

  const content = `
    ${renderAuthAlert({ id: 'mra-alert' })}
    <div id="mra-root" class="space-y-6">
      <p class="text-sm text-ink-400">Cargando historial de accesos a informes…</p>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Acceso temporal a informes',
      currentPath: '/admin/medical-report-access',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Acceso temporal a informes');

      const paint = async () => {
        const host = root.querySelector('#mra-root');
        if (!host) return;
        try {
          const [dashboard, grants] = await Promise.all([
            getMedicalReportAccessDashboard(),
            listMedicalReportAccessGrants({}),
          ]);

          host.innerHTML = `
            <section class="space-y-2">
              <p class="landing-eyebrow">Interoperabilidad institucional</p>
              <h2 class="text-2xl font-semibold text-white">Acceso temporal a informes médicos</h2>
              <p class="max-w-3xl text-sm text-ink-400">
                Trazabilidad completa de autorizaciones concedidas a Supervisores institucionales.
                Duración por defecto: ${dashboard.defaultDurationHours}h.
              </p>
            </section>

            <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              ${metricCard('Activos', dashboard.active, 'success')}
              ${metricCard('Expirados', dashboard.expired, 'warn')}
              ${metricCard('Revocados', dashboard.revoked, 'danger')}
              ${metricCard('Informes compartidos', dashboard.sharedReports)}
              ${metricCard('Supervisores con acceso', dashboard.activeSupervisors)}
            </section>

            <section class="panel p-4 md:p-5">
              <form id="mra-filters" class="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <div>
                  <label class="form-label" for="mra-q">Buscar</label>
                  <input id="mra-q" class="form-input" placeholder="Supervisor, paciente, informe…" />
                </div>
                <div>
                  <label class="form-label" for="mra-status">Estado</label>
                  <select id="mra-status" class="form-input">
                    <option value="">Todos</option>
                    <option value="ACTIVE">Activo</option>
                    <option value="EXPIRED">Expirado</option>
                    <option value="REVOKED">Revocado</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button type="submit" class="btn-primary w-full md:w-auto">Filtrar</button>
                </div>
              </form>
            </section>

            <section id="mra-results" class="space-y-2">
              ${renderGrantRows(grants, canRevoke)}
            </section>
          `;

          root.querySelector('#mra-filters')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
              const filtered = await listMedicalReportAccessGrants({
                q: root.querySelector('#mra-q')?.value?.trim() || undefined,
                status: root.querySelector('#mra-status')?.value || undefined,
              });
              const results = root.querySelector('#mra-results');
              if (results) results.innerHTML = renderGrantRows(filtered, canRevoke);
              bindRevokes(root, paint);
            } catch (error) {
              setAuthAlert(root, {
                id: 'mra-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });

          bindRevokes(root, paint);
        } catch (error) {
          host.innerHTML = `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      void paint();
      return cleanup;
    },
  };
}

function bindRevokes(root, reload) {
  root.querySelectorAll('[data-revoke-grant]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await revokeMedicalReportAccess(button.getAttribute('data-revoke-grant'));
        setAuthAlert(root, {
          id: 'mra-alert',
          type: 'success',
          message: 'Acceso revocado.',
        });
        void reload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'mra-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

function renderGrantRows(grants, canRevoke) {
  if (!grants.length) {
    return `<p class="text-sm text-ink-500">Sin autorizaciones registradas.</p>`;
  }

  return grants
    .map((grant) => {
      const patient = grant.report?.patient;
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : '—';
      return `
        <article class="rounded-2xl border border-white/10 px-4 py-3">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-white">
                #${grant.grantNumber} · Informe #${grant.report?.reportNumber ?? '—'}
                · ${escapeHtml(grant.report?.title || 'Informe')}
              </p>
              <p class="mt-1 text-xs text-ink-400">
                Destinatario: ${escapeHtml(characterName(grant.recipientCharacter))}
                · Paciente: ${escapeHtml(patientName)}
                · Motivo: ${escapeHtml(grant.reasonLabel || grant.reason)}
              </p>
              <p class="mt-1 text-[11px] text-ink-500">
                Concedido por ${escapeHtml(characterName(grant.grantedByCharacter))}
                · ${escapeHtml(formatDateTimeLabel(grant.grantedAt))}
                · Expira ${escapeHtml(formatDateTimeLabel(grant.expiresAt))}
                · Estado ${escapeHtml(grant.status)}
                · Vistas ${grant.viewCount}
                ${
                  grant.status === 'ACTIVE'
                    ? ` · Queda ${escapeHtml(formatRemainingAccess(grant.remainingMs))}`
                    : ''
                }
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              ${
                grant.report?.id
                  ? `<a data-link href="/reports?id=${grant.report.id}" class="btn-secondary !py-1.5 !px-3 text-xs">Ver informe</a>`
                  : ''
              }
              ${
                canRevoke && grant.status === 'ACTIVE'
                  ? `<button type="button" class="btn-secondary !py-1.5 !px-3 text-xs" data-revoke-grant="${grant.id}">Revocar</button>`
                  : ''
              }
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}
