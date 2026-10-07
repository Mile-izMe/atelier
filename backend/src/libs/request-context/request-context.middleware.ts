import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { requestContext } from './request-context.js';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(_request: Request, response: Response, next: NextFunction): void {
    const traceId = randomUUID();
    response.setHeader('x-trace-id', traceId);
    requestContext.run({ traceId }, next);
  }
}
