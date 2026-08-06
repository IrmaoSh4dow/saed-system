import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MedicalLeaveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import {
  CreateMedicalLeaveDto,
  UpdateMedicalLeaveDto,
} from './dto/occupational-health.dto';
import {
  differenceInCalendarDays,
  isMedicalLeaveCurrentlyActive,
  medicalLeaveStatusLabel,
  parseDateOnly,
  startOfUtcDay,
  toDateOnlyString,
} from './occupational-health.utils';

const leaveInclude = {
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
} satisfies Prisma.MedicalLeaveInclude;

@Injectable()
export class MedicalLeavesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listByPatient(patientId: string) {
    await this.requirePatient(patientId);
    await this.markElapsedActiveLeaves(patientId);
    const rows = await this.prismaService.medicalLeave.findMany({
      where: { patientId },
      include: leaveInclude,
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.toDto(row));
  }

  async getById(id: string) {
    const row = await this.prismaService.medicalLeave.findUnique({
      where: { id },
      include: leaveInclude,
    });
    if (!row) {
      throw new NotFoundException('Medical leave was not found');
    }
    return this.toDto(row);
  }

  async resolveActiveForPatient(patientId: string) {
    await this.markElapsedActiveLeaves(patientId);
    const rows = await this.prismaService.medicalLeave.findMany({
      where: { patientId, status: MedicalLeaveStatus.ACTIVE },
      include: leaveInclude,
      orderBy: [{ startsAt: 'desc' }],
    });
    const active = rows.find((row) => isMedicalLeaveCurrentlyActive(row));
    return active ? this.toDto(active) : null;
  }

