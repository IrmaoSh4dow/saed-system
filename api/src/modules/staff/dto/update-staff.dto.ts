import { StaffStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsUUID()
  rankId?: string;

  /** Pass null (or empty string) to clear the department assignment. */
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  departmentId?: string | null;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;
}
