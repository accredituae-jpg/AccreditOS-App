import { AxiosError } from "axios";
import { ApiErrorResponse } from "./types";

export class ApiBaseError extends Error {
  public statusCode?: number;
  public requestId?: string;
  public errors?: string[];

  constructor(message: string, statusCode?: number, requestId?: string, errors?: string[]) {
    super(message);
    this.name = "ApiBaseError";
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.errors = errors;
  }
}

export class NetworkError extends ApiBaseError {
  constructor(message = "Network connection failed. Please check your internet connection.") {
    super(message, 0);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends ApiBaseError {
  constructor(message = "Request timed out. Server took too long to respond.") {
    super(message, 408);
    this.name = "TimeoutError";
  }
}

export class UnauthorizedError extends ApiBaseError {
  constructor(message = "Your session has expired. Please log in again.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiBaseError {
  constructor(message = "Access denied. You do not have permission for this action.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends ApiBaseError {
  constructor(message: string, errors?: string[]) {
    super(message, 400, undefined, errors);
    this.name = "ValidationError";
  }
}

export class BusinessRuleError extends ApiBaseError {
  constructor(message: string, statusCode = 422) {
    super(message, statusCode);
    this.name = "BusinessRuleError";
  }
}

export class ServerError extends ApiBaseError {
  constructor(message = "Server error occurred. Please try again later.", statusCode = 500) {
    super(message, statusCode);
    this.name = "ServerError";
  }
}

/**
 * Classifies an Axios or unknown error into a domain-specific ApiBaseError instance.
 */
export function classifyApiError(error: any): ApiBaseError {
  if (error instanceof ApiBaseError) {
    return error;
  }

  if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
    return new TimeoutError();
  }

  if (!error.response) {
    return new NetworkError(error.message || "Unable to reach server.");
  }

  const status = error.response.status;
  const data: ApiErrorResponse = error.response.data || {};
  const message = data.error || data.message || `Request failed with status ${status}`;
  const requestId = data.requestId || error.response.headers["x-request-id"];

  if (typeof error.response.data === "string" && error.response.data.includes("<html")) {
    if (status === 404) {
      return new ServerError(`API Endpoint Not Found (404). Check backend deployment and VITE_API_URL.`, 404);
    }
    if (status === 502 || status === 503) {
      return new ServerError(`Backend API Server is temporarily unavailable (${status}).`, status);
    }
    return new ServerError(`Server returned HTML error (${status}).`, status);
  }

  switch (status) {
    case 400:
      return new ValidationError(message, data.errors);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ForbiddenError(message);
    case 422:
      return new BusinessRuleError(message, 422);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, status);
    default:
      return new ApiBaseError(message, status, requestId, data.errors);
  }
}
