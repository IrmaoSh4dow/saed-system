import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateStaffIdentityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  employeeNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  @MaxLength(32)
  callsign?: string | null;
}
