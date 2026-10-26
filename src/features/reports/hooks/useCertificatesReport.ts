import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetCertificates } from "@/lib/api/certificateApi";
import { apiGetInvoices } from "@/lib/api/financeApi";
import {
  DateRangePreset,
  getDateRangeBounds,
} from "@/features/certificates/utils/dateRangeUtils";
import {
  NormalizedCertificateReportRow,
  exportCertificatesReportToExcel,
} from "../utils/exportReportExcel";
import { exportCertificatesReportToCsv } from "../utils/exportReportCsv";
import {
  formatReportDate as formatDate,
  formatCertificateNumber,
} from "../utils/reportDateUtils";

export interface CertificatesReportFilters {
  datePreset: DateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
  clientId: string;
  courseId: string;
  awardingBodyId: string;
  invoiceStatus: "all" | "invoiced" | "not_invoiced" | "paid" | "not_paid" | "unpaid";
  invoiceNo?: string;
  serviceType: "all" | "training" | "inspection";
  search: string;
}

export function useCertificatesReport() {
  const [filters, setFilters] = useState<CertificatesReportFilters>({
    datePreset: "this_month",
    clientId: "all",
    courseId: "all",
    awardingBodyId: "all",
    invoiceStatus: "all",
    invoiceNo: "",
    serviceType: "all",
    search: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const dateBounds = useMemo(() => {
    return getDateRangeBounds(
      filters.datePreset,
      filters.customStartDate,
      filters.customEndDate
    );
  }, [filters.datePreset, filters.customStartDate, filters.customEndDate]);

  // Query certificates using active filters
  const {
    data: certsResponse,
    isLoading: isCertsLoading,
    isFetching: isCertsFetching,
    refetch: refetchCerts,
  } = useQuery({
    queryKey: [
      "reports",
      "certificates",
      filters.datePreset,
      dateBounds.startDate,
      dateBounds.endDate,
      filters.clientId,
      filters.courseId,
      filters.awardingBodyId,
      filters.invoiceStatus,
      filters.invoiceNo,
      filters.serviceType,
      filters.search,
    ],
    queryFn: async () => {
      const res = await apiGetCertificates(
        1,
        10000,
        filters.search,
        "all",
        filters.awardingBodyId,
        "all",
        {
          clientId: filters.clientId !== "all" ? filters.clientId : undefined,
          courseId: filters.courseId !== "all" ? filters.courseId : undefined,
          invoiceStatus:
            filters.invoiceStatus !== "all" ? filters.invoiceStatus : undefined,
          invoiceNo: filters.invoiceNo ? filters.invoiceNo : undefined,
          serviceType:
            filters.serviceType !== "all" ? filters.serviceType : undefined,
          fromDate: filters.invoiceNo ? undefined : dateBounds.startDate,
          toDate: filters.invoiceNo ? undefined : dateBounds.endDate,
          dateField: "regDate",
        }
      );
      return res.data || [];
    },
    staleTime: 60_000,
  });

  // Query invoices for line item price/VAT enrichment
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["reports", "invoices"],
    queryFn: async () => {
      try {
        const res = await apiGetInvoices(1, 10000);
        return res.data || [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 60_000,
  });

  // Single Normalized Dataset Pipeline
  const normalizedRows: NormalizedCertificateReportRow[] = useMemo(() => {
    const rawCerts = certsResponse || [];

    // Pre-build O(1) lookup Map for invoice line items to avoid O(C * I * L) nested loops
    const invoiceByCertId = new Map<string, { inv: any; match: any }>();
    const invoiceByCertNum = new Map<string, { inv: any; match: any }>();

    if (Array.isArray(invoices) && invoices.length > 0) {
      for (const inv of invoices) {
        if (inv.status === "cancelled") continue;
        if (Array.isArray(inv.lineItems)) {
          for (const li of inv.lineItems) {
            if (li.certificateId) {
              invoiceByCertId.set(li.certificateId, { inv, match: li });
            }
            if (li.description) {
              const match = li.description.match(/(?:TCT-)?\d+(?:-[A-Za-z]+)?/);
              if (match) {
                invoiceByCertNum.set(match[0].toLowerCase(), { inv, match: li });
              }
            }
          }
        }
      }
    }

    const mapped = rawCerts.map((cert: any) => {
      let linkedInvoice: any = null;
      let lineItemPrice = 0;
      let lineItemVat = 0;

      // 1. Direct authoritative invoiceDetails from backend if available
      if (cert.invoiceDetails) {
        lineItemPrice = cert.invoiceDetails.unitPrice || 0;
        lineItemVat = cert.invoiceDetails.lineVat || 0;
      } else {
        // 2. High-speed O(1) correlation fallback with pre-indexed Map
        const found =
          invoiceByCertId.get(cert.id) ||
          (cert.certificateNumber
            ? invoiceByCertNum.get(cert.certificateNumber.toLowerCase())
            : undefined);
        if (found) {
          linkedInvoice = found.inv;
          lineItemPrice = Number(found.match.unitPrice || found.match.lineSubtotal || 0);
          lineItemVat = Number(found.match.lineVat || lineItemPrice * 0.05);
        }
      }

      const certNo = formatCertificateNumber(
        cert.certificateNumber || cert.awardingBodyName || "N/A"
      );
      const regDate = formatDate(
        cert.regDate || cert.trainingRegDate || cert.issueDate
      );
      const candidate = cert.participantName
        ? cert.participantName.trim().toUpperCase()
        : "N/A";
      const client = cert.company || cert.clientCompanyName || "N/A";
      const course = cert.course || "N/A";
      const mobile =
        cert.participantPhone ||
        cert.phone ||
        cert.mobile ||
        "N/A";
      const issDate = formatDate(
        cert.issueDate || cert.trainingIssueDate || cert.regDate
      );
      const expDate = formatDate(cert.expiryDate);

      // Invoice info
      let invNo = "N/A";
      let invDate = "N/A";
      let isPaid = false;

      if (cert.invoiceDetails) {
        invNo = cert.invoiceDetails.invoiceNumber || "INV-GEN";
        invDate = cert.invoiceDetails.invoiceDate || "N/A";
        isPaid = cert.invoiceDetails.isPaid;
      } else if (linkedInvoice) {
        invNo = linkedInvoice.invoiceNumber || "INV-GEN";
        invDate = formatDate(linkedInvoice.date);
        isPaid =
          linkedInvoice.status === "paid" ||
          Number(linkedInvoice.balance || 0) <= 0;
      } else if (cert.invoiceIssued) {
        invNo = "INV-GEN";
      }

      const isShared =
        cert.status === "sent" ||
        cert.status === "distributed" ||
        cert.status === "printed" ||
        cert.invoiceIssued;
      const shared = isShared ? "YES" : "NO";

      const amount =
        lineItemPrice > 0 ? lineItemPrice : Number(cert.awardingBodyFee || 0);
      const vat5Percent =
        lineItemVat > 0 ? lineItemVat : Number((amount * 0.05).toFixed(2));
      const totalInclVat = Number((amount + vat5Percent).toFixed(2));

      return {
        certificateId: cert.id,
        certNo,
        regDate,
        candidate,
        client,
        course,
        serviceType: cert.serviceType || "training",
        mobile,
        issDate,
        expDate,
        invNo,
        invDate,
        shared,
        amount,
        vat5Percent,
        totalInclVat,
        paid: isPaid ? "TRUE" : "FALSE",
        status: cert.status || "created",
        certificateType: cert.certificateType || "Specific",
        awardingBodyName: cert.awardingBodyName || "Internal Tatweer",
      };
    });

    let result = mapped;

    if (filters.invoiceNo) {
      const invQuery = filters.invoiceNo.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.invNo &&
          r.invNo !== "N/A" &&
          r.invNo.toLowerCase().includes(invQuery)
      );
    } else if (filters.invoiceStatus === "invoiced") {
      result = result.filter((r) => r.invNo !== "N/A");
    } else if (filters.invoiceStatus === "not_invoiced") {
      result = result.filter((r) => r.invNo === "N/A");
    } else if (filters.invoiceStatus === "paid") {
      result = result.filter((r) => r.paid === "TRUE");
    } else if (
      filters.invoiceStatus === "not_paid" ||
      filters.invoiceStatus === "unpaid"
    ) {
      result = result.filter((r) => r.paid !== "TRUE");
    }

    return result;
  }, [certsResponse, invoices, filters.invoiceStatus, filters.invoiceNo]);

  // Single-pass O(N) KPI Summary Statistics
  const summaryStats = useMemo(() => {
    let totalValue = 0;
    let invoicedCertificates = 0;
    let paidCount = 0;
    let inspectionCertificates = 0;
    const candidatesSet = new Set<string>();

    for (let i = 0; i < normalizedRows.length; i++) {
      const r = normalizedRows[i];
      if (r.candidate && r.candidate !== "N/A") {
        candidatesSet.add(r.candidate.toLowerCase());
      }
      if (r.invNo && r.invNo !== "N/A") {
        invoicedCertificates++;
      }
      if (r.paid === "TRUE") {
        paidCount++;
      }
      if (r.serviceType === "inspection") {
        inspectionCertificates++;
      }
      totalValue += r.totalInclVat;
    }

    const totalCertificates = normalizedRows.length;
    const uninvoicedCertificates = totalCertificates - invoicedCertificates;
    const unpaidCount = totalCertificates - paidCount;
    const trainingCertificates = totalCertificates - inspectionCertificates;

    return {
      totalCertificates,
      totalParticipants: candidatesSet.size,
      invoicedCertificates,
      uninvoicedCertificates,
      totalValue,
      paidCount,
      unpaidCount,
      inspectionCertificates,
      trainingCertificates,
    };
  }, [normalizedRows]);

  // Paginated rows for preview table
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return normalizedRows.slice(startIndex, startIndex + pageSize);
  }, [normalizedRows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(normalizedRows.length / pageSize));

  // Export handlers using the exact normalizedRows with optional column selection
  const handleExportExcel = (selectedColumns?: string[]) => {
    const label = dateBounds.label.replace(/\s+/g, "_");
    exportCertificatesReportToExcel(
      normalizedRows,
      `Certificates_Report_${label}`,
      selectedColumns
    );
  };

  const handleExportCsv = (selectedColumns?: string[]) => {
    const label = dateBounds.label.replace(/\s+/g, "_");
    exportCertificatesReportToCsv(
      normalizedRows,
      `Certificates_Report_${label}`,
      selectedColumns
    );
  };

  return {
    filters,
    setFilters,
    dateBounds,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount: normalizedRows.length,
    paginatedRows,
    allRows: normalizedRows,
    summaryStats,
    isLoading: isCertsLoading || isInvoicesLoading,
    isFetching: isCertsFetching,
    refetch: refetchCerts,
    exportExcel: handleExportExcel,
    exportCsv: handleExportCsv,
  };
}
