import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  AdminRequestPriority,
  AdminRequestStatus,
  AdminRequestType,
} from '@prisma/client';
import { MAX_IMAGE_DATA_URL_LENGTH } from '../../../common/storage/media-storage.service';

export class CreateAdminRequestDto {
  @IsEnum(AdminRequestType)
  type!: AdminRequestType;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  reason!: string;

  @IsOptional()
  @IsEnum(AdminRequestPriority)
  priority?: AdminRequestPriority;
}

export class UpdateAdminRequestStatusDto {
  @IsEnum(AdminRequestStatus)
  status!: AdminRequestStatus;
}

export class UpdateAdminRequestPriorityDto {
  @IsEnum(AdminRequestPriority)
  priority!: AdminRequestPriority;
}

export class AssignAdminRequestDto {
  @IsUUID()
  characterId!: string;
}

export class CreateAdminRequestMessageDto {
  @ValidateIf((o: CreateAdminRequestMessageDto) => !o.imageDataUrl)
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  imageDataUrl?: string;
}

export class CreateAdminRequestNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class SearchAdminRequestsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsEnum(AdminRequestStatus)
  status?: AdminRequestStatus;

  @IsOptional()
  @IsEnum(AdminRequestType)
  type?: AdminRequestType;

  @IsOptional()
  @IsEnum(AdminRequestPriority)
  priority?: AdminRequestPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
