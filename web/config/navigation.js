import { icon } from '../components/landing/icons.js';
import { canSubmitAcademyApplication } from '../utils/character.js';
import { hasAnyPermission, hasPermission, PERMISSIONS } from '../utils/permissions.js';
import {
  canAccessPartnerModule,
  INSTITUTIONAL_PARTNERS,
} from './institutional-partners.js';

/**
 * One sidebar entry per institutional partner. High Command sees them all; an
 * external supervisor only sees the agency of its role.
 */
const INSTITUTIONAL_PARTNER_NAVIGATION = INSTITUTIONAL_PARTNERS.map((partner) => ({
  name: partner.label,
  path: partner.routePath,
  permission: PERMISSIONS.OCCUPATIONAL_HEALTH_INTEROP,
  anyPermissions: [
    PERMISSIONS.OCCUPATIONAL_HEALTH_READ,
    PERMISSIONS.OCCUPATIONAL_HEALTH_INTEROP,
    partner.financePermission,
    PERMISSIONS.MEDICAL_RECORD_ACCESS_READ,
    PERMISSIONS.MEDICAL_REPORT_ACCESS_READ,
  ],
  requirePartnerAccess: partner.key,
  icon: 'shield',
}));

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
    name: 'Turnos',
    path: '/shifts',
    permission: PERMISSIONS.SHIFTS_READ,
    icon: 'heartPulse',
  },
  {
    name: 'Participación de Eventos',
    path: '/event-participations',
    permission: PERMISSIONS.EVENT_PARTICIPATIONS_READ,
    anyPermissions: [
      PERMISSIONS.EVENT_PARTICIPATIONS_READ,
      PERMISSIONS.EVENT_PARTICIPATIONS_CREATE,
    ],
    icon: 'calendar',
  },
  {
    name: 'Incentivos',
    path: '/incentives',
    permission: PERMISSIONS.INCENTIVES_READ,
    icon: 'bolt',
  },
  {
    name: 'Convenios',
    path: '/agreements',
    permission: PERMISSIONS.AGREEMENTS_READ,
    icon: 'archive',
  },
  ...INSTITUTIONAL_PARTNER_NAVIGATION,
  {
    name: 'Pacientes',
    path: '/patients',
    permission: PERMISSIONS.PATIENTS_READ,
    icon: 'heartPulse',
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
    name: 'Quejas',
    path: '/complaints',
    // All characters: view/create own complaints. Manage/assign remain RBAC-gated in the page.
    permission: PERMISSIONS.COMPLAINTS_READ,
    anyPermissions: [
      PERMISSIONS.COMPLAINTS_READ,
      PERMISSIONS.COMPLAINTS_CREATE,
      PERMISSIONS.COMPLAINTS_ASSIGN,
      PERMISSIONS.COMPLAINTS_MANAGE,
    ],
    icon: 'alert',
  },
  {
    name: 'Citas',
    path: '/appointments',
    permission: PERMISSIONS.APPOINTMENTS_READ,
    icon: 'calendar',
  },
  {
    name: 'Solicitudes',
    path: '/admin-requests',
    // All characters: view/create own requests. Manage/assign remain RBAC-gated in the page.
    permission: PERMISSIONS.ADMIN_REQUESTS_READ,
    anyPermissions: [
      PERMISSIONS.ADMIN_REQUESTS_READ,
      PERMISSIONS.ADMIN_REQUESTS_CREATE,
      PERMISSIONS.ADMIN_REQUESTS_ASSIGN,
      PERMISSIONS.ADMIN_REQUESTS_MANAGE,
    ],
    icon: 'archive',
  },
  {
    name: 'Valoraciones',
    path: '/staff-ratings',
    permission: PERMISSIONS.STAFF_RATINGS_READ,
    icon: 'heartPulse',
  },
  {
    name: 'Pagos institucionales',
    path: '/admin/institutional-payments',
    permission: PERMISSIONS.INSTITUTIONAL_PAYMENTS_READ,
    anyPermissions: [
      PERMISSIONS.INSTITUTIONAL_PAYMENTS_READ,
      PERMISSIONS.INSTITUTIONAL_PAYMENTS_CREATE,
    ],
    icon: 'archive',
  },
  {
    name: 'Reglamento',
    path: '/regulations',
    permission: PERMISSIONS.REGULATIONS_READ,
    anyPermissions: [
      PERMISSIONS.REGULATIONS_READ,
      PERMISSIONS.REGULATIONS_CREATE,
      PERMISSIONS.REGULATIONS_UPDATE,
    ],
    icon: 'book',
  },
  {
    name: 'Academia',
    path: '/academy',
    permission: PERMISSIONS.ACADEMY_READ,
    anyPermissions: [PERMISSIONS.ACADEMY_READ, PERMISSIONS.ACADEMY_MANAGE, PERMISSIONS.ADMIN_ACCESS],
    icon: 'file',
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
    anyPermissions: [
      PERMISSIONS.ACADEMY_APPLICATIONS,
      PERMISSIONS.APPLICATIONS_MANAGE,
      PERMISSIONS.ADMIN_ACCESS,
    ],
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
  {
    name: 'Establecimientos',
    path: '/admin/establishments',
    permission: PERMISSIONS.ESTABLISHMENTS_READ,
    anyPermissions: [
      PERMISSIONS.ESTABLISHMENTS_READ,
      PERMISSIONS.ESTABLISHMENTS_MANAGE,
      PERMISSIONS.ADMIN_ACCESS,
    ],
  },
  {
    name: 'Pagos institucionales',
    path: '/admin/institutional-payments',
    permission: PERMISSIONS.INSTITUTIONAL_PAYMENTS_READ,
    anyPermissions: [
      PERMISSIONS.INSTITUTIONAL_PAYMENTS_READ,
      PERMISSIONS.INSTITUTIONAL_PAYMENTS_CREATE,
      PERMISSIONS.ADMIN_ACCESS,
    ],
  },
  {
    name: 'Acceso a informes',
    path: '/admin/medical-report-access',
    permission: PERMISSIONS.MEDICAL_REPORT_ACCESS_GRANT,
    anyPermissions: [
      PERMISSIONS.MEDICAL_REPORT_ACCESS_GRANT,
      PERMISSIONS.MEDICAL_REPORT_ACCESS_REVOKE,
      PERMISSIONS.ADMIN_ACCESS,
    ],
  },
  {
    name: 'Solicitudes de Cambio de Empleo',
    path: '/admin/employment-change',
    permission: PERMISSIONS.EMPLOYMENT_CHANGE_REVIEW,
    anyPermissions: [
      PERMISSIONS.EMPLOYMENT_CHANGE_REVIEW,
      PERMISSIONS.EMPLOYMENT_CHANGE_MANAGE,
      PERMISSIONS.ADMIN_ACCESS,
    ],
  },
  {
    name: 'Participación de Eventos',
    path: '/admin/event-participations',
    permission: PERMISSIONS.EVENT_PARTICIPATIONS_MANAGE,
    anyPermissions: [
      PERMISSIONS.EVENT_PARTICIPATIONS_MANAGE,
      PERMISSIONS.ADMIN_ACCESS,
    ],
  },
];

export function getVisibleNavigation(grantedPermissions, activeCharacter = null) {
  return SIDEBAR_NAVIGATION.filter((item) => {
    if (item.requireCivilianApplicant && !canSubmitAcademyApplication(activeCharacter)) {
      return false;
    }
    if (
      item.requirePartnerAccess &&
      !canAccessPartnerModule(item.requirePartnerAccess, grantedPermissions, activeCharacter)
    ) {
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
