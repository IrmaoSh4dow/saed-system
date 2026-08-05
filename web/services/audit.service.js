import { apiClient } from './api-client.js';

export async function listAuditLogs({ targetType, targetId, limit } = {}) {
  const response = await apiClient.get('/audit-logs', {
    params: {
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
      ...(limit ? { limit } : {}),
    },
  });
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
