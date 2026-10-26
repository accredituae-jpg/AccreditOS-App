import { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getAuthToken, clearAuthToken } from "../client";
import { generateRequestId } from "./requestId";
import { classifyApiError, UnauthorizedError } from "./errorHandler";
import { ExtendedAxiosRequestConfig } from "./types";
import { globalNavigate } from "@/lib/navigation";

export function setupInterceptors(axiosInstance: AxiosInstance, isPrivate = true): void {
  // Request Interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig & ExtendedAxiosRequestConfig) => {
      // 0. Normalize URL path to prevent double /api/api/ prefixing
      if (config.url) {
        let url = config.url;
        if (url.startsWith("/api/api/")) {
          url = url.replace(/^\/api\/api\//, "/api/");
        } else if (!url.startsWith("/api/") && !url.startsWith("http")) {
          url = `/api/${url.replace(/^\//, "")}`;
        }
        config.url = url;
      }

      // 1. Attach Request Start Time for Performance Log
      config.requestStartTime = Date.now();

      // 2. Attach Correlation ID (X-Request-ID)
      config.headers.set("X-Request-ID", generateRequestId());

      // 3. Attach API Version Header
      config.headers.set("X-API-Version", "1");

      // 4. Attach Idempotency Key if specified for write operations
      if (config.idempotencyKey) {
        config.headers.set("Idempotency-Key", config.idempotencyKey);
      }

      // 5. Attach JWT Authorization Header for Private Client
      if (isPrivate && !config.skipAuth) {
        const token = getAuthToken();
        if (token) {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          // If no token exists for private requests, reject immediately to prevent tokenless request storms
          return Promise.reject(new UnauthorizedError("No active authentication session. Please log in."));
        }
      }

      return config;
    },
    (error) => Promise.reject(classifyApiError(error))
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      const classifiedError = classifyApiError(error);

      // Decoupled Session Expiry Handling: Dispatch global auth_expired event and navigate
      if (isPrivate && classifiedError instanceof UnauthorizedError) {
        console.warn("[API] 401 Session Expired. Clearing auth tokens and redirecting to login.");
        clearAuthToken();
        window.dispatchEvent(new CustomEvent("auth_expired", { detail: { message: classifiedError.message } }));
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          globalNavigate("/login", { replace: true });
        }
      }

      return Promise.reject(classifiedError);
    }
  );
}
