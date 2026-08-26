import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  bindAppModal,
  closeAppModal,
  openAppModal,
  renderAppModal,
  setAppModalContent,
} from '../components/ui/modal.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listDepartments } from '../services/departments.service.js';
import {
  formatRemainingAccess,
  grantMedicalReportAccess,
  listMedicalReportAccessGrantsForReport,
  listMedicalReportAccessReasons,
  listMedicalReportAccessRecipients,
  revokeMedicalReportAccess,
} from '../services/medical-report-access.service.js';
import {
  addReportEvidence,
  addReportParticipant,
  getReport,
  removeReportParticipant,
  searchReportOfficers,
  transferReport,
  updateReport,
  uploadReportEvidenceImage,
} from '../services/reports.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateLabel, formatDateTimeLabel } from '../utils/date.js';
import { MAX_IMAGE_UPLOAD_BYTES } from '../utils/image-upload.js';
import { resolveUploadUrl } from '../utils/media.js';
import { PERMISSIONS } from '../utils/permissions.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  UNDER_REVIEW: 'En revisión',
  COMPLETED: 'Finalizado',
  ARCHIVED: 'Archivado',
};

const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const TYPE_LABELS = {
  CONSULTATION: 'Consulta',
  DIAGNOSTIC: 'Diagnóstico',
  PROCEDURE: 'Procedimiento',
  HOSPITALIZATION: 'Hospitalización',
  INTERNAL: 'Interno',
  OTHER: 'Otro',
};

export function reportDetailPage(reportId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.REPORTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const canGrantAccess = can(PERMISSIONS.MEDICAL_REPORT_ACCESS_GRANT) || can('*');
  const canRevokeAccess = can(PERMISSIONS.MEDICAL_REPORT_ACCESS_REVOKE) || can('*');
  const canReadAccess = can(PERMISSIONS.MEDICAL_REPORT_ACCESS_READ) || canGrantAccess;

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'report-detail-alert' })}
      <a data-link href="/reports" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver a informes</a>
      <div id="report-detail-root">
        <p class="text-sm text-ink-400">Cargando informe...</p>
      </div>
      ${renderAppModal({
        id: 'report-access-modal',
        title: 'Conceder acceso temporal',
        size: 'md',
        bodyHtml: '<p class="text-sm text-ink-400">Cargando…</p>',
      })}
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Informe',
      currentPath: '/reports',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      const cleanupModal = bindAppModal(root, { modalId: 'report-access-modal' });
      let report = null;
      let departments = [];
      let accessGrants = [];
      let activeTab = 'overview';

      const refresh = async () => {
        report = await getReport(reportId);
        if (!departments.length) {
          departments = await listDepartments().catch(() => []);
        }
        if (canReadAccess || canGrantAccess) {
          accessGrants = await listMedicalReportAccessGrantsForReport(reportId).catch(() => []);
        }
        paint();
        document.title = `Informe #${report.reportNumber} · SAED`;
      };

      const paint = () => {
        renderDetail(root, report, departments, activeTab, {
          accessGrants,
          canGrantAccess,
          canRevokeAccess,
        });
        bindReportTabs(root, (tabId) => {
          activeTab = tabId;
        });
        bindDetail(root, report, {
          onReload: refresh,
          canGrantAccess,
          canRevokeAccess,
        });
      };

      void refresh().catch((error) => {
        setAuthAlert(root, {
          id: 'report-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      });

      return () => {
        cleanupModal();
        cleanupLayout();
      };
    },
  };
}

function bindReportTabs(root, onChange) {
  const host = root.querySelector('#report-detail-root');
  if (!host) return;

  host.querySelectorAll('[data-report-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-report-tab');
      host.querySelectorAll('[data-report-tab]').forEach((item) => {
        const active = item.getAttribute('data-report-tab') === tab;
        item.className = tabButtonClass(active);
      });
      host.querySelectorAll('[data-report-panel]').forEach((panel) => {
        panel.classList.toggle('hidden', panel.getAttribute('data-report-panel') !== tab);
      });
      onChange?.(tab);
    });
  });
}

