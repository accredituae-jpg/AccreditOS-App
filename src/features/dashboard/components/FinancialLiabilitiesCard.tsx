import React, { useState } from "react";
import {
  AlertCircle,
  Building2,
  Clock,
  Calendar,
  Award,
  Truck,
  Receipt,
  Info,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { formatAED, cn } from "@/lib/utils";
import { UnifiedLiabilitiesMetrics } from "@/lib/api/dashboardApi";
import { Badge } from "@/components/ui/badge";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";

interface FinancialLiabilitiesCardProps {
  liabilities: UnifiedLiabilitiesMetrics | null | undefined;
  periodLabel: string;
  loading?: boolean;
}

export function FinancialLiabilitiesCard({
  liabilities,
  periodLabel,
  loading = false,
}: FinancialLiabilitiesCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  if (loading) {
    return (
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-sm bg-card animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-40 bg-muted/60 rounded-xl" />
          <div className="h-40 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!liabilities) {
    return null;
  }

  // Receivables (AR) calculations
  const allTimeAr = liabilities.allTimeAccountsReceivable || 0;
  const inPeriodAr = liabilities.selectedPeriodAccountsReceivable || 0;
  const priorAr = Math.max(0, allTimeAr - inPeriodAr);
  const inPeriodArPercent =
    allTimeAr > 0 ? Math.min(100, Math.round((inPeriodAr / allTimeAr) * 100)) : 0;
  const priorArPercent = allTimeAr > 0 ? Math.max(0, 100 - inPeriodArPercent) : 0;

  // Payables & Obligations (AP) calculations
  const totalObligations = liabilities.totalVendorObligations || 0;
  const billedAp = liabilities.billedVendorPayables || 0;
  const unbilledCommitment =
    liabilities.unbilledCertificateCommitment?.grossCommitment || 0;
  const unbilledCertsCount =
    liabilities.unbilledCertificateCommitment?.unbilledCount ||
    liabilities.unbilledCertificatesCount ||
    0;
  const billedApPercent =
    totalObligations > 0
      ? Math.min(100, Math.round((billedAp / totalObligations) * 100))
      : 0;
  const unbilledCommitmentPercent =
    totalObligations > 0 ? Math.max(0, 100 - billedApPercent) : 0;

  // Combined Exposure
  const totalExposure = allTimeAr + totalObligations;

  return (
    <>
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2.5 pb-3 sm:pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight truncate">
                      Money Owed & Unpaid
                    </h3>
                    <Badge
                      variant="outline"
                      className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shrink-0"
                    >
                      Receivables & Payables
                    </Badge>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    Client balances owed and supplier awarding-body commitments
                  </p>
                </div>
              </div>

              {/* Header Right: Quick Total Pills & Info */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    Client AR:
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatAED(allTimeAr, true)}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                    Vendor AP:
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {formatAED(totalObligations, true)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  aria-label="Information guide for Receivables & Vendor Obligations"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-muted/60 active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Main Symmetrical 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 my-4">
              {/* Section 1: Client Receivables (AR) */}
              <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/50 text-xs font-bold text-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs sm:text-sm truncate">Money Owed by Clients (AR)</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] sm:text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 whitespace-nowrap shrink-0">
                      {formatAED(allTimeAr, true)} <span className="text-[10px] font-sans font-normal opacity-80">Total</span>
                    </div>
                  </div>

                  {/* 2 Symmetrical Micro-Cards - 2 in a row on mobile */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                    {/* All-Time AR */}
                    <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/80 hover:border-rose-500/30 transition-colors shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
                          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">Total Uncollected</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 px-1.5 py-0 font-semibold shrink-0"
                        >
                          All-Time
                        </Badge>
                      </div>
                      <div className="text-lg sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 truncate">
                        {formatAED(allTimeAr, true)}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                        All unpaid client invoice balances
                      </p>

                      {/* Distribution Mini-Bar */}
                      <div className="mt-3 pt-2.5 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Aging Split</span>
                          <span className="font-mono">
                            {inPeriodArPercent}% in-cycle
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
                          <div
                            className="bg-amber-500 h-full rounded-l-full"
                            style={{ width: `${inPeriodArPercent}%` }}
                            title={`In-Period: ${formatAED(inPeriodAr)}`}
                          />
                          <div
                            className="bg-rose-500 h-full rounded-r-full"
                            style={{ width: `${priorArPercent}%` }}
                            title={`Prior Aged: ${formatAED(priorAr)}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* In-Period AR */}
                    <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/80 hover:border-amber-500/30 transition-colors shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">Unpaid This Period</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-1.5 py-0 font-semibold shrink-0"
                        >
                          In-Period
                        </Badge>
                      </div>
                      <div className="text-lg sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 truncate">
                        {formatAED(inPeriodAr, true)}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                        Invoices issued in {periodLabel} still due
                      </p>

                      {/* In-Period Ratio Mini-Bar */}
                      <div className="mt-3 pt-2.5 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Share of All AR</span>
                          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                            {inPeriodArPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${inPeriodArPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left Micro-Context Strip */}
                <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>Prior Aged Overdue AR:</span>
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatAED(priorAr, true)}
                  </span>
                </div>
              </div>

              {/* Section 2: Vendor Obligations & Certificate Commitments (AP) */}
              <div className="p-4 rounded-xl border border-border/70 bg-card/60 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/50 text-xs font-bold text-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <Truck className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="text-xs sm:text-sm truncate">Vendor & Awarding Body Dues</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] sm:text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 whitespace-nowrap shrink-0">
                      {formatAED(totalObligations, true)} <span className="text-[10px] font-sans font-normal opacity-80">Total</span>
                    </div>
                  </div>

                  {/* 2 Symmetrical Micro-Cards - 2 in a row on mobile */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                    {/* Billed Vendor AP */}
                    <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/80 hover:border-purple-500/30 transition-colors shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
                          <Receipt className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">Vendor Bills AP</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 px-1.5 py-0 font-semibold shrink-0"
                        >
                          Invoiced
                        </Badge>
                      </div>
                      <div className="text-lg sm:text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 truncate">
                        {formatAED(billedAp, true)}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                        Received supplier bills to pay
                      </p>

                      {/* Billed AP Ratio Mini-Bar */}
                      <div className="mt-3 pt-2.5 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Invoiced Share</span>
                          <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                            {billedApPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, billedApPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pending Certs Commitment */}
                    <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/80 hover:border-amber-500/30 transition-colors shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
                          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">Pending Certs</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-1.5 py-0 font-semibold shrink-0"
                        >
                          {unbilledCertsCount} Certs
                        </Badge>
                      </div>
                      <div className="text-lg sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 truncate">
                        {formatAED(unbilledCommitment, true)}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 truncate">
                        Completed sessions pending bill
                      </p>

                      {/* Accrued Ratio Mini-Bar */}
                      <div className="mt-3 pt-2.5 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Accrued Share</span>
                          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                            {unbilledCommitmentPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${unbilledCommitmentPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Micro-Context Strip */}
                <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Unbilled Body Accrual Volume:</span>
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {unbilledCertsCount.toLocaleString()} certs pending invoice
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-3.5 text-xs text-muted-foreground border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                All-Time AR and In-Period AR are distinct accounting scopes. Vendor dues include unbilled completed cert commitments.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <span className="text-[11px] text-muted-foreground">Combined Exposure:</span>
              <span className="font-mono font-bold text-foreground bg-muted/60 px-2.5 py-0.5 rounded-md border border-border/60 text-xs">
                {formatAED(totalExposure, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        metricKey="liabilities"
      />
    </>
  );
}
