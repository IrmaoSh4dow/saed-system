import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

export interface ICreateNotificationInput {
  accountId: string;
  characterId: string;
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
    if (!input.characterId) {
      throw new BadRequestException('Notifications must target a character');
    }

    const notification = await this.prismaService.notification.create({
      data: {
        accountId: input.accountId,
        characterId: input.characterId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        metadata: input.metadata,
      },
    });

    // Character room only — never account room (same account can hold multiple characters).
    this.realtimeGateway.emitToCharacter(
      input.characterId,
      'notifications:new',
      notification,
    );

    return notification;
  }

  async createMany(inputs: ICreateNotificationInput[]) {
    const results = [];
    for (const input of inputs) {
      results.push(await this.create(input));
    }
    return results;
  }

  listForCharacter(accountId: string, characterId: string) {
    return this.prismaService.notification.findMany({
      where: {
        accountId,
        characterId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(accountId: string, characterId: string, notificationId: string) {
    const existing = await this.prismaService.notification.findFirst({
      where: { id: notificationId, accountId, characterId },
    });
    if (!existing) {
      throw new NotFoundException('Notification was not found');
    }

    return this.prismaService.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  markAllAsRead(accountId: string, characterId: string) {
    return this.prismaService.notification.updateMany({
      where: { accountId, characterId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
