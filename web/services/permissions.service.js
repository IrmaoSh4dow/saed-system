import { apiClient } from './api-client.js';
import { fetchActivePermissions as fetchActivePermissionsFromCharacters } from './characters.service.js';

export async function listPermissionsCatalog() {
  const response = await apiClient.get('/permissions');
  return unwrap(response);
}

export async function fetchActivePermissions() {
  return fetchActivePermissionsFromCharacters();
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
