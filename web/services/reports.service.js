import { apiClient } from './api-client.js';

export async function listReports(scope = 'mine') {
  const response = await apiClient.get('/reports', { params: { scope } });
  return unwrap(response);
}

export async function getReport(reportId) {
  const response = await apiClient.get(`/reports/${reportId}`);
  return unwrap(response);
}

export async function createReport(payload) {
  const response = await apiClient.post('/reports', payload);
  return unwrap(response);
}

export async function updateReport(reportId, payload) {
  const response = await apiClient.patch(`/reports/${reportId}`, payload);
  return unwrap(response);
}

export async function transferReport(reportId, payload) {
  const response = await apiClient.post(`/reports/${reportId}/transfer`, payload);
  return unwrap(response);
}

export async function addReportParticipant(reportId, staffProfileId) {
  const response = await apiClient.post(`/reports/${reportId}/participants`, {
    staffProfileId,
  });
  return unwrap(response);
}

export async function removeReportParticipant(reportId, staffProfileId) {
  const response = await apiClient.delete(`/reports/${reportId}/participants/${staffProfileId}`);
  return unwrap(response);
}

export async function addReportEvidence(reportId, payload) {
  const response = await apiClient.post(`/reports/${reportId}/evidence`, payload);
  return unwrap(response);
}

export async function uploadReportEvidenceImage(reportId, file, label) {
  const formData = new FormData();
  formData.append('file', file);
  if (label) {
    formData.append('label', label);
  }

  const response = await apiClient.post(`/reports/${reportId}/evidence/upload`, formData, {
    timeout: 60000,
  });
  return unwrap(response);
}

export async function searchReportOfficers(query) {
  const response = await apiClient.get('/reports/staff/search', {
    params: { q: query },
  });
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
