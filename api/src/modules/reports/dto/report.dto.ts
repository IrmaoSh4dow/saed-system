import { Transform } from 'class-transformer';
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
  ArrayUnique,
} from 'class-validator';
import {
  ReportEvidenceType,
  ReportPriority,
  ReportStatus,
  ReportType,
} from '@prisma/client';

export class CreateReportDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsEnum(ReportType)
  type!: ReportType;

  @IsString()
  @MinLength(10)
  @MaxLength(8000)
  description!: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  leadStaffId?: string;

  /** When true, assign the creator's officer profile as lead. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  assignSelfAsLead?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  involvedOfficerIds?: string[];
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string | null;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @IsOptional()
  @IsUUID()
  leadStaffId?: string | null;
}

export class TransferReportDto {
  @IsUUID()
  toDepartmentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class AddReportParticipantDto {
  @IsUUID()
  staffProfileId!: string;
}

export class CreateReportEvidenceDto {
  @IsEnum(ReportEvidenceType)
  type!: ReportEvidenceType;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;
}

export class UploadReportEvidenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;
}
