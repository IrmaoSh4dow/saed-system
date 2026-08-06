import { apiClient } from './api-client.js';

export async function listPatients(params = {}) {
  const response = await apiClient.get('/patients', { params });
  return unwrap(response);
}

export async function searchPatients(params = {}) {
  const response = await apiClient.get('/patients/search', { params });
  return unwrap(response);
}

export async function getPatient(id) {
  const response = await apiClient.get(`/patients/${id}`);
  return unwrap(response);
}

export async function createPatient(payload) {
  const response = await apiClient.post('/patients', payload);
  return unwrap(response);
}

export async function updatePatient(id, payload) {
  const response = await apiClient.patch(`/patients/${id}`, payload);
  return unwrap(response);
}

export async function searchLinkableCharacters(query) {
  const response = await apiClient.get('/patients/characters/search', {
    params: { q: query },
  });
  return unwrap(response);
}

export async function linkPatientCharacter(patientId, characterId) {
  const response = await apiClient.post(`/patients/${patientId}/link`, {
    characterId,
  });
  return unwrap(response);
}

export async function unlinkPatientCharacter(patientId) {
  const response = await apiClient.delete(`/patients/${patientId}/link`);
  return unwrap(response);
}

export async function listTreatments() {
  const response = await apiClient.get('/patients/treatments');
  return unwrap(response);
}

export async function listPatientInvoices(patientId) {
  const response = await apiClient.get(`/patients/${patientId}/invoices`);
  return unwrap(response);
}

export async function createPatientInvoice(patientId, payload) {
  const response = await apiClient.post(`/patients/${patientId}/invoices`, payload);
  return unwrap(response);
}

export async function deletePatientInvoice(patientId, invoiceId) {
  const response = await apiClient.delete(`/patients/${patientId}/invoices/${invoiceId}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
