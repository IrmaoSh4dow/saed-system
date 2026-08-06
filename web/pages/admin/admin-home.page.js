import { renderSummaryStrip } from '../../components/ui/summary-strip.js';
import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';
import { can } from '../../services/auth-context.js';
import { PERMISSIONS } from '../../utils/permissions.js';

export function adminHomePage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const groups = [
    {
      title: 'Personas',
      description: 'Identidades, personal y cuentas del sistema.',
      cards: [
        {
          title: 'Personajes',
          href: '/admin/characters',
          description: 'Directorio civil y promoción a personal SAED.',
          show: can(PERMISSIONS.CHARACTERS_SEARCH),
        },
        {
          title: 'Personal médico',
          href: '/admin/staff',
          description: 'Nº de empleado, rango, departamento y estado.',
          show:
            can(PERMISSIONS.STAFF_CREATE) ||
            can(PERMISSIONS.STAFF_UPDATE) ||
            can(PERMISSIONS.STAFF_READ),
        },
        {
          title: 'Cuentas',
          href: '/admin/accounts',
          description: 'Cuentas, personajes asociados y restablecimiento.',
          show: can(PERMISSIONS.ACCOUNTS_MANAGE),
        },
      ],
    },
    {
      title: 'Estructura',
      description: 'Jerarquía, unidades y control de acceso.',
      cards: [
        {
          title: 'Rangos',
          href: '/admin/ranks',
          description: 'Catálogo jerárquico institucional.',
          show: can(PERMISSIONS.RANKS_READ),
        },
        {
          title: 'Departamentos',
          href: '/admin/departments',
          description: 'Unidades organizativas y supervisión.',
          show: can(PERMISSIONS.DEPARTMENTS_READ),
        },
        {
          title: 'Roles',
          href: '/admin/roles',
          description: 'Asignación de roles RBAC a personajes.',
          show: can(PERMISSIONS.ROLES_ASSIGN) || can(PERMISSIONS.ROLES_READ),
        },
        {
          title: 'Permisos',
          href: '/admin/permissions',
          description: 'Catálogo de permisos del sistema.',
          show: can(PERMISSIONS.PERMISSIONS_READ),
        },
      ],
    },
    {
      title: 'Catálogos y contenido',
      description: 'Reconocimientos, formación y superficie pública.',
      cards: [
        {
          title: 'Condecoraciones',
          href: '/admin/decorations',
          description: 'Medallas y premios del departamento.',
          show: can(PERMISSIONS.DECORATIONS_MANAGE) || can(PERMISSIONS.DECORATIONS_READ),
        },
        {
          title: 'Licencias',
          href: '/admin/licenses',
          description: 'Certificaciones especiales del personal.',
          show: can(PERMISSIONS.LICENSES_MANAGE) || can(PERMISSIONS.LICENSES_READ),
        },
        {
          title: 'Academias',
          href: '/admin/academy',
          description: 'Gestión administrativa de formación.',
          show: can(PERMISSIONS.ACADEMY_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
        },
        {
          title: 'Noticias',
          href: '/admin/news',
          description: 'CMS de noticias públicas.',
          show: can(PERMISSIONS.NEWS_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
        },
        {
          title: 'Galería',
          href: '/admin/gallery',
          description: 'Imágenes institucionales públicas.',
          show: can(PERMISSIONS.GALLERY_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
        },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      cards: group.cards.filter((card) => card.show),
    }))
    .filter((group) => group.cards.length);

  const totalModules = groups.reduce((sum, group) => sum + group.cards.length, 0);

  const content = `
    <div class="space-y-8">
      ${renderSummaryStrip([
        { label: 'Módulos visibles', value: String(totalModules), tone: 'brand' },
        { label: 'Grupos', value: String(groups.length) },
        { label: 'Ámbito', value: 'Institucional' },
        { label: 'Acceso', value: 'Administración', tone: 'warning' },
      ])}

      ${groups
        .map(
          (group) => `
            <section class="space-y-4">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">${group.title}</p>
                <p class="mt-1 text-sm text-ink-400">${group.description}</p>
              </div>
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                ${group.cards
                  .map(
                    (card) => `
                      <a data-link href="${card.href}" class="panel panel-hover group block p-5">
                        <div class="flex items-start justify-between gap-3">
                          <h3 class="text-base font-semibold text-white transition group-hover:text-brand-300">${card.title}</h3>
                          <span class="mt-1 text-xs text-brand-300 opacity-0 transition group-hover:opacity-100">→</span>
                        </div>
                        <p class="mt-2 text-sm leading-relaxed text-ink-300">${card.description}</p>
                      </a>
                    `,
                  )
                  .join('')}
              </div>
            </section>
          `,
        )
        .join('')}
    </div>
  `;

  return {
    html: renderAdminShell(content, { title: 'Centro de control', currentPath: '/admin' }),
    afterMount(root) {
      return mountAdminPage(root, 'Administración');
    },
  };
}
