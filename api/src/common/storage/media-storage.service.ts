import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { extname, join } from 'path';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_DOCUMENT_MIME = new Set([
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

/** Global max size for all image uploads (multipart and data-URL), 8 MB. */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Max size for institutional document attachments (PDF/DOC/images), 15 MB. */
export const MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * Max length for Base64 data-URL fields in DTOs (~8 MB decoded + prefix).
 */
export const MAX_IMAGE_DATA_URL_LENGTH = 12_500_000;

/** @deprecated Use MAX_IMAGE_UPLOAD_BYTES */
export const MAX_LICENSE_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES;

/** @deprecated Use MAX_IMAGE_UPLOAD_BYTES */
export const MAX_NEWS_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES;

type UploadedFileInput = {
  buffer?: Buffer;
  path?: string;
  mimetype: string;
  originalname?: string;
  size?: number;
};

@Injectable()
export class MediaStorageService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Persists a multipart-uploaded image under /uploads/{folder}/...
   * Prefers disk temp paths (streamed by multer) over in-memory buffers.
   * Returns the public path only (never the binary payload).
   */
  saveUploadedImage(
    file: UploadedFileInput,
    folder: string,
    entityId?: string,
  ): string {
    const mime = (file?.mimetype || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      this.cleanupTempFile(file?.path);
      throw new BadRequestException('Solo se permiten imágenes JPG, JPEG, PNG, WebP o GIF');
    }

    if (file?.path) {
      return this.persistTempFile(file.path, mime, folder, entityId, file.originalname, {
        maxBytes: MAX_IMAGE_UPLOAD_BYTES,
        maxBytesMessage: 'El tamaño máximo permitido es de 8 MB.',
      }).fileUrl;
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty upload');
    }

    const size = file.size ?? file.buffer.byteLength;
    if (size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException('El tamaño máximo permitido es de 8 MB.');
    }

    return this.writeBuffer(file.buffer, mime, folder, entityId);
  }

  /**
   * Persists a multipart document/image under /uploads/{folder}/...
   * Supports PDF and common office formats used by institutional regulations.
   */
  saveUploadedDocument(
    file: UploadedFileInput,
    folder: string,
    entityId?: string,
  ): { fileUrl: string; mimeType: string; sizeBytes: number; fileName: string } {
    const mime = (file?.mimetype || '').toLowerCase();
    if (!ALLOWED_DOCUMENT_MIME.has(mime)) {
      this.cleanupTempFile(file?.path);
      throw new BadRequestException(
        'Solo se permiten PDF, imágenes o documentos Office (DOC/DOCX/XLS/XLSX/TXT)',
      );
    }

    const originalName = (file.originalname || 'documento').slice(0, 180);

    if (file?.path) {
      const stored = this.persistTempFile(
        file.path,
        mime,
        folder,
        entityId,
        file.originalname,
        {
          maxBytes: MAX_DOCUMENT_UPLOAD_BYTES,
          maxBytesMessage: 'El tamaño máximo permitido es de 15 MB.',
        },
      );
      return {
        fileUrl: stored.fileUrl,
        mimeType: mime,
        sizeBytes: file.size ?? stored.sizeBytes,
        fileName: originalName,
      };
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty upload');
    }

    const size = file.size ?? file.buffer.byteLength;
    if (size > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new BadRequestException('El tamaño máximo permitido es de 15 MB.');
    }

    const fileUrl = this.writeBuffer(file.buffer, mime, folder, entityId, file.originalname);
    return {
      fileUrl,
      mimeType: mime,
      sizeBytes: size,
      fileName: originalName,
    };
  }

  /**
   * Persists data-URL images under /uploads/{folder}/...
   * External http(s) or existing /uploads/ paths are kept as-is.
   * Prefer multipart uploads for large images — JSON body limits reject big Base64 payloads.
   */
  async resolveImageUrl(
    input: string | null | undefined,
    folder: string,
    entityId?: string,
    options?: { maxBytes?: number },
  ): Promise<string | null> {
    if (!input) {
      return null;
    }

    const trimmed = input.trim();

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/uploads/')
    ) {
      return trimmed.slice(0, 2048);
    }

    if (!trimmed.startsWith('data:image/')) {
      return null;
    }

    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(trimmed);
    if (!match) {
      return null;
    }

    const mime = match[1].toLowerCase();
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      return null;
    }

    const buffer = Buffer.from(match[2], 'base64');
    const maxBytes = options?.maxBytes ?? MAX_IMAGE_UPLOAD_BYTES;

    if (buffer.byteLength > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      throw new BadRequestException(
        `El tamaño máximo permitido es de ${maxMb} MB.`,
      );
    }

    void this.configService;
    return this.writeBuffer(buffer, mime, folder, entityId);
  }

  /**
   * Moves a multer temp file into the persistent Volume folder without loading it into RAM.
   */
  private persistTempFile(
    tempPath: string,
    mime: string,
    folder: string,
    entityId: string | undefined,
    originalName: string | undefined,
    limits: { maxBytes: number; maxBytesMessage: string },
  ): { fileUrl: string; sizeBytes: number } {
    if (!existsSync(tempPath)) {
      throw new BadRequestException('Empty upload');
    }

    let sizeBytes = 0;
    try {
      sizeBytes = statSync(tempPath).size;
    } catch {
      throw new BadRequestException('Empty upload');
    }

    if (sizeBytes <= 0) {
      this.cleanupTempFile(tempPath);
      throw new BadRequestException('Empty upload');
    }

    if (sizeBytes > limits.maxBytes) {
      this.cleanupTempFile(tempPath);
      throw new BadRequestException(limits.maxBytesMessage);
    }

    const uploadRoot = join(process.cwd(), 'uploads', folder);
    if (!existsSync(uploadRoot)) {
      mkdirSync(uploadRoot, { recursive: true });
    }

    const extension =
      mimeToExtension(mime) ||
      (originalName ? extname(originalName).toLowerCase() : '') ||
      '.bin';
    const hash = hashFileSha1Prefix(tempPath);
    const fileName = `${entityId ?? randomUUID()}-${hash}${extension}`;
    const destination = join(uploadRoot, fileName);

    try {
      renameSync(tempPath, destination);
    } catch {
      this.cleanupTempFile(tempPath);
      throw new BadRequestException('No se pudo guardar el archivo subido');
    }

    return {
      fileUrl: `/uploads/${folder}/${fileName}`,
      sizeBytes,
    };
  }

  private writeBuffer(
    buffer: Buffer,
    mime: string,
    folder: string,
    entityId?: string,
    originalName?: string,
  ): string {
    const uploadRoot = join(process.cwd(), 'uploads', folder);
    if (!existsSync(uploadRoot)) {
      mkdirSync(uploadRoot, { recursive: true });
    }

    const extension =
      mimeToExtension(mime) ||
      (originalName ? extname(originalName).toLowerCase() : '') ||
      '.bin';
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const fileName = `${entityId ?? randomUUID()}-${hash}${extension}`;
    writeFileSync(join(uploadRoot, fileName), buffer);

    return `/uploads/${folder}/${fileName}`;
  }

  private cleanupTempFile(tempPath?: string): void {
    if (!tempPath) {
      return;
    }
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch {
      // Best-effort cleanup; temp dir is outside the public volume path.
    }
  }
}

function hashFileSha1Prefix(filePath: string): string {
  const hash = createHash('sha1');
  const fileDescriptor = openSync(filePath, 'r');
  const chunk = Buffer.alloc(64 * 1024);

  try {
    let bytesRead = 0;
    while ((bytesRead = readSync(fileDescriptor, chunk, 0, chunk.length, null)) > 0) {
      hash.update(chunk.subarray(0, bytesRead));
    }
  } finally {
    closeSync(fileDescriptor);
  }

  return hash.digest('hex').slice(0, 12);
}

function mimeToExtension(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    case 'application/vnd.ms-excel':
      return '.xls';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '.xlsx';
    case 'text/plain':
      return '.txt';
    default:
      return '';
  }
}
