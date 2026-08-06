import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type IDiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type IDiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  thumbnail?: { url: string };
  footer?: { text: string };
  fields?: IDiscordEmbedField[];
};

export type IDiscordWebhookPayload = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: IDiscordEmbed[];
};

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(webhookUrl: string | undefined, payload: IDiscordWebhookPayload): Promise<boolean> {
    const url = webhookUrl?.trim();
    if (!url) {
      this.logger.debug('Discord webhook skipped: URL not configured');
      return false;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.warn(
          `Discord webhook failed (${response.status}): ${body.slice(0, 240)}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `Discord webhook request error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return false;
    }
  }

  async sendShiftEmbed(embed: IDiscordEmbed): Promise<boolean> {
    const webhookUrl = this.configService.get<string>('discord.shiftsWebhookUrl');
    return this.send(webhookUrl, {
      username: 'SAED Duty Desk',
      embeds: [embed],
    });
  }

  async sendIncentiveEmbed(embed: IDiscordEmbed): Promise<boolean> {
    const webhookUrl = this.configService.get<string>('discord.incentivesWebhookUrl');
    return this.send(webhookUrl, {
      username: 'SAED Incentives',
      embeds: [embed],
    });
  }
}
