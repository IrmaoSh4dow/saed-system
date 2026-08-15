import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  resolvePrismaDatabaseUrl,
  resolvePrismaIdleTtlMs,
} from './prisma-database-url.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly idleTtlMs = resolvePrismaIdleTtlMs();
  private lastActivityAt = Date.now();
  private isConnected = false;
  private idleCheckTimer: NodeJS.Timeout | null = null;
  private connectPromise: Promise<void> | null = null;
  private disconnectPromise: Promise<void> | null = null;

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
    this.logger.log(
      `Prisma onModuleInit: connecting (idle TTL ${Math.round(this.idleTtlMs / 60000)}m)...`,
    );
    try {
      await this.ensureConnected();
      this.logger.log('Prisma connected to PostgreSQL');
    } catch (error) {
      // Do not kill the HTTP process on Railway: without listen() the proxy returns 502.
      // /health will report database: down so the failure remains visible.
      this.logger.error(
        'Prisma could not connect to PostgreSQL. HTTP server will still listen.',
        error instanceof Error ? error.stack : undefined,
      );
    }

    this.idleCheckTimer = setInterval(() => {
      void this.disconnectIfIdle();
    }, 30_000);
    this.idleCheckTimer.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
    }
    await this.$disconnect();
    this.isConnected = false;
  }

  /**
   * Marks DB activity so the idle timer resets.
   * Call on application traffic (HTTP / sockets), not on pure health probes.
   */
  touch(): void {
    this.lastActivityAt = Date.now();
  }

  /**
   * Ensures the Prisma engine is connected and refreshes the activity timestamp.
   * Connections stay open while traffic continues; idle disconnect runs separately.
   */
  async ensureConnected(): Promise<void> {
    this.touch();

    if (this.isConnected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      if (this.disconnectPromise) {
        try {
          await this.disconnectPromise;
        } catch {
          // Previous idle disconnect failed; still attempt connect.
        }
      }
      await this.$connect();
      this.isConnected = true;
    })()
      .catch((error) => {
        this.isConnected = false;
        throw error;
      })
      .finally(() => {
        this.connectPromise = null;
      });

    return this.connectPromise;
  }

  private async disconnectIfIdle(): Promise<void> {
    if (!this.isConnected || this.connectPromise || this.disconnectPromise) {
      return;
    }

    const idleForMs = Date.now() - this.lastActivityAt;
    if (idleForMs < this.idleTtlMs) {
      return;
    }

    this.disconnectPromise = (async () => {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log(
        `Prisma disconnected after ${Math.round(idleForMs / 60000)}m without application traffic`,
      );
    })()
      .catch((error) => {
        this.logger.warn(
          'Prisma idle disconnect failed',
          error instanceof Error ? error.message : undefined,
        );
      })
      .finally(() => {
        this.disconnectPromise = null;
      });

    await this.disconnectPromise;
  }
}
