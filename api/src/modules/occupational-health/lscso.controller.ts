import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { INSTITUTIONAL_PARTNERS } from '../../common/constants/institutional-partners';
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
import {
  CreateMedicalRecordAccessDto,
  InstitutionalFinanceQueryDto,
  ReviewMedicalRecordAccessDto,
  SearchMedicalRecordAccessDto,
} from './dto/medical-record-access.dto';
import { SearchOccupationalHealthDto } from './dto/occupational-health.dto';
import { InstitutionalPartnerService } from './institutional-partner.service';

const PARTNER = INSTITUTIONAL_PARTNERS.LSCSO.key;

/**
 * Los Santos County Sheriff's Office interoperability module.
 * Behaviour lives in InstitutionalPartnerService; this controller only declares
 * the agency routes and the permissions that guard them.
 */
@Controller('lscso')
@UseGuards(JwtAuthGuard, CharacterGuard, PermissionsGuard)
@RequireCharacter(true)
export class LscsoController {
  constructor(
    private readonly institutionalPartnerService: InstitutionalPartnerService,
  ) {}

  @Get('directory')
  @Permissions('occupational-health.interop')
  listDirectory(
    @Query() query: SearchOccupationalHealthDto,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.listDirectory(PARTNER, query, character);
  }

  @Get('agents/:patientId')
  @Permissions('occupational-health.interop')
  getAgentCard(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.getAgentCard(PARTNER, patientId, character);
  }

  @Get('agents/:patientId/clinical-record')
  @Permissions('occupational-health.interop')
  getClinicalRecord(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.getClinicalRecord(
      PARTNER,
      patientId,
      character,
    );
  }

  @Get('finance')
  @Permissions('lscso.finance.read')
  getFinance(
    @Query() query: InstitutionalFinanceQueryDto,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.getFinance(PARTNER, query, character);
  }

  @Get('dashboard')
  @Permissions('occupational-health.read')
  getDashboard() {
    return this.institutionalPartnerService.getDashboard();
  }

  @Get('access-requests')
  @Permissions('medical-record-access.read')
  listAccessRequests(
    @Query() query: SearchMedicalRecordAccessDto,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.listAccessRequests(
      PARTNER,
      query,
      character,
    );
  }

  @Post('access-requests')
  @Permissions('medical-record-access.request')
  createAccessRequest(
    @Body() dto: CreateMedicalRecordAccessDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.createAccessRequest(PARTNER, dto, {
      accountId: account.id,
      character,
    });
  }

  @Post('access-requests/:id/approve')
  @Permissions('medical-record-access.review')
  approveAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewMedicalRecordAccessDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.approveAccessRequest(
      PARTNER,
      id,
      dto.decisionNotes,
      { accountId: account.id, character },
    );
  }

  @Post('access-requests/:id/reject')
  @Permissions('medical-record-access.review')
  rejectAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewMedicalRecordAccessDto,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.rejectAccessRequest(
      PARTNER,
      id,
      dto.decisionNotes,
      { accountId: account.id, character },
    );
  }

  @Post('access-requests/:id/revoke')
  @Permissions('medical-record-access.review')
  revokeAccessRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.revokeAccessRequest(PARTNER, id, {
      accountId: account.id,
      character,
    });
  }

  @Get('authorized-reports')
  @Permissions('medical-report-access.read')
  listAuthorizedReports(@CurrentCharacter() character: IAuthCharacter) {
    return this.institutionalPartnerService.listAuthorizedReports(PARTNER, character);
  }

  @Get('authorized-reports/:grantId')
  @Permissions('medical-report-access.read')
  getAuthorizedReport(
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @CurrentAccount() account: IAuthAccount,
    @CurrentCharacter() character: IAuthCharacter,
  ) {
    return this.institutionalPartnerService.getAuthorizedReport(PARTNER, grantId, {
      accountId: account.id,
      character,
    });
  }
}
