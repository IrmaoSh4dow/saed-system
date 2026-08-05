import { can, getAuthState } from '../services/auth-context.js';

export function useAuthState() {
  return getAuthState();
}

export function usePermission(permission) {
  return can(permission);
}

export function usePermissions() {
  return getAuthState().permissions;
}
