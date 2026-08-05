import { apiClient } from './api-client.js';

export async function fetchHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}
