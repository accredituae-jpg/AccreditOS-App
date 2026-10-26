import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { FileText } from "lucide-react";

interface InvoiceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  buttonText: string;
  value: string;
  onValueChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
}

export function InvoiceTypeDialog({
  open,
  onOpenChange,
  title,
  buttonText,
  value,
  onValueChange,
  onSubmit,
}: InvoiceTypeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } catch (err) {
      console.error("Error submitting invoice classification form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={title}
      description="Manage tax invoice classifications"
      icon={FileText}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={buttonText}
      maxWidth="max-w-md"
    >
      <div className="space-y-2">
        <Label htmlFor="editInvoiceTypeName" className="text-xs font-semibold">Classification Name *</Label>
        <Input
          id="editInvoiceTypeName"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="e.g. Consulting Services"
          required
          autoFocus
          className="h-10 text-sm"
        />
      </div>
    </FormDialog>
  );
}
export default InvoiceTypeDialog;
