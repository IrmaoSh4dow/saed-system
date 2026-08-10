import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateStaffRatingDto {
  @ValidateIf((dto: CreateStaffRatingDto) => !dto.appointmentId)
  @IsUUID()
  adminRequestId?: string;

  @ValidateIf((dto: CreateStaffRatingDto) => !dto.adminRequestId)
  @IsUUID()
  appointmentId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment?: string;
}

export class StaffRatingsQueryDto {
  @IsOptional()
  @IsUUID()
  staffProfileId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
