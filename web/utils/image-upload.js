/** Shared client-side image upload rules (matches API MediaStorage / Multer). */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

/** @deprecated Use MAX_IMAGE_UPLOAD_BYTES */
export const MAX_LICENSE_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES;

/** @deprecated Use MAX_IMAGE_UPLOAD_BYTES */
export const MAX_NEWS_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES;

export const ALLOWED_IMAGE_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * @param {File | null | undefined} file
 * @param {{ required?: boolean, maxBytes?: number, allowGif?: boolean }} [options]
 * @returns {{ ok: true, file: File | null } | { ok: false, message: string }}
 */
export function validateImageUploadFile(
  file,
  { required = false, maxBytes = MAX_IMAGE_UPLOAD_BYTES, allowGif = false } = {},
) {
  if (!file) {
    if (required) {
      return { ok: false, message: 'Selecciona una imagen.' };
    }
    return { ok: true, file: null };
  }

  const allowed = allowGif
    ? new Set([...ALLOWED_IMAGE_UPLOAD_TYPES, 'image/gif'])
    : ALLOWED_IMAGE_UPLOAD_TYPES;

  if (!allowed.has(file.type)) {
    return {
      ok: false,
      message: allowGif
        ? 'Solo se permiten imágenes JPG, JPEG, PNG, WebP o GIF.'
        : 'Solo se permiten imágenes JPG, JPEG, PNG o WebP.',
    };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      message: `El tamaño máximo permitido es de ${maxMb} MB.`,
    };
  }

  return { ok: true, file };
}
