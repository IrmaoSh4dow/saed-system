import { MedicalLeaveStatus, PsychotechnicalResult } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePsychotechnicalEvaluationDto {
  @IsUUID()
  patientId!: string;

  @IsEnum(PsychotechnicalResult)
  result!: PsychotechnicalResult;

  @IsDateString()
  issuedAt!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string;

  @IsOptional()
  @IsUUID()
  physicianCharacterId?: string;
}

export class UpdatePsychotechnicalEvaluationDto {
  @IsOptional()
  @IsEnum(PsychotechnicalResult)
  result?: PsychotechnicalResult;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string | null;

  @IsOptional()
  @IsUUID()
  physicianCharacterId?: string | null;
}

export class CreateMedicalLeaveDto {
  @IsUUID()
  patientId!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsEnum(MedicalLeaveStatus)
  status?: MedicalLeaveStatus;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string;

  @IsOptional()
  @IsUUID()
  physicianCharacterId?: string;
}

export class UpdateMedicalLeaveDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsEnum(MedicalLeaveStatus)
  status?: MedicalLeaveStatus;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string | null;

  @IsOptional()
  @IsUUID()
  physicianCharacterId?: string | null;
}

export class SearchOccupationalHealthDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  partner?: string;
}
