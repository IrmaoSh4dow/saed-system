import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgreementStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import {
  computeDiscount,
  decimalToNumber,
  isAgreementCurrentlyActive,
  parseDateOnly,
  startOfUtcDay,
  toDateOnlyString,
} from './agreements.utils';
import {
  CreateAgreementDto,
  SearchAgreementsDto,
  UpdateAgreementDto,
} from './dto/agreement.dto';

const agreementInclude = {
  establishment: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      status: true,
    },
  },
  createdByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  history: {
    orderBy: { createdAt: 'desc' as const },
    take: 40,
    include: {
      changedByCharacter: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
} satisfies Prisma.AgreementInclude;

export interface IActiveAgreementSnapshot {
  agreementId: string;
  establishmentId: string;
  establishmentName: string;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
  status: AgreementStatus;
  notes: string | null;
}

@Injectable()
export class AgreementsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * SAED directory: establishment cards with active convenio summary.
   * Readable by all staff with agreements.read.
   */
  async listEstablishmentDirectory(options?: { q?: string; onlyAffiliated?: boolean }) {
    await this.markExpiredAgreements();

    const term = options?.q?.trim() ?? '';
    const where: Prisma.EstablishmentWhereInput = {
      status: 'ACTIVE',
    };

    if (term) {
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (options?.onlyAffiliated) {
      const today = startOfUtcDay();
      where.agreements = {
        some: {
          status: AgreementStatus.ACTIVE,
          startsAt: { lte: today },
          OR: [{ endsAt: null }, { endsAt: { gte: today } }],
        },
      };
    }

    const rows = await this.prismaService.establishment.findMany({
      where,
      include: {
        agreements: {
          orderBy: [{ status: 'asc' }, { startsAt: 'desc' }],
          take: 5,
          include: {
            createdByCharacter: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            occupations: { where: { isActive: true } },
            agreements: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return rows.map((row) => {
      const active =
        row.agreements.find((agreement) => isAgreementCurrentlyActive(agreement)) ?? null;

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        logoUrl: row.logoUrl,
        status: row.status,
        activeOccupationCount: row._count.occupations,
        agreementCount: row._count.agreements,
        activeAgreement: active
          ? {
              id: active.id,
              status: active.status,
              discountPercent: decimalToNumber(active.discountPercent),
              startsAt: toDateOnlyString(active.startsAt),
              endsAt: toDateOnlyString(active.endsAt),
              notes: active.notes,
              createdByCharacter: active.createdByCharacter,
            }
          : null,
      };
    });
  }

  async getDashboard() {
    await this.markExpiredAgreements();

    const today = startOfUtcDay();
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const nextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

    const [
      activeAgreements,
      expiredAgreements,
      draftAgreements,
      inactiveAgreements,
      affiliatedEstablishments,
      totalEstablishments,
      patientsWithAgreement,
      discountAgg,
    ] = await Promise.all([
      this.prismaService.agreement.count({
        where: {
          status: AgreementStatus.ACTIVE,
          startsAt: { lte: today },
          OR: [{ endsAt: null }, { endsAt: { gte: today } }],
        },
      }),
      this.prismaService.agreement.count({
        where: {
          OR: [
            { status: AgreementStatus.EXPIRED },
            {
              status: AgreementStatus.ACTIVE,
              endsAt: { lt: today },
            },
          ],
        },
      }),
      this.prismaService.agreement.count({ where: { status: AgreementStatus.DRAFT } }),
      this.prismaService.agreement.count({ where: { status: AgreementStatus.INACTIVE } }),
      this.prismaService.establishment.count({
        where: {
          agreements: {
            some: {
              status: AgreementStatus.ACTIVE,
              startsAt: { lte: today },
              OR: [{ endsAt: null }, { endsAt: { gte: today } }],
            },
          },
        },
      }),
      this.prismaService.establishment.count({
        where: { status: 'ACTIVE' },
      }),
      this.countPatientsWithActiveAgreement(),
      this.prismaService.patientInvoice.aggregate({
        where: {
          issuedAt: { gte: monthStart, lt: nextMonth },
          discountAmount: { gt: 0 },
        },
        _sum: { discountAmount: true, originalAmount: true, amount: true },
        _count: { _all: true },
      }),
    ]);

    return {
      activeAgreements,
      expiredAgreements,
      draftAgreements,
      inactiveAgreements,
      affiliatedEstablishments,
      establishmentsWithoutAgreement: Math.max(0, totalEstablishments - affiliatedEstablishments),
      totalEstablishments,
      patientsWithAgreement,
      discountsThisMonth: {
        invoiceCount: discountAgg._count._all,
        discountTotal: decimalToNumber(discountAgg._sum.discountAmount ?? 0),
        originalTotal: decimalToNumber(discountAgg._sum.originalAmount ?? 0),
        finalTotal: decimalToNumber(discountAgg._sum.amount ?? 0),
      },
    };
  }

  async list(query: SearchAgreementsDto = {}) {
    await this.markExpiredAgreements();

    const where: Prisma.AgreementWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.establishmentId) {
      where.establishmentId = query.establishmentId;
    }
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { establishment: { name: { contains: term, mode: 'insensitive' } } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prismaService.agreement.findMany({
      where,
      include: agreementInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
    });

    return rows.map((row) => this.toDto(row));
  }

  async getById(id: string) {
    const row = await this.prismaService.agreement.findUnique({
      where: { id },
      include: agreementInclude,
    });
    if (!row) {
      throw new NotFoundException('Agreement was not found');
    }
    return this.toDto(row);
  }

  async create(
    dto: CreateAgreementDto,
    actor: { accountId: string; characterId: string },
  ) {
    const establishment = await this.prismaService.establishment.findUnique({
      where: { id: dto.establishmentId },
      select: { id: true, name: true },
    });
    if (!establishment) {
      throw new NotFoundException('Establishment was not found');
    }

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

    const status = dto.status ?? AgreementStatus.ACTIVE;
    const discountPercent = new Prisma.Decimal(dto.discountPercent);

    const created = await this.prismaService.$transaction(async (tx) => {
      if (status === AgreementStatus.ACTIVE) {
        await this.deactivateOtherActiveAgreements(tx, establishment.id, null, actor.characterId);
      }

      const agreement = await tx.agreement.create({
        data: {
          establishmentId: establishment.id,
          status,
          startsAt,
          endsAt,
          discountPercent,
          notes: dto.notes?.trim() || null,
          createdByCharacterId: actor.characterId,
          history: {
            create: {
              previousPercent: null,
              newPercent: discountPercent,
              previousStatus: null,
              newStatus: status,
              previousEndsAt: null,
              newEndsAt: endsAt,
              notes: 'Agreement created',
              changedByCharacterId: actor.characterId,
            },
          },
        },
        include: agreementInclude,
      });

      return agreement;
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'agreements.created',
      targetType: AUDIT_TARGET.AGREEMENT,
      targetId: created.id,
      metadata: {
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        discountPercent: dto.discountPercent,
        status,
        startsAt: toDateOnlyString(startsAt),
        endsAt: toDateOnlyString(endsAt),
      },
    });

    return this.toDto(created);
  }

  async update(
    id: string,
    dto: UpdateAgreementDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.prismaService.agreement.findUnique({
      where: { id },
      include: { establishment: { select: { id: true, name: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Agreement was not found');
    }

    const nextStatus = dto.status ?? existing.status;
    const nextStartsAt =
      dto.startsAt !== undefined ? parseDateOnly(dto.startsAt) : existing.startsAt;
    if (dto.startsAt !== undefined && !nextStartsAt) {
      throw new BadRequestException('Invalid startsAt');
    }

    let nextEndsAt = existing.endsAt;
    if (dto.endsAt !== undefined) {
      if (dto.endsAt === null || dto.endsAt === '') {
        nextEndsAt = null;
      } else {
        nextEndsAt = parseDateOnly(dto.endsAt);
        if (!nextEndsAt) {
          throw new BadRequestException('Invalid endsAt');
        }
      }
    }

    if (nextEndsAt && nextStartsAt && nextEndsAt < nextStartsAt) {
      throw new BadRequestException('endsAt must be on or after startsAt');
    }

    const nextPercent =
      dto.discountPercent !== undefined
        ? new Prisma.Decimal(dto.discountPercent)
        : existing.discountPercent;

    const percentChanged = !existing.discountPercent.equals(nextPercent);
    const statusChanged = nextStatus !== existing.status;
    const endsChanged =
      toDateOnlyString(nextEndsAt) !== toDateOnlyString(existing.endsAt);

    const updated = await this.prismaService.$transaction(async (tx) => {
      if (nextStatus === AgreementStatus.ACTIVE) {
        await this.deactivateOtherActiveAgreements(
          tx,
          existing.establishmentId,
          existing.id,
          actor.characterId,
        );
      }

      const agreement = await tx.agreement.update({
        where: { id },
        data: {
          status: nextStatus,
          startsAt: nextStartsAt ?? existing.startsAt,
          endsAt: nextEndsAt,
          discountPercent: nextPercent,
          notes:
            dto.notes === undefined ? undefined : dto.notes?.trim() || null,
        },
        include: agreementInclude,
      });

      if (percentChanged || statusChanged || endsChanged) {
        await tx.agreementHistory.create({
          data: {
            agreementId: id,
            previousPercent: existing.discountPercent,
            newPercent: nextPercent,
            previousStatus: existing.status,
            newStatus: nextStatus,
            previousEndsAt: existing.endsAt,
            newEndsAt: nextEndsAt,
            notes: dto.notes?.trim() || null,
            changedByCharacterId: actor.characterId,
          },
        });
      }

      return agreement;
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'agreements.updated',
      targetType: AUDIT_TARGET.AGREEMENT,
      targetId: id,
      metadata: {
        establishmentId: existing.establishmentId,
        establishmentName: existing.establishment.name,
        previousDiscountPercent: decimalToNumber(existing.discountPercent),
        newDiscountPercent: decimalToNumber(nextPercent),
        previousStatus: existing.status,
        newStatus: nextStatus,
      },
    });

    return this.toDto(updated);
  }

  async deactivate(id: string, actor: { accountId: string; characterId: string }) {
    return this.update(id, { status: AgreementStatus.INACTIVE }, actor);
  }

  async activate(id: string, actor: { accountId: string; characterId: string }) {
    return this.update(id, { status: AgreementStatus.ACTIVE }, actor);
  }

  async remove(id: string, actor: { accountId: string; characterId: string }) {
    const existing = await this.prismaService.agreement.findUnique({
      where: { id },
      include: { establishment: { select: { name: true } }, _count: { select: { invoices: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Agreement was not found');
    }

    if (existing.status !== AgreementStatus.DRAFT || existing._count.invoices > 0) {
      throw new BadRequestException(
        'Only draft agreements without invoices can be deleted. Deactivate instead.',
      );
    }

    await this.prismaService.agreement.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'agreements.deleted',
      targetType: AUDIT_TARGET.AGREEMENT,
      targetId: id,
      metadata: {
        establishmentName: existing.establishment.name,
        discountPercent: decimalToNumber(existing.discountPercent),
      },
    });

    return { id, deleted: true };
  }

  /**
   * Resolves the currently enforceable agreement for an establishment.
   */
  async resolveActiveAgreementForEstablishment(
    establishmentId: string,
  ): Promise<IActiveAgreementSnapshot | null> {
    const establishment = await this.prismaService.establishment.findUnique({
      where: { id: establishmentId },
      select: {
        id: true,
        name: true,
        agreements: {
          where: { status: AgreementStatus.ACTIVE },
          orderBy: { startsAt: 'desc' },
        },
      },
    });

    if (!establishment) {
      return null;
    }

    const active = establishment.agreements.find((item) =>
      isAgreementCurrentlyActive(item),
    );
    if (!active) {
      return null;
    }

    return {
      agreementId: active.id,
      establishmentId: establishment.id,
      establishmentName: establishment.name,
      discountPercent: decimalToNumber(active.discountPercent),
      startsAt: toDateOnlyString(active.startsAt),
      endsAt: toDateOnlyString(active.endsAt),
      status: active.status,
      notes: active.notes,
    };
  }

  /**
   * Resolves the currently enforceable agreement for a character via primary/active occupation.
   */
  async resolveActiveAgreementForCharacter(
    characterId: string,
  ): Promise<IActiveAgreementSnapshot | null> {
    const occupation = await this.prismaService.occupation.findFirst({
      where: {
        characterId,
        isActive: true,
        establishmentId: { not: null },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      select: {
        establishmentId: true,
        organization: true,
        establishment: {
          select: {
            id: true,
            name: true,
            agreements: {
              where: { status: AgreementStatus.ACTIVE },
              orderBy: { startsAt: 'desc' },
            },
          },
        },
      },
    });

    if (!occupation?.establishmentId) {
      return null;
    }

    return this.resolveActiveAgreementForEstablishment(occupation.establishmentId);
  }

  async resolveActiveAgreementForPatient(
    patientId: string,
  ): Promise<IActiveAgreementSnapshot | null> {
    const patient = await this.prismaService.patient.findUnique({
      where: { id: patientId },
      select: {
        establishmentId: true,
        linkedCharacterId: true,
      },
    });

    if (!patient) {
      return null;
    }

    // Patient workplace is the source of truth for clinical billing / convenios.
    if (patient.establishmentId) {
      return this.resolveActiveAgreementForEstablishment(patient.establishmentId);
    }

    // Legacy fallback: linked character occupation (pre-patient.establishmentId).
    if (patient.linkedCharacterId) {
      return this.resolveActiveAgreementForCharacter(patient.linkedCharacterId);
    }

    return null;
  }

  /** Billing helper: apply active convenio discount and return immutable snapshots. */
  async buildInvoiceDiscount(patientId: string, originalAmount: number) {
    const agreement = await this.resolveActiveAgreementForPatient(patientId);
    if (!agreement) {
      return {
        ...computeDiscount(originalAmount, 0),
        agreementId: null as string | null,
        establishmentName: null as string | null,
        agreement: null as IActiveAgreementSnapshot | null,
      };
    }

    return {
      ...computeDiscount(originalAmount, agreement.discountPercent),
      agreementId: agreement.agreementId,
      establishmentName: agreement.establishmentName,
      agreement,
    };
  }

  private async countPatientsWithActiveAgreement(): Promise<number> {
    const today = startOfUtcDay();
    const agreementFilter = {
      status: AgreementStatus.ACTIVE,
      startsAt: { lte: today },
      OR: [{ endsAt: null }, { endsAt: { gte: today } }],
    };

    return this.prismaService.patient.count({
      where: {
        OR: [
          {
            establishmentId: { not: null },
            establishment: {
              agreements: { some: agreementFilter },
            },
          },
          {
            establishmentId: null,
            linkedCharacterId: { not: null },
            linkedCharacter: {
              occupations: {
                some: {
                  isActive: true,
                  establishmentId: { not: null },
                  establishment: {
                    agreements: { some: agreementFilter },
                  },
                },
              },
            },
          },
        ],
      },
    });
  }

  private async markExpiredAgreements() {
    const today = startOfUtcDay();
    await this.prismaService.agreement.updateMany({
      where: {
        status: AgreementStatus.ACTIVE,
        endsAt: { lt: today },
      },
      data: { status: AgreementStatus.EXPIRED },
    });
  }

  private async deactivateOtherActiveAgreements(
    tx: Prisma.TransactionClient,
    establishmentId: string,
    keepAgreementId: string | null,
    actorCharacterId: string,
  ) {
    const others = await tx.agreement.findMany({
      where: {
        establishmentId,
        status: AgreementStatus.ACTIVE,
        ...(keepAgreementId ? { NOT: { id: keepAgreementId } } : {}),
      },
    });

    for (const other of others) {
      await tx.agreement.update({
        where: { id: other.id },
        data: { status: AgreementStatus.INACTIVE },
      });
      await tx.agreementHistory.create({
        data: {
          agreementId: other.id,
          previousPercent: other.discountPercent,
          newPercent: other.discountPercent,
          previousStatus: other.status,
          newStatus: AgreementStatus.INACTIVE,
          previousEndsAt: other.endsAt,
          newEndsAt: other.endsAt,
          notes: 'Superseded by another active agreement',
          changedByCharacterId: actorCharacterId,
        },
      });
    }
  }

  private toDto(row: Prisma.AgreementGetPayload<{ include: typeof agreementInclude }>) {
    return {
      id: row.id,
      establishmentId: row.establishmentId,
      establishment: row.establishment,
      status: row.status,
      isCurrentlyActive: isAgreementCurrentlyActive(row),
      startsAt: toDateOnlyString(row.startsAt),
      endsAt: toDateOnlyString(row.endsAt),
      discountPercent: decimalToNumber(row.discountPercent),
      notes: row.notes,
      createdByCharacter: row.createdByCharacter,
      history: row.history.map((entry) => ({
        id: entry.id,
        previousPercent:
          entry.previousPercent === null ? null : decimalToNumber(entry.previousPercent),
        newPercent: decimalToNumber(entry.newPercent),
        previousStatus: entry.previousStatus,
        newStatus: entry.newStatus,
        previousEndsAt: toDateOnlyString(entry.previousEndsAt),
        newEndsAt: toDateOnlyString(entry.newEndsAt),
        notes: entry.notes,
        changedByCharacter: entry.changedByCharacter,
        createdAt: entry.createdAt.toISOString(),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
