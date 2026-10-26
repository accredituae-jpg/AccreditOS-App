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
      <div className="card-elevated p-3.5 sm:p-4 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-[365px] sm:h-[375px]">
        <div>
          {/* Header Skeleton */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="w-16 h-2 rounded" />
                <Skeleton className="w-28 h-4 rounded" />
              </div>
            </div>
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>

          {/* Donut Chart Skeleton */}
          <div className="relative h-36 sm:h-40 w-full mt-1 flex items-center justify-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-8 border-muted/50 border-t-cyan-500/40 border-r-purple-500/40 flex flex-col items-center justify-center animate-pulse gap-1">
              <Skeleton className="w-12 h-2 rounded" />
              <Skeleton className="w-14 h-4 rounded" />
            </div>
          </div>

          {/* Categories Progress Breakdown Skeleton */}
          <div className="mt-1 space-y-1.5 pt-2 border-t border-border/60">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1 p-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="w-20 h-3 rounded" />
                  </div>
                  <Skeleton className="w-16 h-3 rounded" />
                </div>
                <Skeleton className="w-full h-1 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Link Skeleton */}
        <div className="mt-2 pt-2 border-t border-border/60">
          <Skeleton className="w-full h-7 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-3.5 sm:p-4 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-[365px] sm:h-[375px]">
      <div>
        {/* 1. Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shadow-2xs">
              <PieChartIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  ALLOCATION
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight">
                  Expense Distribution
                </h3>
                {/* INFORMATION BUTTON (no hover tooltip, click only) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoOpen(true)}
                  className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none"
                  aria-label="View expense distribution calculation info"
                >
                  <Info className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Donut Chart with Dynamic Non-colliding Center Callout */}
        {totalOutflow === 0 ? (
          <div className="relative h-36 sm:h-40 w-full mt-1 flex flex-col items-center justify-center text-center p-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-2 bg-muted/15">
              <Layers className="w-4 h-4 text-muted-foreground/60 mb-0.5" />
              <span className="text-[11px] font-bold text-foreground font-mono">0.00 AED</span>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">No Outflow</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              No expenditures recorded in this period.
            </p>
          </div>
        ) : (
          <div className="relative h-36 sm:h-40 w-full mt-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={66}
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
                      strokeWidth={2}
                      className="transition-all duration-300 cursor-pointer"
                      opacity={
                        activeIndex === null || activeIndex === index ? 1 : 0.45
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Dynamic Interactive Center Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 transition-all">
              {activeIndex !== null && categories[activeIndex] ? (
                <>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground truncate max-w-[110px]">
                    {categories[activeIndex].name}
                  </span>
                  <span className="text-base sm:text-lg font-black text-foreground font-mono tracking-tight leading-tight">
                    {formatAED(categories[activeIndex].value, true)}
                  </span>
                  <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                    {categories[activeIndex].percentage}% Share
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                    TOTAL OUTFLOW
                  </span>
                  <span className="text-base sm:text-lg font-black text-foreground font-mono tracking-tight leading-tight">
                    {formatAED(totalOutflow, true)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* 3. Category Allocation Progress Breakdown */}
        {totalOutflow > 0 ? (
          <div className="mt-1 space-y-1.5 pt-2 border-t border-border/60">
            <div className="space-y-1">
              {categories.slice(0, 2).map((cat) => (
                <div
                  key={cat.name}
                  className="space-y-0.5 p-1 rounded hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate max-w-[120px] text-[11px]">
                        {cat.name}
                      </span>
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span className="font-bold text-foreground">
                        {formatAED(cat.value, true)}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted/50 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-1 pt-2 border-t border-border/60">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between p-1 rounded bg-muted/15 border border-dashed border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Primary Outflow Category
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  0.00 AED (0%)
                </span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-muted/15 border border-dashed border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Secondary Outflow Category
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  0.00 AED (0%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Navigation Link */}
      <div className="mt-2 pt-2 border-t border-border/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNavigate}
          className="w-full h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 transition-colors gap-1.5 justify-center rounded-lg"
        >
          <span>View All Expenses in Billing</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
