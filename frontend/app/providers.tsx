"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import { normalizeApiError } from "@/src/shared";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
        mutationCache: new MutationCache({
          onError: (error) => {
            const normalized = normalizeApiError(error);
            if (
              normalized.errorCode !== "SESSION_CHANGED" &&
              normalized.errorCode !== "REQUEST_CANCELLED"
            ) {
              toast.error(normalized.message);
            }
          },
        }),
      }),
  );

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.sessionVersion !== previous.sessionVersion) {
          void queryClient.cancelQueries();
          queryClient.removeQueries();
        }
      }),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
