import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Wallet,
  ArrowUpRight,
  Layers,
  Sparkles,
  Percent,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { DIRHAM_SYMBOL, formatAED, cn } from "@/lib/utils";
import { Invoice, Expense } from "@/features/billing/types/billing.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";
import { DashboardPeriod, CustomDateRange } from "./SectionPeriodFilter";

interface ExpenseOperationsAnalyticsProps {
  invoices: Invoice[];
  expenses: Expense[];
  period: DashboardPeriod;
  customRange?: CustomDateRange;
  loading?: boolean;
  onNavigateToInvoices?: () => void;
}

export function ExpenseOperationsAnalytics({
  invoices,
  expenses,
  period,
  customRange,
  loading = false,
  onNavigateToInvoices,
}: ExpenseOperationsAnalyticsProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [chartMode, setChartMode] = useState<
    "all" | "revenue_expense" | "margin"
  >("all");

  // Date parsing helper
  const parseDate = (dStr?: string) => {
    if (!dStr) return null;
    if (dStr.includes("T")) return new Date(dStr);
    const parts = dStr.split("-").map(Number);
    if (parts.length === 3) {
      return parts[0] > 1000
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date(parts[2], parts[1] - 1, parts[0]);
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Period Date Range calculation
  const periodBounds = useMemo(() => {
    const now = new Date();
    if (period === "all-time") return { start: null, end: null };

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
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );
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
      const start = parseDate(customRange.startDate);
      const end = parseDate(customRange.endDate);
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    return { start: null, end: null };
  }, [period, customRange]);

  // Filtered dataset according to master period
  const filteredDataset = useMemo(() => {
    const { start, end } = periodBounds;

    const filteredInvoices = invoices.filter((inv) => {
      if (inv.status === "cancelled") return false;
      if (!start || !end) return true;
      const d = parseDate(inv.date || inv.createdAt);
      if (!d) return false;
      return d >= start && d <= end;
    });

    const filteredExpenses = expenses.filter((e) => {
      if (!start || !end) return true;
      const d = parseDate(e.date);
      if (!d) return false;
      return d >= start && d <= end;
    });

    return { filteredInvoices, filteredExpenses };
  }, [invoices, expenses, periodBounds]);

  // Executive Core Aggregates
  const aggregates = useMemo(() => {
    let revenue = 0;
    let cashCollected = 0;
    let pendingReceivables = 0;
    let expensesTotal = 0;

    for (const inv of filteredDataset.filteredInvoices) {
      const total = Number(inv.totalAmount || 0);
      const paid = Number(
        inv.paidAmount ?? (inv.status === "paid" ? total : 0),
      );
      const bal = Number(inv.balance ?? total - paid);

      revenue += total;
      cashCollected += paid;
      pendingReceivables += Math.max(0, bal);
    }

    for (const e of filteredDataset.filteredExpenses) {
      expensesTotal += Number(e.amount || 0);
    }

    // Operating Expense Ratio
    const expenseRatio =
      revenue > 0
        ? Math.round((expensesTotal / revenue) * 1000) / 10
        : expensesTotal > 0
          ? 100
          : 0;

    // Net Operating Profit
    const netProfit = revenue - expensesTotal;
    const netMarginPercent =
      revenue > 0 ? Math.round((netProfit / revenue) * 1000) / 10 : 0;

    const collectionEfficiency =
      revenue > 0 ? Math.round((cashCollected / revenue) * 1000) / 10 : 100;

    return {
      revenue,
      cashCollected,
      pendingReceivables,
      expensesTotal,
      expenseRatio,
      netProfit,
      netMarginPercent,
      collectionEfficiency,
      invoiceCount: filteredDataset.filteredInvoices.length,
    };
  }, [filteredDataset]);

  // Dynamic Timeline series adapting to the selected period
  const timelineSeries = useMemo(() => {
    const { start, end } = periodBounds;

    // 1. This-Week View: 7 Days
    if (period === "this-week" && start) {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return dayNames.map((name, i) => {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + i);
        const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
        const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));

        let rev = 0;
        let exp = 0;
        let cash = 0;

        filteredDataset.filteredInvoices.forEach((inv) => {
          const d = parseDate(inv.date || inv.createdAt);
          if (d && d >= dayStart && d <= dayEnd) {
            const tot = Number(inv.totalAmount || 0);
            const paid = Number(
              inv.paidAmount ?? (inv.status === "paid" ? tot : 0),
            );
            rev += tot;
            cash += paid;
          }
        });

        filteredDataset.filteredExpenses.forEach((e) => {
          const d = parseDate(e.date);
          if (d && d >= dayStart && d <= dayEnd) {
            exp += Number(e.amount || 0);
          }
        });

        const profit = rev - exp;
        const ratio =
          rev > 0
            ? Math.min(100, Math.round((exp / rev) * 1000) / 10)
            : exp > 0
              ? 100
              : 0;

        return {
          label: name,
          revenue: rev,
          cash,
          expenses: exp,
          profit,
          ratio,
        };
      });
    }

    // 2. This-Month / Last-Month View: 4-5 Weeks
    if ((period === "this-month" || period === "last-month") && start && end) {
      const totalDays = end.getDate();
      const weeks = [
        { label: "W1 (1-7)", startDay: 1, endDay: 7 },
        { label: "W2 (8-14)", startDay: 8, endDay: 14 },
        { label: "W3 (15-21)", startDay: 15, endDay: 21 },
        { label: "W4 (22-28)", startDay: 22, endDay: 28 },
        { label: `W5 (29-${totalDays})`, startDay: 29, endDay: totalDays },
      ].filter((w) => w.startDay <= totalDays);

      return weeks.map((w) => {
        const wStart = new Date(
          start.getFullYear(),
          start.getMonth(),
          w.startDay,
          0,
          0,
          0,
        );
        const wEnd = new Date(
          start.getFullYear(),
          start.getMonth(),
          Math.min(w.endDay, totalDays),
          23,
          59,
          59,
        );

        let rev = 0;
        let exp = 0;
        let cash = 0;

        filteredDataset.filteredInvoices.forEach((inv) => {
          const d = parseDate(inv.date || inv.createdAt);
          if (d && d >= wStart && d <= wEnd) {
            const tot = Number(inv.totalAmount || 0);
            const paid = Number(
              inv.paidAmount ?? (inv.status === "paid" ? tot : 0),
            );
            rev += tot;
            cash += paid;
          }
        });

        filteredDataset.filteredExpenses.forEach((e) => {
          const d = parseDate(e.date);
          if (d && d >= wStart && d <= wEnd) {
            exp += Number(e.amount || 0);
          }
        });

        const profit = rev - exp;
        const ratio =
          rev > 0
            ? Math.min(100, Math.round((exp / rev) * 1000) / 10)
            : exp > 0
              ? 100
              : 0;

        return {
          label: w.label,
          revenue: rev,
          cash,
          expenses: exp,
          profit,
          ratio,
        };
      });
    }

    // 3. Yearly / All-Time View: 12 Calendar Months
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

    return monthNames.map((name, idx) => {
      let rev = 0;
      let exp = 0;
      let cash = 0;

      filteredDataset.filteredInvoices.forEach((inv) => {
        const d = parseDate(inv.date || inv.createdAt);
        if (d && d.getMonth() === idx) {
          const tot = Number(inv.totalAmount || 0);
          const paid = Number(
            inv.paidAmount ?? (inv.status === "paid" ? tot : 0),
          );
          rev += tot;
          cash += paid;
        }
      });

      filteredDataset.filteredExpenses.forEach((e) => {
        const d = parseDate(e.date);
        if (d && d.getMonth() === idx) {
          exp += Number(e.amount || 0);
        }
      });

      const profit = rev - exp;
      const ratio =
        rev > 0
          ? Math.min(100, Math.round((exp / rev) * 1000) / 10)
          : exp > 0
            ? 100
            : 0;

      return {
        label: name,
        revenue: rev,
        cash,
        expenses: exp,
        profit,
        ratio,
      };
    });
  }, [filteredDataset, periodBounds, period]);

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="card-elevated p-5 sm:p-6 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          {/* 1. Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="w-40 h-2.5 rounded" />
                <Skeleton className="w-64 h-5 rounded" />
              </div>
            </div>
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>

          {/* 2. Banner Skeleton (5 tiles) */}
          <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-muted/15 border border-border/60 shadow-2xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border/50">
              <Skeleton className="w-36 h-3 rounded" />
              <Skeleton className="w-24 h-4 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-card/70 border border-border/70 flex flex-col justify-between space-y-2"
                >
                  <Skeleton className="w-16 h-2 rounded" />
                  <Skeleton className="w-20 h-4 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Executive Metric Grid Skeleton (4 tiles) */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2"
              >
                <Skeleton className="w-20 h-2 rounded" />
                <div className="flex items-center justify-between">
                  <Skeleton className="w-16 h-4 rounded" />
                  <Skeleton className="w-10 h-3.5 rounded" />
                </div>
                <Skeleton className="w-full h-1.5 rounded-full" />
              </div>
            ))}
          </div>

          {/* 4. Chart Visualization Skeleton */}
          <div className="mt-4 h-64 sm:h-72 w-full rounded-2xl bg-muted/10 border border-border/50 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Skeleton className="w-20 h-3 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
              <Skeleton className="w-16 h-3 rounded" />
            </div>
            <div className="space-y-4 my-auto">
              <div className="w-full border-b border-dashed border-border/40" />
              <div className="w-full border-b border-dashed border-border/40" />
              <div className="w-full border-b border-dashed border-border/40" />
            </div>
            <div className="flex justify-between pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="w-8 h-2 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5 sm:p-6 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full">
      <div className="flex-1 flex flex-col justify-between">
        {/* 1. Header (NO individual period dropdown!) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  FINANCIAL VELOCITY & OPERATIONS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Revenue, Expenses & Operating Margin
                </h3>
                {/* INFORMATION BUTTON (no hover tooltip, click only) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoOpen(true)}
                  className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none"
                  aria-label="View exact calculation formulas and definitions"
                >
                  <Info className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Primary Executive Highlight Banner - Perfectly Aligned Responsive Grid */}
        <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.08] via-purple-500/[0.04] to-card border border-violet-500/20 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-3 border-b border-border/50 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">
                OPERATING EXPENSE RATIO
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                (Opex ÷ Billed Inflows)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  aggregates.expenseRatio <= 40
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                )}
              >
                {aggregates.expenseRatio <= 40
                  ? "Lean & Optimal"
                  : "Moderate Overhead"}
              </Badge>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-mono">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {aggregates.netMarginPercent}% Net Margin
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Tile 1: Opex Ratio Hero */}
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 flex flex-col justify-between">
              <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">
                Opex Ratio
              </span>
              <span className="text-xl sm:text-2xl font-black text-violet-700 dark:text-violet-300 font-mono mt-1">
                {aggregates.expenseRatio}%
              </span>
            </div>

            {/* Tile 2: Total Billed */}
            <div className="p-2.5 rounded-xl bg-card/70 border border-border/70 flex flex-col justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Total Billed
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground font-mono mt-1">
                {formatAED(aggregates.revenue, true)}
              </span>
            </div>

            {/* Tile 3: Realized Cash */}
            <div className="p-2.5 rounded-xl bg-card/70 border border-border/70 flex flex-col justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Realized Cash
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatAED(aggregates.cashCollected, true)}
              </span>
            </div>

            {/* Tile 4: Operating Outflows */}
            <div className="p-2.5 rounded-xl bg-card/70 border border-border/70 flex flex-col justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Opex Outflow
              </span>
              <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
                {formatAED(aggregates.expensesTotal, true)}
              </span>
            </div>

            {/* Tile 5: Net Profit */}
            <div className="p-2.5 rounded-xl bg-card/70 border border-border/70 flex flex-col justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">
                Net Profit
              </span>
              <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 font-mono mt-1">
                {formatAED(aggregates.netProfit, true)}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Executive Informative Metric Grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Collection Rate
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-extrabold text-foreground font-mono">
                {aggregates.collectionEfficiency}%
              </span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                Realized
              </Badge>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, aggregates.collectionEfficiency)}%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Pending AR Balance
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {formatAED(aggregates.pendingReceivables, true)}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 h-4 border-amber-500/30 text-amber-600"
              >
                Receivable
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Across uncollected client invoices
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Net Profit Margin
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {aggregates.netMarginPercent}%
              </span>
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 h-4 border-emerald-500/30 text-emerald-600"
              >
                Retained
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Net earnings retained after costs
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col justify-between hover:border-violet-500/40 transition-colors">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Active Invoices
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-extrabold text-foreground font-mono">
                {aggregates.invoiceCount}
              </span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                Billed
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Valid non-cancelled billings
            </p>
          </div>
        </div>

        {/* 4. Multi-Layer Responsive Recharts Visualization */}
        <div className="mt-4 h-64 sm:h-72 w-full min-w-0 relative">
          {aggregates.revenue === 0 && aggregates.expensesTotal === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="px-3.5 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-md text-xs text-muted-foreground font-medium flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span>No financial activity recorded in this scope</span>
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineSeries}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="purpleAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient
                  id="emeraldProfitGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                fontSize={11}
                className="fill-muted-foreground font-medium"
              />

              {/* Left Axis: Amounts in AED */}
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(1)}M`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : `${v}`
                }
                fontSize={11}
                className="fill-muted-foreground font-mono"
                width={42}
              />

              {/* Right Axis: Expense Ratio (%) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                fontSize={11}
                className="fill-muted-foreground font-mono"
                width={35}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl p-3 text-xs space-y-1.5 min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                          <span className="font-bold text-foreground">
                            {label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Overview
                          </span>
                        </div>
                        <div className="space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between text-violet-600 dark:text-violet-400">
                            <span className="font-sans font-medium text-muted-foreground">
                              Billed Revenue:
                            </span>
                            <span className="font-bold">
                              {formatAED(d.revenue, true)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                            <span className="font-sans font-medium text-muted-foreground">
                              Cash Collected:
                            </span>
                            <span className="font-bold">
                              {formatAED(d.cash, true)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                            <span className="font-sans font-medium text-muted-foreground">
                              Operating Opex:
                            </span>
                            <span className="font-bold">
                              {formatAED(d.expenses, true)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 border-t border-border/50 pt-1">
                            <span className="font-sans font-medium text-muted-foreground">
                              Net Profit:
                            </span>
                            <span className="font-bold">
                              {formatAED(d.profit, true)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                            <span className="font-sans font-medium text-muted-foreground">
                              Opex Ratio:
                            </span>
                            <span className="font-bold">{d.ratio}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Mode: ALL or REVENUE_EXPENSE */}
              {(chartMode === "all" || chartMode === "revenue_expense") && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Billed Revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#purpleAreaGradient)"
                  activeDot={{
                    r: 5,
                    fill: "#8b5cf6",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              )}

              {/* Cash Realized */}
              {chartMode === "all" && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cash"
                  name="Cash Collected"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#10b981" }}
                />
              )}

              {/* Mode: MARGIN or ALL */}
              {chartMode === "margin" && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#emeraldProfitGradient)"
                  activeDot={{ r: 5, fill: "#10b981" }}
                />
              )}

              {/* Operating Expenses (High visibility Rose line) */}
              {(chartMode === "all" || chartMode === "revenue_expense") && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f43f5e" }}
                />
              )}

              {/* Operating Ratio mapped to right axis */}
              {chartMode === "all" && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ratio"
                  name="Expense Ratio (%)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: "#f59e0b" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Bottom Interactive Legend */}
        <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
            <span className="font-medium">Billed Revenue</span>
          </div>
          {chartMode === "all" && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500 inline-block border-b border-dashed" />
              <span className="font-medium">Cash Collected</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="font-medium">Expenses (Opex)</span>
          </div>
          {chartMode === "all" && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500 inline-block border-b border-dotted" />
              <span className="font-medium">Opex Ratio (%)</span>
            </div>
          )}
          {chartMode === "margin" && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-medium">Net Profit Margin</span>
            </div>
          )}
        </div>
      </div>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        type="expense_operations"
      />
    </div>
  );
}
