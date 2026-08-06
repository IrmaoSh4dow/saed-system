import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { IAuthAccount, IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import {
  CreatePatientInvoiceDto,
  LinkPatientCharacterDto,
} from './dto/patient-invoice.dto';
import { CreatePatientDto, SearchPatientsDto, UpdatePatientDto } from './dto/patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Permissions('patients.read')
  list(@Query() query: SearchPatientsDto) {
    return this.patientsService.list(query);
  }

  @Get('search')
  @Permissions('patients.read')
  search(@Query() query: SearchPatientsDto) {
    return this.patientsService.search(query);
  }

  @Get('treatments')
  @Permissions('patients.read')
  listTreatments() {
    return this.patientsService.listTreatments();
  }

  @Get('characters/search')
  @Permissions('patients.update')
  searchCharacters(@Query('q') query = '') {
    return this.patientsService.searchLinkableCharacters(query);
  }

  @Get(':id')
  @Permissions('patients.read')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getById(id);
  }

  @Get(':id/invoices')
  @Permissions('patients.read')
  listInvoices(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.listInvoices(id);
  }

  @Post()
  @Permissions('patients.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id')
  @Permissions('patients.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post(':id/link')
  @Permissions('patients.update')
  linkCharacter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: LinkPatientCharacterDto,
  ) {
    return this.patientsService.linkCharacter(id, dto, {
      characterId: character.id,
    });
  }

  @Delete(':id/link')
  @Permissions('patients.update')
  unlinkCharacter(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.patientsService.unlinkCharacter(id, {
      characterId: character.id,
    });
  }

  @Post(':id/invoices')
  @Permissions('patients.update')
  createInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreatePatientInvoiceDto,
  ) {
    return this.patientsService.createInvoice(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Delete(':id/invoices/:invoiceId')
  @Permissions('patients.update')
  deleteInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ) {
    return this.patientsService.deleteInvoice(id, invoiceId);
  }
}
