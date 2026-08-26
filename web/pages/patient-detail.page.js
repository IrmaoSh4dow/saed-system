import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  renderMedicalLeaveBadge,
  renderPsychotechnicalBadge,
} from '../components/occupational-health/fitness-badges.js';
import {
  BLOOD_TYPE_LABELS,
  PATIENT_STATUS_LABELS,
  SEX_LABELS,
} from '../components/patients/patient-card.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listWorkplaces } from '../services/characters.service.js';
import {
  cancelMedicalLeave,
  completeMedicalLeave,
  createMedicalLeave,
  createPsychotechnicalEvaluation,
  PSYCHOTECHNICAL_RESULT_LABELS,
} from '../services/occupational-health.service.js';
import {
  createPatientInvoice,
  deletePatientInvoice,
  getPatient,
  linkPatientCharacter,
  listTreatments,
  searchLinkableCharacters,
  unlinkPatientCharacter,
  updatePatient,
} from '../services/patients.service.js';
import { findPartnerByEstablishmentSlug } from '../config/institutional-partners.js';
import { requireActiveCharacter } from '../utils/auth-guard.js';
import { formatDateLabel, formatDateTimeLabel } from '../utils/date.js';
import { PERMISSIONS } from '../utils/permissions.js';

const BADGE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
export function patientDetailPage(patientId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  const canEdit = can(PERMISSIONS.PATIENTS_UPDATE);
  const canManagePsychotechnical = can(PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_CREATE);
  const canManageLeaves = can(PERMISSIONS.MEDICAL_LEAVES_CREATE);

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'patient-detail-alert' })}
      <a data-link href="/patients" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al registro</a>
      <div id="patient-detail-root">
        <p class="text-sm text-ink-400">Cargando paciente...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Paciente',
      currentPath: '/patients',
    }),
    afterMount(root) {
      const cleanupLayout = initDashboardLayout(root);
      document.title = 'Paciente · SAED';
      let treatments = [];
      let workplaces = [];
      let searchTimer = null;

      const load = async () => {
        try {
          const [patient, treatmentList, catalog] = await Promise.all([
            getPatient(patientId),
            canEdit ? listTreatments() : Promise.resolve([]),
            listWorkplaces().catch(() => ({ civilian: [] })),
          ]);
          treatments = Array.isArray(treatmentList) ? treatmentList : [];
          workplaces = catalog?.civilian ?? [];
          renderDetail(root, patient, {
            canEdit,
            canManagePsychotechnical,
            canManageLeaves,
            treatments,
            workplaces,
          });
          bindActions(root, patient, {
            canEdit,
            canManagePsychotechnical,
            canManageLeaves,
            workplaces,
            reload: load,
            getTimer: () => searchTimer,
            setTimer: (timer) => {
              searchTimer = timer;
            },
          });
        } catch (error) {
          setAuthAlert(root, {
            id: 'patient-detail-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      };

      void load();
      return () => {
        clearTimeout(searchTimer);
        cleanupLayout?.();
      };
    },
  };
}

function renderDetail(root, patient, options = {}) {
  const {
    canEdit = false,
    canManagePsychotechnical = false,
    canManageLeaves = false,
    treatments = [],
    workplaces = [],
  } = options;
  const host = root.querySelector('#patient-detail-root');
  if (!host) return;

  const initials =
    `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const history = patient.clinicalHistory ?? {};
  const invoices = patient.invoices ?? history.invoices ?? [];
  const medicalReports = patient.medicalReports ?? history.medicalReports ?? [];
  const stats = history.stats ?? {
    medicalRecords: (history.medicalRecords ?? []).length,
    hospitalizations: (history.hospitalizations ?? []).length,
    diagnoses: (history.diagnoses ?? []).length,
    surgeries: (history.surgeries ?? []).length,
    medicalReports: medicalReports.length,
    invoices: invoices.length,
  };
  const linked = patient.linkedCharacter;
  const psycho = patient.currentPsychotechnical;
  const leave = patient.activeMedicalLeave;
  const REPORT_TYPE_LABELS = {
    CONSULTATION: 'Consulta',
    DIAGNOSTIC: 'Diagnóstico',
    PROCEDURE: 'Procedimiento',
    HOSPITALIZATION: 'Hospitalización',
    INTERNAL: 'Interno',
    OTHER: 'Otro',
  };
  const REPORT_STATUS_LABELS = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    UNDER_REVIEW: 'En revisión',
    COMPLETED: 'Finalizado',
    ARCHIVED: 'Archivado',
  };

  const medicalRecords = history.medicalRecords ?? [];
  const hospitalizations = history.hospitalizations ?? [];
  const diagnoses = history.diagnoses ?? [];
  const surgeries = history.surgeries ?? [];

  host.innerHTML = `
    <div class="space-y-4">
      <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-950">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,30,30,0.14),_transparent_45%)]"></div>
        <div class="relative p-5 md:p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-center gap-4">
              <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-400/25 bg-black/30 text-lg font-semibold text-brand-300">
                ${
                  patient.avatarUrl
                    ? `<img src="${escapeHtml(patient.avatarUrl)}" alt="" class="h-full w-full object-cover" />`
                    : escapeHtml(initials)
                }
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300">EMR · HC #${patient.recordNumber}</p>
                  ${leave?.isCurrentlyActive ? `<span class="rounded-full border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-200">Baja activa</span>` : ''}
                </div>
                <h2 class="mt-1 truncate text-2xl font-semibold tracking-tight text-white">${escapeHtml(patient.fullName)}</h2>
                <p class="mt-1 text-sm text-ink-400">
                  ${PATIENT_STATUS_LABELS[patient.status] ?? patient.status}
                  · ${escapeHtml(BLOOD_TYPE_LABELS[patient.bloodType] ?? '—')}
                  ${patient.establishment?.name ? ` · ${escapeHtml(patient.establishment.name)}` : ''}
                  ${patient.badgeNumber ? ` · Placa <span class="font-mono text-brand-200">${escapeHtml(patient.badgeNumber)}</span>` : ''}
                  ${patient.allergies ? ' · Alergias' : ''}
                  ${linked ? ` · ${escapeHtml(linked.firstName)} ${escapeHtml(linked.lastName)}` : ' · Sin vínculo'}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              ${renderPsychotechnicalBadge(psycho)}
              ${renderMedicalLeaveBadge(leave)}
              ${canEdit ? `<button type="button" id="toggle-patient-edit" class="btn-secondary !py-2">Editar</button>` : ''}
            </div>
          </div>

          <nav class="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4" id="emr-tabs">
            ${[
              ['overview', 'Resumen'],
              ['clinical', 'Clínica'],
              ['reports', 'Informes'],
              ['billing', 'Facturación'],
              ['fitness', 'Aptitud'],
            ]
              .map(
                ([id, label], index) => `
                  <button type="button" data-emr-tab="${id}"
                    class="rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                      index === 0
                        ? 'border-brand-400/40 bg-brand-500/15 text-white'
                        : 'border-white/10 text-ink-300 hover:text-white'
                    }">${label}</button>
                `,
              )
              .join('')}
          </nav>
        </div>
      </section>

      <div data-emr-panel="overview" class="grid gap-4 xl:grid-cols-12">
        <div class="space-y-4 xl:col-span-8">
          <div class="grid gap-3 lg:grid-cols-2">
            <article class="overflow-hidden rounded-2xl border ${
              !psycho
                ? 'border-white/10 bg-white/[0.02]'
                : psycho.result === 'UNFIT' || psycho.validity === 'EXPIRED'
                  ? 'border-rose-400/40 bg-rose-500/10'
                  : psycho.result === 'FIT_WITH_OBSERVATIONS' || psycho.validity === 'EXPIRING_SOON'
                    ? 'border-amber-400/35 bg-amber-500/10'
                    : 'border-emerald-400/35 bg-emerald-500/10'
            } p-4 md:p-5">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-300">Psicotécnico</p>
                  <p class="mt-2 text-xl font-semibold text-white">
                    ${escapeHtml(psycho ? PSYCHOTECHNICAL_RESULT_LABELS[psycho.result] ?? psycho.resultLabel : 'Sin evaluación')}
                  </p>
                </div>
                ${renderPsychotechnicalBadge(psycho)}
              </div>
              <dl class="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt class="text-xs text-ink-500">Emisión</dt>
                  <dd class="mt-1 text-sm text-white">${escapeHtml(formatDateLabel(psycho?.issuedAt))}</dd>
                </div>
                <div>
                  <dt class="text-xs text-ink-500">Vencimiento</dt>
                  <dd class="mt-1 text-sm text-white">${escapeHtml(psycho?.expiresAt ? formatDateLabel(psycho.expiresAt) : 'Sin vencimiento')}</dd>
                </div>
                <div>
                  <dt class="text-xs text-ink-500">Médico responsable</dt>
                  <dd class="mt-1 text-sm text-white">
                    ${
                      psycho?.physicianCharacter
                        ? escapeHtml(`${psycho.physicianCharacter.firstName} ${psycho.physicianCharacter.lastName}`)
                        : '—'
                    }
                  </dd>
                </div>
              </dl>
              ${
                psycho?.result === 'FIT_WITH_OBSERVATIONS' && psycho?.observations
                  ? `<p class="mt-4 rounded-xl border border-amber-400/20 bg-black/20 px-3 py-2 text-sm text-amber-50">${escapeHtml(psycho.observations)}</p>`
                  : ''
              }
            </article>

            <article class="overflow-hidden rounded-2xl border ${
              leave?.isCurrentlyActive
                ? 'border-rose-400/45 bg-rose-500/15 shadow-[0_0_0_1px_rgba(251,113,133,0.12)]'
                : 'border-white/10 bg-white/[0.02]'
            } p-4 md:p-5">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] ${leave?.isCurrentlyActive ? 'text-rose-300' : 'text-ink-300'}">
                    Baja médica
                  </p>
                  <p class="mt-2 text-xl font-semibold text-white">
                    ${leave?.isCurrentlyActive ? 'Activa' : 'Sin baja activa'}
                  </p>
                </div>
                ${renderMedicalLeaveBadge(leave)}
              </div>
              ${
                leave?.isCurrentlyActive
                  ? `
                    <dl class="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <dt class="text-xs text-rose-200/70">Inicio</dt>
                        <dd class="mt-1 text-sm text-white">${escapeHtml(formatDateLabel(leave.startsAt))}</dd>
                      </div>
                      <div>
                        <dt class="text-xs text-rose-200/70">Finalización</dt>
                        <dd class="mt-1 text-sm text-white">${escapeHtml(leave.endsAt ? formatDateLabel(leave.endsAt) : 'Abierta')}</dd>
                      </div>
                      <div>
                        <dt class="text-xs text-rose-200/70">Médico responsable</dt>
                        <dd class="mt-1 text-sm text-white">
                          ${
                            leave.physicianCharacter
                              ? escapeHtml(`${leave.physicianCharacter.firstName} ${leave.physicianCharacter.lastName}`)
                              : '—'
                          }
                        </dd>
                      </div>
                    </dl>
                    <p class="mt-3 text-sm text-rose-100/90">${escapeHtml(leave.reason)}</p>
                  `
                  : `<p class="mt-4 text-sm text-ink-400">No hay una baja médica vigente en este expediente.</p>`
              }
            </article>
          </div>

          ${
            patient.activeAgreement
              ? `
            <div class="overflow-hidden rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4 md:p-5">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Convenio activo</p>
                  <p class="mt-2 text-lg font-semibold text-white">${escapeHtml(patient.activeAgreement.establishmentName)}</p>
                </div>
                <span class="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  ${escapeHtml(String(patient.activeAgreement.discountPercent))}% dto.
                </span>
              </div>
              <dl class="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt class="text-xs text-emerald-200/70">Vigente desde</dt>
                  <dd class="mt-1 text-sm text-white">${escapeHtml(formatDateLabel(patient.activeAgreement.startsAt))}</dd>
                </div>
                <div>
                  <dt class="text-xs text-emerald-200/70">Vence</dt>
                  <dd class="mt-1 text-sm text-white">${escapeHtml(patient.activeAgreement.endsAt ? formatDateLabel(patient.activeAgreement.endsAt) : 'Sin vencimiento')}</dd>
                </div>
                <div>
                  <dt class="text-xs text-emerald-200/70">Estado</dt>
                  <dd class="mt-1 text-sm text-white">${escapeHtml(patient.activeAgreement.status)}</dd>
                </div>
              </dl>
            </div>
          `
              : ''
          }

          <section class="rounded-2xl border border-white/10 bg-white/[0.015] p-4 md:p-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold text-white">Datos demográficos</h3>
              <p class="text-xs text-ink-500">Identificación y contacto</p>
            </div>
            <dl class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              ${metaCard('Nacimiento', formatDateLabel(patient.birthDate))}
              ${metaCard('Sexo', SEX_LABELS[patient.sex] ?? '—')}
              ${metaCard('Teléfono', patient.phone ?? '—')}
              ${metaCard('Documento', patient.identityDocument ?? '—')}
              ${metaCard('Nacionalidad', patient.nationality ?? '—')}
              ${metaCard('Organización', patient.establishment?.name ?? 'Sin organización')}
              ${metaCard('Placa institucional', patient.badgeNumber ?? '—')}
              ${metaCard('Contacto emergencia', patient.emergencyContactName ?? '—')}
              ${metaCard('Tel. emergencia', patient.emergencyContactPhone ?? '—')}
              ${metaCard('Actualizado', formatDateTimeLabel(patient.updatedAt))}
            </dl>
          </section>

          <section class="grid gap-3 sm:grid-cols-3">
            <article class="rounded-2xl border border-white/10 px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">Alertas clínicas</p>
              <p class="mt-2 text-lg font-semibold ${patient.allergies ? 'text-amber-200' : 'text-white'}">
                ${patient.allergies ? 'Alergias registradas' : 'Sin alergias'}
              </p>
              <p class="mt-1 line-clamp-2 text-xs text-ink-400">${escapeHtml(patient.allergies || 'Ninguna alerta de alergia.')}</p>
            </article>
            <article class="rounded-2xl border border-white/10 px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">Carga clínica</p>
              <p class="mt-2 text-lg font-semibold text-white">${diagnoses.length + hospitalizations.length + surgeries.length}</p>
              <p class="mt-1 text-xs text-ink-400">Diagnósticos, hospitalizaciones y cirugías</p>
            </article>
            <article class="rounded-2xl border border-white/10 px-4 py-4">
              <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">Actividad reciente</p>
              <p class="mt-2 text-lg font-semibold text-white">${stats.medicalReports + stats.invoices}</p>
              <p class="mt-1 text-xs text-ink-400">${stats.medicalReports} informes · ${stats.invoices} facturas</p>
            </article>
          </section>
        </div>

        <aside class="space-y-4 xl:col-span-4">
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Vínculo con personaje</h3>
            <p class="mt-1 text-xs text-ink-500">Relación opcional con una identidad del portal.</p>
            ${
              linked
                ? `
                  <div class="mt-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3">
                    <p class="text-[11px] uppercase tracking-wide text-brand-300">Personaje vinculado</p>
                    <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(linked.firstName)} ${escapeHtml(linked.lastName)}</p>
                    <p class="mt-1 text-xs text-ink-400">${escapeHtml(linked.status ?? '')}</p>
                  </div>
                  ${canEdit ? `<button type="button" id="unlink-character" class="btn-secondary mt-4 w-full">Desvincular personaje</button>` : ''}
                `
                : `
                  <div class="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-3">
                    <p class="text-sm text-ink-300">Sin vínculo de personaje.</p>
                  </div>
                  ${
                    canEdit
                      ? `
                        <div class="mt-4 space-y-3">
                          <div>
                            <label class="form-label" for="link-character-query">Buscar personaje</label>
                            <input id="link-character-query" class="form-input" placeholder="Nombre o apellido..." autocomplete="off" />
                            <input type="hidden" id="link-character-id" />
                            <p id="link-character-picked" class="mt-2 hidden text-sm text-brand-300"></p>
                          </div>
                          <div id="link-character-results" class="max-h-44 space-y-2 overflow-y-auto"></div>
                          <button type="button" id="link-character-submit" class="btn-primary w-full">Vincular personaje</button>
                        </div>
                      `
                      : ''
                  }
                `
            }
          </article>
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Resumen del expediente</h3>
            <div class="mt-4 grid grid-cols-2 gap-2">
              ${historyTile('Diagnósticos', diagnoses.length)}
              ${historyTile('Hospitaliz.', hospitalizations.length)}
              ${historyTile('Informes', stats.medicalReports)}
              ${historyTile('Facturas', stats.invoices)}
            </div>
          </article>
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Trazabilidad</h3>
            <dl class="mt-4 space-y-3 text-sm">
              ${detailRow('Creado por', patient.createdByCharacter ? `${patient.createdByCharacter.firstName} ${patient.createdByCharacter.lastName}` : '—')}
              ${detailRow('Actualizado por', patient.updatedByCharacter ? `${patient.updatedByCharacter.firstName} ${patient.updatedByCharacter.lastName}` : '—')}
            </dl>
          </article>
        </aside>
      </div>

      <div data-emr-panel="clinical" class="hidden space-y-4">
        <article class="panel p-5 md:p-6 space-y-5">
          <h3 class="text-sm font-semibold text-white">Información clínica</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            ${infoBlock('Alergias', patient.allergies)}
            ${infoBlock('Antecedentes / crónicos', patient.chronicConditions)}
          </div>
          ${infoBlock('Notas', patient.notes)}
          ${
            canEdit
              ? `
            <form id="patient-edit-form" class="hidden space-y-4 border-t border-white/10 pt-5">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="edit-first-name">Nombre</label>
                  <input id="edit-first-name" class="form-input" required value="${escapeAttr(patient.firstName)}" />
                </div>
                <div>
                  <label class="form-label" for="edit-last-name">Apellidos</label>
                  <input id="edit-last-name" class="form-input" required value="${escapeAttr(patient.lastName)}" />
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="edit-birth-date">Nacimiento</label>
                  <input id="edit-birth-date" type="date" class="form-input" value="${escapeAttr(patient.birthDate ?? '')}" />
                </div>
                <div>
                  <label class="form-label" for="edit-status">Estado</label>
                  <select id="edit-status" class="form-input">
                    ${Object.entries(PATIENT_STATUS_LABELS)
                      .map(
                        ([value, label]) =>
                          `<option value="${value}" ${patient.status === value ? 'selected' : ''}>${escapeHtml(label)}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="edit-phone">Teléfono</label>
                  <input id="edit-phone" class="form-input" value="${escapeAttr(patient.phone ?? '')}" />
                </div>
                <div>
                  <label class="form-label" for="edit-document">Documento</label>
                  <input id="edit-document" class="form-input" value="${escapeAttr(patient.identityDocument ?? '')}" />
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="edit-establishment">Organización / establecimiento</label>
                  <select id="edit-establishment" class="form-input">
                    <option value="">Sin organización</option>
                    ${workplaces
                      .map(
                        (item) =>
                          `<option value="${escapeAttr(item.id)}" data-slug="${escapeAttr(item.slug)}" ${
                            patient.establishmentId === item.id ? 'selected' : ''
                          }>${escapeHtml(item.name)}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
                <div id="edit-badge-wrap" class="${
                  findPartnerByEstablishmentSlug(patient.establishment?.slug) ? '' : 'hidden'
                }">
                  <label class="form-label" for="edit-badge">Placa institucional</label>
                  <input id="edit-badge" class="form-input font-mono tracking-wide" maxlength="32" value="${escapeAttr(
                    patient.badgeNumber ?? '',
                  )}" placeholder="Ej. 1A-12" />
                  <p class="form-hint">Se elimina automáticamente si el paciente deja la agencia.</p>
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="edit-allergies">Alergias</label>
                  <textarea id="edit-allergies" class="form-input min-h-[90px]">${escapeHtml(patient.allergies ?? '')}</textarea>
                </div>
                <div>
                  <label class="form-label" for="edit-chronic">Antecedentes</label>
                  <textarea id="edit-chronic" class="form-input min-h-[90px]">${escapeHtml(patient.chronicConditions ?? '')}</textarea>
                </div>
              </div>
              <div>
                <label class="form-label" for="edit-notes">Notas</label>
                <textarea id="edit-notes" class="form-input min-h-[90px]">${escapeHtml(patient.notes ?? '')}</textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" id="cancel-patient-edit" class="btn-secondary">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar cambios</button>
              </div>
            </form>
          `
              : ''
          }
        </article>
        <div class="grid gap-4 lg:grid-cols-2">
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Diagnósticos</h3>
            <div class="mt-3 space-y-2">
              ${
                diagnoses.length
                  ? diagnoses
                      .map(
                        (item) => `
                          <div class="rounded-xl border border-white/10 px-3 py-2">
                            <p class="text-sm text-white">${escapeHtml(item.name)}</p>
                            <p class="mt-1 text-xs text-ink-500">${escapeHtml(formatDateLabel(item.diagnosedAt))}${item.code ? ` · ${escapeHtml(item.code)}` : ''}</p>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Sin diagnósticos registrados.</p>`
              }
            </div>
          </article>
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Hospitalizaciones</h3>
            <div class="mt-3 space-y-2">
              ${
                hospitalizations.length
                  ? hospitalizations
                      .map(
                        (item) => `
                          <div class="rounded-xl border border-white/10 px-3 py-2">
                            <p class="text-sm text-white">${escapeHtml(item.status)}</p>
                            <p class="mt-1 text-xs text-ink-500">${escapeHtml(formatDateLabel(item.admittedAt))} · ${escapeHtml(item.reason || 'Sin motivo')}</p>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Sin hospitalizaciones.</p>`
              }
            </div>
          </article>
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Cirugías</h3>
            <div class="mt-3 space-y-2">
              ${
                surgeries.length
                  ? surgeries
                      .map(
                        (item) => `
                          <div class="rounded-xl border border-white/10 px-3 py-2">
                            <p class="text-sm text-white">${escapeHtml(item.name || item.status)}</p>
                            <p class="mt-1 text-xs text-ink-500">${escapeHtml(item.status)}</p>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Sin cirugías.</p>`
              }
            </div>
          </article>
          <article class="panel p-5">
            <h3 class="text-sm font-semibold text-white">Expedientes</h3>
            <div class="mt-3 space-y-2">
              ${
                medicalRecords.length
                  ? medicalRecords
                      .map(
                        (item) => `
                          <div class="rounded-xl border border-white/10 px-3 py-2">
                            <p class="text-sm text-white">${escapeHtml(item.title)}</p>
                            <p class="mt-1 text-xs text-ink-500">${escapeHtml(item.status)} · ${escapeHtml(item.summary || 'Sin resumen')}</p>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Sin expedientes clínicos.</p>`
              }
            </div>
          </article>
        </div>
      </div>

      <div data-emr-panel="fitness" class="hidden grid gap-4 xl:grid-cols-12">
        <div class="space-y-4 xl:col-span-7">
          ${
            canManagePsychotechnical || canManageLeaves
              ? `
            <article class="panel p-5 md:p-6 space-y-5">
              <h3 class="text-sm font-semibold text-white">Gestión de aptitud</h3>
              ${
                canManagePsychotechnical
                  ? `
                <form id="psychotechnical-form" class="grid gap-3 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <p class="text-xs font-medium uppercase tracking-wide text-ink-500">Registrar psicotécnico</p>
                  </div>
                  <div>
                    <label class="form-label" for="psycho-result">Resultado</label>
                    <select id="psycho-result" class="form-input" required>
                      <option value="FIT">Apto</option>
                      <option value="FIT_WITH_OBSERVATIONS">Apto con Observaciones</option>
                      <option value="UNFIT">No Apto</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label" for="psycho-issued">Fecha de emisión</label>
                    <input id="psycho-issued" type="date" class="form-input" required value="${todayInputValue()}" />
                  </div>
                  <div>
                    <label class="form-label" for="psycho-expires">Fecha de vencimiento</label>
                    <input id="psycho-expires" type="date" class="form-input" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="form-label" for="psycho-notes">Observaciones</label>
                    <textarea id="psycho-notes" class="form-input min-h-[72px]" maxlength="4000"></textarea>
                  </div>
                  <div class="sm:col-span-2">
                    <button type="submit" class="btn-primary">Registrar psicotécnico</button>
                  </div>
                </form>
              `
                  : ''
              }
              ${
                canManageLeaves
                  ? `
                <form id="medical-leave-form" class="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <p class="text-xs font-medium uppercase tracking-wide text-ink-500">Registrar baja médica</p>
                  </div>
                  <div>
                    <label class="form-label" for="leave-starts">Fecha de inicio</label>
                    <input id="leave-starts" type="date" class="form-input" required value="${todayInputValue()}" />
                  </div>
                  <div>
                    <label class="form-label" for="leave-ends">Fecha de finalización</label>
                    <input id="leave-ends" type="date" class="form-input" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="form-label" for="leave-reason">Motivo</label>
                    <input id="leave-reason" class="form-input" required maxlength="500" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="form-label" for="leave-notes">Observaciones</label>
                    <textarea id="leave-notes" class="form-input min-h-[72px]" maxlength="4000"></textarea>
                  </div>
                  <div class="sm:col-span-2 flex flex-wrap gap-2">
                    <button type="submit" class="btn-primary">Registrar baja</button>
                    ${
                      leave?.isCurrentlyActive
                        ? `
                          <button type="button" id="leave-complete" class="btn-secondary">Finalizar baja activa</button>
                          <button type="button" id="leave-cancel" class="btn-secondary">Cancelar baja activa</button>
                        `
                        : ''
                    }
                  </div>
                </form>
              `
                  : ''
              }
            </article>
          `
              : `<article class="panel p-5"><p class="text-sm text-ink-400">No tienes permisos para registrar aptitud en este expediente.</p></article>`
          }
        </div>
        <aside class="space-y-4 xl:col-span-5">
          <article class="rounded-2xl border border-white/10 p-5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Estado actual</p>
            <div class="mt-4 space-y-3">
              <div class="rounded-xl border border-white/10 px-3 py-3">
                <p class="text-xs text-ink-500">Psicotécnico</p>
                <p class="mt-1 text-sm font-medium text-white">${escapeHtml(psycho ? PSYCHOTECHNICAL_RESULT_LABELS[psycho.result] ?? psycho.result : 'Sin evaluación')}</p>
                <p class="mt-1 text-xs text-ink-400">Vence ${escapeHtml(psycho?.expiresAt ? formatDateLabel(psycho.expiresAt) : '—')}</p>
              </div>
              <div class="rounded-xl border border-white/10 px-3 py-3">
                <p class="text-xs text-ink-500">Baja médica</p>
                <p class="mt-1 text-sm font-medium text-white">${leave?.isCurrentlyActive ? 'Activa' : 'Sin baja activa'}</p>
                <p class="mt-1 text-xs text-ink-400">${leave?.isCurrentlyActive ? escapeHtml(leave.reason) : 'Operativo sin restricción de baja'}</p>
              </div>
            </div>
          </article>
        </aside>
      </div>

      <div data-emr-panel="reports" class="hidden space-y-4">
          <article class="panel p-5 md:p-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 class="text-sm font-semibold text-white">Informes médicos</h3>
                <p class="mt-1 text-xs text-ink-500">Informes clínicos asociados a este paciente.</p>
              </div>
              ${
                canEdit
                  ? `<a data-link href="/reports/new?patientId=${patient.id}" class="btn-secondary !py-2 text-xs">Nuevo informe</a>`
                  : ''
              }
            </div>
            <div class="mt-5 space-y-2">
              ${
                medicalReports.length
                  ? medicalReports
                      .map(
                        (report) => `
                          <a data-link href="/reports?id=${report.id}" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-brand-400/30 hover:bg-brand-500/5">
                            <div class="min-w-0">
                              <p class="text-sm font-medium text-white">
                                #${report.reportNumber} · ${escapeHtml(report.title)}
                              </p>
                              <p class="mt-1 text-xs text-ink-500">
                                ${escapeHtml(REPORT_TYPE_LABELS[report.type] ?? report.type)}
                                · ${escapeHtml(REPORT_STATUS_LABELS[report.status] ?? report.status)}
                                ${report.incidentDate ? ` · ${escapeHtml(formatDateLabel(report.incidentDate))}` : ''}
                              </p>
                            </div>
                            <span class="text-xs font-medium text-brand-300">Abrir →</span>
                          </a>
                        `,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Aún no hay informes médicos para este paciente.</p>`
              }
            </div>
          </article>
      </div>

      <div data-emr-panel="billing" class="hidden space-y-4">
          <article class="panel p-5 md:p-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 class="text-sm font-semibold text-white">Facturas</h3>
                <p class="mt-1 text-xs text-ink-500">Fecha · Tratamiento · institución facturada (snapshot).</p>
              </div>
              <p class="text-sm font-semibold text-brand-300">
                Total $${formatMoney(invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0))}
              </p>
            </div>

            ${
              canEdit
                ? `
              <form id="patient-invoice-form" class="mt-5 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                <div>
                  <label class="form-label" for="invoice-date">Fecha</label>
                  <input id="invoice-date" type="date" class="form-input" required value="${todayInputValue()}" />
                </div>
                <div>
                  <label class="form-label" for="invoice-treatment">Tratamiento</label>
                  <select id="invoice-treatment" class="form-input" required>
                    <option value="">Selecciona un tratamiento...</option>
                    ${treatments
                      .map(
                        (item) =>
                          `<option value="${item.id}">${escapeHtml(item.name)} — $${formatMoney(item.price)}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
                <button type="submit" class="btn-primary">Añadir factura</button>
              </form>
            `
                : ''
            }

            <div class="mt-5 space-y-2" id="patient-invoices-list">
              ${
                invoices.length
                  ? invoices
                      .map(
                        (invoice) => `
                          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                            <div class="min-w-0">
                              <p class="text-sm font-medium text-white">
                                ${escapeHtml(formatDateLabel(invoice.issuedAt))}
                                <span class="text-ink-500"> — </span>
                                ${escapeHtml(invoice.treatmentName)}
                              </p>
                              <p class="mt-1 text-xs text-ink-500">
                                Factura #${invoice.invoiceNumber}
                                ${invoice.billingOrganization ? ` · ${escapeHtml(invoice.billingOrganization)}` : ''}
                                ${
                                  Number(invoice.discountPercent) > 0
                                    ? ` · Convenio ${escapeHtml(String(invoice.discountPercent))}%`
                                    : ''
                                }
                              </p>
                              ${
                                Number(invoice.discountPercent) > 0
                                  ? `<p class="mt-1 text-xs text-ink-400">Original $${formatMoney(invoice.originalAmount)} − $${formatMoney(invoice.discountAmount)} = <span class="text-emerald-300">$${formatMoney(invoice.amount)}</span></p>`
                                  : ''
                              }
                            </div>
                            <div class="flex items-center gap-3">
                              <span class="text-sm font-semibold text-brand-300">$${formatMoney(invoice.amount)}</span>
                              ${
                                canEdit
                                  ? `<button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" data-delete-invoice="${invoice.id}">Eliminar</button>`
                                  : ''
                              }
                            </div>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="text-sm text-ink-400">Aún no hay facturas en esta ficha.</p>`
              }
            </div>
          </article>
      </div>

    </div>
  `;

  host.querySelectorAll('[data-emr-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-emr-tab');
      host.querySelectorAll('[data-emr-tab]').forEach((item) => {
        const active = item.getAttribute('data-emr-tab') === tab;
        item.className = `rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
          active
            ? 'border-brand-400/40 bg-brand-500/15 text-white'
            : 'border-white/10 text-ink-300 hover:text-white'
        }`;
      });
      host.querySelectorAll('[data-emr-panel]').forEach((panel) => {
        const match = panel.getAttribute('data-emr-panel') === tab;
        panel.classList.toggle('hidden', !match);
        if (match) {
          panel.classList.remove('hidden');
        }
      });
    });
  });
}

function bindActions(root, patient, options = {}) {
  const {
    canEdit = false,
    canManagePsychotechnical = false,
    canManageLeaves = false,
    workplaces = [],
    reload,
    getTimer,
    setTimer,
  } = options;

  const syncEditBadgeVisibility = () => {
    const select = root.querySelector('#edit-establishment');
    const wrap = root.querySelector('#edit-badge-wrap');
    const badgeInput = root.querySelector('#edit-badge');
    const option = select?.selectedOptions?.[0];
    const allowsBadge = Boolean(
      findPartnerByEstablishmentSlug(option?.getAttribute('data-slug')),
    );
    wrap?.classList.toggle('hidden', !allowsBadge);
    if (!allowsBadge && badgeInput) {
      badgeInput.value = '';
    }
  };
  root.querySelector('#psychotechnical-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canManagePsychotechnical) return;
    try {
      await createPsychotechnicalEvaluation({
        patientId: patient.id,
        result: root.querySelector('#psycho-result').value,
        issuedAt: root.querySelector('#psycho-issued').value,
        expiresAt: root.querySelector('#psycho-expires').value || null,
        observations: root.querySelector('#psycho-notes').value.trim() || undefined,
      });
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Psicotécnico registrado.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#medical-leave-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!canManageLeaves) return;
    try {
      await createMedicalLeave({
        patientId: patient.id,
        startsAt: root.querySelector('#leave-starts').value,
        endsAt: root.querySelector('#leave-ends').value || null,
        reason: root.querySelector('#leave-reason').value.trim(),
        observations: root.querySelector('#leave-notes').value.trim() || undefined,
      });
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Baja médica registrada.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#leave-complete')?.addEventListener('click', async () => {
    if (!canManageLeaves || !patient.activeMedicalLeave?.id) return;
    try {
      await completeMedicalLeave(patient.activeMedicalLeave.id);
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Baja médica finalizada.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#leave-cancel')?.addEventListener('click', async () => {
    if (!canManageLeaves || !patient.activeMedicalLeave?.id) return;
    try {
      await cancelMedicalLeave(patient.activeMedicalLeave.id);
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Baja médica cancelada.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  if (!canEdit) return;

  root.querySelector('#toggle-patient-edit')?.addEventListener('click', () => {
    root.querySelector('[data-emr-tab="clinical"]')?.click();
    root.querySelector('#patient-edit-form')?.classList.remove('hidden');
  });
  root.querySelector('#cancel-patient-edit')?.addEventListener('click', () => {
    root.querySelector('#patient-edit-form')?.classList.add('hidden');
  });
  root.querySelector('#edit-establishment')?.addEventListener('change', syncEditBadgeVisibility);

  root.querySelector('#patient-edit-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const establishmentId = root.querySelector('#edit-establishment')?.value || null;
    const selected = workplaces.find((item) => item.id === establishmentId);
    const allowsBadge = Boolean(findPartnerByEstablishmentSlug(selected?.slug));
    const badgeRaw = root.querySelector('#edit-badge')?.value?.trim() ?? '';
    if (allowsBadge && badgeRaw && !BADGE_PATTERN.test(badgeRaw.toUpperCase())) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: 'La placa debe tener un formato como 1A-12, 3B-45 o ADAM-21.',
      });
      return;
    }
    try {
      await updatePatient(patient.id, {
        firstName: root.querySelector('#edit-first-name').value.trim(),
        lastName: root.querySelector('#edit-last-name').value.trim(),
        birthDate: root.querySelector('#edit-birth-date').value || null,
        phone: root.querySelector('#edit-phone').value.trim() || null,
        identityDocument: root.querySelector('#edit-document').value.trim() || null,
        allergies: root.querySelector('#edit-allergies').value.trim() || null,
        chronicConditions: root.querySelector('#edit-chronic').value.trim() || null,
        notes: root.querySelector('#edit-notes').value.trim() || null,
        status: root.querySelector('#edit-status').value,
        establishmentId,
        badgeNumber: allowsBadge ? badgeRaw.toUpperCase() || null : null,
      });
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Ficha del paciente actualizada.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#unlink-character')?.addEventListener('click', async () => {
    try {
      await unlinkPatientCharacter(patient.id);
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Personaje desvinculado del paciente.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  const runCharacterSearch = async () => {
    const query = root.querySelector('#link-character-query')?.value?.trim() ?? '';
    const host = root.querySelector('#link-character-results');
    if (!host) return;
    if (query.length < 2) {
      host.innerHTML = '';
      return;
    }
    try {
      const results = await searchLinkableCharacters(query);
      host.innerHTML = results.length
        ? results
            .map(
              (item) => `
                <button type="button" class="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/[0.04]"
                  data-pick-character="${item.id}"
                  data-pick-name="${escapeAttr(item.fullName)}">
                  <span class="min-w-0">
                    <span class="block truncate text-sm text-white">${escapeHtml(item.fullName)}</span>
                    <span class="block truncate text-xs text-ink-400">${escapeHtml(item.status ?? '')}${item.birthDate ? ` · ${escapeHtml(item.birthDate)}` : ''}</span>
                  </span>
                </button>
              `,
            )
            .join('')
        : `<p class="text-xs text-ink-500">Sin personajes disponibles (o ya vinculados).</p>`;
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  };

  root.querySelector('#link-character-query')?.addEventListener('input', () => {
    clearTimeout(getTimer());
    setTimer(setTimeout(() => void runCharacterSearch(), 280));
  });

  root.querySelector('#link-character-results')?.addEventListener('click', (event) => {
    const pick = event.target.closest('[data-pick-character]');
    if (!pick) return;
    root.querySelector('#link-character-id').value = pick.getAttribute('data-pick-character');
    const picked = root.querySelector('#link-character-picked');
    picked.classList.remove('hidden');
    picked.textContent = `Seleccionado: ${pick.getAttribute('data-pick-name')}`;
    root.querySelector('#link-character-results').innerHTML = '';
  });

  root.querySelector('#link-character-submit')?.addEventListener('click', async () => {
    const characterId = root.querySelector('#link-character-id')?.value?.trim();
    if (!characterId) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: 'Selecciona un personaje de los resultados.',
      });
      return;
    }
    try {
      await linkPatientCharacter(patient.id, characterId);
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Personaje vinculado al paciente.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#patient-invoice-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await createPatientInvoice(patient.id, {
        issuedAt: root.querySelector('#invoice-date').value,
        treatmentId: root.querySelector('#invoice-treatment').value,
      });
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'success',
        message: 'Factura añadida.',
      });
      await reload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'patient-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-delete-invoice]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await deletePatientInvoice(patient.id, button.getAttribute('data-delete-invoice'));
        setAuthAlert(root, {
          id: 'patient-detail-alert',
          type: 'success',
          message: 'Factura eliminada.',
        });
        await reload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'patient-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

function historyTile(label, countOrItems) {
  const count = Array.isArray(countOrItems)
    ? countOrItems.length
    : Number(countOrItems || 0);
  return `
    <div class="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <span class="text-sm text-ink-200">${label}</span>
      <span class="text-xs font-semibold text-ink-500">${count}</span>
    </div>
  `;
}

function infoBlock(label, value) {
  return `
    <div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${label}</p>
      <p class="mt-2 whitespace-pre-wrap text-sm text-ink-100">${escapeHtml(value || 'Sin registrar')}</p>
    </div>
  `;
}

function metaCard(label, value) {
  return `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <dt class="text-[11px] uppercase tracking-wide text-ink-500">${label}</dt>
      <dd class="mt-0.5 text-sm font-medium text-white break-words">${escapeHtml(String(value))}</dd>
    </div>
  `;
}

function detailRow(label, value) {
  return `
    <div class="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <dt class="text-ink-400">${label}</dt>
      <dd class="text-right font-medium text-white">${escapeHtml(value)}</dd>
    </div>
  `;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}
