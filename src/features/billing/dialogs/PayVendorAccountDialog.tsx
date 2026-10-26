import { useState, useEffect, useMemo } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { useToast } from "@/hooks/use-toast";
import { cn, formatAED } from "@/lib/utils";
import {
  Building2,
  DollarSign,
  CheckSquare,
  Square,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { apiPayVendor, type VendorSummaryItem } from "@/lib/api/financeApi";

interface PayVendorAccountDialogProps {
  vendor: VendorSummaryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PayVendorAccountDialog({
  vendor,
  open,
  onOpenChange,
  onSuccess,
}: PayVendorAccountDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "CHEQUE" | "CASH">("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [isVatEnabled, setIsVatEnabled] = useState(true);

  useEffect(() => {
    if (vendor && open) {
      const certs = vendor.unbilledCertificates || [];
      const allIds = certs.map((c) => c.id);
      setSelectedCertIds(allIds);

      const vatRegistered = vendor.isVatRegistered !== false;
      setIsVatEnabled(vatRegistered);

      const rawVat = Number(vendor.vatPercent) || 5;
      const vatPct = vatRegistered ? (rawVat > 0 ? rawVat : 5) : 0;
      const sub = certs.reduce((sum, c) => sum + Number(c.fee || 0), 0);
      const totalObligation = (sub + sub * (vatPct / 100)) + Number(vendor.billedBalance || 0);

      // Default amount to full pending balance or empty
      setPaymentAmount(totalObligation > 0 ? totalObligation.toFixed(2) : "");
      setPaymentDate(new Date());
      setPaymentMethod("BANK_TRANSFER");
      setReferenceNo("");
      setBankAccount("");
      setNotes("");
    }
  }, [vendor, open]);

  const certs = vendor?.unbilledCertificates || [];

  const rawVat = vendor ? Number(vendor.vatPercent) || 5 : 5;
  const vatPct = isVatEnabled ? (rawVat > 0 ? rawVat : 5) : 0;

  const selectedCerts = useMemo(() => {
    return certs.filter((c) => selectedCertIds.includes(c.id));
  }, [certs, selectedCertIds]);

  const selectedCertSubtotal = useMemo(() => {
    return selectedCerts.reduce((sum, c) => sum + Number(c.fee || 0), 0);
  }, [selectedCerts]);

  const selectedCertVat = useMemo(() => {
    return isVatEnabled ? selectedCertSubtotal * (vatPct / 100) : 0;
  }, [isVatEnabled, selectedCertSubtotal, vatPct]);

  const selectedCertsTotal = selectedCertSubtotal + selectedCertVat;
  const existingBilledBalance = Number(vendor?.billedBalance || 0);
  const totalPayableScope = selectedCertsTotal + existingBilledBalance;

  const payAmtNum = parseFloat(paymentAmount) || 0;
  const remainingAfterPayment = Math.max(0, totalPayableScope - payAmtNum);

  const toggleSelectAll = () => {
    if (selectedCertIds.length === certs.length) {
      setSelectedCertIds([]);
    } else {
      setSelectedCertIds(certs.map((c) => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    if (!payAmtNum || payAmtNum <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid positive payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (totalPayableScope > 0 && payAmtNum > totalPayableScope + 0.01) {
      toast({
        title: "Over-Payment Guard",
        description: `Payment amount (${formatAED(payAmtNum)}) exceeds selected payable scope (${formatAED(totalPayableScope)}).`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiPayVendor({
        awardingBodyId: vendor.id,
        certificateIds: selectedCertIds,
        amount: payAmtNum,
        paymentDate: paymentDate.toISOString().split("T")[0],
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        bankAccount: bankAccount.trim() || undefined,
        notes: notes.trim() || undefined,
        isVatEnabled,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to record payment.");
      }

      toast({
        title: "Payment Recorded",
        description: `Successfully paid ${formatAED(payAmtNum)} to ${vendor.name}. Remaining balance: ${formatAED(remainingAfterPayment)}.`,
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

  if (!vendor) return null;

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={`Pay Vendor: ${vendor.name}`}
      description="Select candidate certificates, enter amount to pay, and clear vendor liabilities"
      icon={Building2}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={`Submit Payment (${formatAED(payAmtNum)})`}
      maxWidth="max-w-2xl"
    >
      {/* 1. Vendor Account Overview Strip */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/20 border border-border/60 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Incurred</span>
          <p className="font-mono font-bold text-foreground text-sm">{formatAED(vendor.totalIncurred)}</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Paid To Date</span>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {formatAED(vendor.totalPaid)}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Pending To Pay</span>
          <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
            {formatAED(vendor.pendingAmount)}
          </p>
        </div>
      </div>

      {/* 2. Candidate Certificates Checklist */}
      <div className="border border-border rounded-xl p-3.5 bg-card space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              Candidate Certificates ({selectedCertIds.length}/{certs.length})
            </span>
            {selectedCertsTotal > 0 && (
              <span className="text-[11px] font-mono text-primary font-bold">
                Total: {formatAED(selectedCertsTotal)}
              </span>
            )}
          </div>
          {certs.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="h-7 text-[11px] px-2 gap-1 text-primary hover:bg-primary/10"
            >
              {selectedCertIds.length === certs.length ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" /> Select All
                </>
              )}
            </Button>
          )}
        </div>

        {certs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center italic bg-muted/10 rounded-lg">
            No unbilled certificates found. Payment will apply toward existing open bills for this vendor.
          </p>
        ) : (
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {certs.map((c) => {
              const isChecked = selectedCertIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 hover:border-primary/30 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`pay-cert-${c.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCertIds((prev) => [...prev, c.id]);
                        } else {
                          setSelectedCertIds((prev) => prev.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    <Label htmlFor={`pay-cert-${c.id}`} className="cursor-pointer font-medium flex flex-col">
                      <span className="text-foreground font-semibold">{c.participantName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        [{c.certificateNumber}] • {c.courseName} ({c.issueDate})
                      </span>
                    </Label>
                  </div>
                  <span className="font-mono font-bold text-primary">
                    AED {Number(c.fee).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* VAT Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/10">
          <div className="flex items-center gap-2">
            <Label htmlFor="payVatToggle" className="text-xs font-semibold cursor-pointer">
              Apply Standard VAT ({rawVat > 0 ? `${rawVat}%` : "5%"})
            </Label>
          </div>
          <Switch
            id="payVatToggle"
            checked={isVatEnabled}
            onCheckedChange={setIsVatEnabled}
          />
        </div>
      </div>

      {/* 3. Payment Amount & Calculation Preview */}
      <div className="border border-border/70 rounded-xl p-3 bg-muted/15 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Payment Amount (AED) *</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono font-bold">
                AED
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 2000.00"
                className="pl-12 font-mono font-bold text-sm h-9"
              />
            </div>
            {/* Quick Fill Buttons */}
            {totalPayableScope > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(totalPayableScope.toFixed(2))}
                  className="h-6 text-[10px] px-2"
                >
                  Pay Full ({formatAED(totalPayableScope)})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount((totalPayableScope / 2).toFixed(2))}
                  className="h-6 text-[10px] px-2"
                >
                  Pay 50% ({formatAED(totalPayableScope / 2)})
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Payment Date *</Label>
            <CustomCalendar
              value={paymentDate}
              onChange={(d) => d && setPaymentDate(d)}
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        <div className="p-2.5 rounded-lg bg-card border border-border/70 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground">Scope Obligations:</span>
            <span className="font-mono font-bold ml-1">{formatAED(totalPayableScope)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Pending Remaining:</span>
            <span
              className={cn(
                "font-mono font-bold",
                remainingAfterPayment <= 0.01
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {formatAED(remainingAfterPayment)}
            </span>
            {remainingAfterPayment <= 0.01 && payAmtNum > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                Fully Settled
              </span>
            ) : payAmtNum > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold">
                Partially Paid
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 4. Payment Method & Transaction Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Payment Method *</Label>
          <Select
            value={paymentMethod}
            onValueChange={(val: any) => setPaymentMethod(val)}
          >
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
          <Label className="text-xs font-semibold">Reference / Cheque #</Label>
          <Input
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="e.g. TXN-99821 or Cheque #124"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Bank Account</Label>
          <Input
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="e.g. ADCB Current or ENBD"
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Notes</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Payment for Tatweer Batch"
            className="h-9 text-xs"
          />
        </div>
      </div>
    </FormDialog>
  );
}

export default PayVendorAccountDialog;
