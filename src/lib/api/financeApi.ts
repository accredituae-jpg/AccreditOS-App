import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

// Invoices
export async function apiGetInvoices(
  page: number = 1,
  limit: number = 12,
  search?: string,
  status?: string,
  year?: number,
  month?: number,
): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);
  if (year) params.append("year", String(year));
  if (month) params.append("month", String(month));
  const qs = params.toString();
  return fetchApi(`/api/finance/invoices${qs ? `?${qs}` : ""}`);
}

export async function apiCreateInvoice(data: any): Promise<ApiResponse<any>> {
  return fetchApi("/api/finance/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateInvoice(
  id: string,
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteInvoice(
  id: string,
  permanent: boolean = false,
): Promise<ApiResponse<any>> {
  const query = permanent ? "?permanent=true" : "";
  return fetchApi(`/api/finance/invoices/${id}${query}`, {
    method: "DELETE",
  });
}

export async function apiGetNextInvoiceNumber(): Promise<
  ApiResponse<{ nextNumber: string; nextValue: number }>
> {
  return fetchApi("/api/finance/invoices/next-number");
}

export async function apiGetInvoiceSequence(): Promise<
  ApiResponse<{ currentValue: number; nextValue: number; nextNumber: string }>
> {
  return fetchApi("/api/finance/invoices/sequence");
}

export async function apiUpdateInvoiceSequence(
  nextValue: number,
): Promise<
  ApiResponse<{ currentValue: number; nextValue: number; nextNumber: string }>
> {
  return fetchApi("/api/finance/invoices/sequence", {
    method: "PUT",
    body: JSON.stringify({ nextValue }),
  });
}

// Expenses
export async function apiGetExpenses(
  page: number = 1,
  limit: number = 12,
  search?: string,
  status?: string,
): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);
  const qs = params.toString();
  return fetchApi(`/api/finance/expenses${qs ? `?${qs}` : ""}`);
}

export async function apiCreateExpense(data: any): Promise<ApiResponse<any>> {
  return fetchApi("/api/finance/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateExpense(
  id: string,
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteExpense(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function apiReturnExpense(
  id: string,
  returnedMethod: "account" | "petty_cash" | "cash" = "petty_cash",
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/expenses/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ returnedMethod }),
  });
}

// Receipts
export async function apiGetReceipts(
  page: number = 1,
  limit: number = 12,
  search?: string,
  status?: string,
  year?: number,
  month?: number,
): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);
  if (year) params.append("year", String(year));
  if (month) params.append("month", String(month));
  const qs = params.toString();
  return fetchApi(`/api/finance/receipts${qs ? `?${qs}` : ""}`);
}

export async function apiGetNextReceiptNumber(): Promise<
  ApiResponse<{ nextNumber: string; nextValue: number }>
> {
  return fetchApi("/api/finance/receipts/next-number");
}

export async function apiGetReceiptSequence(): Promise<
  ApiResponse<{ currentValue: number; nextValue: number; nextNumber: string }>
> {
  return fetchApi("/api/finance/receipts/sequence");
}

export async function apiUpdateReceiptSequence(
  nextValue: number,
): Promise<
  ApiResponse<{ currentValue: number; nextValue: number; nextNumber: string }>
> {
  return fetchApi("/api/finance/receipts/sequence", {
    method: "PUT",
    body: JSON.stringify({ nextValue }),
  });
}

export async function apiCreateReceipt(data: any): Promise<ApiResponse<any>> {
  return fetchApi("/api/finance/receipts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateReceipt(
  id: string,
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/receipts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteReceipt(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/receipts/${id}`, {
    method: "DELETE",
  });
}

export async function apiConfirmReceipt(id: string): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/receipts/${id}/confirm`, {
    method: "POST",
  });
}

export async function apiVoidReceipt(
  id: string,
  reason: string,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/receipts/${id}/void`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// Vendor Bills (Accounts Payable)
export async function apiGetVendorBillCandidates(
  awardingBodyId: string,
  from?: string,
  to?: string,
  billId?: string,
): Promise<ApiResponse<any[]>> {
  let url = `/api/finance/vendor-bills/candidates?awardingBodyId=${encodeURIComponent(awardingBodyId)}`;
  if (from) url += `&from=${encodeURIComponent(from)}`;
  if (to) url += `&to=${encodeURIComponent(to)}`;
  if (billId) url += `&billId=${encodeURIComponent(billId)}`;
  return fetchApi(url);
}

export async function apiGetVendorBills(
  page?: number,
  limit?: number,
  search?: string,
  status?: string,
): Promise<ApiResponse<any[]>> {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);
  const qs = params.toString();
  return fetchApi(`/api/finance/vendor-bills${qs ? `?${qs}` : ""}`);
}

export async function apiCreateVendorBill(
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi("/api/finance/vendor-bills", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateVendorBill(
  id: string,
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/vendor-bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateVendorBillStatus(
  id: string,
  status: string,
  cancelReason?: string,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/vendor-bills/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, cancelReason }),
  });
}

export async function apiDeleteVendorBill(
  id: string,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/vendor-bills/${id}`, {
    method: "DELETE",
  });
}

