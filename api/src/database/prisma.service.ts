import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { resolvePrismaDatabaseUrl } from './prisma-database-url.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: resolvePrismaDatabaseUrl(process.env.DATABASE_URL),
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Prisma onModuleInit: connecting...');
    try {
      await this.$connect();
      this.logger.log('Prisma connected to PostgreSQL');
    } catch (error) {
      // Do not kill the HTTP process on Railway: without listen() the proxy returns 502.
      // /health will report database: down so the failure remains visible.
      this.logger.error(
        'Prisma could not connect to PostgreSQL. HTTP server will still listen.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
