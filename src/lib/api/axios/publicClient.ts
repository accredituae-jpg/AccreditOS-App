import axios from "axios";
import { appConfig } from "@/config/appConfig";
import { setupInterceptors } from "./interceptors";

const getBaseUrl = (): string => {
  const base = appConfig.apiUrl || "";
  if (base.endsWith("/api")) return base.replace(/\/api$/, "");
  return base.replace(/\/$/, "");
};

/**
 * Public Unauthenticated Axios Client Instance
 * Used for Login, Forgot Password, Verification OTP, and Public endpoints.
 */
export const publicClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupInterceptors(publicClient, false);
