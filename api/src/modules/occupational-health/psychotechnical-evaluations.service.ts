import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PsychotechnicalResult } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import {
  CreatePsychotechnicalEvaluationDto,
  UpdatePsychotechnicalEvaluationDto,
} from './dto/occupational-health.dto';
import {
  parseDateOnly,
  psychotechnicalResultLabel,
  resolvePsychotechnicalValidity,
  toDateOnlyString,
} from './occupational-health.utils';

const evaluationInclude = {
  physicianCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  createdByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  patient: {
    select: {
      id: true,
      recordNumber: true,
      firstName: true,
      lastName: true,
      middleName: true,
    },
  },
} satisfies Prisma.PsychotechnicalEvaluationInclude;

@Injectable()
export class PsychotechnicalEvaluationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listByPatient(patientId: string) {
    await this.requirePatient(patientId);
    const rows = await this.prismaService.psychotechnicalEvaluation.findMany({
      where: { patientId },
      include: evaluationInclude,
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.toDto(row));
  }

  async getById(id: string) {
    const row = await this.prismaService.psychotechnicalEvaluation.findUnique({
      where: { id },
      include: evaluationInclude,
    });
    if (!row) {
      throw new NotFoundException('Psychotechnical evaluation was not found');
    }
    return this.toDto(row);
  }

  async resolveCurrentForPatient(patientId: string) {
    const row = await this.prismaService.psychotechnicalEvaluation.findFirst({
      where: { patientId },
      include: evaluationInclude,
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return row ? this.toDto(row) : null;
  }

  async create(
    dto: CreatePsychotechnicalEvaluationDto,
    actor: { accountId: string; characterId: string },
  ) {
    await this.requirePatient(dto.patientId);

    const issuedAt = parseDateOnly(dto.issuedAt);
    if (!issuedAt) {
      throw new BadRequestException('issuedAt is required');
    }

    const expiresAt =
      dto.expiresAt === undefined || dto.expiresAt === null || dto.expiresAt === ''
        ? null
        : parseDateOnly(dto.expiresAt);
    if (dto.expiresAt && !expiresAt) {
      throw new BadRequestException('Invalid expiresAt');
    }
    if (expiresAt && expiresAt < issuedAt) {
      throw new BadRequestException('expiresAt must be on or after issuedAt');
    }

    const physicianCharacterId = dto.physicianCharacterId ?? actor.characterId;
    await this.assertCharacterExists(physicianCharacterId);

    const created = await this.prismaService.psychotechnicalEvaluation.create({
      data: {
        patientId: dto.patientId,
        result: dto.result,
        issuedAt,
        expiresAt,
        observations: dto.observations?.trim() || null,
        physicianCharacterId,
        createdByCharacterId: actor.characterId,
      },
      include: evaluationInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'psychotechnical-evaluations.created',
      targetType: AUDIT_TARGET.PSYCHOTECHNICAL_EVALUATION,
      targetId: created.id,
      metadata: {
        patientId: dto.patientId,
        patientName: `${created.patient.firstName} ${created.patient.lastName}`,
        result: created.result,
        resultLabel: psychotechnicalResultLabel(created.result),
        issuedAt: toDateOnlyString(issuedAt),
        expiresAt: toDateOnlyString(expiresAt),
      },
    });

    return this.toDto(created);
  }

  async update(
    id: string,
    dto: UpdatePsychotechnicalEvaluationDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.prismaService.psychotechnicalEvaluation.findUnique({
      where: { id },
      include: { patient: { select: { firstName: true, lastName: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Psychotechnical evaluation was not found');
    }

    const issuedAt =
      dto.issuedAt !== undefined ? parseDateOnly(dto.issuedAt) : existing.issuedAt;
    if (dto.issuedAt !== undefined && !issuedAt) {
      throw new BadRequestException('Invalid issuedAt');
    }

    let expiresAt = existing.expiresAt;
    if (dto.expiresAt !== undefined) {
      if (dto.expiresAt === null || dto.expiresAt === '') {
        expiresAt = null;
      } else {
        expiresAt = parseDateOnly(dto.expiresAt);
        if (!expiresAt) {
          throw new BadRequestException('Invalid expiresAt');
        }
      }
    }

    if (expiresAt && issuedAt && expiresAt < issuedAt) {
      throw new BadRequestException('expiresAt must be on or after issuedAt');
    }

    if (dto.physicianCharacterId) {
      await this.assertCharacterExists(dto.physicianCharacterId);
    }

    const updated = await this.prismaService.psychotechnicalEvaluation.update({
      where: { id },
      data: {
        result: dto.result,
        issuedAt: issuedAt ?? existing.issuedAt,
        expiresAt,
        observations:
          dto.observations === undefined
            ? undefined
            : dto.observations?.trim() || null,
        physicianCharacterId:
          dto.physicianCharacterId === undefined
            ? undefined
            : dto.physicianCharacterId,
      },
      include: evaluationInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'psychotechnical-evaluations.updated',
      targetType: AUDIT_TARGET.PSYCHOTECHNICAL_EVALUATION,
      targetId: id,
      metadata: {
        patientId: existing.patientId,
        patientName: `${existing.patient.firstName} ${existing.patient.lastName}`,
        previousResult: existing.result,
        newResult: updated.result,
        previousResultLabel: psychotechnicalResultLabel(existing.result),
        newResultLabel: psychotechnicalResultLabel(updated.result),
      },
    });

    return this.toDto(updated);
  }

  private async requirePatient(patientId: string) {
    const patient = await this.prismaService.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient was not found');
    }
  }

  private async assertCharacterExists(characterId: string) {
    const character = await this.prismaService.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    });
    if (!character) {
      throw new BadRequestException('physicianCharacterId does not exist');
    }
  }

  private toDto(
    row: Prisma.PsychotechnicalEvaluationGetPayload<{ include: typeof evaluationInclude }>,
  ) {
    const validity = resolvePsychotechnicalValidity(row);
    return {
      id: row.id,
      patientId: row.patientId,
      patient: {
        id: row.patient.id,
        recordNumber: row.patient.recordNumber,
        firstName: row.patient.firstName,
        lastName: row.patient.lastName,
        fullName: [row.patient.firstName, row.patient.middleName, row.patient.lastName]
          .filter(Boolean)
          .join(' '),
      },
      result: row.result,
      resultLabel: psychotechnicalResultLabel(row.result),
      validity,
      isExpired: validity === 'EXPIRED',
      isExpiringSoon: validity === 'EXPIRING_SOON',
      issuedAt: toDateOnlyString(row.issuedAt),
      expiresAt: toDateOnlyString(row.expiresAt),
      observations: row.observations,
      physicianCharacter: row.physicianCharacter,
      createdByCharacter: row.createdByCharacter,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
