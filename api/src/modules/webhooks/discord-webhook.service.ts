import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AcademyApplicationType } from '@prisma/client';

export type IDiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type IDiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string };
  fields?: IDiscordEmbedField[];
  author?: { name: string };
};

export type IDiscordWebhookPayload = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: IDiscordEmbed[];
  allowed_mentions?: {
    parse?: Array<'everyone' | 'roles' | 'users'>;
  };
};

const SAED_BRAND_COLOR = 0xb94a42;
const DESCRIPTION_MAX = 1800;
const TITLE_MAX = 256;

@Injectable()
export class DiscordWebhookService implements OnModuleInit {
  private readonly logger = new Logger(DiscordWebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.logger.log(
      `Discord webhooks → news:${this.hasWebhook(['discord.newsWebhookUrl'], ['DISCORD_NEWS_WEBHOOK_URL']) ? 'on' : 'off'} ` +
        `applications:${this.hasWebhook(['discord.applicationsWebhookUrl'], ['DISCORD_APPLICATIONS_WEBHOOK_URL']) ? 'on' : 'off'} ` +
        `announcements:${this.hasWebhook(['discord.announcementsWebhookUrl'], ['DISCORD_ANNOUNCEMENTS_WEBHOOK_URL']) ? 'on' : 'off'} ` +
        `shifts:${this.hasWebhook(['discord.shiftsWebhookUrl'], ['DISCORD_SHIFTS_WEBHOOK_URL']) ? 'on' : 'off'}`,
    );
  }

