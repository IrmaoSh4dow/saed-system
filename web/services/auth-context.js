import { isApiAuthEnabled } from '../utils/env.js';
import {
  getCurrentAccount,
  getCurrentActiveCharacter,
  getCurrentCharacters,
  getCurrentPermissions,
} from './identity.service.js';
import { getAccount, getActiveCharacter, getCharacters, getSession } from './session.store.js';
import {
  defaultRolesForStatus,
  hasAnyPermission,
  hasPermission,
  hasRole,
  resolvePermissionsForCharacter,
} from '../utils/permissions.js';

export function getAuthState() {
  if (isApiAuthEnabled()) {
    const activeCharacter = enrichCharacter(getCurrentActiveCharacter());
    const characters = getCurrentCharacters().map(enrichCharacter);
    const permissions = getCurrentPermissions() ?? [];

    return {
      user: getCurrentAccount(),
      activeCharacter,
      characters,
      permissions,
      roles: activeCharacter?.roles ?? [],
      session: null,
      source: 'api',
    };
  }

  const account = getAccount();
  const activeCharacter = enrichCharacter(getActiveCharacter());
  const characters = getCharacters().map(enrichCharacter);
  const permissions = resolvePermissionsForCharacter(activeCharacter);

  return {
    user: account,
    activeCharacter,
    characters,
    permissions,
    roles: activeCharacter?.roles ?? [],
    session: getSession(),
    source: 'local',
  };
}

export function can(permission) {
  const { permissions } = getAuthState();
  return hasPermission(permissions, permission);
}

export function canAny(permissions) {
  const { permissions: granted } = getAuthState();
  return hasAnyPermission(granted, permissions);
}

export function userHasRole(role) {
  const { activeCharacter } = getAuthState();
  return hasRole(activeCharacter, role);
}

function enrichCharacter(character) {
  if (!character) {
    return null;
  }

  const roles = character.roles?.length ? character.roles : defaultRolesForStatus(character.status);
  const rankLabel =
    character.rankLabel ??
    (typeof character.rank === 'string' ? character.rank : character.rank?.name) ??
    (character.status === 'INTERN'
      ? 'Interno'
      : character.status === 'MEDICAL_STAFF'
        ? 'Personal médico'
        : 'Ciudadano');

  return {
    ...character,
    roles,
    rank: rankLabel,
    department: character.department ?? null,
    organization:
      character.organization ??
      character.primaryOccupation?.organization ??
      (character.staffProfile ? 'SAED' : null),
    primaryOccupation: character.primaryOccupation ?? null,
    occupations: character.occupations ?? [],
    staffProfile: character.staffProfile ?? null,
    joinedAt: character.joinedAt ?? character.createdAt?.slice?.(0, 10) ?? null,
  };
}
