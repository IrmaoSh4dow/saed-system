import { apiClient } from './api-client.js';

export async function listEventParticipations({ q, from, to, limit = 50 } = {}) {
  const response = await apiClient.get('/event-participations', {
    params: { q, from, to, limit },
  });
  return unwrap(response);
}

export async function getEventParticipation(id) {
  const response = await apiClient.get(`/event-participations/${id}`);
  return unwrap(response);
}

export async function createEventParticipation(payload) {
  const response = await apiClient.post('/event-participations', payload);
  return unwrap(response);
}

export async function deleteEventParticipation(id) {
  const response = await apiClient.delete(`/event-participations/${id}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
