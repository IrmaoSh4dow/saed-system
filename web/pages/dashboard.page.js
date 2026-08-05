import { getVisibleNavigation } from '../config/navigation.js';
import { icon } from '../components/landing/icons.js';
import { initDashboardLayout, renderDashboardLayout } from '../layouts/dashboard.layout.js';
import { getAuthState } from '../services/auth-context.js';
import { requireActiveCharacter, requirePermission } from '../utils/auth-guard.js';
import { PERMISSIONS } from '../utils/permissions.js';

export function dashboardPage() {
  if (!requireActiveCharacter()) {
    return { html: '', afterMount: () => {} };
  }

  if (!requirePermission(PERMISSIONS.DASHBOARD_READ)) {
    return { html: '', afterMount: () => {} };
  }

  const { user, activeCharacter, characters, permissions } = getAuthState();
  const statusLabel = formatStatus(activeCharacter.status);
  const visibleModules = getVisibleNavigation(permissions).filter(
    (item) => item.path !== '/dashboard',
  );

  const content = `
    <div class="space-y-6">
      <section class="surface-card overflow-hidden p-6 md:p-8">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="min-w-0">
            <p class="landing-eyebrow">Dashboard</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Bienvenido, ${activeCharacter.firstName}
            </h2>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300">
              Operando como
              <span class="text-white">${activeCharacter.firstName} ${activeCharacter.lastName}</span>
              · ${activeCharacter.rank ?? statusLabel}. Cuenta
              <span class="text-white">${user?.displayName ?? user?.username ?? '—'}</span>.
            </p>
          </div>
          <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            ${
              activeCharacter.avatarUrl
                ? `<img src="${activeCharacter.avatarUrl}" alt="" class="h-full w-full object-cover" />`
                : icon('shield', 'h-6 w-6')
            }
          </div>
        </div>
      </section>

      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${statCard('Estado', statusLabel)}
        ${statCard('Rango', activeCharacter.rank ?? 'Ciudadano')}
        ${statCard('Departamento principal', activeCharacter.department ?? 'No asignada')}
        ${statCard('Personajes', String(characters.length))}
      </section>

      <section class="surface-card p-6 md:p-8">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-semibold text-white">Accesos disponibles</h3>
            <p class="mt-1 text-xs text-ink-400">Filtrados según los permisos del personaje activo.</p>
          </div>
          <a data-link href="/profile" class="text-xs font-medium text-brand-300 hover:text-brand-200">Ver perfil</a>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          ${
            visibleModules.length
              ? visibleModules
                  .map(
                    (item) => `
                      <a
                        data-link
                        href="${item.path}"
                        class="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition duration-200 hover:border-brand-500/30 hover:bg-brand-500/5"
                      >
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface-950 text-ink-300 transition group-hover:border-brand-500/30 group-hover:text-brand-300">
                          ${item.iconHtml}
                        </span>
                        <span>
                          <span class="block text-sm font-semibold text-white">${item.name}</span>
                          <span class="block text-[11px] text-ink-500">${item.permission}</span>
                        </span>
                      </a>
                    `,
                  )
                  .join('')
              : `
                <div class="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-ink-400">
                  No hay módulos disponibles para este personaje.
                </div>
              `
          }
        </div>
      </section>

      <section class="surface-card border-dashed p-6 text-center md:p-8">
        <p class="text-sm text-ink-300">
          Esta es la base de navegación del sistema. Los módulos del departamento se conectarán sobre este esqueleto.
        </p>
      </section>
    </div>
  `;

  return {
    html: renderDashboardLayout(content, { title: 'Dashboard', currentPath: '/dashboard' }),
    afterMount(root) {
      document.title = 'Dashboard · SAED';
      return initDashboardLayout(root);
    },
  };
}

function statCard(label, value) {
  return `
    <article class="surface-card p-5">
      <p class="text-[11px] uppercase tracking-[0.16em] text-ink-500">${label}</p>
      <p class="mt-2 text-lg font-semibold text-white">${value}</p>
    </article>
  `;
}

function formatStatus(status) {
  return (
    {
      CIVIL: 'Civil',
      CADET: 'Interno',
      INTERN: 'Interno',
      OFFICER: 'Personal médico',
      MEDICAL_STAFF: 'Personal médico',
      RETIRED: 'Retirado',
      SUSPENDED: 'Suspendido',
    }[status] ?? status
  );
}
