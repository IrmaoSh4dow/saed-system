import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './media-storage.service';

export const ALLOWED_DOCUMENT_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export function documentUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, {
    storage: memoryStorage(),
    limits: { fileSize: MAX_DOCUMENT_UPLOAD_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => {
      const mime = (file.mimetype || '').toLowerCase();
      if (!ALLOWED_DOCUMENT_UPLOAD_MIME.has(mime)) {
        callback(
          new BadRequestException(
            'Solo se permiten PDF, imágenes o documentos Office (DOC/DOCX/XLS/XLSX/TXT)',
          ) as never,
          false,
        );
        return;
      }
      callback(null, true);
    },
  });
}
