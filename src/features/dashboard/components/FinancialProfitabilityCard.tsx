import React, { useState } from "react";
import {
  TrendingUp,
  Receipt,
  FileText,
  Award,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import { formatAED, cn } from "@/lib/utils";
import { UnifiedAccrualMetrics } from "@/lib/api/dashboardApi";
import { Badge } from "@/components/ui/badge";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";

interface FinancialProfitabilityCardProps {
  accrual: UnifiedAccrualMetrics | null | undefined;
  periodLabel: string;
  loading?: boolean;
}

export function FinancialProfitabilityCard({
  accrual,
  periodLabel,
  loading = false,
}: FinancialProfitabilityCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  if (loading) {
    return (
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-sm bg-card animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-14 bg-muted/60 rounded-xl" />
          <div className="h-14 bg-muted/60 rounded-xl" />
          <div className="h-14 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!accrual) {
    return null;
  }

  // Direct calculation based on total billed invoices (without subtracting VAT)
  const billedRevenue = accrual.grossInvoicedRevenue ?? accrual.netInvoicedRevenueExVat ?? 0;
  const directGrossProfit = Number((billedRevenue - accrual.totalCertificateCogs).toFixed(2));
  const directOperatingProfit = Number((directGrossProfit - accrual.operatingExpenses).toFixed(2));
  const isOperatingPositive = directOperatingProfit >= 0;

  return (
    <>
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2.5 pb-3 sm:pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight truncate">
                      Revenue & Profitability
                    </h3>
                    <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 shrink-0">
                      Accrual / Management
                    </Badge>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    Invoiced revenue, certificate COGS, and operating margins for {periodLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  aria-label="Information guide for Revenue & Profitability"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-muted/60 active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

          {/* Revenue & Margin Top Cards - 2 in a row on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 my-4">
            <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold block mb-1 truncate">
                Billed Revenue
              </span>
              <div className="text-base sm:text-xl font-bold font-mono text-foreground truncate">
                {formatAED(accrual.grossInvoicedRevenue ?? accrual.netInvoicedRevenueExVat, true)}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 block truncate">
                Total invoices issued
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold block mb-1 truncate">
                Gross Profit
              </span>
              <div className="text-base sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400 truncate">
                {formatAED(directGrossProfit, true)}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 block truncate">
                Billed minus Cert costs
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold block mb-1 truncate">
                Operating Profit
              </span>
              <div
                className={cn(
                  "text-base sm:text-xl font-bold font-mono truncate",
                  isOperatingPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {formatAED(directOperatingProfit, true)}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 block truncate">
                Gross profit minus Opex
              </span>
            </div>
          </div>

          {/* Profit Waterfall Executive Summary */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 shadow-2xs mb-4 space-y-2">
            <div className="text-xs font-bold text-foreground flex items-center justify-between pb-1.5 border-b border-border/50">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Profit Progression Waterfall</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-foreground">
                Revenue → Margin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-card/80 border border-border/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">Certificate COGS</span>
                  <span className="text-[10px] text-muted-foreground">Awarding bodies fee cost</span>
                </div>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                  -{formatAED(accrual.totalCertificateCogs)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-card/80 border border-border/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">Operating Expenses</span>
                  <span className="text-[10px] text-muted-foreground">Recorded opex overhead</span>
                </div>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">
                  -{formatAED(accrual.operatingExpenses)}
                </span>
              </div>
            </div>
          </div>
          </div>

          {/* Footnote / Disclosure Notice */}
          <div className="pt-3 text-[11px] text-muted-foreground border-t border-border/50 leading-relaxed italic mt-auto">
            Management profit estimate based on invoices issued and operational expenses recorded in period.
          </div>
        </div>
      </div>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        metricKey="profitability"
      />
    </>
  );
}
