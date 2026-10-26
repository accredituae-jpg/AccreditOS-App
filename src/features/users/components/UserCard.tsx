import { motion } from "framer-motion";
import {
  Mail,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type UserRole, type UserProfile } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<UserRole, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  operation_admin: "bg-success/10 text-success border-success/20",
  trainer: "bg-info/10 text-info border-info/20",
  sales: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

interface UserCardProps {
  user: UserProfile;
  canEditUser: boolean;
  canDeleteUser: boolean;
  onViewDetails: (user: UserProfile) => void;
  onEditClick: (user: UserProfile) => void;
  onDeleteClick: (user: UserProfile) => void;
}

export function UserCard({
  user,
  canEditUser,
  canDeleteUser,
  onViewDetails,
  onEditClick,
  onDeleteClick,
}: UserCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid-card flex h-full flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">{user.name}</h3>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 capitalize", ROLE_STYLES[user.role])}>
          {ROLE_LABELS[user.role]}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          <span>{user.mobile || "No mobile number"}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2 rounded-lg"
          onClick={() => onViewDetails(user)}
        >
          <Eye className="h-3.5 w-3.5" />
          View Details
        </Button>

        {(canEditUser || canDeleteUser) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {canEditUser && (
                <DropdownMenuItem onClick={() => onEditClick(user)}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                </DropdownMenuItem>
              )}
              {user.role !== "super_admin" && canDeleteUser && (
                <>
                  {canEditUser && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => onDeleteClick(user)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}
