import { EstablishmentStatus, OccupationType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEstablishmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string;

  @IsOptional()
  @IsEnum(EstablishmentStatus)
  status?: EstablishmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultPosition?: string;

  @IsOptional()
  @IsEnum(OccupationType)
  occupationType?: OccupationType;

  @IsOptional()
  @IsBoolean()
  isSelectable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateEstablishmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @IsOptional()
  @IsEnum(EstablishmentStatus)
  status?: EstablishmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultPosition?: string;

  @IsOptional()
  @IsEnum(OccupationType)
  occupationType?: OccupationType;

  @IsOptional()
  @IsBoolean()
  isSelectable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
