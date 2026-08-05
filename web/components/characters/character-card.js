export function renderCharacterCard(character, { selectable = true } = {}) {
  const initials =
    `${character.firstName?.[0] ?? ''}${character.lastName?.[0] ?? ''}`.toUpperCase();
  const statusStyles = {
    CIVIL: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    CADET: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    INTERN: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    OFFICER: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    MEDICAL_STAFF: 'border-brand-400/20 bg-brand-400/10 text-brand-300',
    RETIRED: 'border-ink-400/20 bg-white/5 text-ink-300',
    SUSPENDED: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  };

  const statusClass = statusStyles[character.status] ?? statusStyles.CIVIL;
  const statusLabel =
    {
      CIVIL: 'Civil',
      CADET: 'Interno',
      INTERN: 'Interno',
      OFFICER: 'Personal médico',
      MEDICAL_STAFF: 'Personal médico',
      RETIRED: 'Retirado',
      SUSPENDED: 'Suspendido',
    }[character.status] ?? character.status;

  const organization =
    character.organization ??
    character.primaryOccupation?.organization ??
    (character.staffProfile ? 'SAED' : '—');

  return `
    <article class="character-card surface-card surface-card-hover flex h-full min-h-[22rem] flex-col overflow-hidden">
      <div class="relative h-44 w-full shrink-0 overflow-hidden bg-surface-950">
        ${
          character.avatarUrl
            ? `<img src="${character.avatarUrl}" alt="${character.firstName} ${character.lastName}" class="h-full w-full object-cover object-center" />`
            : `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600/30 to-surface-900 text-3xl font-semibold text-white">${initials}</div>`
        }
        <span class="absolute left-4 top-4 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClass}">
          ${statusLabel}
        </span>
      </div>
      <div class="flex min-h-0 flex-1 flex-col p-5">
        <h3 class="truncate text-lg font-semibold text-white">${character.firstName} ${character.lastName}</h3>
        <p class="mt-2 text-sm text-ink-300">${statusLabel}</p>
        <p class="mt-1 truncate text-sm font-medium text-brand-300">${organization}</p>
        ${
          selectable
            ? `<button type="button" class="btn-primary mt-auto w-full" data-select-character="${character.id}">Seleccionar</button>`
            : `<div class="mt-auto"></div>`
        }
      </div>
    </article>
  `;
}
