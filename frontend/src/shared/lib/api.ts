import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store";
import type { ApiSuccessResponse, CursorPaginationMeta } from "../types";
import { ApiClientError, normalizeApiError } from "./api-error";
import { sessionChangedError } from "./auth-session";
import { httpConfig } from "./http-config";

export { ApiClientError } from "./api-error";

declare module "axios" {
  interface AxiosRequestConfig {
    requiresAuth?: boolean;
  }
}

interface SessionRequest extends InternalAxiosRequestConfig {
  sessionVersion?: number;
}

export const api = axios.create(httpConfig);

api.interceptors.request.use((config: SessionRequest) => {
  if (!config.requiresAuth) return config;
  if (typeof window === "undefined") {
    throw new ApiClientError(
      "Authenticated requests must run in the browser.",
      null,
      "CLIENT_ONLY",
    );
  }

  const session = useAuthStore.getState();
  if (
    config.sessionVersion !== undefined &&
    config.sessionVersion !== session.sessionVersion
  ) {
    throw sessionChangedError();
  }
  if (!session.accessToken) {
    throw new ApiClientError("Vui lòng đăng nhập để tiếp tục.", 401);
  }

  config.sessionVersion = session.sessionVersion;
  config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config as SessionRequest;
    if (
      config.requiresAuth &&
      config.sessionVersion !== useAuthStore.getState().sessionVersion
    ) {
      throw sessionChangedError();
    }
    return response;
  },
  (error: unknown) => {
    if (!axios.isAxiosError(error)) throw normalizeApiError(error);

    const config = error.config as SessionRequest | undefined;
    const session = useAuthStore.getState();
    if (config?.requiresAuth) {
      if (config.sessionVersion !== session.sessionVersion) {
        throw sessionChangedError();
      }
      if (error.response?.status === 401) session.clearAuth();
    }
    throw normalizeApiError(error);
  },
);

function isApiSuccess<T>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value
  );
}

export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiSuccessResponse<T>>(config);
  if (!isApiSuccess<T>(response.data)) {
    throw new ApiClientError(
      "Phản hồi từ máy chủ không hợp lệ.",
      response.status,
    );
  }
  return response.data.data;
}

export async function requestCursorPage<T>(
  config: AxiosRequestConfig,
): Promise<{ items: T[]; meta: CursorPaginationMeta }> {
  const response = await api.request<ApiSuccessResponse<T[]>>(config);
  const body = response.data;
  if (
    !isApiSuccess<T[]>(body) ||
    !Array.isArray(body.data) ||
    !body.meta ||
    typeof body.meta.hasMore !== "boolean" ||
    !Number.isInteger(body.meta.limit) ||
    body.meta.limit <= 0 ||
    (body.meta.nextCursor !== null && typeof body.meta.nextCursor !== "string")
  ) {
    throw new ApiClientError(
      "Phản hồi phân trang không hợp lệ.",
      response.status,
    );
  }
  return { items: body.data, meta: body.meta };
}

export async function requestNoContent(
  config: AxiosRequestConfig,
): Promise<void> {
  const response = await api.request(config);
  if (response.status !== 204) {
    throw new ApiClientError(
      "Phản hồi từ máy chủ không hợp lệ.",
      response.status,
    );
  }
}
