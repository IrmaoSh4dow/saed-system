import { apiClient } from './api-client.js';

export async function listDecorations() {
  const response = await apiClient.get('/decorations');
  return unwrap(response);
}

export async function createDecoration(payload) {
  const response = await apiClient.post('/decorations', payload);
  return unwrap(response);
}

export async function updateDecoration(id, payload) {
  const response = await apiClient.patch(`/decorations/${id}`, payload);
  return unwrap(response);
}

export async function listStaffDecorations(staffId) {
  const response = await apiClient.get(`/staff/${staffId}/decorations`);
  return unwrap(response);
}

export async function awardDecoration(staffId, payload) {
  const response = await apiClient.post(`/staff/${staffId}/decorations`, payload);
  return unwrap(response);
}

export async function revokeDecoration(officerDecorationId) {
  const response = await apiClient.delete(`/officer-decorations/${officerDecorationId}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
