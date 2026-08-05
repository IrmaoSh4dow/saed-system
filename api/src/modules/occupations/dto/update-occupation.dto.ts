import { OccupationType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateOccupationDto {
  @IsOptional()
  @IsEnum(OccupationType)
  type?: OccupationType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string | null;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startedAt?: string | null;

  @IsOptional()
  @IsDateString()
  endedAt?: string | null;
}
