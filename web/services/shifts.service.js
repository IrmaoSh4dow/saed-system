import { apiClient } from './api-client.js';

function unwrap(response) {
  return response.data?.data ?? response.data;
}

export async function getCurrentShift() {
  const response = await apiClient.get('/shifts/current');
  return unwrap(response);
}

export async function getShiftStats() {
  const response = await apiClient.get('/shifts/stats');
  return unwrap(response);
}

export async function listShiftHistory(limit = 30) {
  const response = await apiClient.get('/shifts/history', { params: { limit } });
  return unwrap(response);
}

export async function clockInShift(timezone) {
  const response = await apiClient.post('/shifts/clock-in', { timezone });
  return unwrap(response);
}

export async function clockOutShift(timezone) {
  const response = await apiClient.post('/shifts/clock-out', { timezone });
  return unwrap(response);
}

export function resolveBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatShiftDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function formatShiftHours(totalSeconds) {
  const hours = (Math.max(0, Number(totalSeconds) || 0) / 3600).toFixed(1);
  return `${hours} h`;
}
