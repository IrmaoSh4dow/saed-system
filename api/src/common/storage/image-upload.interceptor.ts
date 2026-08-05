import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_IMAGE_UPLOAD_BYTES } from '../storage/media-storage.service';

/** Shared allow-list for gallery, avatars and similar institutional uploads. */
export const ALLOWED_IMAGE_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Multipart image upload interceptor (8 MB, JPEG/PNG/WebP).
 * Shared by gallery, character avatars, and other image uploads.
 */
export function imageUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => {
      const mime = (file.mimetype || '').toLowerCase();
      if (!ALLOWED_IMAGE_UPLOAD_MIME.has(mime)) {
        callback(
          new BadRequestException(
            'Solo se permiten imágenes JPG, JPEG, PNG o WebP',
          ) as never,
          false,
        );
        return;
      }
      callback(null, true);
    },
  });
}

export { MAX_IMAGE_UPLOAD_BYTES };

/** @deprecated Use ALLOWED_IMAGE_UPLOAD_MIME */
export const ALLOWED_GALLERY_MIME = ALLOWED_IMAGE_UPLOAD_MIME;
