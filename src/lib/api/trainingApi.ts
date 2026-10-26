import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

export type TrainingTab = "today" | "pending" | "completed" | "cancelled";

export async function apiGetTrainings(
  tab?: TrainingTab,
  page = 1,
  search = "",
  limit = 12,
  fromDate?: string,
  toDate?: string,
  certificateIssued?: boolean,
  serviceType?: string,
  clientId?: string,
  awardingBodyId?: string
): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (tab) params.set("tab", tab);
  if (search) params.set("search", search);
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (certificateIssued !== undefined) params.set("certificateIssued", String(certificateIssued));
  if (serviceType && serviceType !== "all") params.set("serviceType", serviceType);
  if (clientId) params.set("clientId", clientId);
  if (awardingBodyId && awardingBodyId !== "all") params.set("awardingBodyId", awardingBodyId);
  return fetchApi(`/api/trainings?${params.toString()}`);
}

export async function apiGetTrainingOptions(status = "completed"): Promise<ApiResponse<any[]>> {
  return fetchApi(`/api/trainings/options?status=${status}`);
}

export async function apiCreateTraining(data: any): Promise<ApiResponse<any>> {
  return fetchApi("/api/trainings", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function apiUpdateTraining(id: string, data: any): Promise<ApiResponse<any>> {
  return fetchApi(`/api/trainings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function apiDeleteTraining(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/trainings/${id}`, {
    method: "DELETE"
  });
}

export async function apiBulkUpdateTrainingStatus(
  ids: string[],
  status: string
): Promise<ApiResponse<{ count: number }>> {
  return fetchApi("/api/trainings/bulk-status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status }),
  });
}

// Courses
export async function apiGetCourses(): Promise<ApiResponse<any[]>> {
  return fetchApi("/api/courses");
}

export async function apiCreateCourse(name: string): Promise<ApiResponse<any>> {
  return fetchApi("/api/courses", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export async function apiUpdateCourse(id: string, name: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name })
  });
}

export async function apiDeleteCourse(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/courses/${id}`, {
    method: "DELETE"
  });
}
