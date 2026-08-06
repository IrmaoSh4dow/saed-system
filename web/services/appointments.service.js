import { apiClient } from './api-client.js';

export async function listAppointments() {
  const response = await apiClient.get('/appointments');
  return unwrap(response);
}

export async function getAppointment(id) {
  const response = await apiClient.get(`/appointments/${id}`);
  return unwrap(response);
}

export async function createAppointment(payload) {
  const response = await apiClient.post('/appointments', payload);
  return unwrap(response);
}

export async function updateAppointmentStatus(id, payload) {
  const response = await apiClient.patch(`/appointments/${id}/status`, payload);
  return unwrap(response);
}

export async function assignAppointmentStaff(id, payload) {
  const response = await apiClient.post(`/appointments/${id}/assignments`, payload);
  return unwrap(response);
}

export async function transferAppointmentDepartment(id, payload) {
  const response = await apiClient.patch(`/appointments/${id}/department`, payload);
  return unwrap(response);
}

export async function sendAppointmentMessage(id, body) {
  const response = await apiClient.post(`/appointments/${id}/messages`, { body });
  return unwrap(response);
}

export async function addAppointmentNote(id, body) {
  const response = await apiClient.post(`/appointments/${id}/notes`, { body });
  return unwrap(response);
}

export async function searchAppointmentStaff(query) {
  const response = await apiClient.get('/appointments/staff/search', {
    params: { q: query },
  });
  return unwrap(response);
}

export async function listAppointmentDepartments() {
  const response = await apiClient.get('/appointments/departments');
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
