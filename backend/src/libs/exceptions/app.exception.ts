import { HttpException } from '@nestjs/common';
import type { FieldErrorDetail } from '../api/api-error-details.js';
import type { ErrorCodeProps } from './error-code.js';

export class AppException extends HttpException {
  constructor(
    error: ErrorCodeProps,
    customMessage?: string,
    public readonly subErrors?: FieldErrorDetail[],
  ) {
    super(customMessage ?? error.defaultMessage, error.status);
    this.errorCode = error.code;
  }

  public readonly errorCode: string;
}