function tabButtonClass(active) {
  return `rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
    active
      ? 'border-brand-400/40 bg-brand-500/15 text-white'
      : 'border-white/10 text-ink-300 hover:border-white/20 hover:text-white'
  }`;
}

function renderDetail(
  root,
  report,
  departments,
  activeTab = 'overview',
  { accessGrants = [], canGrantAccess = false, canRevokeAccess = false } = {},
) {
  const host = root.querySelector('#report-detail-root');
  if (!host || !report) return;

  const access = report.access ?? {};
  const canCollaborate = Boolean(access.canCollaborate ?? access.canEdit);
  const canManageParticipants = Boolean(access.canManageParticipants ?? access.canManage);
  const lead = report.leadStaff;
  const leadName = lead ? `${lead.character.firstName} ${lead.character.lastName}` : 'Sin asignar';
  const patient = report.patient;
  const patientName = patient
    ? `HC #${patient.recordNumber} · ${patient.firstName} ${patient.lastName}`
    : 'Sin paciente';
  const canTransfer =
    access.canTransfer || can(PERMISSIONS.REPORTS_TRANSFER) || can(PERMISSIONS.ADMIN_ACCESS);
  const activeGrants = accessGrants.filter((item) => item.status === 'ACTIVE');

  const statusTone =
    report.status === 'COMPLETED'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
      : report.status === 'UNDER_REVIEW'
        ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
        : report.status === 'ARCHIVED'
          ? 'border-white/10 bg-white/[0.03] text-ink-300'
          : 'border-sky-400/30 bg-sky-500/10 text-sky-200';

  const participantCount = (report.participants ?? []).length;
  const evidenceCount = (report.evidence ?? []).length;
  const transferCount = (report.transfers ?? []).length;
  const descriptionPreview =
    String(report.description ?? '').trim().length > 280
      ? `${String(report.description).trim().slice(0, 280)}…`
      : String(report.description ?? '').trim();

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'narrative', label: 'Narrativa' },
    { id: 'team', label: `Equipo${participantCount ? ` (${participantCount})` : ''}` },
    { id: 'evidence', label: `Evidencias${evidenceCount ? ` (${evidenceCount})` : ''}` },
    { id: 'transfers', label: `Derivaciones${transferCount ? ` (${transferCount})` : ''}` },
  ];

  host.innerHTML = `
    <div class="space-y-5">
      <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.14),_transparent_45%)]"></div>
        <div class="relative space-y-5 p-5 md:p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">Informe clínico · #${report.reportNumber}</p>
                <span class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusTone}">
                  ${escapeHtml(STATUS_LABELS[report.status] ?? report.status)}
                </span>
                <span class="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-ink-300">
                  Prioridad ${escapeHtml(PRIORITY_LABELS[report.priority] ?? report.priority)}
                </span>
              </div>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">${escapeHtml(report.title)}</h2>
              <p class="mt-2 text-sm text-ink-400">
                ${escapeHtml(TYPE_LABELS[report.type] ?? report.type)}
                · ${escapeHtml(report.department?.name ?? 'Sin departamento')}
              </p>
            </div>
            <div class="flex w-full flex-col gap-2 lg:w-[22rem]">
              ${
                canGrantAccess
                  ? `<button type="button" id="grant-report-access" class="btn-primary w-full">Conceder Acceso Temporal</button>`
                  : ''
              }
              <div class="grid gap-2 sm:grid-cols-2">
                <div class="rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3">
                  <p class="text-[10px] uppercase tracking-wide text-ink-500">Paciente</p>
                  ${
                    patient
                      ? `<a data-link href="/patients?id=${patient.id}" class="mt-1 block truncate text-sm font-semibold text-white hover:text-brand-200">${escapeHtml(patientName)}</a>`
                      : `<p class="mt-1 text-sm text-rose-300">${escapeHtml(patientName)}</p>`
                  }
                </div>
                <div class="rounded-2xl border border-white/10 bg-black/25 px-3.5 py-3">
                  <p class="text-[10px] uppercase tracking-wide text-ink-500">Responsable</p>
                  <p class="mt-1 truncate text-sm font-semibold text-white">${escapeHtml(leadName)}</p>
                  ${lead ? `<p class="mt-0.5 truncate text-[11px] text-ink-500">Nº ${escapeHtml(lead.employeeNumber)}</p>` : ''}
                </div>
              </div>
            </div>
          </div>

          <nav class="flex flex-wrap gap-2 border-t border-white/10 pt-4" aria-label="Secciones del informe">
            ${tabs
              .map(
                (tab) => `
                  <button type="button" data-report-tab="${tab.id}" class="${tabButtonClass(tab.id === activeTab)}">
                    ${escapeHtml(tab.label)}
                  </button>
                `,
              )
              .join('')}
          </nav>
        </div>
      </section>

      <div data-report-panel="overview" class="${activeTab === 'overview' ? '' : 'hidden'} space-y-4">
        <dl class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          ${meta('Departamento', report.department?.name ?? '—')}
          ${meta('Lugar', report.location ?? '—')}
          ${meta('Fecha incidente', formatDateLabel(report.incidentDate))}
          ${meta('Creado', formatDateTimeLabel(report.createdAt))}
        </dl>

        <div class="grid gap-4 lg:grid-cols-3">
          <article class="rounded-2xl border border-white/10 px-4 py-4">
            <p class="text-[11px] uppercase tracking-wide text-ink-500">Equipo</p>
            <p class="mt-2 text-2xl font-semibold text-white">${participantCount}</p>
            <p class="mt-1 text-xs text-ink-400">profesionales involucrados</p>
          </article>
          <article class="rounded-2xl border border-white/10 px-4 py-4">
            <p class="text-[11px] uppercase tracking-wide text-ink-500">Evidencias</p>
            <p class="mt-2 text-2xl font-semibold text-white">${evidenceCount}</p>
            <p class="mt-1 text-xs text-ink-400">adjuntos registrados</p>
          </article>
          <article class="rounded-2xl border border-white/10 px-4 py-4">
            <p class="text-[11px] uppercase tracking-wide text-ink-500">Derivaciones</p>
            <p class="mt-2 text-2xl font-semibold text-white">${transferCount}</p>
            <p class="mt-1 text-xs text-ink-400">movimientos de departamento</p>
          </article>
        </div>

        <article class="rounded-3xl border border-white/10 p-5 md:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-white">Resumen de la narrativa</h3>
            <button type="button" data-report-tab="narrative" class="text-xs font-medium text-brand-300 hover:text-brand-200">
              Abrir narrativa completa →
            </button>
          </div>
          <p class="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-200">
            ${escapeHtml(descriptionPreview || 'Sin descripción registrada.')}
          </p>
        </article>

        ${
          canGrantAccess || accessGrants.length
            ? `
              <article class="rounded-3xl border border-white/10 p-5 md:p-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-white">Accesos temporales institucionales</h3>
                    <p class="mt-1 text-xs text-ink-500">
                      ${activeGrants.length} activo(s) · ${accessGrants.length} en historial
                    </p>
                  </div>
                  ${
                    canGrantAccess
                      ? `<button type="button" id="grant-report-access-secondary" class="btn-secondary">Nuevo acceso</button>`
                      : ''
                  }
                </div>
                <div class="mt-4 space-y-2">
                  ${
                    accessGrants.length
                      ? accessGrants
                          .map((grant) => {
                            const recipient = grant.recipientCharacter
                              ? `${grant.recipientCharacter.firstName} ${grant.recipientCharacter.lastName}${
                                  grant.organization ? ` · ${grant.organization}` : ''
                                }`
                              : '—';
                            return `
                              <div class="rounded-2xl border border-white/10 px-4 py-3">
                                <div class="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p class="text-sm font-medium text-white">${escapeHtml(recipient)}</p>
                                    <p class="mt-1 text-xs text-ink-500">
                                      ${escapeHtml(grant.reasonLabel || grant.reason)}
                                      · ${escapeHtml(grant.status)}
                                      · vistos ${grant.viewCount}
                                    </p>
                                    <p class="mt-1 text-[11px] text-ink-500">
                                      Expira ${escapeHtml(formatDateTimeLabel(grant.expiresAt))}
                                      ${
                                        grant.status === 'ACTIVE'
                                          ? ` · queda ${escapeHtml(formatRemainingAccess(grant.remainingMs))}`
                                          : ''
                                      }
                                    </p>
                                  </div>
                                  ${
                                    canRevokeAccess && grant.status === 'ACTIVE'
                                      ? `<button type="button" class="btn-secondary !py-1.5 !px-3 text-xs" data-revoke-grant="${grant.id}">Revocar</button>`
                                      : ''
                                  }
                                </div>
                              </div>
                            `;
                          })
                          .join('')
                      : `<p class="text-sm text-ink-500">Aún no se ha concedido acceso a este informe.</p>`
                  }
                </div>
              </article>
            `
            : ''
        }
      </div>

      <div data-report-panel="narrative" class="${activeTab === 'narrative' ? '' : 'hidden'} space-y-4">
        <article class="rounded-3xl border border-white/10 p-5 md:p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-white">Narrativa clínica</h3>
              <p class="mt-1 text-xs text-ink-500">Descripción completa del informe médico.</p>
            </div>
          </div>
          <div class="mt-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-5 md:px-5">
            <p class="whitespace-pre-wrap text-sm leading-7 text-ink-100">${escapeHtml(report.description || 'Sin descripción.')}</p>
          </div>
        </article>

        ${
          canCollaborate
            ? `
          <article class="rounded-3xl border border-white/10 p-5 md:p-6">
            <h3 class="text-sm font-semibold text-white">Actualizar informe</h3>
            <p class="mt-1 text-xs text-ink-500">Modifica la narrativa, el estado o la prioridad.</p>
            <form id="report-update-form" class="mt-5 grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="form-label" for="update-description">Descripción</label>
                <textarea id="update-description" class="form-input min-h-36" maxlength="8000" required>${escapeHtml(report.description)}</textarea>
              </div>
              <div>
                <label class="form-label" for="update-status">Estado</label>
                <select id="update-status" class="form-input">
                  ${Object.entries(STATUS_LABELS)
                    .map(
                      ([value, label]) =>
                        `<option value="${value}" ${report.status === value ? 'selected' : ''}>${label}</option>`,
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="form-label" for="update-priority">Prioridad</label>
                <select id="update-priority" class="form-input">
                  ${Object.entries(PRIORITY_LABELS)
                    .map(
                      ([value, label]) =>
                        `<option value="${value}" ${report.priority === value ? 'selected' : ''}>${label}</option>`,
                    )
                    .join('')}
                </select>
              </div>
              <div class="sm:col-span-2 flex justify-end">
                <button type="submit" class="btn-primary">Guardar cambios</button>
              </div>
            </form>
          </article>
        `
            : ''
        }
      </div>

      <div data-report-panel="team" class="${activeTab === 'team' ? '' : 'hidden'}">
        <article class="rounded-3xl border border-white/10 p-5 md:p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-white">Equipo involucrado</h3>
              <p class="mt-1 text-xs text-ink-500">Personal médico asociado a este informe.</p>
            </div>
            <p class="text-xs text-ink-500">${participantCount} miembro${participantCount === 1 ? '' : 's'}</p>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            ${
              participantCount
                ? report.participants
                    .map((item) => {
                      const officer = item.staffProfile;
                      const name = `${officer.character.firstName} ${officer.character.lastName}`;
                      const avatar = resolveUploadUrl(officer.character.avatarUrl);
                      return `
                        <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
                          <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface-950 text-xs font-semibold text-brand-300">
                            ${avatar ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />` : escapeHtml((name.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase())}
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-white">${escapeHtml(name)}</p>
                            <p class="truncate text-xs text-ink-400">${escapeHtml(officer.employeeNumber)} · ${escapeHtml(officer.rank?.name ?? '—')}</p>
                          </div>
                          ${
                            canManageParticipants
                              ? `<button type="button" class="shrink-0 text-xs text-rose-300 hover:text-rose-200" data-remove-participant="${officer.id}">Quitar</button>`
                              : ''
                          }
                        </div>
                      `;
                    })
                    .join('')
                : `<p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-3">Sin personal involucrado.</p>`
            }
          </div>

          ${
            canManageParticipants
              ? `
            <div class="mt-6 border-t border-white/10 pt-5">
              <label class="form-label" for="participant-query">Agregar personal</label>
              <input id="participant-query" class="form-input max-w-xl" placeholder="Nombre o badge..." autocomplete="off" />
              <div id="participant-results" class="mt-2 max-h-48 max-w-xl space-y-2 overflow-y-auto"></div>
            </div>
          `
              : ''
          }
        </article>
      </div>

      <div data-report-panel="evidence" class="${activeTab === 'evidence' ? '' : 'hidden'} space-y-4">
        <article class="rounded-3xl border border-white/10 p-5 md:p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-white">Evidencias</h3>
              <p class="mt-1 text-xs text-ink-500">Material clínico adjunto al informe.</p>
            </div>
            <p class="text-xs text-ink-500">${evidenceCount} archivo${evidenceCount === 1 ? '' : 's'}</p>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            ${
              evidenceCount
                ? report.evidence
                    .map((item) => {
                      const uploader = item.uploadedByCharacter
                        ? `${item.uploadedByCharacter.firstName} ${item.uploadedByCharacter.lastName}`
                        : null;
                      const metaLine = [
                        item.originalName,
                        uploader ? `por ${uploader}` : null,
                        formatDateTimeLabel(item.createdAt),
                      ]
                        .filter(Boolean)
                        .join(' · ');

                      if (item.type === 'IMAGE') {
                        const src = resolveUploadUrl(item.value);
                        return `
                          <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                            <div class="h-44 bg-surface-950">
                              <img src="${src}" alt="${escapeHtml(item.label ?? item.originalName ?? 'Evidencia')}" class="h-full w-full object-contain" />
                            </div>
                            <div class="space-y-0.5 px-3 py-2.5">
                              <p class="text-xs text-ink-200">${escapeHtml(item.label ?? item.originalName ?? 'Imagen')}</p>
                              ${metaLine ? `<p class="text-[11px] text-ink-500">${escapeHtml(metaLine)}</p>` : ''}
                            </div>
                          </div>
                        `;
                      }
                      return `
                        <a href="${escapeHtml(item.value)}" target="_blank" rel="noopener noreferrer" class="block rounded-2xl border border-white/10 px-4 py-4 text-sm text-brand-300 transition hover:border-brand-400/30 hover:bg-brand-500/5">
                          <span class="block truncate font-medium">${escapeHtml(item.label ?? item.type)}</span>
                          <span class="mt-1 block truncate text-xs text-ink-500">${escapeHtml(item.value)}</span>
                          ${metaLine ? `<span class="mt-2 block text-[11px] text-ink-500">${escapeHtml(metaLine)}</span>` : ''}
                        </a>
                      `;
                    })
                    .join('')
                : `<p class="text-sm text-ink-400 sm:col-span-2 xl:col-span-3">Sin evidencias registradas.</p>`
            }
          </div>
        </article>

        ${
          canCollaborate
            ? `
          <article class="rounded-3xl border border-white/10 p-5 md:p-6">
            <h3 class="text-sm font-semibold text-white">Añadir evidencia</h3>
            <form id="evidence-form" class="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label class="form-label" for="evidence-type">Tipo</label>
                <select id="evidence-type" class="form-input">
                  <option value="IMAGE">Fotografía</option>
                  <option value="VIDEO_URL">URL de clip</option>
                  <option value="DOCUMENT">Documento (URL)</option>
                </select>
              </div>
              <div>
                <label class="form-label" for="evidence-label">Etiqueta</label>
                <input id="evidence-label" class="form-input" maxlength="160" />
              </div>
              <div id="evidence-image-wrap" class="sm:col-span-2">
                <label class="form-label" for="evidence-image">Imagen</label>
                <input id="evidence-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
                <p class="mt-1 text-[11px] text-ink-500">JPEG, PNG, WebP o GIF · máx. 8 MB</p>
              </div>
              <div id="evidence-url-wrap" class="hidden sm:col-span-2">
                <label class="form-label" for="evidence-url">URL</label>
                <input id="evidence-url" class="form-input" maxlength="4000" />
              </div>
              <div class="sm:col-span-2">
                <button type="submit" class="btn-secondary">Añadir evidencia</button>
              </div>
            </form>
          </article>
        `
            : ''
        }
      </div>

      <div data-report-panel="transfers" class="${activeTab === 'transfers' ? '' : 'hidden'} space-y-4">
        <article class="rounded-3xl border border-white/10 p-5 md:p-6">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-white">Historial de derivaciones</h3>
              <p class="mt-1 text-xs text-ink-500">Trayectoria del informe entre departamentos.</p>
            </div>
          </div>
          <ul class="mt-5 space-y-2">
            ${
              transferCount
                ? report.transfers
                    .map(
                      (item) => `
                        <li class="rounded-2xl border border-white/10 px-4 py-3">
                          <p class="text-sm text-white">
                            ${escapeHtml(item.fromDepartment?.name ?? 'Sin departamento')}
                            <span class="text-ink-500"> → </span>
                            ${escapeHtml(item.toDepartment?.name ?? '—')}
                          </p>
                          <p class="mt-1 text-xs text-ink-500">
                            ${escapeHtml(formatDateTimeLabel(item.createdAt))}
                            ${
                              item.transferredByCharacter
                                ? ` · ${escapeHtml(item.transferredByCharacter.firstName)} ${escapeHtml(item.transferredByCharacter.lastName)}`
                                : ''
                            }
                          </p>
                          ${item.notes ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(item.notes)}</p>` : ''}
                        </li>
                      `,
                    )
                    .join('')
                : `<li class="text-sm text-ink-400">Sin derivaciones registradas.</li>`
            }
          </ul>
        </article>

        ${
          canTransfer
            ? `
          <article class="rounded-3xl border border-white/10 p-5 md:p-6">
            <h3 class="text-sm font-semibold text-white">Derivar informe</h3>
            <p class="mt-1 text-xs text-ink-500">Exclusivo de comando. El historial se conserva.</p>
            <form id="transfer-form" class="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label class="form-label" for="transfer-department">Nuevo departamento</label>
                <select id="transfer-department" class="form-input" required>
                  <option value="">Seleccionar...</option>
                  ${departments
                    .filter((item) => item.id !== report.departmentId)
                    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
                    .join('')}
                </select>
              </div>
              <div>
                <label class="form-label" for="transfer-notes">Notas</label>
                <input id="transfer-notes" class="form-input" maxlength="2000" />
              </div>
              <button type="submit" class="btn-secondary">Derivar</button>
            </form>
          </article>
        `
            : ''
        }
      </div>
    </div>
  `;
}

