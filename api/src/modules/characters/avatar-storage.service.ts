import { Injectable } from '@nestjs/common';
import { MediaStorageService } from '../../common/storage/media-storage.service';

@Injectable()
export class AvatarStorageService {
  constructor(private readonly mediaStorageService: MediaStorageService) {}

  /**
   * Persists a multipart avatar under /uploads/avatars and returns the public path.
   */
  saveAvatar(
    file: Express.Multer.File,
    characterId: string,
  ): string {
    return this.mediaStorageService.saveUploadedImage(file, 'avatars', characterId);
  }
}
