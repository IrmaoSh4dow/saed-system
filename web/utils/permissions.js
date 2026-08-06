export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard.read',
  STAFF_READ: 'staff.read',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_IDENTITY: 'staff.identity',
  STAFF_DELETE: 'staff.delete',
  STAFF_MANAGE: 'staff.manage',
  ACCOUNTS_MANAGE: 'accounts.manage',
  DEPARTMENTS_READ: 'departments.read',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
  DEPARTMENTS_MANAGE: 'departments.manage',
  RANKS_READ: 'ranks.read',
  RANKS_CREATE: 'ranks.create',
  RANKS_UPDATE: 'ranks.update',
  RANKS_DELETE: 'ranks.delete',
  PERMISSIONS_READ: 'permissions.read',
  ADMIN_ACCESS: 'admin.access',
  ROLES_READ: 'roles.read',
  ROLES_ASSIGN: 'roles.assign',
  OCCUPATIONS_READ: 'occupations.read',
  OCCUPATIONS_MANAGE: 'occupations.manage',
  DECORATIONS_READ: 'decorations.read',
  DECORATIONS_MANAGE: 'decorations.manage',
  LICENSES_READ: 'licenses.read',
  LICENSES_MANAGE: 'licenses.manage',
  REPORTS_READ: 'reports.read',
  REPORTS_CREATE: 'reports.create',
  REPORTS_APPROVE: 'reports.approve',
  REPORTS_TRANSFER: 'reports.transfer',
  MEDICAL_REPORTS_READ: 'medical-reports.read',
  MEDICAL_REPORTS_CREATE: 'medical-reports.create',
  MEDICAL_REPORTS_UPDATE: 'medical-reports.update',
  MEDICAL_RECORDS_READ: 'medical-records.read',
  MEDICAL_RECORDS_CREATE: 'medical-records.create',
  MEDICAL_RECORDS_UPDATE: 'medical-records.update',
  PATIENTS_READ: 'patients.read',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_UPDATE: 'patients.update',
  COMPLAINTS_READ: 'complaints.read',
  COMPLAINTS_CREATE: 'complaints.create',
  COMPLAINTS_ASSIGN: 'complaints.assign',
  COMPLAINTS_MANAGE: 'complaints.manage',
  APPOINTMENTS_READ: 'appointments.read',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_MANAGE: 'appointments.manage',
  APPOINTMENTS_ASSIGN: 'appointments.assign',
  ADMIN_REQUESTS_READ: 'admin-requests.read',
  ADMIN_REQUESTS_CREATE: 'admin-requests.create',
  ADMIN_REQUESTS_MANAGE: 'admin-requests.manage',
  ADMIN_REQUESTS_ASSIGN: 'admin-requests.assign',
  ACADEMY_READ: 'academy.read',
  ACADEMY_MANAGE: 'academy.manage',
  ACADEMY_APPLY: 'academy.apply',
  ACADEMY_APPLICATIONS: 'academy.applications',
  APPLICATIONS_MANAGE: 'applications.manage',
  AGREEMENTS_READ: 'agreements.read',
  AGREEMENTS_MANAGE: 'agreements.manage',
  ESTABLISHMENTS_READ: 'establishments.read',
  ESTABLISHMENTS_CREATE: 'establishments.create',
  ESTABLISHMENTS_UPDATE: 'establishments.update',
  ESTABLISHMENTS_DELETE: 'establishments.delete',
  ESTABLISHMENTS_MANAGE: 'establishments.manage',
  PSYCHOTECHNICAL_EVALUATIONS_READ: 'psychotechnical-evaluations.read',
  PSYCHOTECHNICAL_EVALUATIONS_CREATE: 'psychotechnical-evaluations.create',
  PSYCHOTECHNICAL_EVALUATIONS_UPDATE: 'psychotechnical-evaluations.update',
  PSYCHOTECHNICAL_EVALUATIONS_MANAGE: 'psychotechnical-evaluations.manage',
  MEDICAL_LEAVES_READ: 'medical-leaves.read',
  MEDICAL_LEAVES_CREATE: 'medical-leaves.create',
  MEDICAL_LEAVES_UPDATE: 'medical-leaves.update',
  MEDICAL_LEAVES_MANAGE: 'medical-leaves.manage',
  OCCUPATIONAL_HEALTH_READ: 'occupational-health.read',
  OCCUPATIONAL_HEALTH_INTEROP: 'occupational-health.interop',
  LSPD_FINANCE_READ: 'lspd.finance.read',
  MEDICAL_RECORD_ACCESS_READ: 'medical-record-access.read',
  MEDICAL_RECORD_ACCESS_REQUEST: 'medical-record-access.request',
  MEDICAL_RECORD_ACCESS_REVIEW: 'medical-record-access.review',
  STAFF_RATINGS_CREATE: 'staff-ratings.create',
  STAFF_RATINGS_READ: 'staff-ratings.read',
  STAFF_RATINGS_DASHBOARD: 'staff-ratings.dashboard',
  SHIFTS_READ: 'shifts.read',
  SHIFTS_CLOCK: 'shifts.clock',
  SHIFTS_MANAGE: 'shifts.manage',
  INCENTIVES_READ: 'incentives.read',
  INCENTIVES_MANAGE: 'incentives.manage',
  INCENTIVES_PAY: 'incentives.pay',
  INCENTIVES_CONFIGURATION: 'incentives.configuration',
  NEWS_MANAGE: 'news.manage',
  GALLERY_MANAGE: 'gallery.manage',
  SETTINGS_READ: 'settings.read',
  PROFILE_READ: 'profile.read',
  CHARACTERS_SWITCH: 'characters.switch',
  CHARACTERS_SEARCH: 'characters.search',
  AUDIT_READ: 'audit.read',
};

