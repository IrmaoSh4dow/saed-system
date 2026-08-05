import { apiClient } from './api-client.js';

export async function listOfficers() {
  const response = await apiClient.get('/staff');
  return unwrap(response);
}

export async function getOfficer(staffId) {
  const response = await apiClient.get(`/staff/${staffId}`);
  return unwrap(response);
}

export async function searchOfficerCandidates(query) {
  const response = await apiClient.get('/staff/candidates', {
    params: { q: query },
  });
  return unwrap(response);
}

export async function createOfficer(payload) {
  const response = await apiClient.post('/staff', payload);
  return unwrap(response);
}

export async function updateOfficer(staffId, payload) {
  const response = await apiClient.patch(`/staff/${staffId}`, payload);
  return unwrap(response);
}

export async function updateOfficerIdentity(staffId, payload) {
  const response = await apiClient.patch(`/staff/${staffId}/identity`, payload);
  return unwrap(response);
}

export async function assignStaffDepartment(staffId, payload) {
  const response = await apiClient.post(`/staff/${staffId}/departments`, payload);
  return unwrap(response);
}

export async function removeStaffDepartment(officerDepartmentId) {
  const response = await apiClient.delete(`/staff-departments/${officerDepartmentId}`);
  return unwrap(response);
}

export async function retireOfficer(staffId) {
  const response = await apiClient.delete(`/staff/${staffId}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
