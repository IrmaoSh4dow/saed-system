import { apiClient } from './api-client.js';

export async function listLandingPersonnel() {
  const response = await apiClient.get('/landing/personnel');
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
