import { useEffect, useState } from "react";
import { formatAED } from "@/lib/utils";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import type { PayrollRecord } from "../types/payroll.types";

interface RecordPayrollPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PayrollRecord | null;
  onPay: (
    record: PayrollRecord,
    paymentReference: string,
    paymentDate: string,
    notes: string,
  ) => Promise<boolean>;
}

function formatLocalDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function RecordPayrollPaymentDialog({
  open,
  onOpenChange,
  record,
  onPay,
}: RecordPayrollPaymentDialogProps) {
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && record) {
      setPaymentDate(new Date());
      setPaymentReference(record.paymentReference || "");
      setNotes(record.notes || "");
    }
  }, [open, record]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!record) return;

    setSubmitting(true);
    try {
      const saved = await onPay(record, paymentReference.trim(), formatLocalDate(paymentDate), notes);
      if (saved) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const employeeName = record?.userName || record?.user?.name || "this employee";

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Record Payroll Payment"
      description={
        record
          ? `Confirm ${formatAED(record.netSalary, true)} paid to ${employeeName}. This will mark the payroll paid and create its expense record.`
          : ""
      }
      icon={DollarSign}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel="Mark as Paid"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Actual payment date *</Label>
          <CustomCalendar
            value={paymentDate}
            onChange={setPaymentDate}
            placeholder="Select payment date"
          />
          <p className="text-xs text-muted-foreground">
            This is the date the employee received the money, not the date you enter it in the system.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="payroll-payment-reference">Payment reference or receipt link</Label>
          <Input
            id="payroll-payment-reference"
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder="Bank reference or https:// link to the receipt"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="payroll-payment-notes">Notes</Label>
          <Textarea
            id="payroll-payment-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional payment notes or receipt link"
            className="min-h-[90px] bg-background"
          />
        </div>
      </div>
    </FormDialog>
  );
}
