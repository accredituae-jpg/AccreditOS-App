import { UserRole } from "@/lib/permissions";
import { AddUserDialog } from "./AddUserDialog";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRole?: UserRole;
  onSuccess?: () => void;
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  activeRole = "super_admin",
  onSuccess,
}: AddEmployeeDialogProps) {
  return (
    <AddUserDialog
      open={open}
      onOpenChange={onOpenChange}
      activeRole={activeRole}
      onSuccess={onSuccess}
    />
  );
}
