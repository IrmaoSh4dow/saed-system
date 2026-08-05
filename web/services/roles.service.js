import { apiClient } from './api-client.js';

export async function listRoles() {
  const response = await apiClient.get('/roles');
  return unwrap(response);
}

export async function getCharacterRoles(characterId) {
  const response = await apiClient.get(`/roles/characters/${characterId}`);
  return unwrap(response);
}

export async function setCharacterRoles(characterId, roleSlugs) {
  const response = await apiClient.put(`/roles/characters/${characterId}`, {
    roleSlugs,
  });
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
