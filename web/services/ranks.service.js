import { apiClient } from './api-client.js';

export async function listRanks() {
  const response = await apiClient.get('/ranks');
  return unwrap(response);
}

export async function listRanksAdmin() {
  const response = await apiClient.get('/ranks/admin/all');
  return unwrap(response);
}

export async function createRank(payload) {
  const response = await apiClient.post('/ranks', payload);
  return unwrap(response);
}

export async function updateRank(rankId, payload) {
  const response = await apiClient.patch(`/ranks/${rankId}`, payload);
  return unwrap(response);
}

export async function deleteRank(rankId) {
  const response = await apiClient.delete(`/ranks/${rankId}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
