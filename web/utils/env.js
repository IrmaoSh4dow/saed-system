const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';
const DEFAULT_SOCKET_URL = 'http://localhost:3000';

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export function getSocketUrl() {
  return import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET_URL;
}

/**
 * Progressive cutover flag.
 * true  → API/PostgreSQL is the source of truth (tokens only in localStorage).
 * false → legacy saed.session mock (fallback).
 */
export function isApiAuthEnabled() {
  return String(import.meta.env.VITE_USE_API_AUTH ?? 'false').toLowerCase() === 'true';
}
