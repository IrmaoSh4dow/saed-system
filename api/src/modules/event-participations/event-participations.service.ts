import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService, AUDIT_TARGET } from '../audit/audit.service';
import { DiscordWebhookService } from '../webhooks/discord-webhook.service';
import {
  CreateEventParticipationDto,
  SearchEventParticipationsDto,
} from './dto/event-participation.dto';

const participationInclude = {
  submittedByCharacter: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      staffProfile: {
        select: {
          employeeNumber: true,
          rank: { select: { name: true } },
        },
      },
    },
  },
  participants: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      fullName: true,
      characterId: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.EventParticipationInclude;

@Injectable()
export class EventParticipationsService {
  private readonly logger = new Logger(EventParticipationsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly discordWebhookService: DiscordWebhookService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: SearchEventParticipationsDto, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    const where = this.buildSearchWhere(query);
    const items = await this.prismaService.eventParticipation.findMany({
      where,
      include: participationInclude,
      orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
      take,
    });

    return {
      items: items.map((item) => this.serialize(item)),
      total: await this.prismaService.eventParticipation.count({ where }),
    };
  }

  async getById(id: string) {
    const item = await this.prismaService.eventParticipation.findUnique({
      where: { id },
      include: participationInclude,
    });
    if (!item) {
      throw new NotFoundException('Event participation was not found');
    }
    return this.serialize(item);
  }

  async create(characterId: string, accountId: string, dto: CreateEventParticipationDto) {
    await this.requireStaffProfile(characterId);

    const eventDate = parseDateOnly(dto.eventDate);
    const organizers = normalizeRequired(dto.organizers, 'organizers');
    const payerFullName = normalizeRequired(dto.payerFullName, 'payerFullName');
    const authorizingOfficerName = normalizeRequired(
      dto.authorizingOfficerName,
      'authorizingOfficerName',
    );
    const saedLeadName = normalizeRequired(dto.saedLeadName, 'saedLeadName');
    const participants = normalizeParticipants(dto.participants);

    const created = await this.prismaService.eventParticipation.create({
      data: {
        eventDate,
        organizers,
        payerFullName,
        authorizingOfficerName,
        saedLeadName,
        submittedByCharacterId: characterId,
        participants: {
          create: participants.map((participant, index) => ({
            fullName: participant.fullName,
            characterId: participant.characterId ?? null,
            sortOrder: index,
          })),
        },
      },
      include: participationInclude,
    });

    const serialized = this.serialize(created);
    const discordDelivered = await this.notifyDiscord(serialized);
    if (discordDelivered !== created.discordDelivered) {
      await this.prismaService.eventParticipation.update({
        where: { id: created.id },
        data: { discordDelivered },
      });
      serialized.discordDelivered = discordDelivered;
    }

    await this.auditService.create({
      actorAccountId: accountId,
      actorCharacterId: characterId,
      action: 'event-participations.create',
      targetType: AUDIT_TARGET.EVENT_PARTICIPATION,
      targetId: created.id,
      metadata: {
        eventDate: serialized.eventDate,
        organizers,
        participantCount: participants.length,
        discordDelivered,
      },
    });

    return serialized;
  }

  async remove(id: string, accountId: string, characterId: string) {
    const existing = await this.prismaService.eventParticipation.findUnique({
      where: { id },
      select: { id: true, organizers: true, eventDate: true },
    });
    if (!existing) {
      throw new NotFoundException('Event participation was not found');
    }

    await this.prismaService.eventParticipation.delete({ where: { id } });

    await this.auditService.create({
      actorAccountId: accountId,
      actorCharacterId: characterId,
      action: 'event-participations.delete',
      targetType: AUDIT_TARGET.EVENT_PARTICIPATION,
      targetId: id,
      metadata: {
        organizers: existing.organizers,
        eventDate: existing.eventDate.toISOString().slice(0, 10),
      },
    });

    return { id };
  }

