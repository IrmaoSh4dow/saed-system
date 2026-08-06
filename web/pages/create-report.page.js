import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listDepartments } from '../services/departments.service.js';
import { getPatient, searchPatients } from '../services/patients.service.js';
import { createReport, searchReportOfficers } from '../services/reports.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { navigate } from '../utils/router.js';
import { resolveUploadUrl } from '../utils/media.js';
import { PERMISSIONS } from '../utils/permissions.js';

const REPORT_TYPES = [
  { value: 'CONSULTATION', label: 'Consulta' },
  { value: 'DIAGNOSTIC', label: 'Diagnóstico' },
  { value: 'PROCEDURE', label: 'Procedimiento' },
  { value: 'HOSPITALIZATION', label: 'Hospitalización' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'OTHER', label: 'Otro' },
];

export function createReportPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.REPORTS_CREATE)) {
    return { html: '', afterMount: () => {} };
  }

  const { activeCharacter } = getAuthState();
  const myOfficerId = activeCharacter?.staffProfile?.id ?? null;
  const presetPatientId = new URLSearchParams(window.location.search).get('patientId');

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'create-report-alert' })}
      <a data-link href="/reports" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver a informes</a>

      <section class="panel p-5 md:p-8">
        <p class="landing-eyebrow">Dominio clínico</p>
        <h2 class="mt-1 text-2xl font-semibold text-white">Nuevo informe médico</h2>
        <p class="mt-2 text-sm text-ink-300">
          Todo informe pertenece a un paciente. Busca y selecciona el paciente antes de documentar.
        </p>

        <form id="create-report-form" class="mt-8 space-y-6">
          <div class="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 md:p-5">
            <h3 class="text-sm font-semibold text-white">1. Paciente</h3>
            <p class="mt-1 text-xs text-ink-400">Busca por nombre, apellidos o coincidencias parciales.</p>
            <div class="mt-4">
              <label class="form-label" for="patient-query">Buscar paciente</label>
              <input id="patient-query" class="form-input" placeholder="Ej. Grant Mercer..." autocomplete="off" />
              <input type="hidden" id="report-patient-id" />
              <div id="patient-selected" class="mt-3 hidden rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-3"></div>
              <div id="patient-results" class="mt-3 max-h-56 space-y-2 overflow-y-auto"></div>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="form-label" for="report-title">Título</label>
              <input id="report-title" class="form-input" required maxlength="200" />
            </div>
            <div>
              <label class="form-label" for="report-type">Tipo</label>
              <select id="report-type" class="form-input" required>
                ${REPORT_TYPES.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label" for="report-priority">Prioridad</label>
              <select id="report-priority" class="form-input">
                <option value="LOW">Baja</option>
                <option value="MEDIUM" selected>Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="report-status">Estado</label>
              <select id="report-status" class="form-input">
                <option value="PENDING" selected>Pendiente</option>
                <option value="IN_PROGRESS">En progreso</option>
                <option value="UNDER_REVIEW">En revisión</option>
                <option value="COMPLETED">Finalizado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="report-date">Fecha clínica</label>
              <input id="report-date" type="date" class="form-input" />
            </div>
            <div class="md:col-span-2">
              <label class="form-label" for="report-location">Lugar</label>
              <input id="report-location" class="form-input" maxlength="200" />
            </div>
            <div class="md:col-span-2">
              <label class="form-label" for="report-department">Departamento responsable</label>
              <select id="report-department" class="form-input">
                <option value="">Según encargado / mi departamento</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="form-label" for="report-description">Descripción clínica</label>
              <textarea id="report-description" class="form-input min-h-[140px]" required maxlength="8000"></textarea>
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 p-4">
            <h3 class="text-sm font-semibold text-white">Personal encargado</h3>
            <div class="mt-3 flex flex-wrap gap-3">
              <label class="inline-flex items-center gap-2 text-sm text-ink-300">
                <input type="radio" name="lead-mode" value="self" checked ${myOfficerId ? '' : 'disabled'} />
                Asignarme a mí
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-ink-300">
                <input type="radio" name="lead-mode" value="other" />
                Asignar otro personal
              </label>
            </div>
            <div id="lead-search-wrap" class="mt-4 hidden">
              <label class="form-label" for="lead-query">Buscar personal</label>
              <input id="lead-query" class="form-input" placeholder="Nombre, apellido o nº empleado..." autocomplete="off" />
              <input type="hidden" id="lead-officer-id" />
              <p id="lead-picked" class="mt-2 hidden text-sm text-brand-300"></p>
              <div id="lead-results" class="mt-2 max-h-48 space-y-2 overflow-y-auto"></div>
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 p-4">
            <h3 class="text-sm font-semibold text-white">Personal involucrado</h3>
            <label class="form-label mt-3" for="involved-query">Buscar y agregar</label>
            <input id="involved-query" class="form-input" placeholder="Nombre, apellido o nº empleado..." autocomplete="off" />
            <div id="involved-results" class="mt-2 max-h-40 space-y-2 overflow-y-auto"></div>
            <div id="involved-chips" class="mt-3 flex flex-wrap gap-2"></div>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <a data-link href="/reports" class="btn-secondary text-center">Cancelar</a>
            <button type="submit" class="btn-primary">Guardar informe</button>
          </div>
        </form>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Nuevo informe',
      currentPath: '/reports',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Nuevo informe · SAED';

      const involved = new Map();
      let leadTimer = null;
      let involvedTimer = null;
      let patientTimer = null;

      const selectPatient = (patient) => {
        root.querySelector('#report-patient-id').value = patient.id;
        const host = root.querySelector('#patient-selected');
        host.classList.remove('hidden');
        host.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[11px] uppercase tracking-wide text-brand-300">Paciente seleccionado</p>
              <p class="mt-1 text-sm font-semibold text-white">
                HC #${patient.recordNumber} · ${escapeHtml(patient.fullName ?? `${patient.firstName} ${patient.lastName}`)}
              </p>
            </div>
            <button type="button" id="clear-patient" class="btn-secondary !py-1.5 !px-3 text-xs">Cambiar</button>
          </div>
        `;
        root.querySelector('#patient-results').innerHTML = '';
        root.querySelector('#patient-query').value = '';
        root.querySelector('#clear-patient')?.addEventListener('click', () => {
          root.querySelector('#report-patient-id').value = '';
          host.classList.add('hidden');
          host.innerHTML = '';
        });
      };

      if (presetPatientId) {
        void getPatient(presetPatientId)
          .then((patient) => selectPatient(patient))
          .catch(() => {});
      }

      root.querySelector('#patient-query')?.addEventListener('input', (event) => {
        clearTimeout(patientTimer);
        patientTimer = setTimeout(async () => {
          const q = event.target.value.trim();
          const results = root.querySelector('#patient-results');
          if (!results) return;
          if (q.length < 2) {
            results.innerHTML = '';
            return;
          }
          try {
            const items = await searchPatients({ q });
            results.innerHTML = items.length
              ? items
                  .slice(0, 12)
                  .map(
                    (item) => `
                      <button type="button" class="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-left hover:bg-white/[0.04]"
                        data-patient-id="${escapeAttr(item.id)}"
                        data-patient-record="${escapeAttr(item.recordNumber)}"
                        data-patient-name="${escapeAttr(item.fullName)}">
                        <span class="min-w-0">
                          <span class="block truncate text-sm text-white">${escapeHtml(item.fullName)}</span>
                          <span class="block truncate text-xs text-ink-400">
                            HC #${item.recordNumber}${item.birthDate ? ` · ${escapeHtml(item.birthDate)}` : ''}${item.phone ? ` · ${escapeHtml(item.phone)}` : ''}
                          </span>
                        </span>
                        <span class="text-xs text-brand-300">Seleccionar</span>
                      </button>
                    `,
                  )
                  .join('')
              : `<p class="text-xs text-ink-500">Sin pacientes. <a data-link href="/patients/new" class="text-brand-300">Registrar paciente</a></p>`;

            results.querySelectorAll('[data-patient-id]').forEach((button) => {
              button.addEventListener('click', () => {
                selectPatient({
                  id: button.getAttribute('data-patient-id'),
                  recordNumber: button.getAttribute('data-patient-record'),
                  fullName: button.getAttribute('data-patient-name'),
                });
              });
            });
          } catch (error) {
            results.innerHTML = `<p class="text-xs text-rose-300">${getApiErrorMessage(error)}</p>`;
          }
        }, 250);
      });

      void listDepartments()
        .then((departments) => {
          const select = root.querySelector('#report-department');
          if (!select) return;
          select.innerHTML += departments
            .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
            .join('');
        })
        .catch(() => {});

      const syncLeadMode = () => {
        const mode = root.querySelector('input[name="lead-mode"]:checked')?.value;
        root.querySelector('#lead-search-wrap')?.classList.toggle('hidden', mode !== 'other');
      };
      root.querySelectorAll('input[name="lead-mode"]').forEach((input) => {
        input.addEventListener('change', syncLeadMode);
      });
      syncLeadMode();

      const renderInvolved = () => {
        const host = root.querySelector('#involved-chips');
        if (!host) return;
        host.innerHTML = [...involved.values()]
          .map(
            (item) => `
              <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ink-200">
                ${escapeHtml(item.label)}
                <button type="button" data-remove-involved="${item.id}" class="text-rose-300">×</button>
              </span>
            `,
          )
          .join('');
        host.querySelectorAll('[data-remove-involved]').forEach((button) => {
          button.addEventListener('click', () => {
            involved.delete(button.getAttribute('data-remove-involved'));
            renderInvolved();
          });
        });
      };

      const bindSearch = (inputId, resultsId, onPick) => {
        const input = root.querySelector(`#${inputId}`);
        const results = root.querySelector(`#${resultsId}`);
        if (!input || !results) return;

        input.addEventListener('input', () => {
          clearTimeout(inputId === 'lead-query' ? leadTimer : involvedTimer);
          const timer = setTimeout(async () => {
            const q = input.value.trim();
            if (q.length < 2) {
              results.innerHTML = '';
              return;
            }
            try {
              const items = await searchReportOfficers(q);
              results.innerHTML = items.length
                ? items
                    .map((item) => {
                      const avatar = resolveUploadUrl(item.character?.avatarUrl);
                      const name = `${item.character.firstName} ${item.character.lastName}`;
                      return `
                        <button type="button" class="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-left hover:bg-white/[0.04]"
                          data-pick-id="${item.id}"
                          data-pick-label="${escapeHtml(name)} · ${escapeHtml(item.employeeNumber)}">
                          <div class="h-8 w-8 overflow-hidden rounded-lg bg-surface-950">
                            ${
                              avatar
                                ? `<img src="${avatar}" alt="" class="h-full w-full object-cover" />`
                                : ''
                            }
                          </div>
                          <span class="min-w-0">
                            <span class="block truncate text-sm text-white">${escapeHtml(name)}</span>
                            <span class="block truncate text-xs text-ink-400">${escapeHtml(item.employeeNumber)} · ${escapeHtml(item.rank?.name ?? '—')}</span>
                          </span>
                        </button>
                      `;
                    })
                    .join('')
                : `<p class="text-xs text-ink-500">Sin resultados.</p>`;
              results.querySelectorAll('[data-pick-id]').forEach((button) => {
                button.addEventListener('click', () => {
                  onPick(
                    button.getAttribute('data-pick-id'),
                    button.getAttribute('data-pick-label'),
                  );
                  results.innerHTML = '';
                  input.value = '';
                });
              });
            } catch (error) {
              results.innerHTML = `<p class="text-xs text-rose-300">${getApiErrorMessage(error)}</p>`;
            }
          }, 250);
          if (inputId === 'lead-query') leadTimer = timer;
          else involvedTimer = timer;
        });
      };

      bindSearch('lead-query', 'lead-results', (id, label) => {
        root.querySelector('#lead-officer-id').value = id;
        const picked = root.querySelector('#lead-picked');
        if (picked) {
          picked.textContent = label;
          picked.classList.remove('hidden');
        }
      });

      bindSearch('involved-query', 'involved-results', (id, label) => {
        involved.set(id, { id, label });
        renderInvolved();
      });

      root.querySelector('#create-report-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const patientId = root.querySelector('#report-patient-id')?.value?.trim();
        if (!patientId) {
          setAuthAlert(root, {
            id: 'create-report-alert',
            type: 'error',
            message: 'Debes seleccionar un paciente antes de guardar el informe.',
          });
          return;
        }

        const mode = root.querySelector('input[name="lead-mode"]:checked')?.value;
        const leadStaffId =
          mode === 'other' ? root.querySelector('#lead-officer-id')?.value : null;

        if (mode === 'other' && !leadStaffId) {
          setAuthAlert(root, {
            id: 'create-report-alert',
            type: 'error',
            message: 'Selecciona un personal encargado.',
          });
          return;
        }

        try {
          const report = await createReport({
            patientId,
            title: root.querySelector('#report-title').value.trim(),
            type: root.querySelector('#report-type').value,
            description: root.querySelector('#report-description').value.trim(),
            incidentDate: root.querySelector('#report-date').value || undefined,
            location: root.querySelector('#report-location').value.trim() || undefined,
            status: root.querySelector('#report-status').value,
            priority: root.querySelector('#report-priority').value,
            departmentId: root.querySelector('#report-department').value || undefined,
            assignSelfAsLead: mode === 'self',
            leadStaffId: mode === 'other' ? leadStaffId : undefined,
            involvedOfficerIds: [...involved.keys()],
          });
          void navigate(`/patients?id=${patientId}`, { replace: true });
          // Keep report id available if navigation lands on patient; detail also links from there.
          sessionStorage.setItem('saed.lastCreatedReportId', report.id);
        } catch (error) {
          setAuthAlert(root, {
            id: 'create-report-alert',
            type: 'error',
            message: getApiErrorMessage(error),
          });
        }
      });

      return () => {
        clearTimeout(patientTimer);
        clearTimeout(leadTimer);
        clearTimeout(involvedTimer);
        cleanup?.();
      };
    },
  };
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
