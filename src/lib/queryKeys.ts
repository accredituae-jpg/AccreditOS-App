export const qk = {
  clients: (filters?: { search?: string; status?: string }) =>
    ["clients", filters ?? {}] as const,
  clientOptions: ["clients", "options"] as const,
  courses: ["courses"] as const,
  certificates: (filters?: {
    page?: number;
    limit?: number;
    search?: string;
    expiryFilter?: string;
    awardingBodyId?: string;
    statusFilter?: string;
  }) => ["certificates", filters ?? {}] as const,
  invoices: (filters?: { search?: string; status?: string }) =>
    ["invoices", filters ?? {}] as const,
  expenses: (filters?: { search?: string }) =>
    ["expenses", filters ?? {}] as const,
  receipts: (filters?: { search?: string; status?: string }) =>
    ["receipts", filters ?? {}] as const,
  vendorBills: (filters?: { search?: string; status?: string }) =>
    ["vendor-bills", filters ?? {}] as const,
  trainings: ["trainings"] as const,
  dashboardStats: (period: string, startDate?: string, endDate?: string) =>
    ["dashboard", period, startDate ?? "", endDate ?? ""] as const,
  invoiceUnbilledCertificates: (clientId: string, serviceType: string) =>
    ["certificates", "unbilled", clientId, serviceType] as const,
  invoiceTypes: ["invoice-types"] as const,
  nextInvoiceNumber: ["invoices", "next-number"] as const,
  pendingClientsSummary: ["finance", "pending-clients-summary"] as const,
  systemStorage: ["system", "storage"] as const,
} as const;
