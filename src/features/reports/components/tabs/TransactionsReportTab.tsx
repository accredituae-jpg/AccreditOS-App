import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  apiGetCashbook,
  CashbookTransactionItem,
  CashbookSummary,
} from "@/lib/api/financeApi";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  X,
  Building2,
  Receipt,
  CreditCard,
  Coins,
  Landmark,
  Banknote,
  UserCheck,
  SlidersHorizontal,
  Layers,
  Eye,
  ArrowUpDown,
  Check,
  Copy,
  Info,
} from "lucide-react";
import { TopUpPettyCashDialog } from "@/features/billing/dialogs/TopUpPettyCashDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getActiveRole } from "@/lib/permissions";
import { formatAED, cn } from "@/lib/utils";
import {
  DateRangePreset,
  getDateRangeBounds,
  MONTH_OPTIONS,
  getMonthYearDateBounds,
} from "@/features/certificates/utils/dateRangeUtils";
import { apiGetInvoices } from "@/lib/api/financeApi";
import { exportCustomReportToExcel } from "../../utils/exportReportExcel";
import { exportGenericReportToCsv } from "../../utils/exportReportCsv";
import { formatReportDate, parseReportDate } from "../../utils/reportDateUtils";

const CASHBOOK_COLUMNS = [
  "DATE",
  "REF NO",
  "TYPE",
  "PARTY / ENTITY",
  "PAYMENT METHOD",
  "DESCRIPTION",
  "CASH IN (AED)",
  "CASH OUT (AED)",
  "BALANCE (AED)",
];

type TransactionTypeFilter =
  | "all"
  | "receipt"
  | "expense"
  | "payroll"
  | "vendor_payment"
  | "petty_cash"
  | "bank_deposit";

type PaymentMethodFilter = "all" | "bank" | "cash" | "petty_cash";

type AmountRangeFilter =
  | "all"
  | "under_500"
  | "500_to_2500"
  | "2500_to_10000"
  | "over_10000";

type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type BalanceDisplayMode = "stream" | "master";

interface EnrichedTransactionItem extends CashbookTransactionItem {
  streamRunningBalance: number;
}

