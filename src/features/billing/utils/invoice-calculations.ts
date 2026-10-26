export type TaxMode = "exclusive" | "inclusive";
import { getCourseShortName } from "./course-abbreviation";

export interface BillableCertificateItem {
  id: string;
  rawId: string;
  type: "certificate" | "training";
  serviceType?: "training" | "inspection";
  participantName: string;
  course: string;
  awardingBody?: string;
  certificateNumber?: string | null;
  customCompany?: string;
  phone?: string;
  mobile?: string;
}

export interface ManualLineItem {
  id?: string;
  description: string;
  quantity: number | string;
  unit: string;
  unitPrice: number | string;
  discount?: number | string;
  vatPercent?: number | string;
}

export interface GeneratedLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  vatPercent: number;
  lineSubtotal: number;
  lineVat: number;
  lineTotal: number;
  sortOrder: number;
  certificateId: string | null;
  trainingId: string | null;
}

export interface InvoiceCalculationInput {
  isTrainingOrInspection: boolean;
  selectedItems: BillableCertificateItem[];
  courseRates: Record<string, string>;
  manualLineItems: ManualLineItem[];
  taxMode: TaxMode;
  globalDiscount?: number;
  discountType?: "percentage" | "amount";
  discountValue?: number | string;
}

export interface InvoiceCalculationResult {
  lineItems: GeneratedLineItem[];
  subtotal: number;
  discount: number;
  discountRate?: number;
  discountType?: "percentage" | "amount";
  taxableAmount: number;
  vatAmount: number;
  total: number;
}

/**
 * Pure calculation engine for invoice line items and totals
 * Supports:
 * - Exclusive: 150 AED + 5% VAT (7.50) = 157.50 AED
 * - Inclusive: 150 AED total (142.86 net + 7.14 VAT) = 150.00 AED
 * - Discounts: Percentage (%) or Fixed Amount (AED)
 */
