import { useEffect, useMemo, useState, useCallback } from "react";
import { usePayrollStore } from "../store/payroll.store";
import { getActiveRole, checkFeaturePermission } from "@/lib/permissions";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
import { formatAED } from "@/lib/utils";
import {
  apiGetUsers,
  apiGetPayrollRecords,
  apiGetSalaryProfiles,
  apiGetSalaryAdvances,
} from "@/lib/api";
import { Clock, DollarSign, Plus, Users, ArrowUpRight } from "lucide-react";
import { getStoredViewPreference, setStoredViewPreference, subscribeViewPreference, ViewMode } from "@/lib/viewPreference";
import type { StatsCardItem } from "@/components/ui/stats-card";
import type { SalaryAdvance } from "../types/payroll.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ITEMS_PER_PAGE = 12;

export function usePayroll() {
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const currentRole = getActiveRole();

  const {
    records,
    salaryProfiles,
    employees,
    loading,
    salaryProfilesLoading,
    activeTab,
    setRecords,
    setSalaryProfiles,
    setEmployees,
    setLoading,
    setSalaryProfilesLoading,
    setActiveTab,
  } = usePayrollStore();

  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [advancesLoading, setAdvancesLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setViewState] = useState<ViewMode>(getStoredViewPreference());

  useEffect(() => {
    setViewState(getStoredViewPreference());
    return subscribeViewPreference((mode) => {
      setViewState(mode);
    });
  }, []);

  const setView = useCallback((mode: ViewMode) => {
    setStoredViewPreference(mode);
    setViewState(mode);
  }, []);

  const canViewPayroll = checkFeaturePermission(currentRole, "view_payroll");
  const canManagePayroll = checkFeaturePermission(currentRole, "manage_payroll");

  const loadPayrollData = useCallback(async (silent = false) => {
    if (!canViewPayroll) return;
    if (!silent) {
      setLoading(true);
      setSalaryProfilesLoading(true);
      setAdvancesLoading(true);
    }
    try {
      const [usersRes, payrollRes, profilesRes, advancesRes] = await Promise.all([
        apiGetUsers(),
        apiGetPayrollRecords(),
        apiGetSalaryProfiles(),
        apiGetSalaryAdvances(),
      ]);

      if (usersRes.success && usersRes.data) {
        const sortedUsers = usersRes.data
          .map((user) => ({ id: user.id, name: user.name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setEmployees(sortedUsers);
      }

      if (payrollRes.success && payrollRes.data) {
        setRecords(payrollRes.data);
      }

      if (profilesRes.success && profilesRes.data) {
        setSalaryProfiles(profilesRes.data);
      }

      if (advancesRes.success && advancesRes.data) {
        setAdvances(advancesRes.data);
      }
    } catch (err) {
      console.error("Payroll fetch failed", err);
    } finally {
      if (!silent) {
        setLoading(false);
        setSalaryProfilesLoading(false);
        setAdvancesLoading(false);
      }
    }
  }, [canViewPayroll, setEmployees, setRecords, setSalaryProfiles, setLoading, setSalaryProfilesLoading]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(records.map((r) => r.year)));
    return years.sort((a, b) => b - a);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return records.filter((record) => {
      const userName = record.userName || record.user?.name || "";
      const matchesSearch =
        !query ||
        userName.toLowerCase().includes(query) ||
        (record.notes || "").toLowerCase().includes(query) ||
        (record.paymentReference || "").toLowerCase().includes(query) ||
        (record.month && MONTH_NAMES[record.month - 1]
          ? MONTH_NAMES[record.month - 1].toLowerCase().includes(query)
          : false) ||
        (record.year ? record.year.toString().includes(query) : false);

      const matchesMonth = monthFilter === "all" || record.month?.toString() === monthFilter;
      const matchesYear = yearFilter === "all" || record.year?.toString() === yearFilter;
      const matchesUser = userFilter === "all" || record.userId === userFilter;
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;

      return matchesSearch && matchesMonth && matchesYear && matchesUser && matchesStatus;
    });
  }, [records, searchTerm, monthFilter, yearFilter, userFilter, statusFilter]);

  const filteredProfiles = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return salaryProfiles.filter((profile) => {
      const userName = profile.userName || profile.user?.name || "";
      const matchesSearch =
        !query ||
        userName.toLowerCase().includes(query) ||
        (profile.paymentMethod || "").toLowerCase().includes(query) ||
        (profile.joiningDate || "").toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [salaryProfiles, searchTerm]);

  const filteredAdvances = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return advances.filter((adv) => {
      const empName = adv.employeeName || "";
      const matchesSearch =
        !query ||
        empName.toLowerCase().includes(query) ||
        (adv.paymentMethod || "").toLowerCase().includes(query) ||
        (adv.notes || "").toLowerCase().includes(query);

      const matchesMonth = monthFilter === "all" || adv.deductionMonth?.toString() === monthFilter;
      const matchesYear = yearFilter === "all" || adv.deductionYear?.toString() === yearFilter;
      const matchesUser = userFilter === "all" || adv.employeeId === userFilter;

      return matchesSearch && matchesMonth && matchesYear && matchesUser;
    });
  }, [advances, searchTerm, monthFilter, yearFilter, userFilter]);

  const totalItems = useMemo(() => {
    return activeTab === "profiles"
      ? filteredProfiles.length
      : activeTab === "advances"
      ? filteredAdvances.length
      : filteredRecords.length;
  }, [activeTab, filteredProfiles.length, filteredAdvances.length, filteredRecords.length]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  }, [totalItems]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const pageProfiles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProfiles, currentPage]);

  const pageAdvances = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAdvances.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAdvances, currentPage]);

  const statsItems = useMemo<StatsCardItem[]>(() => {
    if (activeTab === "records" || activeTab === "bulk") {
      const employeeCount = new Set(records.map((r) => r.userId)).size;
      const currentPayroll = records.reduce((sum, r) => sum + r.netSalary, 0);
      const pendingPayroll = records
        .filter((r) => r.status === "draft")
        .reduce((sum, r) => sum + r.netSalary, 0);
      const paidPayroll = records
        .filter((r) => r.status === "paid")
        .reduce((sum, r) => sum + r.netSalary, 0);

      return [
        {
          title: "Employees Count",
          value: employeeCount,
          icon: Users,
          color: "primary",
          description: "Total active employees with payroll records.",
          loading,
        },
        {
          title: "Current Monthly Payroll",
          value: formatAED(currentPayroll),
          icon: DollarSign,
          color: "info",
          description: "Net total salary obligations for the selected period.",
          loading,
        },
        {
          title: "Pending Payrolls",
          value: formatAED(pendingPayroll),
          icon: Plus,
          color: "warning",
          description: "Draft payroll entries awaiting administrative approval.",
          loading,
        },
        {
          title: "Paid This Month",
          value: formatAED(paidPayroll),
          icon: Clock,
          color: "success",
          description: "Disbursed payroll salaries for the period.",
          loading,
        },
      ];
    } else if (activeTab === "profiles") {
      const activeCount = salaryProfiles.filter((p) => p.isActive).length;
      const inactiveCount = salaryProfiles.length - activeCount;

      return [
        {
          title: "Active Salary Profiles",
          value: activeCount,
          icon: Users,
          color: "success",
          description: "Active compensation structures assigned to staff members.",
          loading: salaryProfilesLoading,
        },
        {
          title: "Inactive Salary Profiles",
          value: inactiveCount,
          icon: Clock,
          color: inactiveCount > 0 ? "warning" : "info",
          description: "Archived or disabled employee salary configurations.",
          loading: salaryProfilesLoading,
        },
        {
          title: "Total Payroll Logs",
          value: records.length,
          icon: DollarSign,
          color: "primary",
          description: "Historical payroll generation records in the system.",
          loading: salaryProfilesLoading,
        },
        {
          title: "Salary Profiles Listed",
          value: salaryProfiles.length,
          icon: Plus,
          color: "info",
          description: "Total configured employee compensation profiles.",
          loading: salaryProfilesLoading,
        },
      ];
    } else {
      // Advances tab stats
      const totalAmt = advances.reduce((sum, a) => sum + Number(a.amount), 0);
      const pendingAmt = advances
        .filter((a) => a.status === "Paid")
        .reduce((sum, a) => sum + Number(a.amount), 0);
      const deductedAmt = advances
        .filter((a) => a.status === "Deducted")
        .reduce((sum, a) => sum + Number(a.amount), 0);

      return [
        {
          title: "Total Advances Paid",
          value: formatAED(totalAmt),
          icon: DollarSign,
          color: "primary",
          description: "Total cash advances disbursed to employees.",
          loading: advancesLoading,
        },
        {
          title: "Pending Deductions",
          value: formatAED(pendingAmt),
          icon: Clock,
          color: "warning",
          description: "Outstanding advance amounts awaiting monthly payroll deduction.",
          loading: advancesLoading,
        },
        {
          title: "Deducted from Payroll",
          value: formatAED(deductedAmt),
          icon: ArrowUpRight,
          color: "success",
          description: "Total advance funds recouped through automated payroll deductions.",
          loading: advancesLoading,
        },
        {
          title: "Total Advances Count",
          value: advances.length,
          icon: Users,
          color: "info",
          description: "Total number of employee advance requests logged.",
          loading: advancesLoading,
        },
      ];
    }
  }, [records, salaryProfiles, advances, activeTab, loading, salaryProfilesLoading, advancesLoading]);

  return {
    records,
    salaryProfiles,
    employees,
    advances,
    loading,
    salaryProfilesLoading,
    advancesLoading,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    userFilter,
    setUserFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    pageRecords,
    pageProfiles,
    pageAdvances,
    statsItems,
    view,
    setView,
    yearOptions,
    canViewPayroll,
    canManagePayroll,
    loadPayrollData,
    setAdvances,
  };
}
