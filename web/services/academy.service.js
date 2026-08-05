import { apiClient } from './api-client.js';

export async function getAcademyDashboard() {
  const response = await apiClient.get('/academy/dashboard');
  return unwrap(response);
}

export async function listAcademyTrainings() {
  const response = await apiClient.get('/academy/trainings');
  return unwrap(response);
}

export async function getAcademyTraining(trainingId) {
  const response = await apiClient.get(`/academy/trainings/${trainingId}`);
  return unwrap(response);
}

export async function createAcademyTraining(payload) {
  const response = await apiClient.post('/academy/trainings', payload);
  return unwrap(response);
}

export async function updateAcademyTraining(trainingId, payload) {
  const response = await apiClient.patch(`/academy/trainings/${trainingId}`, payload);
  return unwrap(response);
}

export async function respondAcademyAttendance(trainingId, payload) {
  const response = await apiClient.post(`/academy/trainings/${trainingId}/attendance`, payload);
  return unwrap(response);
}

export async function listAcademyAnnouncements() {
  const response = await apiClient.get('/academy/announcements');
  return unwrap(response);
}

export async function createAcademyAnnouncement(payload) {
  const response = await apiClient.post('/academy/announcements', payload);
  return unwrap(response);
}

export async function deleteAcademyAnnouncement(announcementId) {
  const response = await apiClient.delete(`/academy/announcements/${announcementId}`);
  return unwrap(response);
}

export async function listMyAcademyApplications() {
  const response = await apiClient.get('/academy/applications/mine');
  return unwrap(response);
}

export async function listAcademyApplications(params = {}) {
  const response = await apiClient.get('/academy/applications', { params });
  return unwrap(response);
}

export async function getAcademyApplication(applicationId) {
  const response = await apiClient.get(`/academy/applications/${applicationId}`);
  return unwrap(response);
}

export async function createAcademyApplication(payload) {
  const response = await apiClient.post('/academy/applications', payload);
  return unwrap(response);
}

export async function reviewAcademyApplication(applicationId, payload) {
  const response = await apiClient.patch(`/academy/applications/${applicationId}/review`, payload);
  return unwrap(response);
}

export async function searchAcademyOfficers(query) {
  const response = await apiClient.get('/academy/staff/search', {
    params: { q: query },
  });
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