export function TransactionsReportTab() {
  const [activeRole, setActiveRole] = useState(getActiveRole());

  React.useEffect(() => {
    const handler = () => setActiveRole(getActiveRole());
    window.addEventListener("accreditOS_role_changed", handler);
    window.addEventListener("auth_changed", handler);
    return () => {
      window.removeEventListener("accreditOS_role_changed", handler);
      window.removeEventListener("auth_changed", handler);
    };
  }, []);

  const isAuthorized =
    activeRole === "super_admin" ||
    (activeRole as string) === "developer" ||
    activeRole === "admin" ||
    activeRole === "operation_admin";

  // Filter states
  const [filterMode, setFilterMode] = useState<
    "month_select" | "preset" | "custom"
  >("month_select");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth()),
  );
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [flowFilter, setFlowFilter] = useState<"all" | "in" | "out">("all");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("all");
  const [amountRange, setAmountRange] = useState<AmountRangeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [search, setSearch] = useState("");

  // Balance display mode: 'stream' calculates running total for the active filter; 'master' shows total cash across all accounts
  const [balanceDisplayMode, setBalanceDisplayMode] =
    useState<BalanceDisplayMode>("stream");

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [transferInitialMode, setTransferInitialMode] = useState<
    "topup" | "deposit"
  >("topup");
  const [selectedTransaction, setSelectedTransaction] =
    useState<EnrichedTransactionItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const dateBounds = useMemo(() => {
    if (filterMode === "month_select") {
      return getMonthYearDateBounds(parseInt(selectedYear, 10), selectedMonth);
    }
    return getDateRangeBounds(datePreset, customStartDate, customEndDate);
  }, [
    filterMode,
    selectedYear,
    selectedMonth,
    datePreset,
    customStartDate,
    customEndDate,
  ]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "reports",
      "cashbook",
      filterMode,
      selectedYear,
      selectedMonth,
      datePreset,
      dateBounds.startDate,
      dateBounds.endDate,
      flowFilter,
      search,
    ],
    queryFn: async () => {
      const res = await apiGetCashbook({
        fromDate: datePreset !== "all" ? dateBounds.startDate : undefined,
        toDate: datePreset !== "all" ? dateBounds.endDate : undefined,
        flow: flowFilter,
        search: search.trim() || undefined,
      });
      return res.data || { summary: null, transactions: [] };
    },
    enabled: isAuthorized,
    staleTime: 60_000,
  });

  // Query Invoices for authoritative period revenue / sales billed
  const { data: rawInvoices = [] } = useQuery({
    queryKey: ["reports", "invoices-for-transactions"],
    queryFn: async () => {
      const res = await apiGetInvoices(1, 10000);
      return res.data || [];
    },
    enabled: isAuthorized,
    staleTime: 60_000,
  });

  const periodInvoicedRevenue = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const inv of rawInvoices) {
      if (inv.status === "cancelled") continue;
      const invDate =
        parseReportDate(inv.date) || parseReportDate(inv.createdAt);
      if (!invDate) continue;
      if (dateBounds.startDate) {
        const s = new Date(dateBounds.startDate);
        s.setHours(0, 0, 0, 0);
        if (invDate < s) continue;
      }
      if (dateBounds.endDate) {
        const e = new Date(dateBounds.endDate);
        e.setHours(23, 59, 59, 999);
        if (invDate > e) continue;
      }
      total += Number(inv.totalAmount || 0);
      count++;
    }
    return { total, count };
  }, [rawInvoices, dateBounds]);

  const rawTransactions: CashbookTransactionItem[] = data?.transactions || [];
  const summary: CashbookSummary = data?.summary || {
    totalIn: 0,
    totalOut: 0,
    netCashFlow: 0,
    countIn: 0,
    countOut: 0,
    totalTransactions: 0,
  };

  // Type-specific counts and sums computed from the current date-range dataset
  const typeMetrics = useMemo(() => {
    let receiptsCount = 0;
    let receiptsSum = 0;
    let expensesCount = 0;
    let expensesSum = 0;
    let payrollCount = 0;
    let payrollSum = 0;
    let vendorCount = 0;
    let vendorSum = 0;
    let pettyCount = 0;
    let pettyInSum = 0;
    let pettyOutSum = 0;

    let depositCount = 0;
    let depositSum = 0;

    for (const t of rawTransactions) {
      if (t.type === "receipt") {
        receiptsCount++;
        receiptsSum += t.amount;
      } else if (t.type === "payroll") {
        payrollCount++;
        payrollSum += t.amount;
      } else if (t.type === "vendor_payment") {
        vendorCount++;
        vendorSum += t.amount;
      } else if (t.type === "bank_deposit") {
        depositCount++;
        depositSum += t.amount;
      } else if (
        t.type === "petty_cash_topup" ||
        t.type === "petty_cash_deposit" ||
        (t.paymentMethod || "").toLowerCase().includes("petty")
      ) {
        pettyCount++;
        if (t.flow === "in") {
          pettyInSum += t.amount;
        } else {
          pettyOutSum += t.amount;
        }
      } else if (t.type === "expense") {
        expensesCount++;
        expensesSum += t.amount;
      }
    }

    const totalBusinessExpenses =
      payrollSum + vendorSum + expensesSum + pettyOutSum;
    const netCashMovement = receiptsSum - totalBusinessExpenses;

    return {
      receiptsCount,
      receiptsSum,
      expensesCount,
      expensesSum,
      payrollCount,
      payrollSum,
      vendorCount,
      vendorSum,
      pettyCount,
      pettyInSum,
      pettyOutSum,
      pettyNet: pettyInSum - pettyOutSum,
      depositCount,
      depositSum,
      totalBusinessExpenses,
      netCashMovement,
    };
  }, [rawTransactions]);

  // Client-side filtering & sorting for instant response without server latency
  const filteredTransactions = useMemo(() => {
    let list = [...rawTransactions];

    // 1. Transaction Type / Stream
    if (typeFilter !== "all") {
      if (typeFilter === "petty_cash") {
        list = list.filter(
          (t) =>
            t.type !== "petty_cash_transfer" &&
            ((t.paymentMethod || "").toLowerCase().includes("petty") ||
              t.type === "petty_cash_topup" ||
              t.type === "petty_cash_deposit"),
        );
      } else if (typeFilter === "bank_deposit") {
        list = list.filter((t) => t.type === "bank_deposit");
      } else if (typeFilter === "expense") {
        list = list.filter(
          (t) =>
            t.type === "expense" &&
            !(t.paymentMethod || "").toLowerCase().includes("petty"),
        );
      } else {
        list = list.filter((t) => t.type === typeFilter);
      }
    }

    // 2. Payment Method / Account Filter
    if (paymentMethodFilter !== "all") {
      list = list.filter((t) => {
        const m = (t.paymentMethod || "").toLowerCase();
        if (paymentMethodFilter === "bank") {
          return (
            m.includes("account") ||
            m.includes("bank") ||
            m.includes("card") ||
            m.includes("wire") ||
            m.includes("transfer")
          );
        }
        if (paymentMethodFilter === "cash") {
          return m.includes("cash") && !m.includes("petty");
        }
        if (paymentMethodFilter === "petty_cash") {
          return m.includes("petty");
        }
        return true;
      });
    }

    // 3. Amount Range Filter
    if (amountRange !== "all") {
      list = list.filter((t) => {
        const amt = t.amount;
        if (amountRange === "under_500") return amt < 500;
        if (amountRange === "500_to_2500") return amt >= 500 && amt <= 2500;
        if (amountRange === "2500_to_10000") return amt > 2500 && amt <= 10000;
        if (amountRange === "over_10000") return amt > 10000;
        return true;
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "date_asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "amount_desc") {
        return b.amount - a.amount;
      }
      if (sortBy === "amount_asc") {
        return a.amount - b.amount;
      }
      // default: date_desc (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return list;
  }, [rawTransactions, typeFilter, paymentMethodFilter, amountRange, sortBy]);

  // Is a sub-filter active? (Stream, single flow, single method, amount range, or search)
  const isFilteredStream = useMemo(() => {
    return (
      typeFilter !== "all" ||
      flowFilter !== "all" ||
      paymentMethodFilter !== "all" ||
      amountRange !== "all" ||
      Boolean(search.trim())
    );
  }, [typeFilter, flowFilter, paymentMethodFilter, amountRange, search]);

  // Dynamic Running Balance title based on active filter stream
  const balanceColumnHeader = useMemo(() => {
    if (balanceDisplayMode === "master" || !isFilteredStream) {
      return "Passbook Running Balance";
    }
    if (typeFilter === "payroll") return "Cumulative Payroll Disbursed";
    if (typeFilter === "receipt" || flowFilter === "in")
      return "Cumulative Collections";
    if (typeFilter === "expense") return "Cumulative Expenses";
    if (typeFilter === "vendor_payment") return "Cumulative Vendor Dues Paid";
    if (typeFilter === "petty_cash") return "Petty Cash Drawer Balance";
    if (paymentMethodFilter === "bank") return "Bank Account Balance";
    if (paymentMethodFilter === "cash") return "Cash in Hand Balance";
    if (paymentMethodFilter === "petty_cash")
      return "Petty Cash Drawer Balance";
    return "Tab Ledger Balance";
  }, [
    balanceDisplayMode,
    isFilteredStream,
    typeFilter,
    flowFilter,
    paymentMethodFilter,
  ]);

  // Compute tab running balances chronologically: Deposit (+) adds, Debit (-) subtracts
  // e.g. Deposit 500 then Debit 200 = Balance 300
  const transactionsWithStreamBalance = useMemo<
    EnrichedTransactionItem[]
  >(() => {
    // 1. Sort chronologically ascending (oldest to newest) to accumulate balance correctly
    const chronological = [...filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const streamBalanceMap = new Map<string, number>();

    const hasInflows = chronological.some((t) => t.flow === "in");
    const hasOutflows = chronological.some((t) => t.flow === "out");
    const isPureOutflowStream = !hasInflows && hasOutflows;

    // Initial starting balance:
    // When viewing all streams without sub-filters, use the period opening balance.
    // When viewing a specific tab or filtered stream, start from 0 so Deposit 500 then Debit 200 = 300.
    let running = 0;
    if (!isFilteredStream && datePreset !== "all") {
      running = summary.openingBalance ?? 0;
    }

    for (const item of chronological) {
      if (isPureOutflowStream) {
        // Tab has ONLY outflows (e.g. Staff Payroll, pure Expenses):
        // accumulate cumulative total disbursed in positive numbers
        running += item.amount;
      } else if (item.flow === "in") {
        running += item.amount;
      } else {
        running -= item.amount;
      }
      streamBalanceMap.set(item.id, Math.round(running * 100) / 100);
    }

    return filteredTransactions.map((t) => ({
      ...t,
      streamRunningBalance: streamBalanceMap.get(t.id) ?? t.runningBalance,
    }));
  }, [
    filteredTransactions,
    isFilteredStream,
    datePreset,
    summary.openingBalance,
  ]);

  // Filtered view summary totals (reflecting active sub-filters)
  const filteredSummary = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    for (const t of filteredTransactions) {
      if (t.flow === "in") inTotal += t.amount;
      else outTotal += t.amount;
    }
    return {
      count: filteredTransactions.length,
      inTotal,
      outTotal,
      net: inTotal - outTotal,
    };
  }, [filteredTransactions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterMode === "preset" && datePreset !== "this_month") count++;
    if (filterMode === "custom") count++;
    if (filterMode === "month_select" && selectedMonth !== "all") count++;
    if (flowFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (paymentMethodFilter !== "all") count++;
    if (amountRange !== "all") count++;
    if (sortBy !== "date_desc") count++;
    if (search.trim()) count++;
    return count;
  }, [
    filterMode,
    selectedMonth,
    datePreset,
    flowFilter,
    typeFilter,
    paymentMethodFilter,
    amountRange,
    sortBy,
    search,
  ]);

  const resetAllFilters = () => {
    setFilterMode("month_select");
    setSelectedYear("2026");
    setSelectedMonth(String(new Date().getMonth()));
    setDatePreset("this_month");
    setCustomStartDate("");
    setCustomEndDate("");
    setFlowFilter("all");
    setTypeFilter("all");
    setPaymentMethodFilter("all");
    setAmountRange("all");
    setSortBy("date_desc");
    setSearch("");
    setBalanceDisplayMode("stream");
    setPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(transactionsWithStreamBalance.length / pageSize),
  );
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return transactionsWithStreamBalance.slice(start, start + pageSize);
  }, [transactionsWithStreamBalance, page, pageSize]);

  const exportExcel = () => {
    const rows = transactionsWithStreamBalance.map((t) => ({
      DATE: formatReportDate(t.date),
      "REF NO": t.refNo,
      TYPE: t.category,
      "PARTY / ENTITY": t.partyName,
      "PAYMENT METHOD": t.paymentMethod,
      DESCRIPTION: t.description,
      "CASH IN (AED)": t.flow === "in" ? t.amount : 0,
      "CASH OUT (AED)": t.flow === "out" ? t.amount : 0,
      [balanceColumnHeader]:
        balanceDisplayMode === "stream" && isFilteredStream
          ? t.streamRunningBalance
          : t.runningBalance,
      "MASTER ACCOUNT BALANCE (AED)": t.runningBalance,
    }));

    exportCustomReportToExcel(
      "Transactions Passbook Report",
      rows,
      [...CASHBOOK_COLUMNS, balanceColumnHeader],
      `Transactions_Passbook_${dateBounds?.label?.replace(/\s+/g, "_") || "Report"}`,
    );
  };

  const exportCsv = () => {
    const rows = transactionsWithStreamBalance.map((t) => ({
      DATE: formatReportDate(t.date),
      "REF NO": t.refNo,
      TYPE: t.category,
      "PARTY / ENTITY": t.partyName,
      "PAYMENT METHOD": t.paymentMethod,
      DESCRIPTION: t.description,
      "CASH IN (AED)": t.flow === "in" ? t.amount : 0,
      "CASH OUT (AED)": t.flow === "out" ? t.amount : 0,
      [balanceColumnHeader]:
        balanceDisplayMode === "stream" && isFilteredStream
          ? t.streamRunningBalance
          : t.runningBalance,
      "MASTER ACCOUNT BALANCE (AED)": t.runningBalance,
    }));

    exportGenericReportToCsv(
      [...CASHBOOK_COLUMNS, balanceColumnHeader],
      rows,
      `Transactions_Passbook_${dateBounds?.label?.replace(/\s+/g, "_") || "Report"}`,
    );
  };

  const handleCopyRef = (refNo: string) => {
    navigator.clipboard.writeText(refNo);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (!isAuthorized) {
    return (
      <Card className="p-8 text-center border-border/80 bg-muted/20">
        <h4 className="text-sm font-semibold text-foreground">
          Access Restricted
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          The Transactions Passbook ledger is restricted to Administrator and
          Developer accounts.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. THE 4 PRIMARY METRIC CARDS (Simple, Normal Names - 2 Col on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Revenue (Total Invoiced) */}
        <Card className="p-3 sm:p-4 border-border/80 shadow-xs bg-card hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 truncate">
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Revenue</span>
            </span>
            <Badge
              variant="outline"
              className="text-[9px] sm:text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium hidden sm:inline-flex"
            >
              Sales Billed
            </Badge>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <span className="text-base sm:text-2xl font-bold font-mono text-foreground truncate block">
              {formatAED(periodInvoicedRevenue.total)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
            {periodInvoicedRevenue.count} invoices issued
          </p>
        </Card>

        {/* Card 2: Cash Received */}
        <Card className="p-3 sm:p-4 border-border/80 shadow-xs bg-card hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cash Received</span>
            </span>
            <Badge
              variant="outline"
              className="text-[9px] sm:text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium hidden sm:inline-flex"
            >
              Realized
            </Badge>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <span className="text-base sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate block">
              +{formatAED(typeMetrics.receiptsSum)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
            {typeMetrics.receiptsCount} payments received
          </p>
        </Card>

        {/* Card 3: Total Expenses */}
        <Card className="p-3 sm:p-4 border-border/80 shadow-xs bg-card hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 truncate">
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Expenses</span>
            </span>
            <Badge
              variant="outline"
              className="text-[9px] sm:text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium hidden sm:inline-flex"
            >
              Outflows
            </Badge>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <span className="text-base sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 truncate block">
              -{formatAED(typeMetrics.totalBusinessExpenses)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Salaries, fees, supplies
          </p>
        </Card>

        {/* Card 4: Net Profit / Cash Movement */}
        <Card className="p-3 sm:p-4 border-border/80 shadow-xs bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 truncate">
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Net Movement</span>
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] sm:text-[10px] font-medium hidden sm:inline-flex",
                typeMetrics.netCashMovement >= 0
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20",
              )}
            >
              {typeMetrics.netCashMovement >= 0
                ? "Surplus"
                : "Deficit"}
            </Badge>
          </div>
          <div className="mt-2 sm:mt-2.5">
            <span
              className={cn(
                "text-base sm:text-2xl font-bold font-mono truncate block",
                typeMetrics.netCashMovement >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {typeMetrics.netCashMovement >= 0 ? "+" : ""}
              {formatAED(typeMetrics.netCashMovement)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Operating:{" "}
            <span className="font-mono font-medium">
              {formatAED(
                periodInvoicedRevenue.total - typeMetrics.totalBusinessExpenses,
              )}
            </span>
          </p>
        </Card>
      </div>

      {/* 3. DETAILED EXPENSE BREAKDOWN (Where money was spent) */}
      <Card className="p-3.5 sm:p-4 border-border/80 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Where Money Was Spent In This Period (
            {dateBounds?.label || "Selected Scope"})
          </span>
          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
            Total Spent: -{formatAED(typeMetrics.totalBusinessExpenses)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Salaries */}
          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Staff Salaries</span>
            </div>
            <div className="font-mono font-bold text-sm text-foreground mt-1">
              {formatAED(typeMetrics.payrollSum)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {typeMetrics.payrollCount} salary payouts
            </div>
          </div>

          {/* Awarding Body Fees */}
          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span>Vendor / Awarding Body</span>
            </div>
            <div className="font-mono font-bold text-sm text-foreground mt-1">
              {formatAED(typeMetrics.vendorSum)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {typeMetrics.vendorCount} certificate fees
            </div>
          </div>

          {/* Office & Daily Expenses */}
          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Office & Daily Expenses</span>
            </div>
            <div className="font-mono font-bold text-sm text-foreground mt-1">
              {formatAED(typeMetrics.expensesSum)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {typeMetrics.expensesCount} expenses (stationery, food, travel)
            </div>
          </div>

          {/* Petty Cash Outflows */}
          <div className="p-2.5 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Coins className="w-3.5 h-3.5 text-purple-500" />
              <span>Petty Cash Float Spent</span>
            </div>
            <div className="font-mono font-bold text-sm text-foreground mt-1">
              {formatAED(typeMetrics.pettyOutSum)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Direct cash drawer expenses
            </div>
          </div>
        </div>
      </Card>

      {/* 3. MULTI-DIMENSIONAL FILTER CONTROLS */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs bg-card/60 backdrop-blur-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap leading-tight">
                  Passbook Filter Command
                </span>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="hidden sm:inline-flex text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 px-1.5 py-0"
                  >
                    {activeFilterCount} Active
                  </Badge>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate leading-tight mt-0.5">
                Filter by date, stream, payment account, amount tier, and sort order
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTransferInitialMode("deposit");
                setTopUpOpen(true);
              }}
              className="h-8 text-xs font-semibold text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 cursor-pointer hidden md:flex items-center"
              title="Deposit drawer cash into company bank account"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Deposit to Bank</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTransferInitialMode("topup");
                setTopUpOpen(true);
              }}
              className="h-8 text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer hidden sm:flex items-center"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>+ Top Up Petty Cash</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="sm:hidden h-8 px-2.5 text-xs flex items-center gap-1.5 font-medium bg-muted/40 shrink-0"
            >
              <span>{mobileFiltersOpen ? "Hide" : "Filters"}</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 font-bold bg-primary/20 text-primary border-0 rounded-full"
                >
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  mobileFiltersOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground px-2.5 hidden sm:flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Refresh Passbook"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div
          className={`${mobileFiltersOpen ? "block" : "hidden"} sm:block space-y-3`}
        >
          {/* Row 1: Primary Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. Search */}
            <div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search ref #, party, notes..."
                  className="h-9 pl-8 pr-7 text-xs bg-background"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Select Year */}
            <div>
              <Select
                value={selectedYear}
                onValueChange={(val) => {
                  setSelectedYear(val);
                  setFilterMode("month_select");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="2026">Year 2026</SelectItem>
                  <SelectItem value="2025">Year 2025</SelectItem>
                  <SelectItem value="2024">Year 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Select Month */}
            <div>
              <Select
                value={filterMode === "month_select" ? selectedMonth : "custom"}
                onValueChange={(val) => {
                  if (val === "custom") {
                    setFilterMode("custom");
                    setDatePreset("custom");
                  } else {
                    setFilterMode("month_select");
                    setSelectedMonth(val);
                  }
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg max-h-60">
                  {MONTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    -- Custom Date Range --
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Quick Presets / Ranges */}
            <div>
              <Select
                value={filterMode === "preset" ? datePreset : "month_mode"}
                onValueChange={(val: string) => {
                  if (val === "month_mode") {
                    setFilterMode("month_select");
                  } else if (val === "custom") {
                    setFilterMode("custom");
                    setDatePreset("custom");
                  } else {
                    setFilterMode("preset");
                    setDatePreset(val as DateRangePreset);
                  }
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Quick Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="month_mode">
                    By Month & Year (Above)
                  </SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">Full Year-to-Date</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Date Pickers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Transaction Stream / Type */}
            <div>
              <Select
                value={typeFilter}
                onValueChange={(val: TransactionTypeFilter) => {
                  setTypeFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="receipt">
                    Client Receipts (Inflow +)
                  </SelectItem>
                  <SelectItem value="expense">
                    Operating Expenses (-)
                  </SelectItem>
                  <SelectItem value="payroll">
                    Staff Payroll Disbursements (-)
                  </SelectItem>
                  <SelectItem value="vendor_payment">
                    Awarding Body Bills (-)
                  </SelectItem>
                  <SelectItem value="petty_cash">
                    Petty Cash Float Movements
                  </SelectItem>
                  <SelectItem value="bank_deposit">
                    Bank Deposits (Contra)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Payment Account / Method */}
            {/* <div>
              <Select
                value={paymentMethodFilter}
                onValueChange={(val: PaymentMethodFilter) => {
                  setPaymentMethodFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="all">All Accounts & Methods</SelectItem>
                  <SelectItem value="bank">Bank / Wire / POS Card</SelectItem>
                  <SelectItem value="cash">Cash in Hand</SelectItem>
                  <SelectItem value="petty_cash">
                    Petty Cash Drawer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* 5. Sort Order */}
            <div>
              <Select
                value={sortBy}
                onValueChange={(val: SortOption) => {
                  setSortBy(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="date_desc">Date: Newest First</SelectItem>
                  <SelectItem value="date_asc">Date: Oldest First</SelectItem>
                  <SelectItem value="amount_desc">
                    Amount: Highest First
                  </SelectItem>
                  <SelectItem value="amount_asc">
                    Amount: Lowest First
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Flow Direction & Amount Tiers */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
            {/* Flow Toggle Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                Flow:
              </span>
              <button
                type="button"
                onClick={() => {
                  setFlowFilter("all");
                  setPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  flowFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlowFilter("in");
                  setPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  flowFilter === "in"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
                )}
              >
                <ArrowDownLeft className="w-3 h-3" />
                <span>Inflow (+)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlowFilter("out");
                  setPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                  flowFilter === "out"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20",
                )}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>Outflow (-)</span>
              </button>
            </div>

            {/* Amount Tiers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">
                Amount Tier:
              </span>
              {(
                [
                  { id: "all", label: "Any Amount" },
                  { id: "under_500", label: "< 500 AED" },
                  { id: "500_to_2500", label: "500–2.5k AED" },
                  { id: "2500_to_10000", label: "2.5k–10k AED" },
                  { id: "over_10000", label: "> 10k AED" },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    setAmountRange(tier.id);
                    setPage(1);
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border",
                    amountRange === tier.id
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-card text-muted-foreground border-border/70 hover:border-foreground/40",
                  )}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Pickers */}
          {(datePreset === "custom" || filterMode === "custom") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/40">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  From Date
                </label>
                <CustomCalendar
                  value={
                    customStartDate ? new Date(customStartDate) : undefined
                  }
                  onChange={(date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    setCustomStartDate(`${y}-${m}-${d}`);
                    setPage(1);
                  }}
                  placeholder="Start date"
                  className="h-9 text-xs w-full"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  To Date
                </label>
                <CustomCalendar
                  value={customEndDate ? new Date(customEndDate) : undefined}
                  onChange={(date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    setCustomEndDate(`${y}-${m}-${d}`);
                    setPage(1);
                  }}
                  placeholder="End date"
                  className="h-9 text-xs w-full"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 4. PASSBOOK LEDGER TABLE & TRANSACTION CHIPS */}
      <div className="space-y-3">
        {/* Quick Stream Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => {
              setTypeFilter("all");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/40",
            )}
          >
            <span>All Streams</span>
            <span className="font-mono text-[10px] opacity-80">
              ({rawTransactions.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTypeFilter("receipt");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "receipt"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
            )}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Client Collections</span>
            <span className="font-mono text-[10px] font-bold">
              ({typeMetrics.receiptsCount} • +
              {formatAED(typeMetrics.receiptsSum)})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTypeFilter("expense");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "expense"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
            )}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Operating Expenses</span>
            <span className="font-mono text-[10px] font-bold">
              ({typeMetrics.expensesCount} • -
              {formatAED(typeMetrics.expensesSum)})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTypeFilter("payroll");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "payroll"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Payroll</span>
            <span className="font-mono text-[10px] font-bold">
              ({typeMetrics.payrollCount} • -{formatAED(typeMetrics.payrollSum)}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTypeFilter("vendor_payment");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "vendor_payment"
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20",
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Awarding Body Dues</span>
            <span className="font-mono text-[10px] font-bold">
              ({typeMetrics.vendorCount} • -{formatAED(typeMetrics.vendorSum)})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTypeFilter("petty_cash");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "petty_cash"
                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                : "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/20",
            )}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Petty Cash Float</span>
            <span className="font-mono text-[10px] font-bold">
              ({typeMetrics.pettyCount} • Net {formatAED(typeMetrics.pettyNet)})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTypeFilter("bank_deposit");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer",
              typeFilter === "bank_deposit"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
            )}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Bank Deposits</span>
            <span className="font-mono text-[10px] font-bold">
              ({typeMetrics.depositCount} • +{formatAED(typeMetrics.depositSum)}
              )
            </span>
          </button>
        </div>

        {/* Section Header & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>Passbook Ledger Entries</span>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {transactionsWithStreamBalance.length} records
              </Badge>
              {activeFilterCount > 0 && (
                <span className="text-[11px] text-muted-foreground font-normal">
                  (Filtered from {rawTransactions.length})
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
              <span>
                Chronological real-time ledger. Click any row for transaction
                breakdown.
              </span>
            </p>
          </div>

          {/* Export Actions & Balance View Switcher */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Balance Mode Switcher (Visible when filters are active) */}
            {isFilteredStream && (
              <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/70 text-xs">
                <button
                  type="button"
                  onClick={() => setBalanceDisplayMode("stream")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px]",
                    balanceDisplayMode === "stream"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Show tab calculations (Deposit + / Debit -)"
                >
                  Tab Net Balance
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceDisplayMode("master")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px]",
                    balanceDisplayMode === "master"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Show master company cash balance across all accounts"
                >
                  Master Cash
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={transactionsWithStreamBalance.length === 0}
              className="h-8 text-xs font-medium gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              disabled={transactionsWithStreamBalance.length === 0}
              className="h-8 text-xs font-medium gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </Button>
          </div>
        </div>

        {/* Table Container (Desktop & Tablet) */}
        <div className="hidden sm:block border border-border/80 rounded-2xl overflow-hidden bg-card/80 shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider">
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-32">Ref #</TableHead>
                  <TableHead className="w-36">Stream / Category</TableHead>
                  <TableHead className="min-w-[170px]">
                    Party / Entity
                  </TableHead>
                  <TableHead className="w-32">Account / Method</TableHead>
                  <TableHead className="w-32 text-right">
                    Money In (+)
                  </TableHead>
                  <TableHead className="w-32 text-right">
                    Money Out (-)
                  </TableHead>
                  <TableHead className="w-36 text-right">
                    <span className="block">{balanceColumnHeader}</span>
                    {isFilteredStream && (
                      <span className="text-[9px] font-normal normal-case text-muted-foreground block">
                        (
                        {balanceDisplayMode === "stream"
                          ? "Filtered Stream"
                          : "Master Cash"}
                        )
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="w-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="text-xs divide-y divide-border/40">
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading passbook ledger transactions...
                    </TableCell>
                  </TableRow>
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <ArrowDownUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-foreground text-sm">
                        No transactions match your active filters
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try clearing stream, method, or amount filters to view
                        more entries.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAllFilters}
                        className="mt-3 text-xs"
                      >
                        Reset All Filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((t, index) => {
                    const rowNum = (page - 1) * pageSize + index + 1;
                    const isInflow = t.flow === "in";
                    const displayedBalance =
                      balanceDisplayMode === "stream" && isFilteredStream
                        ? t.streamRunningBalance
                        : t.runningBalance;

                    return (
                      <TableRow
                        key={t.id}
                        onClick={() => setSelectedTransaction(t)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isInflow
                            ? "hover:bg-emerald-500/[0.04]"
                            : "hover:bg-rose-500/[0.04]",
                        )}
                      >
                        {/* 1. Row Num */}
                        <TableCell className="text-center text-muted-foreground font-mono text-[11px]">
                          {rowNum}
                        </TableCell>

                        {/* 2. Date */}
                        <TableCell className="font-medium text-foreground whitespace-nowrap">
                          {formatReportDate(t.date)}
                        </TableCell>

                        {/* 3. Ref # */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] py-0 px-1.5 transition-colors",
                              isInflow
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-muted/70 text-foreground border-border/80",
                            )}
                          >
                            {t.refNo}
                          </Badge>
                        </TableCell>

                        {/* 4. Stream / Category */}
                        <TableCell className="whitespace-nowrap">
                          {t.type === "receipt" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold gap-1"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Client Receipt</span>
                            </Badge>
                          ) : t.type === "payroll" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Staff Payroll</span>
                            </Badge>
                          ) : t.type === "vendor_payment" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-semibold gap-1"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>Awarding Body</span>
                            </Badge>
                          ) : t.type === "petty_cash_topup" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 font-semibold gap-1"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Float Top-Up</span>
                            </Badge>
                          ) : t.type === ("petty_cash_transfer" as any) ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-semibold gap-1"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Cash Transfer Out</span>
                            </Badge>
                          ) : t.type === "bank_deposit" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold gap-1"
                            >
                              <Landmark className="w-3 h-3" />
                              <span>Bank Deposit</span>
                            </Badge>
                          ) : t.type === "petty_cash_deposit" ||
                            t.type === ("cash_deposit" as any) ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-semibold gap-1"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Deposit to Bank</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold gap-1"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>{t.category || "Expense"}</span>
                            </Badge>
                          )}
                        </TableCell>

                        {/* 5. Party / Entity */}
                        <TableCell className="font-medium text-foreground">
                          <span
                            className="truncate block max-w-[200px] font-semibold"
                            title={t.partyName}
                          >
                            {t.partyName}
                          </span>
                          {t.description && (
                            <span
                              className="text-[10px] text-muted-foreground truncate block max-w-[200px]"
                              title={t.description}
                            >
                              {t.description}
                            </span>
                          )}
                        </TableCell>

                        {/* 6. Account / Method */}
                        <TableCell className="whitespace-nowrap">
                          {t.paymentMethod.toLowerCase().includes("petty") ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                              <Coins className="w-3 h-3" /> Petty Cash
                            </span>
                          ) : t.paymentMethod.toLowerCase().includes("cash") ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                              <Banknote className="w-3 h-3" /> Cash
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                              <Landmark className="w-3 h-3" /> Bank / Wire
                            </span>
                          )}
                        </TableCell>

                        {/* 7. Money In */}
                        <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {isInflow ? `+${formatAED(t.amount)}` : "—"}
                        </TableCell>

                        {/* 8. Money Out */}
                        <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {!isInflow ? `-${formatAED(t.amount)}` : "—"}
                        </TableCell>

                        {/* 9. Running Balance (Contextual to active stream or master cash balance) */}
                        <TableCell className="text-right font-mono font-bold text-foreground tabular-nums">
                          {formatAED(displayedBalance)}
                        </TableCell>

                        {/* 10. Action */}
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(t);
                            }}
                            aria-label="View transaction details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Passbook Card View (sm:hidden) */}
        <div className="sm:hidden space-y-2.5">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              Loading passbook transactions...
            </Card>
          ) : paginatedTransactions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">
                No transactions match active filters
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="mt-3 text-xs"
              >
                Reset All Filters
              </Button>
            </Card>
          ) : (
            paginatedTransactions.map((t) => {
              const isInflow = t.flow === "in";
              const displayedBalance =
                balanceDisplayMode === "stream" && isFilteredStream
                  ? t.streamRunningBalance
                  : t.runningBalance;

              return (
                <Card
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className={cn(
                    "p-3.5 border-border/80 shadow-xs cursor-pointer active:scale-[0.99] transition-all",
                    isInflow
                      ? "border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]"
                      : "border-l-4 border-l-rose-500 bg-rose-500/[0.02]",
                  )}
                >
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/50">
                    <span className="font-semibold text-foreground font-mono text-[11px]">
                      {formatReportDate(t.date)}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {t.refNo}
                    </Badge>
                  </div>

                  <div className="py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs truncate max-w-[180px]">
                        {t.partyName}
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold text-sm",
                          isInflow
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {isInflow ? "+" : "-"}
                        {formatAED(t.amount)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {t.description || t.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground font-mono">
                      {t.paymentMethod}
                    </span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-[10px]">
                        {isFilteredStream && balanceDisplayMode === "stream"
                          ? "Stream Total:"
                          : "Master Bal:"}
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {formatAED(displayedBalance)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {transactionsWithStreamBalance.length > 0 && (
          <div className="p-3.5 bg-card/60 rounded-xl border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(
                  page * pageSize,
                  transactionsWithStreamBalance.length,
                )}{" "}
                of {transactionsWithStreamBalance.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. TRANSACTION DETAILS QUICK MODAL */}
      <Dialog
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl bg-card">
          {selectedTransaction && (
            <>
              {/* Modal Header */}
              <div
                className={cn(
                  "p-5 border-b border-border/60 flex items-center justify-between",
                  selectedTransaction.flow === "in"
                    ? "bg-emerald-500/10"
                    : "bg-rose-500/10",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                      selectedTransaction.flow === "in"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/20 text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {selectedTransaction.flow === "in" ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {selectedTransaction.flow === "in"
                        ? "Inflow Cash Receipt"
                        : "Outflow Cash Disbursement"}
                    </span>
                    <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">
                      {selectedTransaction.flow === "in" ? "+" : "-"}
                      {formatAED(selectedTransaction.amount)}
                    </h3>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-semibold px-2.5 py-0.5",
                    selectedTransaction.flow === "in"
                      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "border-rose-500/30 text-rose-700 dark:text-rose-300",
                  )}
                >
                  {selectedTransaction.flow === "in" ? "MONEY IN" : "MONEY OUT"}
                </Badge>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* Reference Number & Date */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Reference Number
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-foreground text-sm">
                        {selectedTransaction.refNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyRef(selectedTransaction.refNo)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                        title="Copy reference number"
                      >
                        {copiedRef ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Transaction Date
                    </span>
                    <span className="font-medium text-foreground text-sm mt-0.5 block">
                      {formatReportDate(selectedTransaction.date)}
                    </span>
                  </div>
                </div>

                {/* Party & Category */}
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Party / Beneficiary / Client
                    </span>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {selectedTransaction.partyName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Category & Description
                    </span>
                    <p className="text-xs text-foreground bg-muted/15 p-2.5 rounded-lg border border-border/50 mt-1 leading-relaxed">
                      {selectedTransaction.description ||
                        selectedTransaction.category}
                    </p>
                  </div>
                </div>

                {/* Payment Method, Stream Total & Master Balance */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Payment Account / Method
                    </span>
                    <span className="font-semibold text-foreground mt-0.5 block capitalize">
                      {selectedTransaction.paymentMethod}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      {isFilteredStream
                        ? balanceColumnHeader
                        : "Passbook Cash Balance"}
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
                      {formatAED(
                        balanceDisplayMode === "stream" && isFilteredStream
                          ? selectedTransaction.streamRunningBalance
                          : selectedTransaction.runningBalance,
                      )}
                    </span>
                  </div>
                </div>

                {/* Both Balances Comparison (Contextual transparency) */}
                {isFilteredStream && (
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-muted-foreground block">
                        Master Passbook Balance:
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatAED(selectedTransaction.runningBalance)}
                      </span>
                      <span className="text-[9px] text-muted-foreground block">
                        (All company bank & cash accounts)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block">
                        Filtered Stream Total:
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {formatAED(selectedTransaction.streamRunningBalance)}
                      </span>
                      <span className="text-[9px] text-muted-foreground block">
                        ({balanceColumnHeader})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <DialogFooter className="p-4 bg-muted/20 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                  className="w-full sm:w-auto text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <TopUpPettyCashDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        initialMode={transferInitialMode}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
