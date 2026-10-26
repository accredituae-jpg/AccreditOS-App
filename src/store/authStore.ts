import { create } from "zustand";
import { UserRole, getActiveRole, setActiveRole } from "@/lib/permissions";
import { clearAuthToken } from "@/lib/api";
import { appConfig } from "@/config/appConfig";

interface AuthState {
  token: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  
  login: (token: string, user: { id?: string; _id?: string; name: string; email: string; role: UserRole }) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("accreditOS_auth_token"),
  userId: localStorage.getItem("accreditOS_user_id"),
  userName: localStorage.getItem("accreditOS_user_name"),
  userEmail: localStorage.getItem("accreditOS_user_email"),
  activeRole: getActiveRole(),
  isAuthenticated: !!localStorage.getItem("accreditOS_auth_token"),

  login: (token, user) => {
    localStorage.setItem("accreditOS_auth_token", token);
    localStorage.removeItem("accreditOS_active_role");
    localStorage.setItem("accreditOS_user_id", user.id || user._id || "");
    localStorage.setItem("accreditOS_user_name", user.name);
    localStorage.setItem("accreditOS_user_email", user.email);
    localStorage.setItem("accreditOS_user_role", user.role);
    set({
      token,
      userId: user.id || user._id || "",
      userName: user.name,
      userEmail: user.email,
      activeRole: user.role,
      isAuthenticated: true
    });
    window.dispatchEvent(new Event("accreditOS_role_changed"));
  },

  setRole: (role) => {
    if (!appConfig.enableRoleSwitcher) {
      return;
    }

    setActiveRole(role);
    set({ activeRole: role });
  },

  logout: () => {
    clearAuthToken();
    set({
      token: null,
      userId: null,
      userName: null,
      userEmail: null,
      activeRole: "trainer",
      isAuthenticated: false
    });
  }
}));
export type { UserRole };
