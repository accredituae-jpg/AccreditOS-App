import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

export interface DashboardStats {
  clients: {
    total: number;
    change: number;
  };
  trainings: {
    completed: number;
    change: number;
    upcoming: number;
    pending: number;
  };
  finance: {
    revenue: number;
    revenueChange: number;
    expenses: number;
    expensesChange: number;
    profit: number;
    profitChange: number;
    pending: number;
    pendingChange: number;
  };
  certificates: {
    expiring: number;
  };
}

export async function apiGetDashboardStats(
  period: string,
  startDate?: string,
  endDate?: string,
): Promise<ApiResponse<DashboardStats>> {
  let query = `/api/dashboard/stats?period=${encodeURIComponent(period)}`;
  if (startDate) query += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) query += `&endDate=${encodeURIComponent(endDate)}`;

  return fetchApi<DashboardStats>(query);
}

export interface SystemTableFootprint {
  tableName: string;
  sizePretty: string;
  bytes: number;
  approxRows: number;
}

export interface SystemStorageMetrics {
  usedBytes: number;
  usedMb: number;
  usedPretty: string;
  quotaMb: number;
  freeMb: number;
  usedPercent: number;
  freePercent: number;
  databaseName: string;
  provider: string;
  status: "healthy" | "warning" | "critical";
  tables: SystemTableFootprint[];
  timestamp: string;
}

export async function apiGetSystemStorage(): Promise<ApiResponse<SystemStorageMetrics>> {
  return fetchApi<SystemStorageMetrics>("/api/dashboard/system-storage");
}
