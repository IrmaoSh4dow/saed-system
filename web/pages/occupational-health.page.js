import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderInteropIndicators } from '../components/occupational-health/fitness-badges.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  getOccupationalHealthDashboard,
  listInteropRoster,
  PSYCHOTECHNICAL_RESULT_LABELS,
  PSYCHOTECHNICAL_VALIDITY_LABELS,
} from '../services/occupational-health.service.js';
import { PERMISSIONS } from '../utils/permissions.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function metricCard(label, value, tone = 'default') {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'warn'
        ? 'text-amber-300'
        : tone === 'danger'
          ? 'text-rose-300'
          : 'text-white';
  return `
    <article class="panel p-4">
      <p class="text-[11px] uppercase tracking-wide text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold ${toneClass}">${escapeHtml(String(value))}</p>
    </article>
  `;
}

export function occupationalHealthPage() {
  const canReadDashboard = can(PERMISSIONS.OCCUPATIONAL_HEALTH_READ);
  const canInterop = can(PERMISSIONS.OCCUPATIONAL_HEALTH_INTEROP);

  if (!canReadDashboard && !canInterop) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'occupational-health-alert' })}

      <section class="panel relative overflow-hidden p-6 md:p-8">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.14),_transparent_45%)]"></div>
        <div class="relative">
          <p class="landing-eyebrow">Salud ocupacional</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            ${canInterop && !canReadDashboard ? 'Aptitud médica LSPD' : 'Psicotécnicos y Bajas Médicas'}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300">
            ${
              canInterop && !canReadDashboard
                ? 'Consulta restringida de aptitud laboral del personal LSPD. No incluye historial clínico confidencial.'
                : 'Seguimiento institucional de aptitud psicotécnica y bajas médicas, integrado con la ficha clínica.'
            }
          </p>
        </div>
      </section>

      ${
        canReadDashboard
          ? `<section id="oh-summary" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"></section>`
          : ''
      }

      ${
        canInterop
          ? `
        <section class="panel p-5">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-sm font-semibold text-white">Directorio LSPD</h2>
              <p class="mt-1 text-xs text-ink-400">Indicadores de psicotécnico y baja médica activa únicamente.</p>
            </div>
            <form id="interop-search-form" class="flex flex-wrap gap-2">
              <input id="interop-query" class="form-input min-w-[220px]" placeholder="Buscar oficial / paciente…" />
              <button type="submit" class="btn-primary">Buscar</button>
            </form>
          </div>
          <div id="interop-grid" class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"></div>
        </section>
      `
          : ''
      }

      ${
        canReadDashboard
          ? `
        <section class="panel p-5">
          <h2 class="text-sm font-semibold text-white">Alertas de vencimiento</h2>
          <p class="mt-1 text-xs text-ink-400">Arquitectura preparada para notificaciones automáticas futuras.</p>
          <div id="oh-alerts" class="mt-4 space-y-2"></div>
        </section>
      `
          : ''
      }
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Salud ocupacional',
      currentPath: '/occupational-health',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);

      const loadDashboard = async () => {
        if (!canReadDashboard) return;
        const summary = root.querySelector('#oh-summary');
        const alerts = root.querySelector('#oh-alerts');
        try {
          const data = await getOccupationalHealthDashboard();
          if (summary) {
            summary.innerHTML = [
              metricCard('Psicotécnicos vigentes', data.currentPsychotechnical, 'success'),
              metricCard('Próximos a vencer', data.expiringSoon, 'warn'),
              metricCard('Vencidos', data.expired, 'danger'),
              metricCard('Sin psicotécnico', data.withoutPsychotechnical),
              metricCard('Apto', data.fit, 'success'),
              metricCard('Apto c/ observaciones', data.fitWithObservations, 'warn'),
              metricCard('No apto', data.unfit, 'danger'),
              metricCard('Bajas activas', data.activeMedicalLeaves, 'danger'),
              metricCard('Bajas finalizadas', data.completedMedicalLeaves),
            ].join('');
          }
          if (alerts) {
            const items = data.alerts?.psychotechnicalExpiringSoon ?? [];
            alerts.innerHTML = items.length
              ? items
                  .map(
                    (item) => `
                      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
                        <div>
                          <p class="text-sm font-medium text-white">${escapeHtml(item.patientName)}</p>
                          <p class="mt-1 text-xs text-ink-400">HC #${item.recordNumber} · ${escapeHtml(PSYCHOTECHNICAL_RESULT_LABELS[item.result] ?? item.result)}</p>
                        </div>
                        <span class="text-xs font-semibold text-amber-200">Vence ${escapeHtml(formatDateLabel(item.expiresAt))}</span>
                      </div>
                    `,
                  )
                  .join('')
              : `<p class="text-sm text-ink-400">No hay psicotécnicos próximos a vencer.</p>`;
          }
        } catch (error) {
          setAuthAlert({
            root,
            id: 'occupational-health-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const loadInterop = async (q = '') => {
        if (!canInterop) return;
        const grid = root.querySelector('#interop-grid');
        if (!grid) return;
        grid.innerHTML = `<p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">Cargando directorio…</p>`;
        try {
          const data = await listInteropRoster({ q, partner: 'LSPD' });
          const items = data.items ?? [];
          grid.innerHTML = items.length
            ? items
                .map(
                  (item) => `
                    <article class="panel p-4 transition duration-200 hover:border-brand-400/30">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <h3 class="truncate text-sm font-semibold text-white">${escapeHtml(item.fullName)}</h3>
                          <p class="mt-1 text-xs text-ink-400">
                            ${escapeHtml(item.organization)}
                            ${item.position ? ` · ${escapeHtml(item.position)}` : ''}
                          </p>
                        </div>
                        <span class="text-[11px] text-ink-500">HC #${item.recordNumber}</span>
                      </div>
                      <div class="mt-4">${renderInteropIndicators(item)}</div>
                      <dl class="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div class="rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2">
                          <dt class="text-ink-500">Vence psicotécnico</dt>
                          <dd class="mt-1 text-ink-200">${escapeHtml(formatDateLabel(item.psychotechnical?.expiresAt))}</dd>
                        </div>
                        <div class="rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2">
                          <dt class="text-ink-500">Fin baja médica</dt>
                          <dd class="mt-1 text-ink-200">${escapeHtml(formatDateLabel(item.medicalLeave?.endsAt))}</dd>
                        </div>
                      </dl>
                      <p class="mt-3 text-[11px] text-ink-500">
                        ${escapeHtml(PSYCHOTECHNICAL_VALIDITY_LABELS[item.psychotechnical?.validity] ?? '—')}
                      </p>
                    </article>
                  `,
                )
                .join('')
            : `<p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">No hay personal LSPD vinculado a fichas clínicas.</p>`;
        } catch (error) {
          grid.innerHTML = `<p class="text-sm text-rose-300 md:col-span-2 xl:col-span-3">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      root.querySelector('#interop-search-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        void loadInterop(root.querySelector('#interop-query')?.value ?? '');
      });

      void Promise.all([loadDashboard(), loadInterop()]);
      return cleanupLayout;
    },
  };
}
