import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { HealthService, IHealthStatus } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness for Railway. Always HTTP 200 once Nest is listening.
   * Database status is reported in the body (ok | degraded).
   */
  @Public()
  @Get()
  @HttpCode(200)
  getHealth(): Promise<IHealthStatus> {
    return this.healthService.getHealth();
  }
}
