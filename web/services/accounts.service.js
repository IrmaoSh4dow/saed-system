import { apiClient } from './api-client.js';

export async function listAccounts({ q = '', page = 1, pageSize = 20 } = {}) {
  const response = await apiClient.get('/accounts', {
    params: { q: q || undefined, page, pageSize },
  });
  return unwrap(response);
}

export async function getAccount(accountId) {
  const response = await apiClient.get(`/accounts/${accountId}`);
  return unwrap(response);
}

export async function resetAccountPassword(accountId, password) {
  const response = await apiClient.patch(`/accounts/${accountId}/password`, {
    password,
  });
  return unwrap(response);
}

export async function updateMyUsername(username) {
  const response = await apiClient.patch('/accounts/me/username', { username });
  return unwrap(response);
}

export async function changeMyPassword({ currentPassword, newPassword }) {
  const response = await apiClient.patch('/accounts/me/password', {
    currentPassword,
    newPassword,
  });
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
