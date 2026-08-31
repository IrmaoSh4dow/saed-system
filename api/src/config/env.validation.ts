import * as Joi from 'joi';

/**
 * Optional HTTP(S) URL. Never fail process boot: a pasted webhook with quotes
 * or trailing whitespace used to take down login (Nest never became ready).
 */
function optionalHttpUrl() {
  return Joi.string()
    .optional()
    .allow('')
    .custom((value: unknown) => {
      if (value == null || value === '') {
        return '';
      }
      const cleaned = String(value)
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
    });
}

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8080),
  API_PORT: Joi.number().optional(),
  API_PREFIX: Joi.string().default('api/v1'),
  FRONTEND_URL: Joi.string()
    .required()
    .custom((value: string, helpers) => {
      const parts = value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      if (!parts.length) {
        return helpers.error('any.invalid');
      }
      for (const part of parts) {
        const withScheme = /^https?:\/\//i.test(part) ? part : `https://${part}`;
        try {
          void new URL(withScheme.replace(/\/$/, ''));
        } catch {
          return helpers.error('any.invalid');
        }
      }
      return value;
    }, 'frontend url(s)'),
  DATABASE_URL: Joi.string().required(),
  PRISMA_CONNECTION_LIMIT: Joi.number().integer().min(1).max(50).optional(),
  PRISMA_POOL_TIMEOUT: Joi.number().integer().min(1).max(300).optional(),
  SLOW_REQUEST_LOG_MS: Joi.number().integer().min(50).optional(),
  AUTH_CONTEXT_CACHE_TTL_MS: Joi.number().integer().min(5_000).max(300_000).optional(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  DISCORD_SHIFTS_WEBHOOK_URL: optionalHttpUrl(),
  DISCORD_INCENTIVES_WEBHOOK_URL: optionalHttpUrl(),
  DISCORD_NEWS_WEBHOOK_URL: optionalHttpUrl(),
  DISCORD_APPLICATIONS_WEBHOOK_URL: optionalHttpUrl(),
  DISCORD_ANNOUNCEMENTS_WEBHOOK_URL: optionalHttpUrl(),
  DISCORD_EVENTS_WEBHOOK_URL: optionalHttpUrl(),
  PUBLIC_ASSET_BASE_URL: optionalHttpUrl(),
});
