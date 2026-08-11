import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage, StorageEngine } from 'multer';

/**
 * Temp directory for multipart uploads (outside /uploads so Express static never serves them).
 * Files are moved into the Railway Volume path by MediaStorageService.
 */
export function getUploadTempDirectory(): string {
  return join(process.cwd(), '.upload-tmp');
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
      callback(null, ensureUploadTempDirectory());
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname || '').toLowerCase().slice(0, 16);
      callback(null, `${randomUUID()}${extension}`);
    },
  });
}