  async send(webhookUrl: string | undefined, payload: IDiscordWebhookPayload): Promise<boolean> {
    const url = webhookUrl?.trim();
    if (!url) {
      this.logger.warn('Discord webhook skipped: URL not configured');
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

      this.logger.log(`Discord webhook delivered (${response.status})`);
      return true;
    } catch (error) {
      this.logger.warn(
        `Discord webhook request error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return false;
    }
  }

  async sendShiftEmbed(embed: IDiscordEmbed): Promise<boolean> {
    const webhookUrl = this.resolveWebhookUrl(
      ['discord.shiftsWebhookUrl'],
      ['DISCORD_SHIFTS_WEBHOOK_URL'],
    );
    return this.send(webhookUrl, {
      username: 'SAED Duty Desk',
      embeds: [embed],
    });
  }

  async sendIncentiveEmbed(embed: IDiscordEmbed): Promise<boolean> {
    const webhookUrl = this.resolveWebhookUrl(
      ['discord.incentivesWebhookUrl', 'discord.announcementsWebhookUrl'],
      ['DISCORD_INCENTIVES_WEBHOOK_URL', 'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'],
    );
    return this.send(webhookUrl, {
      username: 'SAED Incentives',
      embeds: [embed],
    });
  }

  async notifyNewsPublished(article: {
    id: string;
    title: string;
    summary: string;
    content: string;
    coverImageUrl?: string | null;
    authorName: string;
    publishedAt?: Date | null;
  }): Promise<boolean> {
    const webhookUrl = this.resolveWebhookUrl(
      [
        'discord.newsWebhookUrl',
        'discord.announcementsWebhookUrl',
        'discord.applicationsWebhookUrl',
      ],
      [
        'DISCORD_NEWS_WEBHOOK_URL',
        'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL',
        'DISCORD_APPLICATIONS_WEBHOOK_URL',
        'DISCORD_SHIFTS_WEBHOOK_URL',
      ],
    );

    if (!webhookUrl) {
      this.logger.warn(
        'News Discord webhook skipped: no webhook URL configured. ' +
          'Set DISCORD_NEWS_WEBHOOK_URL or DISCORD_ANNOUNCEMENTS_WEBHOOK_URL on the API service ' +
          '(Railway → API → Variables), then redeploy.',
      );
      return false;
    }

    const frontendUrl = this.getFrontendUrl();
    const coverUrl = this.resolveDiscordImageUrl(article.coverImageUrl ?? null);
    const description = this.buildNewsDescription(article.summary, article.content);
    const title = truncatePlainText(article.title, TITLE_MAX) || 'Nueva noticia';

    return this.send(webhookUrl, {
      username: 'SAED Noticias',
      content: '@everyone Se ha publicado una nueva noticia institucional.',
      allowed_mentions: { parse: ['everyone'] },
      embeds: [
        {
          title,
          description: description || undefined,
          url: frontendUrl || undefined,
          color: SAED_BRAND_COLOR,
          timestamp: (article.publishedAt ?? new Date()).toISOString(),
          author: article.authorName?.trim()
            ? { name: truncatePlainText(article.authorName, 256) }
            : undefined,
          image: coverUrl ? { url: coverUrl } : undefined,
          footer: { text: 'SAED Management System · Noticias' },
          fields: [
            {
              name: 'Leer en la plataforma',
              value: frontendUrl
                ? `[Abrir portal SAED](${frontendUrl})`
                : 'Consulta el portal SAED',
            },
          ],
        },
      ],
    });
  }

  async notifyApplicationsOpened(input: {
    type: AcademyApplicationType;
    openedAt?: Date | null;
  }): Promise<boolean> {
    const webhookUrl = this.resolveWebhookUrl(
      [
        'discord.applicationsWebhookUrl',
        'discord.announcementsWebhookUrl',
        'discord.newsWebhookUrl',
      ],
      [
        'DISCORD_APPLICATIONS_WEBHOOK_URL',
        'DISCORD_ANNOUNCEMENTS_WEBHOOK_URL',
        'DISCORD_NEWS_WEBHOOK_URL',
        'DISCORD_SHIFTS_WEBHOOK_URL',
      ],
    );

    if (!webhookUrl) {
      this.logger.warn(
        'Applications Discord webhook skipped: no webhook URL configured. ' +
          'Set DISCORD_APPLICATIONS_WEBHOOK_URL or DISCORD_ANNOUNCEMENTS_WEBHOOK_URL on the API service ' +
          '(Railway → API → Variables), then redeploy.',
      );
      return false;
    }

    const frontendUrl = this.getFrontendUrl();
    const isAcademy = input.type === AcademyApplicationType.ACADEMY;
    const title = isAcademy
      ? 'Convocatoria de Academia abierta'
      : 'Convocatoria de Traslado abierta';
    const applyPath = isAcademy ? '/academy/apply' : '/academy/apply/transfer';
    const applyUrl = frontendUrl ? `${frontendUrl}${applyPath}` : null;
    const hubUrl = frontendUrl ? `${frontendUrl}/academy/applications` : null;

    return this.send(webhookUrl, {
      username: 'SAED Academia',
      content: isAcademy
        ? '@everyone Se han abierto las postulaciones a la Academia SAED.'
        : '@everyone Se han abierto las postulaciones de Traslado.',
      allowed_mentions: { parse: ['everyone'] },
      embeds: [
        {
          title,
          description: isAcademy
            ? 'Ya puedes presentar tu postulación para ingresar a la Academia del San Andreas Emergency Department.'
            : 'Ya puedes presentar tu solicitud de traslado hacia el San Andreas Emergency Department.',
          url: applyUrl ?? undefined,
          color: SAED_BRAND_COLOR,
          timestamp: (input.openedAt ?? new Date()).toISOString(),
          footer: { text: 'SAED Management System · Postulaciones' },
          fields: [
            {
              name: 'Tipo',
              value: isAcademy ? 'Academia' : 'Traslado',
              inline: true,
            },
            {
              name: 'Estado',
              value: 'Abierta',
              inline: true,
            },
            {
              name: 'Postular',
              value: applyUrl
                ? `[Ir al formulario](${applyUrl})`
                : 'Consulta el portal SAED',
            },
            ...(hubUrl
              ? [
                  {
                    name: 'Centro de postulaciones',
                    value: `[Ver convocatorias](${hubUrl})`,
                  },
                ]
              : []),
          ],
        },
      ],
    });
  }

  resolvePublicAssetUrl(assetUrl: string | null | undefined): string | null {
    if (!assetUrl) {
      return null;
    }
    const trimmed = assetUrl.trim();
    if (!trimmed) {
      return null;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    const base =
      this.configService.get<string>('discord.publicAssetBaseUrl') ||
      this.configService.get<string>('app.frontendUrl') ||
      process.env.PUBLIC_ASSET_BASE_URL?.trim() ||
      process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
      '';
    if (!base) {
      return null;
    }
    return `${base.replace(/\/$/, '')}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  /**
   * Discord can only fetch publicly reachable HTTPS images.
   * Local/dev absolute URLs are omitted so the embed still delivers.
   */
  private resolveDiscordImageUrl(assetUrl: string | null | undefined): string | null {
    const resolved = this.resolvePublicAssetUrl(assetUrl);
    if (!resolved) {
      return null;
    }
    try {
      const parsed = new URL(resolved);
      if (parsed.protocol !== 'https:') {
        return null;
      }
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.local')
      ) {
        return null;
      }
      return resolved;
    } catch {
      return null;
    }
  }

  private resolveWebhookUrl(configKeys: string[], envKeys: string[]): string {
    for (const key of configKeys) {
      const value = this.configService.get<string>(key)?.trim();
      if (value) {
        return value;
      }
    }
    for (const key of envKeys) {
      const value = process.env[key]?.trim();
      if (value) {
        return value;
      }
    }
    return '';
  }

  private hasWebhook(configKeys: string[], envKeys: string[]): boolean {
    return Boolean(this.resolveWebhookUrl(configKeys, envKeys));
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('app.frontendUrl') ||
      process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
      ''
    ).replace(/\/$/, '');
  }

  private buildNewsDescription(summary: string, content: string): string {
    const cleanSummary = truncatePlainText(summary, 400);
    const remaining = Math.max(0, DESCRIPTION_MAX - cleanSummary.length - 20);
    const cleanContent = truncatePlainText(content, remaining);
    if (!cleanContent || cleanContent === cleanSummary) {
      return cleanSummary;
    }
    return `${cleanSummary}\n\n${cleanContent}`;
  }
}

function truncatePlainText(value: string, maxLength: number): string {
  const plain = String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
