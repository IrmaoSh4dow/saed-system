import { apiClient } from './api-client.js';

export async function listActiveGallery() {
  const response = await apiClient.get('/gallery/active');
  return unwrap(response);
}

export async function listGalleryItems() {
  const response = await apiClient.get('/gallery');
  return unwrap(response);
}

/** Multipart upload — never Base64. Max 8 MB (JPEG/PNG/WebP). */
export async function uploadGalleryItem({ file, title, description, status }) {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);
  if (status) formData.append('status', status);

  const response = await apiClient.post('/gallery/upload', formData, {
    timeout: 60000,
  });
  return unwrap(response);
}

export async function updateGalleryItem(id, payload) {
  const response = await apiClient.patch(`/gallery/${id}`, payload);
  return unwrap(response);
}

export async function reorderGalleryItems(items) {
  const response = await apiClient.patch('/gallery/reorder', { items });
  return unwrap(response);
}

export async function deleteGalleryItem(id) {
  const response = await apiClient.delete(`/gallery/${id}`);
  return unwrap(response);
}

function unwrap(response) {
  return response.data?.data ?? response.data;
}
