import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Download,
  FileText,
  Eye,
  Share2,
  Check,
  Users,
  Calendar,
  Printer,
  Award,
  ListFilter,
  GraduationCap,
  Stamp,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatAED, cn } from "@/lib/utils";
import type { Invoice } from "../types/billing.types";
import { InvoicePrintTemplate } from "../components/InvoicePrintTemplate";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  getInvoiceItems,
  getInvoiceClientDisplayName,
  printElement,
  formatContact,
  formatDateDDMMYYYY,
  type InvoiceItemGrouping,
} from "../utils/billing.utils";
import { COMPANY_BANK_DETAILS } from "@/config/companyDetails";

interface InvoicePreviewDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { amountToWords } from "../utils/billing.utils";

export function InvoicePreviewDialog({
  invoice,
  open,
  onOpenChange,
}: InvoicePreviewDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showAwardingBody, setShowAwardingBody] = useState(false);
  const [showSeal, setShowSeal] = useState(true);
  const [groupingMode, setGroupingMode] =
    useState<InvoiceItemGrouping>("itemized");

  // Sync saved grouping preference from invoice notes or terms if available
  useEffect(() => {
    if (
      invoice?.notes?.includes("[format:course]") ||
      invoice?.terms?.includes("[format:course]")
    ) {
      setGroupingMode("course");
    } else if (
      invoice?.notes?.includes("[format:participant]") ||
      invoice?.terms?.includes("[format:participant]")
    ) {
      setGroupingMode("participant");
    } else {
      setGroupingMode("itemized");
    }
  }, [invoice]);

  const items = useMemo(() => {
    return invoice
      ? getInvoiceItems(invoice, { showAwardingBody, groupBy: groupingMode })
      : [];
  }, [invoice, showAwardingBody, groupingMode]);

  const clientDisplayName = useMemo(() => {
    return invoice ? getInvoiceClientDisplayName(invoice) : "";
  }, [invoice]);

  const clientFirstName = useMemo(() => {
    if (!clientDisplayName) return "";
    const clean = clientDisplayName.replace(/[<>:"/\\|?*]/g, "").trim();
    if (!clean) return "";
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    if (
      (words[0].toLowerCase() === "al" || words[0].toLowerCase() === "el") &&
      words.length > 1
    ) {
      return `${words[0]} ${words[1]}`;
    }
    return words[0];
  }, [clientDisplayName]);

  const pdfFileName = useMemo(() => {
    if (!invoice?.invoiceNumber) return "Tax Invoice.pdf";
    const sealSuffix = showSeal ? "" : " (Without Seal)";
    return clientFirstName
      ? `Tax Invoice -${clientFirstName}- ${invoice.invoiceNumber}${sealSuffix}.pdf`
      : `Tax Invoice - ${invoice.invoiceNumber}${sealSuffix}.pdf`;
  }, [invoice?.invoiceNumber, clientFirstName, showSeal]);

  const pdfTitle = useMemo(() => {
    if (!invoice?.invoiceNumber) return "Tax Invoice";
    const sealSuffix = showSeal ? "" : " (Without Seal)";
    return clientFirstName
      ? `Tax Invoice -${clientFirstName}- ${invoice.invoiceNumber}${sealSuffix}`
      : `Tax Invoice - ${invoice.invoiceNumber}${sealSuffix}`;
  }, [invoice?.invoiceNumber, clientFirstName, showSeal]);

  if (!invoice) return null;

  const generatePDFBlob = async (): Promise<Blob | null> => {
    const printContent = document.getElementById("invoice-print-area");
    if (!printContent) return null;

    const originalStyle = printContent.getAttribute("style") || "";

    printContent.style.width = "800px";
    printContent.style.minWidth = "800px";
    printContent.style.maxWidth = "800px";
    printContent.style.height = "1131px";
    printContent.style.minHeight = "1131px";
    printContent.style.maxHeight = "1131px";
    printContent.style.boxShadow = "none";

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

      const pdfWidth = 210;
      const pdfHeight = 297;
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
      return pdf.output("blob");
    } finally {
      printContent.setAttribute("style", originalStyle);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await generatePDFBlob();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Successful",
        description: `Invoice ${invoice.invoiceNumber} downloaded as ${pdfFileName}.`,
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "An error occurred while generating the PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePDF = async () => {
    setIsSharing(true);
    try {
      const blob = await generatePDFBlob();
      if (!blob) return;

      const pdfFile = new File([blob], pdfFileName, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: pdfTitle,
          text: `Please find attached ${pdfTitle} for ${clientDisplayName}.`,
        });
        toast({
          title: "Shared Successfully",
          description: "The PDF file has been shared.",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = pdfFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const itemsText = items
          .map(
            (item) =>
              `• ${item.description} (Qty: ${item.qty}) - AED ${item.totalAmount.toFixed(2)}`,
          )
          .join("\n");

        const shareText = `*TAX INVOICE: ${invoice.invoiceNumber}*
Date: ${invoice.date}
Client: ${clientDisplayName}
TRN No: ${invoice.trnNo || "—"}

*SUMMARY OF SERVICES:*
${itemsText}

*TOTAL AMOUNT:* AED ${invoice.totalAmount.toFixed(2)}

*PAYMENT BANK DETAILS:*
Account Name: ${COMPANY_BANK_DETAILS.accountName}
Bank: ${COMPANY_BANK_DETAILS.bankName}
SWIFT Code: ${COMPANY_BANK_DETAILS.swiftCode}
Account No: ${COMPANY_BANK_DETAILS.accountNumber}
IBAN: ${COMPANY_BANK_DETAILS.ibanFormatted}
Branch: ${COMPANY_BANK_DETAILS.branch}`;

        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        toast({
          title: "PDF Downloaded & Details Copied",
          description:
            "Native file sharing not supported on this browser. The PDF was downloaded and summary details were copied to clipboard instead.",
        });
      }
    } catch (error) {
      console.error("PDF share error:", error);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "An error occurred while generating or sharing the PDF.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Row: Clean Title + Primary Actions */}
        <div className="bg-background px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="font-semibold text-sm sm:text-base leading-tight truncate">
                  Tax Invoice #{invoice.invoiceNumber}
                </DialogTitle>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    invoice.status === "paid" &&
                      "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                    invoice.status === "issued" &&
                      "bg-blue-500/10 text-blue-600 border border-blue-500/20",
                    invoice.status === "partially_paid" &&
                      "bg-amber-500/10 text-amber-600 border border-amber-500/20",
                    invoice.status === "cancelled" &&
                      "bg-rose-500/10 text-rose-600 border border-rose-500/20",
                    invoice.status === "draft" &&
                      "bg-muted text-muted-foreground border border-border",
                  )}
                >
                  {invoice.status?.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {clientDisplayName} {invoice.date ? `• ${invoice.date}` : ""}
              </p>
              <DialogDescription className="sr-only">
                Tax invoice preview for {clientDisplayName} -{" "}
                {invoice.invoiceNumber}
              </DialogDescription>
            </div>
          </div>

          {/* Action Buttons (Right-aligned, leaves plenty of room for Dialog Close 'X') */}
          <div className="flex items-center gap-2 shrink-0 pr-8">
            {/* Quick Primary Download Button */}
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={
                invoice.status === "draft" || isSharing || isDownloading
              }
              className="h-8 gap-1.5 text-xs font-semibold bg-[#004ba0] hover:bg-[#003c80] text-white shadow-xs"
            >
              {isDownloading ? (
                <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PDF</span>
            </Button>

            {/* Actions & Document Options Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 mr-1 text-xs font-medium border-border",
                    !showSeal &&
                      "border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  )}
                  title="Document actions & print options"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Options</span>
                  {!showSeal && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0 shadow-2xl z-50 overflow-hidden rounded-xl border border-border"
              >
                {/* Popover Header */}
                <div className="bg-muted/50 px-4 py-3 border-b border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-foreground">
                      Document Actions & Format
                    </span>
                  </div>
                  {!showSeal && (
                    <span className="text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Physical Stamping
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Section 1: Output Actions */}
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Actions
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Print Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printElement("invoice-print-area")}
                        disabled={invoice.status === "draft"}
                        className="h-9 justify-center gap-2 text-xs font-medium bg-background hover:bg-muted/60"
                      >
                        <Printer className="w-4 h-4 text-primary" />
                        <span>Print Invoice</span>
                      </Button>

                      {/* Share Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSharePDF}
                        disabled={
                          invoice.status === "draft" ||
                          isSharing ||
                          isDownloading
                        }
                        className="h-9 justify-center gap-2 text-xs font-medium bg-background hover:bg-muted/60"
                      >
                        {isSharing ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                        ) : copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">
                              Copied!
                            </span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 text-primary" />
                            <span>Share</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Section 2: Seal & Signature */}
                  <div className="pt-3 border-t border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-primary" />
                        <Label
                          htmlFor="popover-seal-toggle"
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Company Stamp & Seal
                        </Label>
                      </div>
                      <Switch
                        id="popover-seal-toggle"
                        checked={showSeal}
                        onCheckedChange={setShowSeal}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {showSeal
                        ? "Digital seal & signature will appear on printed and downloaded copies."
                        : "Digital seal hidden so you can manually ink-stamp and physically sign the invoice."}
                    </p>
                  </div>

                  {/* Section 3: Awarding Body Toggle */}
                  <div className="pt-3 border-t border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        <Label
                          htmlFor="popover-awarding-toggle"
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Awarding Body in Items
                        </Label>
                      </div>
                      <Switch
                        id="popover-awarding-toggle"
                        checked={showAwardingBody}
                        onCheckedChange={setShowAwardingBody}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Include awarding body name (e.g. NSC, HABC) in the
                      description column.
                    </p>
                  </div>

                  {/* Section 4: Grouping / Layout Format */}
                  {invoice.lineItems && invoice.lineItems.length > 1 && (
                    <div className="pt-3 border-t border-border/70 space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Table Grouping Format
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGroupingMode("itemized")}
                          className={cn(
                            "px-2 py-2 rounded-lg text-[11px] font-medium border text-center transition-all flex flex-col items-center gap-1",
                            groupingMode === "itemized"
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                              : "bg-background border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                          )}
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          <span>Itemized</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupingMode("course")}
                          className={cn(
                            "px-2 py-2 rounded-lg text-[11px] font-medium border text-center transition-all flex flex-col items-center gap-1",
                            groupingMode === "course"
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                              : "bg-background border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                          )}
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>By Course</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGroupingMode("participant")}
                          className={cn(
                            "px-2 py-2 rounded-lg text-[11px] font-medium border text-center transition-all flex flex-col items-center gap-1",
                            groupingMode === "participant"
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                              : "bg-background border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                          )}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>By Person</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-6 flex justify-start sm:justify-center items-start">
          <InvoicePrintTemplate
            invoice={invoice}
            id="invoice-print-area"
            showAwardingBody={showAwardingBody}
            groupBy={groupingMode}
            showSeal={showSeal}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
