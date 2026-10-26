import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  FileText,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  ListFilter,
  GraduationCap,
  Users,
} from "lucide-react";
import { formatAED, DIRHAM_SYMBOL, cn } from "@/lib/utils";
import { DiscountInputControl } from "../DiscountInputControl";
import {
  BillingType,
  CustomerFormState,
  InvoiceItemGrouping,
} from "../../types/invoice-wizard.types";
import { GeneratedLineItem, TaxMode } from "../../utils/invoice-calculations";
import { getInvoiceItems } from "../../utils/billing.utils";

interface Step3ReviewProps {
  nextInvoiceNum: string;
  billingType: BillingType;
  customerForm: CustomerFormState;
  typeName: string;
  taxMode: TaxMode;
  lineItems: GeneratedLineItem[];
  groupingMode?: InvoiceItemGrouping;
  onGroupingModeChange?: (mode: InvoiceItemGrouping) => void;
  calculations: {
    subtotal: number;
    discount?: number;
    discountRate?: number;
    discountType?: "percentage" | "amount";
    taxableAmount?: number;
    vatAmount: number;
    total: number;
  };
  discountType?: "percentage" | "amount";
  discountValue?: string;
  onDiscountTypeChange?: (type: "percentage" | "amount") => void;
  onDiscountValueChange?: (val: string) => void;
  invoiceDate: Date;
  onInvoiceDateChange: (date: Date) => void;
  dueDate: Date | undefined;
  onDueDateChange: (date: Date | undefined) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function Step3Review({
  nextInvoiceNum,
  billingType,
  customerForm,
  typeName,
  taxMode,
  lineItems,
  groupingMode = "itemized",
  onGroupingModeChange,
  calculations,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  invoiceDate,
  onInvoiceDateChange,
  dueDate,
  onDueDateChange,
  notes,
  onNotesChange,
}: Step3ReviewProps) {
  const displayedItems = React.useMemo(() => {
    return getInvoiceItems(
      { lineItems } as any,
      { groupBy: groupingMode },
    );
  }, [lineItems, groupingMode]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Visual Invoice Header Card */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              TAX INVOICE DRAFT
            </span>
            <h2 className="text-base font-extrabold font-mono text-primary">
              {nextInvoiceNum}
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-border text-foreground self-start sm:self-auto">
            {typeName || "Training Services"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Billed Customer
            </span>
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              {billingType === "company" ? (
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>{customerForm.client || "Individual Candidate"}</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* Clean Line Items Table Preview */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
        <div className="bg-muted/30 px-3.5 py-2 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Line Items Preview ({displayedItems.length})
            </span>
            {lineItems.length !== displayedItems.length && (
              <span className="text-[10px] text-muted-foreground font-medium">
                ({lineItems.length} certs)
              </span>
            )}
          </div>

          
        </div>

        <div className="bg-muted/15 px-3.5 py-1.5 border-b border-border/60 text-[10px] font-bold text-muted-foreground grid grid-cols-12 uppercase tracking-wider items-center">
          <span className="col-span-7">
            <span>Description / Breakdown</span>
            <span className="block text-[8px] font-normal normal-case tracking-normal text-muted-foreground/80 leading-tight">
              Safety Consultancy Services
            </span>
          </span>
          <span className="col-span-1 text-center">Qty</span>
          <span className="col-span-2 text-right">Unit Price</span>
          <span className="col-span-2 text-right">Total</span>
        </div>

        <div className="max-h-48 overflow-y-auto divide-y divide-border/40 text-xs">
          {displayedItems.map((item, index) => (
            <div key={index} className="px-3.5 py-2 grid grid-cols-12 items-center">
              <span className="col-span-7 font-medium text-foreground truncate pr-2">
                {item.description}
              </span>
              <span className="col-span-1 text-center font-mono text-muted-foreground">
                {item.qty}
              </span>
              <span className="col-span-2 text-right font-mono text-muted-foreground">
                {formatAED(item.unitPrice)}
              </span>
              <span className="col-span-2 text-right font-mono font-semibold text-foreground">
                {formatAED(item.totalAmount)}
              </span>
            </div>
          ))}
        </div>

        {/* Discount Input Control */}
        {onDiscountTypeChange && onDiscountValueChange && (
          <div className="p-3 border-t border-border bg-card">
            <DiscountInputControl
              discountType={discountType ?? "percentage"}
              discountValue={discountValue ?? ""}
              onDiscountTypeChange={onDiscountTypeChange}
              onDiscountValueChange={onDiscountValueChange}
              subtotal={calculations.subtotal}
            />
          </div>
        )}

        {/* Totals Strip */}
        <div className="bg-muted/20 border-t border-border p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Gross Subtotal:</span>
            <span className="font-mono">{formatAED(calculations.subtotal)}</span>
          </div>

          {(calculations.discount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>
                Discount
                {calculations.discountRate ? ` (${calculations.discountRate}%)` : ""}:
              </span>
              <span className="font-mono">
                -{formatAED(calculations.discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <span>VAT (5%):</span>
            <span className="font-mono">{formatAED(calculations.vatAmount)}</span>
          </div>

          <div className="flex justify-between text-foreground font-bold text-sm border-t border-border/80 pt-2 mt-1">
            <span>Total Payable ({DIRHAM_SYMBOL}):</span>
            <span className="font-mono text-primary text-base font-extrabold">
              {formatAED(calculations.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Dates & Payment Terms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Issue Date (Invoice Date) *</Label>
          <CustomCalendar
            value={invoiceDate}
            onChange={(d) => d && onInvoiceDateChange(d)}
            placeholder="Select issue date"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Payment Due Date</Label>
          <CustomCalendar
            value={dueDate}
            onChange={onDueDateChange}
            placeholder="Select due date"
          />
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Notes / Payment Reference</Label>
        <Input
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g. Transfers/Cheques payable to: Accredit Management Consultancy LLC SPC"
          className="h-8 text-xs bg-background"
        />
      </div>
    </div>
  );
}
