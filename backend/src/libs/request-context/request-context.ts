import { AsyncLocalStorage } from 'node:async_hooks';

// One store per HTTP request; concurrent requests cannot overwrite each other.
export const requestContext = new AsyncLocalStorage<{ traceId: string }>();

export function getTraceId(): string | undefined {
  return requestContext.getStore()?.traceId;
}
