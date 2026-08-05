import { apiClient } from './api-client.js';

export async function listPublishedNews() {
  const response = await apiClient.get('/news/published');
  return unwrap(response);
}

export async function getPublishedNewsArticle(id) {
  const response = await apiClient.get(`/news/published/${id}`);
  return unwrap(response);
}

export async function listNewsArticles() {
  const response = await apiClient.get('/news');
  return unwrap(response);
}

export async function createNewsArticle(payload) {
  const response = await apiClient.post('/news', payload);
  return unwrap(response);
}

export async function updateNewsArticle(id, payload) {
  const response = await apiClient.patch(`/news/${id}`, payload);
  return unwrap(response);
}

export async function deleteNewsArticle(id) {
  const response = await apiClient.delete(`/news/${id}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
