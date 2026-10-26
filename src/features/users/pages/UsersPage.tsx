import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUsers } from "../hooks/useUsers";
import { useUserActions } from "../hooks/useUserActions";
import { UserTable, UserStats, UserCard } from "../components";
import { AddUserDialog, EditUserDialog, UserDetailsDialog } from "../dialogs";
import { getStoredViewPreference, setStoredViewPreference, subscribeViewPreference, ViewMode } from "@/lib/viewPreference";
import type { UserProfile } from "@/lib/permissions";

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  type: "confirm" | "warning" | "destructive" | "success" | "info";
  onConfirm: () => void;
}

export default function UsersPage() {
  const isMobile = useIsMobile();
  const [view, setViewState] = useState<ViewMode>(getStoredViewPreference());

  useEffect(() => {
    setViewState(getStoredViewPreference());
    return subscribeViewPreference((mode) => {
      setViewState(mode);
    });
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setStoredViewPreference(mode);
    setViewState(mode);
  };

  const {
    visibleUsers,
    loading,
    searchQuery,
    setSearchQuery,
    activeRole,
    statsItems,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    refresh,
  } = useUsers();

  const { handleDelete } = useUserActions();

  // Dialog open triggers
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewUser, setViewUser] = useState<UserProfile | null>(null);
  const effectiveView = isMobile ? "grid" : view;

  // Global Confirmation Popup state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    type: "confirm",
    onConfirm: () => {},
  });

  const handleOpenAdd = () => {
    setShowAddDialog(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleOpenDelete = (user: UserProfile) => {
    setConfirmDialog({
      open: true,
      title: "Delete User Account",
      description: `Are you sure you want to delete ${user.name}? This will revoke their access completely.`,
      type: "destructive",
      onConfirm: async () => {
        try {
          await handleDelete(user.id, user.name);
          refresh();
        } catch (err) {
          console.error("Error deleting user:", err);
        }
      },
    });
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Users & Access Control"
        description="Manage user credentials, roles, and administrative staff permissions"
        actions={
          canCreateUser && (
            <Button onClick={handleOpenAdd} className="gap-2 w-full sm:w-auto shadow-sm">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          )
        }
      />

      {/* Stats Grid */}
      <UserStats items={statsItems} />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search staff by name or email..."
        extraContent={
          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
            Showing role-relevant staff for: <span className="text-primary font-bold">{activeRole}</span>
          </div>
        }
        view={isMobile ? undefined : view}
        onViewChange={handleViewChange}
      />

      {loading ? (
        <div className="card-elevated grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted/80" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted/70" />
              </div>
              <div className="h-9 animate-pulse rounded-lg bg-muted/80" />
            </div>
          ))}
        </div>
      ) : effectiveView === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              canEditUser={canEditUser}
              canDeleteUser={canDeleteUser}
              onViewDetails={setViewUser}
              onEditClick={handleOpenEdit}
              onDeleteClick={handleOpenDelete}
            />
          ))}
          {visibleUsers.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No staff accounts found.
            </div>
          )}
        </div>
      ) : (
        <UserTable
          users={visibleUsers}
          canEditUser={canEditUser}
          canDeleteUser={canDeleteUser}
          onViewDetails={setViewUser}
          onEditClick={handleOpenEdit}
          onDeleteClick={handleOpenDelete}
        />
      )}

      <UserDetailsDialog
        open={!!viewUser}
        user={viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        activeRole={activeRole}
        onSuccess={refresh}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        selectedUser={selectedUser}
        activeRole={activeRole}
        onSuccess={refresh}
      />

      {/* Global Confirmation Popup */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
