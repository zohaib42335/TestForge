import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';

    if (isHttpException) {
      code = HttpStatus[statusCode] ?? 'HTTP_EXCEPTION';
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const detail = (exceptionResponse as { message?: string | string[] }).message;
        message = Array.isArray(detail) ? detail.join(', ') : (detail ?? message);
      } else {
        message = exception.message;
      }
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        statusCode,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
      },
    });
  }
}
