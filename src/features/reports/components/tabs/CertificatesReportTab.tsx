import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCertificatesReport } from "../../hooks/useCertificatesReport";
import { apiGetClients } from "@/lib/api/clientApi";
import { apiGetCourses } from "@/lib/api/trainingApi";
import { apiGetAwardingBodies } from "@/lib/api/settingsApi";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";
import { formatCertificateNumber } from "../../utils/reportDateUtils";
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
import { DateRangePreset } from "@/features/certificates/utils/dateRangeUtils";
import {
  ExportColumnsDialog,
  ExportColumnItem,
} from "../dialogs/ExportColumnsDialog";

const CERTIFICATE_COLUMNS = [
  "CERT. NO",
  "REG. DATE",
  "CANDIDATE",
  "CLIENT",
  "COURSE",
  "SERVICE TYPE",
  "MOBILE",
  "ISS. DATE",
  "EXP. DATE",
  "INV. NO",
  "INV. DATE",
  "SHARED",
  "AMOUNT (AED)",
  "VAT 5%",
  "TOTAL (AED)",
  "PAID",
];

export function CertificatesReportTab() {
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [invoiceNoInput, setInvoiceNoInput] = React.useState("");
  const [isInvoiceNoMode, setIsInvoiceNoMode] = React.useState(false);
  const {
    filters,
    setFilters,
    dateBounds,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalCount,
    paginatedRows,
    summaryStats,
    isLoading,
    isFetching,
    refetch,
    exportExcel,
    exportCsv,
  } = useCertificatesReport();

  // Load dropdown options
  const { data: clients = [] } = useQuery({
    queryKey: ["reports", "options", "clients"],
    queryFn: async () => {
      const res = await apiGetClients({ limit: 1000 });
      return res.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["reports", "options", "courses"],
    queryFn: async () => {
      const res = await apiGetCourses();
      return res.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: awardingBodies = [] } = useQuery({
    queryKey: ["reports", "options", "awardingBodies"],
    queryFn: async () => {
      return await apiGetAwardingBodies();
    },
    staleTime: 5 * 60_000,
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    setInvoiceNoInput(filters.invoiceNo || "");
    if (filters.invoiceNo) {
      setIsInvoiceNoMode(true);
    }
  }, [filters.invoiceNo]);

  const handleApplyInvoiceNo = () => {
    const trimmed = invoiceNoInput.trim();
    setFilters((prev) => ({
      ...prev,
      invoiceStatus: "invoiced",
      invoiceNo: trimmed,
      datePreset: trimmed ? "all" : prev.datePreset,
    }));
    setPage(1);
  };

  const handleResetAllFilters = () => {
    setIsInvoiceNoMode(false);
    setInvoiceNoInput("");
    setFilters({
      datePreset: "this_month",
      clientId: "all",
      courseId: "all",
      awardingBodyId: "all",
      invoiceStatus: "all",
      invoiceNo: "",
      serviceType: "all",
      search: "",
      customStartDate: "",
      customEndDate: "",
    });
    setPage(1);
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
                <span className="hidden sm:inline">Report </span>Filters
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight mt-0.5">
                {filters.invoiceNo
                  ? `Invoice #${filters.invoiceNo}`
                  : dateBounds?.label || "This Month"}
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
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAllFilters}
              className="h-8 px-2 sm:px-2.5 text-xs shrink-0"
            >
              Reset<span className="hidden sm:inline">&nbsp;Filters</span>
            </Button>
          </div>
        </div>

        <div className={mobileFiltersOpen ? "block" : "hidden sm:block"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Time Period */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Time Period
              </label>
              <Select
                value={filters.datePreset}
                onValueChange={(val: DateRangePreset) => {
                  setFilters((prev) => ({ ...prev, datePreset: val }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">Year-to-Date</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Service Type */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Service Type
              </label>
              <Select
                value={filters.serviceType}
                onValueChange={(val: "all" | "training" | "inspection") => {
                  setFilters((prev) => ({ ...prev, serviceType: val }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Client */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Client / Company
              </label>
              <Select
                value={filters.clientId}
                onValueChange={(val) => {
                  setFilters((prev) => ({ ...prev, clientId: val }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs truncate">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Course */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Course / Training
              </label>
              <Select
                value={filters.courseId}
                onValueChange={(val) => {
                  setFilters((prev) => ({ ...prev, courseId: val }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs truncate">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 5. Awarding Body */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Awarding Body
              </label>
              <Select
                value={filters.awardingBodyId}
                onValueChange={(val) => {
                  setFilters((prev) => ({ ...prev, awardingBodyId: val }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs truncate">
                  <SelectValue placeholder="All Awarding Bodies" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All Awarding Bodies</SelectItem>
                  {awardingBodies.map((ab: any) => (
                    <SelectItem key={ab.id} value={ab.id}>
                      {ab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 6. Invoice Status / Invoice Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Invoice / Payment Status
                </label>
                {!isInvoiceNoMode && !filters.invoiceNo ? (
                  <button
                    type="button"
                    onClick={() => setIsInvoiceNoMode(true)}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    By Inv #
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsInvoiceNoMode(false);
                      setInvoiceNoInput("");
                      setFilters((prev) => ({
                        ...prev,
                        invoiceNo: "",
                        invoiceStatus: "all",
                      }));
                      setPage(1);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isInvoiceNoMode || Boolean(filters.invoiceNo) ? (
                <div className="relative">
                  <Input
                    placeholder="Inv # (press Enter ↵)"
                    value={invoiceNoInput}
                    onChange={(e) => setInvoiceNoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyInvoiceNo();
                      }
                    }}
                    className="h-9 text-xs pr-14 font-mono bg-background"
                    autoFocus
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {invoiceNoInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceNoInput("");
                          setFilters((prev) => ({
                            ...prev,
                            invoiceNo: "",
                            invoiceStatus: "all",
                          }));
                          setIsInvoiceNoMode(false);
                          setPage(1);
                        }}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleApplyInvoiceNo}
                      className="h-6 px-1.5 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                      title="Apply (Enter)"
                    >
                      ↵
                    </button>
                  </div>
                </div>
              ) : (
                <Select
                  value={filters.invoiceStatus}
                  onValueChange={(val: string) => {
                    if (val === "by_invoice_no") {
                      setIsInvoiceNoMode(true);
                      return;
                    }
                    const sVal = val as "all" | "invoiced" | "not_invoiced" | "paid" | "not_paid";
                    setFilters((prev) => ({
                      ...prev,
                      invoiceStatus: sVal,
                      invoiceNo: "",
                    }));
                    setInvoiceNoInput("");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                    <SelectItem value="not_invoiced">Not Invoiced</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="not_paid">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 7. Search Text (Spans 2 columns on lg/xl) */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Search Text
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Candidate, cert #, invoice #..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                    setPage(1);
                  }}
                  className="h-9 pl-8 pr-7 text-xs bg-background"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, search: "" }));
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker inputs when preset === custom */}
          {filters.datePreset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  Start Date
                </label>
                <CustomCalendar
                  value={filters.customStartDate || undefined}
                  onChange={(date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    setFilters((prev) => ({
                      ...prev,
                      customStartDate: `${y}-${m}-${d}`,
                    }));
                  }}
                  placeholder="From Date"
                  className="h-9 text-xs w-full"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  End Date
                </label>
                <CustomCalendar
                  value={filters.customEndDate || undefined}
                  onChange={(date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    setFilters((prev) => ({
                      ...prev,
                      customEndDate: `${y}-${m}-${d}`,
                    }));
                  }}
                  placeholder="To Date"
                  className="h-9 text-xs w-full"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2. KPI SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Issued */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Certificates
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight">
              {summaryStats.totalCertificates.toLocaleString()}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Issued in {dateBounds?.label || "This Month"}
            </p>
          </div>
        </Card>

        {/* Total Candidates */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Candidates
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight">
              {summaryStats.totalParticipants.toLocaleString()}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Unique individuals
            </p>
          </div>
        </Card>

        {/* Invoiced */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Invoiced
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summaryStats.invoicedCertificates.toLocaleString()}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Billed on invoices
            </p>
          </div>
        </Card>

        {/* Uninvoiced */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Uninvoiced
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {summaryStats.uninvoicedCertificates.toLocaleString()}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pending billing
            </p>
          </div>
        </Card>

        {/* Total Value */}
        <Card className="p-4 border-border/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Value (Inc. VAT)
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
              {DIRHAM_SYMBOL}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight flex items-center gap-1">
              <span className="text-foreground">{DIRHAM_SYMBOL}</span>
              {summaryStats.totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {summaryStats.paidCount} paid • {summaryStats.unpaidCount} unpaid
            </p>
          </div>
        </Card>
      </div>

      {/* 3. EXPORT ACTION HEADER & PREVIEW TITLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold flex items-center gap-2 flex-wrap">
            <span>Report Preview Dataset</span>
            <Badge
              variant="secondary"
              className="text-[11px] font-normal shrink-0"
            >
              {totalCount} records
            </Badge>
            {filters.invoiceNo && (
              <Badge
                variant="outline"
                className="text-[11px] font-medium bg-primary/10 text-primary border-primary/30 flex items-center gap-1.5 py-0.5"
              >
                <span>
                  Invoice:{" "}
                  <strong className="font-mono">{filters.invoiceNo}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceNoInput("");
                    setFilters((prev) => ({ ...prev, invoiceNo: "" }));
                    setPage(1);
                  }}
                  className="hover:text-destructive transition-colors ml-0.5"
                  title="Remove invoice filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Previewing the exact 15-column dataset synchronized with Excel and
            CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv()}
            disabled={totalCount === 0 || isLoading}
            className="flex-1 sm:flex-initial h-8 px-3 text-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={totalCount === 0 || isLoading}
            className="flex-1 sm:flex-initial h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* 4. PREVIEW TABLE (15 COLUMNS) */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 dark:bg-slate-950 text-white">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider py-3 w-12">
                  #
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[130px]">
                  CERT. NO
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[100px]">
                  REG. DATE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[180px]">
                  CANDIDATE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[160px]">
                  CLIENT
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[180px]">
                  COURSE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[110px]">
                  SERVICE TYPE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[120px]">
                  MOBILE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[100px]">
                  ISS. DATE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[100px]">
                  EXP. DATE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[120px]">
                  INV. NO
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[100px]">
                  INV. DATE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-center w-20">
                  SHARED
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[110px]">
                  AMOUNT (AED)
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[90px]">
                  VAT 5%
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[120px]">
                  TOTAL (AED)
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-center w-20">
                  PAID
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={17}
                    className="h-48 text-center text-muted-foreground text-sm"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading report dataset...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={17}
                    className="h-48 text-center text-muted-foreground text-sm"
                  >
                    No certificates found matching your selected filter
                    criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  return (
                    <TableRow
                      key={row.certificateId}
                      className="hover:bg-muted/40 transition-colors text-xs border-border/50"
                    >
                      <TableCell className="font-mono text-muted-foreground py-2.5">
                        {rowNum}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground font-mono">
                        {formatCertificateNumber(row.certNo)}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {row.regDate}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {row.candidate}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.client}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.course}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.serviceType === "inspection"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                          }
                        >
                          {row.serviceType === "inspection"
                            ? "Inspection"
                            : "Training"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {row.mobile}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.issDate}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.expDate}
                      </TableCell>
                      <TableCell>
                        {row.invNo !== "N/A" ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20"
                          >
                            {row.invNo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[11px]">
                            N/A
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.invDate}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            row.shared === "YES"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                              : "bg-muted text-muted-foreground text-[10px]"
                          }
                        >
                          {row.shared}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {row.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {row.vat5Percent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {row.totalInclVat.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            row.paid === "TRUE"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold"
                          }
                        >
                          {row.paid === "TRUE" ? "PAID" : "UNPAID"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 5. TABLE PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border/60 bg-muted/10 text-xs">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="whitespace-nowrap">Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="whitespace-nowrap">
              {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}–
              {Math.min(page * pageSize, totalCount)} of {totalCount} records
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <span className="px-2 font-medium whitespace-nowrap">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* EXPORT COLUMN SELECTION DIALOG */}
      <ExportColumnsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportTitle="Certificates & Accreditations"
        columns={CERTIFICATE_COLUMNS}
        rowCount={totalCount}
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
