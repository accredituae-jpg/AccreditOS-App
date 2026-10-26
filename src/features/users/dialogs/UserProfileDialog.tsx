import { EditUserDialog } from "./EditUserDialog";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  return (
    <EditUserDialog
      open={open}
      onOpenChange={onOpenChange}
      selectedUser={null}
    />
  );
}
