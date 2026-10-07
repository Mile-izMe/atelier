import { jest } from '@jest/globals';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '#app/app.module';
import { CustomLogger } from '#app/libs/logger/logger.service';
import { PrismaService } from '#app/prisma/prisma.service';
import { UserRepository } from '#app/modules/user/repository/user.repository';
import type {
  CreateUserInput,
  UserEntity,
} from '#app/modules/user/entities/user.entity';
import { EmailAlreadyExistsError } from '#app/modules/user/errors/email-already-exists.error';
import { HashService } from '#app/modules/auth/service/hash.service';
import { createJwtOptions } from '#app/modules/auth/jwt.config';

describe('Authentication (HTTP, with a mocked repository)', () => {
  let app: INestApplication<Server>;
  let account: UserEntity;
  const password = 'my example password';
  const users = {
    findByEmail: jest.fn<(email: string) => Promise<UserEntity | null>>(),
    create: jest.fn<(input: CreateUserInput) => Promise<UserEntity>>(),
  };

  beforeAll(async () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-only-signing-key-never-use-in-production';
    const options = createJwtOptions();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(UserRepository)
      .useValue(users)
      .overrideProvider('JWT_MODULE_OPTIONS')
      .useValue(options)
      .overrideProvider(CustomLogger)
      .useValue({ debug: jest.fn(), log: jest.fn(), error: jest.fn() })
      .compile();

    app = module.createNestApplication();
    await app.init();
    account = {
      id: '3e3c61fb-e29c-4f81-b72e-8f4994ef0001',
      email: 'alice@example.com',
      username: 'alice',
      role: 'MEMBER',
      passwordHash: await app.get(HashService).hash(password),
      createdAt: '2026-10-07T00:00:00.000Z',
      updatedAt: '2026-10-07T00:00:00.000Z',
      deletedAt: null,
    };
  });

  beforeEach(() => {
    users.findByEmail.mockReset().mockResolvedValue(account);
    users.create.mockReset().mockImplementation((input) =>
      Promise.resolve({
        ...account,
        ...input,
        username: input.username ?? null,
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('logs in with normalized email and returns a signed, expiring token and public user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ' ALICE@EXAMPLE.COM ', password })
      .expect(200);

    const body = response.body as {
      success: boolean;
      message: string;
      traceId: string;
      data: {
        accessToken: string;
        tokenType: string;
        expiresIn: number;
        user: object;
      };
    };
    expect(users.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(body.success).toBe(true);
    expect(body.message).toBe('Login successful');
    expect(body.traceId).toBe(response.headers['x-trace-id']);
    expect(body.data.tokenType).toBe('Bearer');
    expect(body.data.expiresIn).toBe(900);
    expect(Object.keys(body.data.user).sort()).toEqual(
      ['id', 'email', 'username', 'role', 'createdAt', 'updatedAt'].sort(),
    );

    const jwt = app.get(JwtService);
    const claims = await jwt.verifyAsync<{
      sub: string;
      iat: number;
      exp: number;
    }>(body.data.accessToken);
    expect(claims.sub).toBe(account.id);
    expect(claims.exp - claims.iat).toBe(body.data.expiresIn);
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'sub']);
    await expect(
      jwt.verifyAsync(body.data.accessToken, {
        clockTimestamp: claims.exp + 1,
      }),
    ).rejects.toThrow();
  });

  it.each(['missing-user', 'deleted-user', 'wrong-password', 'invalid-hash'])(
    'returns the same 401 for %s',
    async (scenario) => {
      if (scenario === 'missing-user')
        users.findByEmail.mockResolvedValue(null);
      if (scenario === 'deleted-user') {
        users.findByEmail.mockResolvedValue({
          ...account,
          deletedAt: account.createdAt,
        });
      }
      if (scenario === 'invalid-hash') {
        users.findByEmail.mockResolvedValue({
          ...account,
          passwordHash: 'broken-hash',
        });
      }
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: account.email,
          password:
            scenario === 'wrong-password' ? 'incorrect password' : password,
        })
        .expect(401);
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        errorCode: 'AUTH-401',
        message: 'Email or password is incorrect',
      });
      expect(response.body).not.toHaveProperty('data');
      expect(response.text).not.toContain('accessToken');
      expect(users.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    { email: 'invalid', password: 'some password' },
    { email: 'alice@example.com', password: '' },
    { email: 'alice@example.com', password: null },
    { email: 'alice@example.com', password: 'x'.repeat(129) },
    { email: 'alice@example.com', password: 'some password', role: 'ADMIN' },
  ])(
    'rejects invalid login input before querying the database: %j',
    async (body) => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(body)
        .expect(400);
      expect(response.body).toMatchObject({
        success: false,
        errorCode: 'SYS-400',
      });
      expect(users.findByEmail).not.toHaveBeenCalled();
    },
  );

  it('does not expose a database failure as a credential error or leak its details', async () => {
    users.findByEmail.mockRejectedValue(new Error('Private database detail'));
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password })
      .expect(500);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: 'SYS-500',
    });
    expect(response.text).not.toContain('Private database detail');
  });

  it('register still stores a real password hash and returns only public fields', async () => {
    users.findByEmail.mockResolvedValue(null);
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ' ALICE@EXAMPLE.COM ', password })
      .expect(201);
    const stored = users.create.mock.calls[0][0];
    expect(stored.email).toBe('alice@example.com');
    expect(stored.passwordHash).not.toBe(password);
    expect(
      await app.get(HashService).verify(stored.passwordHash, password),
    ).toBe(true);
    expect(stored).not.toHaveProperty('role');
    expect(response.body).toMatchObject({
      success: true,
      data: { email: 'alice@example.com', username: null, role: 'MEMBER' },
    });
    expect(response.text).not.toContain('passwordHash');
    expect(response.text).not.toContain(stored.passwordHash);
  });

  it.each(['existing-email', 'concurrent-registration'])(
    'returns 409 for %s',
    async (scenario) => {
      if (scenario === 'concurrent-registration') {
        users.findByEmail.mockResolvedValue(null);
        users.create.mockRejectedValue(
          new EmailAlreadyExistsError(new Error('duplicate')),
        );
      }
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: account.email, password })
        .expect(409);
      expect(response.body).toMatchObject({
        success: false,
        errorCode: 'AUTH-409',
      });
    },
  );

  it('documents login as 200 with the response envelope', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const responses = document.paths['/auth/login'].post?.responses;
    expect(responses?.['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            allOf: [
              { $ref: '#/components/schemas/ApiSuccessResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/AuthResponseDto' },
                },
              },
            ],
          },
        },
      },
    });
    expect(responses?.['401']).toBeDefined();
  });
});
