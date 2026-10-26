import React, { useState, useMemo } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { FileText, Users, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceCard } from "./InvoiceCard";
import { ClientAccountCard } from "./ClientAccountCard";
import { ClientSoaPreviewDialog } from "@/features/clients/dialogs/ClientSoaPreviewDialog";
import { apiGetClientSoa } from "@/lib/api/clientApi";
import type { Invoice } from "../types/billing.types";
import type {
  ClientSummaryItem,
  ClientsSummaryResponse,
} from "@/lib/api/financeApi";
import type { ClientSoaData } from "@/features/clients/types/soa.types";
import { formatAED, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface InvoicesTabProps {
  invoices: Invoice[];
  clientsSummary?: ClientsSummaryResponse | null;
  loadingClients?: boolean;
  searchQuery?: string;
  view: "list" | "grid";
  permissions: {
    canViewDetails: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  actions: {
    onView: (invoice: Invoice) => void;
    onPreview: (invoice: Invoice) => void;
    onDownloadPdf?: (invoice: Invoice, showSeal?: boolean) => void;
    onEdit: (invoice: Invoice) => void;
    onDelete: (id: string, invoiceNumber: string) => void;
    onCancel?: (id: string, invoiceNumber: string) => void;
    onToggleStatus: (id: string, currentStatus: Invoice["status"]) => void;
    onRecordPayment?: (invoice: Invoice) => void;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  downloadingInvoiceId?: string | null;
  loading?: boolean;
  onFilterByClient?: (clientName: string) => void;
}

export function InvoicesTab({
  invoices,
  clientsSummary,
  loadingClients = false,
  searchQuery = "",
  view,
  actions,
  permissions,
  pagination,
  downloadingInvoiceId,
  loading = false,
  onFilterByClient,
}: InvoicesTabProps) {
  const { toast } = useToast();

  // Sub-tabs: "accounts" (Client Accounts & Receivables) vs "invoices" (Official Invoices Registry)
  const [subTab, setSubTab] = useState<"accounts" | "invoices">("accounts");

  // SOA Dialog state
  const [soaDialogOpen, setSoaDialogOpen] = useState(false);
  const [selectedSoaData, setSelectedSoaData] = useState<ClientSoaData | null>(null);
  const [loadingSoaClientId, setLoadingSoaClientId] = useState<string | null>(null);

  const rawClients = clientsSummary?.clients || [];
  const totals = clientsSummary?.totals;

  // Sort clients: Only invoiced clients, pending balances first
  const clients = useMemo(() => {
    return [...rawClients].sort((a, b) => {
      const aPending = Number(a.totalOutstanding || 0);
      const bPending = Number(b.totalOutstanding || 0);
      if (aPending > 0.001 && bPending <= 0.001) return -1;
      if (bPending > 0.001 && aPending <= 0.001) return 1;
      return bPending - aPending;
    });
  }, [rawClients]);

  const pendingClientsCount = clients.filter(
    (c) => Number(c.totalOutstanding || 0) > 0.001
  ).length;

  // Use the top search bar's query seamlessly without redundant search fields
  const filteredClients = useMemo(() => {
    if (!searchQuery?.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.trnNo && c.trnNo.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  const handleOpenSoa = async (client: ClientSummaryItem) => {
    try {
      setLoadingSoaClientId(client.id);
      const res = await apiGetClientSoa(client.id);
      if (res && res.data) {
        setSelectedSoaData(res.data);
        setSoaDialogOpen(true);
      } else {
        toast({
          title: "Statement Unavailable",
          description: "Could not generate statement of account for this client.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Failed to load client SOA:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to fetch statement of account.",
        variant: "destructive",
      });
    } finally {
      setLoadingSoaClientId(null);
    }
  };

  const handleRecordClientPayment = (client: ClientSummaryItem) => {
    if (client.latestInvoice && actions.onRecordPayment) {
      actions.onRecordPayment(client.latestInvoice as any);
    } else if (onFilterByClient) {
      setSubTab("invoices");
      onFilterByClient(client.name);
    }
  };

  const handleViewClientInvoices = (client: ClientSummaryItem) => {
    setSubTab("invoices");
    if (onFilterByClient) {
      onFilterByClient(client.name);
    }
  };

  return (
    <TabsContent value="invoices" className="mt-0 space-y-4">
      {/* 1. Sleek Modern Sub-Tab Navigation & Micro-KPI Bar */}
      <div className="px-4 md:px-6 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/50 pb-3">
        {/* Navigation Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/40 dark:bg-muted/20 rounded-xl border border-border/60 shadow-2xs self-start overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSubTab("accounts")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0",
              subTab === "accounts"
                ? "bg-background text-foreground shadow-2xs ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <Users className={cn("w-3.5 h-3.5 shrink-0", subTab === "accounts" ? "text-primary" : "text-muted-foreground")} />
            <span>Client Accounts</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              {clients.length}
            </span>
            {pendingClientsCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-[10px] px-2 py-0.2 rounded-full font-mono font-bold whitespace-nowrap animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {pendingClientsCount} Due
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab("invoices")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0",
              subTab === "invoices"
                ? "bg-background text-foreground shadow-2xs ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <FileText className={cn("w-3.5 h-3.5 shrink-0", subTab === "invoices" ? "text-primary" : "text-muted-foreground")} />
            <span>Official Invoices</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              {invoices.length}
            </span>
          </button>
        </div>

        {/* Global AR KPI Cards - Side-by-side even on mobile */}
        {totals && (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 self-stretch sm:self-auto">
            {/* Collected Card */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/[0.06] dark:bg-emerald-950/20 border border-emerald-500/20 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground whitespace-nowrap">
                    Collected
                  </span>
                  {totals.totalInvoiced > 0 && (
                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded whitespace-nowrap">
                      {Math.round((totals.totalPaid / totals.totalInvoiced) * 100)}%
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate leading-tight mt-0.5">
                  {formatAED(totals.totalPaid)}
                </div>
              </div>
            </div>

            {/* Need to Collect Card */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-rose-500/[0.06] dark:bg-rose-950/20 border border-rose-500/20 shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-1 ring-rose-500/20">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground whitespace-nowrap">
                    Outstanding
                  </span>
                  {totals.pendingClientsCount > 0 && (
                    <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded whitespace-nowrap">
                      {totals.pendingClientsCount} Due
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400 truncate leading-tight mt-0.5">
                  {formatAED(totals.totalOutstanding)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: CLIENT ACCOUNTS (RUNNING BALANCES FOR INVOICED CLIENTS ONLY) */}
      {subTab === "accounts" && (
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  ACCOUNTS RECEIVABLE
                </span>
                <span className="text-xs text-muted-foreground font-semibold">•</span>
                <span className="text-xs text-muted-foreground">
                  {clients.length} Invoiced Client{clients.length !== 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Client Accounts & Receivables
              </h3>
              <p className="text-xs text-muted-foreground">
                Consolidated invoice balances and collections per Client (invoiced clients only). Clients with pending dues shown first.
              </p>
            </div>
          </div>

          {/* Client Cards Grid */}
          {loadingClients ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-border/60 bg-background/50 p-4 animate-pulse space-y-3"
                >
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted/60 rounded" />
                  <div className="h-3 w-3/4 bg-muted/60 rounded" />
                  <div className="h-8 w-full bg-muted/80 rounded" />
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
              <Users className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">
                {searchQuery
                  ? "No invoiced clients matching your search."
                  : "No Invoiced Clients Found"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "Try searching with a different client name or clear search filter."
                  : "Clients will automatically appear here once their first tax invoice is generated."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <ClientAccountCard
                  key={client.id}
                  client={client}
                  onViewSoa={handleOpenSoa}
                  onRecordPayment={handleRecordClientPayment}
                  onViewInvoices={handleViewClientInvoices}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: OFFICIAL INVOICES (TABLE / GRID WITH PAGINATION) */}
      {subTab === "invoices" && (
        <div>
          {loading ? (
            <div className="grid gap-4 p-4 md:p-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted/80" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted/80" />
                  </div>
                  <div className="mt-4 h-9 animate-pulse rounded-lg bg-muted/80" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-6 md:p-8">
              <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No Invoices Recorded
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Click "Create Invoice" in the header to issue your first client tax invoice.
                </p>
              </div>
            </div>
          ) : view === "list" ? (
            <InvoiceTable
              invoices={invoices}
              actions={actions}
              permissions={permissions}
              downloadingInvoiceId={downloadingInvoiceId}
              loading={loading}
            />
          ) : (
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoices.map((invoice, index) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  index={index}
                  actions={actions}
                  permissions={permissions}
                  isDownloadingPdf={downloadingInvoiceId === invoice.id}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border bg-card/20">
              <CustomPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.onPageChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Statement of Account (SOA) Preview Dialog */}
      <ClientSoaPreviewDialog
        soaData={selectedSoaData}
        open={soaDialogOpen}
        onOpenChange={setSoaDialogOpen}
      />
    </TabsContent>
  );
}

export default InvoicesTab;
