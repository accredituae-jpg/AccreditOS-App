import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { useToast } from "@/hooks/use-toast";
import { formatAED } from "@/lib/utils";
import { CreditCard, DollarSign, ExternalLink } from "lucide-react";
import { apiRecordVendorPayment } from "@/lib/api/financeApi";
import type { VendorBill } from "../types/billing.types";

interface RecordVendorPaymentDialogProps {
  bill: VendorBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordVendorPaymentDialog({
  bill,
  open,
  onOpenChange,
  onSuccess,
}: RecordVendorPaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "CHEQUE" | "CASH">("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (bill && open) {
      setAmount(bill.balance.toFixed(2));
      setPaymentDate(new Date());
      setPaymentMethod("BANK_TRANSFER");
      setReferenceNo("");
      setBankAccount("");
      setNotes("");
    }
  }, [bill, open]);

  if (!bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid payment amount.", variant: "destructive" });
      return;
    }

    if (payAmt > bill.balance + 0.001) {
      toast({
        title: "Over-Payment Guard",
        description: `Payment amount (${formatAED(payAmt)}) cannot exceed bill balance (${formatAED(bill.balance)}).`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRecordVendorPayment(bill.id, {
        amount: payAmt,
        paymentDate: paymentDate.toISOString().split("T")[0],
        paymentMethod,
        referenceNo,
        bankAccount,
        notes,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to record payment.");
      }

      toast({
        title: "Vendor Payment Recorded",
        description: `Recorded payment of ${formatAED(payAmt)} against Bill #${bill.billNumber}.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to record vendor payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={`Record Vendor Payment (${bill.billNumber})`}
      description={`Record payment made to ${bill.vendorName}`}
      icon={CreditCard}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Record Vendor Payment"
      maxWidth="max-w-md"
    >
      <div className="border border-border/60 rounded-xl p-3 bg-muted/10 space-y-1 text-xs mb-3">
        <div className="flex justify-between text-muted-foreground">
          <span>Bill Total:</span>
          <span className="font-semibold text-foreground">{formatAED(bill.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Paid so far:</span>
          <span className="font-semibold text-foreground">{formatAED(bill.paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-border/40 pt-1 text-primary">
          <span>Outstanding Balance:</span>
          <span>{formatAED(bill.balance)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Payment Amount (AED) *</Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs text-muted-foreground/70 font-semibold select-none">
              AED
            </span>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              required
              className="pl-12 h-9 text-xs font-bold font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER" className="text-xs">Bank Transfer</SelectItem>
                <SelectItem value="CHEQUE" className="text-xs">Cheque</SelectItem>
                <SelectItem value="CASH" className="text-xs">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Date *</Label>
            <CustomCalendar
              value={paymentDate}
              onChange={(d) => d && setPaymentDate(d)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reference / Cheque #</Label>
            <Input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. TXN-998822"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Bank Account</Label>
            <Input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="e.g. Emirates NBD 1234"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Notes / Receipt Link</Label>
            {notes.match(/https?:\/\/[^\s]+/)?.[0] && (
              <a
                href={notes.match(/https?:\/\/[^\s]+/)?.[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-2.5 h-2.5" /> Preview Link
              </a>
            )}
          </div>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment notes or paste transaction/receipt URL (https://...)"
            className="h-9 text-xs"
          />
        </div>
      </div>
    </FormDialog>
  );
}
