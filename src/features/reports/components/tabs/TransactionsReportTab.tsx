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
import { getActiveRole } from "@/lib/permissions";
import { formatAED, cn } from "@/lib/utils";
import {
  DateRangePreset,
  getDateRangeBounds,
} from "@/features/certificates/utils/dateRangeUtils";
import { exportCustomReportToExcel } from "../../utils/exportReportExcel";
import { exportGenericReportToCsv } from "../../utils/exportReportCsv";
import { formatReportDate } from "../../utils/reportDateUtils";

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

  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [flowFilter, setFlowFilter] = useState<"all" | "in" | "out">("all");
  const [search, setSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const dateBounds = useMemo(() => {
    return getDateRangeBounds(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "reports",
      "cashbook",
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

  if (!isAuthorized) {
    return (
      <Card className="p-8 text-center border-border/80 bg-muted/20">
        <h4 className="text-sm font-semibold text-foreground">Access Restricted</h4>
        <p className="text-xs text-muted-foreground mt-1">
          The Transactions Passbook ledger is restricted to Administrator and Developer accounts.
        </p>
      </Card>
    );
  }

  const transactions: CashbookTransactionItem[] = data?.transactions || [];
  const summary: CashbookSummary = data?.summary || {
    totalIn: 0,
    totalOut: 0,
    netCashFlow: 0,
    countIn: 0,
    countOut: 0,
    totalTransactions: 0,
  };

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, page, pageSize]);

  const exportExcel = () => {
    const rows = transactions.map((t) => ({
      "DATE": formatReportDate(t.date),
      "REF NO": t.refNo,
      "TYPE": t.category,
      "PARTY / ENTITY": t.partyName,
      "PAYMENT METHOD": t.paymentMethod,
      "DESCRIPTION": t.description,
      "CASH IN (AED)": t.flow === "in" ? t.amount : 0,
      "CASH OUT (AED)": t.flow === "out" ? t.amount : 0,
      "BALANCE (AED)": t.runningBalance,
    }));

    exportCustomReportToExcel(
      "Transactions Passbook Report",
      rows,
      CASHBOOK_COLUMNS,
      "Transactions_Passbook_Report"
    );
  };

  const exportCsv = () => {
    const rows = transactions.map((t) => ({
      "DATE": formatReportDate(t.date),
      "REF NO": t.refNo,
      "TYPE": t.category,
      "PARTY / ENTITY": t.partyName,
      "PAYMENT METHOD": t.paymentMethod,
      "DESCRIPTION": t.description,
      "CASH IN (AED)": t.flow === "in" ? t.amount : 0,
      "CASH OUT (AED)": t.flow === "out" ? t.amount : 0,
      "BALANCE (AED)": t.runningBalance,
    }));

    exportGenericReportToCsv(
      CASHBOOK_COLUMNS,
      rows,
      "Transactions_Passbook_Report"
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. FILTER CONTROLS */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap leading-tight">
                Passbook Filters
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight mt-0.5">
                {dateBounds?.label || "All Time"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="sm:hidden h-8 px-2 text-xs flex items-center gap-1 font-medium bg-muted/40"
            >
              <span>{mobileFiltersOpen ? "Hide" : "Filters"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  mobileFiltersOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Refresh Passbook"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className={`${mobileFiltersOpen ? "block" : "hidden"} sm:block space-y-3`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search ref #, party, category..."
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
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Preset */}
            <div>
              <Select
                value={datePreset}
                onValueChange={(val: DateRangePreset) => {
                  setDatePreset(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cash Flow Direction */}
            <div>
              <Select
                value={flowFilter}
                onValueChange={(val: any) => {
                  setFlowFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Transaction Flow" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="all">All Transactions (In & Out)</SelectItem>
                  <SelectItem value="in">Money In Only (Inflows +)</SelectItem>
                  <SelectItem value="out">Money Out Only (Outflows -)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Reset Filter */}
            <div className="flex items-center gap-2">
              {(datePreset !== "this_month" || flowFilter !== "all" || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDatePreset("this_month");
                    setFlowFilter("all");
                    setSearch("");
                    setPage(1);
                  }}
                  className="h-9 text-xs px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Reset Filters
                </Button>
              )}
            </div>
          </div>

          {/* Custom Date Range Pickers */}
          {datePreset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/40">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  From Date
                </label>
                <CustomCalendar
                  value={customStartDate ? new Date(customStartDate) : undefined}
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

      {/* 2. REAL-TIME ACCOUNT & CASH BALANCES */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Liquid Asset Balances (Where Company Money Lives)
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTopUpOpen(true)}
              className="h-7 text-xs font-medium text-primary hover:text-primary gap-1"
            >
              <Coins className="w-3.5 h-3.5" />
              + Top Up Petty Cash
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Bank Account */}
            <Card className="p-4 border-border/80 shadow-xs bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  Bank / Account
                </span>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
                  Bank Wire / Cards
                </Badge>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-foreground">
                  {formatAED(summary.balances?.bank ?? 0)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Transfers, online & cheque balances</p>
            </Card>

            {/* 2. Cash in Hand */}
            <Card className="p-4 border-border/80 shadow-xs bg-card hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" />
                  Cash in Hand
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                  Collections
                </Badge>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {formatAED(summary.balances?.cashInHand ?? 0)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Physical cash received from clients</p>
            </Card>

            {/* 3. Petty Cash Float */}
            <Card className="p-4 border-border/80 shadow-xs bg-card hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Petty Cash Float
                </span>
                <button
                  type="button"
                  onClick={() => setTopUpOpen(true)}
                  className="text-[10px] font-semibold text-amber-600 hover:underline cursor-pointer"
                >
                  + Top Up
                </button>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                  {formatAED(summary.balances?.pettyCash ?? 0)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Office drawer for daily expenses</p>
            </Card>

            {/* 4. Total Liquid Funds */}
            <Card className="p-4 border-primary/20 shadow-xs bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Total Liquid Funds
                </span>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-medium">
                  All Assets
                </Badge>
              </div>
              <div className="mt-2.5">
                <span className="text-xl font-bold font-mono text-primary">
                  {formatAED(summary.balances?.totalLiquidFunds ?? 0)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Bank + Cash in Hand + Petty Cash</p>
            </Card>
          </div>
        </div>

        {/* PERIOD SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Inflow */}
          <Card className="p-4 border-border/80 shadow-xs bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Money In (+)
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                +{formatAED(summary.totalIn)}
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {summary.countIn} Collections
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Client receipt payments</p>
          </Card>

          {/* Total Outflow */}
          <Card className="p-4 border-border/80 shadow-xs bg-rose-500/5 border-rose-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Total Money Out (-)
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                -{formatAED(summary.totalOut)}
              </span>
              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                {summary.countOut} Disbursed
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Expenses + Vendor fees + Payroll</p>
          </Card>

          {/* Net Cash Flow */}
          <Card
            className={cn(
              "p-4 border-border/80 shadow-xs",
              summary.netCashFlow >= 0
                ? "bg-primary/5 border-primary/20"
                : "bg-amber-500/5 border-amber-500/20"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Net Cash Flow
              </span>
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={cn(
                  "text-xl font-bold font-mono",
                  summary.netCashFlow >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {summary.netCashFlow > 0 ? "+" : ""}{formatAED(summary.netCashFlow)}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {summary.netCashFlow >= 0 ? "Surplus" : "Deficit"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Inflow minus outflow (period)</p>
          </Card>

          {/* Total Transactions */}
          <Card className="p-4 border-border/80 shadow-xs bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Transactions
              </span>
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <ArrowDownUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-foreground">
                {summary.totalTransactions}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Entries</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Chronological ledger records</p>
          </Card>
        </div>
      </div>

      {/* 3. PASSBOOK LEDGER TABLE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span>Transactions Passbook Ledger</span>
              <Badge variant="secondary" className="text-[11px] font-normal">
                {transactions.length} records
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
              <span>Real-time chronological incoming and outgoing cash ledger with running balance.</span>
              {summary.openingBalance !== undefined && datePreset !== "all" && (
                <span className="font-mono text-foreground font-semibold bg-muted/60 px-2 py-0.5 rounded text-[11px] border border-border/60">
                  Opening Balance: {formatAED(summary.openingBalance)}
                </span>
              )}
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setTopUpOpen(true)}
              className="h-8 text-xs font-medium gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>+ Top Up Petty Cash</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={transactions.length === 0}
              className="h-8 text-xs font-medium gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportExcel}
              disabled={transactions.length === 0}
              className="h-8 text-xs font-medium gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="border border-border/80 rounded-xl overflow-hidden bg-card/70 shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider">
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead className="w-28">Ref #</TableHead>
                  <TableHead className="w-36">Type / Category</TableHead>
                  <TableHead className="min-w-[160px]">Party / Entity</TableHead>
                  <TableHead className="w-28">Method</TableHead>
                  <TableHead className="w-32 text-right">Money In (+)</TableHead>
                  <TableHead className="w-32 text-right">Money Out (-)</TableHead>
                  <TableHead className="w-32 text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="text-xs divide-y divide-border/40">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading passbook ledger...
                    </TableCell>
                  </TableRow>
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <ArrowDownUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="font-medium text-foreground text-sm">No transactions found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try adjusting your date range or filters.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((t, index) => {
                    const rowNum = (page - 1) * pageSize + index + 1;
                    const isInflow = t.flow === "in";

                    return (
                      <TableRow
                        key={t.id}
                        className={cn(
                          "transition-colors",
                          isInflow
                            ? "hover:bg-emerald-500/[0.03]"
                            : "hover:bg-rose-500/[0.03]"
                        )}
                      >
                        <TableCell className="text-center text-muted-foreground font-mono text-[11px]">
                          {rowNum}
                        </TableCell>
                        <TableCell className="font-medium text-foreground whitespace-nowrap">
                          {formatReportDate(t.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] py-0 px-1.5",
                              isInflow
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {t.refNo}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-[11px] font-medium text-foreground">
                            {t.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <span className="truncate block max-w-[200px]" title={t.partyName}>
                            {t.partyName}
                          </span>
                          {t.description && (
                            <span className="text-[10px] text-muted-foreground truncate block max-w-[200px]" title={t.description}>
                              {t.description}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap capitalize text-[11px]">
                          {t.paymentMethod.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {isInflow ? `+${formatAED(t.amount)}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {!isInflow ? `-${formatAED(t.amount)}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground tabular-nums">
                          {formatAED(t.runningBalance)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {transactions.length > 0 && (
            <div className="p-3 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
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
                  {Math.min(page * pageSize, transactions.length)} of {transactions.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 px-2 text-xs"
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
                  className="h-7 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TopUpPettyCashDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
