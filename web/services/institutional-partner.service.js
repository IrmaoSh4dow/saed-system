import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

/**
 * Builds the API client for an institutional partner module (LSPD, LSCSO…).
 * Every agency exposes the same contract under its own base path.
 */
export function createInstitutionalPartnerApi(basePath) {
  return {
    async listDirectory(params = {}) {
      return unwrap(await apiClient.get(`${basePath}/directory`, { params }));
    },

    async getAgent(patientId) {
      return unwrap(await apiClient.get(`${basePath}/agents/${patientId}`));
    },

    async getClinicalRecord(patientId) {
      return unwrap(
        await apiClient.get(`${basePath}/agents/${patientId}/clinical-record`),
      );
    },

    async getFinance(params = {}) {
      return unwrap(await apiClient.get(`${basePath}/finance`, { params }));
    },

    async getDashboard() {
      return unwrap(await apiClient.get(`${basePath}/dashboard`));
    },

    async listAccessRequests(params = {}) {
      return unwrap(await apiClient.get(`${basePath}/access-requests`, { params }));
    },

    async createAccessRequest(payload) {
      return unwrap(await apiClient.post(`${basePath}/access-requests`, payload));
    },

    async approveAccessRequest(id, decisionNotes) {
      return unwrap(
        await apiClient.post(`${basePath}/access-requests/${id}/approve`, {
          decisionNotes,
        }),
      );
    },

    async rejectAccessRequest(id, decisionNotes) {
      return unwrap(
        await apiClient.post(`${basePath}/access-requests/${id}/reject`, {
          decisionNotes,
        }),
      );
    },

    async revokeAccessRequest(id) {
      return unwrap(await apiClient.post(`${basePath}/access-requests/${id}/revoke`));
    },

    async listAuthorizedReports() {
      return unwrap(await apiClient.get(`${basePath}/authorized-reports`));
    },

    async getAuthorizedReport(grantId) {
      return unwrap(await apiClient.get(`${basePath}/authorized-reports/${grantId}`));
    },
  };
}

export function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
