import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getAgreementsDashboard() {
  const response = await apiClient.get('/agreements/dashboard');
  return unwrap(response);
}

export async function listAgreementDirectory(params = {}) {
  const response = await apiClient.get('/agreements/directory', { params });
  return unwrap(response);
}

export async function listAgreements(params = {}) {
  const response = await apiClient.get('/agreements', { params });
  return unwrap(response);
}

export async function getAgreement(id) {
  const response = await apiClient.get(`/agreements/${id}`);
  return unwrap(response);
}

export async function createAgreement(payload) {
  const response = await apiClient.post('/agreements', payload);
  return unwrap(response);
}

export async function updateAgreement(id, payload) {
  const response = await apiClient.patch(`/agreements/${id}`, payload);
  return unwrap(response);
}

export async function activateAgreement(id) {
  const response = await apiClient.post(`/agreements/${id}/activate`);
  return unwrap(response);
}

export async function deactivateAgreement(id) {
  const response = await apiClient.post(`/agreements/${id}/deactivate`);
  return unwrap(response);
}

export async function deleteAgreement(id) {
  const response = await apiClient.delete(`/agreements/${id}`);
  return unwrap(response);
}

export function formatDiscountPercent(value) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '0%';
  return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}%`;
}
