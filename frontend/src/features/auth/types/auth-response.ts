export type UserRole = "MEMBER" | "ADMIN";

export interface UserType {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserType;
}
