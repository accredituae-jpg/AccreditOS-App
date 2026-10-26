import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  apiGetCertificateSequence,
  apiUpdateCertificateSequence,
  apiGetInvoiceSequence,
  apiUpdateInvoiceSequence,
  apiGetReceiptSequence,
  apiUpdateReceiptSequence,
} from "@/lib/api";

export type SequenceType = "certificate" | "invoice" | "receipt";

interface UpdateSequenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequenceType?: SequenceType;
  onSuccess?: () => void;
}

export function UpdateSequenceDialog({
  open,
  onOpenChange,
  sequenceType = "certificate",
  onSuccess,
}: UpdateSequenceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSeqValue, setCurrentSeqValue] = useState<number>(0);
  const [nextSeqValue, setNextSeqValue] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getSequenceTitle = () => {
    switch (sequenceType) {
      case "invoice":
        return "Invoice Sequence Counter (Developer)";
      case "receipt":
        return "Receipt Sequence Counter (Developer)";
      case "certificate":
      default:
        return "Certificate Sequence Counter (Developer)";
    }
  };

  const getSequenceDescription = () => {
    switch (sequenceType) {
      case "invoice":
        return "Configure starting sequence number for auto-generated invoices";
      case "receipt":
        return "Configure starting sequence number for auto-generated receipts";
      case "certificate":
      default:
        return "Configure starting sequence number for auto-generated certificates";
    }
  };

  useEffect(() => {
    if (open) {
      setFeedback(null);
      setIsLoading(true);
      const fetchFn =
        sequenceType === "invoice"
          ? apiGetInvoiceSequence
          : sequenceType === "receipt"
          ? apiGetReceiptSequence
          : apiGetCertificateSequence;

      fetchFn()
        .then((res) => {
          if (res?.success && res.data) {
            setCurrentSeqValue(res.data.currentValue);
            setNextSeqValue(String(res.data.nextValue));
          }
        })
        .catch((err) => {
          console.error(`Failed to load ${sequenceType} sequence info:`, err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, sequenceType]);

  const parsedNextVal = parseInt(nextSeqValue, 10);
  const isValidNum = !isNaN(parsedNextVal) && parsedNextVal >= 1;

  const formatPreviewNumber = (val: number) => {
    switch (sequenceType) {
      case "invoice":
        return `INV-${val}`;
      case "receipt":
        return `${val}`;
      case "certificate":
      default:
        return `TCT-${val}-AC`;
    }
  };

  const previewNum = isValidNum ? formatPreviewNumber(parsedNextVal) : "---";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNum) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const updateFn =
        sequenceType === "invoice"
          ? apiUpdateInvoiceSequence
          : sequenceType === "receipt"
          ? apiUpdateReceiptSequence
          : apiUpdateCertificateSequence;

      const res = await updateFn(parsedNextVal);
      if (res?.success && res.data) {
        setFeedback({
          type: "success",
          text: `Sequence updated! Next ${sequenceType} will be generated as ${res.data.nextNumber}`,
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onOpenChange(false);
        }, 1200);
      } else {
        setFeedback({
          type: "error",
          text: (res as any)?.error || "Failed to update sequence counter.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Error updating sequence counter.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={getSequenceTitle()}
      description={getSequenceDescription()}
      icon={Settings}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Sequence Counter"
      submitDisabled={!isValidNum || isLoading}
      maxWidth="max-w-md"
    >
      <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 text-xs">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Developer Control:</strong> Changing this sequence will set the next starting number for auto-generated {sequenceType}s (e.g. setting to {sequenceType === "invoice" ? "5001" : sequenceType === "receipt" ? "1501" : "5202"} will issue {formatPreviewNumber(sequenceType === "invoice" ? 5001 : sequenceType === "receipt" ? 1501 : 5202)} next).
        </span>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <Label className="text-xs font-semibold">Current Sequence Counter</Label>
        <div className="px-3 py-2 bg-muted/50 rounded-lg border border-border text-xs flex justify-between items-center">
          <span className="text-muted-foreground">Current DB Counter Value:</span>
          <span className="font-mono font-bold text-foreground">{currentSeqValue}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold">Next Starting Number *</Label>
        <Input
          type="text"
          inputMode="numeric"
          value={nextSeqValue}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            setNextSeqValue(val);
          }}
          placeholder={sequenceType === "invoice" ? "e.g. 5001" : sequenceType === "receipt" ? "e.g. 1501" : "e.g. 5202"}
          className="font-mono text-sm font-semibold"
        />
        {isValidNum && (
          <div className="text-xs text-muted-foreground flex items-center justify-between pt-0.5">
            <span>Next Generated Preview:</span>
            <span className="font-mono font-bold text-primary">{previewNum}</span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {feedback.type === "success" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}
    </FormDialog>
  );
}
