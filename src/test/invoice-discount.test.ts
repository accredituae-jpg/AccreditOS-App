import { describe, it, expect } from "vitest";
import {
  calculateInvoice,
  type BillableCertificateItem,
  type ManualLineItem,
} from "../features/billing/utils/invoice-calculations";

describe("Invoice Discount Calculation Engine", () => {
  const dummyCertificates: BillableCertificateItem[] = [
    {
      id: "cert-1",
      rawId: "c1",
      type: "certificate",
      participantName: "Alice Smith",
      course: "First Aid Level 2",
      certificateNumber: "TCT-101-AC",
    },
    {
      id: "cert-2",
      rawId: "c2",
      type: "certificate",
      participantName: "Bob Jones",
      course: "First Aid Level 2",
      certificateNumber: "TCT-102-AC",
    },
  ];

  const courseRates = {
    "First Aid Level 2": "500",
  };

  it("calculates invoice with fixed amount discount in AED (Exclusive VAT)", () => {
    // 2 certs @ 500 AED each = Subtotal 1000 AED
    // Discount = 200 AED
    // Taxable Amount = 800 AED
    // VAT (5% on 800 AED taxable amount = 40 AED)
    // Grand Total = 800 + 40 = 840 AED
    const result = calculateInvoice({
      isTrainingOrInspection: true,
      selectedItems: dummyCertificates,
      courseRates,
      manualLineItems: [],
      taxMode: "exclusive",
      discountType: "amount",
      discountValue: "200",
    });

    expect(result.subtotal).toBe(1000);
    expect(result.discount).toBe(200);
    expect(result.discountRate).toBe(20); // 200 / 1000 = 20%
    expect(result.discountType).toBe("amount");
    expect(result.taxableAmount).toBe(800);
    expect(result.vatAmount).toBe(40);
    expect(result.total).toBe(840);
    expect(result.lineItems[0].lineVat).toBe(20);
    expect(result.lineItems[0].lineTotal).toBe(420);
  });

  it("calculates invoice with percentage discount (Exclusive VAT)", () => {
    // Subtotal 1000 AED, 15% discount = 150 AED
    // Taxable amount = 850 AED
    // VAT = 42.50 AED
    // Grand Total = 850 + 42.50 = 892.50 AED
    const result = calculateInvoice({
      isTrainingOrInspection: true,
      selectedItems: dummyCertificates,
      courseRates,
      manualLineItems: [],
      taxMode: "exclusive",
      discountType: "percentage",
      discountValue: "15",
    });

    expect(result.subtotal).toBe(1000);
    expect(result.discount).toBe(150);
    expect(result.discountRate).toBe(15);
    expect(result.discountType).toBe("percentage");
    expect(result.taxableAmount).toBe(850);
    expect(result.vatAmount).toBe(42.5);
    expect(result.total).toBe(892.5);
  });

  it("clamps percentage discount between 0% and 100%", () => {
    // Negative percentage treated as 0
    const resultZero = calculateInvoice({
      isTrainingOrInspection: true,
      selectedItems: dummyCertificates,
      courseRates,
      manualLineItems: [],
      taxMode: "exclusive",
      discountType: "percentage",
      discountValue: "-20",
    });
    expect(resultZero.discount).toBe(0);
    expect(resultZero.total).toBe(1050);

    // Percentage > 100 clamped to 100%
    const resultHundred = calculateInvoice({
      isTrainingOrInspection: true,
      selectedItems: dummyCertificates,
      courseRates,
      manualLineItems: [],
      taxMode: "exclusive",
      discountType: "percentage",
      discountValue: "150",
    });
    expect(resultHundred.discount).toBe(1000);
    expect(resultHundred.taxableAmount).toBe(0);
    expect(resultHundred.vatAmount).toBe(0);
    expect(resultHundred.total).toBe(0);
  });

  it("caps fixed amount discount to subtotal to prevent negative invoice", () => {
    const result = calculateInvoice({
      isTrainingOrInspection: true,
      selectedItems: dummyCertificates,
      courseRates,
      manualLineItems: [],
      taxMode: "exclusive",
      discountType: "amount",
      discountValue: "99999",
    });

    expect(result.discount).toBe(1000);
    expect(result.taxableAmount).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it("handles manual line items with both line-level and invoice-level discounts", () => {
    const manualItems: ManualLineItem[] = [
      {
        description: "Safety Equipment",
        quantity: 2,
        unit: "Pcs",
        unitPrice: 100,
        discount: 10, // Line discount: net 190 AED
        vatPercent: 5.0,
      },
    ];

    const result = calculateInvoice({
      isTrainingOrInspection: false,
      selectedItems: [],
      courseRates: {},
      manualLineItems: manualItems,
      taxMode: "exclusive",
      discountType: "amount",
      discountValue: "10", // Global discount 10 AED -> net taxable 180 AED
    });

    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(10); // Global discount
    expect(result.taxableAmount).toBe(180);
    expect(result.vatAmount).toBe(9);
    // Subtotal 200 - 20 total discount (10 line + 10 global) = 180 taxable + 9 VAT = 189 AED
    expect(result.total).toBe(189);
  });

  it("maintains backward compatibility with globalDiscount number parameter", () => {
    const result = calculateInvoice({
      isTrainingOrInspection: true,
      selectedItems: dummyCertificates,
      courseRates,
      manualLineItems: [],
      taxMode: "exclusive",
      globalDiscount: 100,
    });

    expect(result.subtotal).toBe(1000);
    expect(result.discount).toBe(100);
    expect(result.discountRate).toBe(10);
    expect(result.taxableAmount).toBe(900);
    expect(result.vatAmount).toBe(45);
    expect(result.total).toBe(945);
  });
});
