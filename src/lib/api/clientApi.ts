import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

export interface ClientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export async function apiGetClients(params?: ClientQueryParams): Promise<ApiResponse<any[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status && params.status !== "all") searchParams.set("status", params.status);
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.order) searchParams.set("order", params.order);

  const queryString = searchParams.toString();
  return fetchApi(`/api/clients${queryString ? `?${queryString}` : ""}`);
}

export async function apiGetClientOptions(): Promise<ApiResponse<any[]>> {
  return fetchApi("/api/clients/options");
}

export async function apiCreateClient(data: any): Promise<ApiResponse<any>> {
  return fetchApi("/api/clients", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function apiUpdateClient(id: string, data: any): Promise<ApiResponse<any>> {
  return fetchApi(`/api/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function apiUpdateClientCourseRates(id: string, courseRates: any): Promise<ApiResponse<any>> {
  return fetchApi(`/api/clients/${id}/course-rates`, {
    method: "PATCH",
    body: JSON.stringify({ courseRates })
  });
}

export async function apiDeleteClient(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/clients/${id}`, {
    method: "DELETE"
  });
}

export async function apiGetClientSoa(
  id: string,
  params?: { fromDate?: string; toDate?: string }
): Promise<ApiResponse<any>> {
  const searchParams = new URLSearchParams();
  if (params?.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params?.toDate) searchParams.set("toDate", params.toDate);
  const qs = searchParams.toString();
  return fetchApi(`/api/clients/${id}/soa${qs ? `?${qs}` : ""}`);
}

