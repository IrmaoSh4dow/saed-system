import { getApiBaseUrl } from './env.js';

export function resolveUploadUrl(url) {
  if (!url) {
    return null;
  }

  if (url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }

  if (url.startsWith('/uploads/')) {
    return `${getApiBaseUrl().replace(/\/api\/v1\/?$/, '')}${url}`;
  }

  return url;
}
