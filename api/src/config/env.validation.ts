import * as Joi from 'joi';

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
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  DISCORD_SHIFTS_WEBHOOK_URL: Joi.string().uri().allow('').optional(),
  PUBLIC_ASSET_BASE_URL: Joi.string().uri().allow('').optional(),
});
