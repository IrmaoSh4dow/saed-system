import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getInstitutionalPaymentsDashboard() {
  const response = await apiClient.get('/institutional-payments/dashboard');
  return unwrap(response);
}

export async function listInstitutionalOrganizations() {
  const response = await apiClient.get('/institutional-payments/organizations');
  return unwrap(response);
}

export async function getInstitutionalOrganization(establishmentId) {
  const response = await apiClient.get(
    `/institutional-payments/organizations/${establishmentId}`,
  );
  return unwrap(response);
}

export async function listInstitutionalPayments(params = {}) {
  const response = await apiClient.get('/institutional-payments', { params });
  return unwrap(response);
}

export async function createInstitutionalPayment(payload) {
  const response = await apiClient.post('/institutional-payments', payload);
  return unwrap(response);
}

export async function updateInstitutionalPayment(id, payload) {
  const response = await apiClient.patch(`/institutional-payments/${id}`, payload);
  return unwrap(response);
}

export async function voidInstitutionalPayment(id, payload = {}) {
  const response = await apiClient.post(`/institutional-payments/${id}/void`, payload);
  return unwrap(response);
}
