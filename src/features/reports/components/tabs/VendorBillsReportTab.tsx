import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetVendorBills } from "@/lib/api/financeApi";
import { apiGetAwardingBodies } from "@/lib/api/settingsApi";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  Receipt,
  TrendingDown,
  Clock,
  CheckCircle2,
  ChevronDown,
  X,
} from "lucide-react";
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
import { DIRHAM_SYMBOL } from "@/lib/utils";
import {
  DateRangePreset,
  getDateRangeBounds,
} from "@/features/certificates/utils/dateRangeUtils";
import { exportCustomReportToExcel } from "../../utils/exportReportExcel";
import { exportGenericReportToCsv } from "../../utils/exportReportCsv";
import { formatReportDate, parseReportDate } from "../../utils/reportDateUtils";
import {
  ExportColumnsDialog,
  ExportColumnItem,
} from "../dialogs/ExportColumnsDialog";

const VENDOR_BILLS_COLUMNS = [
  "BILL NO",
  "AWARDING BODY",
  "DATE",
  "DUE DATE",
  "SUBTOTAL",
  "VAT",
  "TOTAL (AED)",
  "PAID (AED)",
  "BALANCE",
  "STATUS",
];

export function VendorBillsReportTab() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [awardingBodyId, setAwardingBodyId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const dateBounds = useMemo(() => {
    return getDateRangeBounds(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  const { data: bills = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["reports", "vendor_bills", datePreset, dateBounds.startDate, dateBounds.endDate],
    queryFn: async () => {
      const res = await apiGetVendorBills(1, 10000);
      return res.data || [];
    },
    staleTime: 60_000,
  });

  const { data: awardingBodies = [] } = useQuery({
    queryKey: ["reports", "options", "awardingBodies"],
    queryFn: async () => {
      return await apiGetAwardingBodies();
    },
    staleTime: 5 * 60_000,
  });

  const filteredBills = useMemo(() => {
    return bills.filter((b: any) => {
      if (statusFilter !== "all") {
        if (statusFilter === "paid" && b.status !== "paid" && Number(b.balance) > 0) return false;
        if (statusFilter === "partially_paid" && b.status !== "partially_paid") return false;
        if (statusFilter === "pending" && b.status !== "pending") return false;
      }

      if (awardingBodyId !== "all") {
        if (b.awardingBodyId !== awardingBodyId) return false;
      }

      if (dateBounds.startDate || dateBounds.endDate) {
        const rawDate = b.billDate || b.createdAt;
        const bDate = parseReportDate(rawDate);
        if (!bDate) return false;
        if (dateBounds.startDate) {
          const s = new Date(dateBounds.startDate);
          s.setHours(0, 0, 0, 0);
          if (bDate < s) return false;
        }
        if (dateBounds.endDate) {
          const e = new Date(dateBounds.endDate);
          e.setHours(23, 59, 59, 999);
          if (bDate > e) return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const bNo = (b.billNumber || "").toLowerCase();
        const vName = (b.vendorName || "").toLowerCase();
        const notes = (b.notes || "").toLowerCase();
        if (!bNo.includes(q) && !vName.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bills, statusFilter, awardingBodyId, dateBounds, search]);

  const stats = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    for (const b of filteredBills) {
      totalAmount += Number(b.totalAmount || 0);
      totalPaid += Number(b.paidAmount || 0);
      totalBalance += Number(b.balance || 0);
    }

    return {
      totalBills: filteredBills.length,
      totalAmount,
      totalPaid,
      totalBalance,
      isConserved: Math.abs(totalAmount - (totalPaid + totalBalance)) < 0.05,
    };
  }, [filteredBills]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));

  const exportExcel = (selectedColumns?: string[]) => {
    const rows = filteredBills.map((b: any) => ({
      "BILL NO": b.billNumber,
      "AWARDING BODY": b.vendorName || "N/A",
      "DATE": formatReportDate(b.billDate),
      "DUE DATE": formatReportDate(b.dueDate),
      "SUBTOTAL": Number(b.subtotal || 0),
      "VAT": Number(b.vatAmount || 0),
      "TOTAL (AED)": Number(b.totalAmount || 0),
      "PAID (AED)": Number(b.paidAmount || 0),
      "BALANCE": Number(b.balance || 0),
      "STATUS": (b.status || "").toUpperCase(),
    }));

    const columnsToExport =
      selectedColumns && selectedColumns.length > 0
        ? selectedColumns
        : VENDOR_BILLS_COLUMNS;

    exportCustomReportToExcel(
      "Vendor Bills Report",
      rows,
      columnsToExport,
      "Vendor_Bills_Report"
    );
  };

  const exportCsv = (selectedColumns?: string[]) => {
    const columnsToExport =
      selectedColumns && selectedColumns.length > 0
        ? selectedColumns
        : VENDOR_BILLS_COLUMNS;

    const rows = filteredBills.map((b: any) => ({
      "BILL NO": b.billNumber,
      "AWARDING BODY": b.vendorName || "N/A",
      "DATE": formatReportDate(b.billDate),
      "DUE DATE": formatReportDate(b.dueDate),
      "SUBTOTAL": Number(b.subtotal || 0),
      "VAT": Number(b.vatAmount || 0),
      "TOTAL (AED)": Number(b.totalAmount || 0),
      "PAID (AED)": Number(b.paidAmount || 0),
      "BALANCE": Number(b.balance || 0),
      "STATUS": (b.status || "").toUpperCase(),
    }));

    exportGenericReportToCsv(columnsToExport, rows, "Vendor_Bills_Report");
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
                <span className="hidden sm:inline">Bills </span>Filters
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
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDatePreset("this_month");
                setAwardingBodyId("all");
                setStatusFilter("all");
                setSearch("");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="h-8 px-2 sm:px-2.5 text-xs shrink-0"
            >
              Reset<span className="hidden sm:inline">&nbsp;Filters</span>
            </Button>
          </div>
        </div>

        <div className={mobileFiltersOpen ? "block" : "hidden sm:block"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Period</label>
            <Select value={datePreset} onValueChange={(val: DateRangePreset) => { setDatePreset(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">Year-to-Date</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Awarding Body</label>
            <Select value={awardingBodyId} onValueChange={(val) => { setAwardingBodyId(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs truncate"><SelectValue placeholder="All Awarding Bodies" /></SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All Awarding Bodies</SelectItem>
                {awardingBodies.map((ab: any) => (
                  <SelectItem key={ab.id} value={ab.id}>{ab.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Fully Paid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="ISSUED">Issued / Unpaid</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Bill #, vendor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 pl-8 pr-7 text-xs bg-background shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {datePreset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Start Date</label>
              <CustomCalendar
                value={customStartDate || undefined}
                onChange={(date) => {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setCustomStartDate(`${y}-${m}-${d}`);
                }}
                placeholder="From Date"
                className="h-9 text-xs w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">End Date</label>
              <CustomCalendar
                value={customEndDate || undefined}
                onChange={(date) => {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setCustomEndDate(`${y}-${m}-${d}`);
                }}
                placeholder="To Date"
                className="h-9 text-xs w-full"
              />
            </div>
          </div>
        )}
        </div>
      </Card>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Bills</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight">{stats.totalBills.toLocaleString()}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Bills in {dateBounds?.label || "All Time"}</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Bill Amount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight flex items-center gap-1">
              <span className="text-foreground">{DIRHAM_SYMBOL}</span>
              {stats.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total payable for certificates</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Paid Amount</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{DIRHAM_SYMBOL}</span>
              {stats.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Recorded cash settlements</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>{DIRHAM_SYMBOL}</span>
              {stats.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> Reconciled: Total = Paid + Balance
            </p>
          </div>
        </Card>
      </div>

      {/* 3. EXPORT ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold flex items-center gap-2 flex-wrap">
            <span>Vendor Bills Registry</span>
            <Badge variant="secondary" className="text-[11px] font-normal shrink-0">{filteredBills.length} records</Badge>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">Awarding body fee obligations and payment records.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv()}
            disabled={filteredBills.length === 0 || isLoading}
            className="flex-1 sm:flex-initial h-8 px-3 text-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={filteredBills.length === 0 || isLoading}
            className="flex-1 sm:flex-initial h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* 4. PREVIEW TABLE */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 dark:bg-slate-950 text-white">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="text-white text-[11px] font-semibold uppercase py-3 w-12">#</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[130px]">BILL NO</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[180px]">AWARDING BODY</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[100px]">DATE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[100px]">DUE DATE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-right min-w-[110px]">SUBTOTAL</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-right min-w-[90px]">VAT</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-right min-w-[120px]">TOTAL (AED)</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-right min-w-[110px]">PAID (AED)</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-right min-w-[110px]">BALANCE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-center w-28">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-48 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading vendor bills...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-48 text-center text-muted-foreground text-sm">
                    No vendor bills found matching your selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((b: any, idx: number) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  const isPaid = b.status === "PAID" || Number(b.balance) <= 0;
                  const isPart = b.status === "PARTIALLY_PAID";
                  return (
                    <TableRow key={b.id} className="hover:bg-muted/40 transition-colors text-xs border-border/50">
                      <TableCell className="font-mono text-muted-foreground py-2.5">{rowNum}</TableCell>
                      <TableCell className="font-semibold text-foreground font-mono">{b.billNumber}</TableCell>
                      <TableCell className="font-medium text-foreground">{b.vendorName || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatReportDate(b.billDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatReportDate(b.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{Number(b.subtotal || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{Number(b.vatAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">{Number(b.totalAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{Number(b.paidAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-amber-600 dark:text-amber-400 font-medium">{Number(b.balance || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={isPaid ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]" : isPart ? "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]" : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"}>
                          {b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border/60 bg-muted/10 text-xs">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="whitespace-nowrap">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="whitespace-nowrap">
              {filteredBills.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredBills.length)} of {filteredBills.length} records
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 px-3 text-xs">
              Previous
            </Button>
            <span className="px-2 font-medium whitespace-nowrap">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 px-3 text-xs">
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* EXPORT COLUMN SELECTION DIALOG */}
      <ExportColumnsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportTitle="Awarding Body Fees"
        columns={VENDOR_BILLS_COLUMNS}
        rowCount={filteredBills.length}
        onExport={(selectedKeys, format) => {
          if (format === "excel") {
            exportExcel(selectedKeys);
          } else {
            exportCsv(selectedKeys);
          }
        }}
      />
    </div>
  );
}
