import { APP_EVENTS, emit } from './app-events.js';

const SESSION_KEY = 'saed.session';
const MAX_AVATAR_DATA_URL_LENGTH = 120_000;

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const session = getSession();
  return Boolean(session?.account?.id);
}

export function getAccount() {
  return getSession()?.account ?? null;
}

export function getCharacters() {
  return getSession()?.characters ?? [];
}

export function getActiveCharacter() {
  const session = getSession();
  if (!session?.activeCharacterId) {
    return null;
  }

  return session.characters.find((item) => item.id === session.activeCharacterId) ?? null;
}

export function saveSession(nextSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    return nextSession;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }

    const reducedSession = {
      ...nextSession,
      characters: (nextSession.characters ?? []).map((character) => ({
        ...character,
        avatarUrl: null,
      })),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(reducedSession));
    return reducedSession;
  }
}

export function createAccountSession({ email = null, username = null, displayName = null } = {}) {
  const accountId = crypto.randomUUID();
  const resolvedUsername = (username || email?.split('@')[0] || 'usuario').toLowerCase();

  return saveSession({
    account: {
      id: accountId,
      email: email?.toLowerCase() || null,
      username: resolvedUsername,
      displayName: displayName || resolvedUsername,
    },
    characters: [],
    activeCharacterId: null,
  });
}

export async function addCharacter(characterInput) {
  const session = getSession();
  if (!session) {
    throw new Error('No hay sesión activa');
  }

  if (session.characters.length >= 2) {
    throw new Error('Cada cuenta puede tener como máximo 2 personajes');
  }

  const avatarUrl = await normalizeAvatarDataUrl(characterInput.avatarUrl);

  const character = {
    id: crypto.randomUUID(),
    accountId: session.account.id,
    firstName: characterInput.firstName.trim(),
    lastName: characterInput.lastName.trim(),
    birthDate: characterInput.birthDate,
    sex: characterInput.sex,
    nationality: characterInput.nationality.trim(),
    avatarUrl,
    status: 'CIVIL',
    rank: 'Ciudadano',
    department: null,
    organization: characterInput.organization,
    position: characterInput.position ?? 'Empleado',
    primaryOccupation: {
      type: 'EMPLOYMENT',
      organization: characterInput.organization,
      position: characterInput.position ?? 'Empleado',
    },
    occupations: [
      {
        id: crypto.randomUUID(),
        type: 'EMPLOYMENT',
        organization: characterInput.organization,
        position: characterInput.position ?? 'Empleado',
        isPrimary: true,
        isActive: true,
      },
    ],
    joinedAt: new Date().toISOString().slice(0, 10),
    roles: ['citizen'],
    createdAt: new Date().toISOString(),
  };

  session.characters.push(character);
  return saveSession(session);
}

export function selectActiveCharacter(characterId) {
  const session = getSession();
  if (!session) {
    throw new Error('No hay sesión activa');
  }

  const character = session.characters.find((item) => item.id === characterId);
  if (!character) {
    throw new Error('Personaje no encontrado');
  }

  session.activeCharacterId = characterId;
  const saved = saveSession(session);
  emit(APP_EVENTS.CHARACTER_CHANGED, {
    activeCharacter: character,
    characters: saved.characters,
  });
  return saved;
}

export function clearAppSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('saed.activeCharacter');
  emit(APP_EVENTS.SESSION_CLEARED);
}

export function getPostAuthPath() {
  const characters = getCharacters();
  if (!characters.length) {
    return '/characters/create';
  }

  // Always require manual character selection after auth.
  return '/characters/select';
}

function isQuotaExceededError(error) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

async function normalizeAvatarDataUrl(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  if (avatarUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) {
    return avatarUrl;
  }

  return compressDataUrl(avatarUrl, 480, 0.72);
}

function compressDataUrl(dataUrl, maxSize, quality) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.length <= MAX_AVATAR_DATA_URL_LENGTH ? compressed : null);
    };

    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}
