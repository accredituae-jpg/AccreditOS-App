import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  type?: "confirm" | "warning" | "success" | "info" | "destructive";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  requireVerificationText?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  type = "confirm",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  requireVerificationText,
}: ConfirmationDialogProps) {
  const [verificationInput, setVerificationInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setVerificationInput("");
      setIsSubmitting(false);
    }
  }, [open]);
  const iconConfig = {
    confirm: {
      icon: <HelpCircle className="w-5 h-5 text-primary" />,
      bg: "bg-primary/10",
      btnVariant: "default" as const,
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
      bg: "bg-warning/10",
      btnVariant: "default" as const,
    },
    destructive: {
      icon: <AlertTriangle className="w-5 h-5 text-destructive" />,
      bg: "bg-destructive/10",
      btnVariant: "destructive" as const,
    },
    success: {
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      bg: "bg-success/10",
      btnVariant: "default" as const,
    },
    info: {
      icon: <Info className="w-5 h-5 text-info" />,
      bg: "bg-info/10",
      btnVariant: "default" as const,
    },
  };

  const config = iconConfig[type] || iconConfig.confirm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-muted/50 p-5 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
            {config.icon}
          </div>
          <DialogHeader className="p-0">
            <DialogTitle className="text-base font-semibold pr-8 leading-tight">{title}</DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {description}
        </div>

        {requireVerificationText && (
          <div className="px-5 pb-5 space-y-2">
            <Label htmlFor="verification-input" className="text-xs font-semibold text-foreground">
              To confirm, type <span className="font-bold select-all text-destructive">{requireVerificationText}</span> below:
            </Label>
            <Input
              id="verification-input"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              placeholder={`Type ${requireVerificationText}`}
              className="h-9 rounded-lg bg-background border-border/70"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/20 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg h-9 px-4"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={config.btnVariant}
            size="sm"
            className={cn(
              "rounded-lg h-9 px-4 min-w-[85px] flex items-center justify-center gap-1.5",
              type === "warning" && "bg-warning hover:bg-warning/90 text-warning-foreground"
            )}
            disabled={isSubmitting || (!!requireVerificationText && verificationInput !== requireVerificationText)}
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } catch (err) {
                console.error("Confirmation error:", err);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
