import { create } from "zustand";
import {
  apiCreateUser,
  apiDeleteUser,
  apiGetUsers,
  apiUpdateUser,
  type CreateUserPayload,
  type CreateUserResponse,
  type UpdateUserPayload,
} from "@/lib/api";
import type { UserProfile } from "@/lib/permissions";

interface UserState {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (userData: CreateUserPayload) => Promise<CreateUserResponse>;
  updateUser: (id: string, userData: UpdateUserPayload) => Promise<UserProfile>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiGetUsers();
      if (res.success && res.data) {
        set({ users: res.data });
      } else {
        throw new Error(res.message || "Failed to fetch users");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch users";
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiCreateUser(userData);
      if (res.success && res.data?.user) {
        set({ users: [...get().users, res.data.user] });
        return res.data;
      }
      throw new Error(res.message || "Failed to create user");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (id, userData) => {
    const previousUsers = get().users;
    set({ loading: true, error: null });
    try {
      const res = await apiUpdateUser(id, userData);
      if (res.success && res.data) {
        set({
          users: previousUsers.map((user) => (user.id === id ? res.data : user)),
        });
        return res.data;
      }
      throw new Error(res.message || "Failed to update user");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      set({ users: previousUsers, error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteUser: async (id) => {
    const previousUsers = get().users;
    set({
      loading: true,
      error: null,
      users: previousUsers.filter((user) => user.id !== id),
    });

    try {
      const res = await apiDeleteUser(id);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete user");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      set({ users: previousUsers, error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
