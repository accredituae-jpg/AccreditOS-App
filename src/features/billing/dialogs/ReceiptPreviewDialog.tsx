import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  FileText,
  Stamp,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { printElement } from "../utils/billing.utils";
import type { Receipt } from "../types/billing.types";
import { ReceiptPrintTemplate } from "../components/ReceiptPrintTemplate";

interface ReceiptPreviewDialogProps {
  receipt: Receipt | null;
  onClose: () => void;
  onVoidClick?: (receipt: Receipt) => void;
  canVoid?: boolean;
}

export function ReceiptPreviewDialog({
  receipt,
  onClose,
  onVoidClick,
  canVoid = false,
}: ReceiptPreviewDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showSeal, setShowSeal] = useState(true);
  const { toast } = useToast();

  if (!receipt) return null;

  const handlePrint = () => {
    printElement("receipt-voucher-print-area");
  };

  const handleDownloadPDF = async () => {
    const printContent = document.getElementById("receipt-voucher-print-area");
    if (!printContent) return;

    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(printContent, {
        scale: 3.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "SLOW",
      );
      const sealSuffix = showSeal ? "" : "-without-seal";
      pdf.save(
        `receipt-voucher-${receipt.receiptNumber || "draft"}${sealSuffix}.pdf`,
      );
      toast({
        title: "Download Successful",
        description: `Receipt voucher downloaded successfully${showSeal ? "" : " (without seal)"}.`,
      });
    } catch (err) {
      console.error("PDF Generation failed:", err);
      toast({
        title: "Download Failed",
        description: "Failed to generate receipt PDF.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={!!receipt} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[92vh] overflow-y-auto p-3.5 sm:p-6">
        <div className="border-b pb-3 no-print">
          <div className="flex justify-between items-center pr-8 flex-wrap gap-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <DialogTitle className="text-base sm:text-lg font-bold">
                Receipt Voucher #{receipt.receiptNumber || "DRAFT"}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Prominent Stamp & Seal Toggle */}
              <div className="flex items-center bg-muted/60 border border-border/80 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSeal(true)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                    showSeal
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="With Digital Seal & Signature"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>With Seal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSeal(false)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                    !showSeal
                      ? "bg-amber-500 text-white font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Without Seal (Blank space for physical ink stamping and signing)"
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>Without Seal</span>
                  {!showSeal && (
                    <span className="text-[10px] bg-white/20 px-1 rounded font-mono">Hard Copy</span>
                  )}
                </button>
              </div>

              {/* Print Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs font-medium border-border hover:bg-muted"
                title={showSeal ? "Print with digital seal" : "Print without seal for physical signing"}
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                <span>Print</span>
              </Button>

              {/* Primary Download Button */}
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold bg-[#004ba0] hover:bg-[#003c80] text-white"
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                title={showSeal ? "Download PDF with Seal" : "Download PDF without Seal (for physical hard copy)"}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{generatingPdf ? "Generating..." : "Download PDF"}</span>
              </Button>

              {canVoid && receipt.status === "issued" && onVoidClick && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onVoidClick(receipt)}
                  className="h-8 font-semibold text-xs"
                >
                  Void Voucher
                </Button>
              )}
            </div>
          </div>

          {!showSeal && (
            <div className="mt-2 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Stamp className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Physical Hard Copy Mode:</strong> Digital seal and signature are hidden so you can manually ink-stamp and hand-sign the printed voucher.
              </span>
            </div>
          )}
        </div>

        <div className="py-4 overflow-x-auto flex justify-start sm:justify-center items-start p-2 sm:p-4">
          <ReceiptPrintTemplate
            ref={containerRef}
            id="receipt-voucher-print-area"
            receipt={receipt}
            showSeal={showSeal}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default ReceiptPreviewDialog;
