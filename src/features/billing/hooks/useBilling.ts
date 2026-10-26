import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  apiGetInvoices,
  apiGetExpenses,
  apiGetReceipts,
  apiGetVendorBills,
  apiGetClientOptions,
  apiGetFinanceTabStats,
} from "@/lib/api";
import { getActiveRole, checkFeaturePermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { formatAED } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  Receipt as ReceiptIcon,
  TrendingUp,
  FileText,
  Building2,
  Coins,
} from "lucide-react";
import type { StatsCardItem } from "@/components/ui/stats-card";
import type {
  Invoice,
  Expense,
  Receipt,
  VendorBill,
} from "../types/billing.types";

import { useSearchParams } from "react-router-dom";

const ITEMS_PER_PAGE = 12;

export function useBilling() {
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") as
    | "invoices"
    | "expenses"
    | "receipts"
    | "vendor-bills"
    | null;
  const initialTab =
    tabParam && ["invoices", "expenses", "receipts", "vendor-bills"].includes(tabParam)
      ? tabParam
      : "invoices";

  const [activeTab, setActiveTab] = useState<
    "invoices" | "expenses" | "receipts" | "vendor-bills"
  >(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const [invoicePage, setInvoicePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [receiptPage, setReceiptPage] = useState(1);
  const [vendorBillPage, setVendorBillPage] = useState(1);

  const [currentRole, setCurrentRole] = useState(getActiveRole());

  useEffect(() => {
    if (tabParam && ["invoices", "expenses", "receipts", "vendor-bills"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(
        value as "invoices" | "expenses" | "receipts" | "vendor-bills",
      );
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "invoices") {
            next.delete("tab");
          } else {
            next.set("tab", value);
          }
          return next;
        },
        { replace: true },
      );
      setStatusFilter("all");
      setSearchQuery("");
    },
    [setSearchParams],
  );

  // 1. Finance Tab Stats Query (Aggregated section metrics across all records in DB)
  const {
    data: tabStatsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["billing", "tab-stats"],
    queryFn: async () => {
      const res = await apiGetFinanceTabStats();
      return res.data || null;
    },
  });

  // 2. Invoices Query - Only active when on "invoices" tab, paginated 12 per page
  const {
    data: invoicesResponse,
    isLoading: invoicesLoading,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: [
      "billing",
      "invoices",
      invoicePage,
      searchQuery,
      statusFilter,
      selectedYear,
      selectedMonth,
    ],
    queryFn: async () =>
      await apiGetInvoices(
        invoicePage,
        ITEMS_PER_PAGE,
        searchQuery,
        statusFilter,
        selectedYear !== "all" ? Number(selectedYear) : undefined,
        selectedMonth !== "all" ? Number(selectedMonth) : undefined,
      ),
    enabled: activeTab === "invoices",
  });

  // 3. Expenses Query - Only active when on "expenses" tab, paginated 12 per page
  const {
    data: expensesResponse,
    isLoading: expensesLoading,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["billing", "expenses", expensePage, searchQuery, statusFilter],
    queryFn: async () =>
      await apiGetExpenses(
        expensePage,
        ITEMS_PER_PAGE,
        searchQuery,
        statusFilter !== "all" ? statusFilter : undefined,
      ),
    enabled: activeTab === "expenses",
  });

  // 4. Receipts Query - Only active when on "receipts" tab, paginated 12 per page
  const {
    data: receiptsResponse,
    isLoading: receiptsLoading,
    refetch: refetchReceipts,
  } = useQuery({
    queryKey: [
      "billing",
      "receipts",
      receiptPage,
      searchQuery,
      statusFilter,
      selectedYear,
      selectedMonth,
    ],
    queryFn: async () =>
      await apiGetReceipts(
        receiptPage,
        ITEMS_PER_PAGE,
        searchQuery,
        statusFilter,
        selectedYear !== "all" ? Number(selectedYear) : undefined,
        selectedMonth !== "all" ? Number(selectedMonth) : undefined,
      ),
    enabled: activeTab === "receipts",
  });

  // 5. Vendor Bills Query - Only active when on "vendor-bills" tab, paginated 12 per page
  const {
    data: vendorBillsResponse,
    isLoading: vendorBillsLoading,
    refetch: refetchVendorBills,
  } = useQuery({
    queryKey: [
      "billing",
      "vendor-bills",
      vendorBillPage,
      searchQuery,
      statusFilter,
    ],
    queryFn: async () =>
      await apiGetVendorBills(
        vendorBillPage,
        ITEMS_PER_PAGE,
        searchQuery,
        statusFilter,
      ),
    enabled: activeTab === "vendor-bills",
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: qk.clientOptions,
    queryFn: async () => (await apiGetClientOptions()).data || [],
  });

  const loading =
    (activeTab === "invoices" && invoicesLoading) ||
    (activeTab === "expenses" && expensesLoading) ||
    (activeTab === "receipts" && receiptsLoading) ||
    (activeTab === "vendor-bills" && vendorBillsLoading) ||
    statsLoading;

  const queryClient = useQueryClient();

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["billing"] });
    refetchStats();
    if (activeTab === "invoices") refetchInvoices();
    if (activeTab === "expenses") refetchExpenses();
    if (activeTab === "receipts") refetchReceipts();
    if (activeTab === "vendor-bills") refetchVendorBills();
  }, [
    queryClient,
    activeTab,
    refetchStats,
    refetchInvoices,
    refetchExpenses,
    refetchReceipts,
    refetchVendorBills,
  ]);

  useEffect(() => {
    const handleRoleChange = () => setCurrentRole(getActiveRole());
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    return () => {
      window.removeEventListener("accreditOS_role_changed", handleRoleChange);
    };
  }, []);

  // Reset pagination on search or filter change
  useEffect(() => {
    setInvoicePage(1);
    setExpensePage(1);
    setReceiptPage(1);
    setVendorBillPage(1);
  }, [searchQuery, statusFilter, selectedYear, selectedMonth]);

  const invoices = useMemo<Invoice[]>(() => {
    const d = invoicesResponse?.data;
    return Array.isArray(d) ? d : [];
  }, [invoicesResponse]);

  const expenses = useMemo<Expense[]>(() => {
    const d = expensesResponse?.data;
    return Array.isArray(d) ? d : [];
  }, [expensesResponse]);

  const receipts = useMemo<Receipt[]>(() => {
    const d = receiptsResponse?.data;
    return Array.isArray(d) ? d : [];
  }, [receiptsResponse]);

  const vendorBills = useMemo<VendorBill[]>(() => {
    const d = vendorBillsResponse?.data;
    return Array.isArray(d)
      ? d
      : Array.isArray(vendorBillsResponse)
        ? (vendorBillsResponse as any)
        : [];
  }, [vendorBillsResponse]);

  const invoiceTotalPages = useMemo(
    () => invoicesResponse?.pagination?.pages || 1,
    [invoicesResponse],
  );
  const expenseTotalPages = useMemo(
    () => expensesResponse?.pagination?.pages || 1,
    [expensesResponse],
  );
  const receiptTotalPages = useMemo(
    () => receiptsResponse?.pagination?.pages || 1,
    [receiptsResponse],
  );
  const vendorBillTotalPages = useMemo(
    () => vendorBillsResponse?.pagination?.pages || 1,
    [vendorBillsResponse],
  );

  const invoiceTotalCount = useMemo(
    () => invoicesResponse?.pagination?.total ?? invoices.length,
    [invoicesResponse, invoices.length],
  );
  const expenseTotalCount = useMemo(
    () => expensesResponse?.pagination?.total ?? expenses.length,
    [expensesResponse, expenses.length],
  );
  const receiptTotalCount = useMemo(
    () => receiptsResponse?.pagination?.total ?? receipts.length,
    [receiptsResponse, receipts.length],
  );
  const vendorBillTotalCount = useMemo(
    () => vendorBillsResponse?.pagination?.total ?? vendorBills.length,
    [vendorBillsResponse, vendorBills.length],
  );

  const statsItems = useMemo<StatsCardItem[]>(() => {
    if (activeTab === "invoices") {
      const inv = tabStatsData?.invoices || {
        totalBilled: 0,
        totalPaid: 0,
        pendingReceivables: 0,
        totalCount: 0,
        overdueAmount: 0,
        overdueCount: 0,
      };
      return [
        {
          title: "Total Invoiced",
          value: formatAED(inv.totalBilled),
          icon: FileText,
          color: "primary",
          description:
            "Total gross amount billed across all valid, non-cancelled client invoices.",
          loading: statsLoading,
        },
        {
          title: "Cash Collected",
          value: formatAED(inv.totalPaid),
          icon: DollarSign,
          color: "success",
          description:
            "Realized cash and payments received from clients towards invoices.",
          loading: statsLoading,
        },
        {
          title: "Pending Receivables",
          value: formatAED(inv.pendingReceivables),
          icon: Clock,
          color: "warning",
          description:
            "Outstanding receivables balance clients currently owe across all active invoices.",
          loading: statsLoading,
        },
        {
          title: "Total Invoices",
          value: `${inv.totalCount}`,
          icon: TrendingUp,
          color: "info",
          description:
            inv.overdueAmount > 0
              ? `${inv.overdueCount} overdue invoices totaling ${formatAED(inv.overdueAmount)}`
              : "Total number of active, non-cancelled client invoices recorded in the system.",
          loading: statsLoading,
        },
      ];
    }

    if (activeTab === "vendor-bills") {
      const vb = tabStatsData?.vendorBills || {
        totalBilled: 0,
        totalPaid: 0,
        pendingPayable: 0,
        totalCount: 0,
        overdueAmount: 0,
        overdueCount: 0,
      };
      return [
        {
          title: "Total Billed (AP)",
          value: formatAED(vb.totalBilled),
          icon: Building2,
          color: "primary",
          description:
            "Total invoice liabilities billed by awarding bodies and suppliers.",
          loading: statsLoading,
        },
        {
          title: "Paid (Disbursed)",
          value: formatAED(vb.totalPaid),
          icon: DollarSign,
          color: "success",
          description:
            "Total disbursements paid to vendors and awarding bodies.",
          loading: statsLoading,
        },
        {
          title: "Pending Payable",
          value: formatAED(vb.pendingPayable),
          icon: Clock,
          color: "warning",
          description:
            "Outstanding liabilities currently owed to vendors and awarding bodies.",
          loading: statsLoading,
        },
        {
          title: "Total Bills",
          value: `${vb.totalCount}`,
          icon: FileText,
          color: "info",
          description:
            vb.overdueAmount > 0
              ? `${vb.overdueCount} overdue vendor bills totaling ${formatAED(vb.overdueAmount)}`
              : "Total count of active vendor bills recorded in the system.",
          loading: statsLoading,
        },
      ];
    }

    if (activeTab === "expenses") {
      const exp = tabStatsData?.expenses || {
        totalExpenses: 0,
        thisMonthExpenses: 0,
        totalCount: 0,
        topCategory: "General",
      };
      return [
        {
          title: "Total Expenses",
          value: formatAED(exp.totalExpenses),
          icon: ReceiptIcon,
          color: "destructive",
          description:
            "All-time cumulative company operating expenditures, overheads, and trainer costs.",
          loading: statsLoading,
        },
        {
          title: "This Month's",
          value: formatAED(exp.thisMonthExpenses),
          icon: Clock,
          color: "warning",
          description:
            "Operating expenses incurred during the current calendar month.",
          loading: statsLoading,
        },
        {
          title: "Expense Records",
          value: `${exp.totalCount}`,
          icon: FileText,
          color: "info",
          description:
            "Total number of logged operational expense items in the system.",
          loading: statsLoading,
        },
        {
          title: "Petty Cash Float",
          value: formatAED(exp.pettyCashBalance || 0),
          icon: Coins,
          color: "primary",
          description:
            "Current physical cash float available in the office drawer.",
          loading: statsLoading,
        },
      ];
    }

    // Default: "receipts"
    const rc = tabStatsData?.receipts || {
      totalReceipts: 0,
      allocatedAmount: 0,
      unallocatedAmount: 0,
      totalCount: 0,
    };
    return [
      {
        title: "Total Receipts",
        value: formatAED(rc.totalReceipts),
        icon: DollarSign,
        color: "success",
        description:
          "Gross payment collections received from clients across all valid receipts.",
        loading: statsLoading,
      },
      {
        title: "Allocated Funds",
        value: formatAED(rc.allocatedAmount),
        icon: FileText,
        color: "primary",
        description:
          "Receipt funds reconciled and applied to clear client invoice balances.",
        loading: statsLoading,
      },
      {
        title: "Unallocated (Advance)",
        value: formatAED(rc.unallocatedAmount),
        icon: Clock,
        color: "warning",
        description:
          "Customer funds remaining as unallocated advance credit for future invoices.",
        loading: statsLoading,
      },
      {
        title: "Receipts Issued",
        value: `${rc.totalCount}`,
        icon: ReceiptIcon,
        color: "info",
        description:
          "Total number of valid official payment receipts issued to clients.",
        loading: statsLoading,
      },
    ];
  }, [tabStatsData, activeTab, statsLoading]);

  const statusFilterOptions = useMemo(() => {
    if (activeTab === "invoices") {
      return [
        { value: "all", label: "All statuses" },
        { value: "draft", label: "Draft" },
        { value: "issued", label: "Issued" },
        { value: "partially_paid", label: "Partially Paid" },
        { value: "paid", label: "Paid" },
        { value: "cancelled", label: "Cancelled" },
      ];
    }
    if (activeTab === "expenses") {
      return [
        { value: "all", label: "All Expenses" },
        { value: "paid", label: "Company Direct" },
        { value: "not_returned", label: "Not Returned (Owed to Staff)" },
        { value: "returned", label: "Returned to Staff" },
      ];
    }
    if (activeTab === "receipts") {
      return [
        { value: "all", label: "All statuses" },
        { value: "issued", label: "Issued" },
        { value: "paid", label: "Paid" },
        { value: "voided", label: "Voided" },
      ];
    }
    if (activeTab === "vendor-bills") {
      return [
        { value: "all", label: "All statuses" },
        { value: "DRAFT", label: "Draft" },
        { value: "ISSUED", label: "Issued" },
        { value: "PARTIALLY_PAID", label: "Partially Paid" },
        { value: "PAID", label: "Paid" },
        { value: "CANCELLED", label: "Cancelled" },
      ];
    }
    return undefined;
  }, [activeTab]);

  const canCreateInvoice = useMemo(
    () => checkFeaturePermission(currentRole, "create_invoice"),
    [currentRole],
  );
  const canViewInvoiceDetails = useMemo(
    () => checkFeaturePermission(currentRole, "view_invoice_details"),
    [currentRole],
  );
  const canEditInvoice = useMemo(
    () => checkFeaturePermission(currentRole, "edit_invoice"),
    [currentRole],
  );
  const canDeleteInvoice = useMemo(
    () => checkFeaturePermission(currentRole, "delete_invoice"),
    [currentRole],
  );

  return {
    invoices,
    expenses,
    receipts,
    vendorBills,
    clients,
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loading,
    statsItems,
    statusFilterOptions,
    paginatedInvoices: invoices,
    paginatedExpenses: expenses,
    paginatedReceipts: receipts,
    invoiceTotalPages,
    expenseTotalPages,
    receiptTotalPages,
    vendorBillTotalPages,
    invoiceTotalCount,
    expenseTotalCount,
    receiptTotalCount,
    vendorBillTotalCount,
    invoicePage,
    setInvoicePage,
    expensePage,
    setExpensePage,
    receiptPage,
    setReceiptPage,
    vendorBillPage,
    setVendorBillPage,
    currentRole,
    canCreateInvoice,
    canViewInvoiceDetails,
    canEditInvoice,
    canDeleteInvoice,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    setThisMonth: () => {
      const now = new Date();
      setSelectedYear(String(now.getFullYear()));
      setSelectedMonth(String(now.getMonth() + 1));
    },
    setThisYear: () => {
      const now = new Date();
      setSelectedYear(String(now.getFullYear()));
      setSelectedMonth("all");
    },
    clearDateFilter: () => {
      setSelectedYear("all");
      setSelectedMonth("all");
    },
    refresh: refreshData,
  };
}
