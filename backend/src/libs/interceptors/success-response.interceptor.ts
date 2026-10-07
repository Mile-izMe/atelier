import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import { ApiSuccessResponse } from '../api/api-base.response.js';
import { CursorPage } from '../api/api-cursor-pagination.js';
import { SUCCESS_MESSAGE } from '../api/success-message.decorator.js';
import { getTraceId } from '../request-context/request-context.js';

@Injectable()
export class ApiSuccessInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const response = context.switchToHttp().getResponse<Response>();
    const message =
      this.reflector.getAllAndOverride<string>(SUCCESS_MESSAGE, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Success';

    return next.handle().pipe(
      map((data: unknown) => {
        if (response.statusCode === 204) return undefined;

        const body =
          data instanceof ApiSuccessResponse
            ? data
            : data instanceof CursorPage
              ? ApiSuccessResponse.ofCursorPage(data, message)
              : new ApiSuccessResponse({ message, data });

        return { ...body, traceId: getTraceId() };
      }),
    );
  }
}
