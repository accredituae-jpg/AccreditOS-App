export interface PendingInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  daysOverdue: number;
  agingBucket: "Current" | "1-30 Days" | "31-60 Days" | "61-90 Days" | "90+ Days";
  description: string;
}

export interface ClientSoaData {
  client: {
    id: string;
    companyName: string;
    contactPerson: string;
    trnNo: string;
    poBox: string;
    location: string;
    phone: string;
    email: string;
  };
  statementDate: string;
  period?: string;
  currency: string;
  remittance: {
    accountName: string;
    bankName: string;
    bankShortName: string;
    accountNumber: string;
    iban: string;
    ibanFormatted: string;
    swiftCode: string;
    branch: string;
  };
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    pendingCount: number;
    overdueCount: number;
    overdueAmount: number;
    aging: {
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      days90Plus: number;
    };
  };
  invoices: PendingInvoiceItem[];
}
