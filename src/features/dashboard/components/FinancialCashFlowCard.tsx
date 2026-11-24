import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Truck,
  Info,
  Calendar,
  Layers,
  ShieldCheck,
  Building,
} from "lucide-react";
import { formatAED, cn } from "@/lib/utils";
import { UnifiedCashFlowMetrics } from "@/lib/api/dashboardApi";
import { Badge } from "@/components/ui/badge";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";

interface FinancialCashFlowCardProps {
  cashFlow: UnifiedCashFlowMetrics | null | undefined;
  periodLabel: string;
  loading?: boolean;
}

export function FinancialCashFlowCard({
  cashFlow,
  periodLabel,
  loading = false,
}: FinancialCashFlowCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  if (loading) {
    return (
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-sm bg-card animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-20 bg-muted/60 rounded-xl" />
          <div className="h-20 bg-muted/60 rounded-xl" />
        </div>
        <div className="h-24 bg-muted/40 rounded-xl" />
      </div>
    );
  }

  if (!cashFlow) {
    return null;
  }

  const netMovement = cashFlow.netCashMovement;
  const isNetPositive = netMovement >= 0;

  return (
    <>
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2.5 pb-3 sm:pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight truncate">
                      Cash Flow & Collections
                    </h3>
                    <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shrink-0">
                      Cash-Basis
                    </Badge>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    Actual money movement during {periodLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  aria-label="Information guide for Cash Flow & Collections"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-muted/60 active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Core Metric Highlight: Net Cash Movement & Realized Inflow (2 in a row on mobile) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 my-4">
              {/* Realized Inflow */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
                <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                  <span className="font-semibold flex items-center gap-1.5 text-foreground truncate text-[11px] sm:text-xs">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Cash In</span>
                  </span>
                  <Badge variant="outline" className="hidden sm:inline-flex text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold shrink-0">
                    Collected
                  </Badge>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                  {formatAED(cashFlow.realizedCashInflow, true)}
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                  Total client receipts received
                </p>
              </div>

              {/* Total Cash Outflow */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
                <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                  <span className="font-semibold flex items-center gap-1.5 text-foreground truncate text-[11px] sm:text-xs">
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Cash Out</span>
                  </span>
                  <Badge variant="outline" className="hidden sm:inline-flex text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold shrink-0">
                    Spent
                  </Badge>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
                  {formatAED(cashFlow.totalCashOutflow, true)}
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                  Expenses + Vendor bills paid
                </p>
              </div>

              {/* Net Cash Movement */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                  <span className="font-semibold flex items-center gap-1.5 text-foreground truncate text-[11px] sm:text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">Net Cash Flow</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "hidden sm:inline-flex text-[9px] px-1.5 py-0 font-semibold shrink-0",
                      isNetPositive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    )}
                  >
                    {isNetPositive ? "Surplus" : "Deficit"}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "text-lg sm:text-xl font-bold font-mono truncate",
                    isNetPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {formatAED(netMovement, true)}
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                  Money in minus money out
                </p>
              </div>
            </div>

            {/* Executive Streamlined Cash Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Collections Inflow Summary */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Cash Inflow Sources</span>
                  </div>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatAED(cashFlow.realizedCashInflow)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-border/40">
                  <span>Current: <b className="font-mono text-foreground">{formatAED(cashFlow.inPeriodInvoiceCollections)}</b></span>
                  <span>Old Debt: <b className="font-mono text-emerald-600 dark:text-emerald-400">{formatAED(cashFlow.priorPeriodArCollections)}</b></span>
                </div>
              </div>

              {/* Disbursements Outflow Summary */}
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cash Outflow Uses</span>
                  </div>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {formatAED(cashFlow.totalCashOutflow)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-border/40">
                  <span>Opex: <b className="font-mono text-foreground">{formatAED(cashFlow.operatingCashOutflow)}</b></span>
                  <span>Vendors: <b className="font-mono text-amber-600 dark:text-amber-400">{formatAED(cashFlow.vendorCashOutflow)}</b></span>
                </div>
              </div>
            </div>
          </div>

          {/* Indicative Cumulative Net Position Banner */}
          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mt-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[11px]">
                Estimated Cash Surplus (All Cash minus All Dues):
              </span>
            </div>
            <div className="font-mono font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>{formatAED(cashFlow.indicativeCumulativeNetPositionAfterVendorObligations, true)}</span>
              <span className="text-[10px] text-muted-foreground font-normal">(Net Cushion)</span>
            </div>
          </div>
        </div>
      </div>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        metricKey="cash_flow"
      />
    </>
  );
}
