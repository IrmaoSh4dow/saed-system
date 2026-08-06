import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function listMyEmploymentChangeRequests() {
  const response = await apiClient.get('/employment-change/mine');
  return unwrap(response);
}

export async function listEmploymentChangeRequests(params = {}) {
  const response = await apiClient.get('/employment-change', { params });
  return unwrap(response);
}

export async function getEmploymentChangeDashboard() {
  const response = await apiClient.get('/employment-change/dashboard');
  return unwrap(response);
}

export async function createEmploymentChangeRequest(payload) {
  const response = await apiClient.post('/employment-change', payload);
  return unwrap(response);
}

export async function cancelEmploymentChangeRequest(id) {
  const response = await apiClient.post(`/employment-change/${id}/cancel`);
  return unwrap(response);
}

export async function markEmploymentChangeUnderReview(id, payload = {}) {
  const response = await apiClient.post(`/employment-change/${id}/under-review`, payload);
  return unwrap(response);
}

export async function approveEmploymentChangeRequest(id, payload = {}) {
  const response = await apiClient.post(`/employment-change/${id}/approve`, payload);
  return unwrap(response);
}

export async function rejectEmploymentChangeRequest(id, payload = {}) {
  const response = await apiClient.post(`/employment-change/${id}/reject`, payload);
  return unwrap(response);
}

export async function updateEmploymentChangeNotes(id, payload = {}) {
  const response = await apiClient.patch(`/employment-change/${id}/notes`, payload);
  return unwrap(response);
}

export async function applyCharacterEmployment(characterId, payload) {
  const response = await apiClient.post(
    `/employment-change/characters/${characterId}/apply`,
    payload,
  );
  return unwrap(response);
}

export const EMPLOYMENT_CHANGE_STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
};
