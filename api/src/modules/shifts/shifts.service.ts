import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DiscordWebhookService } from '../webhooks/discord-webhook.service';
import { ClockInShiftDto, ClockOutShiftDto } from './dto/shift.dto';

const staffDutyInclude = {
  character: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  rank: { select: { id: true, name: true, slug: true } },
  department: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly discordWebhookService: DiscordWebhookService,
  ) {}

  async getCurrent(characterId: string) {
    const staffProfile = await this.requireStaffProfile(characterId);
    const current = await this.findOpenShift(staffProfile.id);
    return {
      isOnDuty: Boolean(current),
      currentShift: current ? this.serializeShift(current) : null,
      staff: this.serializeStaff(staffProfile),
      serverNow: new Date().toISOString(),
    };
  }

  async clockIn(characterId: string, dto: ClockInShiftDto) {
    const staffProfile = await this.requireStaffProfile(characterId);
    const existing = await this.findOpenShift(staffProfile.id);
    if (existing) {
      throw new ConflictException('Already on duty. Clock out before starting a new shift.');
    }

    const startedAt = new Date();
    const shift = await this.prismaService.staffShift.create({
      data: {
        staffProfileId: staffProfile.id,
        characterId,
        startedAt,
        status: ShiftStatus.OPEN,
        timezone: dto.timezone?.trim() || null,
      },
    });

    void this.notifyClockIn(staffProfile, shift.startedAt, shift.timezone);

    return {
      isOnDuty: true,
      currentShift: this.serializeShift(shift),
      staff: this.serializeStaff(staffProfile),
      serverNow: new Date().toISOString(),
    };
  }

  async clockOut(characterId: string, dto: ClockOutShiftDto) {
    const staffProfile = await this.requireStaffProfile(characterId);
    const openShift = await this.findOpenShift(staffProfile.id);
    if (!openShift) {
      throw new BadRequestException('No open shift to clock out.');
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - openShift.startedAt.getTime()) / 1000),
    );

    const shift = await this.prismaService.staffShift.update({
      where: { id: openShift.id },
      data: {
        endedAt,
        durationSeconds,
        status: ShiftStatus.CLOSED,
        timezone: dto.timezone?.trim() || openShift.timezone,
      },
    });

    void this.notifyClockOut(staffProfile, shift);

    return {
      isOnDuty: false,
      closedShift: this.serializeShift(shift),
      currentShift: null,
      staff: this.serializeStaff(staffProfile),
      serverNow: new Date().toISOString(),
    };
  }

  async listHistory(characterId: string, limit = 30) {
    const staffProfile = await this.requireStaffProfile(characterId);
    const take = Math.min(Math.max(limit, 1), 100);
    const items = await this.prismaService.staffShift.findMany({
      where: { staffProfileId: staffProfile.id },
      orderBy: { startedAt: 'desc' },
      take,
    });

    return {
      items: items.map((item) => this.serializeShift(item)),
      total: await this.prismaService.staffShift.count({
        where: { staffProfileId: staffProfile.id },
      }),
    };
  }

  async getStats(characterId: string) {
    const staffProfile = await this.requireStaffProfile(characterId);
    const shifts = await this.prismaService.staffShift.findMany({
      where: {
        staffProfileId: staffProfile.id,
        status: ShiftStatus.CLOSED,
        durationSeconds: { not: null },
      },
      orderBy: { startedAt: 'desc' },
    });

    const totalSeconds = shifts.reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
    const totalShifts = shifts.length;
    const averageSeconds = totalShifts ? Math.floor(totalSeconds / totalShifts) : 0;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekSeconds = shifts
      .filter((item) => item.startedAt >= weekStart)
      .reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
    const monthSeconds = shifts
      .filter((item) => item.startedAt >= monthStart)
      .reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);

    const lastShift = shifts[0] ?? null;
    const current = await this.findOpenShift(staffProfile.id);

    return {
      totalShifts,
      totalSeconds,
      averageSeconds,
      weekSeconds,
      monthSeconds,
      lastShift: lastShift ? this.serializeShift(lastShift) : null,
      isOnDuty: Boolean(current),
      currentShift: current ? this.serializeShift(current) : null,
      serverNow: now.toISOString(),
    };
  }

  private async requireStaffProfile(characterId: string) {
    const staffProfile = await this.prismaService.staffProfile.findUnique({
      where: { characterId },
      include: staffDutyInclude,
    });

    if (!staffProfile) {
      throw new ForbiddenException('Only SAED medical staff can manage duty shifts.');
    }

    return staffProfile;
  }

  private findOpenShift(staffProfileId: string) {
    return this.prismaService.staffShift.findFirst({
      where: { staffProfileId, status: ShiftStatus.OPEN },
      orderBy: { startedAt: 'desc' },
    });
  }

  private serializeShift(shift: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    durationSeconds: number | null;
    status: ShiftStatus;
    timezone: string | null;
  }) {
    return {
      id: shift.id,
      startedAt: shift.startedAt.toISOString(),
      endedAt: shift.endedAt?.toISOString() ?? null,
      durationSeconds: shift.durationSeconds,
      status: shift.status,
      timezone: shift.timezone,
      isOpen: shift.status === ShiftStatus.OPEN,
    };
  }

  private serializeStaff(staffProfile: {
    id: string;
    employeeNumber: string;
    character: { firstName: string; lastName: string; avatarUrl: string | null };
    rank: { name: string } | null;
    department: { name: string } | null;
  }) {
    return {
      id: staffProfile.id,
      employeeNumber: staffProfile.employeeNumber,
      fullName: `${staffProfile.character.firstName} ${staffProfile.character.lastName}`.trim(),
      rankName: staffProfile.rank?.name ?? '—',
      departmentName: staffProfile.department?.name ?? 'Sin departamento',
      avatarUrl: staffProfile.character.avatarUrl,
    };
  }

  private async notifyClockIn(
    staffProfile: {
      employeeNumber: string;
      character: { firstName: string; lastName: string; avatarUrl: string | null };
      rank: { name: string } | null;
      department: { name: string } | null;
    },
    startedAt: Date,
    timezone: string | null,
  ) {
    const fullName = `${staffProfile.character.firstName} ${staffProfile.character.lastName}`.trim();
    const thumbnailUrl = staffProfile.character.avatarUrl?.trim() || null;

    try {
      const delivered = await this.discordWebhookService.sendShiftEmbed({
        title: 'Entrada de servicio',
        color: 0xb94a42,
        timestamp: startedAt.toISOString(),
        thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
        footer: { text: 'SAED Management System · Duty Desk' },
        fields: [
          { name: 'Empleado', value: fullName || '—', inline: true },
          { name: 'Nº empleado', value: staffProfile.employeeNumber || '—', inline: true },
          { name: 'Departamento', value: staffProfile.department?.name ?? 'Sin departamento', inline: true },
          { name: 'Cargo', value: staffProfile.rank?.name ?? '—', inline: true },
          { name: 'Fecha', value: formatDate(startedAt, timezone), inline: true },
          { name: 'Hora de entrada', value: formatTime(startedAt, timezone), inline: true },
          { name: 'Estado', value: 'En Servicio', inline: true },
        ],
      });
      if (!delivered) {
        this.logger.warn(`Discord clock-in webhook was not delivered for ${fullName}`);
      }
    } catch (error) {
      this.logger.warn(
        `Discord clock-in webhook error for ${fullName}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }

  private async notifyClockOut(
    staffProfile: {
      employeeNumber: string;
      character: { firstName: string; lastName: string; avatarUrl: string | null };
      rank: { name: string } | null;
      department: { name: string } | null;
    },
    shift: {
      startedAt: Date;
      endedAt: Date | null;
      durationSeconds: number | null;
      timezone: string | null;
    },
  ) {
    if (!shift.endedAt) {
      return;
    }

    const fullName = `${staffProfile.character.firstName} ${staffProfile.character.lastName}`.trim();
    const thumbnailUrl = staffProfile.character.avatarUrl?.trim() || null;

    try {
      const delivered = await this.discordWebhookService.sendShiftEmbed({
        title: 'Salida de servicio',
        color: 0x564c4c,
        timestamp: shift.endedAt.toISOString(),
        thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
        footer: { text: 'SAED Management System · Duty Desk' },
        fields: [
          { name: 'Empleado', value: fullName || '—', inline: true },
          { name: 'Nº empleado', value: staffProfile.employeeNumber || '—', inline: true },
          { name: 'Departamento', value: staffProfile.department?.name ?? 'Sin departamento', inline: true },
          { name: 'Cargo', value: staffProfile.rank?.name ?? '—', inline: true },
          { name: 'Hora de entrada', value: formatTime(shift.startedAt, shift.timezone), inline: true },
          { name: 'Hora de salida', value: formatTime(shift.endedAt, shift.timezone), inline: true },
          {
            name: 'Tiempo trabajado',
            value: formatDuration(shift.durationSeconds ?? 0),
            inline: true,
          },
          { name: 'Estado', value: 'Fuera de Servicio', inline: true },
        ],
      });
      if (!delivered) {
        this.logger.warn(`Discord clock-out webhook was not delivered for ${fullName}`);
      }
    } catch (error) {
      this.logger.warn(
        `Discord clock-out webhook error for ${fullName}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }
  }
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatDate(value: Date, timezone: string | null) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: timezone || undefined,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function formatTime(value: Date, timezone: string | null) {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: timezone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(value);
  } catch {
    return value.toISOString().slice(11, 19);
  }
}
