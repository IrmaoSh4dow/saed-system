import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CurrentCharacter } from '../../common/decorators/current-character.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequireCharacter } from '../../common/decorators/require-character.decorator';
import { CharacterGuard } from '../../common/guards/character.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type {
  IAuthAccount,
  IAuthCharacter,
} from '../auth/interfaces/i-auth-request.interface';
import { PatientsService } from '../patients/patients.service';
import { MedicalReportAccessService } from '../medical-report-access/medical-report-access.service';
import {
  CreateMedicalRecordAccessDto,
  LspdFinanceQueryDto,
  ReviewMedicalRecordAccessDto,
  SearchMedicalRecordAccessDto,
} from './dto/medical-record-access.dto';
import { MedicalRecordAccessService } from './medical-record-access.service';
import { OccupationalHealthService } from './occupational-health.service';
import { SearchOccupationalHealthDto } from './dto/occupational-health.dto';

@Controller('lspd')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class LspdController {
  constructor(
    private readonly occupationalHealthService: OccupationalHealthService,
    private readonly medicalRecordAccessService: MedicalRecordAccessService,
    private readonly medicalReportAccessService: MedicalReportAccessService,
    private readonly patientsService: PatientsService,
  ) {}

  @Get('directory')
  @Permissions('occupational-health.interop')
  listDirectory(@Query() query: SearchOccupationalHealthDto) {
    return this.occupationalHealthService.listInteropRoster({
      ...query,
      partner: query.partner ?? 'LSPD',
    });
  }

  @Get('agents/:patientId')
  @Permissions('occupational-health.interop')
  async getAgentCard(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    const card = await this.occupationalHealthService.getInteropPatientCard(patientId);
    if (!card) {
      throw new NotFoundException('Agent was not found in the LSPD directory');
    }

    const grant = await this.medicalRecordAccessService.hasActiveAccess(
      patientId,
      character.id,
    );

    return {
      ...card,
      access: grant
        ? {
            requestId: grant.id,
            status: grant.status,
            expiresAt: grant.expiresAt?.toISOString() ?? null,
            isActive: true,
          }
        : { requestId: null, status: null, expiresAt: null, isActive: false },
    };
  }

  @Get('agents/:patientId/clinical-record')
  @Permissions('occupational-health.interop')
  async getClinicalRecord(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    const grant = await this.medicalRecordAccessService.hasActiveAccess(
      patientId,
      character.id,
    );
    if (!grant) {
      throw new ForbiddenException(
        'No active medical-record access grant. Request authorization from SAED High Command.',
      );
    }

    const card = await this.occupationalHealthService.getInteropPatientCard(patientId);
    if (!card) {
      throw new NotFoundException('Agent was not found in the LSPD directory');
    }

    const clinical = await this.patientsService.getById(patientId);
    return {
      access: {
        requestId: grant.id,
        expiresAt: grant.expiresAt?.toISOString() ?? null,
        approvedAt: grant.approvedAt?.toISOString() ?? null,
      },
      clinical,
    };
  }

  @Get('finance')
  @Permissions('lspd.finance.read')
  getFinance(@Query() query: LspdFinanceQueryDto) {
    return this.occupationalHealthService.getInstitutionalFinance({
      partner: query.partner ?? 'LSPD',
      days: query.days ? Number(query.days) : undefined,
      from: query.from,
      to: query.to,
    });
  }

  @Get('dashboard')
  @Permissions('occupational-health.read')
  getDashboard() {
    return this.occupationalHealthService.getDashboard();
  }

  @Get('access-requests')
  @Permissions('medical-record-access.read')
  listAccessRequests(
    @Query() query: SearchMedicalRecordAccessDto,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.medicalRecordAccessService.list(
      {
        characterId: character.id,
        permissions: request.user?.permissions ?? [],
      },
      query,
    );
  }

  @Post('access-requests')
  @Permissions('medical-record-access.request')
  createAccessRequest(
    @Body() dto: CreateMedicalRecordAccessDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalRecordAccessService.create(dto, {
      accountId: account.id,
      characterId: character.id,
    });
  }

  @Post('access-requests/:id/approve')
  @Permissions('medical-record-access.review')
  approveAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewMedicalRecordAccessDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.medicalRecordAccessService.approve(
      id,
      {
        accountId: account.id,
        characterId: character.id,
        permissions: request.user?.permissions ?? [],
      },
      dto.decisionNotes,
    );
  }

  @Post('access-requests/:id/reject')
  @Permissions('medical-record-access.review')
  rejectAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewMedicalRecordAccessDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.medicalRecordAccessService.reject(
      id,
      {
        accountId: account.id,
        characterId: character.id,
        permissions: request.user?.permissions ?? [],
      },
      dto.decisionNotes,
    );
  }

  @Post('access-requests/:id/revoke')
  @Permissions('medical-record-access.review')
  revokeAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    return this.medicalRecordAccessService.revoke(id, {
      accountId: account.id,
      characterId: character.id,
      permissions: request.user?.permissions ?? [],
    });
  }

  @Get('authorized-reports')
  @Permissions('medical-report-access.read')
  listAuthorizedReports(@CurrentCharacter() character: IAuthCharacter) {
    return this.medicalReportAccessService.listAuthorizedForRecipient(character.id);
  }

  @Get('authorized-reports/:grantId')
  @Permissions('medical-report-access.read')
  getAuthorizedReport(
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.medicalReportAccessService.getAuthorizedReport(grantId, {
      accountId: account.id,
      characterId: character.id,
    });
  }
}
