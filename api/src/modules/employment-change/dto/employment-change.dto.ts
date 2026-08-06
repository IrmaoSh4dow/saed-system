import { EmploymentChangeRequestStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEmploymentChangeRequestDto {
  @IsUUID()
  requestedEstablishmentId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  reason!: string;
}

export class ReviewEmploymentChangeRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(1000)
  rejectionReason?: string;
}

export class SearchEmploymentChangeRequestDto {
  @IsOptional()
  @IsEnum(EmploymentChangeRequestStatus)
  status?: EmploymentChangeRequestStatus;

  @IsOptional()
  @IsUUID()
  characterId?: string;

  @IsOptional()
  @IsUUID()
  requestedEstablishmentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  q?: string;
}

export class AdminApplyEmploymentDto {
  @IsUUID()
  establishmentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
