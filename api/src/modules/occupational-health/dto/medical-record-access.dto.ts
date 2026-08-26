import { MedicalRecordAccessStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMedicalRecordAccessDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  reason!: string;
}

export class ReviewMedicalRecordAccessDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decisionNotes?: string;
}

export class SearchMedicalRecordAccessDto {
  @IsOptional()
  @IsEnum(MedicalRecordAccessStatus)
  status?: MedicalRecordAccessStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class InstitutionalFinanceQueryDto {
  @IsOptional()
  @IsString()
  partner?: string;

  @IsOptional()
  @IsString()
  days?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
