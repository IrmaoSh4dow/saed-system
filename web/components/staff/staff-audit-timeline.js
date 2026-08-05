import { formatDateTimeLabel } from '../../utils/date.js';

const STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  RETIRED: 'Retirado',
};

/**
 * Renders an officer career audit timeline.
 * @param {Array} events
 */
export function renderOfficerAuditTimeline(events = []) {
  if (!events.length) {
    return `<p class="text-sm text-ink-400">Sin eventos de auditoría registrados para este personal.</p>`;
  }

  return `
    <ol class="relative space-y-0 border-l border-white/10 pl-6">
      ${events.map((event) => renderAuditEvent(event)).join('')}
    </ol>
  `;
}

function renderAuditEvent(event) {
  const meta = event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
  const view = describeEvent(event.action, meta);
  const actor = formatActor(event);

  return `
    <li class="relative pb-8 last:pb-0">
      <span class="absolute -left-[1.625rem] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-surface-900 text-[10px]">
        ${view.icon}
      </span>
      <article class="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-white">${escapeHtml(view.title)}</p>
            ${view.subtitle ? `<p class="mt-1 text-sm text-ink-300">${view.subtitle}</p>` : ''}
          </div>
          <time class="text-xs text-ink-500">${formatDateTimeLabel(event.createdAt)}</time>
        </div>
        ${view.body}
        ${
          actor
            ? `<p class="mt-3 text-xs text-ink-400">Realizado por: <span class="font-medium text-ink-200">${escapeHtml(actor)}</span></p>`
            : ''
        }
      </article>
    </li>
  `;
}

function describeEvent(action, meta) {
  switch (action) {
    case 'staff.promote':
      return {
        icon: '★',
        title: 'Ingreso al departamento',
        subtitle: `Incorporado a personal médico · Nº ${escapeHtml(meta.employeeNumber ?? '—')}`,
        body: transitionBlock(
          meta.rankName ? `Rango inicial: ${escapeHtml(meta.rankName)}` : null,
          meta.departmentName
            ? `Departamento: ${escapeHtml(meta.departmentName)}`
            : 'Sin departamento',
        ),
      };
    case 'staff.rank_promoted':
      return {
        icon: '⬆',
        title: 'Ascenso',
        subtitle: null,
        body: arrowBlock(meta.fromRankName, meta.toRankName),
      };
    case 'staff.rank_demoted':
      return {
        icon: '⬇',
        title: 'Descenso de rango',
        subtitle: null,
        body: arrowBlock(meta.fromRankName, meta.toRankName),
      };
    case 'staff.department_changed':
      return {
        icon: '🏢',
        title: 'Cambio de departamento',
        subtitle: null,
        body: arrowBlock(
          meta.fromDepartmentName ?? 'Sin departamento',
          meta.toDepartmentName ?? 'Sin departamento',
        ),
      };
    case 'staff.department_assigned': {
      const roleLabels = {
        MEMBER: 'Miembro',
        LEAD: 'Encargado',
        SUPERVISOR: 'Supervisor',
      };
      const roleLabel = roleLabels[meta.role] ?? null;
      const departmentLabel = meta.departmentName ?? 'Departamento';
      const scopeLabel = meta.isPrimary ? 'principal' : 'alterno';
      return {
        icon: '🏢',
        title: 'Departamento asignado al personal',
        subtitle: meta.officerName ? escapeHtml(meta.officerName) : null,
        body: transitionBlock(
          `Departamento asignado: ${escapeHtml(departmentLabel)} (${scopeLabel})`,
          roleLabel ? `Rol: ${escapeHtml(roleLabel)}` : null,
        ),
      };
    }
    case 'staff.status_changed':
      return {
        icon: '●',
        title: 'Cambio de estado',
        subtitle: null,
        body: arrowBlock(
          STATUS_LABELS[meta.fromStatus] ?? meta.fromStatus,
          STATUS_LABELS[meta.toStatus] ?? meta.toStatus,
        ),
      };
    case 'staff.badge_changed':
      return {
        icon: '#',
        title: 'Cambio de nº de empleado',
        subtitle: meta.officerName ? escapeHtml(meta.officerName) : null,
        body: `${arrowBlock(meta.fromEmployeeNumber, meta.toEmployeeNumber)}${
          meta.message
            ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(meta.message)}</p>`
            : ''
        }`,
      };
    case 'staff.callsign_changed':
      return {
        icon: '⌁',
        title: 'Cambio de indicativo',
        subtitle: meta.officerName ? escapeHtml(meta.officerName) : null,
        body: `${arrowBlock(meta.fromCallsign ?? '—', meta.toCallsign ?? '—')}${
          meta.message
            ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(meta.message)}</p>`
            : ''
        }`,
      };
    case 'staff.retire':
      return {
        icon: '◼',
        title: 'Retiro del servicio',
        subtitle: meta.employeeNumber ? `Badge ${escapeHtml(meta.employeeNumber)}` : null,
        body: arrowBlock(
          STATUS_LABELS[meta.fromStatus] ?? meta.fromStatus ?? '—',
          STATUS_LABELS.RETIRED,
        ),
      };
    case 'staff.update':
      return {
        icon: '✎',
        title: 'Actualización administrativa',
        subtitle: null,
        body: `<p class="mt-2 text-sm text-ink-300">Se actualizaron datos del perfil SAED.</p>`,
      };
    case 'decorations.award':
      return {
        icon: '🏅',
        title: 'Condecoración otorgada',
        subtitle: escapeHtml(meta.decorationName ?? 'Condecoración'),
        body: '',
      };
    case 'decorations.revoke':
      return {
        icon: '✕',
        title: 'Condecoración retirada',
        subtitle: escapeHtml(meta.decorationName ?? 'Condecoración'),
        body: '',
      };
    case 'licenses.assign':
      return {
        icon: '🪪',
        title: 'Licencia asignada',
        subtitle: escapeHtml(
          meta.licenseCode
            ? `${meta.licenseCode}${meta.licenseName ? ` · ${meta.licenseName}` : ''}`
            : (meta.licenseName ?? 'Licencia'),
        ),
        body: meta.message
          ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(meta.message)}</p>`
          : '',
      };
    case 'licenses.revoke':
      return {
        icon: '✕',
        title: 'Licencia retirada',
        subtitle: escapeHtml(
          meta.licenseCode
            ? `${meta.licenseCode}${meta.licenseName ? ` · ${meta.licenseName}` : ''}`
            : (meta.licenseName ?? 'Licencia'),
        ),
        body: meta.message
          ? `<p class="mt-2 text-sm text-ink-300">${escapeHtml(meta.message)}</p>`
          : '',
      };
    default:
      return {
        icon: '•',
        title: action,
        subtitle: null,
        body: '',
      };
  }
}

function arrowBlock(fromValue, toValue) {
  return `
    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span class="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-ink-300">${escapeHtml(fromValue ?? '—')}</span>
      <span class="text-ink-500">→</span>
      <span class="rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 font-medium text-brand-200">${escapeHtml(toValue ?? '—')}</span>
    </div>
  `;
}

function transitionBlock(...lines) {
  const content = lines.filter(Boolean).join('<br />');
  return content ? `<p class="mt-2 text-sm text-ink-300">${content}</p>` : '';
}

function formatActor(event) {
  const character = event.actorCharacter;
  if (character) {
    const rank = character.staffProfile?.rank?.name;
    const name = `${character.firstName ?? ''} ${character.lastName ?? ''}`.trim();
    return rank ? `${rank} ${name}` : name;
  }

  return event.actorAccount?.displayName || event.actorAccount?.username || null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