  async create(
    dto: CreateMedicalLeaveDto,
    actor: { accountId: string; characterId: string },
  ) {
    await this.requirePatient(dto.patientId);

    const startsAt = parseDateOnly(dto.startsAt);
    if (!startsAt) {
      throw new BadRequestException('startsAt is required');
    }

    const endsAt =
      dto.endsAt === undefined || dto.endsAt === null || dto.endsAt === ''
        ? null
        : parseDateOnly(dto.endsAt);
    if (dto.endsAt && !endsAt) {
      throw new BadRequestException('Invalid endsAt');
    }
    if (endsAt && endsAt < startsAt) {
      throw new BadRequestException('endsAt must be on or after startsAt');
    }

    const status = dto.status ?? MedicalLeaveStatus.ACTIVE;
    const physicianCharacterId = dto.physicianCharacterId ?? actor.characterId;
    await this.assertCharacterExists(physicianCharacterId);

    const created = await this.prismaService.$transaction(async (tx) => {
      if (status === MedicalLeaveStatus.ACTIVE) {
        await tx.medicalLeave.updateMany({
          where: {
            patientId: dto.patientId,
            status: MedicalLeaveStatus.ACTIVE,
          },
          data: {
            status: MedicalLeaveStatus.COMPLETED,
            endsAt: endsAt ?? startOfUtcDay(),
          },
        });
      }

      return tx.medicalLeave.create({
        data: {
          patientId: dto.patientId,
          status,
          startsAt,
          endsAt,
          reason: dto.reason.trim(),
          observations: dto.observations?.trim() || null,
          physicianCharacterId,
          createdByCharacterId: actor.characterId,
        },
        include: leaveInclude,
      });
    });

    const durationDays = differenceInCalendarDays(startsAt, endsAt);

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'medical-leaves.created',
      targetType: AUDIT_TARGET.MEDICAL_LEAVE,
      targetId: created.id,
      metadata: {
        patientId: dto.patientId,
        patientName: `${created.patient.firstName} ${created.patient.lastName}`,
        status,
        reason: created.reason,
        startsAt: toDateOnlyString(startsAt),
        endsAt: toDateOnlyString(endsAt),
        durationDays,
      },
    });

    return this.toDto(created);
  }

  async update(
    id: string,
    dto: UpdateMedicalLeaveDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.prismaService.medicalLeave.findUnique({
      where: { id },
      include: { patient: { select: { firstName: true, lastName: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Medical leave was not found');
    }

    const startsAt =
      dto.startsAt !== undefined ? parseDateOnly(dto.startsAt) : existing.startsAt;
    if (dto.startsAt !== undefined && !startsAt) {
      throw new BadRequestException('Invalid startsAt');
    }

    let endsAt = existing.endsAt;
    if (dto.endsAt !== undefined) {
      if (dto.endsAt === null || dto.endsAt === '') {
        endsAt = null;
      } else {
        endsAt = parseDateOnly(dto.endsAt);
        if (!endsAt) {
          throw new BadRequestException('Invalid endsAt');
        }
      }
    }

    if (endsAt && startsAt && endsAt < startsAt) {
      throw new BadRequestException('endsAt must be on or after startsAt');
    }

    if (dto.physicianCharacterId) {
      await this.assertCharacterExists(dto.physicianCharacterId);
    }

    const nextStatus = dto.status ?? existing.status;

    const updated = await this.prismaService.$transaction(async (tx) => {
      if (
        nextStatus === MedicalLeaveStatus.ACTIVE &&
        existing.status !== MedicalLeaveStatus.ACTIVE
      ) {
        await tx.medicalLeave.updateMany({
          where: {
            patientId: existing.patientId,
            status: MedicalLeaveStatus.ACTIVE,
            NOT: { id },
          },
          data: {
            status: MedicalLeaveStatus.COMPLETED,
            endsAt: endsAt ?? startOfUtcDay(),
          },
        });
      }

      return tx.medicalLeave.update({
        where: { id },
        data: {
          startsAt: startsAt ?? existing.startsAt,
          endsAt,
          status: nextStatus,
          reason: dto.reason === undefined ? undefined : dto.reason.trim(),
          observations:
            dto.observations === undefined
              ? undefined
              : dto.observations?.trim() || null,
          physicianCharacterId:
            dto.physicianCharacterId === undefined
              ? undefined
              : dto.physicianCharacterId,
        },
        include: leaveInclude,
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action:
        nextStatus !== existing.status && nextStatus === MedicalLeaveStatus.COMPLETED
          ? 'medical-leaves.completed'
          : nextStatus !== existing.status && nextStatus === MedicalLeaveStatus.CANCELLED
            ? 'medical-leaves.cancelled'
            : 'medical-leaves.updated',
      targetType: AUDIT_TARGET.MEDICAL_LEAVE,
      targetId: id,
      metadata: {
        patientId: existing.patientId,
        patientName: `${existing.patient.firstName} ${existing.patient.lastName}`,
        previousStatus: existing.status,
        newStatus: nextStatus,
        durationDays: differenceInCalendarDays(
          startsAt ?? existing.startsAt,
          endsAt,
        ),
      },
    });

    return this.toDto(updated);
  }

  async complete(id: string, actor: { accountId: string; characterId: string }) {
    return this.update(
      id,
      {
        status: MedicalLeaveStatus.COMPLETED,
        endsAt: toDateOnlyString(startOfUtcDay()) ?? undefined,
      },
      actor,
    );
  }

  async cancel(id: string, actor: { accountId: string; characterId: string }) {
    return this.update(id, { status: MedicalLeaveStatus.CANCELLED }, actor);
  }

  private async markElapsedActiveLeaves(patientId?: string) {
    const today = startOfUtcDay();
    await this.prismaService.medicalLeave.updateMany({
      where: {
        status: MedicalLeaveStatus.ACTIVE,
        endsAt: { lt: today },
        ...(patientId ? { patientId } : {}),
      },
      data: { status: MedicalLeaveStatus.COMPLETED },
    });
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

  private toDto(row: Prisma.MedicalLeaveGetPayload<{ include: typeof leaveInclude }>) {
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
      status: row.status,
      statusLabel: medicalLeaveStatusLabel(row.status),
      isCurrentlyActive: isMedicalLeaveCurrentlyActive(row),
      startsAt: toDateOnlyString(row.startsAt),
      endsAt: toDateOnlyString(row.endsAt),
      durationDays: differenceInCalendarDays(row.startsAt, row.endsAt),
      reason: row.reason,
      observations: row.observations,
      physicianCharacter: row.physicianCharacter,
      createdByCharacter: row.createdByCharacter,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
