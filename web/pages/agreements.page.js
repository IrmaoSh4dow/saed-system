import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { renderEstablishmentAgreementCard } from '../components/agreements/establishment-card.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import {
  activateAgreement,
  createAgreement,
  deactivateAgreement,
  formatDiscountPercent,
  getAgreement,
  getAgreementsDashboard,
  listAgreementDirectory,
  updateAgreement,
} from '../services/agreements.service.js';
import { getEstablishment } from '../services/establishments.service.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { resolveUploadUrl } from '../utils/media.js';

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

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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

export function agreementsPage() {
  if (!can(PERMISSIONS.AGREEMENTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const canManage = can(PERMISSIONS.AGREEMENTS_MANAGE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'agreements-alert' })}

      <section class="panel relative overflow-hidden p-6 md:p-8">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.14),_transparent_45%)]"></div>
        <div class="relative">
          <p class="landing-eyebrow">Relaciones institucionales</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">Convenios Empresariales</h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300">
            Catálogo de establecimientos afiliados al SAED, descuentos vigentes y trazabilidad
            preparada para facturación clínica.
          </p>
        </div>
      </section>

      <section id="agreements-summary" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"></section>

      <section class="panel p-5">
        <form id="agreements-search-form" class="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label class="form-label" for="agreements-query">Buscar establecimiento</label>
            <input id="agreements-query" class="form-input" placeholder="UwU Café, Burger Shot…" />
          </div>
          <div class="flex items-end">
            <label class="inline-flex items-center gap-2 text-sm text-ink-300">
              <input id="agreements-only-affiliated" type="checkbox" class="rounded border-white/20 bg-surface-950" />
              Solo afiliados
            </label>
          </div>
          <div class="flex items-end">
            <button type="submit" class="btn-primary w-full">Buscar</button>
          </div>
          <div class="flex items-end">
            <button type="button" id="agreements-search-clear" class="btn-secondary w-full">Limpiar</button>
          </div>
        </form>
      </section>

      <section id="agreements-grid" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"></section>

      <div id="agreements-drawer" class="hidden fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-close-drawer></div>
        <aside class="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-white/10 bg-surface-950 shadow-2xl">
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
      title: 'Convenios Empresariales',
      currentPath: '/agreements',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      const drawer = root.querySelector('#agreements-drawer');
      const drawerBody = root.querySelector('#drawer-body');
      const drawerTitle = root.querySelector('#drawer-title');

      const closeDrawer = () => drawer?.classList.add('hidden');
      const openDrawer = (title, html) => {
        if (drawerTitle) drawerTitle.textContent = title;
        if (drawerBody) drawerBody.innerHTML = html;
        drawer?.classList.remove('hidden');
      };

      root.querySelectorAll('[data-close-drawer]').forEach((el) => {
        el.addEventListener('click', closeDrawer);
      });

      const loadSummary = async () => {
        const summary = root.querySelector('#agreements-summary');
        if (!summary) return;
        try {
          const data = await getAgreementsDashboard();
          summary.innerHTML = [
            metricCard('Convenios activos', data.activeAgreements, 'success'),
            metricCard('Convenios vencidos', data.expiredAgreements, 'warn'),
            metricCard('Empresas afiliadas', data.affiliatedEstablishments),
            metricCard('Sin convenio', data.establishmentsWithoutAgreement),
            metricCard('Pacientes con convenio', data.patientsWithAgreement),
            metricCard(
              'Descuentos este mes',
              `$${formatMoney(data.discountsThisMonth?.discountTotal ?? 0)}`,
              'success',
            ),
            metricCard('Borradores', data.draftAgreements),
            metricCard('Inactivos', data.inactiveAgreements),
          ].join('');
        } catch (error) {
          summary.innerHTML = `<p class="text-sm text-rose-300 sm:col-span-2 xl:col-span-4">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      const bindCardActions = () => {
        root.querySelectorAll('[data-open-establishment]').forEach((button) => {
          button.addEventListener('click', async () => {
            const id = button.getAttribute('data-open-establishment');
            try {
              const detail = can(PERMISSIONS.ESTABLISHMENTS_READ)
                ? await getEstablishment(id)
                : (await listAgreementDirectory()).find((item) => item.id === id);
              if (!detail) throw new Error('Establecimiento no encontrado');

              const agreement = detail.activeAgreement;
              openDrawer(
                detail.name,
                `
                  <div class="space-y-5">
                    <div class="flex items-start gap-4">
                      <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        ${
                          resolveUploadUrl(detail.logoUrl)
                            ? `<img src="${escapeHtml(resolveUploadUrl(detail.logoUrl))}" alt="" class="h-full w-full object-contain p-2" />`
                            : `<span class="text-xl text-brand-300">${escapeHtml(detail.name.slice(0, 1))}</span>`
                        }
                      </div>
                      <div>
                        <p class="text-sm text-ink-400">${escapeHtml(detail.description || 'Sin descripción')}</p>
                        <p class="mt-2 text-xs text-ink-500">${detail.activeOccupationCount ?? 0} ocupaciones activas</p>
                      </div>
                    </div>
                    <section class="rounded-2xl border ${agreement ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'} p-4">
                      <p class="text-[11px] uppercase tracking-wide ${agreement ? 'text-emerald-300' : 'text-ink-500'}">
                        ${agreement ? 'Convenio activo' : 'Sin convenio activo'}
                      </p>
                      ${
                        agreement
                          ? `
                            <dl class="mt-3 grid gap-3 sm:grid-cols-2">
                              <div><dt class="text-xs text-ink-500">Descuento</dt><dd class="text-lg font-semibold text-emerald-300">${escapeHtml(formatDiscountPercent(agreement.discountPercent))}</dd></div>
                              <div><dt class="text-xs text-ink-500">Estado</dt><dd class="text-sm text-white">${escapeHtml(agreement.status)}</dd></div>
                              <div><dt class="text-xs text-ink-500">Desde</dt><dd class="text-sm text-ink-200">${escapeHtml(formatDateLabel(agreement.startsAt))}</dd></div>
                              <div><dt class="text-xs text-ink-500">Hasta</dt><dd class="text-sm text-ink-200">${escapeHtml(formatDateLabel(agreement.endsAt))}</dd></div>
                            </dl>
                            ${agreement.notes ? `<p class="mt-3 text-sm text-ink-300">${escapeHtml(agreement.notes)}</p>` : ''}
                          `
                          : `<p class="mt-2 text-sm text-ink-400">Este establecimiento aún no tiene un convenio vigente con el SAED.</p>`
                      }
                    </section>
                  </div>
                `,
              );
            } catch (error) {
              setAuthAlert(root, {
                id: 'agreements-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        });

        root.querySelectorAll('[data-manage-agreement]').forEach((button) => {
          button.addEventListener('click', async () => {
            const establishmentId = button.getAttribute('data-manage-agreement');
            const establishmentName = button.getAttribute('data-establishment-name') || '';
            const activeAgreementId = button.getAttribute('data-active-agreement') || '';
            let current = null;
            if (activeAgreementId) {
              try {
                current = await getAgreement(activeAgreementId);
              } catch {
                current = null;
              }
            }

            openDrawer(
              current ? `Editar convenio · ${establishmentName}` : `Nuevo convenio · ${establishmentName}`,
              `
                <form id="agreement-form" class="space-y-4">
                  <input type="hidden" name="establishmentId" value="${escapeHtml(establishmentId)}" />
                  <div>
                    <label class="form-label" for="agreement-percent">Porcentaje de descuento</label>
                    <input id="agreement-percent" name="discountPercent" type="number" min="0" max="100" step="0.01" class="form-input" required value="${current?.discountPercent ?? 10}" />
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="form-label" for="agreement-starts">Fecha de inicio</label>
                      <input id="agreement-starts" name="startsAt" type="date" class="form-input" required value="${current?.startsAt ?? new Date().toISOString().slice(0, 10)}" />
                    </div>
                    <div>
                      <label class="form-label" for="agreement-ends">Fecha de vencimiento</label>
                      <input id="agreement-ends" name="endsAt" type="date" class="form-input" value="${current?.endsAt ?? ''}" />
                    </div>
                  </div>
                  <div>
                    <label class="form-label" for="agreement-status">Estado</label>
                    <select id="agreement-status" name="status" class="form-input">
                      ${['ACTIVE', 'DRAFT', 'INACTIVE'].map((status) => `<option value="${status}" ${current?.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="form-label" for="agreement-notes">Observaciones</label>
                    <textarea id="agreement-notes" name="notes" class="form-input min-h-[96px]">${escapeHtml(current?.notes ?? '')}</textarea>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="submit" class="btn-primary">${current ? 'Guardar cambios' : 'Crear convenio'}</button>
                    ${
                      current?.status === 'ACTIVE'
                        ? `<button type="button" id="agreement-deactivate" class="btn-secondary">Desactivar</button>`
                        : current
                          ? `<button type="button" id="agreement-activate" class="btn-secondary">Activar</button>`
                          : ''
                    }
                  </div>
                </form>
              `,
            );

            drawerBody?.querySelector('#agreement-form')?.addEventListener('submit', async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const payload = {
                establishmentId,
                discountPercent: Number(form.discountPercent.value),
                startsAt: form.startsAt.value,
                endsAt: form.endsAt.value || null,
                status: form.status.value,
                notes: form.notes.value?.trim() || undefined,
              };

              try {
                if (current) {
                  await updateAgreement(current.id, payload);
                } else {
                  await createAgreement(payload);
                }
                setAuthAlert(root, {
                  id: 'agreements-alert',
                  type: 'success',
                  message: current ? 'Convenio actualizado.' : 'Convenio creado.',
                });
                closeDrawer();
                await refreshAgreementsView();
              } catch (error) {
                setAuthAlert(root, {
                  id: 'agreements-alert',
                  type: 'error',
                  message: getApiErrorMessage(error),
                });
              }
            });

            drawerBody?.querySelector('#agreement-deactivate')?.addEventListener('click', async () => {
              try {
                await deactivateAgreement(current.id);
                setAuthAlert(root, {
                  id: 'agreements-alert',
                  type: 'success',
                  message: 'Convenio desactivado.',
                });
                closeDrawer();
                await refreshAgreementsView();
              } catch (error) {
                setAuthAlert(root, {
                  id: 'agreements-alert',
                  type: 'error',
                  message: getApiErrorMessage(error),
                });
              }
            });

            drawerBody?.querySelector('#agreement-activate')?.addEventListener('click', async () => {
              try {
                await activateAgreement(current.id);
                setAuthAlert(root, {
                  id: 'agreements-alert',
                  type: 'success',
                  message: 'Convenio activado.',
                });
                closeDrawer();
                await refreshAgreementsView();
              } catch (error) {
                setAuthAlert(root, {
                  id: 'agreements-alert',
                  type: 'error',
                  message: getApiErrorMessage(error),
                });
              }
            });
          });
        });
      };

      const refreshAgreementsView = async () => {
        await Promise.all([
          loadSummary(),
          loadDirectory(
            root.querySelector('#agreements-query')?.value ?? '',
            Boolean(root.querySelector('#agreements-only-affiliated')?.checked),
          ),
        ]);
      };

      const loadDirectory = async (q = '', onlyAffiliated = false) => {
        const grid = root.querySelector('#agreements-grid');
        if (!grid) return;
        grid.innerHTML = `<p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">Cargando establecimientos…</p>`;
        try {
          const items = await listAgreementDirectory({ q, onlyAffiliated: onlyAffiliated ? 'true' : undefined });
          grid.innerHTML = items.length
            ? items.map((item) => renderEstablishmentAgreementCard(item, { canManage })).join('')
            : `<p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">No hay establecimientos para mostrar.</p>`;
          bindCardActions();
        } catch (error) {
          grid.innerHTML = `<p class="text-sm text-rose-300 md:col-span-2 xl:col-span-3">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      root.querySelector('#agreements-search-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        void loadDirectory(
          root.querySelector('#agreements-query')?.value ?? '',
          Boolean(root.querySelector('#agreements-only-affiliated')?.checked),
        );
      });

      root.querySelector('#agreements-search-clear')?.addEventListener('click', () => {
        const input = root.querySelector('#agreements-query');
        const check = root.querySelector('#agreements-only-affiliated');
        if (input) input.value = '';
        if (check) check.checked = false;
        void loadDirectory();
      });

      void Promise.all([loadSummary(), loadDirectory()]);
      return cleanupLayout;
    },
  };
}
