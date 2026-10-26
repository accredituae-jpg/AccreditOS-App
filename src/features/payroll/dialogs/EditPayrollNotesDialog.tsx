import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import type { PayrollRecord } from "../types/payroll.types";

interface EditPayrollNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PayrollRecord | null;
  onSave: (id: string, notes: string) => Promise<void>;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function EditPayrollNotesDialog({
  open,
  onOpenChange,
  record,
  onSave,
}: EditPayrollNotesDialogProps) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && record) {
      setNotes(record.notes || "");
    }
  }, [open, record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    setSaving(true);
    try {
      await onSave(record.id, notes);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Edit Payroll Notes"
      description={
        record
          ? `Notes for ${record.userName || record.user?.name || "Unknown Employee"}'s payroll - ${MONTH_NAMES[record.month - 1]} ${record.year}`
          : ""
      }
      icon={FileText}
      onSubmit={handleSubmit}
      isSubmitting={saving}
      submitLabel="Save Notes"
      maxWidth="max-w-md"
    >
      <div className="space-y-2">
        <Label htmlFor="payroll-note">Notes / Remarks</Label>
        <Textarea
          id="payroll-note"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Capture approvals, bank transfer reference, or internal employee remarks..."
          className="min-h-[100px] mt-1 bg-background"
        />
      </div>
    </FormDialog>
  );
}
export default EditPayrollNotesDialog;
