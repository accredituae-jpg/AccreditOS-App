import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  Printer,
  Receipt as ReceiptIcon,
  Stamp,
  CheckCircle2,
  FileCheck,
  Eye,
} from "lucide-react";
import { cn, formatAED } from "@/lib/utils";
import type { Receipt } from "../types/billing.types";

interface DownloadReceiptDialogProps {
  receipt: Receipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (options: { showSeal: boolean }) => void;
  onPrint?: (options: { showSeal: boolean }) => void;
  onPreview?: (receipt: Receipt) => void;
  isDownloading?: boolean;
}

export function DownloadReceiptDialog({
  receipt,
  open,
  onOpenChange,
  onDownload,
  onPrint,
  onPreview,
  isDownloading = false,
}: DownloadReceiptDialogProps) {
  const [showSeal, setShowSeal] = useState<boolean>(true);

  if (!receipt) return null;

  const clientName =
    receipt.clientSnapshot?.companyName || receipt.client || "Client";

  const handleDownload = () => {
    onDownload({ showSeal });
    onOpenChange(false);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint({ showSeal });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <ReceiptIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Download Receipt Voucher
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {receipt.receiptNumber ? `RV-${receipt.receiptNumber}` : "Draft"}{" "}
                • {formatAED(receipt.amount)} • {clientName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Section: Seal & Signature Option */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground block">
              Official Seal & Signature
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Select whether you need a ready digital copy or a blank slip for manual physical stamping & signing:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowSeal(true)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5",
                  showSeal
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-primary" />
                    With Seal
                  </span>
                  {showSeal && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Official Accredit stamp & authorized signature included.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShowSeal(false)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5",
                  !showSeal
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-xs ring-1 ring-amber-500/30"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Without Seal
                  </span>
                  {!showSeal && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Blank signature area for physical ink-stamping and pen signing.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/70 mt-2 gap-2 flex-wrap">
          <div>
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onPreview(receipt);
                }}
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground px-2.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Slip</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs gap-1.5 border-border hover:bg-muted font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 text-xs gap-1.5 bg-[#004ba0] hover:bg-[#003c80] text-white font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
