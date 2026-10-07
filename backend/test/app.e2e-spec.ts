import { jest } from '@jest/globals';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  type INestApplication,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '#app/app.module';
import { ApiSuccessResponse } from '#app/libs/api/api-base.response';
import { CursorPage } from '#app/libs/api/api-cursor-pagination';
import { SuccessMessage } from '#app/libs/api/success-message.decorator';
import { AppException } from '#app/libs/exceptions/app.exception';
import { ErrorCode } from '#app/libs/exceptions/error-code';
import { CustomLogger } from '#app/libs/logger/logger.service';
import { getTraceId } from '#app/libs/request-context/request-context';

class AddressInput {
  @IsString({ message: 'City must be text' })
  city!: string;
}

class ValidationInput {
  @IsArray()
  @IsString({ each: true, message: 'Each item must be text' })
  tags!: string[];

  @ValidateNested()
  @Type(() => AddressInput)
  address!: AddressInput;
}

// These routes exist only inside the test module, never in the application.
@Controller('__response-test')
class ResponseTestController {
  @Get('plain')
  @SuccessMessage('Loaded')
  plain() {
    return { value: 1 };
  }

  @Get('wrapped')
  wrapped() {
    return new ApiSuccessResponse({
      message: 'Already wrapped',
      data: { value: 2 },
    });
  }

  @Get('cursor')
  cursor() {
    return new CursorPage([{ id: 'a' }, { id: 'b' }], 'next', true, 2);
  }

  @Get('wrapped-cursor')
  wrappedCursor() {
    return ApiSuccessResponse.ofCursorPage(
      new CursorPage([{ id: 'last' }], null, false, 20),
      'Last page',
    );
  }

  @Get('empty')
  @HttpCode(204)
  empty() {
    return { ignored: true };
  }

  @Get('bad-request')
  badRequest() {
    throw new BadRequestException('Invalid cursor');
  }

  @Get('conflict')
  conflict() {
    throw new AppException(ErrorCode.CONFLICT_ERROR);
  }

  @Get('app-error')
  appError() {
    throw new AppException(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Private database failure',
    );
  }

  @Get('unexpected-error')
  unexpectedError() {
    throw new Error('Private database failure');
  }

  @Post('validate')
  validate(@Body() body: ValidationInput) {
    return body;
  }

  @Get('context')
  async context() {
    const before = getTraceId();
    await new Promise<void>((resolve) => setImmediate(resolve));
    return { before, after: getTraceId() };
  }
}

describe('Global HTTP responses (e2e)', () => {
  let app: INestApplication<Server>;
  const errorTraces: Array<string | undefined> = [];
  const logger = {
    debug: jest.fn(),
    log: jest.fn(),
    error: jest.fn(() => {
      errorTraces.push(getTraceId());
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ResponseTestController],
    })
      .overrideProvider(CustomLogger)
      .useValue(logger)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    errorTraces.length = 0;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('wraps health and returns the same trace ID in the body and header', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/live')
      .expect(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Success',
      data: { status: 'ok' },
      timestamp: expect.any(String) as unknown,
      traceId: response.headers['x-trace-id'],
    });
    expect(response.headers['x-trace-id']).toEqual(expect.any(String));
  });

  it('uses handler success metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/plain')
      .expect(200);
    expect(response.body).toMatchObject({
      message: 'Loaded',
      data: { value: 1 },
    });
  });

  it('does not wrap an existing success response twice', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/wrapped')
      .expect(200);
    expect(response.body).toMatchObject({
      message: 'Already wrapped',
      data: { value: 2 },
    });
    expect(response.body).not.toHaveProperty('data.success');
  });

  it('moves cursor metadata outside data', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/cursor')
      .expect(200);
    expect(response.body).toMatchObject({
      data: [{ id: 'a' }, { id: 'b' }],
      meta: { nextCursor: 'next', hasMore: true, limit: 2 },
    });
  });

  it('preserves an already wrapped final cursor page', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/wrapped-cursor')
      .expect(200);
    expect(response.body).toMatchObject({
      message: 'Last page',
      data: [{ id: 'last' }],
      meta: { nextCursor: null, hasMore: false, limit: 20 },
    });
  });

  it('leaves 204 responses without a body', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/empty')
      .expect(204);
    expect(response.text).toBe('');
    expect(response.headers['x-trace-id']).toEqual(expect.any(String));
  });

  it('does not classify every bad request as field validation', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/bad-request')
      .expect(400);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Bad Request',
      errorCode: 'HTTP-400',
      message: 'Invalid cursor',
    });
    expect(response.body).not.toHaveProperty('subErrors');
  });

  it('uses actual nested property paths even with custom validation messages', async () => {
    const response = await request(app.getHttpServer())
      .post('/__response-test/validate')
      .send({ tags: [123], address: { city: 123 } })
      .expect(400);
    expect(response.body).toMatchObject({
      errorCode: ErrorCode.VALIDATION_ERROR.code,
      subErrors: expect.arrayContaining([
        { field: 'tags', message: 'Each item must be text' },
        { field: 'address.city', message: 'City must be text' },
      ]) as unknown,
    });
    expect(response.body).not.toHaveProperty('data');
  });

  it('preserves expected application errors without logging them as server failures', async () => {
    const response = await request(app.getHttpServer())
      .get('/__response-test/conflict')
      .expect(409);
    expect(response.body).toMatchObject({
      errorCode: ErrorCode.CONFLICT_ERROR.code,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each(['app-error', 'unexpected-error'])(
    'logs and masks 500 errors: %s',
    async (route) => {
      const response = await request(app.getHttpServer())
        .get('/__response-test/' + route)
        .expect(500);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 500,
        message: ErrorCode.INTERNAL_SERVER_ERROR.defaultMessage,
        traceId: response.headers['x-trace-id'],
      });
      expect(JSON.stringify(response.body)).not.toContain(
        'Private database failure',
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(errorTraces).toEqual([response.headers['x-trace-id']]);
    },
  );

  it('normalizes unmatched routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/does-not-exist')
      .expect(404);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 404,
      errorCode: 'HTTP-404',
      traceId: response.headers['x-trace-id'],
    });
  });

  it('keeps concurrent request contexts separate across async work', async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app.getHttpServer())
          .get('/__response-test/context')
          .expect(200),
      ),
    );
    const ids = responses.map((response) => response.headers['x-trace-id']);
    expect(new Set(ids).size).toBe(8);
    for (const response of responses) {
      expect(response.body).toMatchObject({
        traceId: response.headers['x-trace-id'],
        data: {
          before: response.headers['x-trace-id'],
          after: response.headers['x-trace-id'],
        },
      });
    }
  });
});
