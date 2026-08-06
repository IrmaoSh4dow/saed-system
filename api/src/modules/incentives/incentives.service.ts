import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StaffStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { DiscordWebhookService } from '../webhooks/discord-webhook.service';
import {
  PayIncentiveDto,
  SearchIncentivePaymentsDto,
  UpdateIncentiveConfigurationDto,
} from './dto/incentive.dto';
import {
  DEFAULT_INCENTIVE_AMOUNTS,
  INCENTIVE_CYCLE_DAYS,
  INCENTIVE_OVERDUE_DAYS,
  INCENTIVE_RECENT_HOURS,
  IncentiveEligibilityStatus,
} from './incentives.constants';

const staffInclude = {
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      status: true,
    },
  },
  rank: { select: { id: true, name: true, slug: true, sortOrder: true } },
  department: { select: { id: true, name: true, slug: true, imageUrl: true } },
} satisfies Prisma.StaffProfileInclude;

type StaffRow = Prisma.StaffProfileGetPayload<{ include: typeof staffInclude }>;

@Injectable()
export class IncentivesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly discordWebhookService: DiscordWebhookService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const monthStart = startOfUtcMonth(now);
    const yearStart = startOfUtcYear(now);

    const [staffRows, monthAgg, yearAgg, recentPayments] = await Promise.all([
      this.loadStaffWithLatestPayments(),
      this.prismaService.incentivePayment.aggregate({
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prismaService.incentivePayment.aggregate({
        where: { paidAt: { gte: yearStart } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prismaService.incentivePayment.findMany({
        take: 8,
        orderBy: { paidAt: 'desc' },
        include: this.paymentInclude(),
      }),
    ]);

    const cards = await this.toStaffCards(staffRows, now);
    const eligible = cards.filter(
      (item) => item.status === IncentiveEligibilityStatus.AVAILABLE || item.status === IncentiveEligibilityStatus.OVERDUE,
    );
    const pending = cards.filter(
      (item) => item.status === IncentiveEligibilityStatus.NOT_AVAILABLE || item.status === IncentiveEligibilityStatus.PAID_RECENTLY,
    );
    const upcoming = [...cards]
      .filter((item) => item.nextEligibleAt)
      .sort((a, b) => String(a.nextEligibleAt).localeCompare(String(b.nextEligibleAt)))
      .slice(0, 8);

    return {
      stats: {
        paidThisMonth: monthAgg._count._all,
        totalPaidThisMonth: decimalToNumber(monthAgg._sum.amount),
        paidThisYear: yearAgg._count._all,
        totalPaidThisYear: decimalToNumber(yearAgg._sum.amount),
        eligibleNow: eligible.length,
        pendingCycle: pending.length,
        staffTracked: cards.length,
      },
      eligible,
      upcoming,
      recentPayments: recentPayments.map((item) => this.toPayment(item)),
    };
  }

  async listStaff(query = '') {
    const now = new Date();
    const rows = await this.loadStaffWithLatestPayments(query);
    const cards = await this.toStaffCards(rows, now);

    const order: Record<string, number> = {
      [IncentiveEligibilityStatus.OVERDUE]: 0,
      [IncentiveEligibilityStatus.AVAILABLE]: 1,
      [IncentiveEligibilityStatus.PAID_RECENTLY]: 2,
      [IncentiveEligibilityStatus.NOT_AVAILABLE]: 3,
      [IncentiveEligibilityStatus.NO_CONFIGURATION]: 4,
      [IncentiveEligibilityStatus.INACTIVE_STAFF]: 5,
    };

    return cards.sort((a, b) => {
      const statusDiff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
      if (statusDiff !== 0) return statusDiff;
      return a.fullName.localeCompare(b.fullName);
    });
  }

  async getStaffDetail(staffProfileId: string) {
    const staff = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      include: staffInclude,
    });
    if (!staff) {
      throw new NotFoundException('Staff profile was not found');
    }

    const [card] = await this.toStaffCards([staff], new Date());
    const history = await this.prismaService.incentivePayment.findMany({
      where: { staffProfileId },
      orderBy: { paidAt: 'desc' },
      include: this.paymentInclude(),
    });

    return {
      ...card,
      history: history.map((item) => this.toPayment(item)),
    };
  }

  async pay(
    staffProfileId: string,
    dto: PayIncentiveDto,
    actor: { accountId: string; characterId: string },
  ) {
    const staff = await this.prismaService.staffProfile.findUnique({
      where: { id: staffProfileId },
      include: staffInclude,
    });
    if (!staff) {
      throw new NotFoundException('Staff profile was not found');
    }
    if (staff.status !== StaffStatus.ACTIVE) {
      throw new BadRequestException('Only active staff can receive incentives');
    }

    const now = new Date();
    const lastPayment = await this.prismaService.incentivePayment.findFirst({
      where: { staffProfileId },
      orderBy: { paidAt: 'desc' },
    });

    if (lastPayment && lastPayment.nextEligibleAt > now) {
      throw new ConflictException({
        message: `Este empleado no es elegible hasta ${lastPayment.nextEligibleAt.toISOString()}.`,
        errors: [
          {
            code: 'INCENTIVE_CYCLE_ACTIVE',
            nextEligibleAt: lastPayment.nextEligibleAt.toISOString(),
          },
        ],
      });
    }

    const configuration = await this.prismaService.incentiveConfiguration.findUnique({
      where: { rankId: staff.rankId },
    });
    if (!configuration || !configuration.isActive) {
      throw new BadRequestException('No hay configuración de incentivo para este rango');
    }

    const amount = decimalToNumber(configuration.amount);
    if (amount <= 0) {
      throw new BadRequestException('El incentivo configurado para este rango es 0');
    }

    const nextEligibleAt = addDays(now, INCENTIVE_CYCLE_DAYS);

    const payment = await this.prismaService.$transaction(async (tx) => {
      const latest = await tx.incentivePayment.findFirst({
        where: { staffProfileId },
        orderBy: { paidAt: 'desc' },
      });
      if (latest && latest.nextEligibleAt > now) {
        throw new ConflictException({
          message: `Este empleado no es elegible hasta ${latest.nextEligibleAt.toISOString()}.`,
          errors: [
            {
              code: 'INCENTIVE_CYCLE_ACTIVE',
              nextEligibleAt: latest.nextEligibleAt.toISOString(),
            },
          ],
        });
      }

      return tx.incentivePayment.create({
        data: {
          staffProfileId: staff.id,
          paidByCharacterId: actor.characterId,
          amount: configuration.amount,
          rankId: staff.rank.id,
          rankName: staff.rank.name,
          rankSlug: staff.rank.slug,
          paidAt: now,
          nextEligibleAt,
          notes: dto.notes?.trim() || null,
        },
        include: this.paymentInclude(),
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'incentives.paid',
      targetType: AUDIT_TARGET.INCENTIVE,
      targetId: payment.id,
      metadata: {
        staffProfileId: staff.id,
        employeeNumber: staff.employeeNumber,
        recipientName: `${staff.character.firstName} ${staff.character.lastName}`,
        amount,
        rankId: staff.rank.id,
        rankName: staff.rank.name,
        rankSlug: staff.rank.slug,
        paidAt: now.toISOString(),
        nextEligibleAt: nextEligibleAt.toISOString(),
      },
    });

    // Optional Discord: set DISCORD_INCENTIVES_WEBHOOK_URL when ready to broadcast payments.
    void this.discordWebhookService.sendIncentiveEmbed({
      title: 'Incentivo registrado',
      color: 0xd91e1e,
      timestamp: now.toISOString(),
      fields: [
        {
          name: 'Empleado',
          value: `${staff.character.firstName} ${staff.character.lastName} (${staff.employeeNumber})`,
          inline: true,
        },
        { name: 'Monto', value: `$${amount.toFixed(2)}`, inline: true },
        { name: 'Rango', value: staff.rank.name, inline: true },
      ],
    });

    return this.toPayment(payment);
  }

  async listPayments(query: SearchIncentivePaymentsDto = {}) {
    const where: Prisma.IncentivePaymentWhereInput = {};
    const and: Prisma.IncentivePaymentWhereInput[] = [];

    if (query.staffProfileId) {
      and.push({ staffProfileId: query.staffProfileId });
    }
    if (query.rankId) {
      and.push({ rankId: query.rankId });
    }
    if (query.paidByCharacterId) {
      and.push({ paidByCharacterId: query.paidByCharacterId });
    }
    if (query.departmentId) {
      and.push({ staffProfile: { departmentId: query.departmentId } });
    }
    if (query.from || query.to) {
      and.push({
        paidAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? endOfDay(new Date(query.to)) : undefined,
        },
      });
    }

    const term = query.q?.trim();
    if (term) {
      and.push({
        OR: [
          { rankName: { contains: term, mode: 'insensitive' } },
          { rankSlug: { contains: term, mode: 'insensitive' } },
          { staffProfile: { employeeNumber: { contains: term, mode: 'insensitive' } } },
          {
            staffProfile: {
              character: { firstName: { contains: term, mode: 'insensitive' } },
            },
          },
          {
            staffProfile: {
              character: { lastName: { contains: term, mode: 'insensitive' } },
            },
          },
          {
            staffProfile: {
              department: { name: { contains: term, mode: 'insensitive' } },
            },
          },
          {
            paidByCharacter: { firstName: { contains: term, mode: 'insensitive' } },
          },
          {
            paidByCharacter: { lastName: { contains: term, mode: 'insensitive' } },
          },
        ],
      });
    }

    if (and.length) {
      where.AND = and;
    }

    const payments = await this.prismaService.incentivePayment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      take: 200,
      include: this.paymentInclude(),
    });

    return payments.map((item) => this.toPayment(item));
  }

  async listConfigurations() {
    await this.ensureConfigurations();

    const rows = await this.prismaService.incentiveConfiguration.findMany({
      include: {
        rank: { select: { id: true, name: true, slug: true, sortOrder: true, isActive: true } },
        updatedByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { rank: { sortOrder: 'asc' } },
    });

    return rows
      .filter((row) => row.rank.slug !== 'citizen')
      .map((row) => ({
        id: row.id,
        rankId: row.rankId,
        amount: decimalToNumber(row.amount),
        isActive: row.isActive,
        rank: row.rank,
        updatedAt: row.updatedAt.toISOString(),
        updatedByCharacter: row.updatedByCharacter,
      }));
  }

  async updateConfiguration(
    rankId: string,
    dto: UpdateIncentiveConfigurationDto,
    actor: { accountId: string; characterId: string },
  ) {
    const rank = await this.prismaService.rank.findUnique({ where: { id: rankId } });
    if (!rank) {
      throw new NotFoundException('Rank was not found');
    }
    if (rank.slug === 'citizen') {
      throw new BadRequestException('Civilian rank cannot receive institutional incentives');
    }

    const configuration = await this.prismaService.incentiveConfiguration.upsert({
      where: { rankId },
      create: {
        rankId,
        amount: dto.amount,
        isActive: true,
        updatedByCharacterId: actor.characterId,
      },
      update: {
        amount: dto.amount,
        isActive: true,
        updatedByCharacterId: actor.characterId,
      },
      include: {
        rank: { select: { id: true, name: true, slug: true, sortOrder: true } },
        updatedByCharacter: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'incentives.configuration_updated',
      targetType: AUDIT_TARGET.INCENTIVE_CONFIGURATION,
      targetId: configuration.id,
      metadata: {
        rankId,
        rankName: rank.name,
        amount: dto.amount,
      },
    });

    return {
      id: configuration.id,
      rankId: configuration.rankId,
      amount: decimalToNumber(configuration.amount),
      isActive: configuration.isActive,
      rank: configuration.rank,
      updatedAt: configuration.updatedAt.toISOString(),
      updatedByCharacter: configuration.updatedByCharacter,
    };
  }

  async ensureConfigurations() {
    const ranks = await this.prismaService.rank.findMany({
      where: { slug: { not: 'citizen' }, isActive: true },
    });

    for (const rank of ranks) {
      const existing = await this.prismaService.incentiveConfiguration.findUnique({
        where: { rankId: rank.id },
      });
      if (existing) continue;

      await this.prismaService.incentiveConfiguration.create({
        data: {
          rankId: rank.id,
          amount: DEFAULT_INCENTIVE_AMOUNTS[rank.slug] ?? 0,
          isActive: true,
        },
      });
    }
  }

  private async loadStaffWithLatestPayments(query = '') {
    const term = query.trim();
    return this.prismaService.staffProfile.findMany({
      where: {
        status: { in: [StaffStatus.ACTIVE, StaffStatus.INACTIVE, StaffStatus.SUSPENDED] },
        ...(term.length >= 2
          ? {
              OR: [
                { employeeNumber: { contains: term, mode: 'insensitive' } },
                { character: { firstName: { contains: term, mode: 'insensitive' } } },
                { character: { lastName: { contains: term, mode: 'insensitive' } } },
                { department: { name: { contains: term, mode: 'insensitive' } } },
                { rank: { name: { contains: term, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: staffInclude,
      orderBy: [{ rank: { sortOrder: 'asc' } }, { employeeNumber: 'asc' }],
    });
  }

  private async toStaffCards(rows: StaffRow[], now: Date) {
    await this.ensureConfigurations();

    const configs = await this.prismaService.incentiveConfiguration.findMany();
    const configByRank = new Map(configs.map((item) => [item.rankId, item]));

    const staffIds = rows.map((item) => item.id);
    const latestPayments = staffIds.length
      ? await this.prismaService.incentivePayment.findMany({
          where: { staffProfileId: { in: staffIds } },
          orderBy: { paidAt: 'desc' },
          distinct: ['staffProfileId'],
        })
      : [];
    const lastByStaff = new Map(latestPayments.map((item) => [item.staffProfileId, item]));

    return rows.map((staff) => {
      const configuration = configByRank.get(staff.rankId) ?? null;
      const lastPayment = lastByStaff.get(staff.id) ?? null;
      const amount = configuration ? decimalToNumber(configuration.amount) : 0;
      const nextEligibleAt = lastPayment?.nextEligibleAt ?? null;
      const status = resolveStatus({
        staffStatus: staff.status,
        hasConfiguration: Boolean(configuration?.isActive && amount > 0),
        lastPaidAt: lastPayment?.paidAt ?? null,
        nextEligibleAt,
        now,
      });

      return {
        staffProfileId: staff.id,
        employeeNumber: staff.employeeNumber,
        callsign: staff.callsign,
        status: staff.status === StaffStatus.ACTIVE ? status : IncentiveEligibilityStatus.INACTIVE_STAFF,
        staffStatus: staff.status,
        fullName: `${staff.character.firstName} ${staff.character.lastName}`.trim(),
        firstName: staff.character.firstName,
        lastName: staff.character.lastName,
        avatarUrl: staff.character.avatarUrl,
        characterId: staff.character.id,
        rank: staff.rank,
        department: staff.department,
        incentiveAmount: amount,
        lastPaidAt: lastPayment?.paidAt?.toISOString() ?? null,
        nextEligibleAt: nextEligibleAt?.toISOString() ?? null,
        canPay:
          staff.status === StaffStatus.ACTIVE &&
          (status === IncentiveEligibilityStatus.AVAILABLE ||
            status === IncentiveEligibilityStatus.OVERDUE),
      };
    });
  }

  private paymentInclude() {
    return {
      staffProfile: {
        select: {
          id: true,
          employeeNumber: true,
          department: { select: { id: true, name: true } },
          character: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      paidByCharacter: {
        select: { id: true, firstName: true, lastName: true },
      },
      rank: { select: { id: true, name: true, slug: true } },
    } satisfies Prisma.IncentivePaymentInclude;
  }

  private toPayment(
    payment: Prisma.IncentivePaymentGetPayload<{ include: ReturnType<IncentivesService['paymentInclude']> }>,
  ) {
    return {
      id: payment.id,
      staffProfileId: payment.staffProfileId,
      amount: decimalToNumber(payment.amount),
      rankId: payment.rankId,
      rankName: payment.rankName,
      rankSlug: payment.rankSlug,
      paidAt: payment.paidAt.toISOString(),
      nextEligibleAt: payment.nextEligibleAt.toISOString(),
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      staff: {
        id: payment.staffProfile.id,
        employeeNumber: payment.staffProfile.employeeNumber,
        fullName: `${payment.staffProfile.character.firstName} ${payment.staffProfile.character.lastName}`,
        avatarUrl: payment.staffProfile.character.avatarUrl,
        department: payment.staffProfile.department,
      },
      paidBy: {
        id: payment.paidByCharacter.id,
        fullName: `${payment.paidByCharacter.firstName} ${payment.paidByCharacter.lastName}`,
      },
      rank: payment.rank,
    };
  }
}

function resolveStatus(input: {
  staffStatus: StaffStatus;
  hasConfiguration: boolean;
  lastPaidAt: Date | null;
  nextEligibleAt: Date | null;
  now: Date;
}): IncentiveEligibilityStatus {
  if (input.staffStatus !== StaffStatus.ACTIVE) {
    return IncentiveEligibilityStatus.INACTIVE_STAFF;
  }
  if (!input.hasConfiguration) {
    return IncentiveEligibilityStatus.NO_CONFIGURATION;
  }
  if (!input.nextEligibleAt || !input.lastPaidAt) {
    return IncentiveEligibilityStatus.AVAILABLE;
  }
  if (input.now < input.nextEligibleAt) {
    const recentCutoff = new Date(input.now.getTime() - INCENTIVE_RECENT_HOURS * 60 * 60 * 1000);
    if (input.lastPaidAt >= recentCutoff) {
      return IncentiveEligibilityStatus.PAID_RECENTLY;
    }
    return IncentiveEligibilityStatus.NOT_AVAILABLE;
  }

  const overdueAt = addDays(input.nextEligibleAt, INCENTIVE_OVERDUE_DAYS);
  if (input.now >= overdueAt) {
    return IncentiveEligibilityStatus.OVERDUE;
  }
  return IncentiveEligibilityStatus.AVAILABLE;
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function startOfUtcYear(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

function endOfDay(date: Date) {
  const next = new Date(date.getTime());
  next.setUTCHours(23, 59, 59, 999);
  return next;
}

function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}
