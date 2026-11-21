import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

export interface UnifiedCashFlowMetrics {
  realizedCashInflow: number;
  activeReceiptsTotal: number;
  allocatedReceiptsTotal: number;
  unallocatedReceiptsTotal: number;
  operatingCashOutflow: number;
  vendorCashOutflow: number;
  totalCashOutflow: number;
  netCashMovement: number;
  indicativeNetMovementAfterVendorObligations: number;
  indicativeCumulativeNetPositionAfterVendorObligations: number;
  indicativePeriodMovementAfterVendorObligations: number;
  inPeriodInvoiceCollections: number;
  priorPeriodArCollections: number;
}

export interface UnifiedAccrualMetrics {
  grossInvoicedRevenue: number;
  netInvoicedRevenueExVat: number;
  invoicedOutputVat: number;
  billedCertificateCogs: number;
  unbilledCertificateCogs: number;
  totalCertificateCogs: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingResult: number;
  expenseRecognitionBasis: string;
  netRevenue?: number;
  grossProfitMarginPercent?: number;
  netOperatingProfit?: number;
  netOperatingMarginPercent?: number;
}

export interface UnbilledCertificateCommitmentDetail {
  unbilledCount: number;
  netFeeSubtotal: number;
  estimatedInputVat: number;
  grossCommitment: number;
}

export interface UnifiedLiabilitiesMetrics {
  allTimeAccountsReceivable: number;
  selectedPeriodAccountsReceivable: number;
  billedVendorPayables: number;
  unbilledCertificateCommitment: UnbilledCertificateCommitmentDetail;
  totalVendorObligations: number;
  billedCertificatesCount: number;
  unbilledCertificatesCount: number;
  allTimeReceivables?: number;
  currentPeriodReceivables?: number;
}

export interface UnifiedTaxMetrics {
  invoicedOutputVat: number;
  estimatedCollectedOutputVat: number;
  billedInputVatRecorded: number;
  estimatedPaidInputVat: number;
  estimatedUnbilledInputVatCommitment: number;
  indicativeCashBasisVatPosition: number;
  indicativeAccrualBasisVatPosition: number;
  taxTreatmentNotice: string;
}

export interface UnifiedDateBounds {
  start: string | null;
  end: string | null;
}

export interface UnifiedOperationsMetrics {
  activeInvoicesCount: number;
  unpaidInvoicesCount: number;
  trainingsCompletedCount: number;
  certificatesIssuedCount: number;
  activeClientsCount: number;
}

export interface UnifiedFinancialPackage {
  period: string;
  dateBounds: UnifiedDateBounds;
  cashFlow: UnifiedCashFlowMetrics;
  accrual: UnifiedAccrualMetrics;
  liabilities: UnifiedLiabilitiesMetrics;
  tax: UnifiedTaxMetrics;
  operations: UnifiedOperationsMetrics;
}

export interface LegacyFinanceStats {
  revenue: number;
  revenueChange: number;
  expenses: number;
  expensesChange: number;
  profit: number;
  profitChange: number;
  pending: number;
  pendingChange: number;
}

export interface DashboardStats {
  clients: {
    total: number;
    change: number;
  };
  trainings: {
    completed: number;
    change: number;
    upcoming: number;
    pending: number;
  };
  certificates: {
    expiring: number;
  };
  // Null when user lacks finance permission
  finance: LegacyFinanceStats | null;
  cashFlow: UnifiedCashFlowMetrics | null;
  accrual: UnifiedAccrualMetrics | null;
  liabilities: UnifiedLiabilitiesMetrics | null;
  tax: UnifiedTaxMetrics | null;
  unifiedFinancial: UnifiedFinancialPackage | null;
  dateBounds: UnifiedDateBounds;
}

export async function apiGetDashboardStats(
  period: string,
  startDate?: string,
  endDate?: string,
): Promise<ApiResponse<DashboardStats>> {
  let query = `/api/dashboard/stats?period=${encodeURIComponent(period)}`;
  if (startDate) query += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) query += `&endDate=${encodeURIComponent(endDate)}`;

  return fetchApi<DashboardStats>(query);
}

export interface SystemTableFootprint {
  tableName: string;
  sizePretty: string;
  bytes: number;
  approxRows: number;
}

export interface SystemStorageMetrics {
  usedBytes: number;
  usedMb: number;
  usedPretty: string;
  quotaMb: number;
  freeMb: number;
  usedPercent: number;
  freePercent: number;
  databaseName: string;
  provider: string;
  status: "healthy" | "warning" | "critical";
  tables: SystemTableFootprint[];
  timestamp: string;
}

export async function apiGetSystemStorage(): Promise<ApiResponse<SystemStorageMetrics>> {
  return fetchApi<SystemStorageMetrics>("/api/dashboard/system-storage");
}
