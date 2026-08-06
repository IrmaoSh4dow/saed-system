import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function listEstablishments(params = {}) {
  const response = await apiClient.get('/establishments', { params });
  return unwrap(response);
}

export async function getEstablishment(id) {
  const response = await apiClient.get(`/establishments/${id}`);
  return unwrap(response);
}

export async function createEstablishment(payload) {
  const response = await apiClient.post('/establishments', payload);
  return unwrap(response);
}

export async function updateEstablishment(id, payload) {
  const response = await apiClient.patch(`/establishments/${id}`, payload);
  return unwrap(response);
}

export async function activateEstablishment(id) {
  const response = await apiClient.post(`/establishments/${id}/activate`);
  return unwrap(response);
}

export async function deactivateEstablishment(id) {
  const response = await apiClient.post(`/establishments/${id}/deactivate`);
  return unwrap(response);
}

export async function uploadEstablishmentLogo(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/establishments/${id}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(response);
}
