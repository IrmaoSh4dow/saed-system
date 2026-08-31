import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import express, { RequestHandler } from 'express';
import type { Server as HttpServer } from 'node:http';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SlowRequestInterceptor } from './common/interceptors/slow-request.interceptor';

/**
 * Builds the Nest/Express request handler without calling listen().
 * Listening is owned by server.cjs / main.ts so Railway always has an open PORT.
 *
 * Pass the same `http.Server` that accepts connections so Socket.IO shares
 * that transport (otherwise REST works but realtime chat never reaches clients).
 *
 * On Railway, `prisma migrate deploy` + seed run in the start command
 * before this process is launched (see api/railway.toml).
 */
export async function attachNestToServer(httpServer?: HttpServer): Promise<RequestHandler> {
  const logger = new Logger('NestBoot');
  const expressApp = express();
  expressApp.set('etag', false);
  expressApp.use((request, response, next) => {
    if (!request.path.startsWith('/uploads')) {
      response.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  logger.log('NestFactory.create starting');
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    { abortOnError: false, bodyParser: false },
  );

  if (httpServer) {
    app.useWebSocketAdapter(new IoAdapter(httpServer));
    logger.log('Socket.IO IoAdapter attached to listening HTTP server');
  } else {
    logger.warn(
      'attachNestToServer called without http.Server — Socket.IO may not receive upgrades',
    );
  }

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

  // Temp multipart files live under uploads/.tmp — never serve them publicly.
  expressApp.use('/uploads/.tmp', (_request, response) => {
    response.status(404).end();
  });

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
  app.useGlobalInterceptors(new SlowRequestInterceptor(), new ResponseInterceptor());

  await app.init();
  logger.log('Nest init complete');

  return expressApp;
}
