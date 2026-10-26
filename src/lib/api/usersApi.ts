import { fetchApi } from "./client";
import type { ApiResponse } from "@/types/api";
import type { UserProfile, UserRole, UserAttachment } from "@/lib/permissions";

export interface EmergencyContactPayload {
  name: string;
  contactNumber: string;
  relation: string;
  country: string;
}

export interface EducationEntryPayload {
  courseName: string;
  institutionName: string;
  completedYear: number | string;
}

export interface WorkExperienceEntryPayload {
  companyName: string;
  designation: string;
  yearsOfExperience: number | string;
}

export interface EmployeeProfilePayload {
  personalDetails: {
    name: string;
    fatherName: string;
    dateOfBirth: string;
    bloodGroup: string;
    gender: "M" | "F" | "Other";
    religion: string;
    email: string;
    maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
    country: string;
    state: string;
  };
  permanentAddress: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
    contactNumber: string;
  };
  localAddress: {
    address: string;
    contactNumber: string;
  };
  emergencyContacts: EmergencyContactPayload[];
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    iban: string;
  };
  education: EducationEntryPayload[];
  workExperience: WorkExperienceEntryPayload[];
  declaration: {
    accepted: boolean;
    signatureDate?: string;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  password?: string;
  bankName?: string;
  accountNo?: string;
  iban?: string;
  attachments?: UserAttachment[];
  employeeProfile?: EmployeeProfilePayload;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  mobile?: string;
  role?: UserRole;
  password?: string;
  bankName?: string;
  accountNo?: string;
  iban?: string;
  attachments?: UserAttachment[];
  employeeProfile?: EmployeeProfilePayload;
}

export interface CreateUserResponse {
  user: UserProfile;
  generatedPassword?: string;
}

export async function apiGetUsers(): Promise<ApiResponse<UserProfile[]>> {
  return fetchApi<UserProfile[]>("/api/users");
}

export async function apiCreateUser(
  data: CreateUserPayload
): Promise<ApiResponse<CreateUserResponse>> {
  return fetchApi<CreateUserResponse>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateUser(
  id: string,
  data: UpdateUserPayload
): Promise<ApiResponse<UserProfile>> {
  return fetchApi<UserProfile>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiGetProfile(): Promise<ApiResponse<UserProfile>> {
  return fetchApi<UserProfile>("/api/users/profile");
}

export async function apiUpdateProfile(
  data: UpdateUserPayload
): Promise<ApiResponse<UserProfile>> {
  return fetchApi<UserProfile>("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteUser(id: string): Promise<ApiResponse<{ id: string }>> {
  return fetchApi<{ id: string }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export async function apiImpersonateUser(
  targetUserId: string
): Promise<ApiResponse<{ token: string; user: any }>> {
  return fetchApi<{ token: string; user: any }>("/api/auth/impersonate", {
    method: "POST",
    body: JSON.stringify({ targetUserId }),
  });
}
