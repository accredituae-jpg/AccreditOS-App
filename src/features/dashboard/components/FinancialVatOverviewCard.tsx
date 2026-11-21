import React, { useState } from "react";
import {
  FileText,
  Receipt,
  Scale,
  ShieldCheck,
  Info,
  Layers,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { formatAED, cn } from "@/lib/utils";
import { UnifiedTaxMetrics } from "@/lib/api/dashboardApi";
import { Badge } from "@/components/ui/badge";
import { ChartCalculationInfoDialog } from "./ChartCalculationInfoDialog";

interface FinancialVatOverviewCardProps {
  tax: UnifiedTaxMetrics | null | undefined;
  periodLabel: string;
  loading?: boolean;
}

export function FinancialVatOverviewCard({
  tax,
  periodLabel,
  loading = false,
}: FinancialVatOverviewCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);

  if (loading) {
    return (
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-sm bg-card animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="h-24 bg-muted/60 rounded-xl" />
          <div className="h-24 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!tax) {
    return null;
  }

  return (
    <>
      <div className="card-elevated p-4 sm:p-5 md:p-6 rounded-2xl border-border/80 shadow-md bg-gradient-to-b from-card via-card to-card/95 flex flex-col justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                  <span>UAE VAT Overview</span>
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25">
                    5% Standard Rate
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimated tax on collected cash and invoiced sales for {periodLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label="Information guide for UAE VAT Management"
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60 active:scale-95 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top 2 Core Positions: Cash vs Accrual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {/* Indicative Cash-Basis VAT Position */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-500" />
                  VAT on Cash Collected
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold">
                  Cash Basis
                </Badge>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {formatAED(tax.indicativeCashBasisVatPosition, true)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Collected Output VAT minus Paid Input VAT
              </p>
            </div>

            {/* Indicative Accrual-Basis VAT Position */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/70 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  VAT on Invoiced Sales
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-semibold">
                  Invoiced Basis
                </Badge>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {formatAED(tax.indicativeAccrualBasisVatPosition, true)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Invoiced Output VAT minus Billed Input VAT
              </p>
            </div>
          </div>

          {/* Executive Streamlined Tax Breakdown */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-muted/20 border border-border/60 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-3">
              <span className="text-[11px] text-muted-foreground">Output Tax (Sales Invoiced):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatAED(tax.invoicedOutputVat)}
              </span>
            </div>
            <div className="hidden sm:block h-3.5 w-px bg-border/60" />
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-3">
              <span className="text-[11px] text-muted-foreground">Input Tax (Bills & Pending):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatAED((tax.billedInputVatRecorded || 0) + (tax.estimatedUnbilledInputVatCommitment || 0))}
              </span>
            </div>
          </div>
          </div>

          {/* Mandatory Statutory Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2 mt-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              Internal management estimate for operational visibility only. Official tax filing requires valid FTA supplier invoices.
            </span>
          </div>
        </div>
      </div>

      <ChartCalculationInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        metricKey="vat_overview"
      />
    </>
  );
}
