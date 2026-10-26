import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import { Building2, Calendar, CreditCard, FileCheck, CheckCircle2, Clock, Ban, ExternalLink, Trash2, Edit2, Loader2 } from "lucide-react";
import type { VendorBill } from "../types/billing.types";
import { extractUrlsAndCleanText } from "../utils/billing.utils";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiDeleteVendorPayment } from "@/lib/api/financeApi";

interface VendorBillDetailsDialogProps {
  bill: VendorBill | null;
  onClose: () => void;
  onEditClick?: (bill: VendorBill) => void;
  onEditVendorClick?: (vendorId: string, vendorName: string) => void;
  onRecordPaymentClick?: (bill: VendorBill) => void;
  onDeleteClick?: (bill: VendorBill) => void;
}

export function VendorBillDetailsDialog({
  bill,
  onClose,
  onEditClick,
  onEditVendorClick,
  onRecordPaymentClick,
  onDeleteClick,
}: VendorBillDetailsDialogProps) {
  const [currentBill, setCurrentBill] = useState<VendorBill | null>(bill);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const confirm = useConfirm();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentBill(bill);
  }, [bill]);

  if (!currentBill) return null;

  const activeBill = currentBill;

  const handleDeletePayment = async (paymentId: string, paymentNumber: string) => {
    const ok = await confirm({
      title: "Delete Payment Transaction",
      description: `Are you sure you want to delete payment ${paymentNumber}? The bill's paid amount and outstanding balance will be automatically recalculated.`,
      type: "destructive",
      confirmText: "Delete Payment",
    });
    if (!ok) return;

    try {
      setDeletingPaymentId(paymentId);
      const res = await apiDeleteVendorPayment(activeBill.id, paymentId);
      if (res.data?.bill) {
        setCurrentBill(res.data.bill);
      }
      queryClient.invalidateQueries({ queryKey: ["finance", "vendor-bills"] });
      queryClient.invalidateQueries({ queryKey: ["finance", "vendor-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      toast({
        title: "Payment Deleted",
        description: `Payment ${paymentNumber} has been deleted and the bill updated.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to Delete Payment",
        description: err.message || "An error occurred while deleting payment.",
        variant: "destructive",
      });
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const { urls: billUrls, cleanText: billCleanNotes } = extractUrlsAndCleanText(activeBill.notes);

  const getStatusBadge = (status: VendorBill["status"]) => {
    switch (status) {
      case "PAID":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1 text-xs"><Clock className="w-3.5 h-3.5" /> Partially Paid</Badge>;
      case "ISSUED":
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20 gap-1 text-xs"><FileCheck className="w-3.5 h-3.5" /> Issued</Badge>;
      case "DRAFT":
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1 text-xs"><Clock className="w-3.5 h-3.5" /> Draft</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-xs"><Ban className="w-3.5 h-3.5" /> Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <FormDialog
      open={!!activeBill}
      onCloseAttempt={onClose}
      title={`Vendor Bill Details — ${activeBill.billNumber}`}
      description={`Issued to ${activeBill.vendorName} on ${activeBill.date}`}
      icon={Building2}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vendor / Awarding Body</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h4 className="text-sm font-bold text-foreground">{activeBill.vendorName}</h4>
              {onEditVendorClick && activeBill.awardingBodyId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEditVendorClick(activeBill.awardingBodyId, activeBill.vendorName);
                  }}
                  className="h-5 px-1.5 text-[10px] gap-1 text-primary hover:text-primary/90 hover:bg-primary/10 rounded"
                  title="Edit Master Vendor Profile"
                >
                  <Edit2 className="w-2.5 h-2.5" /> Edit Vendor Info
                </Button>
              )}
            </div>
            {activeBill.vendorTRN && <p className="text-[11px] font-mono text-muted-foreground">TRN: {activeBill.vendorTRN}</p>}
            {(activeBill.vendorLocation || activeBill.vendorPhone) && (
              <p className="text-[11px] text-muted-foreground">{[activeBill.vendorLocation, activeBill.vendorPhone].filter(Boolean).join(" • ")}</p>
            )}
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            {getStatusBadge(activeBill.status)}
            <p className="text-[11px] text-muted-foreground mt-1">Due Date: <span className="font-semibold text-foreground">{activeBill.dueDate}</span></p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <p className="font-bold text-foreground uppercase text-[11px] tracking-wider">
            Billed Certificate Line Items ({activeBill.lineItems.length})
          </p>
          <div className="border border-border/40 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted/20 uppercase text-[10px] font-bold text-muted-foreground border-b border-border/40">
                <tr>
                  <th className="px-3 py-2">Cert #</th>
                  <th className="px-3 py-2">Participant</th>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2 text-right">Fee (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {activeBill.lineItems.map((li, idx) => (
                  <tr key={idx} className="hover:bg-muted/10">
                    <td className="px-3 py-2 font-mono font-bold text-primary">{li.certificateNumber || "N/A"}</td>
                    <td className="px-3 py-2 font-medium">{li.participantName || "Participant"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{li.courseName || "Training Course"}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{formatAED(li.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Attached Invoice / Receipt Links */}
        {(billCleanNotes || billUrls.length > 0) && (
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground uppercase text-[10px] tracking-wider">
                Attached Invoice / Receipt
              </span>
              {billUrls.length > 0 && (
                <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {billUrls.length} Attachment{billUrls.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {billCleanNotes && (
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {billCleanNotes}
              </p>
            )}
            {billUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                {billUrls.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Attached Invoice / Receipt {billUrls.length > 1 ? `#${i + 1}` : ""}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial Summary */}
        <div className="border-t border-border/40 pt-3 space-y-1.5 font-medium">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span>{formatAED(activeBill.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT ({Number(activeBill.vatAmount) > 0 ? "5%" : "0% / Exempt"}):</span>
            <span>{formatAED(activeBill.vatAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-foreground border-t border-border/40 pt-1.5">
            <span>Total Bill Liability:</span>
            <span>{formatAED(activeBill.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Total Paid:</span>
            <span>{formatAED(activeBill.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-rose-600 font-bold text-sm">
            <span>Outstanding Balance:</span>
            <span>{formatAED(activeBill.balance)}</span>
          </div>
        </div>

        {/* Payment History */}
        {activeBill.payments && activeBill.payments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            <p className="font-bold text-foreground uppercase text-[11px] tracking-wider">
              Payment Transactions ({activeBill.payments.length})
            </p>
            <div className="space-y-1.5">
              {activeBill.payments.map((p) => {
                const { urls: pUrls, cleanText: pClean } = extractUrlsAndCleanText(p.notes);
                return (
                  <div key={p.id} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.paymentNumber}</span>
                        <span className="text-muted-foreground ml-2 text-xs">via {p.paymentMethod} ({p.paymentDate})</span>
                        {p.referenceNo && <span className="text-[10px] text-muted-foreground block">Ref: {p.referenceNo} {p.bankAccount ? `• ${p.bankAccount}` : ''}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatAED(p.amount)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(p.id, p.paymentNumber)}
                          disabled={deletingPaymentId === p.id}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete / Undo this payment"
                        >
                          {deletingPaymentId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {(pClean || pUrls.length > 0) && (
                      <div className="text-[11px] text-muted-foreground border-t border-emerald-500/10 pt-1 flex items-center justify-between gap-2">
                        {pClean ? <span className="truncate">{pClean}</span> : <span className="text-muted-foreground/60 text-[10px]">Payment Receipt Attached</span>}
                        {pUrls.length > 0 && (
                          <a
                            href={pUrls[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" /> View Receipt
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action footer */}
        <div className="flex justify-between items-center gap-2 pt-2">
          <div>
            {onDeleteClick && activeBill.status === "CANCELLED" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onClose();
                  onDeleteClick(activeBill);
                }}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Bill
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEditClick && activeBill.status !== "CANCELLED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditClick(activeBill);
                }}
                className="gap-1.5 text-xs text-foreground hover:bg-muted font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Bill
              </Button>
            )}
            {onRecordPaymentClick && (activeBill.status === "ISSUED" || activeBill.status === "PARTIALLY_PAID") && (
              <Button
                onClick={() => {
                  onClose();
                  onRecordPaymentClick(activeBill);
                }}
                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CreditCard className="w-3.5 h-3.5" /> Record Payment
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
