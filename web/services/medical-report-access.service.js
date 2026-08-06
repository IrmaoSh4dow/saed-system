import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getMedicalReportAccessDashboard() {
  const response = await apiClient.get('/medical-report-access/dashboard');
  return unwrap(response);
}

export async function listMedicalReportAccessReasons() {
  const response = await apiClient.get('/medical-report-access/reasons');
  return unwrap(response);
}

export async function listMedicalReportAccessRecipients() {
  const response = await apiClient.get('/medical-report-access/recipients');
  return unwrap(response);
}

export async function listMedicalReportAccessGrants(params = {}) {
  const response = await apiClient.get('/medical-report-access/grants', { params });
  return unwrap(response);
}

export async function listMedicalReportAccessGrantsForReport(reportId) {
  const response = await apiClient.get(`/medical-report-access/reports/${reportId}/grants`);
  return unwrap(response);
}

export async function grantMedicalReportAccess(payload) {
  const response = await apiClient.post('/medical-report-access/grants', payload);
  return unwrap(response);
}

export async function revokeMedicalReportAccess(grantId) {
  const response = await apiClient.post(`/medical-report-access/grants/${grantId}/revoke`);
  return unwrap(response);
}

export async function listAuthorizedMedicalReports() {
  const response = await apiClient.get('/lspd/authorized-reports');
  return unwrap(response);
}

export async function getAuthorizedMedicalReport(grantId) {
  const response = await apiClient.get(`/lspd/authorized-reports/${grantId}`);
  return unwrap(response);
}

export function formatRemainingAccess(remainingMs) {
  const total = Math.max(0, Number(remainingMs) || 0);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  if (hours <= 0 && minutes <= 0) return '0m';
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
