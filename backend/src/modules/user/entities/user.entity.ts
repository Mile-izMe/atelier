import type { Models } from '#app/prisma/contract';

export type UserEntity = Pick<
  Models.public_User,
  | 'id'
  | 'email'
  | 'passwordHash'
  | 'username'
  | 'role'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>;

export type UserRole = UserEntity['role'];
export type CreateUserInput = Pick<UserEntity, 'email' | 'passwordHash'> & {
  username?: string | null;
};
export type UpdateUserInput = Partial<Pick<UserEntity, 'username'>>;
export type UserProfile = Omit<UserEntity, 'passwordHash' | 'deletedAt'>;
