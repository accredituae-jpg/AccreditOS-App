import { motion } from "framer-motion";
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileCheck,
  Ban,
  ChevronDown,
  DollarSign,
  Stamp,
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
import type { Invoice } from "../types/billing.types";

interface InvoiceCardProps {
  invoice: Invoice;
  index: number;
  permissions: {
    canViewDetails: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  actions: {
    onView: (invoice: Invoice) => void;
    onPreview: (invoice: Invoice) => void;
    onDownloadPdf?: (invoice: Invoice, showSeal?: boolean) => void;
    onOpenDownloadDialog?: (invoice: Invoice) => void;
    onEdit: (invoice: Invoice) => void;
    onDelete: (id: string, invoiceNumber: string, permanent?: boolean) => void;
    onCancel?: (id: string, invoiceNumber: string) => void;
    onToggleStatus: (id: string, currentStatus: Invoice["status"]) => void;
    onRecordPayment?: (invoice: Invoice) => void;
  };
  isDownloadingPdf?: boolean;
}

export function InvoiceCard({
  invoice,
  index,
  actions,
  permissions,
  isDownloadingPdf = false,
}: InvoiceCardProps) {
  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <CheckCircle2 className="w-3 h-3" /> Paid
          </Badge>
        );
      case "partially_paid":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Clock className="w-3 h-3" /> Partially Paid
          </Badge>
        );
      case "issued":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <FileCheck className="w-3 h-3" /> Sent
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 gap-1 text-[11px] font-semibold px-2 py-0.5"
          >
            <Clock className="w-3 h-3" /> Draft
          </Badge>
        );
      case "cancelled":
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn(
        "grid-card relative group hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between",
        permissions.canViewDetails && "cursor-pointer",
      )}
      onClick={() => permissions.canViewDetails && actions.onView(invoice)}
    >
      <div>
        {/* Card Header: Avatar, Invoice # and Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono font-bold text-primary text-sm tracking-tight truncate">
                {invoice.invoiceNumber}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {invoice.lineItems?.length || 1} line item
                {(invoice.lineItems?.length || 1) > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {permissions.canEdit && invoice.status === "draft" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer focus:outline-none flex items-center gap-1 hover:opacity-80 transition-opacity">
                    {getStatusBadge(invoice.status)}
                    <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border border-border shadow-lg min-w-[140px]"
                >
                  <DropdownMenuItem
                    className="capitalize text-xs cursor-pointer gap-2"
                    onClick={() => actions.onToggleStatus(invoice.id, "issued")}
                  >
                    <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                    Mark as Sent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              getStatusBadge(invoice.status)
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="p-2.5 rounded-lg bg-muted/40 dark:bg-muted/15 border border-border/50 mb-3 space-y-1">
          <div className="flex items-center gap-1.5">
            {/* <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> */}
            <p className="font-semibold text-foreground text-xs truncate">
              {invoice.client}
            </p>
          </div>
          {invoice.trnNo ? (
            <p className="text-[10px] text-muted-foreground font-mono">
              TRN: {invoice.trnNo}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/60">
              No TRN registered
            </p>
          )}
        </div>

        {/* Dates & Financial Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              Invoice Date
            </span>
            <span className="font-medium text-foreground">
              {invoice.date || "N/A"}
            </span>
          </div>

          {invoice.dueDate && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                Due Date
              </span>
              <span
                className={cn(
                  "font-medium",
                  invoice.status !== "paid" && invoice.status !== "cancelled"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                )}
              >
                {invoice.dueDate}
              </span>
            </div>
          )}

          {/* Financial Breakdown Section */}
          <div className="mt-3 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/60 p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Subtotal (Excl. VAT)</span>
              <span className="font-mono font-medium text-foreground">
                {formatAED(invoice.subtotal, true)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>VAT (5%)</span>
              <span className="font-mono font-medium text-foreground">
                {formatAED(invoice.vatAmount, true)}
              </span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="font-mono font-medium">
                  -{formatAED(invoice.discountAmount, true)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex justify-between items-center">
              <span className="text-xs font-semibold text-foreground">
                Total (Inc. VAT)
              </span>
              <span className="text-base font-bold font-mono text-primary">
                {formatAED(invoice.totalAmount, true)}
              </span>
            </div>

            {invoice.status === "partially_paid" && (
              <div className="pt-1.5 border-t border-dashed border-border/60 flex justify-between items-center text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400">
                  Paid: {formatAED(invoice.paidAmount || 0, true)}
                </span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  Balance: {formatAED(invoice.balance || 0, true)}
                </span>
              </div>
            )}
          </div>
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
          onClick={() => actions.onView(invoice)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>

        {permissions.canViewDetails && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs px-2.5 gap-1.5 text-primary hover:bg-primary/10 border-primary/20"
            disabled={isDownloadingPdf}
            onClick={() =>
              actions.onOpenDownloadDialog
                ? actions.onOpenDownloadDialog(invoice)
                : actions.onDownloadPdf
                  ? actions.onDownloadPdf(invoice)
                  : actions.onPreview(invoice)
            }
            title="Download PDF"
          >
            {isDownloadingPdf ? (
              <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            PDF
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
            {permissions.canViewDetails && (
              <>
                <DropdownMenuItem
                  disabled={isDownloadingPdf}
                  onClick={() =>
                    actions.onDownloadPdf
                      ? actions.onDownloadPdf(invoice, true)
                      : actions.onPreview(invoice)
                  }
                >
                  <Download className="w-4 h-4 mr-2 text-primary" /> Download Options (Format & Seal)...
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isDownloadingPdf} onClick={() => actions.onDownloadPdf ? actions.onDownloadPdf(invoice, true) : actions.onPreview(invoice)}>
                  <FileText className="w-4 h-4 mr-2 text-primary" /> Download PDF (With Seal)
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isDownloadingPdf}
                  onClick={() =>
                    actions.onDownloadPdf
                      ? actions.onDownloadPdf(invoice, false)
                      : actions.onPreview(invoice)
                  }
                >
                  <Stamp className="w-4 h-4 mr-2 text-muted-foreground" /> Download PDF (Without Seal)
                </DropdownMenuItem>
              </>
            )}
            {permissions.canEdit && invoice.status === "draft" && (
              <DropdownMenuItem
                onClick={() => actions.onToggleStatus(invoice.id, "issued")}
                className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer"
              >
                <FileCheck className="w-4 h-4 mr-2 text-blue-500" /> Mark as Sent
              </DropdownMenuItem>
            )}
            {(invoice.status === "issued" || invoice.status === "partially_paid") && actions.onRecordPayment && (
              <DropdownMenuItem
                onClick={() => actions.onRecordPayment!(invoice)}
                className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
              >
                <DollarSign className="w-4 h-4 mr-2 text-emerald-500" /> Record Payment
              </DropdownMenuItem>
            )}
            {permissions.canEdit && invoice.status === "draft" && (
              <DropdownMenuItem onClick={() => actions.onEdit(invoice)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
            )}
            {permissions.canDelete && invoice.status !== "paid" && (
              <>
                <DropdownMenuSeparator />
                {invoice.status !== "cancelled" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      actions.onCancel
                        ? actions.onCancel(
                            invoice.id,
                            invoice.invoiceNumber,
                          )
                        : actions.onDelete(
                            invoice.id,
                            invoice.invoiceNumber,
                            false,
                          )
                    }
                    className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
                  >
                    <Ban className="w-4 h-4 mr-2" /> Cancel Invoice
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      actions.onDelete(
                        invoice.id,
                        invoice.invoiceNumber,
                        true,
                      )
                    }
                    className="text-destructive font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Invoice
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
export default InvoiceCard;
