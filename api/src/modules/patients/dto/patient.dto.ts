import { BloodType, CharacterSex, PatientStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  middleName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(CharacterSex)
  sex?: CharacterSex;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  identityDocument?: string;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  allergies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  establishmentId?: string | null;

  /** Institutional badge. Only allowed when the establishment is a partner agency. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, {
    message: 'badgeNumber must look like 1A-12, 3B-45 or ADAM-21',
  })
  badgeNumber?: string | null;

  @IsOptional()
  @IsUUID()
  linkedCharacterId?: string;

  /**
   * Required only when the service returns confidence "likely"
   * and staff confirms they reviewed possible matches.
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  forceCreate?: boolean;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  middleName?: string | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsEnum(CharacterSex)
  sex?: CharacterSex | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationality?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  identityDocument?: string | null;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  allergies?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  chronicConditions?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  emergencyContactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  establishmentId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, {
    message: 'badgeNumber must look like 1A-12, 3B-45 or ADAM-21',
  })
  badgeNumber?: string | null;

  @IsOptional()
  @IsUUID()
  linkedCharacterId?: string | null;
}

export class SearchPatientsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  identityDocument?: string;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}
