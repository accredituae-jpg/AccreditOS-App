import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { apiGetCertificates, apiGetAwardingBodies, apiGetClientOptions } from "@/lib/api";
import { subscribeViewPreference } from "@/lib/viewPreference";
import { useCertificatesStore } from "../store/certificates.store";
import { getActiveRole, checkFeaturePermission } from "@/lib/permissions";
import { Award, AlertTriangle, RefreshCw } from "lucide-react";
import type { StatsCardItem } from "@/components/ui/stats-card";
import type { Certificate } from "../types/certificates.types";

export function useCertificates() {
  const currentRole = getActiveRole();

  const {
    searchTerm,
    clientIdFilter,
    expiryFilter,
    awardingBodyFilter,
    statusFilter,
    fromCertNo,
    toCertNo,
    serviceTypeFilter,
    selectedCertificateIds,
    currentPage,
    view,
    setSearchTerm,
    setClientIdFilter,
    setExpiryFilter,
    setAwardingBodyFilter,
    setStatusFilter,
    setFromCertNo,
    setToCertNo,
    setServiceTypeFilter,
    setSelectedCertificateIds,
    toggleSelectCertificate,
    selectAllCertificates,
    clearSelectedCertificates,
    setCurrentPage,
    setView,
    resetFilters,
  } = useCertificatesStore();

  const [awardingBodiesOptions, setAwardingBodiesOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Awardings" }]);

  const { data: clientsData = [] } = useQuery({
    queryKey: qk.clientOptions,
    queryFn: async () => {
      const res = await apiGetClientOptions();
      return res.data || [];
    },
  });

  const clientOptions = useMemo(() => {
    const list = [{ value: "all", label: "All Companies" }];
    clientsData.forEach((c: any) => {
      if (c.companyName && c.companyName !== "Individual Candidate") {
        list.push({ value: c.id, label: c.companyName });
      }
    });
    return list;
  }, [clientsData]);

  useEffect(() => {
    return subscribeViewPreference((mode) => {
      useCertificatesStore.setState({ view: mode });
    });
  }, []);

  useEffect(() => {
    apiGetAwardingBodies()
      .then((res) => {
        if (Array.isArray(res)) {
          const options = [
            { value: "all", label: "All Awardings" },
            ...res.map((b) => ({ value: b.id || b.name, label: b.name })),
          ];
          setAwardingBodiesOptions(options);
        }
      })
      .catch((e) => console.error("Failed to load awarding bodies", e));
  }, []);

  const {
    data,
    isLoading: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: qk.certificates({
      page: currentPage,
      limit: 12,
      search: searchTerm,
      clientId: clientIdFilter,
      awardingBodyId: awardingBodyFilter,
      statusFilter,
      serviceType: serviceTypeFilter,
      fromCertNo,
      toCertNo,
    } as any),
    queryFn: async () => {
      const res = await apiGetCertificates(
        currentPage,
        12,
        searchTerm,
        "all", // validity filter removed
        awardingBodyFilter,
        statusFilter,
        {
          clientId: clientIdFilter !== "all" ? clientIdFilter : undefined,
          serviceType:
            serviceTypeFilter !== "all" ? serviceTypeFilter : undefined,
          fromCertNo,
          toCertNo,
        },
      );
      if (res.success && res.data) {
        const formatted = res.data.map((c: any) => {
          let issueDate = c.issueDate;
          let expiryDate = c.expiryDate;
          if (
            issueDate &&
            issueDate.includes("-") &&
            issueDate.split("-")[0].length === 4
          ) {
            const [y, m, d] = issueDate.split("-");
            issueDate = `${d}-${m}-${y}`;
          }
          if (
            expiryDate &&
            expiryDate.includes("-") &&
            expiryDate.split("-")[0].length === 4
          ) {
            const [y, m, d] = expiryDate.split("-");
            expiryDate = `${d}-${m}-${y}`;
          }
          return { ...c, issueDate, expiryDate };
        });

        const pages = (res as any).pagination?.pages ?? 1;
        const total = (res as any).pagination?.total ?? formatted.length;
        const stats = (res as any).stats || {
          total,
          valid: 0,
          expiring: 0,
          expired: 0,
        };

        return {
          certificates: formatted as Certificate[],
          totalPages: pages as number,
          totalItems: total as number,
          stats: stats as {
            total: number;
            valid: number;
            expiring: number;
            expired: number;
          },
        };
      }
      return {
        certificates: [] as Certificate[],
        totalPages: 1,
        totalItems: 0,
        stats: { total: 0, valid: 0, expiring: 0, expired: 0 },
      };
    },
  });

  const certificates = data?.certificates || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || 0;
  const stats = data?.stats || { total: 0, valid: 0, expiring: 0, expired: 0 };

  const canIssue = checkFeaturePermission(currentRole, "issue_certificate");
  const canViewDetails = checkFeaturePermission(
    currentRole,
    "view_certificate_details",
  );
  const canEdit = checkFeaturePermission(currentRole, "edit_certificate");
  const canDelete = checkFeaturePermission(currentRole, "delete_certificate");

  const statsItems = useMemo<StatsCardItem[]>(
    () => [
      {
        title: "Total Certificates",
        value: stats.total || certificates.length,
        icon: Award,
        color: "primary",
        description: "Total issued certificates across all awarding bodies and courses.",
        loading,
      },
      {
        title: "Valid",
        value: stats.valid,
        icon: Award,
        color: "success",
        description: "Active certificates with validity exceeding 90 days.",
        loading,
      },
      {
        title: "Expiring Soon",
        value: stats.expiring,
        icon: RefreshCw,
        color: "warning",
        description: "Certificates due to expire within the next 90 calendar days.",
        loading,
      },
      {
        title: "Expired",
        value: stats.expired,
        icon: AlertTriangle,
        color: "destructive",
        description: "Certificates that have exceeded their official expiration date.",
        loading,
      },
    ],
    [stats, certificates.length, loading],
  );

  return {
    certificates,
    loading,
    isError,
    searchTerm,
    setSearchTerm,
    clientIdFilter,
    setClientIdFilter,
    clientOptions,
    expiryFilter,
    setExpiryFilter,
    awardingBodyFilter,
    setAwardingBodyFilter,
    statusFilter,
    setStatusFilter,
    fromCertNo,
    setFromCertNo,
    toCertNo,
    setToCertNo,
    serviceTypeFilter,
    setServiceTypeFilter,
    resetFilters,
    awardingBodiesOptions,
    selectedCertificateIds,
    setSelectedCertificateIds,
    toggleSelectCertificate,
    selectAllCertificates,
    clearSelectedCertificates,
    currentPage,
    setCurrentPage,
    view,
    setView,
    totalItems,
    totalPages,
    filteredCertificates: certificates,
    paginatedCertificates: certificates,
    statsItems,
    canIssue,
    canViewDetails,
    canEdit,
    canDelete,
    isDeveloper:
      currentRole === "super_admin" || (currentRole as string) === "developer",
    loadLocalCertificates: () => refetch(),
  };
}
