import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface IHealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  database: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHealth(): Promise<IHealthStatus> {
    let database: 'up' | 'down' = 'down';

    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database,
    };
  }
}
