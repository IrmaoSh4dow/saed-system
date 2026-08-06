import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @IsEnum(AppointmentType)
  type!: AppointmentType;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class AssignAppointmentStaffDto {
  @IsUUID()
  characterId!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;
}

export class TransferAppointmentDepartmentDto {
  @IsUUID()
  departmentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateAppointmentMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class CreateAppointmentNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
