import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getRegulationsDashboard() {
  const response = await apiClient.get('/regulations/dashboard');
  return unwrap(response);
}

export async function listRegulationCategories(params = {}) {
  const response = await apiClient.get('/regulations/categories', { params });
  return unwrap(response);
}

export async function createRegulationCategory(payload) {
  const response = await apiClient.post('/regulations/categories', payload);
  return unwrap(response);
}

export async function updateRegulationCategory(id, payload) {
  const response = await apiClient.patch(`/regulations/categories/${id}`, payload);
  return unwrap(response);
}

export async function listRegulationDocuments(params = {}) {
  const response = await apiClient.get('/regulations/documents', { params });
  return unwrap(response);
}

export async function getRegulationDocument(id) {
  const response = await apiClient.get(`/regulations/documents/${id}`);
  return unwrap(response);
}

export async function createRegulationDocument(payload) {
  const response = await apiClient.post('/regulations/documents', payload);
  return unwrap(response);
}

export async function updateRegulationDocument(id, payload) {
  const response = await apiClient.patch(`/regulations/documents/${id}`, payload);
  return unwrap(response);
}

export async function restoreRegulationVersion(documentId, versionId) {
  const response = await apiClient.post(
    `/regulations/documents/${documentId}/restore/${versionId}`,
  );
  return unwrap(response);
}

export async function deleteRegulationDocument(id) {
  const response = await apiClient.delete(`/regulations/documents/${id}`);
  return unwrap(response);
}

export async function uploadRegulationAttachment(documentId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(
    `/regulations/documents/${documentId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(response);
}

export async function deleteRegulationAttachment(documentId, attachmentId) {
  const response = await apiClient.delete(
    `/regulations/documents/${documentId}/attachments/${attachmentId}`,
  );
  return unwrap(response);
}
