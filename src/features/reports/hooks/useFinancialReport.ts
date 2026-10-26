import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetInvoices } from "@/lib/api/financeApi";
import {
  DateRangePreset,
  getDateRangeBounds,
} from "@/features/certificates/utils/dateRangeUtils";
import {
  exportGenericReportToExcel,
  exportCustomReportToExcel,
} from "../utils/exportReportExcel";
import { exportGenericReportToCsv } from "../utils/exportReportCsv";
import { formatReportDate, parseReportDate } from "../utils/reportDateUtils";

export function useFinancialReport() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const dateBounds = useMemo(() => {
    return getDateRangeBounds(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  const { data: rawInvoices = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["reports", "financial", datePreset, dateBounds.startDate, dateBounds.endDate],
    queryFn: async () => {
      const res = await apiGetInvoices(1, 10000);
      return res.data || [];
    },
    staleTime: 60_000,
  });

  // Filter invoices strictly according to authoritative financial rules
  const filteredInvoices = useMemo(() => {
    return rawInvoices.filter((inv: any) => {
      if (inv.status === "cancelled") return false;

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "paid" && inv.status !== "paid" && Number(inv.balance) > 0) return false;
        if (statusFilter === "partially_paid" && inv.status !== "partially_paid") return false;
        if (statusFilter === "issued" && inv.status !== "issued") return false;
        if (statusFilter === "draft" && inv.status !== "draft") return false;
      }

      // Date filtering based on invoice date (or createdAt fallback)
      if (dateBounds.startDate || dateBounds.endDate) {
        const invDate = parseReportDate(inv.date) || parseReportDate(inv.createdAt);
        if (!invDate) return false;
        if (dateBounds.startDate) {
          const s = new Date(dateBounds.startDate);
          s.setHours(0, 0, 0, 0);
          if (invDate < s) return false;
        }
        if (dateBounds.endDate) {
          const e = new Date(dateBounds.endDate);
          e.setHours(23, 59, 59, 999);
          if (invDate > e) return false;
        }
      }

      // Client filter
      if (clientId !== "all") {
        if (
          inv.clientId !== clientId &&
          inv.client?.id !== clientId &&
          inv.clientName?.toLowerCase() !== clientId.toLowerCase()
        ) {
          return false;
        }
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const num = (inv.invoiceNumber || "").toLowerCase();
        const client = (inv.clientName || inv.client?.companyName || "").toLowerCase();
        if (!num.includes(q) && !client.includes(q)) return false;
      }

      return true;
    });
  }, [rawInvoices, statusFilter, clientId, dateBounds, search]);

  // Aggregate authoritative KPIs
  const summaryMetrics = useMemo(() => {
    let totalInvoiced = 0;
    let cashCollected = 0;
    let pendingAR = 0;
    let totalVat = 0;
    let validInvoiceCount = 0;

    for (const inv of filteredInvoices) {
      const isDraft = inv.status === "draft";
      const total = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const bal = Number(inv.balance || 0);
      const vat = Number(inv.vatAmount || 0);

      // Drafts are unissued pro-forma quotes and do not constitute legal Accounts Receivable
      // unless the user specifically selects "draft" filter to inspect drafts.
      if (!isDraft || statusFilter === "draft") {
        totalInvoiced += total;
        cashCollected += paid;
        pendingAR += bal;
        totalVat += vat;
        validInvoiceCount++;
      }
    }

    // Round strictly to 2 decimal places
    totalInvoiced = Math.round(totalInvoiced * 100) / 100;
    cashCollected = Math.round(cashCollected * 100) / 100;
    pendingAR = Math.round(pendingAR * 100) / 100;
    totalVat = Math.round(totalVat * 100) / 100;

    return {
      totalInvoiced,
      cashCollected,
      pendingAR,
      totalVat,
      invoiceCount: validInvoiceCount,
      isConserved: Math.abs(totalInvoiced - (cashCollected + pendingAR)) < 0.05,
    };
  }, [filteredInvoices, statusFilter]);

  // Paginated slice
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));

  // Export handlers
  const exportExcel = (selectedColumns?: string[]) => {
    const rows = filteredInvoices.map((inv: any) => ({
      "INVOICE NO": inv.invoiceNumber,
      "DATE": formatReportDate(inv.date),
      "CLIENT": inv.clientName || inv.client?.companyName || "N/A",
      "SUBTOTAL": Number(inv.subtotal || 0),
      "DISCOUNT": Number(inv.discountAmount || 0),
      "VAT 5%": Number(inv.vatAmount || 0),
      "TOTAL (AED)": Number(inv.totalAmount || 0),
      "PAID (AED)": Number(inv.paidAmount || 0),
      "BALANCE": Number(inv.balance || 0),
      "STATUS": (inv.status || "").toUpperCase(),
    }));

    const defaultKeys = [
      "INVOICE NO",
      "DATE",
      "CLIENT",
      "SUBTOTAL",
      "DISCOUNT",
      "VAT 5%",
      "TOTAL (AED)",
      "PAID (AED)",
      "BALANCE",
      "STATUS",
    ];

    const columnsToExport =
      selectedColumns && selectedColumns.length > 0
        ? selectedColumns
        : defaultKeys;

    exportCustomReportToExcel(
      "Financial Report",
      rows,
      columnsToExport,
      "Financial_Report"
    );
  };

  const exportCsv = (selectedColumns?: string[]) => {
    const defaultHeaders = [
      "INVOICE NO",
      "DATE",
      "CLIENT",
      "SUBTOTAL",
      "DISCOUNT",
      "VAT 5%",
      "TOTAL (AED)",
      "PAID (AED)",
      "BALANCE",
      "STATUS",
    ];

    const headers =
      selectedColumns && selectedColumns.length > 0
        ? selectedColumns
        : defaultHeaders;

    const rows = filteredInvoices.map((inv: any) => ({
      "INVOICE NO": inv.invoiceNumber,
      "DATE": formatReportDate(inv.date),
      "CLIENT": inv.clientName || inv.client?.companyName || "N/A",
      "SUBTOTAL": Number(inv.subtotal || 0),
      "DISCOUNT": Number(inv.discountAmount || 0),
      "VAT 5%": Number(inv.vatAmount || 0),
      "TOTAL (AED)": Number(inv.totalAmount || 0),
      "PAID (AED)": Number(inv.paidAmount || 0),
      "BALANCE": Number(inv.balance || 0),
      "STATUS": (inv.status || "").toUpperCase(),
    }));

    exportGenericReportToCsv(headers, rows, "Financial_Report");
  };

  return {
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    statusFilter,
    setStatusFilter,
    clientId,
    setClientId,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    dateBounds,
    totalPages,
    totalCount: filteredInvoices.length,
    paginatedInvoices,
    summaryMetrics,
    isLoading,
    isFetching,
    refetch,
    exportExcel,
    exportCsv,
  };
}
