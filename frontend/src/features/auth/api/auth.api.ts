import { requestData } from "@/src/shared/lib/api";
import { logoutSession } from "@/src/shared/lib/auth-session";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserType,
} from "../types";

export const authApi = {
  register: (input: RegisterInput): Promise<UserType> =>
    requestData<UserType>({
      method: "POST",
      url: "/auth/register",
      data: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        username: input.username?.trim() || undefined,
      },
    }),

  login: (input: LoginInput): Promise<AuthResponse> =>
    requestData<AuthResponse>({
      method: "POST",
      url: "/auth/login",
      data: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    }),

  logout: logoutSession,
};