export async function apiRecordVendorPayment(
  id: string,
  data: any,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/vendor-bills/${id}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteVendorPayment(
  billId: string,
  paymentId: string,
): Promise<ApiResponse<any>> {
  return fetchApi(`/api/finance/vendor-bills/${billId}/payments/${paymentId}`, {
    method: "DELETE",
  });
}

export interface VendorCandidateCert {
  id: string;
  certificateNumber: string;
  participantName: string;
  courseName: string;
  issueDate: string;
  fee: number;
}

export interface VendorSummaryItem {
  id: string;
  name: string;
  trnNo: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  contactPerson: string | null;
  paymentTerms: string | null;
  isVatRegistered: boolean;
  vatPercent: number;
  certificateFee: number;
  unbilledCount: number;
  unbilledAmount: number;
  unbilledCertificates: VendorCandidateCert[];
  billedCount: number;
  billedTotalAmount: number;
  billedPaidAmount: number;
  billedBalance: number;
  totalIncurred: number;
  totalPaid: number;
  pendingAmount: number;
  status: "PAID" | "PARTIALLY_PAID" | "PENDING" | "NO_LIABILITY";
  latestBill: any | null;
  bills?: any[];
}

export interface VendorSummariesResponse {
  vendors: VendorSummaryItem[];
  totals: {
    totalIncurred: number;
    totalPaid: number;
    totalPending: number;
    vendorsCount: number;
    pendingVendorsCount: number;
  };
}

export async function apiGetVendorSummaries(): Promise<ApiResponse<VendorSummariesResponse>> {
  return fetchApi("/api/finance/vendor-bills/vendors-summary");
}

export interface ClientSummaryItem {
  id: string;
  name: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  trnNo: string;
  location: string;
  poBox: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalInvoicesCount: number;
  unpaidCount: number;
  overdueAmount: number;
  overdueCount: number;
  status: "PAID" | "PARTIALLY_PAID" | "PENDING";
  latestInvoice?: {
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    totalAmount: number;
    balance: number;
    status: string;
  } | null;
}

export interface ClientsSummaryResponse {
  clients: ClientSummaryItem[];
  totals: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    clientsCount: number;
    pendingClientsCount: number;
  };
}

export async function apiGetClientsSummary(): Promise<ApiResponse<ClientsSummaryResponse>> {
  return fetchApi("/api/finance/clients-summary");
}

export async function apiPayVendor(data: {
  awardingBodyId: string;
  certificateIds?: string[];
  amount: number;
  paymentDate: string;
  paymentMethod: "BANK_TRANSFER" | "CHEQUE" | "CASH";
  referenceNo?: string;
  bankAccount?: string;
  notes?: string;
  isVatEnabled?: boolean;
}): Promise<ApiResponse<any>> {
  return fetchApi("/api/finance/vendor-bills/pay-vendor", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface FinanceTabStats {
  invoices: {
    totalBilled: number;
    totalPaid: number;
    pendingReceivables: number;
    totalCount: number;
    overdueAmount: number;
    overdueCount: number;
  };
  vendorBills: {
    totalBilled: number;
    totalPaid: number;
    pendingPayable: number;
    totalCount: number;
    overdueAmount: number;
    overdueCount: number;
  };
  expenses: {
    totalExpenses: number;
    thisMonthExpenses: number;
    totalCount: number;
    topCategory: string;
    pettyCashBalance?: number;
  };
  receipts: {
    totalReceipts: number;
    allocatedAmount: number;
    unallocatedAmount: number;
    totalCount: number;
  };
}

export async function apiGetFinanceTabStats(): Promise<
  ApiResponse<FinanceTabStats>
> {
  return fetchApi<FinanceTabStats>("/api/finance/stats");
}

export interface CashbookTransactionItem {
  id: string;
  date: string;
  flow: "in" | "out";
  type: "receipt" | "expense" | "vendor_payment" | "payroll";
  category: string;
  refNo: string;
  partyName: string;
  paymentMethod: string;
  amount: number;
  description: string;
  runningBalance: number;
}

export interface CashbookBalances {
  bank: number;
  cashInHand: number;
  pettyCash: number;
  totalLiquidFunds: number;
}

export interface CashbookSummary {
  totalIn: number;
  totalOut: number;
  netCashFlow: number;
  countIn: number;
  countOut: number;
  totalTransactions: number;
  openingBalance?: number;
  closingBalance?: number;
  balances?: CashbookBalances;
}

export interface CashbookResponse {
  summary: CashbookSummary;
  transactions: CashbookTransactionItem[];
}

export async function apiGetCashbook(params?: {
  fromDate?: string;
  toDate?: string;
  flow?: string;
  search?: string;
}): Promise<ApiResponse<CashbookResponse>> {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.flow && params.flow !== "all") query.set("flow", params.flow);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return fetchApi<CashbookResponse>(
    `/api/finance/cashbook${qs ? `?${qs}` : ""}`,
  );
}

export interface PettyCashSummary {
  pettyCashBalance: number;
  totalTopUps: number;
  totalPettySpent: number;
  cashInHandBalance: number;
  totalCashReceipts: number;
  totalCashExpenses: number;
  topUpsFromCash: number;
  recentTopUps: {
    id: string;
    amount: number;
    date: string;
    source: "cash" | "account";
    notes: string;
    createdByName: string;
  }[];
}

export async function apiGetPettyCashSummary(): Promise<
  ApiResponse<PettyCashSummary>
> {
  return fetchApi<PettyCashSummary>("/api/finance/petty-cash/summary");
}

export async function apiAddPettyCashTopUp(data: {
  amount: number;
  date?: string;
  source: "cash" | "account";
  notes?: string;
}): Promise<ApiResponse<any>> {
  return fetchApi<any>("/api/finance/petty-cash/top-ups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface PendingClientsSummary {
  pendingInvoicing: Record<
    string,
    { count: number; certCount: number; inspectionCount: number }
  >;
  pendingReceipts: Record<string, { count: number; totalBalance: number }>;
}

export async function apiGetPendingClientsSummary(): Promise<
  ApiResponse<PendingClientsSummary>
> {
  return fetchApi<PendingClientsSummary>("/api/finance/pending-clients-summary");
}
