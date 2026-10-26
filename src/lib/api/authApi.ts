import { setAuthToken } from "./client";
import { publicClient, privateClient } from "./axios";

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await publicClient.post("/auth/login", { email, password });
  const data = res.data;

  if (data.token) {
    setAuthToken(data.token);
  }
  if (data.user) {
    localStorage.setItem("accreditOS_user_id", data.user.id || "");
    localStorage.setItem("accreditOS_user_email", data.user.email || "");
    localStorage.setItem("accreditOS_user_name", data.user.name || "");
    localStorage.setItem("accreditOS_user_role", data.user.role || "");
    localStorage.setItem("accreditOS_active_role", data.user.role || "");
    window.dispatchEvent(new Event("accreditOS_role_changed"));
    window.dispatchEvent(new Event("auth_changed"));
  }
  return data;
}

export async function apiForgotPassword(email: string): Promise<{ message: string; otpPreview?: string }> {
  const res = await publicClient.post("/auth/forgot-password", { email });
  return res.data;
}

export async function apiVerifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
  const res = await publicClient.post("/auth/verify-otp", { email, otp });
  return res.data;
}

export async function apiResetPassword(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await publicClient.post("/auth/reset-password", { email, otp, newPassword });
  return res.data;
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await privateClient.post("/auth/change-password", { currentPassword, newPassword });
  return res.data;
}
