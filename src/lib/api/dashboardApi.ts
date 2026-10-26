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
