import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  apiGetDashboardStats,
  apiGetInvoices,
  apiGetExpenses,
  apiGetVendorBills,
  apiGetCertificates,
  apiGetTrainings,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  DollarSign,
  Receipt,
  TrendingUp,
  AlertCircle,
  Calendar,
  Award,
  ArrowRight,
  BookOpen,
  Plus,
  UserPlus,
  FileText,
  BadgeCheck,
  Building2,
  BarChart2,
  Info,
  SlidersHorizontal,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid, StatsCardItem } from "@/components/ui/stats-card";
import { DirhamSymbol } from "dirham/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, formatAED } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Invoice,
  Expense,
  VendorBill,
} from "@/features/billing/types/billing.types";
import { Certificate } from "@/features/certificates/types/certificates.types";
import {
  getActiveRole,
  checkFeaturePermission,
  UserRole,
} from "@/lib/permissions";
import {
  DashboardPeriod,
  CustomDateRange,
} from "../components/SectionPeriodFilter";
import { MasterDashboardPeriodFilter } from "../components/MasterDashboardPeriodFilter";
import { ExpenseOperationsAnalytics } from "../components/ExpenseOperationsAnalytics";
import { ExpensePieChartCard } from "../components/ExpensePieChartCard";
import { VendorBillsPieChartCard } from "../components/VendorBillsPieChartCard";
import {
  apiGetVendorSummaries,
  apiGetClientsSummary,
} from "@/lib/api/financeApi";

