import { toast } from "@/hooks/use-toast";
import { ApiResponse } from "@/types/api";
import { globalNavigate } from "@/lib/navigation";
import { appConfig } from "@/config/appConfig";

export class ValidationError extends Error {
  constructor(message: string, public errors?: string[]) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ServerError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ServerError";
  }
}

export class UnknownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownError";
  }
}

export function handleApiError(error: any): Error {
  console.error("API error handled:", error);
  let message = "An unexpected error occurred. Please try again.";
  let parsedError = error;

  const isAuthError =
    error instanceof AuthenticationError ||
    error?.name === "UnauthorizedError" ||
    error?.statusCode === 401 ||
    (typeof error?.message === "string" &&
      (error.message.includes("No token provided") ||
       error.message.includes("Invalid or expired token") ||
       error.message.includes("session has expired") ||
       error.message.includes("No active authentication session")));

  if (isAuthError) {
    // Suppress intrusive error toast storms on session expiry; smoothly redirect to login
    clearAuthToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      globalNavigate("/login", { replace: true });
    }
    return new AuthenticationError("Your session has expired. Please log in again.");
  }

  if (error instanceof ValidationError) {
    message = error.message;
  } else if (error instanceof PermissionError) {
    message = "You do not have permission to perform this action.";
  } else if (error instanceof NetworkError) {
    message = "Network error. Please check your internet connection.";
  } else if (error instanceof ServerError) {
    message = error.message || `Server error (Status: ${error.statusCode}).`;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
    parsedError = new Error(error);
  }

  toast({
    title: "Action Failed",
    description: message,
    variant: "destructive",
  });

  return parsedError;
}

const API_URL = appConfig.apiUrl;

import { privateClient } from "./axios/privateClient";
import { classifyApiError } from "./axios/errorHandler";

export function getAuthToken(): string | null {
  return localStorage.getItem("accreditOS_auth_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("accreditOS_auth_token", token);
}

export function clearAuthToken(): void {
  localStorage.removeItem("accreditOS_auth_token");
  localStorage.removeItem("accreditOS_active_role");
  localStorage.removeItem("accreditOS_user_id");
  localStorage.removeItem("accreditOS_user_name");
  localStorage.removeItem("accreditOS_user_email");
  localStorage.removeItem("accreditOS_user_role");
  localStorage.removeItem("accreditOS_user_bank_name");
  localStorage.removeItem("accreditOS_user_account_no");
  localStorage.removeItem("accreditOS_user_iban");
  window.dispatchEvent(new Event("accreditOS_role_changed"));
  window.dispatchEvent(new Event("auth_changed"));
}

export function unwrapApiData<T>(response: ApiResponse<T> | T | undefined | null): T | undefined {
  if (!response) {
    return undefined;
  }

  if (typeof response === "object" && response !== null && "success" in response && "message" in response) {
    return (response as ApiResponse<T>).data as T;
  }

  return response as T;
}

export function unwrapApiArray<T>(response: ApiResponse<T[]> | T[] | undefined | null): T[] {
  const unwrapped = unwrapApiData<T[]>(response);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit & { showToast?: boolean; timeout?: number } = {},
): Promise<ApiResponse<T>> {
  const method = (options.method || "GET").toUpperCase();
  try {
    const isBulk = endpoint.includes("/bulk");
    const config: any = {
      method: method.toLowerCase(),
      url: endpoint,
      timeout: options.timeout || (isBulk ? 120000 : undefined),
    };

    if (options.body) {
      if (typeof options.body === "string") {
        try {
          config.data = JSON.parse(options.body);
        } catch {
          config.data = options.body;
        }
      } else {
        config.data = options.body;
      }
    }

    const response = await privateClient.request(config);
    const rawData = response.data;

    if (rawData && typeof rawData === "object" && "success" in rawData) {
      return rawData as ApiResponse<T>;
    }

    return {
      success: true,
      message: "Request succeeded",
      data: rawData as T,
    };
  } catch (err: any) {
    const classified = classifyApiError(err);
    const shouldShowToast = options.showToast ?? (method !== "GET");
    if (shouldShowToast) {
      handleApiError(classified);
    } else {
      console.warn(`[API GET Error] ${endpoint}:`, classified.message);
    }
    throw classified;
  }
}
