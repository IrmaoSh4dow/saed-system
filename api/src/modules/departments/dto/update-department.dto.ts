import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_IMAGE_DATA_URL_LENGTH } from '../../../common/storage/media-storage.service';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
