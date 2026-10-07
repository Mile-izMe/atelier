import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import type { ApiErrorResponse } from '../api/api-error.response.js';
import type { FieldErrorDetail } from '../api/api-error-details.js';
import { CustomLogger } from '../logger/logger.service.js';
import { getTraceId } from '../request-context/request-context.js';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-code.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // This filter handles HTTP only; gateways need their own exception filter.
    if (host.getType() !== 'http') throw exception;

    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    // Fallback covers failures that occur before the request middleware.
    const traceId = getTraceId() ?? randomUUID();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode: string = ErrorCode.INTERNAL_SERVER_ERROR.code;
    let message: string = ErrorCode.INTERNAL_SERVER_ERROR.defaultMessage;
    let subErrors: FieldErrorDetail[] | undefined;

    if (exception instanceof AppException) {
      errorCode = exception.errorCode;
      message = exception.message;
      subErrors = exception.subErrors;
    } else if (exception instanceof HttpException) {
      errorCode = 'HTTP-' + status;
      message = exception.message;
    }

    if (status >= 500) {
      message = ErrorCode.INTERNAL_SERVER_ERROR.defaultMessage;
      subErrors = undefined;
      this.logger.error(
        '[' +
          traceId +
          '] ' +
          request.method +
          ' ' +
          request.path +
          ' returned ' +
          status,
        exception instanceof Error ? exception.stack : String(exception),
        GlobalExceptionFilter.name,
      );
    }

    // Do not attempt a second response after headers have been sent.
    if (response.headersSent) return;

    const body: ApiErrorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      statusCode: status,
      error: STATUS_CODES[status] ?? 'Error',
      errorCode,
      message,
      traceId,
      ...(subErrors?.length ? { subErrors } : {}),
    };

    response.setHeader('x-trace-id', traceId);
    response.status(status).json(body);
  }
}
