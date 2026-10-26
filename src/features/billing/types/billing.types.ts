import { Client } from "@/lib/clients";

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  vatPercent?: number;
  lineSubtotal: number;
  lineVat: number;
  lineTotal: number;
  certificateId?: string;
  trainingId?: string;
  certificateNumber?: string | null;
  sortOrder?: number;
  certificate?: {
    id: string;
    participantName: string;
    courseName?: string;
    awardingBodyName?: string;
    certificateNumber?: string | null;
  } | null;
  training?: {
    id: string;
    participantName: string;
    courseName?: string;
    awardingBodyName?: string;
  } | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: string;
  clientName?: string;
  clientEmail?: string;
  email?: string;
  typeId: string;
  typeName: string;
  trnNo: string;
  clientTRN?: string;
  poBox: string;
  clientPoBox?: string;
  location: string;
  clientLocation?: string;
  phone: string;
  clientPhone?: string;
  mobile: string;
  clientMobile?: string;
  referenceContact: string;
  clientReferenceContact?: string;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount?: number;
  balance?: number;
  committedAmount?: number;
  allocatableBalance?: number;
  pendingReceipts?: Array<{
    receiptId: string;
    receiptNumber: string;
    amount: number;
    status: string;
    date?: string;
    paymentMethod?: string;
  }>;
  status: "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
  date: string;
  dueDate: string;
  description: string;
  currency: string;
  notes?: string;
  terms?: string;
  selectedCertificateIds?: string[];
  lineItems: InvoiceLineItem[];
  createdById?: string;
  createdByName?: string;
  createdBy?: { id: string; name: string; email?: string };
  updatedById?: string;
  updatedByName?: string;
  updatedBy?: { id: string; name: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export type ExpensePaymentMethod = "account" | "petty_cash" | "cash";
export type ExpensePaidByType = "company" | "employee";
export type ExpenseStatus = "paid" | "not_returned" | "returned";

export interface Expense {
  id: string;
  categoryId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod?: ExpensePaymentMethod;
  paidByType?: ExpensePaidByType;
  paidById?: string | null;
  paidByName?: string | null;
  status?: ExpenseStatus;
  returnedAt?: string | null;
  returnedMethod?: ExpensePaymentMethod | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptAllocation {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  isVoided: boolean;
  invoiceDate?: string;
  invoiceDueDate?: string;
  invoiceTotal?: number;
  invoiceBalance?: number;
  invoiceStatus?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: number | null;
  clientId: string;
  client?: Client;
  amount: number;
  allocatedAmount?: number;
  amountInWords: string;
  date: string;
  paymentDate?: string;
  paymentMethod: "CASH" | "CHEQUE" | "BANK_TRANSFER" | "ONLINE";
  referenceNo?: string;
  drawnOnBank?: string;
  notes?: string;
  status: "issued" | "paid" | "voided";
  currency: string;
  exchangeRate?: number;
  transactionReference?: string;
  clientSnapshot: {
    companyName: string;
    contactPerson: string;
    phone: string;
    mobile?: string;
    email: string;
    trnNo: string;
    poBox: string;
    location: string;
    billingType?: "company" | "individual";
    candidateName?: string;
  };
  pdfUrl?: string;
  createdById: string;
  createdByName?: string;
  createdBy?: { id: string; name: string; email?: string };
  voidedById?: string;
  voidedByName?: string;
  voidedBy?: { id: string; name: string };
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
  allocations: ReceiptAllocation[];
}

export interface VendorBillLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatPercent: number;
  lineSubtotal: number;
  lineVat: number;
  lineTotal: number;
  certificateId?: string;
  certificateNumber?: string | null;
  participantName?: string | null;
  courseName?: string | null;
}

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE";
  referenceNo?: string;
  bankAccount?: string;
  notes?: string;
  status: "COMPLETED" | "CANCELLED";
  createdByName?: string;
  createdAt?: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  awardingBodyId: string;
  vendorName: string;
  vendorTRN?: string;
  vendorLocation?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  vendorPoBox?: string;
  vendorContactPerson?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  date: string;
  dueDate: string;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  updatedById?: string;
  updatedByName?: string;
  cancelledAt?: string;
  cancelledById?: string;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
  lineItems: VendorBillLineItem[];
  payments: VendorPayment[];
}
