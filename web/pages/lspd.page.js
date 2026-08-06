import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  renderInteropIndicators,
  renderTonePill,
} from '../components/occupational-health/fitness-badges.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  approveMedicalRecordAccessRequest,
  createMedicalRecordAccessRequest,
  formatMoney,
  getLspdAgent,
  getLspdClinicalRecord,
  getLspdDashboard,
  getLspdFinance,
  listLspdDirectory,
  listMedicalRecordAccessRequests,
  rejectMedicalRecordAccessRequest,
} from '../services/lspd.service.js';
import { PSYCHOTECHNICAL_RESULT_LABELS } from '../services/occupational-health.service.js';
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
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateTimeLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function metric(label, value, tone = '') {
  const color =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'warn'
        ? 'text-amber-300'
        : tone === 'danger'
          ? 'text-rose-300'
          : 'text-white';
  return `
    <article class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight ${color}">${escapeHtml(String(value))}</p>
    </article>
  `;
}

export function lspdPage() {
  const canInterop = can(PERMISSIONS.OCCUPATIONAL_HEALTH_INTEROP);
  const canDashboard = can(PERMISSIONS.OCCUPATIONAL_HEALTH_READ);
  const canFinance = can(PERMISSIONS.LSPD_FINANCE_READ);
  const canRequestAccess = can(PERMISSIONS.MEDICAL_RECORD_ACCESS_REQUEST);
  const canReviewAccess = can(PERMISSIONS.MEDICAL_RECORD_ACCESS_REVIEW);
  const canReadAccess = can(PERMISSIONS.MEDICAL_RECORD_ACCESS_READ);

  if (!canInterop && !canDashboard && !canFinance && !canReadAccess) {
    return { html: '', afterMount: () => {} };
  }

  const params = new URLSearchParams(window.location.search);
  const initialTab =
    params.get('tab') ||
    (canInterop ? 'directory' : canFinance ? 'finance' : canReadAccess ? 'access' : 'overview');

  const tabs = [
    canDashboard ? { id: 'overview', label: 'Resumen' } : null,
    canInterop ? { id: 'directory', label: 'Directorio' } : null,
    canFinance ? { id: 'finance', label: 'Facturación' } : null,
    canReadAccess ? { id: 'access', label: 'Expedientes' } : null,
  ].filter(Boolean);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'lspd-alert' })}

      <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(217,30,30,0.18),_transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_50%)]"></div>
        <div class="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">Interoperabilidad institucional</p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">LSPD</h1>
            <p class="mt-3 max-w-xl text-sm leading-relaxed text-ink-300">
              Plataforma médica entre el SAED y el Departamento de Policía de Los Santos.
              Aptitud laboral, privacidad clínica y facturación institucional.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 lg:justify-end">
            ${tabs
              .map(
                (tab) => `
                  <button type="button" data-lspd-tab="${tab.id}"
                    class="rounded-full border px-4 py-2 text-sm transition ${
                      tab.id === initialTab
                        ? 'border-brand-400/50 bg-brand-500/15 text-white'
                        : 'border-white/10 bg-white/[0.02] text-ink-300 hover:border-white/20 hover:text-white'
                    }">
                    ${escapeHtml(tab.label)}
                  </button>
                `,
              )
              .join('')}
          </div>
        </div>
      </section>

      <section id="lspd-panel" class="min-h-[420px]"></section>

      <div id="lspd-drawer" class="hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-close-drawer></div>
        <aside class="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-surface-950">
          <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 id="drawer-title" class="text-base font-semibold text-white">Detalle</h2>
            <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" data-close-drawer>Cerrar</button>
          </div>
          <div id="drawer-body" class="flex-1 overflow-y-auto p-5"></div>
        </aside>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'LSPD',
      currentPath: '/lspd',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      let activeTab = initialTab;
      const panel = root.querySelector('#lspd-panel');
      const drawer = root.querySelector('#lspd-drawer');
      const drawerBody = root.querySelector('#drawer-body');
      const drawerTitle = root.querySelector('#drawer-title');

      const closeDrawer = () => drawer?.classList.add('hidden');
      const openDrawer = (title, html) => {
        if (drawerTitle) drawerTitle.textContent = title;
        if (drawerBody) drawerBody.innerHTML = html;
        drawer?.classList.remove('hidden');
      };

      root.querySelectorAll('[data-close-drawer]').forEach((el) =>
        el.addEventListener('click', closeDrawer),
      );

      const setTab = (tabId) => {
        activeTab = tabId;
        root.querySelectorAll('[data-lspd-tab]').forEach((button) => {
          const active = button.getAttribute('data-lspd-tab') === tabId;
          button.className = `rounded-full border px-4 py-2 text-sm transition ${
            active
              ? 'border-brand-400/50 bg-brand-500/15 text-white'
              : 'border-white/10 bg-white/[0.02] text-ink-300 hover:border-white/20 hover:text-white'
          }`;
        });
        void renderTab();
      };

      root.querySelectorAll('[data-lspd-tab]').forEach((button) => {
        button.addEventListener('click', () => setTab(button.getAttribute('data-lspd-tab')));
      });

      const renderOverview = async () => {
        const data = await getLspdDashboard();
        panel.innerHTML = `
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            ${metric('Psicotécnicos vigentes', data.currentPsychotechnical, 'success')}
            ${metric('Próximos a vencer', data.expiringSoon, 'warn')}
            ${metric('Vencidos', data.expired, 'danger')}
            ${metric('Bajas activas', data.activeMedicalLeaves, 'danger')}
            ${metric('Apto', data.fit, 'success')}
            ${metric('Apto c/ observaciones', data.fitWithObservations, 'warn')}
            ${metric('No apto', data.unfit, 'danger')}
            ${metric('Sin psicotécnico', data.withoutPsychotechnical)}
          </div>
          <section class="mt-6 rounded-3xl border border-white/10 p-5">
            <h3 class="text-sm font-semibold text-white">Alertas de vencimiento</h3>
            <div class="mt-4 space-y-2">
              ${(data.alerts?.psychotechnicalExpiringSoon ?? []).length
                ? data.alerts.psychotechnicalExpiringSoon
                    .map(
                      (item) => `
                        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                          <div>
                            <p class="text-sm font-medium text-white">${escapeHtml(item.patientName)}</p>
                            <p class="mt-1 text-xs text-ink-400">HC #${item.recordNumber} · ${escapeHtml(PSYCHOTECHNICAL_RESULT_LABELS[item.result] ?? item.result)}</p>
                          </div>
                          <span class="text-xs font-semibold text-amber-200">Vence ${escapeHtml(formatDateLabel(item.expiresAt))}</span>
                        </div>
                      `,
                    )
                    .join('')
                : `<p class="text-sm text-ink-400">Sin alertas de vencimiento próximas.</p>`}
            </div>
          </section>
        `;
      };

      const openAgent = async (patientId) => {
        try {
          const agent = await getLspdAgent(patientId);
          const observationsHtml =
            agent.psychotechnical?.result === 'FIT_WITH_OBSERVATIONS' &&
            agent.psychotechnical?.observations
              ? `
                <div class="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                  <p class="text-[11px] uppercase tracking-wide text-amber-200">Observaciones del psicotécnico</p>
                  <p class="mt-2 text-sm leading-relaxed text-amber-50">${escapeHtml(agent.psychotechnical.observations)}</p>
                </div>
              `
              : '';

          openDrawer(
            agent.fullName,
            `
              <div class="space-y-5">
                <div>
                  <p class="text-xs text-ink-500">HC #${agent.recordNumber}</p>
                  ${
                    agent.badgeNumber
                      ? `<p class="mt-2 inline-flex items-center rounded-lg border border-brand-400/40 bg-brand-500/15 px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-brand-100">${escapeHtml(agent.badgeNumber)}</p>`
                      : ''
                  }
                  <p class="mt-2 text-sm text-ink-300">${escapeHtml(agent.organization)}${agent.position ? ` · ${escapeHtml(agent.position)}` : ''}</p>
                  <div class="mt-4">${renderInteropIndicators(agent)}</div>
                </div>
                <dl class="grid grid-cols-2 gap-3 text-sm">
                  <div class="rounded-2xl border border-white/10 px-3 py-3">
                    <dt class="text-xs text-ink-500">Vence psicotécnico</dt>
                    <dd class="mt-1 text-white">${escapeHtml(formatDateLabel(agent.psychotechnical?.expiresAt))}</dd>
                  </div>
                  <div class="rounded-2xl border border-white/10 px-3 py-3">
                    <dt class="text-xs text-ink-500">Fin baja médica</dt>
                    <dd class="mt-1 text-white">${escapeHtml(formatDateLabel(agent.medicalLeave?.endsAt))}</dd>
                  </div>
                </dl>
                ${observationsHtml}
                ${
                  agent.access?.isActive
                    ? `
                      <div class="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                        <p class="text-sm font-medium text-emerald-200">Acceso clínico activo</p>
                        <p class="mt-1 text-xs text-ink-300">Expira ${escapeHtml(formatDateTimeLabel(agent.access.expiresAt))}</p>
                        <button type="button" class="btn-primary mt-4" data-open-clinical="${agent.patientId}">Abrir expediente</button>
                      </div>
                    `
                    : canRequestAccess
                      ? `
                        <form id="access-request-form" class="space-y-3 rounded-2xl border border-white/10 p-4">
                          <p class="text-sm font-medium text-white">Solicitar acceso al expediente médico</p>
                          <p class="text-xs text-ink-400">El acceso, si se aprueba, durará 24 horas y quedará auditado.</p>
                          <textarea id="access-reason" class="form-input min-h-[100px]" required minlength="8" placeholder="Motivo institucional de la solicitud…"></textarea>
                          <button type="submit" class="btn-primary">Enviar solicitud</button>
                        </form>
                      `
                      : ''
                }
              </div>
            `,
          );

          drawerBody?.querySelector('#access-request-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
              await createMedicalRecordAccessRequest({
                patientId,
                reason: drawerBody.querySelector('#access-reason').value.trim(),
              });
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'success',
                message: 'Solicitud enviada a Altos Mandos del SAED.',
              });
              closeDrawer();
              if (activeTab === 'access') void renderAccess();
            } catch (error) {
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });

          drawerBody?.querySelector('[data-open-clinical]')?.addEventListener('click', async () => {
            try {
              const payload = await getLspdClinicalRecord(patientId);
              const clinical = payload.clinical;
              openDrawer(
                `Expediente · ${agent.fullName}`,
                `
                  <div class="space-y-4">
                    <p class="text-xs text-emerald-300">Acceso temporal hasta ${escapeHtml(formatDateTimeLabel(payload.access.expiresAt))}</p>
                    <div class="rounded-2xl border border-white/10 p-4">
                      <p class="text-sm font-semibold text-white">${escapeHtml(clinical.fullName)}</p>
                      <p class="mt-2 text-xs text-ink-400">Sangre ${escapeHtml(clinical.bloodType ?? '—')} · ${escapeHtml(clinical.status)}</p>
                      <dl class="mt-4 space-y-2 text-sm">
                        <div><dt class="text-ink-500">Alergias</dt><dd class="text-ink-200">${escapeHtml(clinical.allergies || 'Ninguna registrada')}</dd></div>
                        <div><dt class="text-ink-500">Antecedentes</dt><dd class="text-ink-200">${escapeHtml(clinical.chronicConditions || '—')}</dd></div>
                        <div><dt class="text-ink-500">Notas</dt><dd class="text-ink-200">${escapeHtml(clinical.notes || '—')}</dd></div>
                      </dl>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-center text-xs">
                      <div class="rounded-xl border border-white/10 p-3"><p class="text-lg text-white">${clinical.clinicalHistory?.stats?.diagnoses ?? 0}</p><p class="text-ink-500">Diagnósticos</p></div>
                      <div class="rounded-xl border border-white/10 p-3"><p class="text-lg text-white">${clinical.clinicalHistory?.stats?.hospitalizations ?? 0}</p><p class="text-ink-500">Hospitalizaciones</p></div>
                      <div class="rounded-xl border border-white/10 p-3"><p class="text-lg text-white">${clinical.medicalReports?.length ?? 0}</p><p class="text-ink-500">Informes</p></div>
                      <div class="rounded-xl border border-white/10 p-3"><p class="text-lg text-white">${clinical.invoices?.length ?? 0}</p><p class="text-ink-500">Facturas</p></div>
                    </div>
                  </div>
                `,
              );
            } catch (error) {
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        } catch (error) {
          setAuthAlert({
            root,
            id: 'lspd-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const renderDirectory = async (q = '') => {
        panel.innerHTML = `<p class="text-sm text-ink-400">Cargando directorio LSPD…</p>`;
        const data = await listLspdDirectory({ q, partner: 'LSPD' });
        const items = data.items ?? [];
        const fitCount = items.filter((item) => item.psychotechnical?.result === 'FIT').length;
        const observedCount = items.filter(
          (item) => item.psychotechnical?.result === 'FIT_WITH_OBSERVATIONS',
        ).length;
        const leaveCount = items.filter((item) => item.medicalLeave?.isCurrentlyActive).length;

        panel.innerHTML = `
          <section class="relative overflow-hidden rounded-3xl border border-white/10">
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(217,30,30,0.12),_transparent_40%)]"></div>
            <div class="relative space-y-5 p-5 md:p-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">Directorio institucional</p>
                  <h3 class="mt-2 text-xl font-semibold text-white">Personal LSPD vinculado</h3>
                  <p class="mt-1 text-sm text-ink-400">Aptitud laboral y estado médico operativo — sin expediente clínico completo.</p>
                </div>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-ink-200">${items.length} agentes</span>
                  <span class="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">${fitCount} aptos</span>
                  <span class="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-amber-200">${observedCount} c/ obs.</span>
                  <span class="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 text-rose-200">${leaveCount} en baja</span>
                </div>
              </div>
              <form id="directory-search" class="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label class="form-label" for="directory-query">Buscar agente</label>
                  <input id="directory-query" class="form-input" value="${escapeHtml(q)}" placeholder="Nombre, apellido o HC…" />
                </div>
                <div class="flex items-end">
                  <button type="submit" class="btn-primary w-full sm:w-auto">Buscar</button>
                </div>
              </form>
            </div>
          </section>

          <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            ${
              items.length
                ? items
                    .map((item) => {
                      const leaveActive = Boolean(item.medicalLeave?.isCurrentlyActive);
                      const psychoTone =
                        item.psychotechnical?.result === 'UNFIT' ||
                        item.psychotechnical?.validity === 'EXPIRED'
                          ? 'rose'
                          : item.psychotechnical?.result === 'FIT_WITH_OBSERVATIONS' ||
                              item.psychotechnical?.validity === 'EXPIRING_SOON'
                            ? 'amber'
                            : item.psychotechnical
                              ? 'emerald'
                              : 'neutral';
                      const accent =
                        leaveActive
                          ? 'from-rose-500/15 via-transparent to-transparent'
                          : psychoTone === 'amber'
                            ? 'from-amber-500/12 via-transparent to-transparent'
                            : psychoTone === 'emerald'
                              ? 'from-emerald-500/10 via-transparent to-transparent'
                              : 'from-white/[0.04] via-transparent to-transparent';
                      const initials = String(item.fullName || '?')
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? '')
                        .join('');

                      return `
                        <button type="button" data-open-agent="${item.patientId}"
                          class="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950 p-0 text-left transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/40 hover:shadow-[0_18px_40px_-28px_rgba(217,30,30,0.55)]">
                          <div class="pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}"></div>
                          <div class="relative p-5">
                            <div class="flex items-start gap-3">
                              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 text-sm font-semibold text-brand-300">
                                ${
                                  item.avatarUrl
                                    ? `<img src="${escapeHtml(item.avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                                    : escapeHtml(initials || 'L')
                                }
                              </div>
                              <div class="min-w-0 flex-1">
                                <div class="flex items-start justify-between gap-2">
                                  <p class="truncate text-base font-semibold tracking-tight text-white">${escapeHtml(item.fullName)}</p>
                                  <span class="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-ink-500">HC ${item.recordNumber}</span>
                                </div>
                                ${
                                  item.badgeNumber
                                    ? `<p class="mt-2 inline-flex max-w-full items-center rounded-md border border-brand-400/35 bg-brand-500/15 px-2.5 py-1 font-mono text-sm font-semibold tracking-wider text-brand-100">${escapeHtml(item.badgeNumber)}</p>`
                                    : `<p class="mt-2 text-xs text-ink-500">Sin placa registrada</p>`
                                }
                                <p class="mt-1.5 truncate text-xs text-ink-400">
                                  ${escapeHtml(item.organization)}${item.position ? ` · ${escapeHtml(item.position)}` : ''}
                                </p>
                              </div>
                            </div>

                            <div class="mt-5">${renderInteropIndicators(item)}</div>

                            <div class="mt-5 grid grid-cols-2 gap-2">
                              <div class="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                                <p class="text-[10px] uppercase tracking-wide text-ink-500">Psicotécnico</p>
                                <p class="mt-1 text-xs font-medium text-ink-100">${escapeHtml(PSYCHOTECHNICAL_RESULT_LABELS[item.psychotechnical?.result] ?? 'Sin evaluación')}</p>
                                <p class="mt-1 text-[11px] text-ink-500">Vence ${escapeHtml(formatDateLabel(item.psychotechnical?.expiresAt))}</p>
                              </div>
                              <div class="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
                                <p class="text-[10px] uppercase tracking-wide text-ink-500">Baja médica</p>
                                <p class="mt-1 text-xs font-medium ${leaveActive ? 'text-rose-200' : 'text-ink-100'}">${leaveActive ? 'Activa' : 'Sin baja'}</p>
                                <p class="mt-1 text-[11px] text-ink-500">${leaveActive ? `Hasta ${escapeHtml(formatDateLabel(item.medicalLeave?.endsAt))}` : 'Operativo'}</p>
                              </div>
                            </div>

                            ${
                              item.psychotechnical?.result === 'FIT_WITH_OBSERVATIONS' &&
                              item.psychotechnical?.observations
                                ? `
                                  <div class="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2.5">
                                    <p class="text-[10px] uppercase tracking-wide text-amber-200">Observaciones</p>
                                    <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-amber-50/90">${escapeHtml(item.psychotechnical.observations)}</p>
                                  </div>
                                `
                                : ''
                            }

                            <p class="mt-4 text-[11px] font-medium text-brand-300 opacity-0 transition group-hover:opacity-100">Ver perfil médico operativo →</p>
                          </div>
                        </button>
                      `;
                    })
                    .join('')
                : `
                  <div class="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-white/15 px-6 py-12 text-center">
                    <p class="text-sm font-medium text-white">Sin agentes LSPD vinculados</p>
                    <p class="mt-2 text-sm text-ink-400">Vincula fichas clínicas a personajes con organización LSPD para poblar este directorio.</p>
                  </div>
                `
            }
          </div>
        `;

        panel.querySelector('#directory-search')?.addEventListener('submit', (event) => {
          event.preventDefault();
          void renderDirectory(panel.querySelector('#directory-query')?.value ?? '');
        });
        panel.querySelectorAll('[data-open-agent]').forEach((button) => {
          button.addEventListener('click', () =>
            void openAgent(button.getAttribute('data-open-agent')),
          );
        });
      };

      const renderFinance = async (params = { days: 7 }) => {
        panel.innerHTML = `<p class="text-sm text-ink-400">Calculando facturación institucional…</p>`;
        const data = await getLspdFinance(params);
        panel.innerHTML = `
          <div class="rounded-3xl border border-white/10 p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 class="text-sm font-semibold text-white">Facturación LSPD → SAED</h3>
                <p class="mt-1 text-xs text-ink-400">Basada en snapshots institucionales al emitir cada factura.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                ${[7, 15, 30]
                  .map(
                    (days) => `
                      <button type="button" data-finance-days="${days}"
                        class="rounded-full border px-3 py-1.5 text-xs ${
                          Number(params.days) === days && !params.from
                            ? 'border-brand-400/40 bg-brand-500/15 text-white'
                            : 'border-white/10 text-ink-300'
                        }">${days} días</button>
                    `,
                  )
                  .join('')}
              </div>
            </div>
            <form id="finance-custom" class="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label class="form-label" for="finance-from">Desde</label>
                <input id="finance-from" type="date" class="form-input" value="${escapeHtml(params.from ?? '')}" />
              </div>
              <div>
                <label class="form-label" for="finance-to">Hasta</label>
                <input id="finance-to" type="date" class="form-input" value="${escapeHtml(params.to ?? '')}" />
              </div>
              <div class="flex items-end">
                <button type="submit" class="btn-secondary w-full">Rango personalizado</button>
              </div>
            </form>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            ${metric(`Total (${data.range.from} → ${data.range.to})`, `$${formatMoney(data.summary.totalBilled)}`, 'success')}
            ${metric('Facturas', data.summary.invoiceCount)}
            ${metric('Promedio', `$${formatMoney(data.summary.averageInvoice)}`)}
            ${metric('Agentes atendidos', data.summary.agentsServed)}
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            ${metric('Últimos 7 días', `$${formatMoney(data.presets.days7)}`)}
            ${metric('Últimos 15 días', `$${formatMoney(data.presets.days15)}`)}
            ${metric('Últimos 30 días', `$${formatMoney(data.presets.days30)}`)}
          </div>

          <section class="mt-6 overflow-hidden rounded-3xl border border-white/10">
            <div class="border-b border-white/10 px-5 py-4">
              <h3 class="text-sm font-semibold text-white">Detalle del período</h3>
              <p class="mt-1 text-xs text-ink-500">Última factura: ${escapeHtml(formatDateLabel(data.summary.lastInvoiceAt))}${data.summary.lastInvoiceNumber ? ` · #${data.summary.lastInvoiceNumber}` : ''}</p>
            </div>
            <div class="divide-y divide-white/5">
              ${
                data.invoices.length
                  ? data.invoices
                      .map(
                        (invoice) => `
                          <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                            <div>
                              <p class="text-sm text-white">${escapeHtml(invoice.patient.fullName)}</p>
                              <p class="mt-1 text-xs text-ink-500">${escapeHtml(formatDateLabel(invoice.issuedAt))} · ${escapeHtml(invoice.treatmentName)} · ${escapeHtml(invoice.billingOrganization || 'LSPD')}</p>
                            </div>
                            <p class="text-sm font-semibold text-brand-300">$${formatMoney(invoice.amount)}</p>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="px-5 py-6 text-sm text-ink-400">No hay facturas en el período seleccionado.</p>`
              }
            </div>
          </section>
        `;

        panel.querySelectorAll('[data-finance-days]').forEach((button) => {
          button.addEventListener('click', () =>
            void renderFinance({ days: Number(button.getAttribute('data-finance-days')) }),
          );
        });
        panel.querySelector('#finance-custom')?.addEventListener('submit', (event) => {
          event.preventDefault();
          void renderFinance({
            from: panel.querySelector('#finance-from').value,
            to: panel.querySelector('#finance-to').value,
          });
        });
      };

      const renderAccess = async () => {
        panel.innerHTML = `<p class="text-sm text-ink-400">Cargando solicitudes…</p>`;
        const rows = await listMedicalRecordAccessRequests();
        panel.innerHTML = `
          <section class="rounded-3xl border border-white/10 overflow-hidden">
            <div class="border-b border-white/10 px-5 py-4">
              <h3 class="text-sm font-semibold text-white">Solicitudes de expediente médico</h3>
              <p class="mt-1 text-xs text-ink-400">Accesos temporales de 24 horas. Historial completo y auditado.</p>
            </div>
            <div class="divide-y divide-white/5">
              ${
                rows.length
                  ? rows
                      .map(
                        (item) => `
                          <article class="px-5 py-4">
                            <div class="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p class="text-sm font-medium text-white">${escapeHtml(item.patient.fullName)}</p>
                                <p class="mt-1 text-xs text-ink-500">
                                  #${item.requestNumber} · ${escapeHtml(item.requesterCharacter.firstName)} ${escapeHtml(item.requesterCharacter.lastName)}
                                  · ${escapeHtml(item.requesterOrganization)}
                                </p>
                              </div>
                              ${renderTonePill(
                                item.status,
                                item.status === 'APPROVED'
                                  ? 'success'
                                  : item.status === 'REJECTED' || item.status === 'REVOKED'
                                    ? 'danger'
                                    : item.status === 'PENDING'
                                      ? 'warn'
                                      : 'neutral',
                              )}
                            </div>
                            <p class="mt-3 text-sm text-ink-300">${escapeHtml(item.reason)}</p>
                            <p class="mt-2 text-xs text-ink-500">
                              Creada ${escapeHtml(formatDateTimeLabel(item.createdAt))}
                              ${item.expiresAt ? ` · Expira ${escapeHtml(formatDateTimeLabel(item.expiresAt))}` : ''}
                            </p>
                            ${
                              canReviewAccess && item.status === 'PENDING'
                                ? `
                                  <div class="mt-3 flex flex-wrap gap-2">
                                    <button type="button" class="btn-primary !py-1.5 !px-3 text-xs" data-approve-access="${item.id}">Aprobar 24h</button>
                                    <button type="button" class="btn-secondary !py-1.5 !px-3 text-xs" data-reject-access="${item.id}">Rechazar</button>
                                  </div>
                                `
                                : ''
                            }
                          </article>
                        `,
                      )
                      .join('')
                  : `<p class="px-5 py-6 text-sm text-ink-400">No hay solicitudes registradas.</p>`
              }
            </div>
          </section>
        `;

        panel.querySelectorAll('[data-approve-access]').forEach((button) => {
          button.addEventListener('click', async () => {
            try {
              await approveMedicalRecordAccessRequest(button.getAttribute('data-approve-access'));
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'success',
                message: 'Acceso aprobado por 24 horas.',
              });
              await renderAccess();
            } catch (error) {
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        });
        panel.querySelectorAll('[data-reject-access]').forEach((button) => {
          button.addEventListener('click', async () => {
            try {
              await rejectMedicalRecordAccessRequest(button.getAttribute('data-reject-access'));
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'success',
                message: 'Solicitud rechazada.',
              });
              await renderAccess();
            } catch (error) {
              setAuthAlert({
                root,
                id: 'lspd-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        });
      };

      const renderTab = async () => {
        try {
          if (activeTab === 'overview') await renderOverview();
          else if (activeTab === 'directory') await renderDirectory();
          else if (activeTab === 'finance') await renderFinance({ days: 7 });
          else if (activeTab === 'access') await renderAccess();
        } catch (error) {
          panel.innerHTML = `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      const patientParam = params.get('patient');
      void renderTab().then(() => {
        if (patientParam && canInterop) void openAgent(patientParam);
      });

      return cleanupLayout;
    },
  };
}
