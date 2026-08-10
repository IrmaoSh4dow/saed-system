import { registerAs } from '@nestjs/config';

export default registerAs('discord', () => ({
  shiftsWebhookUrl: process.env.DISCORD_SHIFTS_WEBHOOK_URL?.trim() || '',
  incentivesWebhookUrl: process.env.DISCORD_INCENTIVES_WEBHOOK_URL?.trim() || '',
  newsWebhookUrl: process.env.DISCORD_NEWS_WEBHOOK_URL?.trim() || '',
  applicationsWebhookUrl: process.env.DISCORD_APPLICATIONS_WEBHOOK_URL?.trim() || '',
  publicAssetBaseUrl:
    process.env.PUBLIC_ASSET_BASE_URL?.trim() ||
    process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
    '',
}));
