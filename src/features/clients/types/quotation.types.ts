export interface QuotationItem {
  sNo: number;
  trainingName: string;
  qty: number;
  ratePerUnit: number;
  rateType?: "amount" | "text";
  rateText?: string;
  rateCalculation: string;
  totalAmount: number;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  companyName: string;
  contactNo: string;
  email?: string;
  location?: string;
  trnNo?: string;
  subject: string;
  items: QuotationItem[];
  subtotal: number;
  discountType?: "percentage" | "amount";
  discountRate?: number;
  discountAmount?: number;
  taxMode?: "exclusive" | "inclusive";
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  amountInWords: string;
  paymentTerms: string;
  status?: "draft" | "sent" | "accepted" | "rejected";
  pricingSummaryText?: string;
}