function bindDetail(root, report, { onReload, canGrantAccess = false, canRevokeAccess = false }) {
  const access = report.access ?? {};
  const canCollaborate = Boolean(access.canCollaborate ?? access.canEdit);

  const openGrantModal = async () => {
    if (!canGrantAccess) return;
    setAppModalContent(root, {
      modalId: 'report-access-modal',
      title: 'Conceder Acceso Temporal',
      bodyHtml: `<p class="text-sm text-ink-400">Cargando supervisores institucionales…</p>`,
      footerHtml: `<button type="button" class="btn-secondary" data-modal-close>Cancelar</button>`,
    });
    openAppModal(root, 'report-access-modal');

    try {
      const [recipients, reasons] = await Promise.all([
        listMedicalReportAccessRecipients(),
        listMedicalReportAccessReasons(),
      ]);

      setAppModalContent(root, {
        modalId: 'report-access-modal',
        bodyHtml: `
          <form id="grant-access-form" class="space-y-4">
            <p class="text-sm text-ink-300">
              Autoriza a un Supervisor médico institucional a consultar el informe
              <span class="font-medium text-white">#${report.reportNumber}</span> de forma temporal.
            </p>
            <div>
              <label class="form-label" for="grant-recipient">Supervisor institucional</label>
              <select id="grant-recipient" class="form-input" required>
                <option value="">Seleccionar…</option>
                ${recipients
                  .map(
                    (item) =>
                      `<option value="${item.id}">${escapeHtml(
                        `${item.firstName} ${item.lastName}${item.organization ? ` — ${item.organization}` : ''}`,
                      )}</option>`,
                  )
                  .join('')}
              </select>
              <p class="form-hint">La agencia del supervisor determina a qué módulo llega el acceso.</p>
            </div>
            <div>
              <label class="form-label" for="grant-reason">Motivo</label>
              <select id="grant-reason" class="form-input" required>
                ${reasons
                  .map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`)
                  .join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="grant-notes">Detalle del motivo</label>
              <textarea id="grant-notes" class="form-input min-h-24" maxlength="1000" placeholder="Contexto operativo (opcional)"></textarea>
            </div>
            <div>
              <label class="form-label" for="grant-duration">Duración (horas)</label>
              <input id="grant-duration" type="number" min="1" max="168" value="24" class="form-input" />
              <p class="mt-1 text-[11px] text-ink-500">Por defecto 24 horas. Configurable por autorización.</p>
            </div>
          </form>
        `,
        footerHtml: `
          <button type="button" class="btn-secondary" data-modal-close>Cancelar</button>
          <button type="submit" form="grant-access-form" class="btn-primary">Confirmar acceso</button>
        `,
      });

      root.querySelector('#grant-access-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await grantMedicalReportAccess({
            reportId: report.id,
            recipientCharacterId: root.querySelector('#grant-recipient').value,
            reason: root.querySelector('#grant-reason').value,
            reasonNotes: root.querySelector('#grant-notes').value.trim() || undefined,
            durationHours: Number(root.querySelector('#grant-duration').value) || 24,
          });
          closeAppModal(root, 'report-access-modal');
          setAuthAlert(root, {
            id: 'report-detail-alert',
            type: 'success',
            message: 'Acceso temporal concedido. El supervisor ha sido notificado.',
          });
          await onReload();
        } catch (error) {
          setAuthAlert(root, {
            id: 'report-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });
    } catch (error) {
      setAppModalContent(root, {
        modalId: 'report-access-modal',
        bodyHtml: `<p class="text-sm text-rose-300">${escapeHtml(getApiErrorMessage(error))}</p>`,
      });
    }
  };

  root.querySelector('#grant-report-access')?.addEventListener('click', () => {
    void openGrantModal();
  });
  root.querySelector('#grant-report-access-secondary')?.addEventListener('click', () => {
    void openGrantModal();
  });

  if (canRevokeAccess) {
    root.querySelectorAll('[data-revoke-grant]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await revokeMedicalReportAccess(button.getAttribute('data-revoke-grant'));
          setAuthAlert(root, {
            id: 'report-detail-alert',
            type: 'success',
            message: 'Acceso revocado. El supervisor ha sido notificado.',
          });
          await onReload();
        } catch (error) {
          setAuthAlert(root, {
            id: 'report-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });
    });
  }

  root.querySelectorAll('[data-remove-participant]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await removeReportParticipant(report.id, button.getAttribute('data-remove-participant'));
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'report-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  const participantInput = root.querySelector('#participant-query');
  const participantResults = root.querySelector('#participant-results');
  let timer = null;
  participantInput?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = participantInput.value.trim();
      if (q.length < 2) {
        participantResults.innerHTML = '';
        return;
      }
      try {
        const items = await searchReportOfficers(q);
        participantResults.innerHTML = items
          .map((item) => {
            const name = `${item.character.firstName} ${item.character.lastName}`;
            return `
              <button type="button" class="block w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm hover:bg-white/[0.04]" data-add-participant="${item.id}">
                ${escapeHtml(name)} · ${escapeHtml(item.employeeNumber)}
              </button>
            `;
          })
          .join('');
        participantResults.querySelectorAll('[data-add-participant]').forEach((button) => {
          button.addEventListener('click', async () => {
            try {
              await addReportParticipant(report.id, button.getAttribute('data-add-participant'));
              await onReload();
            } catch (error) {
              setAuthAlert(root, {
                id: 'report-detail-alert',
                type: 'error',
                message: getApiErrorMessage(error),
              });
            }
          });
        });
      } catch (error) {
        participantResults.innerHTML = `<p class="text-xs text-rose-300">${getApiErrorMessage(error)}</p>`;
      }
    }, 250);
  });

  const evidenceType = root.querySelector('#evidence-type');
  const syncEvidenceType = () => {
    const type = evidenceType?.value;
    root.querySelector('#evidence-image-wrap')?.classList.toggle('hidden', type !== 'IMAGE');
    root.querySelector('#evidence-url-wrap')?.classList.toggle('hidden', type === 'IMAGE');
  };
  evidenceType?.addEventListener('change', syncEvidenceType);
  syncEvidenceType();

  root.querySelector('#evidence-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canCollaborate) return;

    const type = root.querySelector('#evidence-type').value;
    const label = root.querySelector('#evidence-label').value.trim() || undefined;
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      if (type === 'IMAGE') {
        const file = root.querySelector('#evidence-image')?.files?.[0];
        if (!file) {
          throw new Error('Selecciona una imagen.');
        }
        if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
          throw new Error('El tamaño máximo permitido es de 8 MB.');
        }
        await uploadReportEvidenceImage(report.id, file, label);
      } else {
        const value = root.querySelector('#evidence-url')?.value.trim();
        if (!value) {
          throw new Error('Indica una URL.');
        }
        await addReportEvidence(report.id, { type, value, label });
      }
      await onReload();
      setAuthAlert(root, {
        id: 'report-detail-alert',
        type: 'success',
        message: 'Evidencia añadida.',
      });
    } catch (error) {
      setAuthAlert(root, {
        id: 'report-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error, error.message),
      });
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  root.querySelector('#report-update-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canCollaborate) return;
    try {
      await updateReport(report.id, {
        description: root.querySelector('#update-description').value.trim(),
        status: root.querySelector('#update-status').value,
        priority: root.querySelector('#update-priority').value,
      });
      setAuthAlert(root, {
        id: 'report-detail-alert',
        type: 'success',
        message: 'Informe actualizado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'report-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#transfer-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await transferReport(report.id, {
        toDepartmentId: root.querySelector('#transfer-department').value,
        notes: root.querySelector('#transfer-notes').value.trim() || undefined,
      });
      setAuthAlert(root, {
        id: 'report-detail-alert',
        type: 'success',
        message: 'Informe derivado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'report-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });
}

function meta(label, value) {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <dt class="text-[11px] uppercase tracking-wide text-ink-500">${label}</dt>
      <dd class="mt-0.5 font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
