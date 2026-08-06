import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ClockInShiftDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
}

export class ClockOutShiftDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;
}
