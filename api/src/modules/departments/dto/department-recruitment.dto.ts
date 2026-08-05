import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AssignSupervisorDto {
  @IsUUID()
  staffProfileId!: string;
}

export class CreateOpeningDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @IsUUID()
  minRankId?: string;
}

export class UpdateOpeningDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsUUID()
  minRankId?: string | null;

  @IsOptional()
  @IsString()
  status?: 'OPEN' | 'CLOSED' | 'COMPLETED';
}

export class CreateInterestLetterDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  motivation!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  experience!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  additionalInfo?: string;
}

export class ReviewInterestLetterDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}
