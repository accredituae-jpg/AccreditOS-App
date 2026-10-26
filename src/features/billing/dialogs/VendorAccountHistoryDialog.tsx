import React from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED, cn } from "@/lib/utils";
import { extractUrlsAndCleanText } from "../utils/billing.utils";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Receipt,
  FileText,
} from "lucide-react";
import type { VendorSummaryItem } from "@/lib/api/financeApi";
import type { VendorBill } from "../types/billing.types";

interface VendorAccountHistoryDialogProps {
  vendor: VendorSummaryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayVendor?: (vendor: VendorSummaryItem) => void;
  onViewSingleBill?: (bill: VendorBill) => void;
}

export function VendorAccountHistoryDialog({
  vendor,
  open,
  onOpenChange,
  onPayVendor,
  onViewSingleBill,
}: VendorAccountHistoryDialogProps) {
  if (!vendor) return null;

  const bills = (vendor.bills || []) as VendorBill[];
  const unbilledCerts = vendor.unbilledCertificates || [];
  const pending = Number(vendor.pendingAmount || 0);
  const paid = Number(vendor.totalPaid || 0);
  const total = Number(vendor.totalIncurred || 0);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${vendor.name} — Vendor Account Bills & Receipts`}
      description="Consolidated vendor bills and issued payment receipt batches."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3 py-1">
        {/* Compact Header Summary Strip */}
        <div className="p-3 rounded-xl bg-card border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground text-sm truncate">
                  {vendor.name}
                </h3>
                {pending > 0.01 ? (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold py-0 px-1.5 h-4">
                    Due AED {formatAED(pending)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold py-0 px-1.5 h-4">
                    Settled
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {vendor.trnNo ? `TRN: ${vendor.trnNo}` : "TRN: Not Registered"}
                {vendor.phone ? ` • ${vendor.phone}` : ""}
              </p>
            </div>
          </div>

          {pending > 0.01 && onPayVendor && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onPayVendor(vendor);
              }}
              className="h-7 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 self-end sm:self-auto"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Pay Vendor
            </Button>
          )}
        </div>

        {/* Compact KPI Mini Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/25 border border-border/60 text-center font-mono">
          <div className="p-1.5 rounded-lg bg-background/60 border border-border/40">
            <span className="text-[9px] text-muted-foreground block font-sans">Total Incurred</span>
            <span className="font-bold text-xs text-foreground block truncate">
              {formatAED(total)}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-sans">Total Paid</span>
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block truncate">
              {formatAED(paid)}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <span className="text-[9px] text-amber-600 dark:text-amber-400 block font-sans">Remaining Due</span>
            <span className="font-bold text-xs text-amber-600 dark:text-amber-400 block truncate">
              {formatAED(pending)}
            </span>
          </div>
        </div>

        {/* Unbilled Notice (if any) */}
        {unbilledCerts.length > 0 && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-[11px] text-amber-700 dark:text-amber-300 truncate">
                {unbilledCerts.length} unbilled certificate{unbilledCerts.length !== 1 ? "s" : ""} awaiting billing
              </span>
            </div>
            {onPayVendor && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onPayVendor(vendor);
                }}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
              >
                Pay Now →
              </button>
            )}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Issued Bills & Payment Receipts ({bills.length})
          </span>
          <span className="text-[10px] text-muted-foreground">
            {bills.filter((b) => b.status === "PAID").length} settled • {bills.filter((b) => b.status !== "PAID").length} open
          </span>
        </div>

        {/* Compact Small List of Bills with Integrated Receipts */}
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {bills.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/10 text-xs text-muted-foreground">
              No bills recorded yet for this awarding body.
            </div>
          ) : (
            bills.map((b) => {
              const { urls: bUrls, cleanText: bClean } = extractUrlsAndCleanText(b.notes);
              const paymentUrls = (b.payments || []).flatMap((p) => extractUrlsAndCleanText(p.notes).urls);
              const allUrls = [...bUrls, ...paymentUrls];

              const paymentNumbers = (b.payments || []).map((p) => p.paymentNumber);
              const primaryReceiptNo = paymentNumbers[0];

              const isPaid = b.status === "PAID";
              const isPartial = b.status === "PARTIALLY_PAID";

              return (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/15 transition-colors flex items-center justify-between gap-2.5"
                >
                  {/* Left: Icon, Bill #, Receipt #, Date, Cert count */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-primary">
                          {b.billNumber}
                        </span>

                        {primaryReceiptNo && (
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                            {paymentNumbers.length === 1 ? primaryReceiptNo : `${paymentNumbers.length} Receipts`}
                          </span>
                        )}

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1.5 py-0 h-4 font-semibold capitalize",
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : isPartial
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          )}
                        >
                          {b.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-[10px] text-muted-foreground truncate">
                        {b.date || "—"} • {b.lineItems?.length || 0} certificates
                        {bClean ? ` • Note: ${bClean}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amounts & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-foreground block">
                        {formatAED(b.totalAmount)}
                      </span>
                      <span className="text-[9px] text-muted-foreground block">
                        Paid: {formatAED(b.paidAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {allUrls.length > 0 && (
                        <a
                          href={allUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                          title="Open Attached Invoice / Receipt"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Receipt</span>
                        </a>
                      )}

                      {onViewSingleBill && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            onViewSingleBill(b);
                          }}
                          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
        </div>
      </div>
    </FormDialog>
  );
}

export default VendorAccountHistoryDialog;
