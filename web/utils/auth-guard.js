import { navigate } from '../utils/router.js';
import { can } from '../services/auth-context.js';
import {
  isAuthenticated,
  logoutCurrentSession,
  resolveAuthenticatedPath,
  getCurrentActiveCharacter,
} from '../services/identity.service.js';
import { isApiAuthEnabled } from './env.js';
import {
  getActiveCharacter,
  getPostAuthPath,
  isAuthenticated as isLocalAuthenticated,
} from '../services/session.store.js';
import { setAuthRedirect } from './auth-redirect.js';

export function requireGuest() {
  if (isAuthenticated()) {
    setAuthRedirect(resolveAuthenticatedPath());
    return false;
  }

  return true;
}

export function requireAuth() {
  if (!isAuthenticated()) {
    setAuthRedirect('/auth/login');
    return false;
  }

  return true;
}

export function requireCharactersOrCreate() {
  return requireAuth();
}

export function requireActiveCharacter() {
  if (!requireAuth()) {
    return false;
  }

  const activeCharacter = isApiAuthEnabled() ? getCurrentActiveCharacter() : getActiveCharacter();

  if (!activeCharacter) {
    setAuthRedirect(resolveAuthenticatedPath());
    return false;
  }

  return true;
}

export function requirePermission(permission) {
  if (!requireActiveCharacter()) {
    return false;
  }

  if (!can(permission)) {
    setAuthRedirect('/dashboard');
    return false;
  }

  return true;
}

export function logoutAndRedirect() {
  void logoutCurrentSession().finally(() => {
    void navigate('/auth/login', { replace: true });
  });
}

export function getLegacyPostAuthPath() {
  return isApiAuthEnabled() ? resolveAuthenticatedPath() : getPostAuthPath();
}

export function isLegacyLocalAuthenticated() {
  return isLocalAuthenticated();
}
