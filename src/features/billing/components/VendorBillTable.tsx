import React, { memo } from "react";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  FileCheck,
  Ban,
  Building2,
  Calendar,
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
import { Skeleton } from "@/components/ui/skeleton";
import type { VendorBill } from "../types/billing.types";

interface VendorBillTableProps {
  bills: VendorBill[];
  actions: {
    onView: (bill: VendorBill) => void;
    onEdit?: (bill: VendorBill) => void;
    onEditVendor?: (vendorId: string, vendorName: string) => void;
    onRecordPayment: (bill: VendorBill) => void;
    onCancel: (bill: VendorBill) => void;
    onDelete: (bill: VendorBill) => void;
  };
  loading?: boolean;
}

export const VendorBillTable = memo(function VendorBillTable({
  bills,
  actions,
  loading = false,
}: VendorBillTableProps) {
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

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Bill #</th>
            <th>Awarding Body</th>
            <th>Dates</th>
            <th className="text-right">Amount</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skel-bill-${i}`}>
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
          ) : bills.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center py-12 text-muted-foreground text-xs"
              >
                No vendor bills found.
              </td>
            </tr>
          ) : (
            bills.map((bill, index) => {
              const isUnpaid = (bill.status === "ISSUED" || bill.status === "PARTIALLY_PAID") && Number(bill.balance) > 0;

              return (
                <tr
                  key={bill.id}
                  onClick={() => actions.onView(bill)}
                  className="hover:bg-muted/10 transition-colors duration-150 cursor-pointer group"
                >
                  {/* Bill # Cell */}
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-primary text-xs tracking-tight group-hover:underline">
                          {bill.billNumber}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {bill.lineItems?.length || 0} cert item{(bill.lineItems?.length || 0) === 1 ? "" : "s"}
                        </p>
                        {bill.notes && bill.notes.match(/https?:\/\/[^\s]+/)?.[0] && (
                          <a
                            href={bill.notes.match(/https?:\/\/[^\s]+/)?.[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded mt-0.5 max-w-[150px] truncate"
                            title="Open Attached Invoice / Receipt Link"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">Invoice / Receipt</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Vendor Cell */}
                  <td className="py-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-foreground text-xs truncate max-w-[200px]">
                        {bill.vendorName}
                      </p>
                      {bill.vendorTRN ? (
                        <p className="text-[11px] text-muted-foreground font-mono">
                          TRN: {bill.vendorTRN}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60">
                          Vendor Bill (AP)
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Dates Cell */}
                  <td className="py-3">
                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{bill.dueDate}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Bill Date: {bill.date}
                      </p>
                    </div>
                  </td>

                  {/* Amount Cell */}
                  <td className="text-right py-3">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-foreground text-xs">
                        {formatAED(bill.totalAmount, true)}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {Number(bill.paidAmount) > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Paid: {formatAED(bill.paidAmount, true)}
                          </span>
                        ) : (
                          <span className="text-rose-500 font-medium">
                            Due: {formatAED(bill.balance, true)}
                          </span>
                        )}
                      </p>
                    </div>
                  </td>

                  {/* Status Cell */}
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    {getStatusBadge(bill.status)}
                  </td>

                  {/* Actions Cell */}
                  <td
                    className="text-right py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 gap-1 text-foreground hover:bg-muted font-medium"
                        onClick={() => actions.onView(bill)}
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>

                      {isUnpaid && (
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                          onClick={() => actions.onRecordPayment(bill)}
                        >
                          <CreditCard className="w-3 h-3" />
                          Pay
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover border border-border shadow-lg min-w-[140px]"
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
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});
export default VendorBillTable;
