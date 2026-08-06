import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InstitutionalPaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import {
  CreateInstitutionalPaymentDto,
  UpdateInstitutionalPaymentDto,
  VoidInstitutionalPaymentDto,
} from './dto/institutional-payment.dto';
import {
  buildInvoiceEstablishmentFilter,
  decimalToNumber,
  parseDateOnly,
  roundMoney,
  toDateOnlyString,
} from './utils/institutional-payments.utils';

const paymentInclude = {
  establishment: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      status: true,
    },
  },
  createdByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  updatedByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  voidedByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  allocations: {
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          treatmentName: true,
          issuedAt: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              recordNumber: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.InstitutionalPaymentInclude;

type PaymentRow = Prisma.InstitutionalPaymentGetPayload<{ include: typeof paymentInclude }>;

@Injectable()
export class InstitutionalPaymentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard() {
    const establishments = await this.prismaService.establishment.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, logoUrl: true },
    });

    const summaries = await Promise.all(
      establishments.map((item) => this.buildOrganizationSummary(item)),
    );

    const withActivity = summaries.filter(
      (item) => item.totalBilled > 0 || item.totalPaid > 0 || item.paymentCount > 0,
    );

    const totalBilled = roundMoney(withActivity.reduce((sum, item) => sum + item.totalBilled, 0));
    const totalPaid = roundMoney(withActivity.reduce((sum, item) => sum + item.totalPaid, 0));
    const outstanding = roundMoney(totalBilled - totalPaid);
    const indebted = withActivity.filter((item) => item.outstanding > 0.009);
    const current = withActivity.filter(
      (item) => item.totalBilled > 0 && item.outstanding <= 0.009,
    );

    const latestPayment = await this.prismaService.institutionalPayment.findFirst({
      where: { status: InstitutionalPaymentStatus.ACTIVE },
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      include: paymentInclude,
    });

    const paymentCount = await this.prismaService.institutionalPayment.count({
      where: { status: InstitutionalPaymentStatus.ACTIVE },
    });

    return {
      summary: {
        totalBilled,
        totalPaid,
        outstanding,
        paymentCount,
        organizationsWithDebt: indebted.length,
        organizationsCurrent: current.length,
        organizationsTracked: withActivity.length,
        lastPayment: latestPayment ? this.toPaymentDto(latestPayment) : null,
      },
      organizations: withActivity.sort((a, b) => b.outstanding - a.outstanding),
      indebtedOrganizations: indebted,
      currentOrganizations: current,
      /** Full active catalog for payment registration (includes orgs without activity yet). */
      catalog: establishments.map((item) => ({
        establishmentId: item.id,
        name: item.name,
        slug: item.slug,
        logoUrl: item.logoUrl,
      })),
    };
  }

  async listOrganizations() {
    const dashboard = await this.getDashboard();
    return dashboard.organizations;
  }

  async getOrganizationDetail(establishmentId: string) {
    const establishment = await this.requireEstablishment(establishmentId);
    const [summary, invoices, payments] = await Promise.all([
      this.buildOrganizationSummary(establishment),
      this.listOrganizationInvoices(establishment),
      this.prismaService.institutionalPayment.findMany({
        where: { establishmentId },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        include: paymentInclude,
      }),
    ]);

    return {
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
        logoUrl: establishment.logoUrl,
        status: establishment.status,
      },
      summary,
      invoices,
      payments: payments.map((item) => this.toPaymentDto(item)),
    };
  }

  async listPayments(filters: {
    establishmentId?: string;
    status?: InstitutionalPaymentStatus;
  } = {}) {
    const rows = await this.prismaService.institutionalPayment.findMany({
      where: {
        establishmentId: filters.establishmentId || undefined,
        status: filters.status || undefined,
      },
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      include: paymentInclude,
      take: 200,
    });
    return rows.map((item) => this.toPaymentDto(item));
  }

  async getPayment(id: string) {
    const payment = await this.requirePayment(id);
    return this.toPaymentDto(payment);
  }

  async create(
    dto: CreateInstitutionalPaymentDto,
    actor: { accountId: string; characterId: string },
  ) {
    const establishment = await this.requireEstablishment(dto.establishmentId);
    const amount = roundMoney(dto.amount);
    const paymentDate = this.requireDate(dto.paymentDate, 'paymentDate');
    const periodStart = this.requireDate(dto.periodStart, 'periodStart');
    const periodEnd = this.requireDate(dto.periodEnd, 'periodEnd');
    this.assertPeriod(periodStart, periodEnd);

    const allocations = await this.validateAllocations(
      establishment,
      amount,
      dto.allocations ?? [],
    );

    const created = await this.prismaService.$transaction(async (tx) => {
      const payment = await tx.institutionalPayment.create({
        data: {
          establishmentId: establishment.id,
          organizationName: establishment.name,
          establishmentSlug: establishment.slug,
          amount,
          paymentDate,
          periodStart,
          periodEnd,
          notes: dto.notes?.trim() || null,
          status: InstitutionalPaymentStatus.ACTIVE,
          createdByCharacterId: actor.characterId,
          updatedByCharacterId: actor.characterId,
          allocations: allocations.length
            ? {
                create: allocations.map((item) => ({
                  invoiceId: item.invoiceId,
                  amount: item.amount,
                })),
              }
            : undefined,
        },
        include: paymentInclude,
      });
      return payment;
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'institutional-payments.created',
      targetType: AUDIT_TARGET.INSTITUTIONAL_PAYMENT,
      targetId: created.id,
      metadata: {
        establishmentId: establishment.id,
        organizationName: establishment.name,
        amount,
        paymentDate: toDateOnlyString(paymentDate),
        periodStart: toDateOnlyString(periodStart),
        periodEnd: toDateOnlyString(periodEnd),
        allocationCount: allocations.length,
      },
    });

    return this.toPaymentDto(created);
  }

  async update(
    id: string,
    dto: UpdateInstitutionalPaymentDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.requirePayment(id);
    if (existing.status === InstitutionalPaymentStatus.VOID) {
      throw new BadRequestException('Voided payments cannot be edited');
    }

    const establishment = existing.establishment;
    const amount =
      dto.amount === undefined ? decimalToNumber(existing.amount) : roundMoney(dto.amount);
    const paymentDate =
      dto.paymentDate === undefined
        ? existing.paymentDate
        : this.requireDate(dto.paymentDate, 'paymentDate');
    const periodStart =
      dto.periodStart === undefined
        ? existing.periodStart
        : this.requireDate(dto.periodStart, 'periodStart');
    const periodEnd =
      dto.periodEnd === undefined
        ? existing.periodEnd
        : this.requireDate(dto.periodEnd, 'periodEnd');
    this.assertPeriod(periodStart, periodEnd);

    const notes =
      dto.notes === undefined ? existing.notes : dto.notes?.trim() || null;

    const allocations =
      dto.allocations === undefined
        ? null
        : await this.validateAllocations(establishment, amount, dto.allocations, id);

    const updated = await this.prismaService.$transaction(async (tx) => {
      if (allocations) {
        await tx.institutionalPaymentAllocation.deleteMany({
          where: { paymentId: id },
        });
      }

      return tx.institutionalPayment.update({
        where: { id },
        data: {
          amount,
          paymentDate,
          periodStart,
          periodEnd,
          notes,
          updatedByCharacterId: actor.characterId,
          ...(allocations
            ? {
                allocations: {
                  create: allocations.map((item) => ({
                    invoiceId: item.invoiceId,
                    amount: item.amount,
                  })),
                },
              }
            : {}),
        },
        include: paymentInclude,
      });
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'institutional-payments.updated',
      targetType: AUDIT_TARGET.INSTITUTIONAL_PAYMENT,
      targetId: id,
      metadata: {
        establishmentId: establishment.id,
        organizationName: existing.organizationName,
        previousAmount: decimalToNumber(existing.amount),
        amount,
        paymentDate: toDateOnlyString(paymentDate),
        periodStart: toDateOnlyString(periodStart),
        periodEnd: toDateOnlyString(periodEnd),
        notesChanged: notes !== existing.notes,
        allocationsReplaced: Boolean(allocations),
      },
    });

    return this.toPaymentDto(updated);
  }

  async voidPayment(
    id: string,
    dto: VoidInstitutionalPaymentDto,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.requirePayment(id);
    if (existing.status === InstitutionalPaymentStatus.VOID) {
      return this.toPaymentDto(existing);
    }

    const updated = await this.prismaService.institutionalPayment.update({
      where: { id },
      data: {
        status: InstitutionalPaymentStatus.VOID,
        voidedAt: new Date(),
        voidReason: dto.reason?.trim() || null,
        voidedByCharacterId: actor.characterId,
        updatedByCharacterId: actor.characterId,
      },
      include: paymentInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: 'institutional-payments.voided',
      targetType: AUDIT_TARGET.INSTITUTIONAL_PAYMENT,
      targetId: id,
      metadata: {
        establishmentId: existing.establishmentId,
        organizationName: existing.organizationName,
        amount: decimalToNumber(existing.amount),
        periodStart: toDateOnlyString(existing.periodStart),
        periodEnd: toDateOnlyString(existing.periodEnd),
        reason: dto.reason?.trim() || null,
      },
    });

    return this.toPaymentDto(updated);
  }

  private async buildOrganizationSummary(establishment: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  }) {
    const invoiceWhere: Prisma.PatientInvoiceWhereInput =
      buildInvoiceEstablishmentFilter(establishment);

    const [invoiceAgg, paymentAgg, lastPayment, invoiceCount] = await Promise.all([
      this.prismaService.patientInvoice.aggregate({
        where: invoiceWhere,
        _sum: { amount: true },
      }),
      this.prismaService.institutionalPayment.aggregate({
        where: {
          establishmentId: establishment.id,
          status: InstitutionalPaymentStatus.ACTIVE,
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prismaService.institutionalPayment.findFirst({
        where: {
          establishmentId: establishment.id,
          status: InstitutionalPaymentStatus.ACTIVE,
        },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          periodStart: true,
          periodEnd: true,
        },
      }),
      this.prismaService.patientInvoice.count({ where: invoiceWhere }),
    ]);

    const totalBilled = decimalToNumber(invoiceAgg._sum.amount);
    const totalPaid = decimalToNumber(paymentAgg._sum.amount);
    const outstanding = roundMoney(totalBilled - totalPaid);

    return {
      establishmentId: establishment.id,
      name: establishment.name,
      slug: establishment.slug,
      logoUrl: establishment.logoUrl ?? null,
      totalBilled,
      totalPaid,
      outstanding,
      invoiceCount,
      paymentCount: paymentAgg._count._all,
      isIndebted: outstanding > 0.009,
      isCurrent: totalBilled > 0 && outstanding <= 0.009,
      lastPayment: lastPayment
        ? {
            id: lastPayment.id,
            amount: decimalToNumber(lastPayment.amount),
            paymentDate: toDateOnlyString(lastPayment.paymentDate),
            periodStart: toDateOnlyString(lastPayment.periodStart),
            periodEnd: toDateOnlyString(lastPayment.periodEnd),
          }
        : null,
    };
  }

  private async listOrganizationInvoices(establishment: {
    id: string;
    slug: string;
    name: string;
  }) {
    const invoices = await this.prismaService.patientInvoice.findMany({
      where: buildInvoiceEstablishmentFilter(establishment),
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
      take: 300,
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        originalAmount: true,
        discountPercent: true,
        discountAmount: true,
        treatmentName: true,
        issuedAt: true,
        billingOrganization: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            recordNumber: true,
          },
        },
        institutionalPaymentAllocations: {
          where: {
            payment: { status: InstitutionalPaymentStatus.ACTIVE },
          },
          select: { amount: true },
        },
      },
    });

    return invoices.map((invoice) => {
      const allocated = roundMoney(
        invoice.institutionalPaymentAllocations.reduce(
          (sum, item) => sum + decimalToNumber(item.amount),
          0,
        ),
      );
      const amount = decimalToNumber(invoice.amount);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        originalAmount: decimalToNumber(invoice.originalAmount),
        discountPercent: decimalToNumber(invoice.discountPercent),
        discountAmount: decimalToNumber(invoice.discountAmount),
        treatmentName: invoice.treatmentName,
        issuedAt: toDateOnlyString(invoice.issuedAt),
        billingOrganization: invoice.billingOrganization,
        allocated,
        remaining: roundMoney(Math.max(0, amount - allocated)),
        patient: {
          id: invoice.patient.id,
          recordNumber: invoice.patient.recordNumber,
          fullName: `${invoice.patient.firstName} ${invoice.patient.lastName}`.trim(),
        },
      };
    });
  }

  private async validateAllocations(
    establishment: { id: string; slug: string; name: string },
    paymentAmount: number,
    allocations: Array<{ invoiceId: string; amount: number }>,
    excludePaymentId?: string,
  ) {
    if (!allocations.length) {
      return [] as Array<{ invoiceId: string; amount: number }>;
    }

    const normalized = allocations.map((item) => ({
      invoiceId: item.invoiceId,
      amount: roundMoney(item.amount),
    }));

    const uniqueIds = new Set(normalized.map((item) => item.invoiceId));
    if (uniqueIds.size !== normalized.length) {
      throw new BadRequestException('Duplicate invoice allocations are not allowed');
    }

    const allocationTotal = roundMoney(
      normalized.reduce((sum, item) => sum + item.amount, 0),
    );
    if (allocationTotal - paymentAmount > 0.009) {
      throw new BadRequestException(
        'Allocation total cannot exceed the institutional payment amount',
      );
    }

    const invoices = await this.prismaService.patientInvoice.findMany({
      where: {
        id: { in: normalized.map((item) => item.invoiceId) },
        ...buildInvoiceEstablishmentFilter(establishment),
      },
      select: {
        id: true,
        amount: true,
        invoiceNumber: true,
        institutionalPaymentAllocations: {
          where: {
            payment: {
              status: InstitutionalPaymentStatus.ACTIVE,
              ...(excludePaymentId ? { id: { not: excludePaymentId } } : {}),
            },
          },
          select: { amount: true },
        },
      },
    });

    if (invoices.length !== normalized.length) {
      throw new BadRequestException(
        'One or more invoices do not belong to this organization',
      );
    }

    for (const allocation of normalized) {
      const invoice = invoices.find((item) => item.id === allocation.invoiceId);
      if (!invoice) {
        throw new BadRequestException(`Invoice ${allocation.invoiceId} was not found`);
      }
      const alreadyAllocated = roundMoney(
        invoice.institutionalPaymentAllocations.reduce(
          (sum, item) => sum + decimalToNumber(item.amount),
          0,
        ),
      );
      const invoiceAmount = decimalToNumber(invoice.amount);
      if (alreadyAllocated + allocation.amount - invoiceAmount > 0.009) {
        throw new BadRequestException(
          `Allocation exceeds remaining balance on invoice #${invoice.invoiceNumber}`,
        );
      }
    }

    return normalized;
  }

  private async requireEstablishment(id: string) {
    const establishment = await this.prismaService.establishment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        status: true,
      },
    });
    if (!establishment) {
      throw new NotFoundException('Establishment was not found');
    }
    return establishment;
  }

  private async requirePayment(id: string) {
    const payment = await this.prismaService.institutionalPayment.findUnique({
      where: { id },
      include: paymentInclude,
    });
    if (!payment) {
      throw new NotFoundException('Institutional payment was not found');
    }
    return payment;
  }

  private requireDate(value: string, field: string) {
    const date = parseDateOnly(value);
    if (!date) {
      throw new BadRequestException(`${field} must be a valid date (YYYY-MM-DD)`);
    }
    return date;
  }

  private assertPeriod(start: Date, end: Date) {
    if (end < start) {
      throw new BadRequestException('periodEnd must be on or after periodStart');
    }
  }

  private toPaymentDto(payment: PaymentRow) {
    return {
      id: payment.id,
      establishmentId: payment.establishmentId,
      organizationName: payment.organizationName,
      establishmentSlug: payment.establishmentSlug,
      establishment: payment.establishment,
      amount: decimalToNumber(payment.amount),
      paymentDate: toDateOnlyString(payment.paymentDate),
      periodStart: toDateOnlyString(payment.periodStart),
      periodEnd: toDateOnlyString(payment.periodEnd),
      notes: payment.notes,
      status: payment.status,
      voidedAt: payment.voidedAt?.toISOString() ?? null,
      voidReason: payment.voidReason,
      voidedByCharacter: payment.voidedByCharacter,
      createdByCharacter: payment.createdByCharacter,
      updatedByCharacter: payment.updatedByCharacter,
      allocations: payment.allocations.map((item) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        amount: decimalToNumber(item.amount),
        invoice: {
          id: item.invoice.id,
          invoiceNumber: item.invoice.invoiceNumber,
          amount: decimalToNumber(item.invoice.amount),
          treatmentName: item.invoice.treatmentName,
          issuedAt: toDateOnlyString(item.invoice.issuedAt),
          patient: {
            id: item.invoice.patient.id,
            recordNumber: item.invoice.patient.recordNumber,
            fullName: `${item.invoice.patient.firstName} ${item.invoice.patient.lastName}`.trim(),
          },
        },
      })),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
