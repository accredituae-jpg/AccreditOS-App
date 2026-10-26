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

interface VendorBillsPieChartCardProps {
  vendorBills?: VendorBill[];
  bills?: VendorBill[];
  vendorSummaries?: VendorSummariesResponse | null;
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
    // Prioritize vendorSummaries to reflect consolidated vendor liability ledger
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
  }, [filteredBills, vendorSummaries, period]);

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
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-8 border-muted/50 border-t-amber-500/40 border-r-emerald-500/40 flex flex-col items-center justify-center animate-pulse gap-1">
              <Skeleton className="w-14 h-2 rounded" />
              <Skeleton className="w-16 h-4 rounded" />
            </div>
          </div>

          {/* Progress Breakdown Skeleton */}
          <div className="mt-1 space-y-1.5 pt-2 border-t border-border/60">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-1 rounded"
              >
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <Skeleton className="w-24 h-3 rounded" />
                </div>
                <Skeleton className="w-16 h-3 rounded" />
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
    <div className="card-elevated p-3.5 sm:p-4 min-w-0 overflow-hidden relative border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between min-h-[365px] h-full">
      <div>
        {/* 1. Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                  PAYABLES (AP)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight">
                  Vendor Obligations
                </h3>
                {/* INFORMATION BUTTON (no hover tooltip, click only) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setInfoOpen(true)}
                  className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all focus:outline-none"
                  aria-label="View vendor obligations calculation info"
                >
                  <Info className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Donut Chart with Dynamic Non-colliding Center Callout */}
        {totalPayables === 0 ? (
          <div className="relative h-36 sm:h-40 w-full mt-1 flex flex-col items-center justify-center text-center p-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-emerald-500/30 flex flex-col items-center justify-center p-2 bg-emerald-500/[0.04]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500/70 mb-0.5" />
              <span className="text-[11px] font-bold text-foreground font-mono">
                0.00 AED
              </span>
              <span className="text-[8px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                All Settled
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              No vendor or awarding body bills recorded in this scope.
            </p>
          </div>
        ) : (
          <div className="relative h-44 sm:h-48 w-full mt-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
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

            {/* Dynamic Interactive Center Badge (Properly Padded, No Overlap) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1 transition-all">
              {activeIndex !== null && slices[activeIndex] ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block truncate max-w-[105px]">
                    {slices[activeIndex].name}
                  </span>
                  <span className="text-sm sm:text-base font-black text-foreground font-mono tracking-tight block">
                    {formatAED(slices[activeIndex].value, true)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold font-mono block",
                      slices[activeIndex].id === "need-to-pay"
                        ? "text-amber-500"
                        : "text-emerald-500",
                    )}
                  >
                    {slices[activeIndex].percentage}% Share
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 block">
                    TOTAL PAYABLES
                  </span>
                  <span className="text-sm sm:text-base font-black text-foreground font-mono tracking-tight block">
                    {formatAED(totalPayables, true)}
                  </span>
                  <span className="text-[10px] font-bold font-mono text-amber-500 block">
                    {slices.find((s) => s.id === "need-to-pay")?.percentage ||
                      0}
                    % Due
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Breakdown Progress Summary */}
        {totalPayables > 0 ? (
          <div className="mt-1 space-y-1.5 pt-2 border-t border-border/60">
            <div className="space-y-1">
              {/* Need to Pay Row */}
              <div className="flex items-center justify-between p-1 rounded hover:bg-muted/30 transition-colors text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[11px]">
                    Need to Pay ({pendingCount}{" "}
                    {isVendorSummary
                      ? `vendor${pendingCount !== 1 ? "s" : ""}`
                      : `bill${pendingCount !== 1 ? "s" : ""}`}
                    )
                  </span>
                </span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatAED(needToPay, true)}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    (
                    {totalPayables > 0
                      ? Math.round((needToPay / totalPayables) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              {/* Settled Row */}
              <div className="flex items-center justify-between p-1 rounded hover:bg-muted/30 transition-colors text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[11px]">Paid / Settled</span>
                </span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAED(paidAmount, true)}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    (
                    {totalPayables > 0
                      ? Math.round((paidAmount / totalPayables) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              {/* Individual Pending Vendors Breakdown Box (Top 2 Vendors Only) */}
              {pendingVendors.length > 0 && (
                <div className="mt-2 p-2 rounded-xl bg-muted/20 border border-border/50 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 px-1 mb-0.5">
                    <span>Pending Vendors ({pendingVendors.length})</span>
                    <button
                      type="button"
                      onClick={() => setAllPendingOpen(true)}
                      className="text-primary hover:underline lowercase font-semibold text-[10px] tracking-normal flex items-center gap-0.5"
                    >
                      <span>view all</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {pendingVendors.slice(0, 2).map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setAllPendingOpen(true)}
                        className="flex items-center justify-between text-[11px] px-1.5 py-0.5 rounded hover:bg-muted/40 transition-colors cursor-pointer group"
                        title={`Click to view details for ${v.name}`}
                      >
                        <span className="truncate max-w-[140px] text-foreground font-semibold group-hover:text-primary transition-colors">
                          {v.name}
                        </span>
                        <span className="font-mono font-bold text-amber-500">
                          {formatAED(v.pendingAmount, true)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-1 pt-2 border-t border-border/60">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between p-1 rounded bg-muted/15 border border-dashed border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500/40" />
                  Need to Pay (0 bills)
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  0.00 AED (0%)
                </span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-muted/15 border border-dashed border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
                  Paid / Settled
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/60">
                  0.00 AED (100%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Link */}
      <div className="mt-2 pt-2 border-t border-border/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNavigate}
          className="w-full h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 transition-colors gap-1.5 justify-center rounded-lg"
        >
          <span>Manage Vendor Accounts in Billing</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
