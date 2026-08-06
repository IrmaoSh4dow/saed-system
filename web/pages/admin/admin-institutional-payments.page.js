import { renderAuthAlert, setAuthAlert } from '../../components/auth/auth-alert.js';
import { can } from '../../services/auth-context.js';
import { getApiErrorMessage } from '../../services/auth.service.js';
import {
  createInstitutionalPayment,
  getInstitutionalOrganization,
  getInstitutionalPaymentsDashboard,
  voidInstitutionalPayment,
} from '../../services/institutional-payments.service.js';
import { formatDateLabel, formatDateTimeLabel } from '../../utils/date.js';
import { navigate } from '../../utils/router.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function metricCard(label, value, tone = 'neutral') {
  const tones = {
    neutral: 'border-white/10 text-white',
    success: 'border-emerald-400/30 text-emerald-200',
    danger: 'border-rose-400/30 text-rose-200',
    warn: 'border-amber-400/30 text-amber-200',
    brand: 'border-brand-400/30 text-brand-200',
  };
  return `
    <article class="rounded-2xl border bg-white/[0.02] px-4 py-4 ${tones[tone] ?? tones.neutral}">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${escapeHtml(label)}</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight">${escapeHtml(String(value))}</p>
    </article>
  `;
}

export function adminInstitutionalPaymentsPage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  if (!can(PERMISSIONS.INSTITUTIONAL_PAYMENTS_READ) && !can('*') && !can(PERMISSIONS.ADMIN_ACCESS)) {
    void navigate('/admin', { replace: true });
    return { html: '', afterMount: () => {} };
  }

  const canCreate = can(PERMISSIONS.INSTITUTIONAL_PAYMENTS_CREATE) || can('*');
  const canUpdate = can(PERMISSIONS.INSTITUTIONAL_PAYMENTS_UPDATE) || can('*');
  const canVoid = can(PERMISSIONS.INSTITUTIONAL_PAYMENTS_DELETE) || can('*');
  const orgId = new URLSearchParams(window.location.search).get('org');

  const content = `
    ${renderAuthAlert({ id: 'institutional-payments-alert' })}
    <div id="institutional-payments-root" class="space-y-6">
      <p class="text-sm text-ink-400">Cargando control de pagos institucionales…</p>
    </div>
  `;

  return {
    html: renderAdminShell(content, {
      title: 'Pagos institucionales',
      currentPath: '/admin/institutional-payments',
    }),
    afterMount(root) {
      const cleanup = mountAdminPage(root, 'Pagos institucionales');

      const paint = async () => {
        const host = root.querySelector('#institutional-payments-root');
        if (!host) return;

        try {
          if (orgId) {
            const detail = await getInstitutionalOrganization(orgId);
            host.innerHTML = renderOrganizationDetail(detail, { canCreate, canUpdate, canVoid });
            bindOrganizationActions(root, detail, { canCreate, canVoid, reload: paint });
          } else {
            const dashboard = await getInstitutionalPaymentsDashboard();
            host.innerHTML = renderDashboard(dashboard, { canCreate });
            bindDashboardActions(root, dashboard, { canCreate, reload: paint });
          }
        } catch (error) {
          host.innerHTML = `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      void paint();
      return cleanup;
    },
  };
}

function renderDashboard(dashboard, { canCreate }) {
  const summary = dashboard.summary ?? {};
  const organizations = dashboard.organizations ?? [];
  const totalBilled = Number(summary.totalBilled || 0);
  const totalPaid = Number(summary.totalPaid || 0);
  const paidRatio = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;

  return `
    <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950 p-5 md:p-7">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.14),_transparent_45%)]"></div>
      <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="landing-eyebrow">Finanzas SAED</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">Control de pagos institucionales</h2>
          <p class="mt-2 max-w-2xl text-sm text-ink-300">
            Ledger independiente de facturación. Registra pagos por organización, conserva historial y calcula saldos sin alterar facturas.
          </p>
        </div>
        ${
          canCreate
            ? `<button type="button" id="open-payment-form" class="btn-primary">Registrar pago</button>`
            : ''
        }
      </div>
      <div class="relative mt-6 h-3 overflow-hidden rounded-full bg-white/5">
        <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300" style="width:${paidRatio}%"></div>
      </div>
      <p class="relative mt-2 text-xs text-ink-500">${paidRatio}% del total facturado ya está cubierto por pagos activos.</p>
    </section>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      ${metricCard('Total facturado', `$${formatMoney(summary.totalBilled)}`, 'brand')}
      ${metricCard('Total pagado', `$${formatMoney(summary.totalPaid)}`, 'success')}
      ${metricCard('Saldo pendiente', `$${formatMoney(summary.outstanding)}`, summary.outstanding > 0 ? 'danger' : 'success')}
      ${metricCard('Pagos registrados', summary.paymentCount ?? 0)}
      ${metricCard('Con deuda', summary.organizationsWithDebt ?? 0, 'warn')}
      ${metricCard('Al día', summary.organizationsCurrent ?? 0, 'success')}
      ${metricCard(
        'Último pago',
        summary.lastPayment
          ? `${summary.lastPayment.organizationName} · $${formatMoney(summary.lastPayment.amount)}`
          : '—',
      )}
      ${metricCard('Organizaciones', summary.organizationsTracked ?? 0)}
    </section>

    ${
      canCreate
        ? `
      <section id="payment-form-panel" class="hidden panel p-5 md:p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-white">Registrar pago institucional</h3>
            <p class="mt-1 text-xs text-ink-400">Monto manual + período cubierto. Opcionalmente puedes vincular facturas en el detalle de la organización.</p>
          </div>
          <button type="button" id="close-payment-form" class="btn-secondary !py-1.5 text-xs">Cerrar</button>
        </div>
        ${renderPaymentForm(dashboard.catalog?.length ? dashboard.catalog : organizations)}
      </section>
    `
        : ''
    }

    <section class="panel p-5 md:p-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 class="text-sm font-semibold text-white">Organizaciones</h3>
          <p class="mt-1 text-xs text-ink-400">Estado financiero por establecimiento con actividad de facturación o pagos.</p>
        </div>
      </div>
      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${
          organizations.length
            ? organizations.map((org) => renderOrganizationCard(org)).join('')
            : `<p class="text-sm text-ink-400 md:col-span-2 xl:col-span-3">Aún no hay actividad institucional registrada.</p>`
        }
      </div>
    </section>
  `;
}

function renderOrganizationCard(org) {
  const tone = org.isIndebted
    ? 'border-rose-400/25 bg-rose-500/[0.06]'
    : org.isCurrent
      ? 'border-emerald-400/25 bg-emerald-500/[0.06]'
      : 'border-white/10 bg-white/[0.02]';
  return `
    <a data-link href="/admin/institutional-payments?org=${org.establishmentId}"
      class="group rounded-3xl border ${tone} p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400/40">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-base font-semibold text-white">${escapeHtml(org.name)}</p>
          <p class="mt-1 text-xs uppercase tracking-wide text-ink-500">${escapeHtml(org.slug)}</p>
        </div>
        <span class="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
          org.isIndebted
            ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
            : org.isCurrent
              ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
              : 'border-white/10 text-ink-400'
        }">
          ${org.isIndebted ? 'Con deuda' : org.isCurrent ? 'Al día' : 'Sin actividad'}
        </span>
      </div>
      <dl class="mt-5 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-2xl border border-white/10 bg-black/20 px-2 py-3">
          <dt class="text-[10px] uppercase tracking-wide text-ink-500">Facturado</dt>
          <dd class="mt-1 text-sm font-semibold text-white">$${formatMoney(org.totalBilled)}</dd>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 px-2 py-3">
          <dt class="text-[10px] uppercase tracking-wide text-ink-500">Pagado</dt>
          <dd class="mt-1 text-sm font-semibold text-emerald-200">$${formatMoney(org.totalPaid)}</dd>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 px-2 py-3">
          <dt class="text-[10px] uppercase tracking-wide text-ink-500">Pendiente</dt>
          <dd class="mt-1 text-sm font-semibold ${org.outstanding > 0 ? 'text-rose-200' : 'text-white'}">$${formatMoney(org.outstanding)}</dd>
        </div>
      </dl>
      <p class="mt-4 text-[11px] text-ink-500">
        ${org.lastPayment ? `Último pago ${escapeHtml(formatDateLabel(org.lastPayment.paymentDate))} · $${formatMoney(org.lastPayment.amount)}` : 'Sin pagos registrados'}
      </p>
      <p class="mt-3 text-xs font-medium text-brand-300 opacity-0 transition group-hover:opacity-100">Abrir ficha financiera →</p>
    </a>
  `;
}

function renderOrganizationDetail(detail, { canCreate, canVoid }) {
  const summary = detail.summary ?? {};
  const invoices = detail.invoices ?? [];
  const payments = detail.payments ?? [];
  const establishment = detail.establishment ?? {};
  const openInvoices = invoices.filter((item) => Number(item.remaining) > 0.009);

  return `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <a data-link href="/admin/institutional-payments" class="text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al panel</a>
      ${canCreate ? `<button type="button" id="toggle-org-payment-form" class="btn-primary">Registrar pago</button>` : ''}
    </div>

    <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950 p-5 md:p-7">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.12),_transparent_50%)]"></div>
      <div class="relative">
        <p class="landing-eyebrow">Organización</p>
        <h2 class="mt-1 text-3xl font-semibold tracking-tight text-white">${escapeHtml(establishment.name)}</h2>
        <p class="mt-2 text-sm text-ink-400">Slug · ${escapeHtml(establishment.slug)}</p>
      </div>
      <div class="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${metricCard('Facturado', `$${formatMoney(summary.totalBilled)}`, 'brand')}
        ${metricCard('Pagado', `$${formatMoney(summary.totalPaid)}`, 'success')}
        ${metricCard('Saldo actual', `$${formatMoney(summary.outstanding)}`, summary.outstanding > 0 ? 'danger' : 'success')}
        ${metricCard('Pagos', summary.paymentCount ?? 0)}
      </div>
    </section>

    ${
      canCreate
        ? `
      <section id="org-payment-form-panel" class="hidden panel p-5 md:p-6">
        <h3 class="text-sm font-semibold text-white">Nuevo pago · ${escapeHtml(establishment.name)}</h3>
        ${renderPaymentForm([{ establishmentId: establishment.id, name: establishment.name }], {
          fixedEstablishmentId: establishment.id,
          invoices: openInvoices,
        })}
      </section>
    `
        : ''
    }

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Facturas emitidas</h3>
        <p class="mt-1 text-xs text-ink-400">Snapshot de facturación institucional. Remaining = no reconciliado por allocations.</p>
        <div class="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
          ${
            invoices.length
              ? invoices
                  .map(
                    (invoice) => `
                      <div class="rounded-2xl border border-white/10 px-3 py-3">
                        <div class="flex items-start justify-between gap-3">
                          <div>
                            <p class="text-sm font-medium text-white">#${invoice.invoiceNumber} · ${escapeHtml(invoice.treatmentName)}</p>
                            <p class="mt-1 text-xs text-ink-400">
                              ${escapeHtml(formatDateLabel(invoice.issuedAt))} · ${escapeHtml(invoice.patient.fullName)} · HC ${invoice.patient.recordNumber}
                            </p>
                          </div>
                          <p class="text-sm font-semibold text-brand-300">$${formatMoney(invoice.amount)}</p>
                        </div>
                        <p class="mt-2 text-[11px] text-ink-500">
                          Asignado $${formatMoney(invoice.allocated)} · Pendiente reconciliación $${formatMoney(invoice.remaining)}
                        </p>
                      </div>
                    `,
                  )
                  .join('')
              : `<p class="text-sm text-ink-400">No hay facturas institucionales para esta organización.</p>`
          }
        </div>
      </article>

      <article class="panel p-5">
        <h3 class="text-sm font-semibold text-white">Historial de pagos</h3>
        <p class="mt-1 text-xs text-ink-400">Los pagos anulados permanecen visibles para auditoría.</p>
        <div class="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
          ${
            payments.length
              ? payments
                  .map((payment) => renderPaymentRow(payment, { canVoid }))
                  .join('')
              : `<p class="text-sm text-ink-400">Aún no hay pagos registrados.</p>`
          }
        </div>
      </article>
    </section>
  `;
}

function renderPaymentRow(payment, { canVoid }) {
  const isVoid = payment.status === 'VOID';
  return `
    <div class="rounded-2xl border ${isVoid ? 'border-white/5 bg-white/[0.015] opacity-70' : 'border-white/10'} px-3 py-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-white">$${formatMoney(payment.amount)}</p>
          <p class="mt-1 text-xs text-ink-400">
            Pagado ${escapeHtml(formatDateLabel(payment.paymentDate))} · Período ${escapeHtml(formatDateLabel(payment.periodStart))} → ${escapeHtml(formatDateLabel(payment.periodEnd))}
          </p>
          ${
            payment.notes
              ? `<p class="mt-1 text-xs text-ink-500">${escapeHtml(payment.notes)}</p>`
              : ''
          }
          ${
            payment.allocations?.length
              ? `<p class="mt-1 text-[11px] text-ink-500">${payment.allocations.length} factura(s) vinculada(s)</p>`
              : ''
          }
          <p class="mt-1 text-[11px] text-ink-600">
            Registrado ${escapeHtml(formatDateTimeLabel(payment.createdAt))}
            ${
              payment.createdByCharacter
                ? ` · ${escapeHtml(`${payment.createdByCharacter.firstName} ${payment.createdByCharacter.lastName}`)}`
                : ''
            }
          </p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            isVoid
              ? 'border-white/10 text-ink-500'
              : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
          }">${isVoid ? 'Anulado' : 'Activo'}</span>
          ${
            canVoid && !isVoid
              ? `<button type="button" class="btn-secondary !px-2.5 !py-1 text-xs" data-void-payment="${payment.id}">Anular</button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function renderPaymentForm(organizations, options = {}) {
  const { fixedEstablishmentId = '', invoices = [] } = options;
  return `
    <form id="institutional-payment-form" class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="${fixedEstablishmentId ? 'hidden' : ''}">
        <label class="form-label" for="payment-establishment">Organización</label>
        <select id="payment-establishment" class="form-input" ${fixedEstablishmentId ? '' : 'required'}>
          <option value="">Seleccionar…</option>
          ${organizations
            .map(
              (org) =>
                `<option value="${escapeHtml(org.establishmentId || org.id)}" ${
                  fixedEstablishmentId && (org.establishmentId || org.id) === fixedEstablishmentId
                    ? 'selected'
                    : ''
                }>${escapeHtml(org.name)}</option>`,
            )
            .join('')}
        </select>
      </div>
      <div>
        <label class="form-label" for="payment-amount">Monto pagado</label>
        <input id="payment-amount" type="number" min="0.01" step="0.01" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="payment-date">Fecha del pago</label>
        <input id="payment-date" type="date" class="form-input" required value="${todayInputValue()}" />
      </div>
      <div>
        <label class="form-label" for="payment-period-start">Período desde</label>
        <input id="payment-period-start" type="date" class="form-input" required />
      </div>
      <div>
        <label class="form-label" for="payment-period-end">Período hasta</label>
        <input id="payment-period-end" type="date" class="form-input" required />
      </div>
      <div class="md:col-span-2">
        <label class="form-label" for="payment-notes">Observaciones</label>
        <textarea id="payment-notes" class="form-input min-h-24" maxlength="4000"></textarea>
      </div>
      ${
        invoices.length
          ? `
            <div class="md:col-span-2 rounded-2xl border border-white/10 p-4">
              <p class="text-sm font-medium text-white">Vincular facturas (opcional)</p>
              <p class="mt-1 text-xs text-ink-400">Marca facturas y asigna montos. El total asignado no puede superar el monto del pago.</p>
              <div class="mt-3 max-h-56 space-y-2 overflow-y-auto">
                ${invoices
                  .slice(0, 40)
                  .map(
                    (invoice) => `
                      <label class="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2">
                        <input type="checkbox" data-alloc-invoice="${invoice.id}" data-remaining="${invoice.remaining}" class="rounded border-white/20" />
                        <span class="min-w-0 flex-1 text-xs text-ink-300">
                          #${invoice.invoiceNumber} · ${escapeHtml(invoice.treatmentName)} · restante $${formatMoney(invoice.remaining)}
                        </span>
                        <input type="number" min="0.01" step="0.01" class="form-input !w-28 !py-1.5 text-xs" data-alloc-amount="${invoice.id}" placeholder="Monto" disabled />
                      </label>
                    `,
                  )
                  .join('')}
              </div>
            </div>
          `
          : ''
      }
      <div class="md:col-span-2 flex justify-end gap-2">
        <button type="submit" class="btn-primary">Guardar pago</button>
      </div>
    </form>
  `;
}

function bindDashboardActions(root, dashboard, { canCreate, reload }) {
  if (!canCreate) return;

  root.querySelector('#open-payment-form')?.addEventListener('click', () => {
    root.querySelector('#payment-form-panel')?.classList.remove('hidden');
  });
  root.querySelector('#close-payment-form')?.addEventListener('click', () => {
    root.querySelector('#payment-form-panel')?.classList.add('hidden');
  });

  bindPaymentForm(root, {
    onSuccess: reload,
    defaultEstablishmentId: '',
  });
}

function bindOrganizationActions(root, detail, { canCreate, canVoid, reload }) {
  if (canCreate) {
    root.querySelector('#toggle-org-payment-form')?.addEventListener('click', () => {
      root.querySelector('#org-payment-form-panel')?.classList.toggle('hidden');
    });
    bindPaymentForm(root, {
      onSuccess: reload,
      defaultEstablishmentId: detail.establishment.id,
    });
    root.querySelectorAll('[data-alloc-invoice]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const id = checkbox.getAttribute('data-alloc-invoice');
        const amountInput = root.querySelector(`[data-alloc-amount="${id}"]`);
        if (!amountInput) return;
        amountInput.disabled = !checkbox.checked;
        if (checkbox.checked && !amountInput.value) {
          amountInput.value = checkbox.getAttribute('data-remaining') || '';
        }
        if (!checkbox.checked) {
          amountInput.value = '';
        }
      });
    });
  }

  if (canVoid) {
    root.querySelectorAll('[data-void-payment]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-void-payment');
        try {
          await voidInstitutionalPayment(id, { reason: 'Anulado desde el panel institucional' });
          setAuthAlert(root, {
            id: 'institutional-payments-alert',
            type: 'success',
            message: 'Pago anulado. El historial se conserva.',
          });
          await reload();
        } catch (error) {
          setAuthAlert(root, {
            id: 'institutional-payments-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });
    });
  }
}

function bindPaymentForm(root, { onSuccess, defaultEstablishmentId }) {
  root.querySelector('#institutional-payment-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const establishmentId =
      defaultEstablishmentId || root.querySelector('#payment-establishment')?.value;
    const amount = Number(root.querySelector('#payment-amount')?.value);
    const paymentDate = root.querySelector('#payment-date')?.value;
    const periodStart = root.querySelector('#payment-period-start')?.value;
    const periodEnd = root.querySelector('#payment-period-end')?.value;
    const notes = root.querySelector('#payment-notes')?.value?.trim() || undefined;

    const allocations = [];
    root.querySelectorAll('[data-alloc-invoice]:checked').forEach((checkbox) => {
      const invoiceId = checkbox.getAttribute('data-alloc-invoice');
      const allocAmount = Number(root.querySelector(`[data-alloc-amount="${invoiceId}"]`)?.value);
      if (invoiceId && allocAmount > 0) {
        allocations.push({ invoiceId, amount: allocAmount });
      }
    });

    try {
      await createInstitutionalPayment({
        establishmentId,
        amount,
        paymentDate,
        periodStart,
        periodEnd,
        notes,
        ...(allocations.length ? { allocations } : {}),
      });
      setAuthAlert(root, {
        id: 'institutional-payments-alert',
        type: 'success',
        message: 'Pago institucional registrado.',
      });
      await onSuccess();
    } catch (error) {
      setAuthAlert(root, {
        id: 'institutional-payments-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });
}
