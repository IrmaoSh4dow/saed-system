import { RegulationDocumentStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRegulationCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateRegulationCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRegulationDocumentDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500000)
  contentHtml!: string;

  @IsOptional()
  @IsEnum(RegulationDocumentStatus)
  status?: RegulationDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;
}

export class UpdateRegulationDocumentDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500000)
  contentHtml?: string;

  @IsOptional()
  @IsEnum(RegulationDocumentStatus)
  status?: RegulationDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;
}

export class SearchRegulationsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(RegulationDocumentStatus)
  status?: RegulationDocumentStatus;
}
