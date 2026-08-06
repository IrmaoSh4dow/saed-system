import { MedicalReportAccessGrantStatus, MedicalReportAccessReason } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TEMPORARY_ACCESS_CONFIG } from '../../../common/temporary-access/temporary-access.config';

export class GrantMedicalReportAccessDto {
  @IsUUID()
  reportId!: string;

  @IsUUID()
  recipientCharacterId!: string;

  @IsEnum(MedicalReportAccessReason)
  reason!: MedicalReportAccessReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonNotes?: string;

  /** Hours of access. Defaults to configured institutional duration. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TEMPORARY_ACCESS_CONFIG.MAX_DURATION_HOURS)
  durationHours?: number;
}

export class SearchMedicalReportAccessDto {
  @IsOptional()
  @IsUUID()
  reportId?: string;

  @IsOptional()
  @IsUUID()
  recipientCharacterId?: string;

  @IsOptional()
  @IsUUID()
  grantedByCharacterId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsEnum(MedicalReportAccessGrantStatus)
  status?: MedicalReportAccessGrantStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  organization?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  q?: string;
}
