import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LinkPatientCharacterDto {
  @IsUUID()
  characterId!: string;
}

export class CreatePatientInvoiceDto {
  @IsUUID()
  treatmentId!: string;

  @IsDateString()
  issuedAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
