/**
 * Local Nest CLI entry (`npm run start:dev`).
 * Production / Railway uses `server.cjs` (listen-first), which imports `nest-boot` directly.
 */
import { Logger } from '@nestjs/common';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { attachNestToServer } from './nest-boot';

export { attachNestToServer } from './nest-boot';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);

  let nestHandler:
    | ((req: IncomingMessage, res: ServerResponse) => void)
    | null = null;

  const server = createServer((req, res) => {
    if (nestHandler) {
      nestHandler(req, res);
      return;
    }
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'API is still booting' }));
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => resolve());
    server.on('error', reject);
  });

  nestHandler = (await attachNestToServer(server)) as (
    req: IncomingMessage,
    res: ServerResponse,
  ) => void;

  logger.log(`SAED API listening on http://localhost:${port}`);
}

void bootstrap();
