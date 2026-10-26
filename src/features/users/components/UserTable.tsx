import React, { memo } from "react";
import { Mail, MoreHorizontal, Edit2, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, UserRole, UserProfile } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<UserRole, string> = {
  super_admin: "bg-red-500/10 text-red-500 border-red-500/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  operation_admin: "bg-success/10 text-success border-success/20",
  trainer: "bg-info/10 text-info border-info/20",
  sales: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

interface UserTableProps {
  users: UserProfile[];
  canEditUser: boolean;
  canDeleteUser: boolean;
  onViewDetails: (user: UserProfile) => void;
  onEditClick: (user: UserProfile) => void;
  onDeleteClick: (user: UserProfile) => void;
}

export const UserTable = memo(function UserTable({
  users,
  canEditUser,
  canDeleteUser,
  onViewDetails,
  onEditClick,
  onDeleteClick,
}: UserTableProps) {
  return (
    <div className="card-elevated overflow-hidden border border-border/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <th className="p-4 pl-6">Name</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Role Assigned</th>
              <th className="p-4">Mobile No.</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-muted/20 transition-colors duration-150 text-sm text-foreground/90 font-medium"
              >
                <td className="p-4 pl-6 font-semibold text-primary">{user.name}</td>
                <td className="p-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {user.email}
                  </div>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2.5 py-0.5 capitalize font-semibold border text-xs",
                      ROLE_STYLES[user.role]
                    )}
                  >
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </td>
                <td className="p-4 text-xs text-muted-foreground">{user.mobile || "-"}</td>
                <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                  {(canEditUser || canDeleteUser) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/70">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border border-border">
                        <DropdownMenuItem onClick={() => onViewDetails(user)} className="cursor-pointer">
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canEditUser && (
                          <DropdownMenuItem onClick={() => onEditClick(user)} className="cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                        )}
                        {/* Do not allow deleting super admins */}
                        {user.role !== "super_admin" && canDeleteUser && (
                          <>
                            {(canEditUser || true) && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={() => onDeleteClick(user)}
                              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground font-medium">
                  No staff accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
