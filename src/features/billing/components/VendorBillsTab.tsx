import React, { useState, useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Building2, Plus, DollarSign, Wallet, AlertCircle, FileText, Receipt } from "lucide-react";
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
      {/* 1. Sleek Sub-Tab Navigation Switcher */}
      <div className="px-4 md:px-6 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 self-start">
          <button
            type="button"
            onClick={() => setSubTab("accounts")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              subTab === "accounts"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendor Accounts ({vendors.length})</span>
            {pendingVendorsCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
                {pendingVendorsCount} Due
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("bills")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
              subTab === "bills"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official Bills & Invoices ({bills.length})</span>
          </button>
        </div>

        {/* Global AP KPI Badge */}
        {totals && (
          <div className="flex items-center gap-3 bg-muted/30 border border-border/60 px-3 py-1.5 rounded-xl text-xs font-mono self-end sm:self-auto">
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Total Paid</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatAED(totals.totalPaid)}
              </span>
            </div>
            <div className="h-6 w-px bg-border/60" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-sans">Need to Pay</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatAED(totals.totalPending)}
              </span>
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
