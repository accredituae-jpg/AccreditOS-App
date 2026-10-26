import { AxiosRequestConfig } from "axios";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  errors?: string[];
  requestId?: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: string[];
  statusCode?: number;
  requestId?: string;
}

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  idempotencyKey?: string;
  skipAuth?: boolean;
  requestStartTime?: number;
}
