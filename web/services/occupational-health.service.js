import { apiClient } from './api-client.js';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export async function getOccupationalHealthDashboard() {
  const response = await apiClient.get('/occupational-health/dashboard');
  return unwrap(response);
}

export async function listInteropRoster(params = {}) {
  const response = await apiClient.get('/occupational-health/interop/roster', { params });
  return unwrap(response);
}

export async function getInteropPatient(patientId) {
  const response = await apiClient.get(`/occupational-health/interop/patients/${patientId}`);
  return unwrap(response);
}

export async function createPsychotechnicalEvaluation(payload) {
  const response = await apiClient.post('/occupational-health/psychotechnical-evaluations', payload);
  return unwrap(response);
}

export async function updatePsychotechnicalEvaluation(id, payload) {
  const response = await apiClient.patch(
    `/occupational-health/psychotechnical-evaluations/${id}`,
    payload,
  );
  return unwrap(response);
}

export async function createMedicalLeave(payload) {
  const response = await apiClient.post('/occupational-health/medical-leaves', payload);
  return unwrap(response);
}

export async function updateMedicalLeave(id, payload) {
  const response = await apiClient.patch(`/occupational-health/medical-leaves/${id}`, payload);
  return unwrap(response);
}

export async function completeMedicalLeave(id) {
  const response = await apiClient.post(`/occupational-health/medical-leaves/${id}/complete`);
  return unwrap(response);
}

export async function cancelMedicalLeave(id) {
  const response = await apiClient.post(`/occupational-health/medical-leaves/${id}/cancel`);
  return unwrap(response);
}

export const PSYCHOTECHNICAL_RESULT_LABELS = {
  FIT: 'Apto',
  FIT_WITH_OBSERVATIONS: 'Apto con Observaciones',
  UNFIT: 'No Apto',
};

export const MEDICAL_LEAVE_STATUS_LABELS = {
  ACTIVE: 'Activa',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

export const PSYCHOTECHNICAL_VALIDITY_LABELS = {
  CURRENT: 'Vigente',
  EXPIRING_SOON: 'Próximo a vencer',
  EXPIRED: 'Vencido',
  NONE: 'Sin psicotécnico',
};
