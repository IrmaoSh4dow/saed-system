import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  renderAverageStars,
  renderStarRating,
} from '../components/ratings/star-rating.js';
import { renderOfficerFiche } from '../components/staff/staff-fiche.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { getStaffProfileRatings } from '../services/staff-ratings.service.js';
import { getOfficer } from '../services/staff.service.js';
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

export function officerDetailPage(staffId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.STAFF_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'staff-detail-alert' })}
      <a data-link href="/staff" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al directorio</a>
      <div id="staff-detail-root">
        <p class="text-sm text-ink-400">Cargando ficha...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Personal',
      currentPath: '/staff',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Personal · SAED';

      void getOfficer(staffId)
        .then(async (officer) => {
          const host = root.querySelector('#staff-detail-root');
          if (!host) {
            return;
          }

          let ratingsHtml = '';
          if (can(PERMISSIONS.STAFF_RATINGS_READ)) {
            try {
              const ratings = await getStaffProfileRatings(staffId, { take: 8 });
              ratingsHtml = `
                <section class="mt-6 rounded-3xl border border-white/10 p-5 md:p-6">
                  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p class="text-[11px] uppercase tracking-wide text-ink-500">Calidad asistencial</p>
                      <h3 class="mt-1 text-lg font-semibold text-white">Valoraciones del profesional</h3>
                      <p class="mt-1 text-xs text-ink-500">Visible únicamente para Altos Mandos.</p>
                    </div>
                    ${renderAverageStars(ratings.summary.averageScore, ratings.summary.totalRatings)}
                  </div>
                  <div class="mt-5 space-y-3">
                    ${
                      ratings.items.length
                        ? ratings.items
                            .map(
                              (item) => `
                                <article class="rounded-2xl border border-white/10 px-4 py-3">
                                  <div class="flex flex-wrap items-center justify-between gap-2">
                                    ${renderStarRating({ value: item.score, interactive: false, size: 'sm', label: '' })}
                                    <p class="text-xs text-ink-500">${escapeHtml(formatDateTimeLabel(item.createdAt))}</p>
                                  </div>
                                  <p class="mt-2 text-sm text-ink-200">${escapeHtml(item.comment || 'Sin comentario')}</p>
                                </article>
                              `,
                            )
                            .join('')
                        : `<p class="text-sm text-ink-400">Este profesional todavía no tiene valoraciones.</p>`
                    }
                  </div>
                  <a data-link href="/staff-ratings" class="mt-4 inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">Ver dashboard de valoraciones →</a>
                </section>
              `;
            } catch {
              ratingsHtml = '';
            }
          }

          host.innerHTML = `${renderOfficerFiche(officer)}${ratingsHtml}`;
          const name =
            `${officer.character?.firstName ?? ''} ${officer.character?.lastName ?? ''}`.trim();
          document.title = `${name || 'Personal'} · SAED`;
        })
        .catch((error) => {
          setAuthAlert(root, {
            id: 'staff-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
          const host = root.querySelector('#staff-detail-root');
          if (host) {
            host.innerHTML = `<p class="text-sm text-ink-400">No se pudo cargar la ficha del personal.</p>`;
          }
        });

      return cleanupLayout;
    },
  };
}
