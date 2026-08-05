import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listDepartments } from '../services/departments.service.js';
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
  INCIDENT: 'Incidente',
  INVESTIGATION: 'Investigación',
  INTERNAL: 'Interno',
  ACTIVITY: 'Actividad',
  OTHER: 'Otro',
};

export function reportDetailPage(reportId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.REPORTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'report-detail-alert' })}
      <a data-link href="/reports" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver a informes</a>
      <div id="report-detail-root">
        <p class="text-sm text-ink-400">Cargando informe...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Informe',
      currentPath: '/reports',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      let report = null;
      let departments = [];

      const refresh = async () => {
        report = await getReport(reportId);
        if (!departments.length) {
          departments = await listDepartments().catch(() => []);
        }
        paint();
        document.title = `Informe #${report.reportNumber} · SAED`;
      };

      const paint = () => {
        renderDetail(root, report, departments);
        bindDetail(root, report, { onReload: refresh });
      };

      void refresh().catch((error) => {
        setAuthAlert(root, {
          id: 'report-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      });

      return cleanup;
    },
  };
}

function renderDetail(root, report, departments) {
  const host = root.querySelector('#report-detail-root');
  if (!host || !report) return;

  const access = report.access ?? {};
  const canCollaborate = Boolean(access.canCollaborate ?? access.canEdit);
  const canManageParticipants = Boolean(access.canManageParticipants ?? access.canManage);
  const lead = report.leadStaff;
  const leadName = lead ? `${lead.character.firstName} ${lead.character.lastName}` : 'Sin asignar';
  const canTransfer =
    access.canTransfer || can(PERMISSIONS.REPORTS_TRANSFER) || can(PERMISSIONS.ADMIN_ACCESS);

  host.innerHTML = `
    <section class="space-y-6">
    <section class="surface-card p-5 md:p-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <p class="landing-eyebrow">Informe #${report.reportNumber}</p>
          <h2 class="mt-1 text-2xl font-semibold text-white">${escapeHtml(report.title)}</h2>
          <p class="mt-2 text-sm text-ink-300">
            ${TYPE_LABELS[report.type] ?? report.type} · ${STATUS_LABELS[report.status] ?? report.status} · Prioridad ${PRIORITY_LABELS[report.priority] ?? report.priority}
          </p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">Encargado</p>
          <p class="mt-1 font-medium text-white">${escapeHtml(leadName)}</p>
          ${lead ? `<p class="mt-1 text-xs text-ink-400">Badge ${escapeHtml(lead.employeeNumber)}</p>` : ''}
        </div>
      </div>

      <p class="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-200">${escapeHtml(report.description)}</p>

      <dl class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
        ${meta('Departamento', report.department?.name ?? '—')}
        ${meta('Lugar', report.location ?? '—')}
        ${meta('Fecha incidente', formatDateLabel(report.incidentDate))}
        ${meta('Creado', formatDateTimeLabel(report.createdAt))}
      </dl>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="surface-card p-5">
        <h3 class="text-sm font-semibold text-white">Personal involucrado</h3>
        <div class="mt-4 space-y-3">
          ${
            (report.participants ?? []).length
              ? report.participants
                  .map((item) => {
                    const officer = item.staffProfile;
                    const name = `${officer.character.firstName} ${officer.character.lastName}`;
                    const avatar = resolveUploadUrl(officer.character.avatarUrl);
                    return `
                    <div class="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2">
                      <div class="h-10 w-10 overflow-hidden rounded-xl bg-surface-950">
                        ${avatar ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />` : ''}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm text-white">${escapeHtml(name)}</p>
                        <p class="truncate text-xs text-ink-400">${escapeHtml(officer.employeeNumber)} · ${escapeHtml(officer.rank?.name ?? '—')}</p>
                      </div>
                      ${
                        canManageParticipants
                          ? `<button type="button" class="text-xs text-rose-300" data-remove-participant="${officer.id}">Quitar</button>`
                          : ''
                      }
                    </div>
                  `;
                  })
                  .join('')
              : `<p class="text-sm text-ink-400">Sin personal involucrado.</p>`
          }
        </div>
        ${
          canManageParticipants
            ? `
          <div class="mt-4 border-t border-white/10 pt-4">
            <label class="form-label" for="participant-query">Agregar personal</label>
            <input id="participant-query" class="form-input" placeholder="Nombre o badge..." autocomplete="off" />
            <div id="participant-results" class="mt-2 space-y-2"></div>
          </div>
        `
            : ''
        }
      </article>

      <article class="surface-card p-5">
        <h3 class="text-sm font-semibold text-white">Evidencias</h3>
        <div class="mt-4 space-y-3">
          ${
            (report.evidence ?? []).length
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
                      <div class="overflow-hidden rounded-xl border border-white/10">
                        <div class="h-40 bg-surface-950">
                          <img src="${src}" alt="${escapeHtml(item.label ?? item.originalName ?? 'Evidencia')}" class="h-full w-full object-contain" />
                        </div>
                        <div class="space-y-0.5 px-3 py-2">
                          <p class="text-xs text-ink-300">${escapeHtml(item.label ?? item.originalName ?? 'Imagen')}</p>
                          ${metaLine ? `<p class="text-[11px] text-ink-500">${escapeHtml(metaLine)}</p>` : ''}
                        </div>
                      </div>
                    `;
                    }
                    return `
                    <a href="${escapeHtml(item.value)}" target="_blank" rel="noopener noreferrer" class="block rounded-xl border border-white/10 px-3 py-3 text-sm text-brand-300 hover:text-brand-200">
                      <span class="block truncate">${escapeHtml(item.label ?? item.type)} · ${escapeHtml(item.value)}</span>
                      ${metaLine ? `<span class="mt-1 block text-[11px] text-ink-500">${escapeHtml(metaLine)}</span>` : ''}
                    </a>
                  `;
                  })
                  .join('')
              : `<p class="text-sm text-ink-400">Sin evidencias.</p>`
          }
        </div>
        ${
          canCollaborate
            ? `
          <form id="evidence-form" class="mt-4 space-y-3 border-t border-white/10 pt-4">
            <div>
              <label class="form-label" for="evidence-type">Tipo</label>
              <select id="evidence-type" class="form-input">
                <option value="IMAGE">Fotografía</option>
                <option value="VIDEO_URL">URL de clip</option>
                <option value="DOCUMENT">Documento (URL)</option>
              </select>
            </div>
            <div id="evidence-image-wrap">
              <label class="form-label" for="evidence-image">Imagen</label>
              <input id="evidence-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="form-input" />
              <p class="mt-1 text-[11px] text-ink-500">JPEG, PNG, WebP o GIF · máx. 8 MB</p>
            </div>
            <div id="evidence-url-wrap" class="hidden">
              <label class="form-label" for="evidence-url">URL</label>
              <input id="evidence-url" class="form-input" maxlength="4000" />
            </div>
            <div>
              <label class="form-label" for="evidence-label">Etiqueta</label>
              <input id="evidence-label" class="form-input" maxlength="160" />
            </div>
            <button type="submit" class="btn-secondary">Añadir evidencia</button>
          </form>
        `
            : ''
        }
      </article>
    </section>

    ${
      canCollaborate
        ? `
      <section class="surface-card p-5">
        <h3 class="text-sm font-semibold text-white">Actualizar informe</h3>
        <form id="report-update-form" class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="form-label" for="update-description">Descripción</label>
            <textarea id="update-description" class="form-input min-h-28" maxlength="8000" required>${escapeHtml(report.description)}</textarea>
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
          <div class="sm:col-span-2">
            <button type="submit" class="btn-primary">Guardar cambios</button>
          </div>
        </form>
      </section>
    `
        : ''
    }

    ${
      canTransfer
        ? `
      <section class="surface-card p-5">
        <h3 class="text-sm font-semibold text-white">Derivar a otro departamento</h3>
        <p class="mt-1 text-xs text-ink-400">Exclusivo de comando. El historial de derivaciones se conserva.</p>
        <form id="transfer-form" class="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
      </section>
    `
        : ''
    }

    <section class="surface-card p-5">
      <h3 class="text-sm font-semibold text-white">Historial de derivaciones</h3>
      <ul class="mt-4 space-y-2">
        ${
          (report.transfers ?? []).length
            ? report.transfers
                .map(
                  (item) => `
                  <li class="rounded-xl border border-white/10 px-3 py-2 text-sm text-ink-300">
                    <span class="text-ink-500">${formatDateTimeLabel(item.createdAt)}</span>
                    · ${escapeHtml(item.fromDepartment?.name ?? 'Sin departamento')} → ${escapeHtml(item.toDepartment?.name ?? '—')}
                    · ${escapeHtml(item.transferredByCharacter?.firstName ?? '')} ${escapeHtml(item.transferredByCharacter?.lastName ?? '')}
                    ${item.notes ? `<span class="block mt-1 text-xs text-ink-400">${escapeHtml(item.notes)}</span>` : ''}
                  </li>
                `,
                )
                .join('')
            : `<li class="text-sm text-ink-400">Sin derivaciones.</li>`
        }
      </ul>
    </section>
    </section>
  `;
}

function bindDetail(root, report, { onReload }) {
  const access = report.access ?? {};
  const canCollaborate = Boolean(access.canCollaborate ?? access.canEdit);

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
