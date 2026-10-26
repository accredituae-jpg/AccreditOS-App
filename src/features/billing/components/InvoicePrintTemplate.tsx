import React from "react";
import { Users, Calendar, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Invoice } from "../types/billing.types";
import InvoiceHeaderImg from "@/assets/InvoiceHeader.png";
import FooterImg from "@/assets/Footer.png";
import SealImg from "@/assets/Seal.webp";
import SignatureImg from "@/assets/Signature.webp";
import {
  getInvoiceItems,
  getInvoiceClientDisplayName,
  formatContact,
  formatDateDDMMYYYY,
  amountToWords,
  InvoiceItemGrouping,
} from "../utils/billing.utils";
import { COMPANY_BANK_DETAILS } from "@/config/companyDetails";

export interface InvoicePrintTemplateProps {
  invoice: Invoice;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  showAwardingBody?: boolean;
  groupBy?: InvoiceItemGrouping;
  showSeal?: boolean;
}

export const InvoicePrintTemplate = React.forwardRef<
  HTMLDivElement,
  InvoicePrintTemplateProps
>(
  (
    {
      invoice,
      id = "invoice-print-area",
      className,
      style,
      showAwardingBody = false,
      groupBy,
      showSeal = true,
    },
    ref,
  ) => {
    const effectiveGroupBy: InvoiceItemGrouping =
      groupBy ||
      (invoice?.notes?.includes("[format:course]") ||
      invoice?.terms?.includes("[format:course]")
        ? "course"
        : invoice?.notes?.includes("[format:participant]") ||
            invoice?.terms?.includes("[format:participant]")
          ? "participant"
          : "itemized");

    const items = getInvoiceItems(invoice, {
      showAwardingBody,
      groupBy: effectiveGroupBy,
    });
    const clientDisplayName = getInvoiceClientDisplayName(invoice);

    const cleanedNotes = (invoice.notes || "")
      .replace(/\[format:(course|participant|itemized)\]/gi, "")
      .trim();

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "bg-white shadow-md w-[800px] min-w-[800px] max-w-[800px] p-8 border-2 border-[#004ba0] rounded-none relative text-left text-slate-800 flex flex-col justify-between shrink-0",
        className
      )}
      style={{
        minHeight: "1131px",
        height: "1131px",
        fontSize: "11px",
        fontFamily: "Outfit, system-ui, sans-serif",
        ...style,
      }}
    >
      <div className="flex-1 flex flex-col">
        {/* Header Banner */}
        <div className="mb-3 -mx-[32px] -mt-[32px] overflow-hidden">
          <img
            src={InvoiceHeaderImg}
            alt="Accredit Invoice Header"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* TRN Header */}
        <div className="text-center -mt-2 mb-3">
          <span className="text-[13.5px] font-bold text-slate-800 tracking-wider uppercase">
            TRN NO: 104864147400003
          </span>
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-2 gap-5 mb-3">
          {/* Invoice To */}
          <div className="bg-white border border-blue-200/80 rounded-xl p-3">
            <div className="border-b border-blue-200 pb-1.5 mb-2">
              <h4 className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#004ba0] uppercase leading-4">
                <Users className="w-4 h-4 text-[#004ba0] shrink-0 mt-[1px]" />
                <span>Invoice To</span>
              </h4>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex">
                <span className="w-20 text-[#004ba0]/90 font-bold">M/s.</span>{" "}
                <span className="flex-1 font-bold text-slate-950 text-[11.5px]">
                  {clientDisplayName}
                </span>
              </div>
              <div className="flex">
                <span className="w-20 text-[#004ba0]/90 font-bold">TRN No:</span>{" "}
                <span className="flex-1 text-slate-950 font-bold">
                  {invoice.trnNo || "—"}
                </span>
              </div>
              <div className="flex">
                <span className="w-20 text-[#004ba0]/90 font-bold">PO. Box:</span>{" "}
                <span className="flex-1 text-slate-900 font-semibold">
                  {invoice.poBox || "—"}
                </span>
              </div>
              <div className="flex">
                <span className="w-20 text-[#004ba0]/90 font-bold">Phone/Mob:</span>{" "}
                <span className="flex-1 text-slate-900 font-semibold">
                  {invoice.phone || "—"}{" "}
                  {invoice.mobile ? `/ ${invoice.mobile}` : ""}
                </span>
              </div>
              <div className="flex">
                <span className="w-20 text-[#004ba0]/90 font-bold">Location:</span>{" "}
                <span className="flex-1 text-slate-900 font-semibold">
                  {invoice.location || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white border border-blue-200/80 rounded-xl p-3">
            <div className="border-b border-blue-200 pb-1.5 mb-2">
              <h4 className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#004ba0] uppercase leading-4">
                <Calendar className="w-4 h-4 text-[#004ba0] shrink-0 mt-[1px]" />
                <span>Invoice Details</span>
              </h4>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex">
                <span className="w-28 text-[#004ba0]/90 font-bold">Invoice No.</span>{" "}
                <span className="flex-1 text-slate-950 font-bold">
                  : {invoice.invoiceNumber}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#004ba0]/90 font-bold">Invoice Date</span>{" "}
                <span className="flex-1 text-slate-900 font-semibold">
                  : {formatDateDDMMYYYY(invoice.date)}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#004ba0]/90 font-bold">Invoice Due Date</span>{" "}
                <span className="flex-1 text-slate-900 font-semibold">
                  : {formatDateDDMMYYYY(invoice.dueDate)}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#004ba0]/90 font-bold">Reference/Contact</span>{" "}
                <span className="flex-1 text-slate-900 font-semibold">
                  : {formatContact(invoice.referenceContact)}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-[#004ba0]/90 font-bold">Accredit TRN</span>{" "}
                <span className="flex-1 text-slate-950 font-bold">
                  : 104864147400003
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-blue-200/80 rounded-xl overflow-hidden mb-3 bg-white">
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-[#004ba0] text-white">
                <th className="p-2 text-center font-semibold w-10">No.</th>
                <th className="p-2 text-left font-semibold">
                  <span>Description</span>
                  <span className="block text-[8px] font-normal normal-case tracking-normal text-sky-100/90 leading-tight">
                    Safety Consultancy Services
                  </span>
                </th>
                <th className="p-2 text-center font-semibold w-12">Qty</th>
                <th className="p-2 text-right font-semibold w-20">Unit Price</th>
                <th className="p-2 text-right font-semibold w-24">Gross Amount</th>
                <th className="p-2 text-right font-semibold w-16">VAT 5%</th>
                <th className="p-2 text-right font-semibold w-24">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {items.map((item) => (
                <tr key={item.no} className="hover:bg-blue-50/30">
                  <td className="p-1 text-center">{item.no}</td>
                  <td
                    className="p-1 text-left font-medium max-w-0 truncate"
                    style={{
                      maxWidth: "320px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.description}
                  </td>
                  <td className="p-1 text-center">{item.qty}</td>
                  <td className="p-1 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="p-1 text-right">{item.grossAmount.toFixed(2)}</td>
                  <td className="p-1 text-right">{item.vatAmount.toFixed(2)}</td>
                  <td className="p-1 pr-2 text-right font-bold text-slate-950">
                    {item.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        {/* Amount In Words and Totals Box */}
        <div className="grid grid-cols-5 gap-4 mb-2 items-start">
          <div className="col-span-3 bg-white border border-blue-200/80 rounded-xl p-3">
            <span className="text-[9px] font-bold text-[#004ba0]/90 uppercase block mb-1">
              Amount In Words
            </span>
            <p className="text-[11px] font-bold italic text-slate-900 m-0">
              {amountToWords(invoice.totalAmount)}
            </p>
          </div>

          <div className="col-span-2 border border-blue-200/80 rounded-xl overflow-hidden bg-white">
            <table className="w-full border-collapse text-[10.5px]">
              <tbody>
                <tr>
                  <td className="p-1.5 text-left font-semibold text-[#004ba0]/90 border-b border-blue-100">
                    Subtotal
                  </td>
                  <td className="p-1.5 text-right font-bold text-slate-900 w-32 border-b border-blue-100">
                    {invoice.subtotal.toFixed(2)}
                  </td>
                </tr>
                {Number((invoice as any).discountAmount ?? (invoice as any).discount ?? 0) > 0 && (
                  <tr>
                    <td className="p-1.5 text-left font-semibold text-rose-600 border-b border-blue-100">
                      Discount
                    </td>
                    <td className="p-1.5 text-right font-bold text-rose-600 border-b border-blue-100">
                      -{Number((invoice as any).discountAmount ?? (invoice as any).discount ?? 0).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="p-1.5 text-left font-semibold text-[#004ba0]/90 border-b border-blue-100">
                    Vat (5%)
                  </td>
                  <td className="p-1.5 text-right font-bold text-slate-900 border-b border-blue-100">
                    {invoice.vatAmount.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-[#004ba0] text-white font-bold">
                  <td className="p-2 text-left">TOTAL</td>
                  <td className="p-2 text-right text-sm">
                    {invoice.totalAmount.toFixed(2)}
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
              <span>Bank Details</span>
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-[10px]">
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
              <span className="font-bold text-slate-900">
                {COMPANY_BANK_DETAILS.swiftCode}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                Account No.
              </span>
              <span className="font-bold text-slate-900">
                {COMPANY_BANK_DETAILS.accountNumber}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-[#004ba0] font-bold block uppercase leading-none mb-0.5">
                IBAN
              </span>
              <span className="font-bold text-slate-900">
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

        {/* Authorized Signatory / Seal & Signature */}
        <div className="flex justify-between items-end mb-2.5 px-2">
          <div className="space-y-0.5 text-slate-500 text-[9.5px] max-w-[420px]">
            {cleanedNotes ? (
              <div>
                <span className="font-bold text-slate-700">Note: </span>
                <span className="text-slate-600 italic">{cleanedNotes}</span>
              </div>
            ) : (
              <>
                <p className="font-bold text-slate-700 m-0">Payment Notice:</p>
                <p className="m-0 text-slate-500">
                  • Please quote the invoice number on your payment reference.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-48 h-16 flex items-center justify-center">
              {showSeal && (
                <>
                  {/* Official Seal Stamp */}
                  <img
                    src={SealImg}
                    alt="Accredit Official Seal"
                    className="absolute -left-1 w-16 h-16 object-contain pointer-events-none drop-shadow-xs opacity-95"
                  />
                  {/* Authorized Signature */}
                  <img
                    src={SignatureImg}
                    alt="Authorized Signature"
                    className="relative z-10 w-28 h-auto object-contain"
                  />
                </>
              )}
            </div>
            <div className="border-t border-slate-400 w-48 pt-1 text-center">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider block">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="-mx-[32px] -mb-[32px] overflow-hidden flex items-center justify-center">
          <img
            src={FooterImg}
            alt="Accredit Invoice Footer"
            className="w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
});

InvoicePrintTemplate.displayName = "InvoicePrintTemplate";
