import { apiClient } from './api-client.js';

export async function listPermissionsCatalog() {
  const response = await apiClient.get('/permissions');
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
