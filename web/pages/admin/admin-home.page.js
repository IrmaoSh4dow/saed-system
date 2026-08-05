import { mountAdminPage, renderAdminShell, requireAdminAccess } from './admin-shell.js';
import { can } from '../../services/auth-context.js';
import { PERMISSIONS } from '../../utils/permissions.js';

export function adminHomePage() {
  if (!requireAdminAccess()) {
    return { html: '', afterMount: () => {} };
  }

  const cards = [
    {
      title: 'Personajes',
      href: '/admin/characters',
      description: 'Directorio civil y promoción a personal SAED.',
      show: can(PERMISSIONS.CHARACTERS_SEARCH),
    },
    {
      title: 'Personal médico',
      href: '/admin/staff',
      description: 'Promover personajes, asignar nº de empleado, rango y departamento.',
      show:
        can(PERMISSIONS.STAFF_CREATE) ||
        can(PERMISSIONS.STAFF_UPDATE) ||
        can(PERMISSIONS.STAFF_READ),
    },
    {
      title: 'Cuentas',
      href: '/admin/accounts',
      description: 'Listado de cuentas, personajes asociados y restablecimiento de contraseña.',
      show: can(PERMISSIONS.ACCOUNTS_MANAGE),
    },
    {
      title: 'Rangos',
      href: '/admin/ranks',
      description: 'Catálogo jerárquico del departamento (independiente de roles RBAC).',
      show: can(PERMISSIONS.RANKS_READ),
    },
    {
      title: 'Departamentos',
      href: '/admin/departments',
      description: 'Unidades organizativas y asignación de personal.',
      show: can(PERMISSIONS.DEPARTMENTS_READ),
    },
    {
      title: 'Permisos',
      href: '/admin/permissions',
      description: 'Catálogo de permisos del sistema (asignación vía roles).',
      show: can(PERMISSIONS.PERMISSIONS_READ),
    },
    {
      title: 'Condecoraciones',
      href: '/admin/decorations',
      description: 'Catálogo de medallas y premios del departamento.',
      show: can(PERMISSIONS.DECORATIONS_MANAGE) || can(PERMISSIONS.DECORATIONS_READ),
    },
    {
      title: 'Licencias',
      href: '/admin/licenses',
      description: 'Certificaciones especiales del personal médico (AIR, HCU, etc.).',
      show: can(PERMISSIONS.LICENSES_MANAGE) || can(PERMISSIONS.LICENSES_READ),
    },
    {
      title: 'Noticias',
      href: '/admin/news',
      description: 'CMS de noticias públicas de la landing.',
      show: can(PERMISSIONS.NEWS_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
    },
    {
      title: 'Galería',
      href: '/admin/gallery',
      description: 'Imágenes del bento gallery institucional.',
      show: can(PERMISSIONS.GALLERY_MANAGE) || can(PERMISSIONS.ADMIN_ACCESS),
    },
    {
      title: 'Roles',
      href: '/admin/roles',
      description: 'Asignar Roles RBAC a personajes (necesario para ver Admin).',
      show: can(PERMISSIONS.ROLES_ASSIGN) || can(PERMISSIONS.ROLES_READ),
    },
  ].filter((item) => item.show);

  const content = `
    <section class="grid gap-4 md:grid-cols-2">
      ${cards
        .map(
          (card) => `
            <a data-link href="${card.href}" class="surface-card surface-card-hover block p-6">
              <h3 class="text-lg font-semibold text-white">${card.title}</h3>
              <p class="mt-2 text-sm leading-relaxed text-ink-300">${card.description}</p>
            </a>
          `,
        )
        .join('')}
    </section>
  `;

  return {
    html: renderAdminShell(content, { title: 'Panel administrativo', currentPath: '/admin' }),
    afterMount(root) {
      return mountAdminPage(root, 'Administración');
    },
  };
}
