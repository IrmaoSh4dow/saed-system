import { apiClient } from './api-client.js';

export async function listOccupations(characterId) {
  const response = await apiClient.get(`/characters/${characterId}/occupations`);
  return unwrap(response);
}

export async function createOccupation(characterId, payload) {
  const response = await apiClient.post(`/characters/${characterId}/occupations`, payload);
  return unwrap(response);
}

export async function updateOccupation(occupationId, payload) {
  const response = await apiClient.patch(`/occupations/${occupationId}`, payload);
  return unwrap(response);
}

export async function deleteOccupation(occupationId) {
  const response = await apiClient.delete(`/occupations/${occupationId}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
