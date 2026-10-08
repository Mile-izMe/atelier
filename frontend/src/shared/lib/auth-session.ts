import { useAuthStore } from "@/store";
import { ApiClientError } from "./api-error";

export function sessionChangedError() {
  return new ApiClientError(
    "Phiên đăng nhập đã thay đổi. Vui lòng thử lại.",
    null,
    "SESSION_CHANGED",
  );
}

export async function logoutSession(): Promise<void> {
  // BE has no logout endpoint yet. Clear the browser session immediately.
  useAuthStore.getState().clearAuth();
}
