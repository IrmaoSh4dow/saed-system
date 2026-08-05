import { apiClient } from './api-client.js';
import { getApiBaseUrl } from '../utils/env.js';

export async function searchCharacters(query) {
  const response = await apiClient.get('/characters/search', {
    params: { q: query },
  });
  return unwrap(response);
}

export async function listCharactersDirectory(params = {}) {
  const response = await apiClient.get('/characters/directory', { params });
  const data = unwrap(response);
  return {
    ...data,
    items: (data.items ?? []).map(normalizeCharacter),
  };
}

export async function getCharacterAdmin(characterId) {
  const response = await apiClient.get(`/characters/admin/${characterId}`);
  return normalizeCharacter(unwrap(response));
}

export async function listWorkplaces() {
  const response = await apiClient.get('/characters/workplaces');
  return unwrap(response);
}

export async function listCharacters() {
  const response = await apiClient.get('/characters');
  return unwrap(response).map(normalizeCharacter);
}

export async function getCharacter(characterId) {
  const response = await apiClient.get(`/characters/${characterId}`);
  return normalizeCharacter(unwrap(response));
}

export async function createCharacter(payload) {
  const response = await apiClient.post('/characters', {
    firstName: payload.firstName,
    lastName: payload.lastName,
    birthDate: payload.birthDate,
    sex: payload.sex,
    nationality: payload.nationality,
    organization: payload.organization,
    position: payload.position,
    fivemCitizenId: payload.fivemCitizenId,
  });
  return normalizeCharacter(unwrap(response));
}

/** Multipart avatar upload — never Base64. Max 8 MB (JPEG/PNG/WebP). */
export async function uploadCharacterAvatar(characterId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/characters/${characterId}/avatar`, formData, {
    timeout: 60000,
  });
  return normalizeCharacter(unwrap(response));
}

export async function updateMyCharacter(payload) {
  const response = await apiClient.patch('/characters/me', payload);
  return normalizeCharacter(unwrap(response));
}

export async function updateCharacter(characterId, payload) {
  const response = await apiClient.patch(`/characters/${characterId}`, payload);
  return normalizeCharacter(unwrap(response));
}

export async function fetchActivePermissions() {
  const response = await apiClient.get('/characters/active/permissions');
  return unwrap(response);
}

/**
 * Maps API character DTO to the shape already used by local UI components.
 */
export function normalizeCharacter(character) {
  if (!character) {
    return null;
  }

  const avatarUrl = resolveAssetUrl(character.avatarUrl);

  return {
    id: character.id,
    accountId: character.accountId,
    firstName: character.firstName,
    lastName: character.lastName,
    birthDate: character.birthDate,
    sex: character.sex,
    nationality: character.nationality,
    phone: character.phone ?? null,
    biography: character.biography ?? null,
    avatarUrl,
    status: character.status,
    rank: character.rankLabel ?? character.rank?.name ?? null,
    rankId: character.rank?.id ?? character.rankId ?? null,
    department: character.department ?? character.staffProfile?.departmentName ?? null,
    organization:
      character.primaryOccupation?.organization ?? (character.staffProfile ? 'SAED' : null),
    position: character.primaryOccupation?.position ?? null,
    joinedAt: character.joinedAt,
    roles: character.roles ?? [],
    permissions: character.permissions ?? [],
    occupations: character.occupations ?? [],
    primaryOccupation: character.primaryOccupation ?? null,
    staffProfile: character.staffProfile ?? null,
    fivemCitizenId: character.fivemCitizenId ?? null,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}

function resolveAssetUrl(avatarUrl) {
  if (!avatarUrl) {
    return null;
  }

  if (
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://') ||
    avatarUrl.startsWith('data:')
  ) {
    return avatarUrl;
  }

  if (avatarUrl.startsWith('/uploads/')) {
    const apiBase = getApiBaseUrl().replace(/\/api\/v1\/?$/, '');
    return `${apiBase}${avatarUrl}`;
  }

  return avatarUrl;
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
