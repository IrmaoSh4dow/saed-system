import { registerAs } from '@nestjs/config';
import { parseCorsOrigins } from '../common/utils/cors-origins.util';

const DEFAULT_PORT = 8080;

export default registerAs('app', () => {
  const port = Number.parseInt(process.env.API_PORT ?? process.env.PORT ?? String(DEFAULT_PORT), 10);

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT,
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigins: parseCorsOrigins(process.env.FRONTEND_URL),
    frontendUrl: parseCorsOrigins(process.env.FRONTEND_URL)[0],
  };
});
