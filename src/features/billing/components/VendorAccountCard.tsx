import React from "react";
import { Building2, DollarSign, CheckCircle2, Clock, AlertTriangle, ArrowRight, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAED, cn } from "@/lib/utils";
import type { VendorSummaryItem } from "@/lib/api/financeApi";

interface VendorAccountCardProps {
  vendor: VendorSummaryItem;
  onPayVendor: (vendor: VendorSummaryItem) => void;
  onViewHistory?: (vendor: VendorSummaryItem) => void;
  onViewLatestBill?: (bill: any) => void;
  onCreateBill?: (vendor: VendorSummaryItem) => void;
}

export function VendorAccountCard({
  vendor,
  onPayVendor,
  onViewHistory,
  onViewLatestBill,
  onCreateBill,
}: VendorAccountCardProps) {
  const total = Number(vendor.totalIncurred) || 0;
  const paid = Number(vendor.totalPaid) || 0;
  const pending = Number(vendor.pendingAmount) || 0;

  const pctPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;

  const getStatusBadge = () => {
    switch (vendor.status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold gap-1">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold gap-1">
            <Clock className="w-3 h-3" /> Partially Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold gap-1">
            <AlertTriangle className="w-3 h-3" /> Pending to Pay
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            No Dues
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5 relative overflow-hidden group">
      {/* Accent top stripe */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 transition-colors",
          pending > 0.01
            ? "bg-amber-500"
            : paid > 0
            ? "bg-emerald-500"
            : "bg-muted"
        )}
      />

      {/* 1. Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {vendor.name}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">
                Fee: AED {Number(vendor.certificateFee || 0).toFixed(2)} / cert
                {vendor.trnNo ? ` • TRN: ${vendor.trnNo}` : ""}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* 2. Key Metrics Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">
              Pending to Pay
            </span>
            <span
              className={cn(
                "font-mono font-bold text-sm block mt-0.5",
                pending > 0.01
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {formatAED(pending)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">
              Paid to Date
            </span>
            <span className="font-mono font-bold text-sm block mt-0.5 text-emerald-600 dark:text-emerald-400">
              {formatAED(paid)}
            </span>
          </div>
        </div>

        {/* 3. Settlement Progress Bar */}
        <div className="mt-2.5 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span>Settlement: {pctPaid}%</span>
            <span>Total Incurred: {formatAED(total)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pctPaid >= 100
                  ? "bg-emerald-500"
                  : pctPaid > 0
                  ? "bg-blue-500"
                  : "bg-amber-500"
              )}
              style={{ width: `${pctPaid}%` }}
            />
          </div>
        </div>

        {/* 4. Subtext breakdown */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {vendor.unbilledCount} unbilled cert{vendor.unbilledCount !== 1 ? "s" : ""}
          </span>
          <span>
            {vendor.billedCount} bill{vendor.billedCount !== 1 ? "s" : ""} recorded
          </span>
        </div>
      </div>

      {/* 5. Actions Footer */}
      <div className="pt-2 border-t border-border/60 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => onPayVendor(vendor)}
          className={cn(
            "flex-1 h-8 text-xs font-semibold gap-1.5 shadow-2xs",
            pending > 0.01
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-foreground hover:bg-muted/80"
          )}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Pay Vendor</span>
        </Button>

        {onViewHistory ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewHistory(vendor)}
            className="h-8 text-[11px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
            title="View statement, bills, and issued receipts"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Receipts</span>
          </Button>
        ) : vendor.latestBill && onViewLatestBill ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewLatestBill(vendor.latestBill)}
            className="h-8 text-[11px] px-2.5 gap-1 text-muted-foreground hover:text-foreground"
            title="View latest bill details"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bill</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default VendorAccountCard;

