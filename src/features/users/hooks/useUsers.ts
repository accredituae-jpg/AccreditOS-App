import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserStore } from "../store/user.store";
import { getActiveRole, checkFeaturePermission, type UserRole } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { Users as UsersIcon, Shield } from "lucide-react";
import type { StatsCardItem } from "@/components/ui/stats-card";

export function useUsers() {
  const { toast } = useToast();
  const { users, loading, fetchUsers } = useUserStore();
  const [activeRole, setActiveRole] = useState<UserRole>(getActiveRole());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleRoleChange = () => {
      setActiveRole(getActiveRole());
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    return () => window.removeEventListener("accreditOS_role_changed", handleRoleChange);
  }, []);

  const loadUsers = useCallback(() => {
    fetchUsers().catch((error) => {
      toast({
        title: "Unable to Load Users",
        description: error instanceof Error ? error.message : "Failed to fetch users.",
        variant: "destructive",
      });
    });
  }, [fetchUsers, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const canCreateUser = useMemo(() => checkFeaturePermission(activeRole, "create_user"), [activeRole]);
  const canEditUser = useMemo(() => checkFeaturePermission(activeRole, "edit_user"), [activeRole]);
  const canDeleteUser = useMemo(() => checkFeaturePermission(activeRole, "delete_user"), [activeRole]);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      if (activeRole !== "super_admin" && user.role === "super_admin") {
        return false;
      }
      if (!normalizedSearch) return true;
      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, activeRole, searchQuery]);

  const stats = useMemo(() => {
    let admins = 0;
    let operators = 0;
    let trainers = 0;

    for (const u of visibleUsers) {
      if (u.role === "admin") {
        admins++;
      } else if (u.role === "operation_admin") {
        operators++;
      } else if (u.role === "trainer") {
        trainers++;
      }
    }

    return {
      totalCount: visibleUsers.length,
      adminCount: admins,
      operationCount: operators,
      trainerCount: trainers,
    };
  }, [visibleUsers]);

  const statsItems = useMemo<StatsCardItem[]>(() => [
    {
      title: "Total Staff",
      value: stats.totalCount,
      icon: UsersIcon,
      color: "primary",
      description: "Total registered system users and administrative team members.",
      loading,
    },
    {
      title: "Administrators",
      value: stats.adminCount,
      icon: Shield,
      color: "success",
      description: "Users with full executive administrative permissions.",
      loading,
    },
    {
      title: "Operators",
      value: stats.operationCount,
      icon: Shield,
      color: "warning",
      description: "Operations coordinators managing courses, clients, and scheduling.",
      loading,
    },
    {
      title: "Trainers",
      value: stats.trainerCount,
      icon: UsersIcon,
      color: "info",
      description: "Instructors and trainers delivering educational courses.",
      loading,
    },
  ], [stats, loading]);

  return {
    users,
    visibleUsers,
    loading,
    searchQuery,
    setSearchQuery,
    activeRole,
    statsItems,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    refresh: loadUsers,
  };
}
