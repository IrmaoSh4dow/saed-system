import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

export interface ICreateNotificationInput {
  accountId: string;
  characterId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(input: ICreateNotificationInput) {
    const notification = await this.prismaService.notification.create({
      data: {
        accountId: input.accountId,
        characterId: input.characterId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        metadata: input.metadata,
      },
    });

    this.realtimeGateway.emitToAccount(input.accountId, 'notifications:new', notification);
    if (input.characterId) {
      this.realtimeGateway.emitToCharacter(
        input.characterId,
        'notifications:new',
        notification,
      );
    }

    return notification;
  }

  async createMany(inputs: ICreateNotificationInput[]) {
    const results = [];
    for (const input of inputs) {
      results.push(await this.create(input));
    }
    return results;
  }

  listForAccount(accountId: string, characterId?: string | null) {
    return this.prismaService.notification.findMany({
      where: {
        accountId,
        OR: [{ characterId: null }, ...(characterId ? [{ characterId }] : [])],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(accountId: string, notificationId: string) {
    const existing = await this.prismaService.notification.findFirst({
      where: { id: notificationId, accountId },
    });
    if (!existing) {
      return null;
    }

    return this.prismaService.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  markAllAsRead(accountId: string) {
    return this.prismaService.notification.updateMany({
      where: { accountId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
