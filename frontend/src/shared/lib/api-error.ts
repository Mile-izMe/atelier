import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null = null,
    public readonly errorCode?: string,
    public readonly traceId?: string,
    public readonly subErrors?: ApiErrorResponse["subErrors"],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function isApiError(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === false &&
    "message" in value &&
    typeof value.message === "string" &&
    "statusCode" in value &&
    typeof value.statusCode === "number"
  );
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (axios.isCancel(error)) {
    return new ApiClientError(
      "Yêu cầu đã được hủy.",
      null,
      "REQUEST_CANCELLED",
    );
  }

  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (isApiError(response?.data)) {
      const body = response.data;
      return new ApiClientError(
        body.message,
        response?.status ?? body.statusCode,
        body.errorCode,
        body.traceId,
        body.subErrors,
      );
    }

    if (!response) {
      return new ApiClientError(
        error.code === AxiosError.ETIMEDOUT ||
          error.code === AxiosError.ECONNABORTED
          ? "Yêu cầu quá thời gian. Vui lòng thử lại."
          : "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        null,
      );
    }

    return new ApiClientError(
      "Yêu cầu thất bại. Vui lòng thử lại.",
      response.status,
    );
  }

  return new ApiClientError("Đã xảy ra lỗi không xác định.", null);
}
