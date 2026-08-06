import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { bindDutyClocks, renderDutyClockPanel } from '../components/shifts/duty-clock.js';
import { renderEmptyState } from '../components/ui/empty-state.js';
import { renderPageHeader } from '../components/ui/page-header.js';
import { renderSummaryStrip } from '../components/ui/summary-strip.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  clockInShift,
  clockOutShift,
  formatShiftDuration,
  formatShiftHours,
  getCurrentShift,
  getShiftStats,
  listShiftHistory,
  resolveBrowserTimezone,
} from '../services/shifts.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function shiftsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.SHIFTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'shifts-alert' })}
      ${renderPageHeader({
        eyebrow: 'Operaciones',
        title: 'Gestión de turnos',
        description:
          'Registra tu entrada y salida de servicio. El tiempo se calcula automáticamente y queda persistido en tu historial.',
      })}

      <div id="shifts-summary">
        ${renderSummaryStrip([
          { label: 'Turnos', value: '—' },
          { label: 'Total', value: '—', tone: 'brand' },
          { label: 'Esta semana', value: '—' },
          { label: 'Este mes', value: '—', tone: 'warning' },
        ])}
      </div>

      <section id="shifts-control" class="panel relative overflow-hidden p-6 md:p-8">
        <p class="text-sm text-ink-400">Cargando estado de servicio...</p>
      </section>

      <section class="panel overflow-hidden">
        <div class="border-b border-white/8 px-5 py-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">Historial</p>
          <h3 class="mt-1 text-sm font-semibold text-white">Tus turnos recientes</h3>
        </div>
        <div id="shifts-history" class="p-4 md:p-5">
          <p class="text-sm text-ink-400">Cargando historial...</p>
        </div>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Turnos', currentPath: '/shifts' }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Turnos · SAED';
      let clockCleanup = null;
      let loadingAction = false;

      const paint = async () => {
        try {
          const [current, stats, history] = await Promise.all([
            getCurrentShift(),
            getShiftStats(),
            listShiftHistory(40),
          ]);

          const summary = root.querySelector('#shifts-summary');
          if (summary) {
            summary.innerHTML = renderSummaryStrip([
              { label: 'Turnos', value: String(stats.totalShifts ?? 0) },
              {
                label: 'Total trabajado',
                value: formatShiftHours(stats.totalSeconds ?? 0),
                tone: 'brand',
              },
              { label: 'Esta semana', value: formatShiftHours(stats.weekSeconds ?? 0) },
              {
                label: 'Este mes',
                value: formatShiftHours(stats.monthSeconds ?? 0),
                tone: 'warning',
              },
            ]);
          }

          const control = root.querySelector('#shifts-control');
          if (control) {
            const isOnDuty = Boolean(current.isOnDuty);
            const staff = current.staff ?? {};
            control.innerHTML = `
              <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.12),_transparent_45%)]"></div>
              <div class="relative space-y-6">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">Duty Desk</p>
                    <h3 class="mt-2 text-2xl font-semibold text-white">${escapeHtml(staff.fullName ?? 'Personal SAED')}</h3>
                    <p class="mt-2 text-sm text-ink-300">
                      ${escapeHtml(staff.rankName ?? '—')}
                      <span class="text-ink-500"> · </span>
                      ${escapeHtml(staff.departmentName ?? '—')}
                      <span class="text-ink-500"> · </span>
                      Nº ${escapeHtml(staff.employeeNumber ?? '—')}
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="status-pill ${isOnDuty ? 'status-pill-success' : ''}">
                      ${isOnDuty ? 'En Servicio' : 'Fuera de Servicio'}
                    </span>
                    ${
                      isOnDuty
                        ? `<button type="button" id="shift-clock-out" class="btn-primary !py-2.5">Salir de Servicio</button>`
                        : `<button type="button" id="shift-clock-in" class="btn-primary !py-2.5">Entrar de Servicio</button>`
                    }
                  </div>
                </div>

                ${renderDutyClockPanel({
                  isOnDuty,
                  startedAt: current.currentShift?.startedAt ?? null,
                })}

                ${
                  stats.lastShift
                    ? `
                  <div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-ink-300">
                    Último turno cerrado:
                    <span class="text-white">${formatDateTime(stats.lastShift.startedAt)}</span>
                    · duración
                    <span class="text-brand-300">${formatShiftDuration(stats.lastShift.durationSeconds ?? 0)}</span>
                  </div>
                `
                    : ''
                }
              </div>
            `;
          }

          clockCleanup?.();
          clockCleanup = bindDutyClocks(root);

          root.querySelector('#shift-clock-in')?.addEventListener('click', () => {
            void runAction(() => clockInShift(resolveBrowserTimezone()), 'Entrada registrada.');
          });
          root.querySelector('#shift-clock-out')?.addEventListener('click', () => {
            void runAction(() => clockOutShift(resolveBrowserTimezone()), 'Salida registrada.');
          });

          const historyHost = root.querySelector('#shifts-history');
          const items = history?.items ?? [];
          if (historyHost) {
            historyHost.innerHTML = items.length
              ? `<div class="record-feed">${items.map((item) => renderHistoryCard(item)).join('')}</div>`
              : renderEmptyState({
                  title: 'Sin turnos registrados',
                  description: 'Cuando entres de servicio, tu historial aparecerá aquí.',
                  iconName: 'file',
                });
          }
        } catch (error) {
          setAuthAlert(root, {
            id: 'shifts-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo cargar el módulo de turnos.'),
          });
        }
      };

      const runAction = async (action, successMessage) => {
        if (loadingAction) return;
        loadingAction = true;
        try {
          await action();
          setAuthAlert(root, {
            id: 'shifts-alert',
            type: 'success',
            message: successMessage,
          });
          await paint();
        } catch (error) {
          setAuthAlert(root, {
            id: 'shifts-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo actualizar el turno.'),
          });
        } finally {
          loadingAction = false;
        }
      };

      void paint();

      return () => {
        clockCleanup?.();
        cleanupLayout?.();
      };
    },
  };
}

function renderHistoryCard(item) {
  const open = item.status === 'OPEN' || item.isOpen;
  return `
    <article class="record-card">
      <div class="record-card-rail ${open ? 'record-card-rail-brand' : 'record-card-rail-muted'}"></div>
      <div class="record-card-body">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
              ${formatDateLabel(item.startedAt)}
            </p>
            <p class="mt-2 text-sm text-white">
              ${formatTimeLabel(item.startedAt)}
              <span class="text-ink-500"> → </span>
              ${item.endedAt ? formatTimeLabel(item.endedAt) : 'En curso'}
            </p>
          </div>
          <div class="text-right">
            <span class="status-pill ${open ? 'status-pill-success' : ''}">${open ? 'Abierto' : 'Cerrado'}</span>
            <p class="mt-2 font-mono text-sm text-brand-300">${formatShiftDuration(item.durationSeconds ?? elapsedUntilNow(item.startedAt))}</p>
          </div>
        </div>
      </div>
    </article>
  `;
}

function elapsedUntilNow(startedAt) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

function formatDateLabel(value) {
  return new Date(value).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLabel(value) {
  return new Date(value).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDateTime(value) {
  return `${formatDateLabel(value)} ${formatTimeLabel(value)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
