import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from './prisma.service';

/**
 * Keeps the Prisma pool warm for real application traffic.
 * Health probes are ignored so idle disconnect can still run after 10m without users.
 */
@Injectable()
export class PrismaActivityMiddleware implements NestMiddleware {
  constructor(private readonly prismaService: PrismaService) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    if (isHealthProbe(request)) {
      next();
      return;
    }

    void this.prismaService
      .ensureConnected()
      .then(() => next())
      .catch((error) => next(error));
  }
}

function isHealthProbe(request: Request): boolean {
  const path = (request.path || request.url || '').split('?')[0];
  return path === '/health' || path.endsWith('/health');
}
