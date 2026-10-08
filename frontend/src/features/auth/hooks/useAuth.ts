"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import { sessionChangedError } from "@/src/shared/lib/auth-session";
import { authApi } from "../api";
import type { LoginInput, RegisterInput } from "../types";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const version = useAuthStore.getState().sessionVersion;
      const session = await authApi.login(input);
      if (version !== useAuthStore.getState().sessionVersion) {
        throw sessionChangedError();
      }

      queryClient.removeQueries();
      useAuthStore.getState().setAuth(session);
      return session;
    },
    onSuccess: () => toast.success("Đăng nhập thành công"),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: () => toast.success("Đăng ký thành công. Bạn có thể đăng nhập."),
  });
}

// The current profile comes from login; BE has no /users/me endpoint yet.
export function useProfile() {
  return useAuthStore((state) => state.user);
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
      await queryClient.cancelQueries();
      queryClient.removeQueries();
    },
    onSuccess: () => toast.success("Đã đăng xuất"),
  });
}
