import { apiClient, refreshAccessToken } from './api-client.js';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasApiTokens,
  setTokens,
} from './token.store.js';

export {
  clearTokens as clearSession,
  getAccessToken,
  getRefreshToken,
  hasApiTokens as hasApiSession,
  setTokens,
};

export function setSession({ accessToken, refreshToken } = {}) {
  setTokens({ accessToken, refreshToken });
  localStorage.removeItem('saed.activeCharacter');
}

export async function register(payload) {
  const response = await apiClient.post('/auth/register', {
    username: payload.username,
    password: payload.password,
    displayName: payload.displayName,
  });
  const data = unwrap(response);
  setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data;
}

export async function login(payload) {
  const response = await apiClient.post('/auth/login', {
    identifier: payload.identifier ?? payload.username,
    password: payload.password,
  });
  const data = unwrap(response);
  setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data;
}

export async function refreshSession() {
  return refreshAccessToken();
}

export async function logout() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await refreshClientLogout(refreshToken);
    } catch {
      // Ignore logout network errors and clear local tokens anyway.
    }
  }

  clearTokens();
}

async function refreshClientLogout(refreshToken) {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function fetchMe() {
  const response = await apiClient.get('/auth/me');
  return unwrap(response);
}

export async function selectCharacter(characterId) {
  const response = await apiClient.post(`/auth/characters/${characterId}/select`);
  const data = unwrap(response);
  setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? getRefreshToken(),
  });
  return data;
}

export function getApiErrorMessage(error, fallback = 'Ha ocurrido un error inesperado.') {
  const payload = error?.response?.data;

  if (typeof payload?.message === 'string' && payload.message.trim()) {
    if (
      payload.message === 'Validation failed' &&
      Array.isArray(payload.errors) &&
      payload.errors.length
    ) {
      return payload.errors
        .map((item) => (typeof item === 'string' ? item : item.message))
        .join(' ');
    }

    return payload.message;
  }

  if (Array.isArray(payload?.errors) && payload.errors.length) {
    return payload.errors
      .map((item) => (typeof item === 'string' ? item : item?.message))
      .join(' ');
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
