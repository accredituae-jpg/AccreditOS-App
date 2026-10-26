import { useState } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { UserRole } from "@/lib/permissions";
import { useUserActions } from "../hooks/useUserActions";
import { UserForm, type UserFormSubmitData } from "../components/UserForm";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRole: UserRole;
  onSuccess?: () => void;
}

export function AddUserDialog({
  open,
  onOpenChange,
  activeRole,
  onSuccess,
}: AddUserDialogProps) {
  const { handleCreate } = useUserActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: UserFormSubmitData) => {
    setIsSubmitting(true);
    try {
      await handleCreate(data);
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add New User"
      description="Create a system user account and configure profile credentials."
      maxWidth="max-w-4xl"
    >
      <UserForm
        mode="create"
        activeRole={activeRole}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}
