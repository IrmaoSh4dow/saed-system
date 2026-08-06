import {
  Body,
  Controller,
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
import { AppointmentsService } from './appointments.service';
import {
  AssignAppointmentStaffDto,
  CreateAppointmentDto,
  CreateAppointmentMessageDto,
  CreateAppointmentNoteDto,
  TransferAppointmentDepartmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('staff/search')
  @Permissions('appointments.read')
  searchStaff(@Query('q') query = '') {
    return this.appointmentsService.searchStaff(query);
  }

  @Get('departments')
  @Permissions('appointments.read')
  listDepartments() {
    return this.appointmentsService.searchDepartments();
  }

  @Get()
  @Permissions('appointments.read')
  list(
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.appointmentsService.listForCharacter(character.id, character.permissions ?? []);
  }

  @Get(':id')
  @Permissions('appointments.read')
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.appointmentsService.getById(id, character.id, character.permissions ?? []);
  }

  @Post()
  @Permissions('appointments.create')
  create(
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch(':id/status')
  @Permissions('appointments.read')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: character.permissions ?? [],
    });
  }

  @Post(':id/assignments')
  @Permissions('appointments.read')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: AssignAppointmentStaffDto,
  ) {
    return this.appointmentsService.assignStaff(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: character.permissions ?? [],
    });
  }

  @Patch(':id/department')
  @Permissions('appointments.read')
  transferDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: TransferAppointmentDepartmentDto,
  ) {
    return this.appointmentsService.transferDepartment(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: character.permissions ?? [],
    });
  }

  @Post(':id/messages')
  @Permissions('appointments.read')
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAppointmentMessageDto,
  ) {
    return this.appointmentsService.addMessage(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: character.permissions ?? [],
    });
  }

  @Post(':id/notes')
  @Permissions('appointments.read')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Body() dto: CreateAppointmentNoteDto,
  ) {
    return this.appointmentsService.addInternalNote(id, dto, {
      accountId: account.id,
      characterId: character.id,
      permissions: character.permissions ?? [],
    });
  }
}
