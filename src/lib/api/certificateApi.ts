import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

export async function apiGetCertificates(
  page = 1,
  limit = 12,
  search = "",
  expiryFilter = "all",
  awardingBodyId = "all",
  statusFilter = "all",
  extraFilters?: {
    clientId?: string;
    courseId?: string;
    certificateType?: string;
    unbilledOnly?: boolean;
    serviceType?: string;
    dateField?: "regDate" | "issueDate";
    invoiceStatus?: "all" | "invoiced" | "not_invoiced" | "paid" | "not_paid" | "unpaid";
    invoiceNo?: string;
    fromDate?: string;
    toDate?: string;
    fromCertNo?: string;
    toCertNo?: string;
  },
): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  if (expiryFilter && expiryFilter !== "all")
    params.set("expiryFilter", expiryFilter);
  if (awardingBodyId && awardingBodyId !== "all")
    params.set("awardingBodyId", awardingBodyId);
  if (statusFilter && statusFilter !== "all")
    params.set("status", statusFilter);
  if (extraFilters?.clientId) params.set("clientId", extraFilters.clientId);
  if (extraFilters?.courseId && extraFilters.courseId !== "all") params.set("courseId", extraFilters.courseId);
  if (extraFilters?.certificateType && extraFilters.certificateType !== "all") params.set("certificateType", extraFilters.certificateType);
  if (extraFilters?.unbilledOnly) params.set("unbilledOnly", "true");
  if (extraFilters?.invoiceStatus && extraFilters.invoiceStatus !== "all") {
    params.set("invoiceStatus", extraFilters.invoiceStatus);
  }
  if (extraFilters?.invoiceNo) params.set("invoiceNo", extraFilters.invoiceNo);
  if (extraFilters?.dateField) params.set("dateField", extraFilters.dateField);
  if (extraFilters?.serviceType)
    params.set("serviceType", extraFilters.serviceType);
  if (extraFilters?.fromDate) params.set("fromDate", extraFilters.fromDate);
  if (extraFilters?.toDate) params.set("toDate", extraFilters.toDate);
  if (extraFilters?.fromCertNo) params.set("fromCertNo", extraFilters.fromCertNo);
  if (extraFilters?.toCertNo) params.set("toCertNo", extraFilters.toCertNo);
  return fetchApi(`/api/certificates?${params.toString()}`);
}

export async function apiGetNextCertificateNumber(): Promise<
  ApiResponse<{ nextNumber: string; nextValue: number }>
> {
  return fetchApi("/api/certificates/next-number");
}

export async function apiGetCertificateSequence(): Promise<
  ApiResponse<{ currentValue: number; nextValue: number; nextNumber: string }>
> {
  return fetchApi("/api/certificates/sequence");
}

export async function apiUpdateCertificateSequence(
  nextValue: number
): Promise<
  ApiResponse<{ currentValue: number; nextValue: number; nextNumber: string }>
> {
  return fetchApi("/api/certificates/sequence", {
    method: "PUT",
    body: JSON.stringify({ nextValue }),
  });
}

export async function apiCreateCertificate(
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi("/api/certificates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiCreateCertificatesBulk(
  items: any[],
): Promise<ApiResponse<{ count: number; message: string; data: any[] }>> {
  return fetchApi("/api/certificates/bulk", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateCertificate(
  id: string,
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/certificates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCertificate(
  id: string,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/certificates/${id}`, {
    method: "DELETE",
  });
}
