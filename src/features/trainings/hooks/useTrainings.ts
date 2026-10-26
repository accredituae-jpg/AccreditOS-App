import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { apiGetClientOptions } from "@/lib/api";
import { useTrainingsStore } from "../store/trainings.store";
import { getActiveRole, checkFeaturePermission } from "@/lib/permissions";
import { apiGetAwardingBodies } from "@/lib/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { Training } from "../types/trainings.types";
import type { TrainingTab } from "../store/trainings.store";

const ITEMS_PER_PAGE = 12;

export function useTrainings() {
  const currentRole = getActiveRole();

  const { data: clients = [] } = useQuery({
    queryKey: qk.clientOptions,
    queryFn: async () => {
      const res = await apiGetClientOptions();
      return res.data || [];
    },
  });

  const {
    activeTab,
    tabTrainings,
    tabCounts,
    tabPages,
    currentPage,
    courses,
    loading,
    view,
    searchQuery,
    dateFilter,
    serviceTypeFilter,
    awardingBodyFilter,
    calendarMonth,
    trainings,
    setActiveTab,
    setView,
    setCurrentPage,
    setSearchQuery,
    setDateFilter,
    setServiceTypeFilter,
    setAwardingBodyFilter,
    setCalendarMonth,
    fetchTab,
    fetchTrainings,
    fetchCourses,
  } = useTrainingsStore();

  // Load initial data on mount — fetch today's tab and only fetch calendar data if in calendar view
  useEffect(() => {
    fetchTab("today", 1, "", dateFilter, serviceTypeFilter, awardingBodyFilter);
    if (view === "grid") {
      fetchTrainings(serviceTypeFilter, awardingBodyFilter);
    }
    fetchCourses();
  }, [fetchTab, fetchTrainings, fetchCourses, view]);

  // Pre-calculate permissions
  const canViewDetails = checkFeaturePermission(
    currentRole,
    "view_training_details",
  );
  const canEdit = checkFeaturePermission(currentRole, "edit_training");
  const canDelete = checkFeaturePermission(currentRole, "delete_training");
  const canCreate = checkFeaturePermission(currentRole, "create_training");

  // Current tab's trainings (already server-paginated and filtered)
  const paginatedTrainings = tabTrainings[activeTab] ?? [];
  const totalPages = tabPages[activeTab] ?? 1;

  // Handle tab change — fetch that tab's data from server
  const handleTabChange = (tab: TrainingTab) => {
    setActiveTab(tab);
  };

  // Handle page change within a tab
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTab(activeTab, page, searchQuery, dateFilter, serviceTypeFilter, awardingBodyFilter);
  };

  // Handle search — refetch active tab with search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    fetchTab(activeTab, 1, query, dateFilter, serviceTypeFilter, awardingBodyFilter);
  };

  // Pre-calculate date dimensions for calendar rendering (uses legacy all-trainings array)
  const { daysInMonth, startingDay } = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
  }, [calendarMonth]);

  // Helper map for awarding bodies
  const [awardingBodiesMap, setAwardingBodiesMap] = useState<
    Map<string, string>
  >(new Map());
  const [awardingBodiesOptions, setAwardingBodiesOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Awardings" }]);

  useEffect(() => {
    apiGetAwardingBodies()
      .then((res) => {
        if (Array.isArray(res)) {
          const map = new Map<string, string>();
          const options = [{ value: "all", label: "All Awardings" }];
          res.forEach((b) => {
            map.set(b.id, b.name);
            options.push({ value: b.id || b.name, label: b.name });
          });
          setAwardingBodiesMap(map);
          setAwardingBodiesOptions(options);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Index trainings by date for calendar lookups (filtered by awarding body and service type if applicable)
  const trainingsByDateMap = useMemo(() => {
    const map = new Map<string, Training[]>();
    for (const t of trainings) {
      if (serviceTypeFilter !== "all") {
        const isInspection =
          t.serviceType === "inspection" ||
          (t.courseName || "").toLowerCase().includes("inspection");
        const itemType = isInspection ? "inspection" : "training";
        if (itemType !== serviceTypeFilter) continue;
      }
      if (awardingBodyFilter !== "all") {
        const abName = awardingBodiesMap.get(t.awardingBodyId || "");
        if (
          t.awardingBodyId !== awardingBodyFilter &&
          abName !== awardingBodyFilter
        ) {
          continue;
        }
      }
      const list = map.get(t.regDate) || [];
      list.push(t);
      map.set(t.regDate, list);
    }
    return map;
  }, [trainings, serviceTypeFilter, awardingBodyFilter, awardingBodiesMap]);

  const getTrainingsForDate = (day: number) => {
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateKey = `${dayStr}-${month}-${year}`;
    return trainingsByDateMap.get(dateKey) || [];
  };

  return {
    // Tab state
    activeTab,
    tabCounts,
    handleTabChange,
    // Data
    paginatedTrainings,
    trainings,
    courses,
    clients,
    loading,
    // Date, Service Type & Awarding Body Filters
    dateFilter,
    setDateFilter,
    serviceTypeFilter,
    setServiceTypeFilter,
    awardingBodyFilter,
    setAwardingBodyFilter,
    awardingBodiesOptions,
    // Pagination
    currentPage,
    totalPages,
    totalItems: tabCounts[activeTab] || 0,
    handlePageChange,
    // Search
    searchQuery,
    handleSearchChange,
    // View
    view,
    setView,
    // Calendar
    calendarMonth,
    setCalendarMonth,
    daysInMonth,
    startingDay,
    getTrainingsForDate,
    // Refresh
    fetchTab,
    refreshTab: () =>
      fetchTab(
        activeTab,
        currentPage,
        searchQuery,
        dateFilter,
        serviceTypeFilter,
        awardingBodyFilter,
      ),
    // Permissions
    awardingBodiesMap,
    canViewDetails,
    canEdit,
    canDelete,
    canCreate,
  };
}
