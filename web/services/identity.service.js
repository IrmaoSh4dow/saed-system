import { isApiAuthEnabled } from '../utils/env.js';
import * as authApi from './auth.service.js';
import {
  applyAuthSessionPayload,
  clearIdentityState,
  getIdentityState,
  setIdentityCharacters,
  setIdentityHydrated,
  setIdentityPermissions,
  setIdentitySource,
} from './auth-state.store.js';
import * as charactersApi from './characters.service.js';
import {
  addCharacter as addLocalCharacter,
  clearAppSession,
  createAccountSession,
  getAccount,
  getActiveCharacter,
  getCharacters,
  getSession,
  isAuthenticated as isLocalAuthenticated,
  selectActiveCharacter as selectLocalCharacter,
} from './session.store.js';

export function isUsingApiAuth() {
  return isApiAuthEnabled() && authApi.hasApiSession();
}

export function isAuthenticated() {
  if (isApiAuthEnabled()) {
    return authApi.hasApiSession();
  }

  return isLocalAuthenticated();
}

/**
 * Hydrate in-memory identity from API tokens (or mark local mode ready).
 * Call once before starting the router.
 */
export async function bootstrapSession() {
  if (!isApiAuthEnabled()) {
    setIdentitySource('local');
    setIdentityHydrated(true);
    return getIdentityState();
  }

  if (!authApi.hasApiSession()) {
    clearIdentityState();
    setIdentityHydrated(true);
    return getIdentityState();
  }

  try {
    // /auth/me already carries permissions and roles for the active character,
    // so the boot path is two parallel requests instead of three sequential ones.
    const [me, characters] = await Promise.all([
      authApi.fetchMe(),
      charactersApi.listCharacters(),
    ]);

    applyAuthSessionPayload(me);
    setIdentityCharacters(characters);
    setIdentityPermissions(me.permissions ?? [], me.roles ?? []);

    setIdentityHydrated(true);
    return getIdentityState();
  } catch {
    authApi.clearSession();
    clearIdentityState();
    setIdentityHydrated(true);
    return getIdentityState();
  }
}

export async function loginWithPassword(credentials) {
  if (!isApiAuthEnabled()) {
    createAccountSession({
      username: credentials.username ?? credentials.identifier,
      displayName: credentials.displayName ?? credentials.identifier,
    });
    setIdentitySource('local');
    const characters = getCharacters();
    return {
      mode: 'local',
      path: characters.length ? '/characters/select' : '/characters/create',
    };
  }

  const session = await authApi.login(credentials);
  applyAuthSessionPayload({
    ...session,
    character: null,
    permissions: [],
    roles: [],
    account: {
      ...session.account,
      activeCharacterId: null,
    },
  });
  const characters = await charactersApi.listCharacters();
  setIdentityCharacters(characters);
  setIdentityHydrated(true);

  return {
    mode: 'api',
    session,
    path: characters.length ? '/characters/select' : '/characters/create',
  };
}

export async function registerAccount(payload) {
  if (!isApiAuthEnabled()) {
    createAccountSession({
      username: payload.username,
      displayName: payload.displayName,
    });
    setIdentitySource('local');
    return { mode: 'local', path: '/characters/create' };
  }

  const session = await authApi.register(payload);
  applyAuthSessionPayload({
    ...session,
    character: null,
    permissions: [],
    roles: [],
  });
  setIdentityCharacters([]);
  setIdentityHydrated(true);

  return { mode: 'api', session, path: '/characters/create' };
}

export async function loadCharacters() {
  if (isUsingApiAuth()) {
    const characters = await charactersApi.listCharacters();
    setIdentityCharacters(characters);
    return characters;
  }

  return getCharacters();
}

export async function createCharacterRecord(payload) {
  if (isUsingApiAuth() || (isApiAuthEnabled() && authApi.hasApiSession())) {
    const { avatarFile, ...fields } = payload;
    let character = await charactersApi.createCharacter(fields);

    if (avatarFile) {
      character = await charactersApi.uploadCharacterAvatar(character.id, avatarFile);
    }

    const characters = await charactersApi.listCharacters();
    setIdentityCharacters(characters);
    return character;
  }

  await addLocalCharacter(payload);
  return getCharacters().at(-1);
}

export async function switchActiveCharacter(characterId) {
  if (isUsingApiAuth() || (isApiAuthEnabled() && authApi.hasApiSession())) {
    const session = await authApi.selectCharacter(characterId);
    applyAuthSessionPayload(session);
    setIdentityPermissions(session.permissions ?? [], session.roles ?? []);

    const characters = await charactersApi.listCharacters();
    setIdentityCharacters(characters);

    return session;
  }

  return selectLocalCharacter(characterId);
}

export async function loadCurrentUser() {
  if (isUsingApiAuth()) {
    const me = await authApi.fetchMe();
    applyAuthSessionPayload(me);
    return me;
  }

  return {
    account: getAccount(),
    character: getActiveCharacter(),
    permissions: [],
    roles: getActiveCharacter()?.roles ?? [],
  };
}

export async function logoutCurrentSession() {
  if (isApiAuthEnabled() && authApi.hasApiSession()) {
    await authApi.logout();
  }

  clearAppSession();
  authApi.clearSession();
  clearIdentityState();
}

export function resolveAuthenticatedPath() {
  if (isApiAuthEnabled()) {
    const { activeCharacter, characters } = getIdentityState();
    if (!characters.length) {
      return '/characters/create';
    }
    if (!activeCharacter) {
      return '/characters/select';
    }
    return '/dashboard';
  }

  const characters = getCharacters();
  if (!characters.length) {
    return '/characters/create';
  }
  if (!getActiveCharacter()) {
    return '/characters/select';
  }
  return '/dashboard';
}

export function getLocalSessionSnapshot() {
  return getSession();
}

export function getCurrentAccount() {
  if (isApiAuthEnabled()) {
    return getIdentityState().user;
  }

  return getAccount();
}

export function getCurrentActiveCharacter() {
  if (isApiAuthEnabled()) {
    return getIdentityState().activeCharacter;
  }

  return getActiveCharacter();
}

export function getCurrentCharacters() {
  if (isApiAuthEnabled()) {
    return getIdentityState().characters;
  }

  return getCharacters();
}

export function getCurrentPermissions() {
  if (isApiAuthEnabled()) {
    return getIdentityState().permissions;
  }

  return null;
}
