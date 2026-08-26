import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import {
  BLOOD_TYPE_LABELS,
  PATIENT_STATUS_LABELS,
  SEX_LABELS,
  renderPatientCard,
} from '../components/patients/patient-card.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listWorkplaces } from '../services/characters.service.js';
import { createPatient, searchPatients } from '../services/patients.service.js';
import { findPartnerByEstablishmentSlug } from '../config/institutional-partners.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { navigate } from '../utils/router.js';

const BADGE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

export function createPatientPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.PATIENTS_CREATE)) {
    return { html: '', afterMount: () => {} };
  }

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'create-patient-alert' })}

      <section class="panel p-5 md:p-6 lg:p-8">
        <div class="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <p class="landing-eyebrow">Pacientes</p>
            <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">Registrar paciente</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-300">
              Crea un registro clínico hospitalario. No es un personaje: no inicia sesión ni tiene permisos.
            </p>
          </div>
          <a data-link href="/patients" class="btn-secondary shrink-0 self-start sm:self-auto">Volver al listado</a>
        </div>

        <form id="create-patient-form" class="mt-6 space-y-8" novalidate>
          <div class="grid gap-6 lg:grid-cols-12">
            <div class="space-y-5 lg:col-span-7">
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="patient-first-name">Nombre</label>
                  <input id="patient-first-name" class="form-input" required maxlength="80" autocomplete="off" />
                </div>
                <div>
                  <label class="form-label" for="patient-last-name">Apellidos</label>
                  <input id="patient-last-name" class="form-input" required maxlength="80" autocomplete="off" />
                </div>
              </div>
              <div>
                <label class="form-label" for="patient-middle-name">Segundo nombre</label>
                <input id="patient-middle-name" class="form-input" maxlength="80" autocomplete="off" />
              </div>
              <div class="grid gap-5 sm:grid-cols-3">
                <div>
                  <label class="form-label" for="patient-birth-date">Fecha de nacimiento</label>
                  <input id="patient-birth-date" type="date" class="form-input" />
                </div>
                <div>
                  <label class="form-label" for="patient-sex">Sexo</label>
                  <select id="patient-sex" class="form-input">
                    <option value="">—</option>
                    ${Object.entries(SEX_LABELS)
                      .map(([value, label]) => `<option value="${value}">${label}</option>`)
                      .join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" for="patient-blood">Grupo sanguíneo</label>
                  <select id="patient-blood" class="form-input">
                    ${Object.entries(BLOOD_TYPE_LABELS)
                      .map(
                        ([value, label]) =>
                          `<option value="${value}" ${value === 'UNKNOWN' ? 'selected' : ''}>${label}</option>`,
                      )
                      .join('')}
                  </select>
                </div>
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="patient-nationality">Nacionalidad</label>
                  <input id="patient-nationality" class="form-input" maxlength="80" />
                </div>
                <div>
                  <label class="form-label" for="patient-phone">Teléfono</label>
                  <input id="patient-phone" class="form-input" maxlength="40" />
                </div>
              </div>
              <div>
                <label class="form-label" for="patient-document">Documento de identidad</label>
                <input id="patient-document" class="form-input" maxlength="64" placeholder="Opcional · ayuda a evitar duplicados" />
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="patient-allergies">Alergias</label>
                  <textarea id="patient-allergies" class="form-input min-h-[96px] resize-y" maxlength="2000"></textarea>
                </div>
                <div>
                  <label class="form-label" for="patient-chronic">Antecedentes / crónicos</label>
                  <textarea id="patient-chronic" class="form-input min-h-[96px] resize-y" maxlength="2000"></textarea>
                </div>
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="form-label" for="patient-emergency-name">Contacto de emergencia</label>
                  <input id="patient-emergency-name" class="form-input" maxlength="120" />
                </div>
                <div>
                  <label class="form-label" for="patient-emergency-phone">Teléfono de emergencia</label>
                  <input id="patient-emergency-phone" class="form-input" maxlength="40" />
                </div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <div>
                  <p class="text-sm font-semibold text-white">Organización / establecimiento</p>
                  <p class="mt-1 text-xs text-ink-500">Independiente del personaje. Se usa para convenios y los directorios institucionales.</p>
                </div>
                <div>
                  <label class="form-label" for="patient-establishment">Establecimiento</label>
                  <select id="patient-establishment" class="form-input">
                    <option value="">Sin organización</option>
                  </select>
                </div>
                <div id="patient-badge-wrap" class="hidden">
                  <label class="form-label" for="patient-badge">Placa institucional</label>
                  <input id="patient-badge" class="form-input font-mono tracking-wide" maxlength="32" placeholder="Ej. 1A-12 / ADAM-21" autocomplete="off" />
                  <p class="form-hint">Opcional. Solo disponible para pacientes de una agencia institucional.</p>
                </div>
              </div>
              <div>
                <label class="form-label" for="patient-notes">Notas clínicas iniciales</label>
                <textarea id="patient-notes" class="form-input min-h-[100px] resize-y" maxlength="4000"></textarea>
              </div>
            </div>

            <aside class="space-y-4 lg:col-span-5">
              <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <p class="text-sm font-semibold text-white">Coincidencias posibles</p>
                <p class="mt-1 text-xs text-ink-500">
                  Se buscan duplicados mientras escribes. Un paciente ≠ un personaje.
                </p>
                <div id="patient-matches" class="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
                  <p class="text-sm text-ink-400">Escribe nombre y apellidos para buscar.</p>
                </div>
              </div>
              <div id="duplicate-confirm-box" class="hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p class="text-sm font-semibold text-amber-200">Posible duplicado</p>
                <p class="mt-1 text-xs text-amber-100/80">
                  Revisa las coincidencias. Si confirmas que es otra persona, puedes forzar el registro.
                </p>
                <label class="mt-3 flex items-start gap-2 text-sm text-amber-100">
                  <input id="force-create" type="checkbox" class="mt-1" />
                  <span>He revisado las coincidencias y confirmo que este paciente es distinto.</span>
                </label>
              </div>
            </aside>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <a data-link href="/patients" class="btn-secondary text-center">Cancelar</a>
            <button type="submit" class="btn-primary">Crear registro clínico</button>
          </div>
        </form>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Registrar paciente',
      currentPath: '/patients',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      document.title = 'Registrar paciente · SAED';
      let searchTimer = null;
      let workplaces = [];

      const syncBadgeVisibility = () => {
        const select = root.querySelector('#patient-establishment');
        const wrap = root.querySelector('#patient-badge-wrap');
        const badgeInput = root.querySelector('#patient-badge');
        const selected = workplaces.find((item) => item.id === select?.value);
        const allowsBadge = Boolean(findPartnerByEstablishmentSlug(selected?.slug));
        wrap?.classList.toggle('hidden', !allowsBadge);
        if (!allowsBadge && badgeInput) {
          badgeInput.value = '';
        }
      };

      void listWorkplaces()
        .then((catalog) => {
          workplaces = catalog?.civilian ?? [];
          const select = root.querySelector('#patient-establishment');
          if (!select) return;
          select.innerHTML = [
            '<option value="">Sin organización</option>',
            ...workplaces.map(
              (item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`,
            ),
          ].join('');
          syncBadgeVisibility();
        })
        .catch(() => {});

      root.querySelector('#patient-establishment')?.addEventListener('change', syncBadgeVisibility);

      const readPayload = (forceCreate = false) => {
        const establishmentId = root.querySelector('#patient-establishment')?.value || undefined;
        const selected = workplaces.find((item) => item.id === establishmentId);
        const allowsBadge = Boolean(findPartnerByEstablishmentSlug(selected?.slug));
        const badgeRaw = root.querySelector('#patient-badge')?.value?.trim() ?? '';
        return {
          firstName: root.querySelector('#patient-first-name').value.trim(),
          lastName: root.querySelector('#patient-last-name').value.trim(),
          middleName: root.querySelector('#patient-middle-name').value.trim() || undefined,
          birthDate: root.querySelector('#patient-birth-date').value || undefined,
          sex: root.querySelector('#patient-sex').value || undefined,
          bloodType: root.querySelector('#patient-blood').value || undefined,
          nationality: root.querySelector('#patient-nationality').value.trim() || undefined,
          phone: root.querySelector('#patient-phone').value.trim() || undefined,
          identityDocument: root.querySelector('#patient-document').value.trim() || undefined,
          allergies: root.querySelector('#patient-allergies').value.trim() || undefined,
          chronicConditions: root.querySelector('#patient-chronic').value.trim() || undefined,
          emergencyContactName: root.querySelector('#patient-emergency-name').value.trim() || undefined,
          emergencyContactPhone: root.querySelector('#patient-emergency-phone').value.trim() || undefined,
          notes: root.querySelector('#patient-notes').value.trim() || undefined,
          establishmentId,
          badgeNumber: allowsBadge && badgeRaw ? badgeRaw.toUpperCase() : undefined,
          forceCreate: forceCreate || Boolean(root.querySelector('#force-create')?.checked),
        };
      };

      const runMatchSearch = async () => {
        const firstName = root.querySelector('#patient-first-name')?.value?.trim() ?? '';
        const lastName = root.querySelector('#patient-last-name')?.value?.trim() ?? '';
        const host = root.querySelector('#patient-matches');
        if (!host) return;

        if (firstName.length + lastName.length < 2) {
          host.innerHTML = `<p class="text-sm text-ink-400">Escribe nombre y apellidos para buscar.</p>`;
          return;
        }

        try {
          const q = `${firstName} ${lastName}`.trim();
          const matches = await searchPatients({ q, firstName, lastName });
          if (!matches.length) {
            host.innerHTML = `<p class="text-sm text-emerald-300/90">Sin coincidencias cercanas.</p>`;
            root.querySelector('#duplicate-confirm-box')?.classList.add('hidden');
            return;
          }

          host.innerHTML = matches
            .slice(0, 8)
            .map((item) => {
              const score = item.matchScore != null ? ` · ${(item.matchScore * 100).toFixed(0)}%` : '';
              return `
                <a data-link href="/patients?id=${item.id}" class="block rounded-xl border border-white/10 px-3 py-3 hover:bg-white/[0.03]">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-medium text-white">HC #${item.recordNumber} · ${escapeHtml(item.fullName)}</p>
                    <span class="text-[11px] text-ink-500">${PATIENT_STATUS_LABELS[item.status] ?? item.status}${score}</span>
                  </div>
                  <p class="mt-1 text-xs text-ink-400">
                    ${item.birthDate ?? 'Sin F.N.'}${item.phone ? ` · ${escapeHtml(item.phone)}` : ''}${
                      item.identityDocument ? ` · Doc ${escapeHtml(item.identityDocument)}` : ''
                    }
                  </p>
                </a>
              `;
            })
            .join('');
        } catch (error) {
          host.innerHTML = `<p class="text-sm text-red-300">${escapeHtml(getApiErrorMessage(error))}</p>`;
        }
      };

      const onIdentityInput = () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => void runMatchSearch(), 280);
      };

      ['#patient-first-name', '#patient-last-name', '#patient-middle-name', '#patient-phone', '#patient-document'].forEach(
        (selector) => {
          root.querySelector(selector)?.addEventListener('input', onIdentityInput);
        },
      );

      root.querySelector('#create-patient-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const payload = readPayload();
        if (!payload.firstName || !payload.lastName) {
          setAuthAlert(root, {
            id: 'create-patient-alert',
            type: 'error',
            message: 'Nombre y apellidos son obligatorios.',
          });
          return;
        }

        if (payload.badgeNumber && !BADGE_PATTERN.test(payload.badgeNumber)) {
          setAuthAlert(root, {
            id: 'create-patient-alert',
            type: 'error',
            message: 'La placa debe tener un formato como 1A-12, 3B-45 o ADAM-21.',
          });
          return;
        }

        try {
          const created = await createPatient(payload);
          navigate(`/patients?id=${created.id}`);
        } catch (error) {
          const responseData = error?.response?.data;
          const payloadError = Array.isArray(responseData?.errors)
            ? responseData.errors.find((item) => item?.code) ?? responseData.errors[0]
            : null;
          const code = payloadError?.code;
          const matches = payloadError?.matches ?? [];

          if (code === 'PATIENT_DUPLICATE_LIKELY' || payloadError?.requiresConfirmation) {
            const box = root.querySelector('#duplicate-confirm-box');
            box?.classList.remove('hidden');
            const host = root.querySelector('#patient-matches');
            if (host && matches.length) {
              host.innerHTML = matches
                .map(
                  (item) => `
                    <a data-link href="/patients?id=${item.id}" class="block rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-3">
                      <p class="text-sm font-medium text-white">HC #${item.recordNumber} · ${escapeHtml(item.fullName)}</p>
                      <p class="mt-1 text-xs text-amber-100/80">${escapeHtml(item.reason ?? 'Posible duplicado')}</p>
                    </a>
                  `,
                )
                .join('');
            }
            setAuthAlert(root, {
              id: 'create-patient-alert',
              type: 'error',
              message: getApiErrorMessage(error, 'Revisa posibles duplicados antes de continuar.'),
            });
            return;
          }

          if (code === 'PATIENT_DUPLICATE_EXACT' && matches.length) {
            const host = root.querySelector('#patient-matches');
            if (host) {
              host.innerHTML = matches
                .map((item) => renderPatientCard(item))
                .join('');
            }
          }

          setAuthAlert(root, {
            id: 'create-patient-alert',
            type: 'error',
            message: getApiErrorMessage(error, 'No se pudo crear el paciente.'),
          });
        }
      });

      return () => {
        clearTimeout(searchTimer);
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
