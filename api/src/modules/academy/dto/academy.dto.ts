import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';
import {
  AcademyAnnouncementPriority,
  AcademyApplicationStatus,
  AcademyApplicationType,
  AcademyAttendanceStatus,
  AcademyTrainingStatus,
} from '@prisma/client';

export class CreateAcademyTrainingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(8000)
  description!: string;

  @IsUUID()
  instructorCharacterId!: string;

  @IsDateString()
  startsAt!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  location!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  capacity?: number;

  @IsOptional()
  @IsEnum(AcademyTrainingStatus)
  status?: AcademyTrainingStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  supportOfficerIds?: string[];
}

export class UpdateAcademyTrainingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsUUID()
  instructorCharacterId?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  capacity?: number | null;

  @IsOptional()
  @IsEnum(AcademyTrainingStatus)
  status?: AcademyTrainingStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  supportOfficerIds?: string[];
}

export class RespondTrainingAttendanceDto {
  @IsEnum(AcademyAttendanceStatus)
  status!: AcademyAttendanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateAcademyAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(8000)
  content!: string;

  @IsOptional()
  @IsEnum(AcademyAnnouncementPriority)
  priority?: AcademyAnnouncementPriority;
}

export class UpdateAcademyAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsEnum(AcademyAnnouncementPriority)
  priority?: AcademyAnnouncementPriority;
}

export class CreateAcademyApplicationDto {
  @IsEnum(AcademyApplicationType)
  type!: AcademyApplicationType;

  @IsObject()
  formData!: Record<string, unknown>;
}

export class ReviewAcademyApplicationDto {
  @IsEnum(AcademyApplicationStatus)
  status!: AcademyApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNotes?: string;

  /** Optional badge override when accepting academy applications. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  employeeNumber?: string;

  /** Optional rank override (defaults to Cadete / provided transfer rank). */
  @IsOptional()
  @IsUUID()
  rankId?: string;

  @ValidateIf((dto: ReviewAcademyApplicationDto) => dto.status === AcademyApplicationStatus.ACCEPTED)
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
