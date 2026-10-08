import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiValidationPipe } from '#app/libs/exceptions/api-validation.pipe';
import { PrismaService } from '#app/prisma/prisma.service';
import { UsersService } from '#app/modules/user/user.service';
import { ConversationService } from './conversation.service.js';
import { ConversationRepository } from './repository/conversation.repository.js';
import { CreateConversationRequestDto } from './request/create-conversation.dto.js';
import type { ConversationEntity } from './entities/conversation.entity.js';

const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const directKey = [userA, userB].sort().join(':');
const direct: ConversationEntity = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  type: 'DIRECT',
  channelId: null,
  directKey,
  createdAt: '2026-10-08T00:00:00.000Z',
  updatedAt: '2026-10-08T00:00:00.000Z',
};

describe('DIRECT conversation service', () => {
  const repository = {
    getOrCreateDirect:
      jest.fn<
        (
          userId: string,
          directId: string,
          key: string,
        ) => Promise<ConversationEntity>
      >(),
    createAiForUser: jest.fn<(userId: string) => Promise<ConversationEntity>>(),
  };
  const users = { getUserProfile: jest.fn<(id: string) => Promise<object>>() };
  let service: ConversationService;

  beforeEach(async () => {
    repository.getOrCreateDirect.mockReset().mockResolvedValue(direct);
    repository.createAiForUser.mockReset().mockResolvedValue({
      ...direct,
      type: 'AI',
      directKey: null,
    });
    users.getUserProfile.mockReset().mockResolvedValue({});
    const module = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: ConversationRepository, useValue: repository },
        { provide: UsersService, useValue: users },
      ],
    }).compile();
    service = module.get(ConversationService);
  });

  it('uses the same pair key for A -> B and B -> A and hides it in the response', async () => {
    const first = await service.create(userA, {
      type: 'DIRECT',
      directId: userB,
    });
    const second = await service.create(userB, {
      type: 'DIRECT',
      directId: userA,
    });
    expect(repository.getOrCreateDirect).toHaveBeenNthCalledWith(
      1,
      userA,
      userB,
      directKey,
    );
    expect(repository.getOrCreateDirect).toHaveBeenNthCalledWith(
      2,
      userB,
      userA,
      directKey,
    );
    expect(users.getUserProfile).toHaveBeenCalledWith(userA);
    expect(users.getUserProfile).toHaveBeenCalledWith(userB);
    expect(first.id).toBe(second.id);
    expect(first).not.toHaveProperty('directKey');
  });

  it('normalizes UUID case before creating the pair key', async () => {
    await service.create(userA.toUpperCase(), {
      type: 'DIRECT',
      directId: userB.toUpperCase(),
    });
    expect(repository.getOrCreateDirect).toHaveBeenCalledWith(
      userA,
      userB,
      directKey,
    );
  });

  it.each([userA, userA.toUpperCase()])(
    'rejects a direct chat with yourself: %s',
    async (directId) => {
      await expect(
        service.create(userA, { type: 'DIRECT', directId }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.getOrCreateDirect).not.toHaveBeenCalled();
    },
  );

  it('requires the recipient even when the service is called without a validation pipe', async () => {
    await expect(
      service.create(userA, { type: 'DIRECT' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.getOrCreateDirect).not.toHaveBeenCalled();
  });

  it('does not write when the recipient is missing or deactivated', async () => {
    users.getUserProfile.mockImplementation((id) =>
      id === userB
        ? Promise.reject(new NotFoundException())
        : Promise.resolve({}),
    );
    await expect(
      service.create(userA, { type: 'DIRECT', directId: userB }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.getOrCreateDirect).not.toHaveBeenCalled();
  });

  it('rejects a channelId on a direct conversation', async () => {
    await expect(
      service.create(userA, {
        type: 'DIRECT',
        directId: userB,
        channelId: direct.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.getOrCreateDirect).not.toHaveBeenCalled();
  });

  it('still supports AI creation without a recipient', async () => {
    const response = await service.create(userA, { type: 'AI' });
    expect(response.type).toBe('AI');
    expect(repository.createAiForUser).toHaveBeenCalledWith(userA);
    expect(repository.getOrCreateDirect).not.toHaveBeenCalled();
  });

  it('rejects a recipient on an AI conversation', async () => {
    await expect(
      service.create(userA, { type: 'AI', directId: userB }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createAiForUser).not.toHaveBeenCalled();
  });
});

describe('DIRECT request validation', () => {
  const validate = (body: object) =>
    new ApiValidationPipe().transform(body, {
      type: 'body',
      metatype: CreateConversationRequestDto,
    });

  it('accepts a valid recipient and keeps directId optional for other types', async () => {
    await expect(
      validate({ type: 'DIRECT', directId: userB }),
    ).resolves.toMatchObject({
      type: 'DIRECT',
      directId: userB,
    });
    await expect(validate({ type: 'AI' })).resolves.toMatchObject({
      type: 'AI',
    });
    await expect(
      validate({ type: 'CHANNEL', channelId: direct.id }),
    ).resolves.toMatchObject({
      type: 'CHANNEL',
    });
  });

  it.each([
    { type: 'DIRECT' },
    { type: 'DIRECT', directId: null },
    { type: 'DIRECT', directId: 'not-a-uuid' },
    { type: 'DIRECT', directId: userB, directKey: 'client-key' },
  ])('rejects invalid direct requests: %j', async (body) => {
    await expect(validate(body)).rejects.toThrow();
  });
});

describe('DIRECT repository transaction', () => {
  type MemberInput = { userId: string; conversationId: string };
  const createConversation =
    jest.fn<(input: unknown) => Promise<ConversationEntity>>();
  const createMember = jest.fn<(input: MemberInput) => Promise<MemberInput>>();
  const tx = {
    orm: {
      public: {
        Conversation: { create: createConversation },
        ConversationMember: { create: createMember },
      },
    },
  };
  const transaction =
    jest.fn<
      (
        operation: (context: typeof tx) => Promise<ConversationEntity>,
      ) => Promise<ConversationEntity>
    >();
  let repository: ConversationRepository;
  let findExisting: jest.SpiedFunction<
    ConversationRepository['findDirectByKey']
  >;

  const duplicate = () =>
    Object.assign(new Error('duplicate pair'), {
      sqlState: '23505',
      constraint: 'conversations_direct_key_key',
    });

  beforeEach(() => {
    createConversation.mockReset().mockResolvedValue(direct);
    createMember
      .mockReset()
      .mockImplementation((input) => Promise.resolve(input));
    transaction.mockReset().mockImplementation((operation) => operation(tx));
    // Only the ORM methods and transaction seam used by this repository are mocked.
    const prisma = {
      orm: { public: { Conversation: {} } },
      transaction,
    } as unknown as PrismaService;
    repository = new ConversationRepository(prisma);
    findExisting = jest
      .spyOn(repository, 'findDirectByKey')
      .mockResolvedValue(null);
  });

  it('creates the conversation and exactly two memberships through one transaction', async () => {
    await expect(
      repository.getOrCreateDirect(userA, userB, directKey),
    ).resolves.toEqual(direct);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(createConversation).toHaveBeenCalledWith({
      type: 'DIRECT',
      directKey,
      channelId: null,
      createdBy: userA,
    });
    expect(createMember.mock.calls).toEqual([
      [{ conversationId: direct.id, userId: userA }],
      [{ conversationId: direct.id, userId: userB }],
    ]);
  });

  it('returns an existing chat without writing another conversation or membership', async () => {
    findExisting.mockResolvedValue(direct);
    await expect(
      repository.getOrCreateDirect(userA, userB, directKey),
    ).resolves.toEqual(direct);
    expect(transaction).not.toHaveBeenCalled();
    expect(createMember).not.toHaveBeenCalled();
  });

  it('propagates member creation failure out of the transaction callback', async () => {
    const failure = new Error('membership write failed');
    createMember.mockResolvedValueOnce({
      conversationId: direct.id,
      userId: userA,
    });
    createMember.mockRejectedValueOnce(failure);
    await expect(
      repository.getOrCreateDirect(userA, userB, directKey),
    ).rejects.toBe(failure);
    expect(findExisting).toHaveBeenCalledTimes(1);
  });

  it('returns one conversation ID when simultaneous pair creation hits the unique constraint', async () => {
    findExisting
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(direct);
    transaction.mockImplementationOnce((operation) => operation(tx));
    transaction.mockRejectedValueOnce(duplicate());
    const results = await Promise.all([
      repository.getOrCreateDirect(userA, userB, directKey),
      repository.getOrCreateDirect(userB, userA, directKey),
    ]);
    expect(results.map((conversation) => conversation.id)).toEqual([
      direct.id,
      direct.id,
    ]);
    expect(createMember).toHaveBeenCalledTimes(2);
    expect(findExisting).toHaveBeenCalledTimes(3);
  });

  it('does not hide unique violations on a different constraint', async () => {
    const failure = Object.assign(new Error('unrelated conflict'), {
      sqlState: '23505',
      constraint: 'conversation_members_pkey',
    });
    transaction.mockRejectedValue(failure);
    await expect(
      repository.getOrCreateDirect(userA, userB, directKey),
    ).rejects.toBe(failure);
    expect(findExisting).toHaveBeenCalledTimes(1);
  });

  it('propagates a pair conflict if its winning row cannot be reloaded', async () => {
    const failure = duplicate();
    transaction.mockRejectedValue(failure);
    await expect(
      repository.getOrCreateDirect(userA, userB, directKey),
    ).rejects.toBe(failure);
  });
});
