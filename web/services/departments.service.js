import { apiClient } from './api-client.js';

export async function listDepartments(scope) {
  const response = await apiClient.get('/departments', {
    params: scope ? { scope } : undefined,
  });
  return unwrap(response);
}

export async function getDepartment(departmentId) {
  const response = await apiClient.get(`/departments/${departmentId}`);
  return unwrap(response);
}

export async function createDepartment(payload) {
  const response = await apiClient.post('/departments', payload);
  return unwrap(response);
}

export async function updateDepartment(departmentId, payload) {
  const response = await apiClient.patch(`/departments/${departmentId}`, payload);
  return unwrap(response);
}

export async function deleteDepartment(departmentId) {
  const response = await apiClient.delete(`/departments/${departmentId}`);
  return unwrap(response);
}

export async function addDepartmentSupervisor(departmentId, staffProfileId) {
  const response = await apiClient.post(`/departments/${departmentId}/supervisors`, {
    staffProfileId,
  });
  return unwrap(response);
}

export async function removeDepartmentSupervisor(departmentId, staffProfileId) {
  const response = await apiClient.delete(
    `/departments/${departmentId}/supervisors/${staffProfileId}`,
  );
  return unwrap(response);
}

export async function createDepartmentOpening(departmentId, payload) {
  const response = await apiClient.post(`/departments/${departmentId}/openings`, payload);
  return unwrap(response);
}

export async function updateDepartmentOpening(openingId, payload) {
  const response = await apiClient.patch(`/departments/openings/${openingId}`, payload);
  return unwrap(response);
}

export async function createInterestLetter(openingId, payload) {
  const response = await apiClient.post(
    `/departments/openings/${openingId}/interest-letters`,
    payload,
  );
  return unwrap(response);
}

export async function listDepartmentInterestLetters(departmentId) {
  const response = await apiClient.get(`/departments/${departmentId}/interest-letters`);
  return unwrap(response);
}

export async function listMyInterestLetters() {
  const response = await apiClient.get('/departments/interest-letters/mine');
  return unwrap(response);
}

export async function acceptInterestLetter(letterId, payload = {}) {
  const response = await apiClient.post(`/departments/interest-letters/${letterId}/accept`, payload);
  return unwrap(response);
}

export async function rejectInterestLetter(letterId, payload = {}) {
  const response = await apiClient.post(`/departments/interest-letters/${letterId}/reject`, payload);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
