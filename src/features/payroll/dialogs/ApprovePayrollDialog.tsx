import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Label } from "@/components/ui/label";
import type { PayrollRecord } from "../types/payroll.types";

interface ApprovePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PayrollRecord | null;
  onApprove: (record: PayrollRecord, scheduledPaymentDate: string) => Promise<boolean>;
}

function formatLocalDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function ApprovePayrollDialog({
  open,
  onOpenChange,
  record,
  onApprove,
}: ApprovePayrollDialogProps) {
  const [scheduledPaymentDate, setScheduledPaymentDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const savedDate = record?.scheduledPaymentDate
        ? new Date(`${record.scheduledPaymentDate.slice(0, 10)}T12:00:00`)
        : new Date();
      setScheduledPaymentDate(savedDate);
    }
  }, [open, record]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!record) return;

    setSubmitting(true);
    try {
      const approved = await onApprove(record, formatLocalDate(scheduledPaymentDate));
      if (approved) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const employeeName = record?.userName || record?.user?.name || "this employee";

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Approve Payroll"
      description={`Set the planned payment date for ${employeeName}. The actual date paid will be recorded separately when payment is made.`}
      icon={CheckCircle2}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel="Approve Payroll"
      maxWidth="max-w-md"
    >
      <div className="space-y-2">
        <Label>Planned payment date *</Label>
        <CustomCalendar
          value={scheduledPaymentDate}
          onChange={setScheduledPaymentDate}
          placeholder="Select planned payment date"
        />
      </div>
    </FormDialog>
  );
}
