import { apiClient } from './api-client.js';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function getAdminRequestStats() {
  const response = await apiClient.get('/admin-requests/stats');
  return unwrap(response);
}

export async function listAdminRequests(params = {}) {
  const response = await apiClient.get('/admin-requests', { params });
  return unwrap(response);
}

export async function getAdminRequest(id) {
  const response = await apiClient.get(`/admin-requests/${id}`);
  return unwrap(response);
}

export async function createAdminRequest(payload) {
  const response = await apiClient.post('/admin-requests', payload);
  return unwrap(response);
}

export async function updateAdminRequestStatus(id, status) {
  const response = await apiClient.patch(`/admin-requests/${id}/status`, { status });
  return unwrap(response);
}

export async function updateAdminRequestPriority(id, priority) {
  const response = await apiClient.patch(`/admin-requests/${id}/priority`, { priority });
  return unwrap(response);
}

export async function assignAdminRequest(id, characterId) {
  const response = await apiClient.post(`/admin-requests/${id}/assignments`, { characterId });
  return unwrap(response);
}

export async function sendAdminRequestMessage(id, payload) {
  const response = await apiClient.post(`/admin-requests/${id}/messages`, payload);
  return unwrap(response);
}

export async function addAdminRequestNote(id, body) {
  const response = await apiClient.post(`/admin-requests/${id}/notes`, { body });
  return unwrap(response);
}

export async function searchAdminRequestAssignees(query) {
  const response = await apiClient.get('/admin-requests/assignees/search', {
    params: { q: query },
  });
  return unwrap(response);
}

export const ADMIN_REQUEST_TYPE_LABELS = {
  ADMINISTRATIVE_APPOINTMENT: 'Cita administrativa',
  AGREEMENT_SIGNING: 'Firma de convenio',
  HIGH_COMMAND_MEETING: 'Reunión con Alto Mando',
  COMMERCIAL_REQUEST: 'Solicitud comercial',
  OTHER: 'Otro',
};

export const ADMIN_REQUEST_STATUS_LABELS = {
  PENDING: 'Pendiente',
  UNDER_REVIEW: 'En revisión',
  IN_PROCESS: 'En proceso',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

export const ADMIN_REQUEST_PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};
