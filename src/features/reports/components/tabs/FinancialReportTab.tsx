import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useFinancialReport } from "../../hooks/useFinancialReport";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ChevronDown,
  X,
  Building2,
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
import { DateRangePreset } from "@/features/certificates/utils/dateRangeUtils";
import { formatReportDate } from "../../utils/reportDateUtils";
import {
  ExportColumnsDialog,
  ExportColumnItem,
} from "../dialogs/ExportColumnsDialog";
import { apiGetClients, apiGetClientSoa } from "@/lib/api/clientApi";
import { ClientSoaPreviewDialog } from "@/features/clients/dialogs/ClientSoaPreviewDialog";
import type {
  ClientSoaData,
  PendingInvoiceItem,
} from "@/features/clients/types/soa.types";
import { COMPANY_BANK_DETAILS } from "@/config/companyDetails";
import { useToast } from "@/hooks/use-toast";

const FINANCIAL_COLUMNS = [
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

export function FinancialReportTab() {
  const { toast } = useToast();
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [soaDialogOpen, setSoaDialogOpen] = React.useState(false);
  const [soaLoading, setSoaLoading] = React.useState(false);
  const [soaData, setSoaData] = React.useState<ClientSoaData | null>(null);

  const {
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
    totalCount,
    paginatedInvoices,
    summaryMetrics,
    isLoading,
    isFetching,
    refetch,
    exportExcel,
    exportCsv,
  } = useFinancialReport();

  const { data: rawClients = [] } = useQuery({
    queryKey: ["reports", "options", "clients"],
    queryFn: async () => {
      const res = await apiGetClients({ limit: 1000 });
      return res.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const clients = React.useMemo(() => {
    const list = Array.isArray(rawClients)
      ? rawClients
      : (rawClients as any)?.items || [];
    return [...list].sort((a: any, b: any) =>
      (a.companyName || "").localeCompare(b.companyName || ""),
    );
  }, [rawClients]);

  const selectedClient = React.useMemo(() => {
    if (clientId === "all") return null;
    return clients.find((c: any) => c.id === clientId) || null;
  }, [clients, clientId]);

  const handleOpenSoa = async () => {
    if (clientId === "all" || !selectedClient) {
      toast({
        title: "Single Client Required",
        description:
          "Statement of Account (SOA) is issued per client. Please select a specific client from the Client filter dropdown above.",
      });
      return;
    }

    try {
      setSoaLoading(true);
      const res = await apiGetClientSoa(selectedClient.id, {
        fromDate: datePreset !== "all" ? dateBounds.startDate : undefined,
        toDate: datePreset !== "all" ? dateBounds.endDate : undefined,
      });

      if (res.success && res.data) {
        setSoaData(res.data);
        setSoaDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "SOA Generation Failed",
          description: res.message || "Failed to load Statement of Account.",
        });
      }
    } catch (err: any) {
      console.error("Error generating SOA:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate Statement of Account.",
      });
    } finally {
      setSoaLoading(false);
    }
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
                <span className="hidden sm:inline">Financial </span>Filters
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight mt-0.5">
                {dateBounds?.label || "This Month"}
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
              onClick={() => {
                setDatePreset("this_month");
                setStatusFilter("all");
                setClientId("all");
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
            {/* Time Period */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Time Period
              </label>
              <Select
                value={datePreset}
                onValueChange={(val: DateRangePreset) => {
                  setDatePreset(val);
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
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter (for SOA / Filtering) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span>Client (Single Client SOA)</span>
                </label>
                {clientId !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setClientId("all");
                      setPage(1);
                    }}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Select
                value={clientId}
                onValueChange={(val) => {
                  setClientId(val);
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

            {/* Payment Status */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Payment Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="issued">Unpaid / Issued</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="draft">Drafts Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Search Invoice or Client
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Invoice number, search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 pl-8 pr-7 text-xs bg-background shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
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

          {/* Custom Date Range */}
          {datePreset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  Start Date
                </label>
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
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  End Date
                </label>
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

      {/* 2. FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Invoiced */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight flex items-center gap-1">
              <span className="text-foreground">{DIRHAM_SYMBOL}</span>
              {summaryMetrics.totalInvoiced.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across {summaryMetrics.invoiceCount} valid invoices
            </p>
          </div>
        </Card>

        {/* Cash Collected */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Cash Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{DIRHAM_SYMBOL}</span>
              {summaryMetrics.cashCollected.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Realized cash collections
            </p>
          </div>
        </Card>

        {/* Pending AR */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Pending Receivables (AR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>{DIRHAM_SYMBOL}</span>
              {summaryMetrics.pendingAR.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Outstanding client balance
            </p>
          </div>
        </Card>

        {/* VAT Collected */}
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              UAE VAT (5%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight flex items-center gap-1">
              <span className="text-foreground">{DIRHAM_SYMBOL}</span>
              {summaryMetrics.totalVat.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> Reconciled: Total =
              Paid + AR
            </p>
          </div>
        </Card>
      </div>

      {/* 3. EXPORT ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold flex items-center gap-2 flex-wrap">
            <span>Invoices & Receivables Registry</span>
            <Badge
              variant="secondary"
              className="text-[11px] font-normal shrink-0"
            >
              {totalCount} invoices
            </Badge>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Authoritative financial data matching backend accounting rules and
            cash collections.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
          {/* Statement of Account (SOA) Button */}
          <Button
            size="sm"
            onClick={handleOpenSoa}
            disabled={isLoading || soaLoading}
            className={`flex-1 sm:flex-initial h-8 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
              clientId !== "all"
                ? "bg-[#004ba0] hover:bg-[#003c80] text-white ring-2 ring-[#004ba0]/20"
                : "bg-background hover:bg-muted text-muted-foreground border border-border/80"
            }`}
            title={
              clientId === "all"
                ? "Select a specific client from the filter to generate Statement of Account"
                : `Generate Statement of Account for ${selectedClient?.companyName || "client"}`
            }
          >
            {soaLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Receipt className="w-3.5 h-3.5" />
            )}
            <span>
              {clientId !== "all" && selectedClient
                ? `SOA (${selectedClient.companyName.split(" ")[0]})`
                : "SOA"}
            </span>
          </Button>

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

      {/* 4. PREVIEW TABLE */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 dark:bg-slate-950 text-white">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider py-3 w-12">
                  #
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[130px]">
                  INVOICE NO
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[100px]">
                  DATE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider min-w-[180px]">
                  CLIENT
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[110px]">
                  SUBTOTAL
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[90px]">
                  DISCOUNT
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[90px]">
                  VAT 5%
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[120px]">
                  TOTAL (AED)
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[110px]">
                  PAID (AED)
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-right min-w-[110px]">
                  BALANCE
                </TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase tracking-wider text-center w-28">
                  STATUS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-48 text-center text-muted-foreground text-sm"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading financial records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-48 text-center text-muted-foreground text-sm"
                  >
                    No invoices found matching your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((inv: any, idx: number) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  const isPaid =
                    inv.status === "paid" || Number(inv.balance) <= 0;
                  const isPartiallyPaid = inv.status === "partially_paid";

                  return (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-muted/40 transition-colors text-xs border-border/50"
                    >
                      <TableCell className="font-mono text-muted-foreground py-2.5">
                        {rowNum}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground font-mono">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatReportDate(inv.date)}
                      </TableCell>
                      <TableCell
                        className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Click to filter by this client"
                        onClick={() => {
                          const name = (
                            inv.clientName ||
                            inv.client?.companyName ||
                            ""
                          ).toLowerCase();
                          const foundClient = clients.find(
                            (c: any) => c.companyName?.toLowerCase() === name,
                          );
                          const cId =
                            inv.clientId || inv.client?.id || foundClient?.id;
                          if (cId) {
                            setClientId(cId);
                            setPage(1);
                          }
                        }}
                      >
                        <span className="hover:underline">
                          {inv.clientName || inv.client?.companyName || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {Number(inv.subtotal || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {Number(inv.discountAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {Number(inv.vatAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                        {Number(inv.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                        {Number(inv.paidAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-amber-600 dark:text-amber-400 font-medium">
                        {Number(inv.balance || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold"
                              : isPartiallyPaid
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold"
                          }
                        >
                          {isPaid
                            ? "PAID"
                            : isPartiallyPaid
                              ? "PARTIAL"
                              : "UNPAID"}
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
        reportTitle="Financial & Revenue"
        columns={FINANCIAL_COLUMNS}
        rowCount={totalCount}
        onExport={(selectedKeys, format) => {
          if (format === "excel") {
            exportExcel(selectedKeys);
          } else {
            exportCsv(selectedKeys);
          }
        }}
      />

      {/* CLIENT STATEMENT OF ACCOUNT (SOA) PREVIEW & DOWNLOAD DIALOG */}
      <ClientSoaPreviewDialog
        open={soaDialogOpen}
        onOpenChange={setSoaDialogOpen}
        soaData={soaData}
      />
    </div>
  );
}
