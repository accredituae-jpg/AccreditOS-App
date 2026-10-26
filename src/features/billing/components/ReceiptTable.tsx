import React, { memo } from "react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  FileCheck,
  Ban,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatAED } from "@/lib/utils";
import type { Receipt } from "../types/billing.types";
import { formatDateDDMMYYYY } from "../utils/billing.utils";

interface ReceiptTableProps {
  receipts: Receipt[];
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
  loading?: boolean;
}

export const ReceiptTable = memo(function ReceiptTable({
  receipts,
  actions,
  permissions,
  loading = false,
}: ReceiptTableProps) {
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
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Receipt #</th>
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
              <tr key={`skel-rec-${i}`}>
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
          ) : receipts.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center py-12 text-muted-foreground text-sm"
              >
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                No receipts found.
              </td>
            </tr>
          ) : (
            receipts.map((receipt) => (
              <tr
                key={receipt.id}
                onClick={() =>
                  permissions.canViewDetails && actions.onView(receipt)
                }
                className={cn(
                  "transition-colors duration-150 hover:bg-muted/10",
                  permissions.canViewDetails && "cursor-pointer"
                )}
              >
                {/* Receipt # */}
                <td>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-mono font-bold text-primary text-sm hover:underline">
                        {receipt.receiptNumber
                          ? `RV-${receipt.receiptNumber}`
                          : "Draft"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {receipt.allocations?.length || 0} INV
                        {(receipt.allocations?.length || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Client Details */}
                <td>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <span className="truncate max-w-[220px]">
                        {receipt.clientSnapshot?.companyName || "N/A"}
                      </span>
                      {receipt.clientSnapshot?.billingType === "individual" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Individual
                        </span>
                      )}
                    </p>
                    {receipt.clientSnapshot?.trnNo &&
                    receipt.clientSnapshot.trnNo !== "N/A" ? (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        TRN: {receipt.clientSnapshot.trnNo}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/70">
                        {receipt.clientSnapshot?.billingType === "individual"
                          ? "Individual Candidate"
                          : "No TRN registered"}
                      </p>
                    )}
                  </div>
                </td>

                {/* Dates & Method */}
                <td>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground text-xs flex items-center gap-1.5">
                      {formatDateDDMMYYYY(receipt.date)}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase font-mono flex items-center gap-1">
                      <span>
                        {receipt.paymentMethod?.replace("_", " ") || "CASH"}
                      </span>
                      {receipt.referenceNo && (
                        <span className="text-muted-foreground/70 font-mono truncate max-w-[100px]">
                          • {receipt.referenceNo}
                        </span>
                      )}
                    </p>
                  </div>
                </td>

                {/* Amount */}
                <td className="text-right">
                  <div>
                    <p className="font-mono font-bold text-foreground text-sm">
                      {formatAED(receipt.amount, true)}
                    </p>
                    {/* {receipt.allocatedAmount !== undefined && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Allocated {formatAED(receipt.allocatedAmount, true)}
                      </p>
                    )} */}
                  </div>
                </td>

                {/* Status Dropdown */}
                <td onClick={(e) => e.stopPropagation()}>
                  {permissions.canEdit && receipt.status === "issued" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer focus:outline-none flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                          {getStatusBadge(receipt.status)}
                          <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="bg-card border border-border shadow-lg min-w-[150px]"
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
                          Confirm & Pay
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    getStatusBadge(receipt.status)
                  )}
                </td>

                {/* Actions Dropdown */}
                <td className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end">
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
                              onClick={() => actions.onView(receipt)}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                actions.onPreview
                                  ? actions.onPreview(receipt)
                                  : actions.onView(receipt)
                              }
                            >
                              <FileText className="w-4 h-4 mr-2 text-primary" />{" "}
                              View Slip
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
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />{" "}
                            Mark as Paid
                          </DropdownMenuItem>
                        )}

                        {permissions.canEdit && receipt.status === "issued" && (
                          <DropdownMenuItem
                            onClick={() => actions.onEditDraft(receipt)}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit Receipt
                          </DropdownMenuItem>
                        )}

                        {(receipt.status === "issued" ||
                          receipt.status === "paid") &&
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

                        {permissions.canDelete &&
                          receipt.status === "issued" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  actions.onDeleteDraft(receipt.id)
                                }
                                className="text-destructive font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                Receipt
                              </DropdownMenuItem>
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
export default ReceiptTable;
