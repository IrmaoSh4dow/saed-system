import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { isExternalDatabaseHost, resolvePrismaDatabaseUrl } from './prisma-database-url.util';

/** Above this per-query round-trip the API cannot feel fast, whatever the code does. */
const HIGH_LATENCY_WARN_MS = 15;
const LATENCY_PROBE_SAMPLES = 5;

/**
 * Long-lived Prisma client for the API process.
 * Connects once at boot and stays connected until process shutdown.
 */
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
    this.warnAboutExternalHost();

    this.logger.log('Prisma onModuleInit: connecting...');
    try {
      await this.$connect();
      this.logger.log('Prisma connected to PostgreSQL (persistent pool)');
      // Diagnostic only: never hold up module init waiting on the database.
      void this.reportRoundTripLatency();
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

  private warnAboutExternalHost(): void {
    if (!isExternalDatabaseHost(process.env.DATABASE_URL)) {
      return;
    }

    this.logger.warn(
      'DATABASE_URL points to a public database endpoint. Every query leaves the private ' +
        'network and pays internet latency. Use the internal host (e.g. postgres.railway.internal) ' +
        'to restore sub-millisecond query round-trips.',
    );
  }

  /**
   * A single endpoint request runs dozens of queries, so per-query round-trip is
   * multiplied by that factor. Logging it at boot turns "the app is slow" into a number.
   */
  private async reportRoundTripLatency(): Promise<void> {
    try {
      const samples: number[] = [];

      for (let index = 0; index < LATENCY_PROBE_SAMPLES; index += 1) {
        const startedAt = process.hrtime.bigint();
        await this.$queryRaw`SELECT 1`;
        samples.push(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
      }

      const averageMs = samples.reduce((total, value) => total + value, 0) / samples.length;
      const message = `Database round-trip latency: ${averageMs.toFixed(1)}ms average over ${samples.length} probes`;

      if (averageMs >= HIGH_LATENCY_WARN_MS) {
        this.logger.warn(
          `${message}. Every endpoint pays this per query, so response times scale with it.`,
        );
        return;
      }

      this.logger.log(message);
    } catch (error) {
      this.logger.warn(
        `Database latency probe failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
