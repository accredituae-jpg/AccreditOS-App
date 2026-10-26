import type { UserProfile, UserRole, UserAttachment } from "@/lib/permissions";

export type { UserProfile, UserRole, UserAttachment };

export interface UserTableProps {
  users: UserProfile[];
  canEditUser: boolean;
  canDeleteUser: boolean;
  onEditClick: (user: UserProfile) => void;
  onDeleteClick: (user: UserProfile) => void;
}