  private buildSearchWhere(query: SearchEventParticipationsDto): Prisma.EventParticipationWhereInput {
    const and: Prisma.EventParticipationWhereInput[] = [];
    const term = query.q?.trim();
    if (term) {
      and.push({
        OR: [
          { organizers: { contains: term, mode: 'insensitive' } },
          { payerFullName: { contains: term, mode: 'insensitive' } },
          { authorizingOfficerName: { contains: term, mode: 'insensitive' } },
          { saedLeadName: { contains: term, mode: 'insensitive' } },
          { participants: { some: { fullName: { contains: term, mode: 'insensitive' } } } },
          {
            submittedByCharacter: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        ],
      });
    }

    if (query.from) {
      and.push({ eventDate: { gte: parseDateOnly(query.from) } });
    }
    if (query.to) {
      and.push({ eventDate: { lte: parseDateOnly(query.to) } });
    }

    return and.length ? { AND: and } : {};
  }

  private async requireStaffProfile(characterId: string) {
    const staffProfile = await this.prismaService.staffProfile.findUnique({
      where: { characterId },
      select: { id: true },
    });
    if (!staffProfile) {
      throw new ForbiddenException('Only SAED medical staff can register event participation.');
    }
  }

  private async notifyDiscord(record: ReturnType<EventParticipationsService['serialize']>) {
    try {
      const delivered = await this.discordWebhookService.sendEventParticipationEmbed({
        eventDate: record.eventDate,
        organizers: record.organizers,
        payerFullName: record.payerFullName,
        authorizingOfficerName: record.authorizingOfficerName,
        saedLeadName: record.saedLeadName,
        participants: record.participants.map((item) => item.fullName),
        submittedByName: record.submittedBy.fullName,
      });
      if (!delivered) {
        this.logger.warn(`Discord event participation webhook was not delivered for ${record.id}`);
      }
      return delivered;
    } catch (error) {
      this.logger.warn(
        `Discord event participation webhook error for ${record.id}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return false;
    }
  }

  private serialize(item: {
    id: string;
    eventDate: Date;
    organizers: string;
    payerFullName: string;
    authorizingOfficerName: string;
    saedLeadName: string;
    discordDelivered: boolean;
    createdAt: Date;
    updatedAt: Date;
    submittedByCharacter: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      staffProfile: { employeeNumber: string; rank: { name: string } | null } | null;
    };
    participants: Array<{
      id: string;
      fullName: string;
      characterId: string | null;
      sortOrder: number;
    }>;
  }) {
    return {
      id: item.id,
      eventDate: item.eventDate.toISOString().slice(0, 10),
      organizers: item.organizers,
      payerFullName: item.payerFullName,
      authorizingOfficerName: item.authorizingOfficerName,
      saedLeadName: item.saedLeadName,
      discordDelivered: item.discordDelivered,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      submittedBy: {
        characterId: item.submittedByCharacter.id,
        fullName: `${item.submittedByCharacter.firstName} ${item.submittedByCharacter.lastName}`.trim(),
        avatarUrl: item.submittedByCharacter.avatarUrl,
        employeeNumber: item.submittedByCharacter.staffProfile?.employeeNumber ?? null,
        rankName: item.submittedByCharacter.staffProfile?.rank?.name ?? null,
      },
      participants: item.participants.map((participant) => ({
        id: participant.id,
        fullName: participant.fullName,
        characterId: participant.characterId,
        sortOrder: participant.sortOrder,
      })),
    };
  }
}

function normalizeRequired(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }
  return trimmed;
}

function normalizeParticipants(participants: CreateEventParticipationDto['participants']) {
  const seen = new Set<string>();
  const normalized: Array<{ fullName: string; characterId?: string }> = [];

  for (const participant of participants) {
    const fullName = participant.fullName.trim();
    if (!fullName) {
      continue;
    }
    const key = `${fullName.toLowerCase()}|${participant.characterId ?? ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push({
      fullName,
      characterId: participant.characterId,
    });
  }

  if (!normalized.length) {
    throw new BadRequestException('At least one SAED participant is required');
  }

  return normalized;
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new BadRequestException('eventDate must be a valid ISO date (YYYY-MM-DD)');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException('eventDate must be a valid calendar date');
  }
  return date;
}
