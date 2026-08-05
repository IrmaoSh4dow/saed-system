import { APP_EVENTS, emit } from './app-events.js';
import { normalizeCharacter } from './characters.service.js';

const initialState = () => ({
  user: null,
  activeCharacter: null,
  characters: [],
  permissions: [],
  roles: [],
  hydrated: false,
  source: 'none',
});

let state = initialState();

export function getIdentityState() {
  return {
    user: state.user,
    activeCharacter: state.activeCharacter,
    characters: [...state.characters],
    permissions: [...state.permissions],
    roles: [...state.roles],
    hydrated: state.hydrated,
    source: state.source,
  };
}

export function isIdentityHydrated() {
  return state.hydrated;
}

export function setIdentityHydrated(value = true) {
  state.hydrated = value;
}

export function setIdentitySource(source) {
  state.source = source;
}

export function setIdentityUser(user) {
  state.user = user ?? null;
}

export function setIdentityCharacters(characters = []) {
  state.characters = characters.map((item) => normalizeCharacter(item)).filter(Boolean);
}

export function setIdentityActiveCharacter(character) {
  state.activeCharacter = character ? normalizeCharacter(character) : null;
}

export function setIdentityPermissions(permissions = [], roles = []) {
  state.permissions = [...permissions];
  state.roles = [...roles];
}

export function applyAuthSessionPayload(session) {
  if (!session) {
    return;
  }

  setIdentitySource('api');
  setIdentityUser(session.account ?? null);

  const character = session.character
    ? {
        ...session.character,
        permissions: session.permissions ?? session.character.permissions ?? [],
      }
    : null;

  setIdentityActiveCharacter(character);
  setIdentityPermissions(
    session.permissions ?? character?.permissions ?? [],
    session.roles ?? character?.roles ?? [],
  );

  if (character) {
    const others = state.characters.filter((item) => item.id !== character.id);
    setIdentityCharacters([character, ...others]);
  }

  emit(APP_EVENTS.CHARACTER_CHANGED, {
    activeCharacter: state.activeCharacter,
    characters: state.characters,
    permissions: state.permissions,
    roles: state.roles,
  });
}

export function clearIdentityState() {
  state = initialState();
  state.hydrated = true;
  state.source = 'none';
  emit(APP_EVENTS.SESSION_CLEARED);
}

export function getPostAuthPathFromState() {
  // Manual character selection is mandatory after auth (even with a single character).
  if (!state.characters.length) {
    return '/characters/create';
  }

  return '/characters/select';
}
