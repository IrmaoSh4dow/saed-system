import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsUUID()
  characterId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  employeeNumber!: string;

  @IsUUID()
  rankId!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  callsign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  roleSlug?: string;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;
}
