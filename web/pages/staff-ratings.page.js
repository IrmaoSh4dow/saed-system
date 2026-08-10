import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  renderAverageStars,
  renderStarRating,
} from '../components/ratings/star-rating.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  getStaffProfileRatings,
  getStaffRatingsDashboard,
} from '../services/staff-ratings.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function metric(label, value) {
  return `
    <article class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-white">${escapeHtml(String(value))}</p>
    </article>
  `;
}

function staffRow(item) {
  if (!item?.staff) return '';
  return `
    <button type="button" data-open-staff="${escapeHtml(item.staff.id)}"
      class="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-left transition hover:border-brand-400/30 hover:bg-brand-500/5">
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-white">${escapeHtml(item.staff.fullName)}</p>
        <p class="mt-1 text-xs text-ink-500">Nº ${escapeHtml(item.staff.employeeNumber)}</p>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-amber-200">${item.averageScore?.toFixed?.(1) ?? '—'}</p>
        <p class="text-[11px] text-ink-500">${item.totalRatings} val.</p>
      </div>
    </button>
  `;
}

export function staffRatingsPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.STAFF_RATINGS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'staff-ratings-alert' })}
      <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(217,30,30,0.16),_transparent_42%)]"></div>
        <div class="relative p-6 md:p-8">
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">Calidad asistencial</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-white">Valoraciones</h1>
          <p class="mt-3 max-w-2xl text-sm text-ink-300">
            Historial confidencial de la calidad percibida por ciudadanos tras citas médicas y administrativas finalizadas.
            Visible únicamente para Altos Mandos.
          </p>
        </div>
      </section>
      <div id="ratings-root">
        <p class="text-sm text-ink-400">Cargando dashboard de valoraciones…</p>
      </div>
      <div id="ratings-staff-panel" class="hidden"></div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Valoraciones',
      currentPath: '/staff-ratings',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      const host = root.querySelector('#ratings-root');
      const staffPanel = root.querySelector('#ratings-staff-panel');

      const openStaff = async (staffProfileId) => {
        try {
          const data = await getStaffProfileRatings(staffProfileId, { take: 30 });
          staffPanel.classList.remove('hidden');
          staffPanel.innerHTML = `
            <section class="rounded-3xl border border-white/10 p-5 md:p-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-ink-500">Perfil profesional</p>
                  <h2 class="mt-1 text-xl font-semibold text-white">${escapeHtml(data.staff.fullName)}</h2>
                  <p class="mt-1 text-sm text-ink-400">Nº ${escapeHtml(data.staff.employeeNumber)}</p>
                </div>
                ${renderAverageStars(data.summary.averageScore, data.summary.totalRatings)}
              </div>
              <div class="mt-6 grid gap-2 sm:grid-cols-5">
                ${[5, 4, 3, 2, 1]
                  .map((score) => {
                    const count = data.summary.distribution?.[score] ?? 0;
                    const total = data.summary.totalRatings || 1;
                    const pct = Math.round((count / total) * 100);
                    return `
                      <div class="rounded-xl border border-white/10 px-3 py-2">
                        <p class="text-xs text-ink-500">${score}★</p>
                        <p class="mt-1 text-sm font-semibold text-white">${count}</p>
                        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div class="h-full rounded-full bg-amber-400/80" style="width:${pct}%"></div>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
              <div class="mt-6 space-y-3">
                <h3 class="text-sm font-semibold text-white">Últimos comentarios</h3>
                ${
                  data.items.length
                    ? data.items
                        .map(
                          (item) => `
                            <article class="rounded-2xl border border-white/10 px-4 py-3">
                              <div class="flex flex-wrap items-center justify-between gap-2">
                                ${renderStarRating({ value: item.score, interactive: false, size: 'sm', label: '' })}
                                <p class="text-xs text-ink-500">${escapeHtml(formatDateTimeLabel(item.createdAt))}</p>
                              </div>
                              <p class="mt-2 text-sm text-ink-200">${escapeHtml(item.comment || 'Sin comentario')}</p>
                              <p class="mt-2 text-xs text-ink-500">
                                ${escapeHtml(item.reviewerCharacter.fullName)}
                                · Solicitud #${item.adminRequest.requestNumber}
                              </p>
                            </article>
                          `,
                        )
                        .join('')
                    : `<p class="text-sm text-ink-400">Aún no hay valoraciones para este profesional.</p>`
                }
              </div>
            </section>
          `;
          staffPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
          setAuthAlert(root, {
            id: 'staff-ratings-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      const load = async () => {
        try {
          const data = await getStaffRatingsDashboard();
          host.innerHTML = `
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              ${metric('Promedio hospital', data.hospitalAverage?.toFixed?.(1) ?? '—')}
              ${metric('Total valoraciones', data.totalRatings)}
              ${metric('Este mes', data.ratingsThisMonth)}
              ${metric('Pendientes', data.pendingRatings)}
            </div>
            <div class="mt-6 grid gap-4 xl:grid-cols-2">
              <section class="rounded-3xl border border-white/10 p-5">
                <h3 class="text-sm font-semibold text-white">Mejor valorados</h3>
                <div class="mt-4 space-y-2">
                  ${data.topRated?.map(staffRow).join('') || `<p class="text-sm text-ink-400">Sin datos aún.</p>`}
                </div>
              </section>
              <section class="rounded-3xl border border-white/10 p-5">
                <h3 class="text-sm font-semibold text-white">Con más valoraciones</h3>
                <div class="mt-4 space-y-2">
                  ${data.mostRated?.map(staffRow).join('') || `<p class="text-sm text-ink-400">Sin datos aún.</p>`}
                </div>
              </section>
            </div>
            <section class="mt-6 rounded-3xl border border-white/10 p-5">
              <h3 class="text-sm font-semibold text-white">Actividad reciente</h3>
              <div class="mt-4 space-y-3">
                ${
                  data.recent?.length
                    ? data.recent
                        .map(
                          (item) => `
                            <article class="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3">
                              <div class="min-w-0">
                                <p class="text-sm font-medium text-white">${escapeHtml(item.staffProfile.fullName)}</p>
                                <p class="mt-1 text-xs text-ink-500">
                                  ${escapeHtml(item.reviewerCharacter.fullName)}
                                  · #${item.adminRequest.requestNumber}
                                  · ${escapeHtml(formatDateTimeLabel(item.createdAt))}
                                </p>
                                ${item.comment ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(item.comment)}</p>` : ''}
                              </div>
                              ${renderStarRating({ value: item.score, interactive: false, size: 'sm', label: '' })}
                            </article>
                          `,
                        )
                        .join('')
                    : `<p class="text-sm text-ink-400">Todavía no hay valoraciones registradas.</p>`
                }
              </div>
            </section>
          `;

          host.querySelectorAll('[data-open-staff]').forEach((button) => {
            button.addEventListener('click', () =>
              void openStaff(button.getAttribute('data-open-staff')),
            );
          });
        } catch (error) {
          host.innerHTML = `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      void load();
      return cleanup;
    },
  };
}
