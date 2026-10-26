import { fetchApi, unwrapApiArray, unwrapApiData } from "./client";
import { ApiResponse } from "@/types/api";

// Permissions
export async function apiGetPermissions(): Promise<ApiResponse<any>> {
  return fetchApi("/api/settings/permissions");
}

export async function apiSavePermissions(perms: any): Promise<ApiResponse<any>> {
  return fetchApi("/api/settings/permissions", {
    method: "POST",
    body: JSON.stringify(perms)
  });
}

// Awarding Bodies
export async function apiGetAwardingBodies(): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/awarding-bodies");
  return unwrapApiArray(response);
}

export async function apiCreateAwardingBody(data: any): Promise<any> {
  const response = await fetchApi<any>("/api/settings/awarding-bodies", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return unwrapApiData(response);
}

export async function apiUpdateAwardingBody(id: string, data: any): Promise<any> {
  const response = await fetchApi<any>(`/api/settings/awarding-bodies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return unwrapApiData(response);
}

// Invoice Types
export async function apiGetInvoiceTypes(): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/invoice-types");
  return unwrapApiArray(response);
}

export async function apiCreateInvoiceType(name: string): Promise<any> {
  const response = await fetchApi<any>("/api/settings/invoice-types", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  return unwrapApiData(response);
}

export async function apiUpdateInvoiceType(id: string, name?: string, isActive?: boolean): Promise<any> {
  const response = await fetchApi<any>(`/api/settings/invoice-types/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, isActive })
  });
  return unwrapApiData(response);
}

// Expense Categories
export async function apiGetExpenseCategories(): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/expense-categories");
  return unwrapApiArray(response);
}

export async function apiCreateExpenseCategory(name: string): Promise<any> {
  const response = await fetchApi<any>("/api/settings/expense-categories", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  return unwrapApiData(response);
}

export async function apiUpdateExpenseCategory(id: string, name?: string, isActive?: boolean): Promise<any> {
  const response = await fetchApi<any>(`/api/settings/expense-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, isActive })
  });
  return unwrapApiData(response);
}

// Certificate Types
export async function apiGetCertificateTypes(): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/certificate-types");
  return unwrapApiArray(response);
}

export async function apiSaveCertificateTypes(types: any[]): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/certificate-types", {
    method: "POST",
    body: JSON.stringify(types)
  });
  return unwrapApiArray(response);
}

// Company Documents
export async function apiGetCompanyDocuments(): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/company-documents");
  return unwrapApiArray(response);
}

export async function apiSaveCompanyDocuments(docs: any[]): Promise<any[]> {
  const response = await fetchApi<any[]>("/api/settings/company-documents", {
    method: "POST",
    body: JSON.stringify(docs)
  });
  return unwrapApiArray(response);
}
