import { renderAuthAlert, setAuthAlert } from '../components/auth/auth-alert.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { can } from '../services/auth-context.js';
import { getApiErrorMessage } from '../services/auth.service.js';
import { listOfficers } from '../services/staff.service.js';
import {
  acceptInterestLetter,
  addDepartmentSupervisor,
  createDepartmentOpening,
  createInterestLetter,
  getDepartment,
  listDepartmentInterestLetters,
  rejectInterestLetter,
  removeDepartmentSupervisor,
  updateDepartmentOpening,
} from '../services/departments.service.js';
import { listRanks } from '../services/ranks.service.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { formatDateTimeLabel } from '../utils/date.js';
import { resolveUploadUrl } from '../utils/media.js';
import { PERMISSIONS } from '../utils/permissions.js';

const OPENING_STATUS = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
  COMPLETED: 'Finalizada',
};

const LETTER_STATUS = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  NEEDS_INFO: 'Info solicitada',
};

export function departmentDetailPage(departmentId) {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.DEPARTMENTS_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'overview';

  const content = `
    <div class="space-y-6">
      ${renderAuthAlert({ id: 'department-detail-alert' })}
      <a data-link href="/departments" class="inline-flex text-sm font-medium text-brand-300 hover:text-brand-200">← Volver al listado</a>
      <div id="department-detail-root">
        <p class="text-sm text-ink-400">Cargando ficha...</p>
      </div>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, {
      title: 'Departamento',
      currentPath: '/departments',
    }),
    afterMount(root) {
      const cleanup = initDashboardLayout(root);
      const state = {
        department: null,
        ranks: [],
        letters: [],
        activeTab: ['overview', 'members', 'openings', 'applications'].includes(initialTab)
          ? initialTab
          : 'overview',
      };

      const refresh = async () => {
        const [department, ranks] = await Promise.all([getDepartment(departmentId), listRanks()]);
        state.department = department;
        state.ranks = ranks;
        if (
          department.viewer?.canManage ||
          can(PERMISSIONS.DEPARTMENTS_UPDATE) ||
          can(PERMISSIONS.ADMIN_ACCESS)
        ) {
          state.letters = await listDepartmentInterestLetters(departmentId).catch(() => []);
        } else {
          state.letters = [];
        }
        paint();
        document.title = `${department.name} · Departamentos · SAED`;
      };

      const paint = () => {
        renderDetail(root, state);
        attachHandlers(root, state, {
          onTab: (tab) => {
            state.activeTab = tab;
            paint();
          },
          onReload: refresh,
        });
      };

      void refresh().catch((error) => {
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      });

      return cleanup;
    },
  };
}

function renderDetail(root, state) {
  const host = root.querySelector('#department-detail-root');
  const department = state.department;
  if (!host || !department) return;

  const image = resolveUploadUrl(department.imageUrl);
  const canManage =
    Boolean(department.viewer?.canManage) ||
    can(PERMISSIONS.DEPARTMENTS_UPDATE) ||
    can(PERMISSIONS.ADMIN_ACCESS);
  const openOpening = (department.openings ?? []).find((item) => item.status === 'OPEN');
  const members = department.officers ?? [];
  const supervisors = department.supervisors ?? [];

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'members', label: `Miembros (${members.length})` },
    { id: 'openings', label: 'Convocatorias' },
    ...(canManage
      ? [{ id: 'applications', label: `Postulaciones (${state.letters.length})` }]
      : []),
  ];

  host.innerHTML = `
    <section class="surface-card overflow-hidden p-6 md:p-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div class="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface-950">
          ${
            image
              ? `<img src="${escapeHtml(image)}" alt="" class="h-full w-full object-contain p-4" />`
              : `<span class="text-xs uppercase tracking-wide text-ink-500">Logo</span>`
          }
        </div>
        <div class="min-w-0 flex-1">
          <p class="landing-eyebrow">Departamento</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-white">${escapeHtml(department.name)}</h2>
          <p class="mt-3 text-sm leading-relaxed text-ink-300">${escapeHtml(department.description || 'Sin descripción.')}</p>
          <div class="mt-4 flex flex-wrap gap-3 text-sm text-ink-400">
            <span>${department._count?.officers ?? members.length} miembros</span>
            <span>·</span>
            <span>${department._count?.supervisors ?? supervisors.length} encargados</span>
            ${
              openOpening
                ? `<span class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">Convocatoria abierta</span>`
                : ''
            }
          </div>
        </div>
      </div>
    </section>

    <nav class="mt-2 flex flex-wrap gap-2">
      ${tabs
        .map((tab) => {
          const active = state.activeTab === tab.id;
          return `
            <button type="button" data-department-tab="${tab.id}" class="rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              active
                ? 'bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                : 'border border-white/10 text-ink-300 hover:bg-white/[0.04] hover:text-white'
            }">${tab.label}</button>
          `;
        })
        .join('')}
    </nav>

    ${state.activeTab === 'overview' ? renderOverview(department, supervisors, openOpening) : ''}
    ${state.activeTab === 'members' ? renderMembers(members) : ''}
    ${state.activeTab === 'openings' ? renderOpenings(department, state.ranks, openOpening, canManage) : ''}
    ${state.activeTab === 'applications' && canManage ? renderApplications(state.letters) : ''}
  `;
}

function renderOverview(department, supervisors, openOpening) {
  const canAssignSupervisors = can(PERMISSIONS.DEPARTMENTS_UPDATE) || can(PERMISSIONS.ADMIN_ACCESS);

  return `
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Encargados</h3>
        <div class="mt-4 space-y-3">
          ${
            supervisors.length
              ? supervisors
                  .map((item) => {
                    const officer = item.staffProfile;
                    return `
                      <div class="flex items-center gap-3">
                        <div class="min-w-0 flex-1">${officerMiniCard(officer)}</div>
                        ${
                          canAssignSupervisors
                            ? `<button type="button" class="shrink-0 text-xs text-rose-300 hover:text-rose-200" data-remove-supervisor="${officer.id}">Quitar</button>`
                            : ''
                        }
                      </div>
                    `;
                  })
                  .join('')
              : `<p class="text-sm text-ink-400">Sin encargados asignados.</p>`
          }
        </div>
        ${
          canAssignSupervisors
            ? `
          <form id="add-supervisor-form" class="mt-5 space-y-3 border-t border-white/10 pt-5">
            <label class="form-label" for="supervisor-officer">Asignar encargado</label>
            <select id="supervisor-officer" class="form-input" required>
              <option value="">Seleccionar personal...</option>
            </select>
            <button type="submit" class="btn-secondary">Añadir encargado</button>
          </form>
        `
            : ''
        }
      </section>
      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Convocatoria activa</h3>
        ${
          openOpening
            ? `
              <div class="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p class="font-medium text-white">${escapeHtml(openOpening.title)}</p>
                <p class="mt-2 text-sm text-ink-300 whitespace-pre-wrap">${escapeHtml(openOpening.description)}</p>
                <p class="mt-3 text-xs text-ink-500">
                  Rango mínimo: ${escapeHtml(openOpening.minRank?.name ?? 'Sin requisito')}
                </p>
              </div>
            `
            : `<p class="mt-4 text-sm text-ink-400">No hay convocatoria abierta.</p>`
        }
      </section>
    </div>
  `;
}

function renderMembers(members) {
  return `
    <section class="surface-card p-6">
      <h3 class="text-sm font-semibold text-white">Miembros</h3>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        ${
          members.length
            ? members.map((officer) => officerMiniCard(officer)).join('')
            : `<p class="text-sm text-ink-400">Sin miembros asignados.</p>`
        }
      </div>
    </section>
  `;
}

function renderOpenings(department, ranks, openOpening, canManage) {
  const openings = department.openings ?? [];
  return `
    <div class="space-y-6">
      ${
        canManage && !openOpening
          ? `
        <section class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Abrir convocatoria</h3>
          <form id="create-opening-form" class="mt-4 space-y-4">
            <div>
              <label class="form-label" for="opening-title">Título</label>
              <input id="opening-title" class="form-input" required maxlength="160" />
            </div>
            <div>
              <label class="form-label" for="opening-description">Descripción</label>
              <textarea id="opening-description" class="form-input min-h-[100px]" required maxlength="4000"></textarea>
            </div>
            <div>
              <label class="form-label" for="opening-min-rank">Rango mínimo</label>
              <select id="opening-min-rank" class="form-input">
                <option value="">Sin requisito</option>
                ${ranks
                  .filter((item) => item.slug !== 'civilian')
                  .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
                  .join('')}
              </select>
            </div>
            <button type="submit" class="btn-primary">Publicar convocatoria</button>
          </form>
        </section>
      `
          : ''
      }

      ${
        openOpening && !canManage && department.viewer?.myPendingLetterId
          ? `
        <section class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Postulación enviada</h3>
          <p class="mt-2 text-sm text-ink-300">Ya tienes una carta de interés pendiente en esta convocatoria.</p>
        </section>
      `
          : ''
      }

      ${
        openOpening && !canManage && !department.viewer?.myPendingLetterId
          ? `
        <section class="surface-card p-6">
          <h3 class="text-sm font-semibold text-white">Postularse</h3>
          <p class="mt-1 text-xs text-ink-400">${escapeHtml(openOpening.title)}</p>
          <form id="interest-letter-form" class="mt-4 space-y-4">
            <div>
              <label class="form-label" for="letter-motivation">Motivación</label>
              <textarea id="letter-motivation" class="form-input min-h-[100px]" required maxlength="4000"></textarea>
            </div>
            <div>
              <label class="form-label" for="letter-experience">Experiencia</label>
              <textarea id="letter-experience" class="form-input min-h-[100px]" required maxlength="4000"></textarea>
            </div>
            <div>
              <label class="form-label" for="letter-extra">Información adicional</label>
              <textarea id="letter-extra" class="form-input min-h-[80px]" maxlength="4000"></textarea>
            </div>
            <button type="submit" class="btn-primary">Enviar carta de interés</button>
          </form>
        </section>
      `
          : ''
      }

      <section class="surface-card p-6">
        <h3 class="text-sm font-semibold text-white">Historial de convocatorias</h3>
        <div class="mt-4 space-y-3">
          ${
            openings.length
              ? openings
                  .map(
                    (item) => `
                      <article class="rounded-2xl border border-white/10 px-4 py-3">
                        <div class="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p class="font-medium text-white">${escapeHtml(item.title)}</p>
                            <p class="mt-1 text-xs text-ink-500">${OPENING_STATUS[item.status] ?? item.status} · ${formatDateTimeLabel(item.openedAt)}</p>
                          </div>
                          ${
                            canManage && item.status === 'OPEN'
                              ? `<button type="button" class="btn-secondary text-xs" data-close-opening="${item.id}">Cerrar</button>`
                              : ''
                          }
                        </div>
                        <p class="mt-2 text-sm text-ink-300 line-clamp-3">${escapeHtml(item.description)}</p>
                      </article>
                    `,
                  )
                  .join('')
              : `<p class="text-sm text-ink-400">Sin convocatorias.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderApplications(letters) {
  return `
    <section class="surface-card p-6">
      <h3 class="text-sm font-semibold text-white">Cartas de interés</h3>
      <div class="mt-4 space-y-4">
        ${
          letters.length
            ? letters
                .map((letter) => {
                  const officer = letter.staffProfile;
                  const avatar = resolveUploadUrl(officer?.character?.avatarUrl);
                  const name =
                    `${officer?.character?.firstName ?? ''} ${officer?.character?.lastName ?? ''}`.trim();
                  return `
                    <article class="rounded-2xl border border-white/10 p-4">
                      <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-950">
                          ${
                            avatar
                              ? `<img src="${escapeHtml(avatar)}" alt="" class="h-full w-full object-cover" />`
                              : `<div class="flex h-full items-center justify-center text-xs text-ink-400">—</div>`
                          }
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p class="font-semibold text-white">${escapeHtml(name)}</p>
                              <p class="mt-1 text-xs text-ink-400">
                                Badge ${escapeHtml(officer?.employeeNumber ?? '—')} · ${escapeHtml(officer?.rank?.name ?? '—')}
                                · Departamento actual: ${escapeHtml(officer?.department?.name ?? 'Sin departamento')}
                              </p>
                            </div>
                            <span class="text-xs font-medium text-ink-300">${LETTER_STATUS[letter.status] ?? letter.status}</span>
                          </div>
                          <p class="mt-3 text-sm text-ink-300"><span class="text-ink-500">Motivación:</span> ${escapeHtml(letter.motivation)}</p>
                          <p class="mt-2 text-sm text-ink-300"><span class="text-ink-500">Experiencia:</span> ${escapeHtml(letter.experience)}</p>
                          ${
                            letter.additionalInfo
                              ? `<p class="mt-2 text-sm text-ink-300"><span class="text-ink-500">Extra:</span> ${escapeHtml(letter.additionalInfo)}</p>`
                              : ''
                          }
                          ${
                            letter.status === 'PENDING'
                              ? `
                                <div class="mt-4 flex flex-wrap gap-2">
                                  <button type="button" class="btn-primary text-xs" data-accept-letter="${letter.id}">Aceptar</button>
                                  <button type="button" class="btn-secondary text-xs" data-reject-letter="${letter.id}">Rechazar</button>
                                </div>
                              `
                              : ''
                          }
                        </div>
                      </div>
                    </article>
                  `;
                })
                .join('')
            : `<p class="text-sm text-ink-400">No hay postulaciones.</p>`
        }
      </div>
    </section>
  `;
}

function officerMiniCard(officer) {
  const avatar = resolveUploadUrl(officer?.character?.avatarUrl);
  const name =
    `${officer?.character?.firstName ?? ''} ${officer?.character?.lastName ?? ''}`.trim();
  return `
    <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3">
      <div class="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-950">
        ${
          avatar
            ? `<img src="${escapeHtml(avatar)}" alt="" class="h-full w-full object-cover" />`
            : `<div class="flex h-full items-center justify-center text-[10px] text-ink-500">—</div>`
        }
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-white">${escapeHtml(name)}</p>
        <p class="truncate text-xs text-ink-400">${escapeHtml(officer?.employeeNumber ?? '—')} · ${escapeHtml(officer?.rank?.name ?? '—')}</p>
      </div>
    </div>
  `;
}

function attachHandlers(root, state, { onTab, onReload }) {
  root.querySelectorAll('[data-department-tab]').forEach((button) => {
    button.addEventListener('click', () => onTab(button.getAttribute('data-department-tab')));
  });

  const supervisorSelect = root.querySelector('#supervisor-officer');
  if (supervisorSelect) {
    void listOfficers()
      .then((officers) => {
        const assigned = new Set(
          (state.department.supervisors ?? []).map((item) => item.staffProfileId),
        );
        supervisorSelect.innerHTML =
          `<option value="">Seleccionar personal...</option>` +
          officers
            .filter((item) => !assigned.has(item.id) && item.status !== 'RETIRED')
            .map(
              (item) =>
                `<option value="${item.id}">${escapeHtml(item.character.firstName)} ${escapeHtml(item.character.lastName)} · ${escapeHtml(item.employeeNumber)}</option>`,
            )
            .join('');
      })
      .catch(() => {});
  }

  root.querySelector('#add-supervisor-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const staffProfileId = root.querySelector('#supervisor-officer')?.value;
    if (!staffProfileId) return;
    try {
      await addDepartmentSupervisor(state.department.id, staffProfileId);
      setAuthAlert(root, {
        id: 'department-detail-alert',
        type: 'success',
        message: 'Encargado asignado.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'department-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-remove-supervisor]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await removeDepartmentSupervisor(
          state.department.id,
          button.getAttribute('data-remove-supervisor'),
        );
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelector('#create-opening-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await createDepartmentOpening(state.department.id, {
        title: root.querySelector('#opening-title').value.trim(),
        description: root.querySelector('#opening-description').value.trim(),
        minRankId: root.querySelector('#opening-min-rank').value || undefined,
      });
      setAuthAlert(root, {
        id: 'department-detail-alert',
        type: 'success',
        message: 'Convocatoria publicada.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'department-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelector('#interest-letter-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const openOpening = (state.department.openings ?? []).find((item) => item.status === 'OPEN');
    if (!openOpening) return;
    try {
      await createInterestLetter(openOpening.id, {
        motivation: root.querySelector('#letter-motivation').value.trim(),
        experience: root.querySelector('#letter-experience').value.trim(),
        additionalInfo: root.querySelector('#letter-extra').value.trim() || undefined,
      });
      setAuthAlert(root, {
        id: 'department-detail-alert',
        type: 'success',
        message: 'Carta de interés enviada.',
      });
      await onReload();
    } catch (error) {
      setAuthAlert(root, {
        id: 'department-detail-alert',
        type: 'error',
        message: getApiErrorMessage(error),
      });
    }
  });

  root.querySelectorAll('[data-close-opening]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await updateDepartmentOpening(button.getAttribute('data-close-opening'), {
          status: 'CLOSED',
        });
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelectorAll('[data-accept-letter]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await acceptInterestLetter(button.getAttribute('data-accept-letter'));
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'success',
          message: 'Postulación aceptada. Departamento asignado.',
        });
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });

  root.querySelectorAll('[data-reject-letter]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await rejectInterestLetter(button.getAttribute('data-reject-letter'));
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'success',
          message: 'Postulación rechazada.',
        });
        await onReload();
      } catch (error) {
        setAuthAlert(root, {
          id: 'department-detail-alert',
          type: 'error',
          message: getApiErrorMessage(error),
        });
      }
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
