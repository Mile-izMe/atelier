import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { FieldErrorDetail } from '../api/api-error-details.js';
import { AppException } from './app.exception.js';
import { ErrorCode } from './error-code.js';

function fieldDetails(
  errors: ValidationError[],
  parent = '',
): FieldErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? parent + '.' + error.property : error.property;
    const details = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    return [...details, ...fieldDetails(error.children ?? [], field)];
  });
}

export class ApiValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) =>
        new AppException(
          ErrorCode.VALIDATION_ERROR,
          undefined,
          fieldDetails(errors),
        ),
    });
  }
}
