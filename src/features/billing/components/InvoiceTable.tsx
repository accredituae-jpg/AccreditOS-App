import React, { memo } from "react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  FileCheck,
  Ban,
  FileText,
  Building2,
  Calendar,
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Invoice } from "../types/billing.types";

interface InvoiceTableProps {
  invoices: Invoice[];
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
  downloadingInvoiceId?: string | null;
  loading?: boolean;
}

export const InvoiceTable = memo(function InvoiceTable({
  invoices,
  actions,
  permissions,
  downloadingInvoiceId,
  loading = false,
}: InvoiceTableProps) {
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
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client Details</th>
            <th>Dates</th>
            <th className="text-right">Amount</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skel-inv-${i}`}>
                <td>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </td>
                <td>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </td>
                <td className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </td>
                <td>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="text-right">
                  <Skeleton className="h-8 w-20 ml-auto rounded-lg" />
                </td>
              </tr>
            ))
          ) : invoices.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center py-12 text-muted-foreground text-sm"
              >
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                No invoices found.
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() =>
                  permissions.canViewDetails && actions.onView(invoice)
                }
                className={cn(
                  "transition-colors duration-150 hover:bg-muted/40",
                  permissions.canViewDetails && "cursor-pointer"
                )}
              >
                {/* Invoice # & Avatar */}
                <td>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-mono font-bold text-primary text-sm hover:underline">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {invoice.lineItems?.length || 1} item
                        {(invoice.lineItems?.length || 1) > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Client Details */}
                <td>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <span className="truncate max-w-[220px]">
                        {invoice.client}
                      </span>
                    </p>
                    {invoice.trnNo ? (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        TRN: {invoice.trnNo}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/70">
                        No TRN registered
                      </p>
                    )}
                  </div>
                </td>

                {/* Issue & Due Date */}
                <td>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground text-xs flex items-center gap-1.5">
                      {invoice.date || "N/A"}
                    </p>
                    {invoice.dueDate && (
                      <p
                        className={cn(
                          "text-[11px]",
                          invoice.status !== "paid" &&
                            invoice.status !== "cancelled"
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        Due: {invoice.dueDate}
                      </p>
                    )}
                  </div>
                </td>

                {/* Amount */}
                <td className="text-right">
                  <div>
                    <p className="font-mono font-bold text-foreground text-sm">
                      {formatAED(invoice.totalAmount, true)}
                    </p>
                    {invoice.vatAmount !== undefined && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        VAT {formatAED(invoice.vatAmount, true)}
                      </p>
                    )}
                  </div>
                </td>

                {/* Status Dropdown */}
                <td onClick={(e) => e.stopPropagation()}>
                  {permissions.canEdit && invoice.status === "draft" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer focus:outline-none flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                          {getStatusBadge(invoice.status)}
                          <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
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
                </td>

                {/* Actions */}
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    {permissions.canViewDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-primary gap-1.5 border-primary/20 hover:bg-primary/10 rounded-lg font-medium"
                        title="Download PDF"
                        disabled={downloadingInvoiceId === invoice.id}
                        onClick={() =>
                          actions.onOpenDownloadDialog
                            ? actions.onOpenDownloadDialog(invoice)
                            : actions.onDownloadPdf
                              ? actions.onDownloadPdf(invoice)
                              : actions.onPreview(invoice)
                        }
                      >
                        {downloadingInvoiceId === invoice.id ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>PDF</span>
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-popover shadow-lg border border-border min-w-[150px]"
                      >
                        {permissions.canViewDetails && (
                          <>
                            <DropdownMenuItem
                              onClick={() => actions.onView(invoice)}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={downloadingInvoiceId === invoice.id}
                              onClick={() =>
                                actions.onDownloadPdf
                                  ? actions.onDownloadPdf(invoice, true)
                                  : actions.onPreview(invoice)
                              }
                            >
                              <FileText className="w-4 h-4 mr-2 text-primary" />{" "}
                              Download Options (Format & Seal)...
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={isDownloadingPdf} onClick={() => actions.onDownloadPdf ? actions.onDownloadPdf(invoice, true) : actions.onPreview(invoice)}>
                                Download PDF (With Seal)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={downloadingInvoiceId === invoice.id}
                              onClick={() =>
                                actions.onDownloadPdf
                                  ? actions.onDownloadPdf(invoice, false)
                                  : actions.onPreview(invoice)
                              }
                            >
                              <Stamp className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                              Download PDF (Without Seal)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                          <DropdownMenuItem
                            onClick={() => actions.onEdit(invoice)}
                          >
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
export default InvoiceTable;
