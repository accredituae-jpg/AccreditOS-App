import React, { useState, useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Building2, Plus, DollarSign, Wallet, AlertCircle, FileText, Receipt, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { VendorBillTable } from "./VendorBillTable";
import { VendorBillCard } from "./VendorBillCard";
import { VendorAccountCard } from "./VendorAccountCard";
import { VendorAccountHistoryDialog } from "../dialogs/VendorAccountHistoryDialog";
import type { VendorBill } from "../types/billing.types";
import type {
  VendorSummaryItem,
  VendorSummariesResponse,
} from "@/lib/api/financeApi";
import { formatAED, cn } from "@/lib/utils";

interface VendorBillsTabProps {
  bills: VendorBill[];
  vendorsSummary?: VendorSummariesResponse | null;
  loadingVendors?: boolean;
  onPayVendorAccount?: (vendor: VendorSummaryItem) => void;
  view?: "list" | "grid";
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onAddClick: () => void;
  onEditBillClick?: (bill: VendorBill) => void;
  onEditVendorClick?: (vendorId: string, vendorName: string) => void;
  onRecordPaymentClick: (bill: VendorBill) => void;
  onCancelBillClick: (bill: VendorBill) => void;
  onDeleteBillClick: (bill: VendorBill) => void;
  onViewBillClick: (bill: VendorBill) => void;
}

export function VendorBillsTab({
  bills,
  vendorsSummary,
  loadingVendors = false,
  onPayVendorAccount,
  view = "list",
  loading = false,
  pagination,
  onAddClick,
  onEditBillClick,
  onEditVendorClick,
  onRecordPaymentClick,
  onCancelBillClick,
  onDeleteBillClick,
  onViewBillClick,
}: VendorBillsTabProps) {
  // Sub-tabs: "accounts" (Vendor Accounts & Stamp Fees) vs "bills" (Official Vendor Bills AP)
  const [subTab, setSubTab] = useState<"accounts" | "bills">("accounts");
  const [historyVendor, setHistoryVendor] = useState<VendorSummaryItem | null>(null);

  const actions = {
    onView: onViewBillClick,
    onEdit: onEditBillClick,
    onEditVendor: onEditVendorClick,
    onRecordPayment: onRecordPaymentClick,
    onCancel: onCancelBillClick,
    onDelete: onDeleteBillClick,
  };

  const rawVendors = vendorsSummary?.vendors || [];
  const totals = vendorsSummary?.totals;

  // Sort vendors so pending liabilities (like Arbrit and Tatweer) always appear first!
  const vendors = useMemo(() => {
    return [...rawVendors].sort((a, b) => {
      const aPending = Number(a.pendingAmount || 0);
      const bPending = Number(b.pendingAmount || 0);
      if (aPending > 0.001 && bPending <= 0.001) return -1;
      if (bPending > 0.001 && aPending <= 0.001) return 1;
      return bPending - aPending;
    });
  }, [rawVendors]);

  const pendingVendorsCount = vendors.filter((v) => Number(v.pendingAmount || 0) > 0.001).length;

  return (
    <TabsContent value="vendor-bills" className="mt-0 space-y-4">
      {/* 1. Sleek Modern Sub-Tab Navigation & Micro-KPI Bar */}
      <div className="px-4 md:px-6 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/50 pb-3">
        {/* Navigation Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border/60 shadow-2xs self-start overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSubTab("accounts")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0",
              subTab === "accounts"
                ? "bg-background text-foreground shadow-2xs ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <Building2 className={cn("w-3.5 h-3.5 shrink-0", subTab === "accounts" ? "text-primary" : "text-muted-foreground")} />
            <span>Vendor Accounts</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              {vendors.length}
            </span>
            {pendingVendorsCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold whitespace-nowrap animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {pendingVendorsCount} Due
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("bills")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0",
              subTab === "bills"
                ? "bg-background text-foreground shadow-2xs ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <FileText className={cn("w-3.5 h-3.5 shrink-0", subTab === "bills" ? "text-primary" : "text-muted-foreground")} />
            <span>Official Bills & Invoices</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              {bills.length}
            </span>
          </button>
        </div>

        {/* Global AP KPI Cards - Side-by-side even on mobile */}
        {totals && (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 self-stretch sm:self-auto">
            {/* Total Settled Card */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/[0.06] dark:bg-emerald-950/20 border border-emerald-500/20 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground whitespace-nowrap">
                    Settled
                  </span>
                  {totals.totalIncurred > 0 && (
                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded whitespace-nowrap">
                      {Math.round((totals.totalPaid / totals.totalIncurred) * 100)}%
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate leading-tight mt-0.5">
                  {formatAED(totals.totalPaid)}
                </div>
              </div>
            </div>

            {/* Need to Pay Card */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/[0.06] dark:bg-amber-950/20 border border-amber-500/20 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground whitespace-nowrap">
                    Need to Pay
                  </span>
                  {totals.pendingVendorsCount > 0 && (
                    <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded whitespace-nowrap">
                      {totals.pendingVendorsCount} Due
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 truncate leading-tight mt-0.5">
                  {formatAED(totals.totalPending)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: VENDOR ACCOUNTS & STAMP FEES (RUNNING BALANCES) */}
      {subTab === "accounts" && (
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  ACCOUNTS PAYABLE
                </span>
                <span className="text-xs text-muted-foreground font-semibold">•</span>
                <span className="text-xs text-muted-foreground">
                  {vendors.length} Awarding Bod{vendors.length !== 1 ? "ies" : "y"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Vendor Accounts & Stamp Fee Liabilities
              </h3>
              <p className="text-xs text-muted-foreground">
                Consolidated stamp fees per Awarding Body. Pending balances shown first. Click "Pay Vendor" or view issued receipts.
              </p>
            </div>
          </div>

          {/* Vendor Cards Grid */}
          {loadingVendors ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-border/60 bg-background/50 p-4 animate-pulse space-y-3"
                >
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted/60 rounded" />
                  <div className="h-3 w-3/4 bg-muted/60 rounded" />
                  <div className="h-8 w-full bg-muted/80 rounded" />
                </div>
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
              <Building2 className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                No active Awarding Bodies configured in Settings.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <VendorAccountCard
                  key={v.id}
                  vendor={v}
                  onPayVendor={(vendor) => onPayVendorAccount?.(vendor)}
                  onViewHistory={(vendor) => setHistoryVendor(vendor)}
                  onViewLatestBill={onViewBillClick}
                  onCreateBill={() => onAddClick()}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: OFFICIAL VENDOR BILLS (AP) */}
      {subTab === "bills" && (
        <div className="space-y-4">
          <div className="px-4 md:px-6 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Official Vendor Bills (AP)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Tax invoice records and sequential billing batches
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 p-4 md:p-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted/80" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted/80" />
                  </div>
                  <div className="mt-4 h-9 animate-pulse rounded-lg bg-muted/80" />
                </div>
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="p-6 md:p-8">
              <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-card/20">
                <Building2 className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2.5" />
                <p className="text-sm font-medium text-muted-foreground">
                  No Vendor Bills Recorded Yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-md mx-auto">
                  Use "Pay Vendor" on the Vendor Accounts tab to bundle candidate certificates and record partial or full payments.
                </p>
              </div>
            </div>
          ) : view === "list" ? (
            <VendorBillTable bills={bills} actions={actions} loading={loading} />
          ) : (
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bills.map((bill, index) => (
                <VendorBillCard
                  key={bill.id}
                  bill={bill}
                  index={index}
                  actions={actions}
                />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border bg-card/20">
              <CustomPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.onPageChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Vendor Account History & Receipts Modal (Statement) */}
      <VendorAccountHistoryDialog
        vendor={historyVendor}
        open={Boolean(historyVendor)}
        onOpenChange={(open) => !open && setHistoryVendor(null)}
        onPayVendor={onPayVendorAccount}
        onViewSingleBill={onViewBillClick}
      />
    </TabsContent>
  );
}

export default VendorBillsTab;
