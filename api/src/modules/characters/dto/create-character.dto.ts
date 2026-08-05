import { CharacterSex } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

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

  /** Civilian workplace name (never SAED). */
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organization!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fivemCitizenId?: string;
}
