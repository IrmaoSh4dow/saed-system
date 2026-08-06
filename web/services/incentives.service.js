import { apiClient } from './api-client.js';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function getIncentivesDashboard() {
  const response = await apiClient.get('/incentives/dashboard');
  return unwrap(response);
}

export async function listIncentiveStaff(q = '') {
  const response = await apiClient.get('/incentives/staff', {
    params: q?.trim() ? { q: q.trim() } : undefined,
  });
  return unwrap(response);
}

export async function getIncentiveStaffDetail(staffProfileId) {
  const response = await apiClient.get(`/incentives/staff/${staffProfileId}`);
  return unwrap(response);
}

export async function payIncentive(staffProfileId, payload = {}) {
  const response = await apiClient.post(`/incentives/staff/${staffProfileId}/pay`, payload);
  return unwrap(response);
}

export async function listIncentivePayments(params = {}) {
  const response = await apiClient.get('/incentives/payments', { params });
  return unwrap(response);
}

export async function listIncentiveConfigurations() {
  const response = await apiClient.get('/incentives/configurations');
  return unwrap(response);
}

export async function updateIncentiveConfiguration(rankId, amount) {
  const response = await apiClient.patch(`/incentives/configurations/${rankId}`, { amount });
  return unwrap(response);
}

export function formatIncentiveMoney(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
