export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard.read',
  STAFF_READ: 'staff.read',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_IDENTITY: 'staff.identity',
  STAFF_DELETE: 'staff.delete',
  ACCOUNTS_MANAGE: 'accounts.manage',
  DEPARTMENTS_READ: 'departments.read',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
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
  COMPLAINTS_READ: 'complaints.read',
  COMPLAINTS_CREATE: 'complaints.create',
  COMPLAINTS_MANAGE: 'complaints.manage',
  ACADEMY_READ: 'academy.read',
  ACADEMY_MANAGE: 'academy.manage',
  ACADEMY_APPLY: 'academy.apply',
  ACADEMY_APPLICATIONS: 'academy.applications',
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
    PERMISSIONS.COMPLAINTS_READ,
    PERMISSIONS.COMPLAINTS_CREATE,
    PERMISSIONS.ACADEMY_APPLY,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  cadet: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.COMPLAINTS_READ,
    PERMISSIONS.COMPLAINTS_CREATE,
    PERMISSIONS.ACADEMY_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  officer: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.COMPLAINTS_READ,
    PERMISSIONS.COMPLAINTS_CREATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  sergeant: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.DEPARTMENTS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.COMPLAINTS_READ,
    PERMISSIONS.COMPLAINTS_CREATE,
    PERMISSIONS.ACADEMY_READ,
    PERMISSIONS.ACADEMY_MANAGE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.CHARACTERS_SWITCH,
  ],
  administrator: ['*'],
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
    return ['cadet'];
  }

  if (status === 'MEDICAL_STAFF') {
    return ['officer'];
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
