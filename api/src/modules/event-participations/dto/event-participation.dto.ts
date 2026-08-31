import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class EventParticipantDto {
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsUUID()
  characterId?: string;
}

export class CreateEventParticipationDto {
  @IsDateString()
  eventDate!: string;

  @IsString()
  @MaxLength(240)
  organizers!: string;

  @IsString()
  @MaxLength(160)
  payerFullName!: string;

  @IsString()
  @MaxLength(160)
  authorizingOfficerName!: string;

  @IsString()
  @MaxLength(160)
  saedLeadName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => EventParticipantDto)
  participants!: EventParticipantDto[];
}

export class SearchEventParticipationsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
