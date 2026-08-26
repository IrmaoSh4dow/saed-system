import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BloodType, PatientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AgreementsService } from '../agreements/agreements.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { OccupationalHealthService } from '../occupational-health/occupational-health.service';
import {
  CreatePatientInvoiceDto,
  LinkPatientCharacterDto,
} from './dto/patient-invoice.dto';
import { CreatePatientDto, SearchPatientsDto, UpdatePatientDto } from './dto/patient.dto';
import {
  isValidBadgeNumber,
  normalizeBadgeNumber,
  supportsBadgeNumber,
} from './utils/patient-establishment.util';
import {
  buildNormalizedFullName,
  buildPatientSearchKey,
  nameSimilarity,
  normalizeDocument,
  normalizePersonName,
  normalizePhone,
  type IDuplicateSignal,
} from './utils/patient-identity.util';

const patientInclude = {
  establishment: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      defaultPosition: true,
    },
  },
  linkedCharacter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      status: true,
    },
  },
  createdByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  updatedByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
} satisfies Prisma.PatientInclude;

type PatientRow = Prisma.PatientGetPayload<{ include: typeof patientInclude }>;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly agreementsService: AgreementsService,
    private readonly occupationalHealthService: OccupationalHealthService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: SearchPatientsDto = {}) {
    const patients = await this.searchPatients(query, 100);
    return patients.map((patient) => this.toSummary(patient));
  }

  /**
   * Live typeahead + advanced search.
   * Supports full name, partial tokens, first/last separately.
   */
  async search(query: SearchPatientsDto) {
    const patients = await this.searchPatients(query, 25);
    const needle = buildNormalizedFullName({
      firstName: query.firstName ?? '',
      lastName: query.lastName ?? '',
      middleName: null,
    });
    const freeText = normalizePersonName(query.q);

    return patients.map((patient) => {
      const fullName = buildNormalizedFullName(patient);
      const score = Math.max(
        needle ? nameSimilarity(needle, fullName) : 0,
        freeText ? nameSimilarity(freeText, fullName) : 0,
        freeText && fullName.includes(freeText) ? 0.92 : 0,
      );
      return {
        ...this.toSummary(patient),
        matchScore: Number(score.toFixed(3)),
      };
    });
  }

  async getById(id: string) {
    const patient = await this.requirePatient(id);
    const [
      invoices,
      medicalReports,
      medicalRecords,
      hospitalizations,
      diagnoses,
      surgeries,
      stats,
    ] = await Promise.all([
      this.listInvoices(id),
      this.listMedicalReports(id),
      this.prismaService.medicalRecord.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prismaService.hospitalization.findMany({
        where: { patientId: id },
        orderBy: { admittedAt: 'desc' },
        take: 50,
      }),
      this.prismaService.diagnosis.findMany({
        where: { patientId: id },
        orderBy: { diagnosedAt: 'desc' },
        take: 50,
      }),
      this.prismaService.surgery.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.getClinicalStats(id),
    ]);

    const [activeAgreement, occupationalHealth] = await Promise.all([
      this.agreementsService.resolveActiveAgreementForPatient(id),
      this.occupationalHealthService.getPatientOccupationalSummary(id),
    ]);

    return {
      ...this.toDetail(patient),
      activeAgreement,
      currentPsychotechnical: occupationalHealth.currentPsychotechnical,
      activeMedicalLeave: occupationalHealth.activeMedicalLeave,
      psychotechnicalHistory: occupationalHealth.psychotechnicalHistory,
      medicalLeaveHistory: occupationalHealth.medicalLeaveHistory,
      invoices,
      medicalReports,
      clinicalHistory: {
        medicalRecords,
        hospitalizations,
        diagnoses,
        surgeries,
        medicalReports,
        invoices,
        stats,
      },
    };
  }

  async getClinicalStats(patientId: string) {
    const [
      medicalRecords,
      hospitalizations,
      diagnoses,
      surgeries,
      medicalReports,
      invoices,
    ] = await Promise.all([
      this.prismaService.medicalRecord.count({ where: { patientId } }),
      this.prismaService.hospitalization.count({ where: { patientId } }),
      this.prismaService.diagnosis.count({ where: { patientId } }),
      this.prismaService.surgery.count({ where: { patientId } }),
      this.prismaService.report.count({ where: { patientId } }),
      this.prismaService.patientInvoice.count({ where: { patientId } }),
    ]);

    return {
      medicalRecords,
      hospitalizations,
      diagnoses,
      surgeries,
      medicalReports,
      invoices,
    };
  }

  async listMedicalReports(patientId: string) {
    await this.requirePatient(patientId);

    const reports = await this.prismaService.report.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reportNumber: true,
        title: true,
        type: true,
        status: true,
        priority: true,
        incidentDate: true,
        createdAt: true,
        updatedAt: true,
        createdByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
        department: { select: { id: true, name: true } },
      },
    });

    return reports.map((report) => ({
      ...report,
      incidentDate: report.incidentDate
        ? report.incidentDate.toISOString().slice(0, 10)
        : null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));
  }

  async searchLinkableCharacters(query: string) {
    const term = query.trim();
    if (term.length < 2) {
      return [];
    }

    const characters = await this.prismaService.character.findMany({
      where: {
        linkedPatient: null,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { fivemCitizenId: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        status: true,
        phone: true,
        birthDate: true,
      },
    });

    return characters.map((character) => ({
      ...character,
      birthDate: toDateOnlyString(character.birthDate),
      fullName: `${character.firstName} ${character.lastName}`.trim(),
    }));
  }

  async linkCharacter(
    patientId: string,
    dto: LinkPatientCharacterDto,
    actor: { characterId: string },
  ) {
    await this.requirePatient(patientId);
    await this.assertLinkedCharacter(dto.characterId, patientId);

    const updated = await this.prismaService.patient.update({
      where: { id: patientId },
      data: {
        linkedCharacterId: dto.characterId,
        updatedByCharacterId: actor.characterId,
      },
      include: patientInclude,
    });

    return this.toDetail(updated);
  }

  async unlinkCharacter(patientId: string, actor: { characterId: string }) {
    await this.requirePatient(patientId);

    const updated = await this.prismaService.patient.update({
      where: { id: patientId },
      data: {
        linkedCharacterId: null,
        updatedByCharacterId: actor.characterId,
      },
      include: patientInclude,
    });

    return this.toDetail(updated);
  }

  async listTreatments() {
    const treatments = await this.prismaService.treatment.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return treatments.map((treatment) => ({
      id: treatment.id,
      name: treatment.name,
      price: decimalToNumber(treatment.price),
      description: treatment.description,
      label: `${treatment.name} — $${decimalToNumber(treatment.price).toFixed(2)}`,
    }));
  }

  async listInvoices(patientId: string) {
    await this.requirePatient(patientId);

    const invoices = await this.prismaService.patientInvoice.findMany({
      where: { patientId },
      include: {
        treatment: { select: { id: true, name: true, price: true } },
        createdByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
        agreement: {
          select: { id: true, discountPercent: true, status: true },
        },
      },
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return invoices.map((invoice) => this.toInvoice(invoice));
  }

  async createInvoice(
    patientId: string,
    dto: CreatePatientInvoiceDto,
    actor: { accountId: string; characterId: string },
  ) {
    await this.requirePatient(patientId);

    const treatment = await this.prismaService.treatment.findFirst({
      where: { id: dto.treatmentId, isActive: true },
    });
    if (!treatment) {
      throw new BadRequestException('Treatment was not found or is inactive');
    }

    const issuedAt = parseDateOnly(dto.issuedAt);
    if (!issuedAt) {
      throw new BadRequestException('issuedAt is required');
    }

    const originalAmount = decimalToNumber(treatment.price);
    const [billing, institutionalBilling] = await Promise.all([
      this.agreementsService.buildInvoiceDiscount(patientId, originalAmount),
      this.resolveInstitutionalBillingSnapshot(patientId),
    ]);

    const invoice = await this.prismaService.patientInvoice.create({
      data: {
        patientId,
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        originalAmount: billing.originalAmount,
        discountPercent: billing.discountPercent,
        discountAmount: billing.discountAmount,
        amount: billing.finalAmount,
        agreementId: billing.agreementId,
        establishmentName: billing.establishmentName,
        billingOrganization: institutionalBilling.organization,
        billingEstablishmentId: institutionalBilling.establishmentId,
        billingEstablishmentSlug: institutionalBilling.establishmentSlug,
        issuedAt,
        notes: dto.notes?.trim() || null,
        createdByCharacterId: actor.characterId,
      },
      include: {
        treatment: { select: { id: true, name: true, price: true } },
        createdByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
        agreement: {
          select: { id: true, discountPercent: true, status: true },
        },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'patients.invoice_created',
      targetType: AUDIT_TARGET.PATIENT_INVOICE,
      targetId: invoice.id,
      metadata: {
        patientId,
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        originalAmount: billing.originalAmount,
        discountPercent: billing.discountPercent,
        discountAmount: billing.discountAmount,
        amount: billing.finalAmount,
        agreementId: billing.agreementId,
        establishmentName: billing.establishmentName,
        billingOrganization: institutionalBilling.organization,
      },
    });

    return this.toInvoice(invoice);
  }

  async deleteInvoice(patientId: string, invoiceId: string) {
    const invoice = await this.prismaService.patientInvoice.findFirst({
      where: { id: invoiceId, patientId },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice was not found');
    }

    await this.prismaService.patientInvoice.delete({ where: { id: invoiceId } });
    return { id: invoiceId, deleted: true };
  }

  async create(
    dto: CreatePatientDto,
    actor: { accountId: string; characterId: string },
  ) {
    const payload = this.normalizeWritableFields(dto);
    if (!payload.firstName || !payload.lastName) {
      throw new BadRequestException('firstName and lastName are required');
    }

    await this.assertLinkedCharacter(payload.linkedCharacterId);

    const duplicates = await this.findDuplicateCandidates({
      ...payload,
      excludeId: null,
    });

    const exact = duplicates.filter((item) => item.signal.confidence === 'exact');
    if (exact.length) {
      throw new ConflictException({
        message: 'Ya existe un paciente con la misma identidad clínica.',
        errors: [
          {
            code: 'PATIENT_DUPLICATE_EXACT',
            matches: exact.map((item) => ({
              ...this.toSummary(item.patient),
              reason: item.signal.reason,
              confidence: item.signal.confidence,
              score: item.signal.score,
            })),
          },
        ],
      });
    }

    const likely = duplicates.filter((item) => item.signal.confidence === 'likely');
    if (likely.length && !dto.forceCreate) {
      throw new ConflictException({
        message:
          'Se encontraron posibles duplicados. Revisa las coincidencias o confirma la creación.',
        errors: [
          {
            code: 'PATIENT_DUPLICATE_LIKELY',
            requiresConfirmation: true,
            matches: likely.map((item) => ({
              ...this.toSummary(item.patient),
              reason: item.signal.reason,
              confidence: item.signal.confidence,
              score: item.signal.score,
            })),
          },
        ],
      });
    }

    const workplace = await this.resolveWorkplaceFields({
      establishmentId: payload.establishmentId,
      badgeNumber: payload.badgeNumber,
    });

    const searchKey = buildPatientSearchKey(payload);

    try {
      const created = await this.prismaService.patient.create({
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          middleName: payload.middleName,
          birthDate: payload.birthDate,
          sex: payload.sex,
          nationality: payload.nationality,
          phone: payload.phone,
          identityDocument: payload.identityDocument,
          bloodType: payload.bloodType ?? BloodType.UNKNOWN,
          allergies: payload.allergies,
          chronicConditions: payload.chronicConditions,
          emergencyContactName: payload.emergencyContactName,
          emergencyContactPhone: payload.emergencyContactPhone,
          notes: payload.notes,
          establishmentId: workplace.establishmentId,
          badgeNumber: workplace.badgeNumber,
          linkedCharacterId: payload.linkedCharacterId,
          searchKey,
          createdByCharacterId: actor.characterId,
          updatedByCharacterId: actor.characterId,
        },
        include: patientInclude,
      });

      await this.auditService.create({
        actorAccountId: actor.accountId,
        actorCharacterId: actor.characterId,
        action: 'patients.created',
        targetType: AUDIT_TARGET.PATIENT,
        targetId: created.id,
        metadata: {
          recordNumber: created.recordNumber,
          establishmentId: workplace.establishmentId,
          badgeNumber: workplace.badgeNumber,
        },
      });

      return this.toDetail(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'Conflicto de unicidad al crear el paciente (documento o vínculo).',
          code: 'PATIENT_UNIQUE_CONSTRAINT',
        });
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.requirePatient(id);
    const merged = {
      firstName: dto.firstName?.trim() ?? existing.firstName,
      lastName: dto.lastName?.trim() ?? existing.lastName,
      middleName:
        dto.middleName === undefined
          ? existing.middleName
          : dto.middleName?.trim() || null,
      birthDate:
        dto.birthDate === undefined
          ? existing.birthDate
          : parseDateOnly(dto.birthDate),
      sex: dto.sex === undefined ? existing.sex : dto.sex,
      nationality:
        dto.nationality === undefined
          ? existing.nationality
          : dto.nationality?.trim() || null,
      phone: dto.phone === undefined ? existing.phone : dto.phone?.trim() || null,
      identityDocument:
        dto.identityDocument === undefined
          ? existing.identityDocument
          : dto.identityDocument?.trim() || null,
      bloodType: dto.bloodType ?? existing.bloodType,
      allergies:
        dto.allergies === undefined
          ? existing.allergies
          : dto.allergies?.trim() || null,
      chronicConditions:
        dto.chronicConditions === undefined
          ? existing.chronicConditions
          : dto.chronicConditions?.trim() || null,
      emergencyContactName:
        dto.emergencyContactName === undefined
          ? existing.emergencyContactName
          : dto.emergencyContactName?.trim() || null,
      emergencyContactPhone:
        dto.emergencyContactPhone === undefined
          ? existing.emergencyContactPhone
          : dto.emergencyContactPhone?.trim() || null,
      notes: dto.notes === undefined ? existing.notes : dto.notes?.trim() || null,
      status: dto.status ?? existing.status,
      linkedCharacterId:
        dto.linkedCharacterId === undefined
          ? existing.linkedCharacterId
          : dto.linkedCharacterId,
    };

    const workplace = await this.resolveWorkplaceFields({
      establishmentId:
        dto.establishmentId === undefined
          ? existing.establishmentId
          : dto.establishmentId,
      badgeNumber:
        dto.badgeNumber === undefined ? existing.badgeNumber : dto.badgeNumber,
      allowMissingEstablishment: true,
    });

    await this.assertLinkedCharacter(merged.linkedCharacterId, id);

    const duplicates = await this.findDuplicateCandidates({
      ...merged,
      excludeId: id,
    });
    const exact = duplicates.filter((item) => item.signal.confidence === 'exact');
    if (exact.length) {
      throw new ConflictException({
        message: 'La actualización colisiona con otro paciente existente.',
        errors: [
          {
            code: 'PATIENT_DUPLICATE_EXACT',
            matches: exact.map((item) => ({
              ...this.toSummary(item.patient),
              reason: item.signal.reason,
              confidence: item.signal.confidence,
              score: item.signal.score,
            })),
          },
        ],
      });
    }

    const searchKey = buildPatientSearchKey(merged);
    const previousEstablishmentId = existing.establishmentId;
    const previousBadgeNumber = existing.badgeNumber;

    try {
      const updated = await this.prismaService.patient.update({
        where: { id },
        data: {
          ...merged,
          establishmentId: workplace.establishmentId,
          badgeNumber: workplace.badgeNumber,
          searchKey,
          updatedByCharacterId: actor.characterId,
        },
        include: patientInclude,
      });

      const organizationChanged = previousEstablishmentId !== workplace.establishmentId;
      const badgeChanged = previousBadgeNumber !== workplace.badgeNumber;

      if (organizationChanged || badgeChanged) {
        await this.auditService.create({
          actorAccountId: actor.accountId,
          actorCharacterId: actor.characterId,
          action: organizationChanged
            ? 'patients.organization_updated'
            : 'patients.badge_updated',
          targetType: AUDIT_TARGET.PATIENT,
          targetId: id,
          metadata: {
            previousEstablishmentId,
            establishmentId: workplace.establishmentId,
            previousBadgeNumber,
            badgeNumber: workplace.badgeNumber,
            badgeCleared:
              Boolean(previousBadgeNumber) && !workplace.badgeNumber && organizationChanged,
          },
        });
      } else {
        await this.auditService.create({
          actorAccountId: actor.accountId,
          actorCharacterId: actor.characterId,
          action: 'patients.updated',
          targetType: AUDIT_TARGET.PATIENT,
          targetId: id,
          metadata: { recordNumber: updated.recordNumber },
        });
      }

      return this.toDetail(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'Conflicto de unicidad al actualizar el paciente.',
          code: 'PATIENT_UNIQUE_CONSTRAINT',
        });
      }
      throw error;
    }
  }

  private async searchPatients(query: SearchPatientsDto, take: number) {
    const where: Prisma.PatientWhereInput = {
      status: query.status ?? undefined,
    };

    const and: Prisma.PatientWhereInput[] = [];

    if (query.firstName?.trim()) {
      and.push({
        firstName: { contains: query.firstName.trim(), mode: 'insensitive' },
      });
    }
    if (query.lastName?.trim()) {
      and.push({
        lastName: { contains: query.lastName.trim(), mode: 'insensitive' },
      });
    }
    if (query.birthDate) {
      and.push({ birthDate: parseDateOnly(query.birthDate) ?? undefined });
    }
    if (query.phone?.trim()) {
      const digits = normalizePhone(query.phone);
      and.push({
        OR: [
          { phone: { contains: query.phone.trim(), mode: 'insensitive' } },
          ...(digits ? [{ searchKey: { contains: digits, mode: 'insensitive' as const } }] : []),
        ],
      });
    }
    if (query.identityDocument?.trim()) {
      const document = normalizeDocument(query.identityDocument);
      and.push({
        OR: [
          {
            identityDocument: {
              contains: query.identityDocument.trim(),
              mode: 'insensitive',
            },
          },
          ...(document
            ? [{ searchKey: { contains: document, mode: 'insensitive' as const } }]
            : []),
        ],
      });
    }

    const q = query.q?.trim();
    if (q) {
      const tokens = normalizePersonName(q).split(' ').filter(Boolean);
      const tokenFilters: Prisma.PatientWhereInput[] = tokens.map((token) => ({
        OR: [
          { firstName: { contains: token, mode: 'insensitive' } },
          { lastName: { contains: token, mode: 'insensitive' } },
          { middleName: { contains: token, mode: 'insensitive' } },
          { searchKey: { contains: token, mode: 'insensitive' } },
          { identityDocument: { contains: token, mode: 'insensitive' } },
          { phone: { contains: token, mode: 'insensitive' } },
        ],
      }));

      and.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { middleName: { contains: q, mode: 'insensitive' } },
          { searchKey: { contains: normalizePersonName(q), mode: 'insensitive' } },
          { identityDocument: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          ...(tokens.length > 1 ? [{ AND: tokenFilters }] : []),
        ],
      });
    }

    if (and.length) {
      where.AND = and;
    }

    return this.prismaService.patient.findMany({
      where,
      include: patientInclude,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { createdAt: 'desc' }],
      take,
    });
  }

  private async findDuplicateCandidates(input: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
    birthDate?: Date | null;
    phone?: string | null;
    identityDocument?: string | null;
    excludeId: string | null;
  }): Promise<Array<{ patient: PatientRow; signal: IDuplicateSignal }>> {
    const fullName = buildNormalizedFullName(input);
    const phone = normalizePhone(input.phone);
    const document = normalizeDocument(input.identityDocument);
    const nameTokens = fullName.split(' ').filter(Boolean);

    const candidates = await this.prismaService.patient.findMany({
      where: {
        id: input.excludeId ? { not: input.excludeId } : undefined,
        status: { not: PatientStatus.ARCHIVED },
        OR: [
          ...(document ? [{ identityDocument: { equals: input.identityDocument!, mode: 'insensitive' as const } }] : []),
          ...(document ? [{ searchKey: { contains: document, mode: 'insensitive' as const } }] : []),
          ...(phone.length >= 7 ? [{ searchKey: { contains: phone, mode: 'insensitive' as const } }] : []),
          ...(nameTokens.length
            ? nameTokens.map((token) => ({
                searchKey: { contains: token, mode: 'insensitive' as const },
              }))
            : []),
          {
            AND: [
              { firstName: { contains: input.firstName.slice(0, 3), mode: 'insensitive' } },
              { lastName: { contains: input.lastName.slice(0, 3), mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: patientInclude,
      take: 40,
    });

    const scored: Array<{ patient: PatientRow; signal: IDuplicateSignal }> = [];

    for (const patient of candidates) {
      const signal = this.evaluateDuplicate(input, patient, fullName, phone, document);
      if (signal) {
        scored.push({ patient, signal });
      }
    }

    scored.sort((left, right) => right.signal.score - left.signal.score);
    return scored;
  }

  private evaluateDuplicate(
    input: {
      firstName: string;
      lastName: string;
      middleName?: string | null;
      birthDate?: Date | null;
      phone?: string | null;
      identityDocument?: string | null;
    },
    patient: PatientRow,
    inputFullName: string,
    inputPhone: string,
    inputDocument: string,
  ): IDuplicateSignal | null {
    const patientDocument = normalizeDocument(patient.identityDocument);
    if (inputDocument && patientDocument && inputDocument === patientDocument) {
      return {
        confidence: 'exact',
        reason: 'Mismo documento de identidad',
        score: 1,
      };
    }

    const patientFullName = buildNormalizedFullName(patient);
    const similarity = nameSimilarity(inputFullName, patientFullName);
    const sameName = similarity >= 0.98;
    const similarName = similarity >= 0.86;
    const patientPhone = normalizePhone(patient.phone);
    const samePhone =
      Boolean(inputPhone) &&
      inputPhone.length >= 7 &&
      Boolean(patientPhone) &&
      inputPhone === patientPhone;
    const sameBirth =
      Boolean(input.birthDate) &&
      Boolean(patient.birthDate) &&
      toDateOnlyString(input.birthDate) === toDateOnlyString(patient.birthDate);

    if (sameName && sameBirth) {
      return {
        confidence: 'exact',
        reason: 'Mismo nombre normalizado y misma fecha de nacimiento',
        score: 0.99,
      };
    }

    if (sameName && samePhone) {
      return {
        confidence: 'exact',
        reason: 'Mismo nombre normalizado y mismo teléfono',
        score: 0.98,
      };
    }

    if (samePhone && similarName) {
      return {
        confidence: 'exact',
        reason: 'Mismo teléfono con nombre muy similar',
        score: 0.96,
      };
    }

    if (sameName) {
      return {
        confidence: 'likely',
        reason: 'Mismo nombre; faltan discriminadores (fecha/teléfono/documento)',
        score: 0.9,
      };
    }

    if (similarName && sameBirth) {
      return {
        confidence: 'likely',
        reason: 'Nombre similar con la misma fecha de nacimiento',
        score: Math.max(0.88, similarity),
      };
    }

    if (similarName && similarity >= 0.9) {
      return {
        confidence: 'possible',
        reason: 'Nombre muy similar',
        score: similarity,
      };
    }

    return null;
  }

  private async assertLinkedCharacter(
    linkedCharacterId: string | null | undefined,
    excludePatientId?: string,
  ) {
    if (!linkedCharacterId) {
      return;
    }

    const character = await this.prismaService.character.findUnique({
      where: { id: linkedCharacterId },
      select: { id: true },
    });
    if (!character) {
      throw new BadRequestException('linkedCharacterId does not exist');
    }

    const existing = await this.prismaService.patient.findFirst({
      where: {
        linkedCharacterId,
        ...(excludePatientId ? { id: { not: excludePatientId } } : {}),
      },
      select: { id: true, recordNumber: true },
    });
    if (existing) {
      throw new ConflictException({
        message: `Ese personaje ya está vinculado al paciente #${existing.recordNumber}.`,
        code: 'PATIENT_CHARACTER_ALREADY_LINKED',
      });
    }
  }

  private normalizeWritableFields(dto: CreatePatientDto) {
    return {
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      middleName: dto.middleName?.trim() || null,
      birthDate: parseDateOnly(dto.birthDate),
      sex: dto.sex ?? null,
      nationality: dto.nationality?.trim() || null,
      phone: dto.phone?.trim() || null,
      identityDocument: dto.identityDocument?.trim() || null,
      bloodType: dto.bloodType ?? BloodType.UNKNOWN,
      allergies: dto.allergies?.trim() || null,
      chronicConditions: dto.chronicConditions?.trim() || null,
      emergencyContactName: dto.emergencyContactName?.trim() || null,
      emergencyContactPhone: dto.emergencyContactPhone?.trim() || null,
      notes: dto.notes?.trim() || null,
      establishmentId: dto.establishmentId ?? null,
      badgeNumber: dto.badgeNumber ?? null,
      linkedCharacterId: dto.linkedCharacterId ?? null,
    };
  }

  /**
   * Resolves establishment + badge rules:
   * - badge only allowed for institutional partners that issue one
   * - leaving that establishment auto-clears the badge
   */
  private async resolveWorkplaceFields(input: {
    establishmentId?: string | null;
    badgeNumber?: string | null;
    allowMissingEstablishment?: boolean;
  }) {
    const establishmentId = input.establishmentId ?? null;
    let establishment: { id: string; slug: string; name: string } | null = null;

    if (establishmentId) {
      establishment = await this.prismaService.establishment.findFirst({
        where: { id: establishmentId },
        select: { id: true, slug: true, name: true },
      });
      if (!establishment) {
        throw new BadRequestException('Establishment was not found');
      }
    } else if (!input.allowMissingEstablishment && input.badgeNumber) {
      throw new BadRequestException(
        'badgeNumber requires an institutional establishment on the patient',
      );
    }

    const allowsBadge = supportsBadgeNumber(establishment);
    const requestedBadge = normalizeBadgeNumber(input.badgeNumber);

    if (requestedBadge && !allowsBadge) {
      throw new BadRequestException(
        'La placa institucional solo puede asignarse a pacientes de una agencia institucional',
      );
    }

    if (requestedBadge && !isValidBadgeNumber(requestedBadge)) {
      throw new BadRequestException(
        'badgeNumber must look like 1A-12, 3B-45 or ADAM-21',
      );
    }

    return {
      establishmentId: establishment?.id ?? null,
      badgeNumber: allowsBadge ? requestedBadge : null,
    };
  }

  private async requirePatient(id: string) {
    const patient = await this.prismaService.patient.findUnique({
      where: { id },
      include: patientInclude,
    });
    if (!patient) {
      throw new NotFoundException('Patient was not found');
    }
    return patient;
  }

  private toSummary(patient: PatientRow) {
    return {
      id: patient.id,
      recordNumber: patient.recordNumber,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      fullName: [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(' '),
      birthDate: toDateOnlyString(patient.birthDate),
      sex: patient.sex,
      nationality: patient.nationality,
      phone: patient.phone,
      identityDocument: patient.identityDocument,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      status: patient.status,
      avatarUrl: patient.avatarUrl,
      establishmentId: patient.establishmentId,
      establishment: patient.establishment,
      badgeNumber: patient.badgeNumber,
      linkedCharacterId: patient.linkedCharacterId,
      linkedCharacter: patient.linkedCharacter,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    };
  }

  private toDetail(patient: PatientRow) {
    return {
      ...this.toSummary(patient),
      chronicConditions: patient.chronicConditions,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      notes: patient.notes,
      createdByCharacter: patient.createdByCharacter,
      updatedByCharacter: patient.updatedByCharacter,
    };
  }

  /**
   * Snapshot of the patient's employment institution at billing time.
   * Prefer Patient.establishmentId; fall back to linked character occupation for legacy rows.
   */
  private async resolveInstitutionalBillingSnapshot(patientId: string) {
    const patient = await this.prismaService.patient.findUnique({
      where: { id: patientId },
      select: {
        establishmentId: true,
        establishment: {
          select: { id: true, slug: true, name: true },
        },
        linkedCharacter: {
          select: {
            occupations: {
              where: { isActive: true },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
              take: 1,
              select: {
                organization: true,
                establishmentId: true,
                establishment: { select: { id: true, slug: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (patient?.establishment) {
      return {
        organization: patient.establishment.name,
        establishmentId: patient.establishment.id,
        establishmentSlug: patient.establishment.slug,
      };
    }

    const occupation = patient?.linkedCharacter?.occupations?.[0];
    if (!occupation) {
      return {
        organization: null as string | null,
        establishmentId: null as string | null,
        establishmentSlug: null as string | null,
      };
    }

    return {
      organization: occupation.establishment?.name ?? occupation.organization,
      establishmentId: occupation.establishmentId ?? occupation.establishment?.id ?? null,
      establishmentSlug: occupation.establishment?.slug ?? null,
    };
  }

  private toInvoice(invoice: {
    id: string;
    invoiceNumber: number;
    patientId: string;
    treatmentId: string;
    treatmentName: string;
    originalAmount?: Prisma.Decimal | number | null;
    discountPercent?: Prisma.Decimal | number | null;
    discountAmount?: Prisma.Decimal | number | null;
    amount: Prisma.Decimal | number;
    agreementId?: string | null;
    establishmentName?: string | null;
    billingOrganization?: string | null;
    billingEstablishmentId?: string | null;
    billingEstablishmentSlug?: string | null;
    issuedAt: Date;
    notes: string | null;
    createdAt: Date;
    treatment?: { id: string; name: string; price: Prisma.Decimal | number } | null;
    createdByCharacter?: { id: string; firstName: string; lastName: string } | null;
    agreement?: { id: string; discountPercent: Prisma.Decimal | number; status: string } | null;
  }) {
    const originalAmount = decimalToNumber(invoice.originalAmount ?? invoice.amount);
    const discountPercent = decimalToNumber(invoice.discountPercent ?? 0);
    const discountAmount = decimalToNumber(invoice.discountAmount ?? 0);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      treatmentId: invoice.treatmentId,
      treatmentName: invoice.treatmentName,
      originalAmount,
      discountPercent,
      discountAmount,
      amount: decimalToNumber(invoice.amount),
      agreementId: invoice.agreementId ?? null,
      establishmentName: invoice.establishmentName ?? null,
      billingOrganization: invoice.billingOrganization ?? null,
      billingEstablishmentId: invoice.billingEstablishmentId ?? null,
      billingEstablishmentSlug: invoice.billingEstablishmentSlug ?? null,
      agreement: invoice.agreement
        ? {
            id: invoice.agreement.id,
            discountPercent: decimalToNumber(invoice.agreement.discountPercent),
            status: invoice.agreement.status,
          }
        : null,
      issuedAt: toDateOnlyString(invoice.issuedAt),
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
      treatment: invoice.treatment
        ? {
            id: invoice.treatment.id,
            name: invoice.treatment.name,
            price: decimalToNumber(invoice.treatment.price),
          }
        : null,
      createdByCharacter: invoice.createdByCharacter ?? null,
      label: `${toDateOnlyString(invoice.issuedAt)} — ${invoice.treatmentName}`,
    };
  }
}

function decimalToNumber(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

function toDateOnlyString(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

function parseDateOnly(value?: string | null): Date | null {
  if (value === null) {
    return null;
  }
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid birthDate');
  }
  return date;
}
