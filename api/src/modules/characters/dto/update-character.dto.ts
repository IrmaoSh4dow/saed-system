import { CharacterSex, CharacterStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCharacterDto {
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
  rankId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fivemCitizenId?: string | null;

  @IsOptional()
  @IsEnum(CharacterStatus)
  status?: CharacterStatus;
}
