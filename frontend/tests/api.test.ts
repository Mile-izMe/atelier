import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthResponse, UserType } from "@/src/features/auth/types";
import type { ApiErrorResponse } from "@/src/shared/types";

const user: UserType = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "alice@example.com",
  username: null,
  role: "MEMBER",
  createdAt: "2026-10-08T00:00:00.000Z",
  updatedAt: "2026-10-08T00:00:00.000Z",
};
const session: AuthResponse = {
  accessToken: "token-a",
  tokenType: "Bearer",
  expiresIn: 900,
  user,
};
const conversation = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  type: "AI",
  channelId: null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};
const envelope = (data: unknown) => ({
  success: true,
  message: "Success",
  data,
  timestamp: user.createdAt,
  traceId: "test-trace",
});
const errorBody = (statusCode: number): ApiErrorResponse => ({
  success: false,
  statusCode,
  error: "Request failed",
  errorCode: statusCode === 401 ? "HTTP-401" : "SYS-400",
  message:
    statusCode === 401 ? "Invalid or expired access token" : "Input not valid",
  timestamp: user.createdAt,
  traceId: "backend-trace",
  subErrors:
    statusCode === 400
      ? [{ field: "email", message: "Invalid email" }]
      : undefined,
});
const response = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
) => ({
  config,
  data,
  status,
  statusText: String(status),
  headers: new AxiosHeaders(),
});
const httpError = (config: InternalAxiosRequestConfig, status: number) =>
  new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    response(config, errorBody(status), status),
  );

let client: typeof import("@/src/shared/lib/api");
let store: (typeof import("@/store"))["useAuthStore"];
let authApi: (typeof import("@/src/features/auth/api/auth.api"))["authApi"];
let conversationApi: (typeof import("@/src/features/messaging/api/conversation.api"))["conversationApi"];

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("window", {});
  client = await import("@/src/shared/lib/api");
  store = (await import("@/store")).useAuthStore;
  authApi = (await import("@/src/features/auth/api/auth.api")).authApi;
  conversationApi = (
    await import("@/src/features/messaging/api/conversation.api")
  ).conversationApi;
});

