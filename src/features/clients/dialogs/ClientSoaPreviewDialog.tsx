import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  Share2,
  Calendar,
  Users,
  Award,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ClientSoaData } from "../types/soa.types";
import SoaHeaderImg from "@/assets/SoaHeader.png";

import FooterImg from "@/assets/Footer.png";
import SealImg from "@/assets/Seal.webp";
import SignatureImg from "@/assets/Signature.webp";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  printElement,
  amountToWords,
  formatContact,
} from "@/features/billing/utils/billing.utils";
import { COMPANY_BANK_DETAILS } from "@/config/companyDetails";
import { openWhatsApp } from "@/lib/whatsapp";

interface ClientSoaPreviewDialogProps {
  soaData: ClientSoaData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientSoaPreviewDialog({
  soaData,
  open,
  onOpenChange,
}: ClientSoaPreviewDialogProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!soaData) return null;

  const { client, summary, invoices, statementDate, period } = soaData;

  // Clean contact person string (guarantees NO raw JSON)
  const cleanContactPerson = formatContact(client.contactPerson);

  const generatePDFBlob = async (): Promise<Blob | null> => {
    const printContent = document.getElementById("client-soa-print-area");
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
    try {
      setIsDownloading(true);
      const blob = await generatePDFBlob();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sanitizedName = client.companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `SOA_${sanitizedName}_${statementDate.replace(/\//g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Statement Downloaded",
        description:
          "Official Statement of Account PDF downloaded successfully.",
      });
    } catch (error) {
      console.error("SOA PDF error:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "An error occurred while generating the Statement PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsApp = (e?: React.MouseEvent) => {
    if (!client.phone) {
      toast({
        variant: "destructive",
        title: "No Phone Number",
        description: "Client does not have a registered phone number.",
      });
      return;
    }
    const message = `Hello ${cleanContactPerson !== "—" ? cleanContactPerson : client.companyName},\n\nThis is a payment reminder from Accredit Management Consultancy.\n\nYou have *${invoices.length} pending invoice(s)* with an outstanding balance of *AED ${summary.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}*.\n\nPlease process payment to our bank account:\n• Bank: ${COMPANY_BANK_DETAILS.bankName}\n• IBAN: ${COMPANY_BANK_DETAILS.ibanFormatted}\n\nKindly send us the remittance advice once payment is made. Thank you!`;
    openWhatsApp(client.phone, message, e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-muted/60 p-3 sm:p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <DialogTitle className="font-bold text-sm text-foreground truncate">
                Statement of Account — {client.companyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {invoices.length} Pending Invoices • Total Due: AED{" "}
                {summary.totalOutstanding.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </DialogDescription>
            </div>
          </div>

          {/* Action Toolbar (Without Copy Text Option) */}
          <TooltipProvider>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 sm:px-3 text-xs gap-1.5"
                    onClick={() => printElement("client-soa-print-area")}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print Statement</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                    onClick={handleWhatsApp}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Send Payment Reminder on WhatsApp
                </TooltipContent>
              </Tooltip>

              <Button
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 bg-[#004ba0] hover:bg-[#003c80] text-white font-semibold"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
              </Button>
            </div>
          </TooltipProvider>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-6 flex justify-start sm:justify-center items-start">
          {/* Printable White Paper Sheet */}
          <div
            id="client-soa-print-area"
            className="bg-white shadow-md w-[800px] min-w-[800px] max-w-[800px] p-8 border-2 border-[#004ba0] rounded-none relative text-left text-slate-800 flex flex-col justify-between shrink-0"
            style={{
              minHeight: "1131px",
              height: "1131px",
              fontSize: "11px",
              fontFamily: "Outfit, system-ui, sans-serif",
            }}
          >
            <div className="flex-1 flex flex-col">
              {/* Official Header Image - edge-to-edge */}
              <div className="mb-3 -mx-[32px] -mt-[32px] overflow-hidden">
                <img
                  src={SoaHeaderImg}
                  alt="Accredit SOA Header"
                  className="w-full h-auto object-contain"
                />

              </div>

              {/* Company TRN Number Display */}
              <div className="text-center -mt-2 mb-3">
                <span className="text-[13.5px] font-bold text-slate-800 tracking-wider uppercase">
                  TRN NO: 104864147400003
                </span>
              </div>

              {/* Client & Statement Details Cards */}
              <div className="grid grid-cols-2 gap-5 mb-3">
                {/* Left Card: Client Information */}
                <div className="bg-white border border-blue-200/80 rounded-xl p-3">
                  <div className="border-b border-blue-200 pb-1.5 mb-2">
                    <h4 className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#004ba0] uppercase leading-4">
                      <Users className="w-4 h-4 text-[#004ba0] shrink-0 mt-[1px]" />
                      <span>Statement To</span>
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex">
                      <span className="w-20 text-[#004ba0]/90 font-bold">
                        M/s.
                      </span>{" "}
                      <span className="flex-1 font-bold text-slate-950 text-[11.5px]">
                        {client.companyName}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-20 text-[#004ba0]/90 font-bold">
                        Attn:
                      </span>{" "}
                      <span className="flex-1 text-slate-950 font-semibold">
                        {cleanContactPerson}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-20 text-[#004ba0]/90 font-bold">
                        TRN No:
                      </span>{" "}
                      <span className="flex-1 text-slate-950 font-bold font-mono">
                        {client.trnNo || "—"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-20 text-[#004ba0]/90 font-bold">
                        PO. Box:
                      </span>{" "}
                      <span className="flex-1 text-slate-900 font-semibold">
                        {client.poBox || "—"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-20 text-[#004ba0]/90 font-bold">
                        Phone/Mob:
                      </span>{" "}
                      <span className="flex-1 text-slate-900 font-semibold">
                        {client.phone || "—"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-20 text-[#004ba0]/90 font-bold">
                        Location:
                      </span>{" "}
                      <span className="flex-1 text-slate-900 font-semibold">
                        {client.location || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Statement Summary */}
                <div className="bg-white border border-blue-200/80 rounded-xl p-3">
                  <div className="border-b border-blue-200 pb-1.5 mb-2">
                    <h4 className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#004ba0] uppercase leading-4">
                      <Calendar className="w-4 h-4 text-[#004ba0] shrink-0 mt-[1px]" />
                      <span>Statement Details</span>
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex">
                      <span className="w-28 text-[#004ba0]/90 font-bold">
                        Statement Date
                      </span>{" "}
                      <span className="flex-1 text-slate-950 font-bold">
                        : {statementDate}
                      </span>
                    </div>
                    {period && (
                      <div className="flex">
                        <span className="w-28 text-[#004ba0]/90 font-bold">
                          Period
                        </span>{" "}
                        <span className="flex-1 text-slate-900 font-semibold">
                          : {period}
                        </span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="w-28 text-[#004ba0]/90 font-bold">
                        Pending Invoices
                      </span>{" "}
                      <span className="flex-1 text-slate-900 font-semibold">
                        : {invoices.length} Invoices
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-[#004ba0]/90 font-bold">
                        Total Invoiced
                      </span>{" "}
                      <span className="flex-1 text-slate-900 font-semibold font-mono">
                        : AED {summary.totalInvoiced.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-[#004ba0]/90 font-bold">
                        Total Paid
                      </span>{" "}
                      <span className="flex-1 text-emerald-600 font-semibold font-mono">
                        : AED {summary.totalPaid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-[#004ba0]/90 font-bold">
                        Outstanding Due
                      </span>{" "}
                      <span className="flex-1 text-rose-700 font-black font-mono">
                        : AED {summary.totalOutstanding.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-[#004ba0]/90 font-bold">
                        Accredit TRN
                      </span>{" "}
                      <span className="flex-1 text-slate-950 font-bold font-mono">
                        : 104864147400003
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Invoices Table */}
              <div className="border border-blue-200/80 rounded-xl overflow-hidden mb-3 bg-white">
                <table className="w-full border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-[#004ba0] text-white">
                      <th className="p-2 text-center font-semibold w-8">No.</th>
                      <th className="p-2 text-left font-semibold w-32">
                        Invoice No.
                      </th>
                      <th className="p-2 text-center font-semibold w-28">
                        Date
                      </th>
                      <th className="p-2 text-center font-semibold w-28">
                        Due Date
                      </th>
                      <th className="p-2 text-right font-semibold w-28">
                        Total (AED)
                      </th>
                      <th className="p-2 text-right font-semibold w-28">
                        Paid (AED)
                      </th>
                      <th className="p-2 text-right font-semibold w-32 bg-[#003882]">
                        Balance Due (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {invoices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-slate-500 italic"
                        >
                          All invoices are fully paid. Zero outstanding balance.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv, idx) => (
                        <tr key={inv.id} className="hover:bg-blue-50/30">
                          <td className="p-1.5 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-1.5 text-left font-bold font-mono text-[#004ba0]">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-1.5 text-center text-slate-700">
                            {inv.date}
                          </td>
                          <td className="p-1.5 text-center text-slate-700">
                            {inv.dueDate}
                          </td>
                          <td className="p-1.5 text-right font-mono text-slate-700">
                            {inv.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-1.5 text-right font-mono text-emerald-600">
                            {inv.paidAmount.toFixed(2)}
                          </td>
                          <td className="p-1.5 pr-2.5 text-right font-mono font-bold text-rose-700 bg-rose-50/30">
                            {inv.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section: Amount in Words, Totals, Bank Details, Combined Seal/Signature, and Footer */}
            <div>
              {/* Amount In Words and Totals Box */}
              <div className="grid grid-cols-5 gap-4 mb-2.5 items-start">
                <div className="col-span-3 bg-white border border-blue-200/80 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-[#004ba0]/90 uppercase block mb-1">
                    Total Outstanding Amount In Words
                  </span>
                  <p className="text-[11px] font-bold italic text-slate-900 m-0">
                    {amountToWords(summary.totalOutstanding)}
                  </p>
                </div>

                <div className="col-span-2 border border-blue-200/80 rounded-xl overflow-hidden bg-white">
                  <table className="w-full border-collapse text-[10.5px]">
                    <tbody>
                      <tr>
                        <td className="p-1.5 text-left font-semibold text-[#004ba0]/90 border-b border-blue-100">
                          Total Invoiced
                        </td>
                        <td className="p-1.5 text-right font-bold text-slate-900 w-32 border-b border-blue-100 font-mono">
                          {summary.totalInvoiced.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 text-left font-semibold text-[#004ba0]/90 border-b border-blue-100">
                          Total Paid Received
                        </td>
                        <td className="p-1.5 text-right font-bold text-emerald-600 border-b border-blue-100 font-mono">
                          {summary.totalPaid.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-[#004ba0] text-white font-bold">
                        <td className="p-2 text-left">TOTAL DUE (AED)</td>
                        <td className="p-2 text-right text-sm font-mono">
                          {summary.totalOutstanding.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bank Details Box */}
              <div className="border border-blue-200/80 rounded-xl p-3 mb-2.5 bg-white">
                <div className="border-b border-blue-200 pb-1 mb-2">
                  <h4 className="flex items-center gap-1 text-[11px] font-bold text-[#004ba0] uppercase leading-[14px]">
                    <Award className="w-3.5 h-3.5 text-[#004ba0] shrink-0 mt-[1px]" />
                    <span>Bank Details for Remittance</span>
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-[10px]">
                  <div>
                    <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                      Account Name
                    </span>
                    <span className="font-bold text-slate-900">
                      {COMPANY_BANK_DETAILS.accountName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                      Bank
                    </span>
                    <span className="font-bold text-slate-900">
                      {COMPANY_BANK_DETAILS.bankName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                      SWIFT Code
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {COMPANY_BANK_DETAILS.swiftCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                      Account No.
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {COMPANY_BANK_DETAILS.accountNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                      IBAN
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {COMPANY_BANK_DETAILS.ibanFormatted}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                      Branch
                    </span>
                    <span className="font-bold text-slate-900">
                      {COMPANY_BANK_DETAILS.branch}
                    </span>
                  </div>
                </div>
              </div>

              {/* Combined Seal & Signature + Payment Notice */}
              <div className="flex justify-between items-end mb-2.5 px-2">
                <div className="space-y-0.5 text-slate-500 text-[9.5px] max-w-[420px]">
                  <p className="font-bold text-slate-700 m-0">
                    Payment Notice:
                  </p>
                  <p className="m-0 text-slate-500">
                    • Please quote invoice number(s) on your remittance advice.
                  </p>
                </div>

                {/* Combined Stamp & Signature Container */}
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-16 flex items-center justify-center">
                    {/* Official Seal Stamp - layered on left */}
                    <img
                      src={SealImg}
                      alt="Accredit Official Seal"
                      className="absolute -left-1 w-16 h-16 object-contain pointer-events-none drop-shadow-xs opacity-95"
                    />
                    {/* Authorized Signature - layered on top */}
                    <img
                      src={SignatureImg}
                      alt="Authorized Signature"
                      className="relative z-10 w-28 h-auto object-contain"
                    />
                  </div>
                  <div className="border-t border-slate-400 w-48 pt-1 text-center">
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider block">
                      Authorized Signatory
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Footer Image - edge-to-edge */}
              <div className="-mx-[32px] -mb-[32px] overflow-hidden flex items-center justify-center">
                <img
                  src={FooterImg}
                  alt="Accredit Invoice Footer"
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