const parseDateStr = (dStr: string) => {
  if (!dStr) return new Date();
  if (dStr.includes("T")) return new Date(dStr);
  const parts = dStr.split("-").map(Number);
  if (parts.length === 3) {
    if (parts[0] > 1000) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  return new Date(dStr);
};

const getPeriodDateRange = (
  period: DashboardPeriod,
  customRange?: CustomDateRange,
): { start: Date | null; end: Date | null } => {
  const now = new Date();

  if (period === "all-time") {
    return { start: null, end: null };
  }

  if (period === "this-week") {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "this-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { start, end };
  }

  if (period === "last-month") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    );
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === "this-year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === "last-year") {
    const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === "custom" && customRange?.startDate && customRange?.endDate) {
    const start = parseDateStr(customRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = parseDateStr(customRange.endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  return { start: null, end: null };
};

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const [activeRole, setActiveRole] = useState<UserRole>(getActiveRole());
  const navigate = useNavigate();

  // Unified Master Dashboard Period Filter state (controls entire page)
  const [globalPeriod, setGlobalPeriod] =
    useState<DashboardPeriod>("this-month");
  const [globalCustomRange, setGlobalCustomRange] = useState<
    CustomDateRange | undefined
  >();

  useEffect(() => {
    const handleRoleChange = () => {
      setActiveRole(getActiveRole());
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    return () =>
      window.removeEventListener("accreditOS_role_changed", handleRoleChange);
  }, []);

  const hasFinance = useMemo(
    () => checkFeaturePermission(activeRole, "finance"),
    [activeRole],
  );
  const hasCertificates = useMemo(
    () => checkFeaturePermission(activeRole, "certificates"),
    [activeRole],
  );
  const hasClients = useMemo(
    () => checkFeaturePermission(activeRole, "clients"),
    [activeRole],
  );

  const {
    data: stats = null,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
  } = useQuery({
    queryKey: qk.dashboardStats(
      globalPeriod,
      globalCustomRange?.startDate,
      globalCustomRange?.endDate,
    ),
    queryFn: async () => {
      const res = await apiGetDashboardStats(
        globalPeriod,
        globalCustomRange?.startDate,
        globalCustomRange?.endDate,
      );
      return res.data || null;
    },
  });

  const isKpiLoading = isStatsLoading || isStatsFetching;

  const { data: invoicesData = [], isLoading: isInvoicesLoading } = useQuery<
    Invoice[]
  >({
    queryKey: qk.invoices(),
    queryFn: async () => (await apiGetInvoices(1, 10000)).data || [],
    enabled: hasFinance,
  });

  const { data: expensesData = [], isLoading: isExpensesLoading } = useQuery<
    Expense[]
  >({
    queryKey: qk.expenses(),
    queryFn: async () => (await apiGetExpenses(1, 10000)).data || [],
    enabled: hasFinance,
  });

  const { data: vendorBillsData = [], isLoading: isVendorBillsLoading } =
    useQuery<VendorBill[]>({
      queryKey: qk.vendorBills(),
      queryFn: async () => (await apiGetVendorBills(1, 10000)).data || [],
      enabled: hasFinance,
    });

  const { data: vendorSummariesData, isLoading: isVendorSummariesLoading } =
    useQuery({
      queryKey: ["vendor-summaries"],
      queryFn: async () => (await apiGetVendorSummaries()).data,
      enabled: hasFinance,
    });

  const { data: clientsSummaryData, isLoading: isClientsSummaryLoading } =
    useQuery({
      queryKey: ["clients-summary"],
      queryFn: async () => (await apiGetClientsSummary()).data,
      enabled: hasFinance,
    });

  const { data: certificatesData = [] } = useQuery<Certificate[]>({
    queryKey: qk.certificates({ page: 1, limit: 10000 }),
    queryFn: async () => {
      const res = await apiGetCertificates(1, 10000);
      return res.data || [];
    },
    enabled: hasCertificates,
  });

  const { data: trainingsData = [] } = useQuery<any[]>({
    queryKey: qk.trainings,
    queryFn: async () => (await apiGetTrainings()).data || [],
  });

  const headerTitle = useMemo(() => {
    if (activeRole === "super_admin") return "Developer Dashboard";
    if (activeRole === "admin") return "Administrative Dashboard";
    if (activeRole === "operation_admin") return "Operations Dashboard";
    return "Trainer Dashboard";
  }, [activeRole]);

  const kpiData = useMemo<StatsCardItem[]>(() => {
    if (hasFinance) {
      const profitVal = Number(stats?.finance?.profit ?? 0);
      const pendingVal = Number(stats?.finance?.pending ?? 0);

      return [
        {
          title: "Total Clients",
          value: String(stats?.clients?.total ?? 0),
          change: stats?.clients?.change ?? 0,
          icon: Users,
          color: "primary",
          description: "Total registered client organizations in the system.",
          loading: isKpiLoading,
        },
        {
          title: "Trainings Conducted",
          value: String(stats?.trainings?.completed ?? 0),
          change: stats?.trainings?.change ?? 0,
          icon: GraduationCap,
          color: "info",
          description: "Completed training batches and sessions conducted.",
          loading: isKpiLoading,
        },
        {
          title: "Revenue",
          value: formatAED(stats?.finance?.revenue ?? 0),
          change: stats?.finance?.revenueChange ?? 0,
          icon: DollarSign,
          color: "success",
          description: "Realized cash and payments collected from clients.",
          loading: isKpiLoading,
        },
        {
          title: "Expenses",
          value: formatAED(stats?.finance?.expenses ?? 0),
          change: stats?.finance?.expensesChange ?? 0,
          icon: Receipt,
          color: "warning",
          description:
            "Operating expenditures and overheads recorded for the period.",
          loading: isKpiLoading,
        },
        {
          title: "Profit",
          value: formatAED(profitVal),
          change: stats?.finance?.profitChange ?? 0,
          icon: TrendingUp,
          color: profitVal >= 0 ? "success" : "destructive",
          description: "Net operating margin (Revenue minus Expenses).",
          loading: isKpiLoading,
        },
        {
          title: "Pending Payments",
          value: formatAED(pendingVal),
          change: stats?.finance?.pendingChange ?? 0,
          icon: AlertCircle,
          color: pendingVal > 0 ? "warning" : "success",
          description:
            "Outstanding client invoices awaiting collection (Accounts Receivable).",
          loading: isKpiLoading,
        },
      ];
    }

    if (hasClients) {
      return [
        {
          title: "Total Clients",
          value: String(stats?.clients?.total ?? 0),
          change: stats?.clients?.change ?? 0,
          icon: Users,
          color: "primary",
          description: "Total registered client organizations in the system.",
          loading: isKpiLoading,
        },
        {
          title: "Trainings Conducted",
          value: String(stats?.trainings?.completed ?? 0),
          change: stats?.trainings?.change ?? 0,
          icon: GraduationCap,
          color: "info",
          description: "Completed training batches and sessions conducted.",
          loading: isKpiLoading,
        },
        {
          title: "Upcoming Sessions",
          value: String(stats?.trainings?.upcoming ?? 0),
          change: 0,
          icon: Calendar,
          color: "warning",
          description: "Upcoming scheduled training batches.",
          loading: isKpiLoading,
        },
        {
          title: "Pending Audits",
          value: String(stats?.trainings?.pending ?? 0),
          change: 0,
          icon: AlertCircle,
          color: "destructive",
          description: "Trainings requiring audit review or log verification.",
          loading: isKpiLoading,
        },
      ];
    }

    return [
      {
        title: "Trainings Conducted",
        value: String(stats?.trainings?.completed ?? 0),
        change: stats?.trainings?.change ?? 0,
        icon: GraduationCap,
        color: "success",
        description: "Completed training batches and sessions conducted.",
        loading: isKpiLoading,
      },
      {
        title: "Upcoming Sessions",
        value: String(stats?.trainings?.upcoming ?? 0),
        change: 0,
        icon: Calendar,
        color: "info",
        description: "Upcoming scheduled training batches.",
        loading: isKpiLoading,
      },
      {
        title: "Pending Log Check",
        value: String(stats?.trainings?.pending ?? 0),
        change: 0,
        icon: AlertCircle,
        color: "warning",
        description: "Training logs submitted and pending verification.",
        loading: isKpiLoading,
      },
    ];
  }, [hasFinance, hasClients, stats, isKpiLoading]);

  const getChartDataForPeriod = (
    period: DashboardPeriod,
    customRange?: CustomDateRange,
  ) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();

    if (period === "this-week") {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const daysData = dayNames.map((name, i) => {
        const cur = new Date(monday);
        cur.setDate(cur.getDate() + i);
        return {
          keyYear: cur.getFullYear(),
          keyMonth: cur.getMonth(),
          keyDay: cur.getDate(),
          month: name,
          revenue: 0,
          expenses: 0,
        };
      });

      invoicesData.forEach((inv) => {
        if (inv.status === "cancelled") return;
        const paid = Number(
          inv.paidAmount ?? (inv.status === "paid" ? inv.totalAmount : 0),
        );
        if (paid > 0 && inv.date) {
          const invD = parseDateStr(inv.date);
          const match = daysData.find(
            (d) =>
              d.keyYear === invD.getFullYear() &&
              d.keyMonth === invD.getMonth() &&
              d.keyDay === invD.getDate(),
          );
          if (match) match.revenue += paid;
        }
      });

      expensesData.forEach((exp) => {
        if (exp.date) {
          const expD = parseDateStr(exp.date);
          const match = daysData.find(
            (d) =>
              d.keyYear === expD.getFullYear() &&
              d.keyMonth === expD.getMonth() &&
              d.keyDay === expD.getDate(),
          );
          if (match) match.expenses += exp.amount;
        }
      });

      return daysData.map(({ month, revenue, expenses }) => ({
        month,
        revenue,
        expenses,
      }));
    }

    if (period === "this-month" || period === "last-month") {
      const targetMonthDate =
        period === "this-month"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();

      const weeksData = [
        { label: "W1 (1-7)", start: 1, end: 7, revenue: 0, expenses: 0 },
        { label: "W2 (8-14)", start: 8, end: 14, revenue: 0, expenses: 0 },
        { label: "W3 (15-21)", start: 15, end: 21, revenue: 0, expenses: 0 },
        { label: "W4 (22-28)", start: 22, end: 28, revenue: 0, expenses: 0 },
        { label: "W5 (29+)", start: 29, end: 31, revenue: 0, expenses: 0 },
      ];

      invoicesData.forEach((inv) => {
        if (inv.status === "cancelled") return;
        const paid = Number(
          inv.paidAmount ?? (inv.status === "paid" ? inv.totalAmount : 0),
        );
        if (paid > 0 && inv.date) {
          const invD = parseDateStr(inv.date);
          if (
            invD.getFullYear() === targetYear &&
            invD.getMonth() === targetMonth
          ) {
            const dayNum = invD.getDate();
            const w = weeksData.find(
              (item) => dayNum >= item.start && dayNum <= item.end,
            );
            if (w) w.revenue += paid;
          }
        }
      });

      expensesData.forEach((exp) => {
        if (exp.date) {
          const expD = parseDateStr(exp.date);
          if (
            expD.getFullYear() === targetYear &&
            expD.getMonth() === targetMonth
          ) {
            const dayNum = expD.getDate();
            const w = weeksData.find(
              (item) => dayNum >= item.start && dayNum <= item.end,
            );
            if (w) w.expenses += exp.amount;
          }
        }
      });

      return weeksData.map(({ label, revenue, expenses }) => ({
        month: label,
        revenue,
        expenses,
      }));
    }

    if (period === "last-year") {
      const prevYear = now.getFullYear() - 1;
      const chartMonths = monthNames.map((name, idx) => ({
        year: prevYear,
        monthIndex: idx,
        month: name,
        revenue: 0,
        expenses: 0,
      }));

      invoicesData.forEach((inv) => {
        if (inv.status === "cancelled") return;
        const paid = Number(
          inv.paidAmount ?? (inv.status === "paid" ? inv.totalAmount : 0),
        );
        if (paid > 0 && inv.date) {
          const invD = parseDateStr(inv.date);
          if (invD.getFullYear() === prevYear) {
            const mObj = chartMonths[invD.getMonth()];
            if (mObj) mObj.revenue += paid;
          }
        }
      });

      expensesData.forEach((exp) => {
        if (exp.date) {
          const expD = parseDateStr(exp.date);
          if (expD.getFullYear() === prevYear) {
            const mObj = chartMonths[expD.getMonth()];
            if (mObj) mObj.expenses += exp.amount;
          }
        }
      });

      return chartMonths.map(({ month, revenue, expenses }) => ({
        month,
        revenue,
        expenses,
      }));
    }

    const chartMonths: {
      year: number;
      monthIndex: number;
      month: string;
      revenue: number;
      expenses: number;
    }[] = [];

    if (period === "this-year") {
      const year = now.getFullYear();
      const currentMonth = now.getMonth();
      for (let i = 0; i <= currentMonth; i++) {
        chartMonths.push({
          year,
          monthIndex: i,
          month: monthNames[i],
          revenue: 0,
          expenses: 0,
        });
      }
    } else {
      let maxDate = new Date();
      const allDates: Date[] = [];
      invoicesData.forEach((inv) => {
        const d = parseDateStr(inv.date);
        if (d && !isNaN(d.getTime())) allDates.push(d);
      });
      expensesData.forEach((exp) => {
        const d = parseDateStr(exp.date);
        if (d && !isNaN(d.getTime())) allDates.push(d);
      });
      if (allDates.length > 0) {
        maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
      }

      for (let i = 11; i >= 0; i--) {
        const d = new Date(maxDate.getFullYear(), maxDate.getMonth() - i, 1);
        chartMonths.push({
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          month: monthNames[d.getMonth()],
          revenue: 0,
          expenses: 0,
        });
      }
    }

    invoicesData.forEach((inv) => {
      if (inv.status === "cancelled") return;
      const paid = Number(
        inv.paidAmount ?? (inv.status === "paid" ? inv.totalAmount : 0),
      );
      if (paid > 0 && inv.date) {
        const dObj = parseDateStr(inv.date);
        const mObj = chartMonths.find(
          (m) =>
            m.year === dObj.getFullYear() && m.monthIndex === dObj.getMonth(),
        );
        if (mObj) mObj.revenue += paid;
      }
    });

    expensesData.forEach((exp) => {
      if (exp.date) {
        const dObj = parseDateStr(exp.date);
        const mObj = chartMonths.find(
          (m) =>
            m.year === dObj.getFullYear() && m.monthIndex === dObj.getMonth(),
        );
        if (mObj) mObj.expenses += exp.amount;
      }
    });

    return chartMonths.map(({ month, revenue, expenses }) => ({
      month,
      revenue,
      expenses,
    }));
  };

  const revenueChartData = useMemo(() => {
    return getChartDataForPeriod(globalPeriod, globalCustomRange);
  }, [invoicesData, expensesData, globalPeriod, globalCustomRange]);

  const profitChartData = useMemo(() => {
    return getChartDataForPeriod(globalPeriod, globalCustomRange).map((d) => ({
      ...d,
      profit: d.revenue - d.expenses,
    }));
  }, [invoicesData, expensesData, globalPeriod, globalCustomRange]);

  const unpaidInvoicesList = useMemo(() => {
    const range = getPeriodDateRange(globalPeriod, globalCustomRange);
    const getInvoiceStatus = (inv: Invoice) => {
      if (inv.status === "paid") return "paid";
      if (inv.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueObj = parseDateStr(inv.dueDate);
        if (dueObj && dueObj < today) return "overdue";
      }
      return inv.status === "draft" ? "draft" : "issued";
    };

    let pendingInvoices = invoicesData.filter(
      (inv) => inv.status !== "paid" && inv.status !== "cancelled",
    );

    if (range.start && range.end) {
      pendingInvoices = pendingInvoices.filter((inv) => {
        const checkDate = inv.dueDate
          ? parseDateStr(inv.dueDate)
          : parseDateStr(inv.date);
        return checkDate >= range.start! && checkDate <= range.end!;
      });
    }

    return pendingInvoices
      .map((inv) => ({
        id: inv.invoiceNumber,
        client: inv.client,
        amount: Number(inv.balance ?? inv.totalAmount),
        dueDate: inv.dueDate
          ? parseDateStr(inv.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "N/A",
        status: getInvoiceStatus(inv) as "draft" | "issued" | "overdue",
      }))
      .slice(0, 5);
  }, [invoicesData, globalPeriod, globalCustomRange]);

  const clientAccountsDuesList = useMemo(() => {
    if (!clientsSummaryData?.clients) return [];
    return clientsSummaryData.clients
      .filter((c) => c.totalOutstanding > 0.01)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
      .slice(0, 5);
  }, [clientsSummaryData]);

  const recentTrainingsList = useMemo(() => {
    const range = getPeriodDateRange(globalPeriod, globalCustomRange);
    let list = [...trainingsData];

    if (range.start && range.end) {
      list = list.filter((t) => {
        const d = parseDateStr(t.regDate);
        return d >= range.start! && d <= range.end!;
      });
    }

    return list
      .sort(
        (a, b) =>
          parseDateStr(b.regDate).getTime() - parseDateStr(a.regDate).getTime(),
      )
      .slice(0, 5);
  }, [trainingsData, globalPeriod, globalCustomRange]);

  const expiringCertsList = useMemo(() => {
    const range = getPeriodDateRange(globalPeriod, globalCustomRange);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const list = certificatesData.map((cert) => {
      const parts = cert.expiryDate
        ? cert.expiryDate.split("-").map(Number)
        : [];
      let daysUntilExpiry = 999;
      let expiryObj = new Date();
      if (parts.length === 3 && !isNaN(parts[0])) {
        expiryObj =
          parts[0] > 1000
            ? new Date(parts[0], parts[1] - 1, parts[2])
            : new Date(parts[2], parts[1] - 1, parts[0]);
        daysUntilExpiry = Math.ceil(
          (expiryObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
      return {
        id: cert.id,
        name: cert.participantName,
        course: cert.course,
        company: cert.company,
        expiresIn: daysUntilExpiry,
        expiryDate: expiryObj,
      };
    });

    let filtered = list;
    if (range.start && range.end) {
      const inRange = list.filter(
        (cert) =>
          cert.expiryDate >= range.start! && cert.expiryDate <= range.end!,
      );
      if (inRange.length > 0) {
        filtered = inRange;
      } else {
        const urgent = list.filter(
          (cert) => cert.expiresIn <= 90 || cert.expiresIn <= 0,
        );
        filtered = urgent.length > 0 ? urgent : list;
      }
    } else {
      const urgent = list.filter(
        (cert) => cert.expiresIn <= 90 || cert.expiresIn <= 0,
      );
      filtered = urgent.length > 0 ? urgent : list;
    }

    return filtered.sort((a, b) => a.expiresIn - b.expiresIn).slice(0, 5);
  }, [certificatesData, globalPeriod, globalCustomRange]);

  return (
    <div className="page-container space-y-6">
      {/* 1. Header (Clean & Executive) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Live Operations Briefing
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {headerTitle}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Executive business, operations, and financial performance overview
          </p>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <StatsGrid items={kpiData} columns={3} loading={isKpiLoading} />

      {/* 3. Quick Actions Command & Scope Bar (The ONLY place the filter is shown on the dashboard!) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-elevated p-3 sm:p-4 bg-card/90 backdrop-blur-md border-border/80 shadow-xs rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3.5"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span>QUICK ACTIONS</span>
          </div>
          <div className="w-px h-5 bg-border/70 mx-1 hidden sm:block shrink-0" />
          {hasClients && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/clients")}
              className="h-8 gap-1.5 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-xl transition-all px-3 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate("/trainings")}
            className="h-8 gap-1.5 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-xl transition-all px-3 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Training</span>
          </Button>
          {hasCertificates && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/certificates")}
              className="h-8 gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 rounded-xl transition-all px-3 shrink-0"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Issue Certificate</span>
            </Button>
          )}
          {hasFinance && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate("/finance/billing")}
              className="h-8 gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-600 hover:text-white border border-amber-500/20 rounded-xl transition-all px-3 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Invoice</span>
            </Button>
          )}
        </div>

        {/* Master Scope Filter: Exclusively placed inside Quick Action box! */}
        <div className="shrink-0 flex items-center justify-start lg:justify-end border-t lg:border-t-0 pt-2.5 lg:pt-0 border-border/60">
          <MasterDashboardPeriodFilter
            value={globalPeriod}
            onChange={(p) => {
              setGlobalPeriod(p);
              setGlobalCustomRange(undefined);
            }}
          />
        </div>
      </motion.div>

      {/* 4. Analytics & Charts Section (Left: Financial Velocity, Right: Two Stacked Pie Charts) */}
      {hasFinance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 min-w-0 flex flex-col"
          >
            <ExpenseOperationsAnalytics
              invoices={invoicesData}
              expenses={expensesData}
              period={globalPeriod}
              customRange={globalCustomRange}
              loading={isInvoicesLoading || isExpensesLoading || isKpiLoading}
              onNavigateToInvoices={() => navigate("/finance/billing")}
            />
          </motion.div>

          {/* Right Column: Two Pie Charts Downwards (Expense Outflow + Vendor Obligations) */}
          <div className="lg:col-span-1 min-w-0 flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.23 }}
              className="flex-1"
            >
              <ExpensePieChartCard
                expenses={expensesData}
                period={globalPeriod}
                customRange={globalCustomRange}
                loading={isExpensesLoading || isKpiLoading}
                onNavigateToExpenses={() =>
                  navigate("/finance/billing?tab=expenses")
                }
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="flex-1"
            >
              <VendorBillsPieChartCard
                vendorBills={vendorBillsData}
                vendorSummaries={vendorSummariesData}
                period={globalPeriod}
                customRange={globalCustomRange}
                loading={
                  isVendorBillsLoading ||
                  isVendorSummariesLoading ||
                  isKpiLoading
                }
                onNavigateToBilling={() =>
                  navigate("/finance/billing?tab=vendor-bills")
                }
              />
            </motion.div>
          </div>
        </div>
      )}

      {/* 5. Alerts & Operational Surveillance Row - Balanced 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Card 1: Client Accounts & Receivables (Consolidated Dues) */}
        {hasFinance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="card-elevated flex flex-col justify-between overflow-hidden border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95"
          >
            <div>
              <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                      Client Accounts & Dues
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Consolidated receivables per client
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border-border/80 text-muted-foreground bg-muted/30"
                  >
                    {clientsSummaryData?.totals?.pendingClientsCount ??
                      clientAccountsDuesList.length}{" "}
                    Dues Clients
                  </Badge>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {isClientsSummaryLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-28 bg-muted/60 animate-pulse rounded" />
                        </div>
                        <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : clientAccountsDuesList.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      All Client Accounts Settled
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      No pending client balances or overdue receivables.
                    </p>
                  </div>
                ) : (
                  clientAccountsDuesList.map((client) => {
                    const clientDisplayName =
                      client.name || client.companyName || "Client";
                    return (
                      <div
                        key={client.id}
                        className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer group"
                        onClick={() =>
                          navigate(
                            `/finance/billing?tab=invoices&search=${encodeURIComponent(clientDisplayName)}`,
                          )
                        }
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {clientDisplayName}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {client.unpaidCount} Pending{" "}
                            {client.unpaidCount === 1 ? "Invoice" : "Invoices"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 mb-1",
                              client.overdueCount > 0
                                ? "bg-destructive/15 text-destructive border-destructive/25"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
                            )}
                          >
                            {client.overdueCount > 0
                              ? `${client.overdueCount} Overdue`
                              : "Pending"}
                          </Badge>
                          <span className="font-bold text-xs sm:text-sm inline-flex items-center gap-1 font-mono text-destructive">
                            {formatAED(client.totalOutstanding, true)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-3 bg-muted/15 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/finance/billing?tab=invoices")}
                className="w-full h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 transition-colors gap-1.5 justify-center rounded-lg"
              >
                <span>View All Client Accounts in Billing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Card 2: Expiring Certificates (Compliance Watchlist) */}

        {hasCertificates ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="card-elevated flex flex-col justify-between overflow-hidden border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95"
          >
            <div>
              <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                      Expiring Certificates
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Candidate renewal & validity radar
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border-border/80 text-muted-foreground bg-muted/30"
                  >
                    {expiringCertsList.length} Expiring
                  </Badge>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {expiringCertsList.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      All Certificates Active
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      No candidate certificates expiring soon.
                    </p>
                  </div>
                ) : (
                  expiringCertsList.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate("/certificates")}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate hover:text-primary transition-colors">
                          {cert.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {cert.course} • {cert.company}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] shrink-0 font-semibold px-2 py-0.5",
                          cert.expiresIn <= 0
                            ? "bg-destructive/15 text-destructive border-destructive/20"
                            : cert.expiresIn <= 30
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        )}
                      >
                        {cert.expiresIn <= 0
                          ? "Expired"
                          : `Expires in ${cert.expiresIn}d`}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-muted/15 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/certificates")}
                className="w-full h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 transition-colors gap-1.5 justify-center rounded-lg"
              >
                <span>View All Certificates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* Fallback for roles without finance: Recent Trainings */}
        {!hasFinance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="card-elevated flex flex-col justify-between overflow-hidden border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95"
          >
            <div>
              <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                      Recent Trainings
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Session participation logs
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {recentTrainingsList.length === 0 ? (
                  <div className="py-12 px-4 text-center text-xs text-muted-foreground">
                    No trainings found in this period
                  </div>
                ) : (
                  recentTrainingsList.map((training) => (
                    <div
                      key={training.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate("/trainings")}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate hover:text-primary transition-colors">
                          {training.participantName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {training.courseName} • {training.clientName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize font-medium px-2 py-0.5 shrink-0",
                          training.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-warning/15 text-warning border-warning/20",
                        )}
                      >
                        {training.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-muted/15 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/trainings")}
                className="w-full h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 transition-colors gap-1.5 justify-center rounded-lg"
              >
                <span>View All Trainings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
