import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ComplaintEvidenceType, ComplaintStatus } from '@prisma/client';
import { MAX_IMAGE_DATA_URL_LENGTH } from '../../../common/storage/media-storage.service';

export class CreateComplaintEvidenceDto {
  @IsEnum(ComplaintEvidenceType)
  type!: ComplaintEvidenceType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_IMAGE_DATA_URL_LENGTH)
  value!: string;
}

export class CreateComplaintDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsUUID()
  accusedStaffId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComplaintEvidenceDto)
  evidence?: CreateComplaintEvidenceDto[];
}

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;
}

export class AssignInvestigatorDto {
  @IsUUID()
  characterId!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateComplaintMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class CreateComplaintNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
