import { registerAs } from '@nestjs/config';

function sanitizeHttpUrl(value: string | undefined): string {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
  if (!cleaned) {
    return '';
  }
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return cleaned;
  } catch {
    return '';
  }
}

export default registerAs('discord', () => ({
  shiftsWebhookUrl: sanitizeHttpUrl(process.env.DISCORD_SHIFTS_WEBHOOK_URL),
  incentivesWebhookUrl: sanitizeHttpUrl(process.env.DISCORD_INCENTIVES_WEBHOOK_URL),
  newsWebhookUrl: sanitizeHttpUrl(process.env.DISCORD_NEWS_WEBHOOK_URL),
  applicationsWebhookUrl: sanitizeHttpUrl(process.env.DISCORD_APPLICATIONS_WEBHOOK_URL),
  /** Shared fallback channel for news + applications announcements. */
  announcementsWebhookUrl: sanitizeHttpUrl(process.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL),
  publicAssetBaseUrl:
    sanitizeHttpUrl(process.env.PUBLIC_ASSET_BASE_URL) ||
    process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
    '',
}));