const ROLE_PERMISSION_MAP = {
  citizen: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.STAFF_RATINGS_CREATE,
    PERMISSIONS.ACADEMY_APPLY,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  intern: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.ACADEMY_READ,
    PERMISSIONS.SHIFTS_READ,
    PERMISSIONS.SHIFTS_CLOCK,
    PERMISSIONS.AGREEMENTS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_READ,
    PERMISSIONS.MEDICAL_LEAVES_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  resident: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.ACADEMY_READ,
    PERMISSIONS.SHIFTS_READ,
    PERMISSIONS.SHIFTS_CLOCK,
    PERMISSIONS.AGREEMENTS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_READ,
    PERMISSIONS.MEDICAL_LEAVES_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  doctor: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_APPROVE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.SHIFTS_READ,
    PERMISSIONS.SHIFTS_CLOCK,
    PERMISSIONS.AGREEMENTS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_CREATE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_UPDATE,
    PERMISSIONS.MEDICAL_LEAVES_READ,
    PERMISSIONS.MEDICAL_LEAVES_CREATE,
    PERMISSIONS.MEDICAL_LEAVES_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  specialist: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.DEPARTMENTS_UPDATE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_APPROVE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.SHIFTS_READ,
    PERMISSIONS.SHIFTS_CLOCK,
    PERMISSIONS.AGREEMENTS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_CREATE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_UPDATE,
    PERMISSIONS.MEDICAL_LEAVES_READ,
    PERMISSIONS.MEDICAL_LEAVES_CREATE,
    PERMISSIONS.MEDICAL_LEAVES_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  'department-chief': [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.DEPARTMENTS_CREATE,
    PERMISSIONS.DEPARTMENTS_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_TRANSFER,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.ACADEMY_MANAGE,
    PERMISSIONS.SHIFTS_READ,
    PERMISSIONS.SHIFTS_CLOCK,
    PERMISSIONS.SHIFTS_MANAGE,
    PERMISSIONS.AGREEMENTS_READ,
    PERMISSIONS.AGREEMENTS_MANAGE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_CREATE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_UPDATE,
    PERMISSIONS.MEDICAL_LEAVES_READ,
    PERMISSIONS.MEDICAL_LEAVES_CREATE,
    PERMISSIONS.MEDICAL_LEAVES_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  'deputy-medical-director': [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_UPDATE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_ASSIGN,
    PERMISSIONS.COMPLAINTS_READ,
    PERMISSIONS.COMPLAINTS_CREATE,
    PERMISSIONS.COMPLAINTS_ASSIGN,
    PERMISSIONS.SHIFTS_READ,
    PERMISSIONS.SHIFTS_CLOCK,
    PERMISSIONS.SHIFTS_MANAGE,
    PERMISSIONS.INCENTIVES_READ,
    PERMISSIONS.INCENTIVES_MANAGE,
    PERMISSIONS.INCENTIVES_PAY,
    PERMISSIONS.INCENTIVES_CONFIGURATION,
    PERMISSIONS.ADMIN_REQUESTS_READ,
    PERMISSIONS.ADMIN_REQUESTS_CREATE,
    PERMISSIONS.ADMIN_REQUESTS_MANAGE,
    PERMISSIONS.ADMIN_REQUESTS_ASSIGN,
    PERMISSIONS.APPLICATIONS_MANAGE,
    PERMISSIONS.AGREEMENTS_READ,
    PERMISSIONS.AGREEMENTS_MANAGE,
    PERMISSIONS.ESTABLISHMENTS_READ,
    PERMISSIONS.ESTABLISHMENTS_MANAGE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_READ,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_CREATE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_UPDATE,
    PERMISSIONS.PSYCHOTECHNICAL_EVALUATIONS_MANAGE,
    PERMISSIONS.MEDICAL_LEAVES_READ,
    PERMISSIONS.MEDICAL_LEAVES_CREATE,
    PERMISSIONS.MEDICAL_LEAVES_UPDATE,
    PERMISSIONS.MEDICAL_LEAVES_MANAGE,
    PERMISSIONS.OCCUPATIONAL_HEALTH_READ,
    PERMISSIONS.LSPD_FINANCE_READ,
    PERMISSIONS.MEDICAL_RECORD_ACCESS_READ,
    PERMISSIONS.MEDICAL_RECORD_ACCESS_REVIEW,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  'medical-director': ['*'],
  administrator: ['*'],
  'lspd-medical-supervisor': [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.OCCUPATIONAL_HEALTH_INTEROP,
    PERMISSIONS.MEDICAL_RECORD_ACCESS_READ,
    PERMISSIONS.MEDICAL_RECORD_ACCESS_REQUEST,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
};

export function resolvePermissionsForCharacter(character) {
  if (!character) {
    return [];
  }

  const roles = character.roles?.length ? character.roles : defaultRolesForStatus(character.status);
  const granted = new Set();

  for (const role of roles) {
    const permissions = ROLE_PERMISSION_MAP[role] ?? [];
    for (const permission of permissions) {
      granted.add(permission);
    }
  }

  return [...granted];
}

export function defaultRolesForStatus(status) {
  if (status === 'INTERN') {
    return ['intern'];
  }

  if (status === 'MEDICAL_STAFF') {
    return ['doctor'];
  }

  if (status === 'RETIRED' || status === 'SUSPENDED') {
    return ['citizen'];
  }

  return ['citizen'];
}

export function hasPermission(grantedPermissions, requiredPermission) {
  if (!requiredPermission) {
    return true;
  }

  const granted = new Set(grantedPermissions ?? []);

  if (granted.has('*') || granted.has(requiredPermission)) {
    return true;
  }

  const separatorIndex = requiredPermission.lastIndexOf('.');
  if (separatorIndex > 0) {
    const wildcard = `${requiredPermission.slice(0, separatorIndex)}.*`;
    if (granted.has(wildcard)) {
      return true;
    }
  }

  return false;
}

export function hasAnyPermission(grantedPermissions, requiredPermissions = []) {
  if (!requiredPermissions.length) {
    return true;
  }

  return requiredPermissions.some((permission) => hasPermission(grantedPermissions, permission));
}

export function hasAllPermissions(grantedPermissions, requiredPermissions = []) {
  if (!requiredPermissions.length) {
    return true;
  }

  return requiredPermissions.every((permission) => hasPermission(grantedPermissions, permission));
}

export function hasRole(character, role) {
  const roles = character?.roles?.length
    ? character.roles
    : defaultRolesForStatus(character?.status);

  return roles.includes(role);
}

/** Medical RBAC role options for admin promotion forms. */
export const MEDICAL_ROLE_OPTIONS = [
  { value: 'intern', label: 'Intern' },
  { value: 'resident', label: 'Resident' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'department-chief', label: 'Department Chief' },
  { value: 'deputy-medical-director', label: 'Deputy Medical Director' },
  { value: 'medical-director', label: 'Medical Director' },
];
