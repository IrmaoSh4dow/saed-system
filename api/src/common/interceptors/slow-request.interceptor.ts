import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

const DEFAULT_SLOW_REQUEST_MS = 2_000;

/**
 * Logs requests that stay above the latency budget so production slowdowns are
 * traceable to a concrete route instead of a generic client-side timeout.
 */
@Injectable()
export class SlowRequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestTiming');

  private readonly thresholdMs: number;

  constructor(thresholdMs?: number) {
    const parsed = Number(process.env.SLOW_REQUEST_LOG_MS);
    this.thresholdMs =
      thresholdMs ??
      (Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : DEFAULT_SLOW_REQUEST_MS);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap({
        next: () => this.report(request, startedAt),
        error: () => this.report(request, startedAt),
      }),
    );
  }

  private report(request: Request, startedAt: number): void {
    const durationMs = Date.now() - startedAt;
    if (durationMs < this.thresholdMs) {
      return;
    }

    this.logger.warn(`Slow request ${request.method} ${request.originalUrl} took ${durationMs}ms`);
  }
}
