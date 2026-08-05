const ACCESS_TOKEN_KEY = 'saed.jwt';
const REFRESH_TOKEN_KEY = 'saed.refresh';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasApiTokens() {
  return Boolean(getAccessToken() || getRefreshToken());
}

export function setTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('saed.activeCharacter');
}
