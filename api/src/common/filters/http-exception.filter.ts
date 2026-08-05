import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { IApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errors: unknown[] = [];

    if (exception instanceof MulterError) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message =
        exception.code === 'LIMIT_FILE_SIZE'
          ? 'El tamaño máximo permitido es de 8 MB.'
          : 'No se pudo procesar el archivo subido';
    } else if (
      exception instanceof PayloadTooLargeException ||
      (exception instanceof Error && /entity too large/i.test(exception.message))
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'El tamaño máximo permitido es de 8 MB.';
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const payload = exceptionResponse as Record<string, unknown>;
      if (typeof payload.message === 'string') {
        message = payload.message;
      } else if (Array.isArray(payload.message)) {
        message = 'Validation failed';
        errors = payload.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : 'Unhandled exception',
        exception instanceof Error ? exception.stack : undefined,
      );
      message = 'Internal server error';
      errors = [];
    }

    const body: IApiErrorResponse = {
      success: false,
      message,
      errors,
    };

    response.status(status).json(body);
  }
}
