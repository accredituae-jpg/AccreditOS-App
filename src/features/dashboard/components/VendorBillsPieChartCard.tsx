import React, { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Info,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatAED, cn } from "@/lib/utils";
import { VendorBill } from "@/features/billing/types/billing.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DashboardPeriod, CustomDateRange } from "./SectionPeriodFilter";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";
import type { VendorSummariesResponse } from "@/lib/api/financeApi";
import type {
  UnifiedLiabilitiesMetrics,
  UnifiedCashFlowMetrics,
} from "@/lib/api/dashboardApi";

interface VendorBillsPieChartCardProps {
  vendorBills?: VendorBill[];
  bills?: VendorBill[];
  vendorSummaries?: VendorSummariesResponse | null;
  liabilities?: UnifiedLiabilitiesMetrics | null;
  cashFlow?: UnifiedCashFlowMetrics | null;
  period: DashboardPeriod;
  customRange?: CustomDateRange;
  loading?: boolean;
  onNavigateToBilling?: () => void;
  onNavigateToBills?: () => void;
}

const SETTLEMENT_PALETTE = {
  needToPay: "#f59e0b", // Amber / Outstanding
  paid: "#10b981", // Emerald / Settled
};

export function VendorBillsPieChartCard({
  vendorBills,
  bills,
  vendorSummaries,
  liabilities,
  cashFlow,
  period,
  customRange,
  loading = false,
  onNavigateToBilling,
  onNavigateToBills,
}: VendorBillsPieChartCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [allPendingOpen, setAllPendingOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rawBills = vendorBills || bills || [];
  const handleNavigate = onNavigateToBills || onNavigateToBilling;

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

  // Filter bills
  const filteredBills = useMemo(() => {
    const { start, end } = periodBounds;
    return rawBills.filter((bill) => {
      if (bill.status === "CANCELLED") return false;
      if (!start || !end) return true;
      const d = parseDate(bill.date || bill.dueDate || bill.createdAt);
      if (!d) return false;
      return d >= start && d <= end;
    });
  }, [rawBills, periodBounds]);

  // Aggregation
  const {
    totalPayables,
    needToPay,
    paidAmount,
    slices,
    pendingCount,
    isVendorSummary,
  } = useMemo(() => {
    // Prioritize authoritative unified liabilities metrics from backend
    if (liabilities) {
      const billedPayables = Number(liabilities.billedVendorPayables || 0);
      const unbilledGross = Number(
        liabilities.unbilledCertificateCommitment?.grossCommitment || 0,
      );
      const vendorPaid = Number(cashFlow?.vendorCashOutflow || 0);
      const totalObligations = Number(liabilities.totalVendorObligations || 0);
      const totalIncurred = totalObligations + vendorPaid;

      const billedPercent =
        totalIncurred > 0 ? Math.round((billedPayables / totalIncurred) * 100) : 0;
      const unbilledPercent =
        totalIncurred > 0 ? Math.round((unbilledGross / totalIncurred) * 100) : 0;
      const paidPercent =
        totalIncurred > 0
          ? Math.max(0, 100 - billedPercent - unbilledPercent)
          : 0;

      const dataSlices = [
        {
          id: "billed-ap",
          name: "Billed Payables",
          value: billedPayables,
          color: SETTLEMENT_PALETTE.needToPay,
          percentage: billedPercent,
        },
        {
          id: "unbilled-commitments",
          name: "Unbilled Commitments",
          value: unbilledGross,
          color: "#8b5cf6",
          percentage: unbilledPercent,
        },
        {
          id: "settled",
          name: "Paid / Settled",
          value: vendorPaid,
          color: SETTLEMENT_PALETTE.paid,
          percentage: paidPercent,
        },
      ].filter((s) => s.value > 0);

      return {
        totalPayables: totalObligations,
        needToPay: totalObligations,
        paidAmount: vendorPaid,
        slices: dataSlices,
        pendingCount:
          liabilities.unbilledCertificateCommitment?.unbilledCount ?? 0,
        isVendorSummary: true,
      };
    }

    // Fallback: vendorSummaries to reflect consolidated vendor liability ledger
    if (vendorSummaries?.totals) {
      const tot = Number(vendorSummaries.totals.totalIncurred || 0);
      const need = Number(vendorSummaries.totals.totalPending || 0);
      const paid = Number(vendorSummaries.totals.totalPaid || 0);
      const pendingCnt = Number(
        vendorSummaries.totals.pendingVendorsCount || 0,
      );

      const needPercent = tot > 0 ? Math.round((need / tot) * 100) : 0;
      const paidPercent = tot > 0 ? Math.max(0, 100 - needPercent) : 0;

      const dataSlices = [
        {
          id: "need-to-pay",
          name: "Need to Pay",
          value: need,
          color: SETTLEMENT_PALETTE.needToPay,
          percentage: needPercent,
        },
        {
          id: "settled",
          name: "Paid / Settled",
          value: paid,
          color: SETTLEMENT_PALETTE.paid,
          percentage: paidPercent,
        },
      ].filter((s) => s.value > 0);

      return {
        totalPayables: tot,
        needToPay: need,
        paidAmount: paid,
        slices: dataSlices,
        pendingCount: pendingCnt,
        isVendorSummary: true,
      };
    }

    let tot = 0;
    let need = 0;
    let paid = 0;
    let pendingCnt = 0;

    filteredBills.forEach((b) => {
      const total = Number(b.totalAmount || 0);
      const paidSoFar = Number(b.paidAmount || 0);
      const balance = Math.max(0, total - paidSoFar);

      tot += total;
      need += balance;
      paid += paidSoFar;

      if (balance > 0 && b.status !== "PAID") {
        pendingCnt += 1;
      }
    });

    const needPercent = tot > 0 ? Math.round((need / tot) * 100) : 0;
    const paidPercent = tot > 0 ? Math.max(0, 100 - needPercent) : 0;

    const dataSlices = [
      {
        id: "need-to-pay",
        name: "Need to Pay",
        value: need,
        color: SETTLEMENT_PALETTE.needToPay,
        percentage: needPercent,
      },
      {
        id: "settled",
        name: "Paid / Settled",
        value: paid,
        color: SETTLEMENT_PALETTE.paid,
        percentage: paidPercent,
      },
    ].filter((s) => s.value > 0);

    return {
      totalPayables: tot,
      needToPay: need,
      paidAmount: paid,
      slices: dataSlices,
      pendingCount: pendingCnt,
      isVendorSummary: false,
    };
  }, [filteredBills, vendorSummaries, period, liabilities, cashFlow]);

  const pendingVendors = useMemo(() => {
    return (vendorSummaries?.vendors || [])
      .filter((v) => Number(v.pendingAmount || 0) > 0.001)
      .sort(
        (a, b) => Number(b.pendingAmount || 0) - Number(a.pendingAmount || 0),
      );
  }, [vendorSummaries]);

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

  const duePercentage =
    totalPayables + paidAmount > 0
      ? Math.round((needToPay / (totalPayables + paidAmount)) * 100)
      : needToPay > 0
        ? 100
        : 0;

  return (
    <div className="card-elevated p-3 sm:p-3.5 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full min-h-[220px]">
      <div className="space-y-2">
        {/* 1. Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-border/60 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  AWARDING BODIES & VENDORS
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight leading-tight">
                  Vendor & Certificate Dues
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoOpen(true)}
                  className="h-4 w-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none cursor-pointer"
                  aria-label="View vendor obligations calculation info"
                >
                  <Info className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {pendingVendors.length > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] font-mono font-semibold border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 px-1.5 py-0 rounded-full"
            >
              {pendingVendors.length} {pendingVendors.length === 1 ? "Vendor" : "Vendors"}
            </Badge>
          )}
        </div>

        {/* 2. Side-by-Side Visual Donut Chart + Settlement Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center my-0.5">
          {totalPayables === 0 ? (
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center p-1.5">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-500/30 flex flex-col items-center justify-center p-1 bg-emerald-500/[0.04]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500/70 mb-0.5" />
                <span className="text-[9px] font-bold text-foreground font-mono">
                  0.00 AED
                </span>
                <span className="text-[7px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                  All Settled
                </span>
              </div>
            </div>
          ) : (
            <div className="sm:col-span-5 relative h-28 sm:h-32 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {slices.map((entry, index) => (
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
                <div className="w-[74px] h-[74px] rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-lg flex flex-col items-center justify-center p-1 text-center transition-all">
                  {activeIndex !== null && slices[activeIndex] ? (
                    <div className="space-y-0.5">
                      <span className="text-[7.5px] uppercase font-bold tracking-wider text-muted-foreground truncate max-w-[64px] block">
                        {slices[activeIndex].name}
                      </span>
                      <span className="text-xs font-black text-foreground font-mono tracking-tight leading-tight block">
                        {formatAED(slices[activeIndex].value, true)}
                      </span>
                      <span
                        className={cn(
                          "text-[7.5px] font-extrabold font-mono px-1 py-0.2 rounded-full inline-block",
                          slices[activeIndex].id === "need-to-pay" ||
                            slices[activeIndex].id === "billed-ap"
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {slices[activeIndex].percentage}%
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-[7.5px] uppercase font-bold tracking-wider text-muted-foreground block">
                        TOTAL
                      </span>
                      <span className="text-xs font-black text-foreground font-mono tracking-tight leading-tight block">
                        {formatAED(totalPayables, true)}
                      </span>
                      <span
                        className={cn(
                          "text-[7.5px] font-bold font-mono px-1 py-0.2 rounded-full inline-block",
                          needToPay > 0
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {needToPay > 0 ? "Pending Dues" : "All Settled"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            {/* Right: Settlement Breakdown Micro-Cards */}
            {totalPayables === 0 ? (
              <div className="sm:col-span-7 space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/15 border border-dashed border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500/40" />
                    Need to Pay (0 bills)
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/60">
                    0.00 AED (0%)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/15 border border-dashed border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
                    Paid / Settled
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/60">
                    0.00 AED (100%)
                  </span>
                </div>
              </div>
            ) : (
              <div className="sm:col-span-7 space-y-1.5 flex flex-col justify-center">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-0.5 mb-0.5">
                  <span>Obligations</span>
                  <span>Settlement</span>
                </div>

                {/* Need to Pay Tile */}
                <div
                  onMouseEnter={() => {
                    const idx = slices.findIndex(
                      (s) => s.id === "need-to-pay" || s.id === "billed-ap",
                    );
                    if (idx !== -1) setActiveIndex(idx);
                  }}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "group p-1.5 px-2 rounded-lg border transition-all duration-200 cursor-pointer",
                    activeIndex !== null &&
                      (slices[activeIndex]?.id === "need-to-pay" ||
                        slices[activeIndex]?.id === "billed-ap")
                      ? "bg-muted/40 border-amber-500/50 shadow-xs"
                      : "bg-muted/15 hover:bg-muted/30 border-border/60 hover:border-border/90",
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-2xs" />
                      <span className="font-semibold text-xs text-foreground truncate group-hover:text-amber-500 transition-colors">
                        Need to Pay
                      </span>
                      <span className="text-[9px] text-muted-foreground/75 font-medium">
                        (
                        {pendingVendors.length > 0
                          ? `${pendingVendors.length} ${pendingVendors.length === 1 ? "vendor" : "vendors"}`
                          : `${pendingCount} items`}
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                        {formatAED(needToPay, true)}
                      </span>
                      <span className="text-[8.5px] font-extrabold px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        {duePercentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${Math.max(4, duePercentage)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Settled Tile */}
                <div
                  onMouseEnter={() => {
                    const idx = slices.findIndex((s) => s.id === "settled");
                    if (idx !== -1) setActiveIndex(idx);
                  }}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "group p-1.5 px-2 rounded-lg border transition-all duration-200 cursor-pointer",
                    activeIndex !== null && slices[activeIndex]?.id === "settled"
                      ? "bg-muted/40 border-emerald-500/50 shadow-xs"
                      : "bg-muted/15 hover:bg-muted/30 border-border/60 hover:border-border/90",
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                      <span className="font-semibold text-xs text-foreground truncate group-hover:text-emerald-500 transition-colors">
                        Paid / Settled
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatAED(paidAmount, true)}
                      </span>
                      <span className="text-[8.5px] font-extrabold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {totalPayables + paidAmount > 0
                          ? Math.round((paidAmount / (totalPayables + paidAmount)) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted/60 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${
                          totalPayables + paidAmount > 0
                            ? Math.round((paidAmount / (totalPayables + paidAmount)) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Individual Pending Vendors Breakdown Box */}
                {pendingVendors.length > 0 && (
                  <div className="p-1 px-1.5 rounded-lg bg-muted/20 border border-border/60 space-y-0.5">
                    <div className="flex items-center justify-between text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 text-muted-foreground/70" />
                        Pending Vendors ({pendingVendors.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setAllPendingOpen(true)}
                        className="text-primary hover:text-primary/80 font-semibold text-[8.5px] tracking-normal flex items-center gap-0.5 cursor-pointer transition-colors"
                      >
                        <span>view all</span>
                        <ArrowRight className="w-2 h-2" />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {pendingVendors.slice(0, 2).map((v) => (
                        <div
                          key={v.id}
                          onClick={() => setAllPendingOpen(true)}
                          className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-muted/40 transition-colors cursor-pointer group"
                          title={`Click to view details for ${v.name}`}
                        >
                          <span className="truncate max-w-[130px] text-foreground font-semibold group-hover:text-amber-500 transition-colors flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            {v.name}
                          </span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                            {formatAED(v.pendingAmount, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Footer Navigation Link */}
      <div className="mt-2 pt-1.5 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigate}
          className="w-full h-7 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all gap-1.5 justify-center rounded-lg shadow-2xs cursor-pointer"
        >
          <span>Manage Vendor Accounts in Billing</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Full Pending Vendors List Dialog */}
      <Dialog open={allPendingOpen} onOpenChange={setAllPendingOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
          <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  Pending Vendor Liabilities
                  <Badge
                    variant="outline"
                    className="text-amber-500 border-amber-500/30 text-[11px] font-mono"
                  >
                    {pendingVendors.length}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Awarding body accounts with outstanding certificate stamp fees
                  or unpaid bills.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Summary Strip */}
          <div className="px-4 py-2.5 bg-amber-500/5 border-b border-amber-500/15 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Total Pending Due:
            </span>
            <span className="font-mono font-bold text-sm text-amber-500">
              {formatAED(needToPay, true)}
            </span>
          </div>

          {/* Vendors List */}
          <div className="max-h-[340px] overflow-y-auto p-4 space-y-2.5 divide-y divide-border/40">
            {pendingVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="pt-2 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {vendor.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-medium",
                        vendor.status === "PARTIALLY_PAID"
                          ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                          : "border-destructive/30 text-destructive bg-destructive/10",
                      )}
                    >
                      {vendor.status === "PARTIALLY_PAID"
                        ? "Partially Paid"
                        : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    {vendor.unbilledCount > 0 && (
                      <span>{vendor.unbilledCount} unbilled stamps</span>
                    )}
                    {vendor.unbilledCount > 0 && vendor.billedCount > 0 && (
                      <span>•</span>
                    )}
                    {vendor.billedCount > 0 && (
                      <span>
                        {vendor.billedCount} bills (
                        {formatAED(vendor.billedBalance, true)} due)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-amber-500">
                    {formatAED(vendor.pendingAmount, true)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAllPendingOpen(false);
                      handleNavigate?.();
                    }}
                    className="h-6 px-2 text-[11px] font-semibold text-primary hover:text-primary hover:bg-primary/10 mt-1 gap-1"
                  >
                    <span>Open & Pay</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="p-3 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllPendingOpen(false)}
              className="text-xs h-8"
            >
              Close
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setAllPendingOpen(false);
                handleNavigate?.();
              }}
              className="text-xs h-8 gap-1.5"
            >
              <span>Manage All in Billing AP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        chartType="vendor_payables"
      />
    </div>
  );
}
