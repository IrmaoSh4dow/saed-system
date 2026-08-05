import { CharacterSex } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * Self-service profile update for the account's active character.
 * Administrative fields (status, rank, fivemCitizenId) are intentionally excluded.
 */
export class UpdateMyCharacterDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsEnum(CharacterSex)
  sex?: CharacterSex;

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
  @MaxLength(2000)
  biography?: string | null;

  /**
   * Civilian workplace name or slug. Ignored / rejected for SAED members.
   * Use "Sin empleo" / "unemployed" to clear employment.
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organization?: string | null;
}
