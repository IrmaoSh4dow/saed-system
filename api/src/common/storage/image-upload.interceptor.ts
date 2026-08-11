import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_IMAGE_UPLOAD_BYTES } from './media-storage.service';
import { createUploadTempDiskStorage } from './upload-temp.storage';

/** Shared allow-list for gallery, avatars and similar institutional uploads. */
export const ALLOWED_IMAGE_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Multipart image upload interceptor (8 MB, JPEG/PNG/WebP).
 * Streams to a temp file on disk (not RAM) before MediaStorageService moves it
 * into the persistent /uploads Volume path.
 */
export function imageUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, {
    storage: createUploadTempDiskStorage(),
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
