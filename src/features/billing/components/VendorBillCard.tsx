import { motion } from "framer-motion";
import {
  Building2,
  Calendar,
  Clock,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  FileCheck,
  Ban,
  CreditCard,
  ExternalLink,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn, formatAED } from "@/lib/utils";
import { extractUrlsAndCleanText } from "../utils/billing.utils";
import type { VendorBill } from "../types/billing.types";

interface VendorBillCardProps {
  bill: VendorBill;
  index: number;
  actions: {
    onView: (bill: VendorBill) => void;
    onEdit?: (bill: VendorBill) => void;
    onEditVendor?: (vendorId: string, vendorName: string) => void;
    onRecordPayment: (bill: VendorBill) => void;
    onCancel: (bill: VendorBill) => void;
    onDelete: (bill: VendorBill) => void;
  };
}

export function VendorBillCard({
  bill,
  index,
  actions,
}: VendorBillCardProps) {
  const getStatusBadge = (status: VendorBill["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Clock className="w-3 h-3" /> Partially Paid
          </Badge>
        );
      case "ISSUED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <FileCheck className="w-3 h-3" /> Issued
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Clock className="w-3 h-3" /> Draft
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Ban className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const isUnpaid = (bill.status === "ISSUED" || bill.status === "PARTIALLY_PAID") && Number(bill.balance) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className="grid-card relative group hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
      onClick={() => actions.onView(bill)}
    >
      <div>
        {/* Card Header: Avatar, Bill # and Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono font-bold text-primary text-sm tracking-tight truncate">
                {bill.billNumber}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {bill.lineItems?.length || 0} certificate item{(bill.lineItems?.length || 0) === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {getStatusBadge(bill.status)}
          </div>
        </div>

        {/* Vendor Info */}
        <div className="p-2.5 rounded-lg bg-muted/40 dark:bg-muted/15 border border-border/50 mb-3 space-y-1">
          <p className="font-semibold text-foreground text-xs truncate">
            {bill.vendorName || "Awarding Body"}
          </p>
          {bill.vendorTRN ? (
            <p className="text-[10px] text-muted-foreground font-mono">
              TRN: {bill.vendorTRN}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/60">
              Vendor Bill (AP)
            </p>
          )}
        </div>

        {/* Dates & Particulars */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              Bill Date
            </span>
            <span className="font-medium text-foreground">{bill.date}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
              Due Date
            </span>
            <span className="font-medium text-foreground">{bill.dueDate}</span>
          </div>

          {/* Financial Breakdown Section */}
          <div className="mt-3 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/60 p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Total Bill Liability</span>
              <span className="font-mono font-medium text-foreground">
                {formatAED(bill.totalAmount, true)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Total Paid</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {formatAED(bill.paidAmount, true)}
              </span>
            </div>

            <div className="pt-2 border-t border-border/60 flex justify-between items-center">
              <span className="text-xs font-semibold text-foreground">
                Outstanding Balance
              </span>
              <span className="text-base font-bold font-mono text-destructive">
                {formatAED(bill.balance, true)}
              </span>
            </div>
          </div>

          {/* Attached Notes / Link */}
          {bill.notes && (() => {
            const { urls, cleanText } = extractUrlsAndCleanText(bill.notes);
            if (!cleanText && urls.length === 0) return null;
            return (
              <div className="mt-2.5 p-2 rounded-lg bg-muted/40 dark:bg-muted/15 border border-border/50 text-[11px] space-y-1">
                <div className="flex items-start justify-between gap-1.5">
                  {cleanText ? (
                    <p className="text-muted-foreground line-clamp-2 min-w-0">
                      <span className="font-semibold text-foreground">Note: </span>
                      {cleanText}
                    </p>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">Attachment Available</span>
                  )}
                  {urls.length > 0 && (
                    <a
                      href={urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline bg-primary/10 px-1.5 py-0.5 rounded"
                      title="Open Attached Link"
                    >
                      <ExternalLink className="w-3 h-3" /> Link
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Card Action Buttons (Max 3 Buttons) */}
      <div
        className="mt-3 pt-3 border-t border-border flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg h-8 text-xs gap-1.5 text-foreground hover:bg-muted font-medium"
          onClick={() => actions.onView(bill)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>

        {isUnpaid && (
          <Button
            size="sm"
            className="rounded-lg h-8 text-xs px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
            onClick={() => actions.onRecordPayment(bill)}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Pay
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-popover border border-border shadow-lg min-w-[150px]"
          >
            <DropdownMenuItem onClick={() => actions.onView(bill)}>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>

            {actions.onEdit && bill.status !== "CANCELLED" && (
              <DropdownMenuItem
                onClick={() => actions.onEdit!(bill)}
                className="font-medium cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2 text-primary" /> Edit Bill
              </DropdownMenuItem>
            )}

            {actions.onEditVendor && bill.awardingBodyId && (
              <DropdownMenuItem
                onClick={() => actions.onEditVendor!(bill.awardingBodyId, bill.vendorName)}
                className="font-medium cursor-pointer"
              >
                <Building2 className="w-4 h-4 mr-2 text-primary" /> Edit Vendor Info
              </DropdownMenuItem>
            )}

            {bill.notes && bill.notes.match(/https?:\/\/[^\s]+/)?.[0] && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(bill.notes!.match(/https?:\/\/[^\s]+/)?.[0], "_blank", "noopener,noreferrer");
                }}
                className="text-primary font-medium cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Open Attached Link
              </DropdownMenuItem>
            )}

            {isUnpaid && (
              <DropdownMenuItem
                onClick={() => actions.onRecordPayment(bill)}
                className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
              >
                <CreditCard className="w-4 h-4 mr-2 text-emerald-500" /> Record Payment
              </DropdownMenuItem>
            )}

            {(bill.status === "DRAFT" || (bill.status === "ISSUED" && Number(bill.paidAmount || 0) === 0)) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onCancel(bill)}
                  className="text-destructive font-semibold cursor-pointer"
                >
                  <Ban className="w-4 h-4 mr-2" /> Cancel Bill
                </DropdownMenuItem>
              </>
            )}

            {bill.status === "CANCELLED" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onDelete(bill)}
                  className="text-destructive font-semibold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Bill
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
export default VendorBillCard;
