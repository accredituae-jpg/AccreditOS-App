import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { apiGetClients } from "@/lib/api/clientApi";
import { getActiveRole, checkFeaturePermission } from "@/lib/permissions";
import { Users, CheckCircle, Archive } from "lucide-react";
import type { StatsCardItem } from "@/components/ui/stats-card";
import type { Client } from "../types/client.types";

const ITEMS_PER_PAGE = 12;

export function useClients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRole, setCurrentRole] = useState(getActiveRole());

  const {
    data: clients = [],
    isLoading: loading,
    isError,
    refetch: refresh,
  } = useQuery<Client[]>({
    queryKey: qk.clients(),
    queryFn: async () => {
      const res = await apiGetClients({ limit: 1000 });
      return res.data || [];
    },
  });

  useEffect(() => {
    const handleRoleChange = () => {
      setCurrentRole(getActiveRole());
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    return () =>
      window.removeEventListener("accreditOS_role_changed", handleRoleChange);
  }, []);

  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return clients.filter((client) => {
      const matchesSearch =
        client.companyName.toLowerCase().includes(query) ||
        client.contactPerson.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.trnNo && client.trnNo.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const totalPages = useMemo(
    () => Math.ceil(filteredClients.length / ITEMS_PER_PAGE) || 1,
    [filteredClients],
  );

  const paginatedClients = useMemo(() => {
    return filteredClients.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredClients, currentPage]);

  const statsItems = useMemo<StatsCardItem[]>(
    () => [
      {
        title: "Total Clients",
        value: clients.length,
        icon: Users,
        color: "primary",
        description: "Total registered corporate clients and customer accounts.",
        loading,
      },
      {
        title: "Active Clients",
        value: clients.filter((c) => c.status === "active").length,
        icon: CheckCircle,
        color: "success",
        description: "Active clients currently eligible for training and billing.",
        loading,
      },
      {
        title: "Archived Clients",
        value: clients.filter((c) => c.status === "archived").length,
        icon: Archive,
        color: "warning",
        description: "Archived client records preserved for historical audit.",
        loading,
      },
    ],
    [clients, loading],
  );

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const canCreateClient = useMemo(
    () => checkFeaturePermission(currentRole, "create_client"),
    [currentRole],
  );
  const canViewClientDetails = useMemo(
    () => checkFeaturePermission(currentRole, "view_client_details"),
    [currentRole],
  );
  const canEditClient = useMemo(
    () => checkFeaturePermission(currentRole, "edit_client"),
    [currentRole],
  );
  const canDeleteClient = useMemo(
    () => checkFeaturePermission(currentRole, "delete_client"),
    [currentRole],
  );

  return {
    clients,
    filteredClients,
    paginatedClients,
    totalPages,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    statsItems,
    currentRole,
    canCreateClient,
    canViewClientDetails,
    canEditClient,
    canDeleteClient,
    loading,
    isError,
    refresh,
  };
}

