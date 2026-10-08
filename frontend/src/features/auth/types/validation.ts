export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username?: string;
  password: string;
}
