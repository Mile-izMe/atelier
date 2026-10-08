export interface ApiErrorResponse {
  success: false;
  timestamp: string;
  statusCode: number;
  error: string;
  errorCode: string;
  message: string;
  traceId: string;
  subErrors?: Array<{ field: string; message: string }>;
}
