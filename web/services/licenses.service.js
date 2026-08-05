import { apiClient } from './api-client.js';

export async function listLicenses() {
  const response = await apiClient.get('/licenses');
  return unwrap(response);
}

export async function createLicense(payload) {
  const response = await apiClient.post('/licenses', payload);
  return unwrap(response);
}

export async function updateLicense(id, payload) {
  const response = await apiClient.patch(`/licenses/${id}`, payload);
  return unwrap(response);
}

export async function deleteLicense(id) {
  const response = await apiClient.delete(`/licenses/${id}`);
  return unwrap(response);
}

export async function listStaffLicenses(staffId) {
  const response = await apiClient.get(`/staff/${staffId}/licenses`);
  return unwrap(response);
}

export async function assignLicense(staffId, payload) {
  const response = await apiClient.post(`/staff/${staffId}/licenses`, payload);
  return unwrap(response);
}

export async function revokeLicense(officerLicenseId) {
  const response = await apiClient.delete(`/officer-licenses/${officerLicenseId}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
