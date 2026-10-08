import { AuthModule } from '#app/modules/auth/auth.module';
import { UserModule } from '#app/modules/user/user.module';
import { jest } from '@jest/globals';
import {
  Controller,
  Get,
  type INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '#app/app.module';
import { CustomLogger } from '#app/libs/logger/logger.service';
import { PrismaService } from '#app/prisma/prisma.service';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '#app/modules/auth/guards/auth.guard';
import { RolesGuard } from '#app/modules/auth/guards/roles.guard';
import { Roles } from '#app/modules/auth/guards/roles.decorator';
import { UserRepository } from '#app/modules/user/repository/user.repository';
import type { UserEntity } from '#app/modules/user/entities/user.entity';
import { ConversationRepository } from '#app/modules/messaging/repository/conversation.repository';
import type { ConversationEntity } from '#app/modules/messaging/entities/conversation.entity';

const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userC = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const conversationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const testSecret = 'test-only-guard-key-never-use-in-production';

// These routes exist only in the test module.
@Controller('__guard-test')
@UseGuards(AuthGuard)
class GuardTestController {
  @Get('identity')
  identity(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(['ADMIN'])
  admin() {
    return { allowed: true };
  }
}

describe('Guarded messaging routes (HTTP, mocked repositories)', () => {
  let app: INestApplication<Server>;
  let jwt: JwtService;
  let token: string;
  const accounts = new Map<string, UserEntity>();
  const users = {
    findActiveById: jest.fn<(id: string) => Promise<UserEntity | null>>(),
  };
  const ai: ConversationEntity = {
    id: conversationId,
    type: 'AI',
    channelId: null,
    directKey: null,
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
  const conversations = {
    createAiForUser: jest.fn<(id: string) => Promise<ConversationEntity>>(),
    getOrCreateDirect:
      jest.fn<
        (id: string, peer: string, key: string) => Promise<ConversationEntity>
      >(),
    findById: jest.fn<(id: string) => Promise<ConversationEntity | null>>(),
    hasMember: jest.fn<(id: string, user: string) => Promise<boolean>>(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, AuthModule, UserModule],
      controllers: [GuardTestController],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(UserRepository)
      .useValue(users)
      .overrideProvider(ConversationRepository)
      .useValue(conversations)
      .overrideProvider('JWT_MODULE_OPTIONS')
      .useValue({
        secret: testSecret,
        signOptions: { algorithm: 'HS256', expiresIn: 900 },
        verifyOptions: { algorithms: ['HS256'] },
      })
      .overrideProvider(CustomLogger)
      .useValue({ debug: jest.fn(), log: jest.fn(), error: jest.fn() })
      .compile();
    app = module.createNestApplication();
    await app.init();
    jwt = app.get(JwtService);
    token = await jwt.signAsync({ sub: userA });
  });

  beforeEach(() => {
    accounts.clear();
    for (const id of [userA, userB, userC]) {
      accounts.set(id, {
        id,
        role: 'MEMBER',
        email: id + '@example.com',
        username: null,
        passwordHash: 'private-password-hash',
        deletedAt: null,
        createdAt: ai.createdAt,
        updatedAt: ai.updatedAt,
      });
    }
    users.findActiveById.mockReset().mockImplementation((id) => {
      const account = accounts.get(id.toLowerCase());
      return Promise.resolve(
        account && account.deletedAt === null ? account : null,
      );
    });
    conversations.createAiForUser.mockReset().mockResolvedValue(ai);
    conversations.getOrCreateDirect
      .mockReset()
      .mockImplementation((_id, _peer, key) =>
        Promise.resolve({ ...ai, type: 'DIRECT', directKey: key }),
      );
    conversations.findById
      .mockReset()
      .mockImplementation((id) =>
        Promise.resolve(id === conversationId ? ai : null),
      );
    conversations.hasMember
      .mockReset()
      .mockImplementation((_id, user) =>
        Promise.resolve(user === userA || user === userB),
      );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns the current database profile with public fields and ignores a query userId', async () => {
    accounts.set(userA, {
      ...accounts.get(userA)!,
      role: 'ADMIN',
      username: 'alice',
    });
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .query({ userId: userB })
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(users.findActiveById).toHaveBeenCalledTimes(1);
    expect(users.findActiveById).toHaveBeenCalledWith(userA);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      success: true,
      message: 'Profile loaded',
      traceId: response.headers['x-trace-id'],
      data: {
        id: userA,
        email: userA + '@example.com',
        username: 'alice',
        role: 'ADMIN',
        createdAt: ai.createdAt,
        updatedAt: ai.updatedAt,
      },
    });
    const body = response.body as { data: Record<string, unknown> };
    expect(Object.keys(body.data).sort()).toEqual(
      ['id', 'email', 'username', 'role', 'createdAt', 'updatedAt'].sort(),
    );
    expect(response.text).not.toContain('private-password-hash');
  });

  it.each(['missing-token', 'invalid-token', 'expired-token', 'deleted-user'])(
    'rejects GET /users/me for %s',
    async (scenario) => {
      let header: string | undefined = 'Bearer ' + token;
      if (scenario === 'missing-token') header = undefined;
      if (scenario === 'invalid-token') header = 'Bearer invalid-token';
      if (scenario === 'expired-token') {
        header =
          'Bearer ' + (await jwt.signAsync({ sub: userA }, { expiresIn: -1 }));
      }
      if (scenario === 'deleted-user') {
        accounts.set(userA, {
          ...accounts.get(userA)!,
          deletedAt: ai.createdAt,
        });
      }
      const pending = request(app.getHttpServer()).get('/users/me');
      if (header) pending.set('Authorization', header);
      const response = await pending.expect(401);
      expect(response.body).toMatchObject({ success: false, statusCode: 401 });
      expect(response.body).not.toHaveProperty('data');
    },
  );

  it('masks an account lookup failure on GET /users/me', async () => {
    users.findActiveById.mockRejectedValue(
      new Error('private profile database detail'),
    );
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(500);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: 'SYS-500',
    });
    expect(response.text).not.toContain('private profile database detail');
  });

  it('documents GET /users/me as a protected public user response', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const get = document.paths['/users/me'].get;
    expect(get?.security).toEqual([{ bearer: [] }]);
    expect(get?.responses['401']).toBeDefined();
    expect(get?.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            allOf: [
              { $ref: '#/components/schemas/ApiSuccessResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/UserResponseDto' },
                },
              },
            ],
          },
        },
      },
    });
    expect(document.components?.schemas?.UserResponseDto).toMatchObject({
      properties: {
        id: expect.any(Object) as unknown,
        email: expect.any(Object) as unknown,
      },
    });
  });

  it('creates an AI chat using the authenticated user ID and the standard envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'AI' })
      .expect(201);
    expect(conversations.createAiForUser).toHaveBeenCalledWith(userA);
    expect(users.findActiveById).toHaveBeenCalledTimes(1);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Conversation ready',
      data: { id: conversationId, type: 'AI', channelId: null },
      traceId: response.headers['x-trace-id'],
    });
    expect(response.text).not.toContain('passwordHash');
    expect(response.text).not.toContain('directKey');
  });

  it('creates a DIRECT chat using the guard user as sender and directId as the peer', async () => {
    await request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'DIRECT', directId: userB })
      .expect(201);
    expect(conversations.getOrCreateDirect).toHaveBeenCalledWith(
      userA,
      userB,
      [userA, userB].sort().join(':'),
    );
  });

  it('rejects a user ID injected into the request body', async () => {
    await request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'AI', userId: userB })
      .expect(400);
    expect(conversations.createAiForUser).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    'Basic abc',
    'Bearer',
    'Bearer one two',
    'Bearer invalid-token',
  ])(
    'rejects missing or malformed Authorization: %s',
    async (authorization) => {
      const pending = request(app.getHttpServer()).post(
        '/messaging/conversations',
      );
      if (authorization) pending.set('Authorization', authorization);
      const response = await pending.send({ type: 'AI' }).expect(401);
      expect(response.body).toMatchObject({ success: false, statusCode: 401 });
      expect(conversations.createAiForUser).not.toHaveBeenCalled();
      expect(users.findActiveById).not.toHaveBeenCalled();
    },
  );

  it.each([
    'expired',
    'future',
    'wrong-secret',
    'wrong-algorithm',
    'missing-sub',
    'bad-sub',
    'missing-exp',
  ])('rejects a token with %s', async (scenario) => {
    let invalid: string;
    switch (scenario) {
      case 'expired':
        invalid = await jwt.signAsync({ sub: userA }, { expiresIn: -1 });
        break;
      case 'future':
        invalid = await jwt.signAsync({ sub: userA }, { notBefore: 60 });
        break;
      case 'wrong-secret':
        invalid = await jwt.signAsync(
          { sub: userA },
          { secret: 'a-different-signing-key' },
        );
        break;
      case 'wrong-algorithm':
        invalid = await jwt.signAsync({ sub: userA }, { algorithm: 'HS384' });
        break;
      case 'missing-sub':
        invalid = await jwt.signAsync({});
        break;
      case 'bad-sub':
        invalid = await jwt.signAsync({ sub: 'not-a-uuid' });
        break;
      default:
        invalid = await new JwtService({ secret: testSecret }).signAsync({
          sub: userA,
        });
    }
    await request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', 'Bearer ' + invalid)
      .send({ type: 'AI' })
      .expect(401);
    expect(conversations.createAiForUser).not.toHaveBeenCalled();
    expect(users.findActiveById).not.toHaveBeenCalled();
  });

  it.each(['missing', 'deleted'])(
    'rejects a token for an account that is %s',
    async (scenario) => {
      if (scenario === 'missing') accounts.delete(userA);
      else
        accounts.set(userA, {
          ...accounts.get(userA)!,
          deletedAt: ai.createdAt,
        });
      await request(app.getHttpServer())
        .post('/messaging/conversations')
        .set('Authorization', 'Bearer ' + token)
        .send({ type: 'AI' })
        .expect(401);
      expect(conversations.createAiForUser).not.toHaveBeenCalled();
    },
  );

  it('keeps account lookup failures as masked server errors', async () => {
    users.findActiveById.mockRejectedValue(
      new Error('private database detail'),
    );
    const response = await request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'AI' })
      .expect(500);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: 'SYS-500',
    });
    expect(response.text).not.toContain('private database detail');
    expect(conversations.createAiForUser).not.toHaveBeenCalled();
  });

  it('loads a conversation only when the authenticated user is a member', async () => {
    const response = await request(app.getHttpServer())
      .get('/messaging/conversations/' + conversationId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(conversations.hasMember).toHaveBeenCalledWith(conversationId, userA);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Conversation loaded',
      data: { id: conversationId },
    });
  });

  it('rejects access to another user conversation', async () => {
    const outsiderToken = await jwt.signAsync({ sub: userC });
    await request(app.getHttpServer())
      .get('/messaging/conversations/' + conversationId)
      .set('Authorization', 'Bearer ' + outsiderToken)
      .expect(403);
    expect(conversations.hasMember).toHaveBeenCalledWith(conversationId, userC);
  });

  it('returns 404 for a conversation that does not exist', async () => {
    await request(app.getHttpServer())
      .get('/messaging/conversations/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
      .set('Authorization', 'Bearer ' + token)
      .expect(404);
  });

  it('validates the conversation UUID before querying the conversation repository', async () => {
    await request(app.getHttpServer())
      .get('/messaging/conversations/not-a-uuid')
      .set('Authorization', 'Bearer ' + token)
      .expect(400);
    expect(conversations.findById).not.toHaveBeenCalled();
  });

  it('requires directId when type is DIRECT', async () => {
    await request(app.getHttpServer())
      .post('/messaging/conversations')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'DIRECT' })
      .expect(400);
    expect(conversations.getOrCreateDirect).not.toHaveBeenCalled();
  });

  it('attaches only public user fields and uses the current database role', async () => {
    const claimedAdmin = await jwt.signAsync({ sub: userA, role: 'ADMIN' });
    const response = await request(app.getHttpServer())
      .get('/__guard-test/identity')
      .set('Authorization', 'Bearer ' + claimedAdmin)
      .expect(200);
    expect(response.body).toMatchObject({
      data: { id: userA, role: 'MEMBER' },
    });
    expect(response.text).not.toContain('passwordHash');
    expect(response.text).not.toContain('deletedAt');
    await request(app.getHttpServer())
      .get('/__guard-test/admin')
      .set('Authorization', 'Bearer ' + claimedAdmin)
      .expect(403);
  });

  it('allows the admin role from the current account record', async () => {
    accounts.set(userA, { ...accounts.get(userA)!, role: 'ADMIN' });
    const response = await request(app.getHttpServer())
      .get('/__guard-test/admin')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(response.body).toMatchObject({ data: { allowed: true } });
  });

  it('documents both messaging routes with bearer authentication and response envelopes', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const post = document.paths['/messaging/conversations'].post;
    const get = document.paths['/messaging/conversations/{id}'].get;
    expect(post?.security).toEqual([{ bearer: [] }]);
    expect(get?.security).toEqual([{ bearer: [] }]);
    expect(post?.responses['201']).toBeDefined();
    expect(post?.responses['401']).toBeDefined();
    expect(get?.responses['200']).toBeDefined();
    expect(get?.responses['403']).toBeDefined();
  });
});