export function calculateInvoice({
  isTrainingOrInspection,
  selectedItems,
  courseRates,
  manualLineItems,
  taxMode,
  globalDiscount = 0,
  discountType = "amount",
  discountValue,
}: InvoiceCalculationInput): InvoiceCalculationResult {
  let lineItems: GeneratedLineItem[] = [];

  if (isTrainingOrInspection && selectedItems.length > 0) {
    lineItems = selectedItems.map((item, index) => {
      const body = (item.awardingBody || "").trim();
      const lowerBody = body.toLowerCase();
      const groupKey = `${item.course}:::${body || "General"}`;
      const rawRate =
        parseFloat(courseRates[groupKey] ?? courseRates[item.course]) || 0;

      let unitPrice = rawRate;
      let vatPercent = 5.0;
      let sub = rawRate;
      let vat = 0;
      let total = rawRate;

      if (taxMode === "inclusive") {
        vatPercent = 5.0;
        unitPrice = Number((rawRate / 1.05).toFixed(2));
        sub = unitPrice;
        vat = Number((rawRate - unitPrice).toFixed(2));
        total = rawRate;
      } else {
        // Exclusive: 5% VAT added on top
        vatPercent = 5.0;
        unitPrice = rawRate;
        sub = rawRate;
        vat = Number((rawRate * 0.05).toFixed(2));
        total = Number((rawRate + vat).toFixed(2));
      }

      let descPrefix = "";
      if (item.certificateNumber) {
        const certNum = item.certificateNumber.match(/\d+/)?.[0] || item.certificateNumber;
        descPrefix = certNum ? `${certNum} - ` : "";
      }

      const displayComp = item.customCompany ? ` [${item.customCompany}]` : "";
      const courseShort = getCourseShortName(item.course);

      const description = `${descPrefix}${item.participantName} - ${courseShort}${displayComp}`;
      const isCert = item.type === "certificate";

      return {
        description,
        quantity: 1,
        unit: isCert ? "Cert" : "Session",
        unitPrice,
        discount: 0,
        vatPercent,
        lineSubtotal: sub,
        lineVat: vat,
        lineTotal: total,
        sortOrder: index,
        certificateId: isCert ? item.rawId : null,
        trainingId: !isCert ? item.rawId : null,
      };
    });
  } else {
    // Manual line items (for general invoices or training without certificates)
    lineItems = manualLineItems.map((item, index) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      const price = parseFloat(String(item.unitPrice)) || 0;
      const disc = parseFloat(String(item.discount)) || 0;
      const vatPct = parseFloat(String(item.vatPercent)) || 5.0;

      const lineSub = qty * price;
      const lineVat = Number(((lineSub - disc) * (vatPct / 100)).toFixed(2));
      const lineTotal = Number((lineSub - disc + lineVat).toFixed(2));

      return {
        description: item.description || "",
        quantity: qty,
        unit: item.unit || "Qty",
        unitPrice: price,
        discount: disc,
        vatPercent: vatPct,
        lineSubtotal: lineSub,
        lineVat,
        lineTotal,
        sortOrder: index,
        certificateId: null,
        trainingId: null,
      };
    });
  }

  let subtotal = 0;
  let totalLineDiscount = 0;

  lineItems.forEach((li) => {
    subtotal += li.lineSubtotal;
    totalLineDiscount += li.discount;
  });

  // Calculate global invoice discount (percentage or fixed amount)
  let effectiveGlobalDiscount = 0;
  let effectiveDiscountRate = 0;
  const activeDiscountType = discountType || "amount";

  if (discountValue !== undefined && discountValue !== "") {
    const parsedVal =
      typeof discountValue === "number"
        ? discountValue
        : parseFloat(discountValue) || 0;

    if (parsedVal > 0 && subtotal > 0) {
      if (activeDiscountType === "percentage") {
        const pct = Math.min(100, Math.max(0, parsedVal));
        effectiveDiscountRate = pct;
        effectiveGlobalDiscount = Number(((subtotal * pct) / 100).toFixed(2));
      } else {
        effectiveGlobalDiscount = Math.min(subtotal, Math.max(0, parsedVal));
        effectiveDiscountRate =
          subtotal > 0
            ? Number(((effectiveGlobalDiscount / subtotal) * 100).toFixed(2))
            : 0;
      }
    }
  } else if (globalDiscount && globalDiscount > 0) {
    // Backwards compatibility with globalDiscount
    effectiveGlobalDiscount = Math.min(subtotal, Math.max(0, globalDiscount));
    effectiveDiscountRate =
      subtotal > 0
        ? Number(((effectiveGlobalDiscount / subtotal) * 100).toFixed(2))
        : 0;
  }

  const subtotalAfterLineDiscounts = Math.max(0, subtotal - totalLineDiscount);
  let totalVat = 0;

  // Prorate global discount across line items so VAT and totals reflect net taxable amount
  const updatedLineItems = lineItems.map((li) => {
    let lineBase = Math.max(0, li.lineSubtotal - li.discount);
    if (effectiveGlobalDiscount > 0 && subtotalAfterLineDiscounts > 0) {
      const lineGlobalPortion = (effectiveGlobalDiscount * lineBase) / subtotalAfterLineDiscounts;
      lineBase = Math.max(0, lineBase - lineGlobalPortion);
    }

    const lineVat = Number((lineBase * (li.vatPercent / 100)).toFixed(2));
    const lineTotal = Number((lineBase + lineVat).toFixed(2));

    totalVat += lineVat;

    return {
      ...li,
      lineVat,
      lineTotal,
    };
  });

  const totalDiscount = totalLineDiscount + effectiveGlobalDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  // UAE FTA VAT: 5% assessed on the net taxable amount
  const overallVat = Number((taxableAmount * 0.05).toFixed(2));

  // Reconcile rounding delta between line items and overall VAT
  const lineVatSum = updatedLineItems.reduce((acc, li) => acc + li.lineVat, 0);
  const vatDelta = Number((overallVat - lineVatSum).toFixed(2));

  if (Math.abs(vatDelta) >= 0.01 && updatedLineItems.length > 0) {
    const step = vatDelta > 0 ? 0.01 : -0.01;
    let remainingSteps = Math.round(Math.abs(vatDelta) * 100);
    for (let i = updatedLineItems.length - 1; i >= 0 && remainingSteps > 0; i--) {
      updatedLineItems[i].lineVat = Number((updatedLineItems[i].lineVat + step).toFixed(2));
      updatedLineItems[i].lineTotal = Number((updatedLineItems[i].lineTotal + step).toFixed(2));
      remainingSteps--;
    }
  }

  const grandTotal = Number((taxableAmount + overallVat).toFixed(2));

  return {
    lineItems: updatedLineItems,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(effectiveGlobalDiscount.toFixed(2)),
    discountRate: Number(effectiveDiscountRate.toFixed(2)),
    discountType: activeDiscountType,
    taxableAmount: Number(taxableAmount.toFixed(2)),
    vatAmount: overallVat,
    total: grandTotal,
  };
}
