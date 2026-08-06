import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
  CreateMedicalLeaveDto,
  CreatePsychotechnicalEvaluationDto,
  SearchOccupationalHealthDto,
  UpdateMedicalLeaveDto,
  UpdatePsychotechnicalEvaluationDto,
} from './dto/occupational-health.dto';
import { MedicalLeavesService } from './medical-leaves.service';
import { OccupationalHealthService } from './occupational-health.service';
import { PsychotechnicalEvaluationsService } from './psychotechnical-evaluations.service';

@Controller('occupational-health')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class OccupationalHealthController {
  constructor(
    private readonly occupationalHealthService: OccupationalHealthService,
    private readonly psychotechnicalEvaluationsService: PsychotechnicalEvaluationsService,
    private readonly medicalLeavesService: MedicalLeavesService,
  ) {}

  @Get('dashboard')
  @Permissions('occupational-health.read')
  getDashboard() {
    return this.occupationalHealthService.getDashboard();
  }

  @Get('interop/roster')
  @Permissions('occupational-health.interop')
  listInteropRoster(@Query() query: SearchOccupationalHealthDto) {
    return this.occupationalHealthService.listInteropRoster(query);
  }

  @Get('interop/patients/:patientId')
  @Permissions('occupational-health.interop')
  async getInteropPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    const card = await this.occupationalHealthService.getInteropPatientCard(patientId);
    if (!card) {
      throw new NotFoundException('Patient was not found in the interop roster');
    }
    return card;
  }

  @Get('patients/:patientId/summary')
  @Permissions('psychotechnical-evaluations.read')
  getPatientSummary(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.occupationalHealthService.getPatientOccupationalSummary(patientId);
  }

  @Get('patients/:patientId/psychotechnical-evaluations')
  @Permissions('psychotechnical-evaluations.read')
  listPsychotechnical(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.psychotechnicalEvaluationsService.listByPatient(patientId);
  }

  @Post('psychotechnical-evaluations')
  @Permissions('psychotechnical-evaluations.create')
  createPsychotechnical(
    @Body() dto: CreatePsychotechnicalEvaluationDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.psychotechnicalEvaluationsService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch('psychotechnical-evaluations/:id')
  @Permissions('psychotechnical-evaluations.update')
  updatePsychotechnical(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePsychotechnicalEvaluationDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.psychotechnicalEvaluationsService.update(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Get('patients/:patientId/medical-leaves')
  @Permissions('medical-leaves.read')
  listMedicalLeaves(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalLeavesService.listByPatient(patientId);
  }

  @Post('medical-leaves')
  @Permissions('medical-leaves.create')
  createMedicalLeave(
    @Body() dto: CreateMedicalLeaveDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalLeavesService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Patch('medical-leaves/:id')
  @Permissions('medical-leaves.update')
  updateMedicalLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicalLeaveDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalLeavesService.update(id, dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('medical-leaves/:id/complete')
  @Permissions('medical-leaves.update')
  completeMedicalLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalLeavesService.complete(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('medical-leaves/:id/cancel')
  @Permissions('medical-leaves.update')
  cancelMedicalLeave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalLeavesService.cancel(id, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
