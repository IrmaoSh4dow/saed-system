import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function createStaffRating(payload) {
  const response = await apiClient.post('/staff-ratings', payload);
  return unwrap(response);
}

export async function getStaffRatingsDashboard() {
  const response = await apiClient.get('/staff-ratings/dashboard');
  return unwrap(response);
}

export async function listPendingStaffRatings() {
  const response = await apiClient.get('/staff-ratings/pending');
  return unwrap(response);
}

export async function getStaffRatingEligibility(adminRequestId) {
  const response = await apiClient.get(`/staff-ratings/eligibility/${adminRequestId}`);
  return unwrap(response);
}

export async function getStaffProfileRatings(staffProfileId, params = {}) {
  const response = await apiClient.get(`/staff-ratings/staff/${staffProfileId}`, { params });
  return unwrap(response);
}
