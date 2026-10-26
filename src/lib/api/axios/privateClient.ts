import axios from "axios";
import { appConfig } from "@/config/appConfig";
import { setupInterceptors } from "./interceptors";

const getBaseUrl = (): string => {
  const base = appConfig.apiUrl || "";
  if (base.endsWith("/api")) return base.replace(/\/api$/, "");
  return base.replace(/\/$/, "");
};

/**
 * Authenticated Private Axios Client Instance
 * Used for all ERP business operations (Billing, Payroll, Certificates, Clients, Users, Settings).
 * Automatically injects JWT Bearer header, X-Request-ID, X-API-Version, and handles 401 session expiry.
 */
export const privateClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupInterceptors(privateClient, true);
