import { DetailDialog } from "@/components/ui/detail-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAED, cn } from "@/lib/utils";
import {
  Receipt as ReceiptIcon,
  Edit,
  Eye,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  User,
  CheckCircle2,
  Clock,
  Ban,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import type { Receipt } from "../types/billing.types";
import { formatDateDDMMYYYY, extractUrlsAndCleanText } from "../utils/billing.utils";

interface ReceiptDetailsDialogProps {
  receipt: Receipt | null;
  onClose: () => void;
  onViewReceipt: (receipt: Receipt) => void;
  onEditClick?: (receipt: Receipt) => void;
  onVoidClick?: (receipt: Receipt) => void;
  canEdit?: boolean;
}

export function ReceiptDetailsDialog({
  receipt,
  onClose,
  onViewReceipt,
  onEditClick,
  onVoidClick,
  canEdit = false,
}: ReceiptDetailsDialogProps) {
  if (!receipt) return null;

  const formattedDate = formatDateDDMMYYYY(receipt.date);
  const formattedPaymentDate = formatDateDDMMYYYY(receipt.paymentDate || receipt.date);
  const clientSnap = receipt.clientSnapshot || ({} as any);
  const isIndividual = clientSnap.billingType === "individual";
  const allocations = receipt.allocations || [];
  const allocatedSum = receipt.allocatedAmount !== undefined
    ? Number(receipt.allocatedAmount)
    : allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const unallocatedAmount = Math.max(0, Number(receipt.amount) - allocatedSum);

  const getStatusBadge = () => {
    switch (receipt.status) {
      case "paid":
        return {
          label: "Paid",
          variant: "success" as const,
        };
      case "issued":
        return {
          label: "Issued",
          variant: "info" as const,
        };
      case "voided":
        return {
          label: "Voided",
          variant: "destructive" as const,
        };
      default:
        return {
          label: receipt.status,
          variant: "default" as const,
        };
    }
  };

  return (
    <DetailDialog
      open={!!receipt}
      onOpenChange={(open) => !open && onClose()}
      title={receipt.receiptNumber ? `RV-${receipt.receiptNumber}` : "Draft Voucher"}
      subtitle={`Receipt Voucher • Issued on ${formattedDate}`}
      icon={<ReceiptIcon className="w-6 h-6 text-primary" />}
      status={getStatusBadge()}
      className="w-[95vw] sm:w-full max-w-3xl"
      actions={
        <div className="flex gap-2 w-full sm:w-auto">
          {receipt.status === "issued" && canEdit && onEditClick && (
            <Button variant="outline" size="sm" onClick={() => onEditClick(receipt)}>
              <Edit className="w-4 h-4 mr-1.5" />
              Edit Receipt
            </Button>
          )}
          {(receipt.status === "issued" || receipt.status === "paid") && canEdit && onVoidClick && (
            <Button variant="destructive" size="sm" onClick={() => onVoidClick(receipt)}>
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Void Voucher
            </Button>
          )}
          <Button size="sm" onClick={() => onViewReceipt(receipt)}>
            <Eye className="w-4 h-4 mr-1.5" />
            View Slip
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Voided Alert Banner if applicable */}
        {receipt.status === "voided" && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs">This Receipt Voucher has been VOIDED</p>
              <p className="text-[11px] text-destructive/85">
                Voided by {receipt.voidedByName || receipt.voidedBy?.name || "User"} on{" "}
                {receipt.voidedAt ? new Date(receipt.voidedAt).toLocaleString() : "—"}
                {receipt.voidReason ? ` • Reason: ${receipt.voidReason}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* 1. Client / Recipient Details Card */}
        <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              {isIndividual ? (
                <User className="w-4 h-4 text-emerald-500" />
              ) : (
                <Building2 className="w-4 h-4 text-primary" />
              )}
              <span className="font-bold text-sm text-foreground">
                {clientSnap.companyName || "N/A"}
              </span>
              {isIndividual ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold"
                >
                  Individual Candidate
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold"
                >
                  Company (B2B)
                </Badge>
              )}
            </div>
            {clientSnap.trnNo && clientSnap.trnNo !== "N/A" && (
              <span className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50">
                TRN: {clientSnap.trnNo}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div>
              <p className="text-muted-foreground">Contact Person</p>
              <p className="font-medium text-foreground">{clientSnap.contactPerson || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone / Mobile</p>
              <p className="font-medium text-foreground">{clientSnap.phone || clientSnap.mobile || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium text-foreground truncate">{clientSnap.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Location / PO Box</p>
              <p className="font-medium text-foreground truncate">
                {[clientSnap.location, clientSnap.poBox ? `P.O. ${clientSnap.poBox}` : ""].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Payment & Bank Information Card */}
        <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Payment Particulars
              </span>
            </div>
            <span className="font-bold uppercase font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border text-[10px]">
              {receipt.paymentMethod?.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
            <div>
              <p className="text-muted-foreground">Paid Date</p>
              <p className="font-medium text-foreground font-mono">{formattedPaymentDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {receipt.paymentMethod === "CHEQUE" ? "Cheque Number" : "Reference No."}
              </p>
              <p className="font-mono font-medium text-foreground">{receipt.referenceNo || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Drawn on Bank</p>
              <p className="font-medium text-foreground">{receipt.drawnOnBank || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Transaction Ref</p>
              <p className="font-mono font-medium text-foreground">{receipt.transactionReference || "—"}</p>
            </div>
          </div>

          {receipt.amountInWords && (
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-primary text-[11px] font-medium flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-primary/70 tracking-wider shrink-0">In Words:</span>
              <span className="italic font-medium">{receipt.amountInWords}</span>
            </div>
          )}
        </div>

        {/* 3. Invoices Settled / Allocated Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Invoices Settled / Allocated ({allocations.length})
            </h4>
            <span className="text-[11px] font-mono text-muted-foreground">
              Total Allocated: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAED(allocatedSum, true)}</span>
            </span>
          </div>

          <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 uppercase text-[10px] font-semibold text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-3.5 py-2.5">Invoice #</th>
                  <th className="px-3.5 py-2.5">Due Date</th>
                  <th className="px-3.5 py-2.5 text-right">Total Amount</th>
                  <th className="px-3.5 py-2.5 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {allocations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground italic">
                      No invoices currently allocated to this receipt.
                    </td>
                  </tr>
                ) : (
                  allocations.map((alloc, idx) => (
                    <tr key={alloc.id || idx} className="hover:bg-muted/15 transition-colors">
                      <td className="px-3.5 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{alloc.invoiceNumber}</span>
                          {alloc.invoiceStatus && (
                            <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground font-mono">
                              {alloc.invoiceStatus.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-muted-foreground font-mono">
                        {alloc.invoiceDueDate || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                        {alloc.invoiceTotal ? formatAED(alloc.invoiceTotal, true) : "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAED(alloc.amount, true)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Financial Totals Card */}
        <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1.5 font-medium">
          <div className="flex justify-between text-muted-foreground">
            <span>Receipt Voucher Total Amount:</span>
            <span className="font-mono font-bold text-foreground text-sm">{formatAED(receipt.amount, true)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Total Applied / Allocated:</span>
            <span className="font-mono font-semibold">{formatAED(allocatedSum, true)}</span>
          </div>
          {unallocatedAmount > 0 && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold pt-1 border-t border-dashed border-border/60">
              <span>Unallocated Remaining:</span>
              <span className="font-mono">{formatAED(unallocatedAmount, true)}</span>
            </div>
          )}
        </div>

        {/* 5. Notes & Attached Documents / Links */}
        {(() => {
          const { urls: receiptUrls, cleanText: receiptCleanNotes } = extractUrlsAndCleanText(receipt.notes);
          if (!receiptCleanNotes && receiptUrls.length === 0) return null;
          return (
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/25 text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[10px]">
                  Internal Notes & Attached Documents
                </span>
                <div className="flex items-center gap-2">
                  {receiptUrls.length > 0 && (
                    <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {receiptUrls.length} Attachment{receiptUrls.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground italic">
                    Confidential • Not shown on voucher slip
                  </span>
                </div>
              </div>

              {receiptCleanNotes && (
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {receiptCleanNotes}
                </p>
              )}

              {receiptUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-500/20">
                  {receiptUrls.map((url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Attached Document {receiptUrls.length > 1 ? `#${i + 1}` : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className="text-[10px] text-muted-foreground/70 flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-border/40">
          <span>Created by: <strong className="font-semibold text-muted-foreground">{receipt.createdByName || receipt.createdBy?.name || "System"}</strong></span>
          <span>Created at: {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : "—"}</span>
        </div>
      </div>
    </DetailDialog>
  );
}
export default ReceiptDetailsDialog;