describe("Frontend/backend API contract", () => {
  it("registers with only backend-supported fields and does not authenticate", async () => {
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      expect(config.url).toBe("/auth/register");
      expect(JSON.parse(config.data)).toEqual({
        email: user.email,
        password: "my sample password",
      });
      expect(config.headers.get("Authorization")).toBeUndefined();
      return response(config, envelope(user), 201);
    });
    client.api.defaults.adapter = adapter;
    const input = {
      email: " ALICE@EXAMPLE.COM ",
      username: " ",
      password: "my sample password",
      name: "Copied field",
      confirmPassword: "must not be sent",
    };
    expect(await authApi.register(input)).toEqual(user);
    expect(store.getState().status).toBe("unauthenticated");
    expect(store.getState().accessToken).toBeNull();
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("logs in using email/password and unwraps the token response", async () => {
    client.api.defaults.adapter = async (config) => {
      expect(config.url).toBe("/auth/login");
      expect(JSON.parse(config.data)).toEqual({
        email: user.email,
        password: "my sample password",
      });
      return response(config, envelope(session));
    };
    const result = await authApi.login({
      email: " ALICE@EXAMPLE.COM ",
      password: "my sample password",
    });
    expect(result).toEqual(session);
    expect(result).not.toHaveProperty("refreshToken");
  });

  it("adds bearer authorization for the existing messaging route", async () => {
    store.getState().setAuth(session);
    client.api.defaults.adapter = async (config) => {
      expect(config.baseURL).toBe("/backend");
      expect(config.url).toBe("/messaging/conversations");
      expect(config.headers.get("Authorization")).toBe("Bearer token-a");
      expect(JSON.parse(config.data)).toEqual({ type: "AI" });
      return response(config, envelope(conversation), 201);
    };
    expect(await conversationApi.create({ type: "AI" })).toEqual(conversation);
  });

  it("loads a conversation using the guarded backend GET route", async () => {
    store.getState().setAuth(session);
    client.api.defaults.adapter = async (config) => {
      expect(config.url).toBe("/messaging/conversations/" + conversation.id);
      expect(config.headers.get("Authorization")).toBe("Bearer token-a");
      return response(config, envelope(conversation));
    };
    expect(await conversationApi.get(conversation.id)).toEqual(conversation);
  });

  it("loads the current profile from the guarded backend endpoint", async () => {
    store.getState().setAuth(session);
    client.api.defaults.adapter = async (config) => {
      expect(config.url).toBe("/users/me");
      expect(config.headers.get("Authorization")).toBe("Bearer token-a");
      return response(config, envelope(user));
    };
    expect(await authApi.getProfile()).toEqual(user);
  });

  it("blocks a protected request with no token before dispatch", async () => {
    const adapter = vi.fn();
    client.api.defaults.adapter = adapter;
    await expect(conversationApi.create({ type: "AI" })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(adapter).not.toHaveBeenCalled();
  });

  it("does not clear an existing session when a public login returns 401", async () => {
    store.getState().setAuth(session);
    const version = store.getState().sessionVersion;
    client.api.defaults.adapter = async (config) => {
      throw httpError(config, 401);
    };
    await expect(
      authApi.login({ email: user.email, password: "wrong" }),
    ).rejects.toMatchObject({
      statusCode: 401,
      traceId: "backend-trace",
    });
    expect(store.getState().accessToken).toBe("token-a");
    expect(store.getState().sessionVersion).toBe(version);
  });

  it("clears the current session on a protected 401 without a refresh/retry", async () => {
    store.getState().setAuth(session);
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw httpError(config, 401);
    });
    client.api.defaults.adapter = adapter;
    await expect(conversationApi.create({ type: "AI" })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(store.getState().accessToken).toBeNull();
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("preserves structured backend field errors", async () => {
    client.api.defaults.adapter = async (config) => {
      throw httpError(config, 400);
    };
    await expect(
      authApi.register({ email: "invalid", password: "my sample password" }),
    ).rejects.toMatchObject({
      statusCode: 400,
      errorCode: "SYS-400",
      traceId: "backend-trace",
      subErrors: [{ field: "email", message: "Invalid email" }],
    });
  });

  it("rejects malformed response envelopes", async () => {
    client.api.defaults.adapter = async (config) => response(config, { user });
    await expect(
      authApi.login({ email: user.email, password: "my sample password" }),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      message: "Phản hồi từ máy chủ không hợp lệ.",
    });
  });

  it("keeps valid cursor metadata when unwrapping a cursor page", async () => {
    const meta = { hasMore: false, nextCursor: null, limit: 20 };
    client.api.defaults.adapter = async (config) =>
      response(config, { ...envelope([conversation]), meta });
    expect(await client.requestCursorPage({ url: "/example-page" })).toEqual({
      items: [conversation],
      meta,
    });
  });

  it.each([0, -1, 1.5])(
    "rejects an invalid cursor limit: %s",
    async (limit) => {
      client.api.defaults.adapter = async (config) =>
        response(config, {
          ...envelope([]),
          meta: { hasMore: false, nextCursor: null, limit },
        });
      await expect(
        client.requestCursorPage({ url: "/example-page" }),
      ).rejects.toMatchObject({
        name: "ApiClientError",
      });
    },
  );

  it("normalizes a timeout without inventing an HTTP status", async () => {
    client.api.defaults.adapter = async (config) => {
      throw new AxiosError("timeout", AxiosError.ECONNABORTED, config);
    };
    await expect(
      authApi.login({ email: user.email, password: "some password" }),
    ).rejects.toMatchObject({
      statusCode: null,
      message: "Yêu cầu quá thời gian. Vui lòng thử lại.",
    });
  });

  it("treats request cancellation separately without clearing auth", async () => {
    store.getState().setAuth(session);
    client.api.defaults.adapter = async () => {
      throw new CanceledError();
    };
    await expect(conversationApi.get(conversation.id)).rejects.toMatchObject({
      errorCode: "REQUEST_CANCELLED",
    });
    expect(store.getState().accessToken).toBe("token-a");
  });

  it("logs out locally without calling unsupported backend endpoints", async () => {
    store.getState().setAuth(session);
    const adapter = vi.fn();
    client.api.defaults.adapter = adapter;
    await authApi.logout();
    expect(store.getState().status).toBe("unauthenticated");
    expect(store.getState().accessToken).toBeNull();
    expect(adapter).not.toHaveBeenCalled();
  });

  it("blocks authenticated use of the browser store from server-side code", async () => {
    store.getState().setAuth(session);
    vi.unstubAllGlobals();
    const adapter = vi.fn();
    client.api.defaults.adapter = adapter;
    await expect(conversationApi.create({ type: "AI" })).rejects.toMatchObject({
      errorCode: "CLIENT_ONLY",
    });
    expect(adapter).not.toHaveBeenCalled();
  });
});

describe("Session changes while requests are in flight", () => {
  it("does not let a late 401 log out a newer session", async () => {
    store.getState().setAuth(session);
    let fail!: () => void;
    let started!: () => void;
    const dispatched = new Promise<void>((resolve) => {
      started = resolve;
    });
    client.api.defaults.adapter = (config) =>
      new Promise((_resolve, reject) => {
        fail = () => reject(httpError(config, 401));
        started();
      });
    const pending = conversationApi.create({ type: "AI" });
    const assertion = expect(pending).rejects.toMatchObject({
      errorCode: "SESSION_CHANGED",
    });
    await dispatched;
    store.getState().setAuth({
      ...session,
      accessToken: "token-b",
      user: { ...user, id: conversation.id },
    });
    fail();
    await assertion;
    expect(store.getState().accessToken).toBe("token-b");
  });

  it("does not deliver a previous user's response after logout/login", async () => {
    store.getState().setAuth(session);
    let finish!: () => void;
    let started!: () => void;
    const dispatched = new Promise<void>((resolve) => {
      started = resolve;
    });
    client.api.defaults.adapter = (config) =>
      new Promise((resolve) => {
        finish = () => resolve(response(config, envelope(conversation)));
        started();
      });
    const pending = conversationApi.get(conversation.id);
    const assertion = expect(pending).rejects.toMatchObject({
      errorCode: "SESSION_CHANGED",
    });
    await dispatched;
    await authApi.logout();
    store.getState().setAuth({ ...session, accessToken: "token-b" });
    finish();
    await assertion;
    expect(store.getState().accessToken).toBe("token-b");
  });
});
