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

export class CreateOccupationDto {
  @IsEnum(OccupationType)
  type!: OccupationType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organization!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
