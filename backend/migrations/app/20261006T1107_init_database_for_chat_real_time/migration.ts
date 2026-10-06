#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/f38d4b1766e4994c5919b1005aea4941cc14628b9b7b2e5a29b05fe42e1f0ce4/contract';
import endContract from '../../snapshots/f38d4b1766e4994c5919b1005aea4941cc14628b9b7b2e5a29b05fe42e1f0ce4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'channels',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('created_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('guildId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updated_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'conversation_members',
        columns: [
          col('conversationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['userId', 'conversationId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'conversations',
        columns: [
          col('channel_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('created_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('direct_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updated_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'conversations_type_check_a53cf064',
            "\"type\" IN ('CHANNEL', 'DIRECT', 'AI')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'guild_members',
        columns: [
          col('guildId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('joined_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['userId', 'guildId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'guilds',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('created_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updated_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'messages',
        columns: [
          col('author_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('client_message_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('conversation_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('created_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('edited_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('revoke_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('sender_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updated_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'messages_sender_type_check_33566804',
            "\"sender_type\" IN ('USER', 'ASSISTANT')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('created_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('deleted_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('MEMBER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updated_by', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('username', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('users_role_check_49b83496', "\"role\" IN ('MEMBER', 'ADMIN')"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'conversations',
        constraint: 'conversations_channel_id_key',
        columns: ['channel_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'conversations',
        constraint: 'conversations_direct_key_key',
        columns: ['direct_key'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'messages',
        constraint: 'messages_author_id_client_message_id_key',
        columns: ['author_id', 'client_message_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'channels',
        index: 'channels_guildId_idx_b8c02cbb',
        columns: ['guildId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation_members',
        index: 'conversation_members_conversationId_idx_669215a6',
        columns: ['conversationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversation_members',
        index: 'conversation_members_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'guild_members',
        index: 'guild_members_guildId_idx_b8c02cbb',
        columns: ['guildId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'guild_members',
        index: 'guild_members_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'guilds',
        index: 'guilds_ownerId_idx_e2d0c1ef',
        columns: ['ownerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_author_id_idx_f3862461',
        columns: ['author_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversation_id_created_at_id_idx_3c009cf9',
        columns: ['conversation_id', 'created_at', 'id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversation_id_idx_0c3639df',
        columns: ['conversation_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'channels',
        foreignKey: {
          name: 'channels_guildId_fkey',
          columns: ['guildId'],
          references: { schema: 'public', table: 'guilds', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversation_members',
        foreignKey: {
          name: 'conversation_members_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversation_members',
        foreignKey: {
          name: 'conversation_members_conversationId_fkey',
          columns: ['conversationId'],
          references: { schema: 'public', table: 'conversations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversations',
        foreignKey: {
          name: 'conversations_channel_id_fkey',
          columns: ['channel_id'],
          references: { schema: 'public', table: 'channels', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'guild_members',
        foreignKey: {
          name: 'guild_members_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'guild_members',
        foreignKey: {
          name: 'guild_members_guildId_fkey',
          columns: ['guildId'],
          references: { schema: 'public', table: 'guilds', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'guilds',
        foreignKey: {
          name: 'guilds_ownerId_fkey',
          columns: ['ownerId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_author_id_fkey',
          columns: ['author_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_conversation_id_fkey',
          columns: ['conversation_id'],
          references: { schema: 'public', table: 'conversations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
