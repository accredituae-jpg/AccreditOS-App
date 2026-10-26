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

export const userService = {
  getUsers: async (): Promise<UserProfile[]> => {
    const res = await apiGetUsers();
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch users");
    }
    return res.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<CreateUserResponse> => {
    const res = await apiCreateUser(payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to create user");
    }
    return res.data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<UserProfile> => {
    const res = await apiUpdateUser(id, payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to update user");
    }
    return res.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await apiDeleteUser(id);
    if (!res.success) {
      throw new Error(res.message || "Failed to delete user");
    }
  },
};
