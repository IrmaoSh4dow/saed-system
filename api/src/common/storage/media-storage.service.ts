import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Global max size for all image uploads (multipart and data-URL), 8 MB. */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Max length for Base64 data-URL fields in DTOs (~8 MB decoded + prefix).
 */
export const MAX_IMAGE_DATA_URL_LENGTH = 12_500_000;

/** @deprecated Use MAX_IMAGE_UPLOAD_BYTES */
export const MAX_LICENSE_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES;

/** @deprecated Use MAX_IMAGE_UPLOAD_BYTES */
export const MAX_NEWS_IMAGE_BYTES = MAX_IMAGE_UPLOAD_BYTES;

@Injectable()
export class MediaStorageService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Persists a multipart-uploaded image under /uploads/{folder}/...
   * Returns the public path only (never the binary payload).
   */
  saveUploadedImage(
    file: { buffer: Buffer; mimetype: string; originalname?: string; size?: number },
    folder: string,
    entityId?: string,
  ): string {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty upload');
    }

    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, JPEG, PNG, WebP o GIF');
    }

    const size = file.size ?? file.buffer.byteLength;
    if (size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException('El tamaño máximo permitido es de 8 MB.');
    }

    return this.writeBuffer(file.buffer, mime, folder, entityId);
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

  private writeBuffer(
    buffer: Buffer,
    mime: string,
    folder: string,
    entityId?: string,
  ): string {
    const uploadRoot = join(process.cwd(), 'uploads', folder);
    if (!existsSync(uploadRoot)) {
      mkdirSync(uploadRoot, { recursive: true });
    }

    const extension = mimeToExtension(mime);
    const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const fileName = `${entityId ?? randomUUID()}-${hash}${extension}`;
    writeFileSync(join(uploadRoot, fileName), buffer);

    return `/uploads/${folder}/${fileName}`;
  }
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
    default:
      return extname(mime) || '.bin';
  }
}
