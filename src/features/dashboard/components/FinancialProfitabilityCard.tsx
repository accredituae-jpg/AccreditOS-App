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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                  <span>Revenue & Profitability</span>
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25">
                    Accrual / Management
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invoiced revenue, certificate COGS, and operating margins for {periodLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label="Information guide for Revenue & Profitability"
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60 active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Revenue & Margin Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <span className="text-xs text-muted-foreground font-semibold block mb-1">
                Billed Revenue
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {formatAED(accrual.grossInvoicedRevenue ?? accrual.netInvoicedRevenueExVat, true)}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Total client invoices issued
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <span className="text-xs text-muted-foreground font-semibold block mb-1">
                Gross Profit
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                {formatAED(directGrossProfit, true)}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Billed minus Cert costs
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <span className="text-xs text-muted-foreground font-semibold block mb-1">
                Operating Profit
              </span>
              <div
                className={cn(
                  "text-lg sm:text-xl font-bold font-mono",
                  isOperatingPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {formatAED(directOperatingProfit, true)}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
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
