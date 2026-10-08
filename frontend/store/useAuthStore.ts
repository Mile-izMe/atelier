import type { AuthResponse, UserType } from "@/src/features/auth/types";
import { create } from "zustand";

interface AuthState {
  sessionVersion: number;
  user: UserType | null;
  accessToken: string | null;
  status: "authenticated" | "unauthenticated";
  setAuth: (session: AuthResponse) => void;
  clearAuth: () => void;
}

// The token stays in memory. Reloading the page requires a new login.
export const useAuthStore = create<AuthState>((set) => ({
  sessionVersion: 0,
  user: null,
  accessToken: null,
  status: "unauthenticated",
  setAuth: ({ user, accessToken }) => {
    set((state) => ({
      user,
      accessToken,
      status: "authenticated",
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  clearAuth: () => {
    set((state) => ({
      user: null,
      accessToken: null,
      status: "unauthenticated",
      sessionVersion: state.sessionVersion + 1,
    }));
  },
}));
