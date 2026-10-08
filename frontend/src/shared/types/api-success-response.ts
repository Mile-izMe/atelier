export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  meta?: CursorPaginationMeta;
  traceId?: string;
}
