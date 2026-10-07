export type UserRole = 'MEMBER' | 'ADMIN';

export interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  username: string | null;
}

// This shape never leaves the Users/Auth service boundary.
export interface UserCredentials extends UserProfile {
  passwordHash: string;
  deletedAt: string | null;
}

export interface UserAccount extends UserProfile {
  deletedAt: string | null;
}
