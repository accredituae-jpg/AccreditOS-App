import { fetchApi } from "./client";
import type { ApiResponse } from "@/types/api";

export async function apiGetPayrollRecords(filters?: {
  month?: number;
  year?: number;
  userId?: string;
  status?: string;
}): Promise<ApiResponse<any[]>> {
  const query = new URLSearchParams();
  if (filters?.month) query.set("month", filters.month.toString());
  if (filters?.year) query.set("year", filters.year.toString());
  if (filters?.userId) query.set("userId", filters.userId);
  if (filters?.status) query.set("status", filters.status);
  return fetchApi(`/api/payroll/records?${query.toString()}`);
}

export async function apiUpdatePayrollRecord(id: string, data: any): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiApprovePayrollRecord(id: string, approvalNote?: string | null): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/records/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ approvalNote }),
  });
}

export async function apiPayPayrollRecord(id: string, paymentReference?: string, paymentDate?: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/records/${id}/pay`, {
    method: "POST",
    body: JSON.stringify({ paymentReference, paymentDate }),
  });
}

export async function apiCancelPayrollRecord(id: string, cancellationReason?: string | null): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/records/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancellationReason }),
  });
}

export async function apiDeletePayrollRecord(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/records/${id}`, {
    method: "DELETE",
  });
}

export async function apiGeneratePayroll(month: number, year: number, periodStart?: string, periodEnd?: string): Promise<ApiResponse<any[]>> {
  return fetchApi("/api/payroll/records/generate", {
    method: "POST",
    body: JSON.stringify({ month, year, periodStart, periodEnd }),
  });
}

export async function apiGetSalaryProfiles(activeOnly = false): Promise<ApiResponse<any[]>> {
  const query = new URLSearchParams();
  if (activeOnly) query.set("active", "true");
  return fetchApi(`/api/payroll/salary-profiles?${query.toString()}`);
}

export async function apiCreateSalaryProfile(payload: {
  userId: string;
  basicSalary: number;
  housingAllowance?: number;
  transportAllowance?: number;
  foodAllowance?: number;
  paymentMethod?: string;
  joiningDate?: string;
  isActive?: boolean;
}): Promise<ApiResponse<any>> {
  return fetchApi("/api/payroll/salary-profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSalaryProfile(id: string, payload: {
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  foodAllowance?: number;
  paymentMethod?: string;
  joiningDate?: string;
  isActive?: boolean;
}): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/salary-profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function apiGetSalaryAdvances(filters?: {
  employeeId?: string;
  month?: number;
  year?: number;
  status?: string;
}): Promise<ApiResponse<any[]>> {
  const query = new URLSearchParams();
  if (filters?.employeeId) query.set("employeeId", filters.employeeId);
  if (filters?.month) query.set("month", filters.month.toString());
  if (filters?.year) query.set("year", filters.year.toString());
  if (filters?.status) query.set("status", filters.status);
  return fetchApi(`/api/payroll/advances?${query.toString()}`);
}

export async function apiCreateSalaryAdvance(payload: {
  employeeId: string;
  amount: number;
  paymentDate: string;
  deductionMonth: number;
  deductionYear: number;
  paymentMethod: string;
  notes?: string;
}): Promise<ApiResponse<any>> {
  return fetchApi("/api/payroll/advances", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteSalaryAdvance(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/payroll/advances/${id}`, {
    method: "DELETE",
  });
}
