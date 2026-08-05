/**
 * Resolves whether granted permission keys satisfy a required permission.
 * Supports exact matches, resource wildcards (reports.*), and global wildcard (*).
 */
export function hasPermission(grantedPermissions: string[], requiredPermission: string): boolean {
  if (!requiredPermission) {
    return false;
  }

  const granted = new Set(grantedPermissions);

  if (granted.has('*') || granted.has(requiredPermission)) {
    return true;
  }

  const separatorIndex = requiredPermission.lastIndexOf('.');

  if (separatorIndex > 0) {
    const resourceWildcard = `${requiredPermission.slice(0, separatorIndex)}.*`;
    if (granted.has(resourceWildcard)) {
      return true;
    }
  }

  return false;
}

export function hasAllPermissions(
  grantedPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.every((permission) => hasPermission(grantedPermissions, permission));
}

export function hasAnyPermission(
  grantedPermissions: string[],
  requiredPermissions: string[],
): boolean {
  if (!requiredPermissions.length) {
    return true;
  }

  return requiredPermissions.some((permission) => hasPermission(grantedPermissions, permission));
}
