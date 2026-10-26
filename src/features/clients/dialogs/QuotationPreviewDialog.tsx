import { useState } from "react";
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
import {
  Download,
  FileText,
  Share2,
  Check,
  Printer,
  Calendar,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QuotationHeaderImg from "@/assets/QuotationHeader.png";
import FooterImg from "@/assets/Footer.png";
import SealImg from "@/assets/Seal.webp";
import SignatureImg from "@/assets/Signature.webp";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  printElement,
  formatDateDDMMYYYY,
} from "@/features/billing/utils/billing.utils";
import type { Quotation } from "../types/quotation.types";

interface QuotationPreviewDialogProps {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { amountToWords } from "@/features/billing/utils/billing.utils";

export function QuotationPreviewDialog({
  quotation,
  open,
  onOpenChange,
}: QuotationPreviewDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!quotation) return null;

  const isAllText =
    quotation.items.length > 0 &&
    quotation.items.every(
      (item) => item.rateType === "text" || Boolean(item.rateText),
    );
  const hasTextItems = quotation.items.some(
    (item) => item.rateType === "text" || Boolean(item.rateText),
  );
  const commonText =
    quotation.pricingSummaryText ||
    quotation.items.find((i) => i.rateText)?.rateText ||
    "Upon Request";

  const generatePDFBlob = async (): Promise<Blob | null> => {
    const printContent = document.getElementById("quotation-print-area");
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

      const sanitizedName = (quotation.companyName || "Client").replace(
        /[\/\\]/g,
        "-",
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Quotation - ${sanitizedName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Successful",
        description: `Quotation for ${quotation.companyName} has been downloaded as PDF.`,
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

      const sanitizedName = (quotation.companyName || "Client").replace(
        /[\/\\]/g,
        "-",
      );
      const pdfFile = new File([blob], `Quotation - ${sanitizedName}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Quotation Proposal - ${quotation.companyName}`,
          text: `Please find attached Quotation Proposal for ${quotation.companyName}.`,
        });
        toast({
          title: "Shared Successfully",
          description: "The PDF file has been shared.",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Quotation - ${sanitizedName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const itemsText = quotation.items
          .map((item) => {
            const isText = item.rateType === "text" || Boolean(item.rateText);
            const price = isText
              ? item.rateText || "Upon Request"
              : `AED ${(item.totalAmount || item.qty * item.ratePerUnit).toFixed(2)}`;
            return `• ${item.trainingName} (Qty: ${item.qty}) - ${price}`;
          })
          .join("\n");

        const shareText = `*QUOTATION PROPOSAL*
Date: ${quotation.date}
Client: ${quotation.companyName}
Subject: ${quotation.subject}

*TRAINING SCOPE:*
${itemsText}

${
  quotation.discountAmount && quotation.discountAmount > 0
    ? `*SUBTOTAL:* AED ${quotation.subtotal.toFixed(2)}\n*DISCOUNT:* -AED ${quotation.discountAmount.toFixed(2)}${quotation.discountType === "percentage" && quotation.discountRate ? ` (${quotation.discountRate}%)` : ""}\n*VAT (${quotation.vatRate}%):* AED ${quotation.vatAmount.toFixed(2)}\n`
    : ""
}*TOTAL AMOUNT:* ${
          isAllText
            ? "Upon Request"
            : `AED ${quotation.totalAmount.toFixed(2)}${hasTextItems ? " (plus Upon Request items)" : ""}`
        }${quotation.paymentTerms ? `\n\n*PAYMENT TERMS:* ${quotation.paymentTerms}` : ""}`;

        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        toast({
          title: "PDF Downloaded & Details Copied",
          description:
            "Native file sharing not supported on this browser. The PDF was downloaded and proposal details were copied to clipboard.",
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
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl p-0 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-muted/50 p-3 sm:p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <DialogTitle className="font-semibold text-xs sm:text-sm truncate">
              Quotation Preview - {quotation.companyName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Quotation preview for {quotation.companyName}
            </DialogDescription>
          </div>

          <div className="flex items-center gap-1.5 pr-10 sm:pr-14 shrink-0">
            <TooltipProvider delayDuration={200}>
              {/* Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSharePDF}
                      disabled={isSharing || isDownloading}
                      className="h-8 w-8"
                    >
                      {isSharing ? (
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                      ) : copied ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Share PDF</TooltipContent>
              </Tooltip>

              {/* Print */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => printElement("quotation-print-area")}
                      className="h-8 w-8"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Print</TooltipContent>
              </Tooltip>

              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="icon"
                      onClick={handleDownloadPDF}
                      disabled={isSharing || isDownloading}
                      className="h-8 w-8 bg-[#0f4c81] hover:bg-[#0b3c66]"
                    >
                      {isDownloading ? (
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Download PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-6 flex justify-start sm:justify-center items-start">
          <div
            id="quotation-print-area"
            className="bg-white shadow-md w-[800px] min-w-[800px] max-w-[800px] p-8 border border-slate-200 rounded-none relative text-left text-slate-800 flex flex-col justify-between shrink-0"
            style={{
              minHeight: "1131px",
              height: "1131px",
              fontSize: "11px",
              fontFamily: "Outfit, system-ui, sans-serif",
            }}
          >
            {/* Top Document Content */}
            <div className="flex-1 flex flex-col">
              {/* Header Image */}
              <div className="mb-5 -mx-[32px] -mt-[32px] overflow-hidden">
                <img
                  src={QuotationHeaderImg}
                  alt="Accredit Quotation Header"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Client Info & Proposal Summary Layout */}
              <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Quotation To Box */}
                <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 pb-4 flex flex-col justify-start">
                  <div className="border-b border-sky-200/70 pb-1 mb-2">
                    <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-[#0f4c81] uppercase">
                      <Building2 className="w-3.5 h-3.5 text-[#0f4c81] shrink-0" />
                      <span>Quotation Issued To</span>
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-[11px] leading-normal">
                    <div className="flex items-baseline">
                      <span className="w-20 text-slate-500 font-medium shrink-0">
                        M/s.
                      </span>
                      <span className="flex-1 font-bold text-slate-950 text-[11px] leading-snug">
                        {quotation.companyName}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-20 text-slate-500 font-medium shrink-0">
                        Contact No:
                      </span>
                      <span className="flex-1 text-slate-900 font-semibold leading-normal">
                        {quotation.contactNo || "—"}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="w-20 text-slate-500 font-medium shrink-0">
                        Email:
                      </span>
                      <span className="flex-1 text-slate-900 font-semibold leading-normal text-[10.5px] break-all">
                        {quotation.email || "—"}
                      </span>
                    </div>
                    {quotation.location && (
                      <div className="flex items-baseline">
                        <span className="w-20 text-slate-500 font-medium shrink-0">
                          Location:
                        </span>
                        <span className="flex-1 text-slate-900 font-semibold leading-normal text-[10.5px]">
                          {quotation.location}
                        </span>
                      </div>
                    )}
                    {quotation.trnNo && (
                      <div className="flex items-baseline">
                        <span className="w-20 text-slate-500 font-medium shrink-0">
                          TRN No:
                        </span>
                        <span className="flex-1 text-slate-900 font-semibold font-mono leading-normal text-[10.5px]">
                          {quotation.trnNo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposal Info Box */}
                <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 pb-4 flex flex-col justify-start">
                  <div className="border-b border-sky-200/70 pb-1 mb-2">
                    <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-[#0f4c81] uppercase">
                      <Calendar className="w-3.5 h-3.5 text-[#0f4c81] shrink-0" />
                      <span>Proposal Information</span>
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-[11px] leading-normal">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 font-medium">Date:</span>
                      <span className="font-bold text-slate-950">
                        {formatDateDDMMYYYY(quotation.date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 font-medium">
                        Validity Period:
                      </span>
                      <span className="font-bold text-slate-950">
                        30 Days from Date of Issue
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 font-medium">
                        Accredit TRN:
                      </span>
                      <span className="font-bold text-slate-950 font-mono">
                        104864147400003
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Callout & Intro Paragraph */}
              <div className="mb-5">
                <div className="bg-amber-50/80 border-l-4 border-amber-500 border-y border-r border-amber-200/80 px-4 py-2.5 rounded-r-xl mb-3 flex items-center gap-2">
                  <span className="text-amber-800 font-black uppercase text-[10.5px] shrink-0">
                    SUBJECT:
                  </span>
                  <span className="font-bold text-slate-950 text-[11.5px]">
                    {quotation.subject}
                  </span>
                </div>

                <div className="text-[11px] text-slate-700 space-y-1 leading-relaxed">
                  <p className="font-bold text-slate-950">
                    Dear Valued Client,
                  </p>
                  <p>
                    Thank you for your inquiry. Accredit Management Consultancy
                    SPC is pleased to present our commercial quotation for the
                    specialized training services detailed below:
                  </p>
                </div>
              </div>

              {/* Redesigned Pricing Schedule Table */}
              <div className="border border-sky-200/90 rounded-xl overflow-hidden mb-3.5 bg-white shadow-2xs">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-[#0f4c81] text-white font-bold">
                      <th className="py-1.5 px-2.5 text-center w-12 uppercase tracking-wider text-[9.5px]">
                        S.NO
                      </th>
                      <th className="py-1.5 px-2.5 text-left uppercase tracking-wider text-[9.5px]">
                        <span>TRAINING PROGRAM</span>
                        <span className="block text-[8px] font-normal normal-case tracking-normal text-sky-100/90 leading-tight">
                          Safety Consultancy Services
                        </span>
                      </th>
                      <th className="py-1.5 px-2.5 text-center w-28 uppercase tracking-wider text-[9.5px]">
                        QTY / DELEGATES
                      </th>
                      <th className="py-1.5 px-2.5 text-right w-28 uppercase tracking-wider text-[9.5px]">
                        RATE / UNIT
                      </th>
                      <th className="py-1.5 px-2.5 pr-3 text-right w-32 uppercase tracking-wider text-[9.5px]">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotation.items.map((item, index) => {
                      const isUponRequest =
                        item.rateType === "text" || Boolean(item.rateText);
                      const rateDisplay = isUponRequest
                        ? "Upon Request"
                        : (item.ratePerUnit || 0).toFixed(2);
                      const totalDisplay = isUponRequest
                        ? "—"
                        : (
                            item.totalAmount ||
                            item.qty * item.ratePerUnit ||
                            0
                          ).toFixed(2);

                      return (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }
                        >
                          <td className="py-1.5 px-2.5 text-center font-bold text-slate-500">
                            {item.sNo || index + 1}
                          </td>
                          <td
                            className="py-1.5 px-2.5 text-left font-semibold text-slate-900 max-w-0 truncate"
                            style={{
                              maxWidth: "330px",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.trainingName}
                          </td>
                          <td className="py-1.5 px-2.5 text-center font-medium text-slate-700">
                            {item.qty}
                          </td>
                          <td
                            className={`py-1.5 px-2.5 text-right ${
                              isUponRequest
                                ? "font-bold text-sky-800 italic text-[9.5px]"
                                : "font-medium text-slate-700"
                            }`}
                          >
                            {rateDisplay}
                          </td>
                          <td
                            className={`py-1.5 px-2.5 pr-3 text-right ${
                              isUponRequest
                                ? "text-slate-400 font-bold"
                                : "font-bold text-slate-950"
                            }`}
                          >
                            {totalDisplay}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Redesigned Amount in Words & Financial Breakdown Layout */}
              <div className="grid grid-cols-5 gap-4 mb-3 items-stretch">
                {/* Amount in Words Box - Compact */}
                <div className="col-span-3 border-l-2 border-sky-600 bg-sky-50/50 border-y border-r border-sky-100 rounded-r-lg px-2.5 py-1.5 flex flex-col justify-center shadow-2xs">
                  <span className="text-[8px] font-black text-sky-800 uppercase tracking-wider block mb-0.5">
                    TOTAL INVESTMENT IN WORDS
                  </span>
                  <p className="text-[9.5px] font-semibold italic text-slate-900 leading-snug m-0">
                    {quotation.amountInWords ||
                      (isAllText
                        ? "Upon Request — Subject to final confirmation"
                        : `${amountToWords(quotation.totalAmount)}${hasTextItems ? " (plus Upon Request items)" : ""}`)}
                  </p>
                </div>

                {/* Financial Breakdown Card */}
                <div className="col-span-2 border border-sky-200/90 rounded-lg overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
                  <div className="px-2.5 py-1.5 space-y-0.5 text-[9.5px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-bold text-slate-900">
                        {isAllText
                          ? "Upon Request"
                          : `${quotation.subtotal.toFixed(2)} AED`}
                      </span>
                    </div>
                    {Boolean(
                      quotation.discountAmount && quotation.discountAmount > 0,
                    ) && (
                      <div className="flex justify-between items-center text-emerald-700">
                        <span className="font-medium">
                          Discount{" "}
                          {quotation.discountType === "percentage" &&
                          quotation.discountRate
                            ? `(${quotation.discountRate}%)`
                            : ""}
                          :
                        </span>
                        <span className="font-bold">
                          -{quotation.discountAmount?.toFixed(2)} AED
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">
                        VAT ({quotation.vatRate}%):
                      </span>
                      <span className="font-bold text-slate-900">
                        {isAllText
                          ? "Applicable"
                          : `${quotation.vatAmount.toFixed(2)} AED`}
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#0f4c81] text-white px-2.5 py-1.5 flex justify-between items-center font-bold text-[10px] tracking-wide">
                    <span className="uppercase text-slate-200 text-[9px]">
                      NET INVESTMENT:
                    </span>
                    <span className="text-[12px] font-black text-white">
                      {isAllText
                        ? "Upon Request"
                        : `AED ${quotation.totalAmount.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Authorized Signatory / Seal & Signature Section */}
            <div className="flex justify-between items-end mb-2 px-1 gap-4">
              <div className="max-w-[460px] space-y-1 pb-0.5">
                {quotation.paymentTerms && (
                  <div className="bg-slate-50/90 border-l-2 border-[#0f4c81] border-y border-r border-slate-200/80 rounded-r-md px-2.5 py-1.5 shadow-2xs">
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#0f4c81] block mb-0.5">
                      Terms of Payment
                    </span>
                    <p className="text-[9.5px] font-semibold text-slate-800 leading-snug m-0">
                      {quotation.paymentTerms}
                    </p>
                  </div>
                )}
                <p className="m-0 text-slate-500 italic text-[8.5px]">
                  • Official quotation valid for 30 days from date of issue.
                </p>
              </div>

              {/* Combined Stamp & Signature Container */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-44 h-14 flex items-center justify-center">
                  {/* Official Seal Stamp - layered on left */}
                  <img
                    src={SealImg}
                    alt="Accredit Official Seal"
                    className="absolute -left-1 w-14 h-14 object-contain pointer-events-none drop-shadow-xs opacity-95"
                  />
                  {/* Authorized Signature - layered on top */}
                  <img
                    src={SignatureImg}
                    alt="Authorized Signature"
                    className="relative z-10 w-24 h-auto object-contain"
                  />
                </div>
                <div className="border-t border-slate-400 w-44 pt-1 text-center">
                  <span className="text-[9.5px] font-bold text-slate-900 uppercase tracking-wider block">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Section */}
            <div>
              <div className="-mx-[32px] -mb-[32px] overflow-hidden flex items-center justify-center">
                <img
                  src={FooterImg}
                  alt="Accredit Quotation Footer"
                  className="w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
