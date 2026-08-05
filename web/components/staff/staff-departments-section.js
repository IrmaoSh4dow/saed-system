import { resolveUploadUrl } from '../../utils/media.js';
import {
  getDepartmentRoleLabel,
  resolveStaffDepartments,
} from '../../utils/staff-departments.js';

/**
 * Visual hierarchy: primary department badge + alternate list.
 * @param {object} officer
 * @param {{ showBadge?: boolean, className?: string }} [options]
 */
export function renderStaffDepartmentsSection(officer, options = {}) {
  const { showBadge = true, className = '' } = options;
  const { primary, alternates, primaryName, primaryImageUrl, primaryRole } =
    resolveStaffDepartments(officer);

  return `
    <section class="surface-card p-6 ${className}">
      <div class="grid gap-8 ${showBadge ? 'lg:grid-cols-[auto_1fr]' : ''}">
        ${
          showBadge
            ? renderPrimaryBadge({
                name: primaryName,
                imageUrl: primaryImageUrl,
                role: primaryRole,
              })
            : ''
        }
        <div class="min-w-0 space-y-6">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Departamento principal</p>
            ${
              primaryName
                ? `<p class="mt-2 text-lg font-semibold text-white">${escapeHtml(primaryName)}</p>
                   <p class="mt-1 text-sm text-brand-300">${escapeHtml(getDepartmentRoleLabel(primaryRole))}</p>`
                : `<p class="mt-2 text-sm text-ink-400">Sin departamento principal asignado.</p>`
            }
          </div>
          <div class="border-t border-white/10 pt-6">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Departamentos alternos</p>
            ${
              alternates.length
                ? `<ul class="mt-3 space-y-2">
                    ${alternates
                      .map(
                        (item) => `
                          <li class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm">
                            <span class="font-medium text-white">${escapeHtml(item.name)}</span>
                            <span class="text-xs text-ink-400">${escapeHtml(getDepartmentRoleLabel(item.role))}</span>
                          </li>
                        `,
                      )
                      .join('')}
                  </ul>`
                : `<p class="mt-3 text-sm text-ink-400">Sin departamentos alternos.</p>`
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Identity badge: primary department logo + name only.
 */
export function renderPrimaryDepartmentBadge({ name, imageUrl, role, className = '' } = {}) {
  return renderPrimaryBadge({ name, imageUrl, role, className });
}

function renderPrimaryBadge({ name, imageUrl, role, className = '' }) {
  if (!name) {
    return `
      <div class="flex w-[8.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 ${className}">
        <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-surface-950">
          <span class="text-[10px] font-medium uppercase tracking-wide text-ink-500">—</span>
        </div>
        <p class="text-center text-[10px] uppercase tracking-[0.16em] text-ink-500">Principal</p>
        <p class="text-center text-sm text-ink-400">Sin departamento</p>
      </div>
    `;
  }

  const src = resolveUploadUrl(imageUrl);

  return `
    <div class="flex w-[8.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 ${className}">
      <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-surface-950">
        ${
          src
            ? `<img src="${src}" alt="${escapeHtml(name)}" class="h-full w-full object-contain p-2" />`
            : `<span class="text-[10px] font-medium uppercase tracking-wide text-ink-500">Logo</span>`
        }
      </div>
      <div class="w-full text-center">
        <p class="text-[10px] uppercase tracking-[0.16em] text-ink-500">Principal</p>
        <p class="mt-0.5 truncate text-sm font-semibold text-white" title="${escapeHtml(name)}">${escapeHtml(name)}</p>
        ${
          role
            ? `<p class="mt-0.5 truncate text-[11px] text-brand-300">${escapeHtml(getDepartmentRoleLabel(role))}</p>`
            : ''
        }
      </div>
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
