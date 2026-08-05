import { icon } from '../components/landing/icons.js';
import { canSubmitAcademyApplication } from '../utils/character.js';
import { hasAnyPermission, hasPermission, PERMISSIONS } from '../utils/permissions.js';

export const SIDEBAR_NAVIGATION = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    permission: PERMISSIONS.DASHBOARD_READ,
    icon: 'grid',
  },
  {
    name: 'Administración',
    path: '/admin',
    permission: PERMISSIONS.ADMIN_ACCESS,
    anyPermissions: [
      PERMISSIONS.ADMIN_ACCESS,
      PERMISSIONS.STAFF_CREATE,
      PERMISSIONS.RANKS_CREATE,
      PERMISSIONS.DEPARTMENTS_CREATE,
      PERMISSIONS.PERMISSIONS_READ,
      PERMISSIONS.ROLES_ASSIGN,
    ],
    icon: 'settings',
  },
  {
    name: 'Personal médico',
    path: '/staff',
    permission: PERMISSIONS.STAFF_READ,
    icon: 'users',
  },
  {
    name: 'Departamentos',
    path: '/departments',
    permission: PERMISSIONS.DEPARTMENTS_READ,
    icon: 'shield',
  },
  {
    name: 'Informes',
    path: '/reports',
    permission: PERMISSIONS.REPORTS_READ,
    icon: 'file',
  },
  {
    name: 'Informes de departamento',
    path: '/reports/department',
    permission: PERMISSIONS.REPORTS_READ,
    icon: 'shield',
  },
  {
    name: 'Denuncias',
    path: '/complaints',
    permission: PERMISSIONS.COMPLAINTS_READ,
    icon: 'alert',
  },
  {
    name: 'Academia',
    path: '/academy',
    permission: PERMISSIONS.ACADEMY_READ,
    anyPermissions: [PERMISSIONS.ACADEMY_READ, PERMISSIONS.ACADEMY_MANAGE, PERMISSIONS.ADMIN_ACCESS],
    icon: 'book',
  },
  {
    name: 'Postulaciones',
    path: '/academy/applications',
    permission: PERMISSIONS.ACADEMY_APPLY,
    icon: 'file',
    /** Hidden for SAED members even if they somehow retain academy.apply. */
    requireCivilianApplicant: true,
  },
  {
    name: 'Configuración',
    path: '/settings',
    permission: PERMISSIONS.SETTINGS_READ,
    icon: 'settings',
  },
];

export const ADMIN_NAVIGATION = [
  {
    name: 'Resumen',
    path: '/admin',
    permission: PERMISSIONS.ADMIN_ACCESS,
  },
  {
    name: 'Personajes',
    path: '/admin/characters',
    permission: PERMISSIONS.CHARACTERS_SEARCH,
  },
  {
    name: 'Personal médico',
    path: '/admin/staff',
    permission: PERMISSIONS.STAFF_CREATE,
    anyPermissions: [
      PERMISSIONS.STAFF_CREATE,
      PERMISSIONS.STAFF_UPDATE,
      PERMISSIONS.STAFF_READ,
    ],
  },
  {
    name: 'Cuentas',
    path: '/admin/accounts',
    permission: PERMISSIONS.ACCOUNTS_MANAGE,
  },
  {
    name: 'Rangos',
    path: '/admin/ranks',
    permission: PERMISSIONS.RANKS_READ,
  },
  {
    name: 'Departamentos',
    path: '/admin/departments',
    permission: PERMISSIONS.DEPARTMENTS_CREATE,
    anyPermissions: [
      PERMISSIONS.DEPARTMENTS_CREATE,
      PERMISSIONS.DEPARTMENTS_UPDATE,
      PERMISSIONS.DEPARTMENTS_READ,
    ],
  },
  {
    name: 'Permisos',
    path: '/admin/permissions',
    permission: PERMISSIONS.PERMISSIONS_READ,
  },
  {
    name: 'Roles',
    path: '/admin/roles',
    permission: PERMISSIONS.ROLES_ASSIGN,
    anyPermissions: [PERMISSIONS.ROLES_ASSIGN, PERMISSIONS.ROLES_READ],
  },
  {
    name: 'Condecoraciones',
    path: '/admin/decorations',
    permission: PERMISSIONS.DECORATIONS_MANAGE,
    anyPermissions: [PERMISSIONS.DECORATIONS_MANAGE, PERMISSIONS.DECORATIONS_READ],
  },
  {
    name: 'Licencias',
    path: '/admin/licenses',
    permission: PERMISSIONS.LICENSES_MANAGE,
    anyPermissions: [PERMISSIONS.LICENSES_MANAGE, PERMISSIONS.LICENSES_READ],
  },
  {
    name: 'Academias',
    path: '/admin/academy',
    permission: PERMISSIONS.ACADEMY_MANAGE,
    anyPermissions: [
      PERMISSIONS.ACADEMY_MANAGE,
      PERMISSIONS.ACADEMY_APPLICATIONS,
      PERMISSIONS.ADMIN_ACCESS,
    ],
  },
  {
    name: 'Postulaciones',
    path: '/admin/academy/applications',
    permission: PERMISSIONS.ACADEMY_APPLICATIONS,
    anyPermissions: [PERMISSIONS.ACADEMY_APPLICATIONS, PERMISSIONS.ADMIN_ACCESS],
  },
  {
    name: 'Noticias',
    path: '/admin/news',
    permission: PERMISSIONS.NEWS_MANAGE,
    anyPermissions: [PERMISSIONS.NEWS_MANAGE, PERMISSIONS.ADMIN_ACCESS],
  },
  {
    name: 'Galería',
    path: '/admin/gallery',
    permission: PERMISSIONS.GALLERY_MANAGE,
    anyPermissions: [PERMISSIONS.GALLERY_MANAGE, PERMISSIONS.ADMIN_ACCESS],
  },
];

export function getVisibleNavigation(grantedPermissions, activeCharacter = null) {
  return SIDEBAR_NAVIGATION.filter((item) => {
    if (item.requireCivilianApplicant && !canSubmitAcademyApplication(activeCharacter)) {
      return false;
    }
    if (item.anyPermissions?.length) {
      return hasAnyPermission(grantedPermissions, item.anyPermissions);
    }
    return hasPermission(grantedPermissions, item.permission);
  }).map((item) => ({
    ...item,
    iconHtml: icon(item.icon, 'h-4 w-4'),
  }));
}

export function getVisibleAdminNavigation(grantedPermissions) {
  return ADMIN_NAVIGATION.filter((item) => {
    if (item.anyPermissions?.length) {
      return hasAnyPermission(grantedPermissions, item.anyPermissions);
    }
    return hasPermission(grantedPermissions, item.permission);
  });
}
