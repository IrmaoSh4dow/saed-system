import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import express, { RequestHandler } from 'express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * Builds the Nest/Express request handler without calling listen().
 * Listening is owned by server.cjs so Railway always has an open PORT.
 *
 * Database migrations and seeds are never run on boot — apply them
 * intentionally via ops scripts when schema changes are approved.
 */
export async function attachNestToServer(): Promise<RequestHandler> {
  const logger = new Logger('NestBoot');
  const expressApp = express();

  logger.log('NestFactory.create starting');
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    { abortOnError: false, bodyParser: false },
  );

  // License (and similar) catalog images are sent as Base64 data URLs in JSON.
  // 8 MB decoded ≈ ~11 MB Base64; keep headroom for the rest of the payload.
  expressApp.use(express.json({ limit: '15mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '15mb' }));

  const configService = app.get(ConfigService);
  const apiPrefix = configService.getOrThrow<string>('app.apiPrefix');
  const corsOrigins = configService.getOrThrow<string[]>('app.corsOrigins');
  const frontendUrl = configService.getOrThrow<string>('app.frontendUrl');

  logger.log(
    `config apiPrefix=${apiPrefix} frontendUrl=${frontendUrl} cors=${corsOrigins.join(',')}`,
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  logger.log('Nest init complete (no automatic migrate/seed on boot)');

  return expressApp as unknown as RequestHandler;
}
