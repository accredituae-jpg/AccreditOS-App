import { motion } from "framer-motion";
import {
  Download,
  Stamp,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Receipt as ReceiptIcon,
  CheckCircle2,
  Clock,
  Ban,
  Calendar,
  FileText,
  ChevronDown,
  FileCheck,
  ExternalLink,
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
import type { Receipt } from "../types/billing.types";
import { formatDateDDMMYYYY, extractUrlsAndCleanText } from "../utils/billing.utils";

interface ReceiptCardProps {
  receipt: Receipt;
  index?: number;
  permissions: {
    canViewDetails: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  actions: {
    onView: (receipt: Receipt) => void;
    onPreview?: (receipt: Receipt) => void;
    onDownloadPdf?: (receipt: Receipt, showSeal?: boolean) => void;
    onOpenDownloadDialog?: (receipt: Receipt) => void;
    onConfirmIssue: (id: string, receiptNumStr: string) => void;
    onEditDraft: (receipt: Receipt) => void;
    onDeleteDraft: (id: string) => void;
    onVoidClick: (receipt: Receipt) => void;
  };
}

export function ReceiptCard({
  receipt,
  index = 0,
  actions,
  permissions,
}: ReceiptCardProps) {
  const formattedDate = formatDateDDMMYYYY(receipt.date);

  const getStatusBadge = (status: Receipt["status"]) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case "issued":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <FileCheck className="w-3 h-3" /> Issued
          </Badge>
        );
      case "voided":
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Ban className="w-3 h-3" /> Voided
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Clock className="w-3 h-3" /> {status}
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn(
        "grid-card relative group hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between",
        permissions.canViewDetails && "cursor-pointer",
      )}
      onClick={() => permissions.canViewDetails && actions.onView(receipt)}
    >
      <div>
        {/* Card Header: Avatar, Receipt # and Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono font-bold text-primary text-sm tracking-tight truncate">
                {receipt.receiptNumber
                  ? `RV-${receipt.receiptNumber}`
                  : "Draft"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {receipt.allocations?.length || 0} line item
                {(receipt.allocations?.length || 0) === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {permissions.canEdit && receipt.status === "issued" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer focus:outline-none flex items-center gap-1 hover:opacity-80 transition-opacity">
                    {getStatusBadge(receipt.status)}
                    <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border border-border shadow-lg min-w-[140px]"
                >
                  <DropdownMenuItem
                    className="capitalize text-xs cursor-pointer gap-2 text-emerald-600 dark:text-emerald-400 font-medium"
                    onClick={() =>
                      actions.onConfirmIssue(
                        receipt.id,
                        String(receipt.receiptNumber),
                      )
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Mark as Paid
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              getStatusBadge(receipt.status)
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="p-2.5 rounded-lg bg-muted/40 dark:bg-muted/15 border border-border/50 mb-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground text-xs truncate">
              {receipt.clientSnapshot?.companyName || "N/A"}
            </p>
            {receipt.clientSnapshot?.billingType === "individual" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Individual
              </span>
            )}
          </div>
          {receipt.clientSnapshot?.trnNo &&
          receipt.clientSnapshot.trnNo !== "N/A" ? (
            <p className="text-[10px] text-muted-foreground font-mono">
              TRN: {receipt.clientSnapshot.trnNo}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/60">
              {receipt.clientSnapshot?.billingType === "individual"
                ? "Individual Candidate"
                : "No TRN registered"}
            </p>
          )}
        </div>

        {/* Dates & Financial Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              Receipt Date
            </span>
            <span className="font-medium text-foreground">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
              Payment Method
            </span>
            <span className="font-medium text-foreground uppercase font-mono">
              {receipt.paymentMethod?.replace("_", " ") || "CASH"}
            </span>
          </div>

          {/* Financial Breakdown Section */}
          <div className="mt-3 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/60 p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Receipt Voucher Total</span>
              <span className="font-mono font-medium text-foreground">
                {formatAED(receipt.amount, true)}
              </span>
            </div>

            {receipt.referenceNo && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Reference / Cheque</span>
                <span className="font-mono text-foreground truncate max-w-[130px]">
                  {receipt.referenceNo}
                </span>
              </div>
            )}

            {receipt.drawnOnBank && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Drawn on Bank</span>
                <span className="font-medium text-foreground truncate max-w-[130px]">
                  {receipt.drawnOnBank}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex justify-between items-center">
              <span className="text-xs font-semibold text-foreground">
                {receipt.status === "paid"
                  ? "Total Received"
                  : "Voucher Amount"}
              </span>
              <span className="text-base font-bold font-mono text-primary">
                {formatAED(receipt.amount, true)}
              </span>
            </div>

            {receipt.allocations && receipt.allocations.length > 0 && (
              <div className="pt-1.5 border-t border-dashed border-border/60 flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">
                  {receipt.status === "paid"
                    ? `Inv. Settled (${receipt.allocations.length})`
                    : `Inv. Allocated (${receipt.allocations.length})`}
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                  {receipt.allocations.map((a) => a.invoiceNumber).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Attached Notes / Link */}
          {receipt.notes && (() => {
            const { urls, cleanText } = extractUrlsAndCleanText(receipt.notes);
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
                      title="Open Attached Document"
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

      {/* Card Action Buttons */}
      <div
        className="mt-3 pt-3 border-t border-border flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg h-8 text-xs gap-1.5 text-foreground hover:bg-muted font-medium"
          onClick={() => actions.onView(receipt)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>

        {permissions.canViewDetails && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 text-xs px-2.5 gap-1.5 text-primary hover:bg-primary/10 border-primary/20"
              onClick={() =>
                actions.onOpenDownloadDialog
                  ? actions.onOpenDownloadDialog(receipt)
                  : actions.onDownloadPdf
                    ? actions.onDownloadPdf(receipt, true)
                    : actions.onPreview
                      ? actions.onPreview(receipt)
                      : actions.onView(receipt)
              }
              title="Download or Print Receipt Voucher"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 text-xs px-2.5 gap-1.5 text-muted-foreground hover:bg-muted border-border"
              onClick={() =>
                actions.onPreview
                  ? actions.onPreview(receipt)
                  : actions.onView(receipt)
              }
              title="View Receipt Slip"
            >
              <FileText className="w-3.5 h-3.5" />
              Slip
            </Button>
          </>
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
            {permissions.canViewDetails && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    actions.onPreview
                      ? actions.onPreview(receipt)
                      : actions.onView(receipt)
                  }
                >
                  <FileText className="w-4 h-4 mr-2" /> View Slip
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    actions.onOpenDownloadDialog
                      ? actions.onOpenDownloadDialog(receipt)
                      : actions.onDownloadPdf
                        ? actions.onDownloadPdf(receipt, true)
                        : actions.onPreview?.(receipt)
                  }
                >
                  <Download className="w-4 h-4 mr-2 text-primary" /> Download Options...
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    actions.onDownloadPdf
                      ? actions.onDownloadPdf(receipt, true)
                      : actions.onPreview?.(receipt)
                  }
                >
                  <FileCheck className="w-4 h-4 mr-2 text-primary" /> Download PDF (With Seal)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    actions.onDownloadPdf
                      ? actions.onDownloadPdf(receipt, false)
                      : actions.onPreview?.(receipt)
                  }
                >
                  <Stamp className="w-4 h-4 mr-2 text-muted-foreground" /> Download PDF (Without Seal)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {permissions.canEdit && receipt.status === "issued" && (
              <DropdownMenuItem
                onClick={() =>
                  actions.onConfirmIssue(
                    receipt.id,
                    String(receipt.receiptNumber),
                  )
                }
                className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Mark
                as Paid
              </DropdownMenuItem>
            )}

            {permissions.canEdit && receipt.status === "issued" && (
              <DropdownMenuItem onClick={() => actions.onEditDraft(receipt)}>
                <Edit className="w-4 h-4 mr-2" /> Edit Receipt
              </DropdownMenuItem>
            )}

            {(receipt.status === "issued" || receipt.status === "paid") &&
              permissions.canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => actions.onVoidClick(receipt)}
                    className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
                  >
                    <Ban className="w-4 h-4 mr-2" /> Void Voucher
                  </DropdownMenuItem>
                </>
              )}

            {permissions.canDelete && receipt.status === "issued" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onDeleteDraft(receipt.id)}
                  className="text-destructive font-semibold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Receipt
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
export default ReceiptCard;
