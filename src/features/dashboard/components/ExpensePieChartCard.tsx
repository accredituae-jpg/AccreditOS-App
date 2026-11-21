import React, { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  PieChart as PieChartIcon,
  Layers,
  Tag,
  TrendingDown,
  Flame,
  ArrowRight,
} from "lucide-react";
import { DIRHAM_SYMBOL, formatAED, cn } from "@/lib/utils";
import { Expense } from "@/features/billing/types/billing.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";
import { DashboardPeriod, CustomDateRange } from "./SectionPeriodFilter";

interface ExpensePieChartCardProps {
  expenses: Expense[];
  period: DashboardPeriod;
  customRange?: CustomDateRange;
  loading?: boolean;
  onNavigateToExpenses?: () => void;
}

const LUXURY_PALETTE = [
  "#8b5cf6", // Purple / Violet
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#84cc16", // Lime
];

export function ExpensePieChartCard({
  expenses,
  period,
  customRange,
  loading = false,
  onNavigateToExpenses,
}: ExpensePieChartCardProps) {
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleNavigate =
    onNavigateToExpenses || (() => navigate("/finance/billing?tab=expenses"));

  // Helper date parser
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

  // Filter expenses matching master period
  const filteredExpenses = useMemo(() => {
    const { start, end } = periodBounds;
    return expenses.filter((e) => {
      if (!start || !end) return true;
      const d = parseDate(e.date);
      if (!d) return false;
      return d >= start && d <= end;
    });
  }, [expenses, periodBounds]);

  // Aggregate by category
  const { categories, totalOutflow, topCategory } = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    let grandTotal = 0;

    filteredExpenses.forEach((exp) => {
      const cat = exp.category || "General Operations";
      const amt = Number(exp.amount || 0);
      const current = map.get(cat) || { total: 0, count: 0 };
      map.set(cat, {
        total: current.total + amt,
        count: current.count + 1,
      });
      grandTotal += amt;
    });

    if (grandTotal === 0 || map.size === 0) {
      return { categories: [], totalOutflow: 0, topCategory: null };
    }

    const list = Array.from(map.entries())
      .map(([name, data], i) => ({
        name,
        value: data.total,
        count: data.count,
        color: LUXURY_PALETTE[i % LUXURY_PALETTE.length],
        percentage: Math.round((data.total / grandTotal) * 1000) / 10,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      categories: list,
      totalOutflow: grandTotal,
      topCategory: list[0] || null,
    };
  }, [filteredExpenses]);

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="card-elevated p-3.5 sm:p-4 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full min-h-[260px]">
        <div className="space-y-3">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="w-16 h-2 rounded" />
                <Skeleton className="w-24 h-3.5 rounded" />
              </div>
            </div>
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>

          {/* Side by side Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
            <div className="sm:col-span-5 flex items-center justify-center">
              <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 rounded-full" />
            </div>
            <div className="sm:col-span-7 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Link Skeleton */}
        <div className="mt-3 pt-2.5 border-t border-border/60">
          <Skeleton className="w-full h-8 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-3 sm:p-3.5 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full min-h-[220px]">
      <div className="space-y-2">
        {/* 1. Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-border/60 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shadow-2xs">
              <PieChartIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  SPENDING ALLOCATION
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight leading-tight">
                  Expense Breakdown
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoOpen(true)}
                  className="h-4 w-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none cursor-pointer"
                  aria-label="View expense distribution calculation info"
                >
                  <Info className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono font-semibold border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 px-1.5 py-0 rounded-full"
            >
              {categories.length} {categories.length === 1 ? "Cat" : "Cats"}
            </Badge>
          )}
        </div>

        {/* 2. Side-by-Side Visual Donut Chart + Category Breakdown */}
        {totalOutflow === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center my-0.5">
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center p-1.5">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-1 bg-muted/15">
                <Layers className="w-3 h-3 text-muted-foreground/60 mb-0.5" />
                <span className="text-[9px] font-bold text-foreground font-mono">0.00 AED</span>
                <span className="text-[7px] uppercase tracking-wider text-muted-foreground font-semibold">No Outflow</span>
              </div>
            </div>
            <div className="sm:col-span-7 space-y-1 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/15 border border-dashed border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Primary Outflow Category
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">
                  0.00 AED (0%)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center my-0.5">
            {/* Left: Radiant Donut Chart */}
            <div className="sm:col-span-5 relative h-28 sm:h-32 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="hsl(var(--card))"
                        strokeWidth={activeIndex === index ? 3 : 2}
                        className="transition-all duration-300 cursor-pointer"
                        opacity={
                          activeIndex === null || activeIndex === index ? 1 : 0.35
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Crisp Center Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[74px] h-[74px] rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-md flex flex-col items-center justify-center p-1 text-center transition-all">
                  {activeIndex !== null && categories[activeIndex] ? (
                    <div className="space-y-0.5">
                      <span className="text-[7.5px] uppercase font-bold tracking-wider text-muted-foreground truncate max-w-[64px] block">
                        {categories[activeIndex].name}
                      </span>
                      <span className="text-xs font-black text-foreground font-mono tracking-tight leading-tight block">
                        {formatAED(categories[activeIndex].value, true)}
                      </span>
                      <span
                        className="text-[7.5px] font-extrabold font-mono px-1 py-0.2 rounded-full inline-block"
                        style={{
                          backgroundColor: `${categories[activeIndex].color}25`,
                          color: categories[activeIndex].color,
                        }}
                      >
                        {categories[activeIndex].percentage}%
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-[7.5px] uppercase font-bold tracking-wider text-muted-foreground block">
                        TOTAL
                      </span>
                      <span className="text-xs font-black text-foreground font-mono tracking-tight leading-tight block">
                        {formatAED(totalOutflow, true)}
                      </span>
                      <span className="text-[7.5px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded-full inline-block font-mono">
                        Spend
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Category Breakdown Micro-Cards */}
            <div className="sm:col-span-7 space-y-1.5 flex flex-col justify-center">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
                <span>Top Categories</span>
                <span>Share</span>
              </div>
              {categories.slice(0, 3).map((cat, index) => (
                <div
                  key={cat.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "group p-1.5 px-2 rounded-lg border transition-all duration-200 cursor-pointer",
                    activeIndex === index
                      ? "bg-muted/40 border-cyan-500/50 shadow-xs"
                      : "bg-muted/15 hover:bg-muted/30 border-border/60 hover:border-border/90",
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground/75 font-medium">
                        • {cat.count} {cat.count === 1 ? "txn" : "txns"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span className="font-bold text-xs text-foreground">
                        {formatAED(cat.value, true)}
                      </span>
                      <span
                        className="text-[8.5px] font-extrabold px-1 py-0.2 rounded"
                        style={{
                          backgroundColor: `${cat.color}18`,
                          color: cat.color,
                        }}
                      >
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, cat.percentage)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Navigation Link */}
      <div className="mt-2 pt-1.5 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigate}
          className="w-full h-7 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40 transition-all gap-1.5 justify-center rounded-lg shadow-2xs cursor-pointer"
        >
          <span>View All Expenses in Billing</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        type="pie_chart"
      />
    </div>
  );
}
