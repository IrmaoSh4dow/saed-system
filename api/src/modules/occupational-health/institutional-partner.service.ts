import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  canAccessPartner,
  getInstitutionalPartner,
  type InstitutionalPartnerKey,
} from '../../common/constants/institutional-partners';
import type { IAuthCharacter } from '../auth/interfaces/i-auth-request.interface';
import { MedicalReportAccessService } from '../medical-report-access/medical-report-access.service';
import { PatientsService } from '../patients/patients.service';
import {
  CreateMedicalRecordAccessDto,
  InstitutionalFinanceQueryDto,
  SearchMedicalRecordAccessDto,
} from './dto/medical-record-access.dto';
import { SearchOccupationalHealthDto } from './dto/occupational-health.dto';
import { MedicalRecordAccessService } from './medical-record-access.service';
import { OccupationalHealthService } from './occupational-health.service';

interface IActor {
  accountId: string;
  character: IAuthCharacter;
}

/**
 * Single implementation of the institutional interoperability module (directory,
 * clinical access, authorized reports and billing). Each agency exposes it under
 * its own route so LSPD and LSCSO share behaviour without sharing data.
 */
@Injectable()
export class InstitutionalPartnerService {
  constructor(
    private readonly occupationalHealthService: OccupationalHealthService,
    private readonly medicalRecordAccessService: MedicalRecordAccessService,
    private readonly medicalReportAccessService: MedicalReportAccessService,
    private readonly patientsService: PatientsService,
  ) {}

  /**
   * A character may only reach the module of its own agency. SAED High Command
   * oversees every agency.
   */
  private assertAccess(partnerKey: InstitutionalPartnerKey, character: IAuthCharacter) {
    if (
      !canAccessPartner(partnerKey, {
        roles: character.roles,
        permissions: character.permissions,
      })
    ) {
      throw new ForbiddenException(
        `You do not have access to the ${getInstitutionalPartner(partnerKey).name} module`,
      );
    }
  }

  listDirectory(
    partnerKey: InstitutionalPartnerKey,
    query: SearchOccupationalHealthDto,
    character: IAuthCharacter,
  ) {
    this.assertAccess(partnerKey, character);
    return this.occupationalHealthService.listInteropRoster({
      ...query,
      partner: partnerKey,
    });
  }

  async getAgentCard(
    partnerKey: InstitutionalPartnerKey,
    patientId: string,
    character: IAuthCharacter,
  ) {
    this.assertAccess(partnerKey, character);
    const card = await this.requireAgent(partnerKey, patientId);
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

  async getClinicalRecord(
    partnerKey: InstitutionalPartnerKey,
    patientId: string,
    character: IAuthCharacter,
  ) {
    this.assertAccess(partnerKey, character);
    const grant = await this.medicalRecordAccessService.hasActiveAccess(
      patientId,
      character.id,
    );
    if (!grant) {
      throw new ForbiddenException(
        'No active medical-record access grant. Request authorization from SAED High Command.',
      );
    }

    await this.requireAgent(partnerKey, patientId);
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

  getFinance(
    partnerKey: InstitutionalPartnerKey,
    query: InstitutionalFinanceQueryDto,
    character: IAuthCharacter,
  ) {
    this.assertAccess(partnerKey, character);
    return this.occupationalHealthService.getInstitutionalFinance({
      partner: partnerKey,
      days: query.days ? Number(query.days) : undefined,
      from: query.from,
      to: query.to,
    });
  }

  getDashboard() {
    return this.occupationalHealthService.getDashboard();
  }

  listAccessRequests(
    partnerKey: InstitutionalPartnerKey,
    query: SearchMedicalRecordAccessDto,
    character: IAuthCharacter,
  ) {
    this.assertAccess(partnerKey, character);
    return this.medicalRecordAccessService.list(
      {
        characterId: character.id,
        permissions: character.permissions ?? [],
        roles: character.roles ?? [],
      },
      query,
      partnerKey,
    );
  }

  createAccessRequest(
    partnerKey: InstitutionalPartnerKey,
    dto: CreateMedicalRecordAccessDto,
    actor: IActor,
  ) {
    this.assertAccess(partnerKey, actor.character);
    return this.medicalRecordAccessService.create(
      dto,
      {
        accountId: actor.accountId,
        characterId: actor.character.id,
        roles: actor.character.roles ?? [],
        permissions: actor.character.permissions ?? [],
      },
      partnerKey,
    );
  }

  approveAccessRequest(
    partnerKey: InstitutionalPartnerKey,
    id: string,
    decisionNotes: string | undefined,
    actor: IActor,
  ) {
    this.assertAccess(partnerKey, actor.character);
    return this.medicalRecordAccessService.approve(
      id,
      this.toReviewActor(actor),
      decisionNotes,
      partnerKey,
    );
  }

  rejectAccessRequest(
    partnerKey: InstitutionalPartnerKey,
    id: string,
    decisionNotes: string | undefined,
    actor: IActor,
  ) {
    this.assertAccess(partnerKey, actor.character);
    return this.medicalRecordAccessService.reject(
      id,
      this.toReviewActor(actor),
      decisionNotes,
      partnerKey,
    );
  }

  revokeAccessRequest(
    partnerKey: InstitutionalPartnerKey,
    id: string,
    actor: IActor,
  ) {
    this.assertAccess(partnerKey, actor.character);
    return this.medicalRecordAccessService.revoke(
      id,
      this.toReviewActor(actor),
      partnerKey,
    );
  }

  listAuthorizedReports(
    partnerKey: InstitutionalPartnerKey,
    character: IAuthCharacter,
  ) {
    this.assertAccess(partnerKey, character);
    return this.medicalReportAccessService.listAuthorizedForRecipient(
      character.id,
      partnerKey,
    );
  }

  getAuthorizedReport(
    partnerKey: InstitutionalPartnerKey,
    grantId: string,
    actor: IActor,
  ) {
    this.assertAccess(partnerKey, actor.character);
    return this.medicalReportAccessService.getAuthorizedReport(
      grantId,
      { accountId: actor.accountId, characterId: actor.character.id },
      partnerKey,
    );
  }

  private async requireAgent(
    partnerKey: InstitutionalPartnerKey,
    patientId: string,
  ) {
    const card = await this.occupationalHealthService.getInteropPatientCard(
      patientId,
      partnerKey,
    );
    if (!card) {
      throw new NotFoundException(
        `Agent was not found in the ${getInstitutionalPartner(partnerKey).name} directory`,
      );
    }
    return card;
  }

  private toReviewActor(actor: IActor) {
    return {
      accountId: actor.accountId,
      characterId: actor.character.id,
      permissions: actor.character.permissions ?? [],
    };
  }
}
