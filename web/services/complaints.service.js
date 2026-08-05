import { apiClient } from './api-client.js';

export async function listComplaints() {
  const response = await apiClient.get('/complaints');
  return unwrap(response);
}

export async function getComplaint(id) {
  const response = await apiClient.get(`/complaints/${id}`);
  return unwrap(response);
}

export async function createComplaint(payload) {
  const response = await apiClient.post('/complaints', payload);
  return unwrap(response);
}

export async function searchComplaintOfficers(query) {
  const response = await apiClient.get('/complaints/staff/search', {
    params: { q: query },
  });
  return unwrap(response);
}

export async function searchInvestigators(query) {
  const response = await apiClient.get('/complaints/investigators/search', {
    params: { q: query },
  });
  return unwrap(response);
}

export async function listComplaintsByOfficer(staffId) {
  const response = await apiClient.get(`/complaints/by-officer/${staffId}`);
  return unwrap(response);
}

export async function updateComplaintStatus(id, status) {
  const response = await apiClient.patch(`/complaints/${id}/status`, { status });
  return unwrap(response);
}

export async function assignComplaintInvestigator(id, payload) {
  const response = await apiClient.post(`/complaints/${id}/assignments`, payload);
  return unwrap(response);
}

export async function sendComplaintMessage(id, body) {
  const response = await apiClient.post(`/complaints/${id}/messages`, { body });
  return unwrap(response);
}

export async function addComplaintNote(id, body) {
  const response = await apiClient.post(`/complaints/${id}/notes`, { body });
  return unwrap(response);
}

export async function addComplaintEvidence(id, payload) {
  const response = await apiClient.post(`/complaints/${id}/evidence`, payload);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
