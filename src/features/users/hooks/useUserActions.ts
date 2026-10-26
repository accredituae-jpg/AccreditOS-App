import { useUserStore } from "../store/user.store";
import { useToast } from "@/hooks/use-toast";
import { type UserRole, ROLE_LABELS } from "@/lib/permissions";
import { type CreateUserPayload, type UpdateUserPayload } from "@/lib/api";

export function useUserActions() {
  const { toast } = useToast();
  const { createUser, updateUser, deleteUser } = useUserStore();

  const handleCreate = async (userData: CreateUserPayload) => {
    try {
      const result = await createUser(userData);
      toast({
        title: "User Created",
        description: result.generatedPassword
          ? `Temporary password for ${result.user.name}: ${result.generatedPassword}`
          : `Successfully added ${result.user.name} as ${ROLE_LABELS[userData.role]}.`,
      });
      return result;
    } catch (error) {
      toast({
        title: "Unable to Create User",
        description: error instanceof Error ? error.message : "Failed to create user.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdate = async (
    id: string,
    userData: UpdateUserPayload
  ) => {
    try {
      const result = await updateUser(id, userData);
      toast({
        title: "User Updated",
        description: `User settings for ${userData.name} have been saved.`,
      });
      return result;
    } catch (error) {
      toast({
        title: "Unable to Update User",
        description: error instanceof Error ? error.message : "Failed to update user.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteUser(id);
      toast({
        title: "User Deleted",
        description: `${name} has been removed from the platform.`,
      });
    } catch (error) {
      toast({
        title: "Unable to Delete User",
        description: error instanceof Error ? error.message : "Failed to delete user.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
