import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcademyApplicationType, Prisma } from '@prisma/client';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { DiscordWebhookService } from '../webhooks/discord-webhook.service';

const KNOWN_APPLICATION_TYPES: AcademyApplicationType[] = [
  AcademyApplicationType.ACADEMY,
  AcademyApplicationType.TRANSFER,
];

const configInclude = {
  openedByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
  closedByCharacter: {
    select: { id: true, firstName: true, lastName: true },
  },
} satisfies Prisma.ApplicationConfigurationInclude;

@Injectable()
export class ApplicationConfigurationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditService: AuditService,
    private readonly discordWebhookService: DiscordWebhookService,
  ) {}

  async ensureDefaults() {
    for (const type of KNOWN_APPLICATION_TYPES) {
      await this.prismaService.applicationConfiguration.upsert({
        where: { type },
        update: {},
        create: {
          type,
          isOpen: false,
        },
      });
    }
  }

  async listPublicIntake() {
    await this.ensureDefaults();
    const rows = await this.prismaService.applicationConfiguration.findMany({
      orderBy: { type: 'asc' },
      include: configInclude,
    });
    return rows.map((row) => this.toPublicDto(row));
  }

  async listConfigurations() {
    await this.ensureDefaults();
    const rows = await this.prismaService.applicationConfiguration.findMany({
      orderBy: { type: 'asc' },
      include: configInclude,
    });
    return rows.map((row) => this.toAdminDto(row));
  }

  async getByType(type: AcademyApplicationType) {
    await this.ensureDefaults();
    const row = await this.prismaService.applicationConfiguration.findUnique({
      where: { type },
      include: configInclude,
    });
    if (!row) {
      throw new NotFoundException(`Application configuration for ${type} was not found`);
    }
    return row;
  }

  async assertOpen(type: AcademyApplicationType) {
    const config = await this.getByType(type);
    if (!config.isOpen) {
      throw new BadRequestException(
        type === AcademyApplicationType.ACADEMY
          ? 'La convocatoria de Academia está cerrada'
          : 'La convocatoria de Traslado está cerrada',
      );
    }
    return config;
  }

  async setOpenState(
    type: AcademyApplicationType,
    isOpen: boolean,
    actor: { accountId: string; characterId: string },
  ) {
    const existing = await this.getByType(type);
    if (existing.isOpen === isOpen) {
      return this.toAdminDto(existing);
    }

    const now = new Date();
    const updated = await this.prismaService.applicationConfiguration.update({
      where: { type },
      data: isOpen
        ? {
            isOpen: true,
            openedAt: now,
            openedByCharacterId: actor.characterId,
            closedAt: null,
            closedByCharacterId: null,
          }
        : {
            isOpen: false,
            closedAt: now,
            closedByCharacterId: actor.characterId,
          },
      include: configInclude,
    });

    await this.auditService.create({
      actorAccountId: actor.accountId,
      actorCharacterId: actor.characterId,
      action: isOpen ? 'applications.intake_opened' : 'applications.intake_closed',
      targetType: AUDIT_TARGET.ACADEMY,
      targetId: updated.id,
      metadata: {
        type,
        isOpen,
        previousIsOpen: existing.isOpen,
      },
    });

    if (isOpen) {
      void this.discordWebhookService
        .notifyApplicationsOpened({
          type,
          openedAt: updated.openedAt,
        })
        .catch(() => undefined);
    }

    return this.toAdminDto(updated);
  }

  async getDashboardStats() {
    await this.ensureDefaults();

    const [configs, byStatus, byType] = await Promise.all([
      this.prismaService.applicationConfiguration.findMany({
        orderBy: { type: 'asc' },
        include: configInclude,
      }),
      this.prismaService.academyApplication.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prismaService.academyApplication.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((row) => [row.status, row._count._all]),
    ) as Record<string, number>;
    const typeMap = Object.fromEntries(
      byType.map((row) => [row.type, row._count._all]),
    ) as Record<string, number>;

    return {
      openConvocations: configs.filter((item) => item.isOpen).length,
      closedConvocations: configs.filter((item) => !item.isOpen).length,
      pending: statusMap.PENDING ?? 0,
      underReview: statusMap.UNDER_REVIEW ?? 0,
      accepted: statusMap.ACCEPTED ?? 0,
      rejected: statusMap.REJECTED ?? 0,
      withdrawn: statusMap.WITHDRAWN ?? 0,
      byType: {
        ACADEMY: typeMap.ACADEMY ?? 0,
        TRANSFER: typeMap.TRANSFER ?? 0,
      },
      configurations: configs.map((row) => this.toAdminDto(row)),
    };
  }

  private toPublicDto(
    row: Prisma.ApplicationConfigurationGetPayload<{ include: typeof configInclude }>,
  ) {
    return {
      type: row.type,
      isOpen: row.isOpen,
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      updatedAt: row.updatedAt,
    };
  }

  private toAdminDto(
    row: Prisma.ApplicationConfigurationGetPayload<{ include: typeof configInclude }>,
  ) {
    return {
      id: row.id,
      type: row.type,
      isOpen: row.isOpen,
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      openedByCharacter: row.openedByCharacter,
      closedByCharacter: row.closedByCharacter,
    };
  }
}
