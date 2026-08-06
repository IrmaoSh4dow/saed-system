import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function listLspdDirectory(params = {}) {
  const response = await apiClient.get('/lspd/directory', { params });
  return unwrap(response);
}

export async function getLspdAgent(patientId) {
  const response = await apiClient.get(`/lspd/agents/${patientId}`);
  return unwrap(response);
}

export async function getLspdClinicalRecord(patientId) {
  const response = await apiClient.get(`/lspd/agents/${patientId}/clinical-record`);
  return unwrap(response);
}

export async function getLspdFinance(params = {}) {
  const response = await apiClient.get('/lspd/finance', { params });
  return unwrap(response);
}

export async function getLspdDashboard() {
  const response = await apiClient.get('/lspd/dashboard');
  return unwrap(response);
}

export async function listMedicalRecordAccessRequests(params = {}) {
  const response = await apiClient.get('/lspd/access-requests', { params });
  return unwrap(response);
}

export async function createMedicalRecordAccessRequest(payload) {
  const response = await apiClient.post('/lspd/access-requests', payload);
  return unwrap(response);
}

export async function approveMedicalRecordAccessRequest(id, decisionNotes) {
  const response = await apiClient.post(`/lspd/access-requests/${id}/approve`, {
    decisionNotes,
  });
  return unwrap(response);
}

export async function rejectMedicalRecordAccessRequest(id, decisionNotes) {
  const response = await apiClient.post(`/lspd/access-requests/${id}/reject`, {
    decisionNotes,
  });
  return unwrap(response);
}

export async function revokeMedicalRecordAccessRequest(id) {
  const response = await apiClient.post(`/lspd/access-requests/${id}/revoke`);
  return unwrap(response);
}

export function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
