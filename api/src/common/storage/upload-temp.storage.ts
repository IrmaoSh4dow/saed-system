import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage, StorageEngine } from 'multer';

/**
 * Temp directory for multipart uploads.
 * Kept under /uploads so it lands on the same Railway Volume as final files
 * (rename across devices fails with EXDEV).
 */
export function getUploadTempDirectory(): string {
  return join(process.cwd(), 'uploads', '.tmp');
}

export function ensureUploadTempDirectory(): string {
  const directory = getUploadTempDirectory();
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  return directory;
}

/**
 * Multer disk storage that streams uploads to disk instead of holding them in RAM.
 */
export function createUploadTempDiskStorage(): StorageEngine {
  return diskStorage({
    destination: (_request, _file, callback) => {
      try {
        callback(null, ensureUploadTempDirectory());
      } catch (error) {
        callback(error as Error, '');
      }
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname || '').toLowerCase().slice(0, 16);
      callback(null, `${randomUUID()}${extension}`);
    },
  });
}
