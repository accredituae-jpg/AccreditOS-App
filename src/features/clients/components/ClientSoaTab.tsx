import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Share2,
  Printer,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ExternalLink,
  Receipt,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { openWhatsApp } from "@/lib/whatsapp";
import { apiGetClientSoa } from "@/lib/api/clientApi";
import type { Client } from "../types/client.types";
import type { ClientSoaData, PendingInvoiceItem } from "../types/soa.types";
import { formatContact } from "@/features/billing/utils/billing.utils";
import { ClientSoaPreviewDialog } from "../dialogs/ClientSoaPreviewDialog";

interface ClientSoaTabProps {
  client: Client;
  onDataLoaded?: (data: ClientSoaData) => void;
}

export function ClientSoaTab({ client, onDataLoaded }: ClientSoaTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [soaData, setSoaData] = useState<ClientSoaData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const cleanContactPerson = formatContact(client.contactPerson);
  const contactDisplayName = cleanContactPerson !== "—" ? cleanContactPerson : client.companyName;

  const fetchSoa = useCallback(async () => {
    if (!client?.id) return;
    try {
      setLoading(true);
      const res = await apiGetClientSoa(client.id);
      if (res.success && res.data) {
        setSoaData(res.data);
        if (onDataLoaded) {
          onDataLoaded(res.data);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load SOA",
          description: res.message || "Could not retrieve client invoices.",
        });
      }
    } catch (err: any) {
      console.error("Error fetching SOA:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch statement of account.",
      });
    } finally {
      setLoading(false);
    }
  }, [client?.id, onDataLoaded, toast]);

  useEffect(() => {
    fetchSoa();
  }, [fetchSoa]);

  const handleWhatsApp = (e?: React.MouseEvent) => {

    if (!soaData) return;
    if (!client.phone) {
      toast({
        variant: "destructive",
        title: "No Phone Number",
        description: "Client does not have a registered phone number.",
      });
      return;
    }
    const message = `Hello ${contactDisplayName},\n\nThis is a payment reminder from Accredit Management Consultancy.\n\nYou have *${soaData.invoices.length} pending invoice(s)* with an outstanding balance of *AED ${soaData.summary.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}*.\n\nPlease process payment to our bank account:\n• Bank: ${soaData.remittance.bankName}\n• IBAN: ${soaData.remittance.ibanFormatted}\n\nKindly send us the remittance advice once payment is made. Thank you!`;
    openWhatsApp(client.phone, message, e);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs font-medium">Loading Statement of Account...</p>
      </div>
    );
  }

  if (!soaData) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h4 className="text-sm font-bold text-foreground">Could Not Load Statement</h4>
        <p className="text-xs text-muted-foreground">Unable to fetch invoice details.</p>
        <Button size="sm" variant="outline" onClick={fetchSoa} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const { summary, invoices } = soaData;

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Statement of Account (Outstanding Invoices)</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time open item ledger for collections & payment follow-up
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSoa}
            className="h-8 px-2.5 text-xs gap-1.5"
            title="Refresh Invoices"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {invoices.length > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleWhatsApp}
                className="h-8 px-2.5 text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="h-8 px-3 text-xs gap-1.5 bg-[#004ba0] hover:bg-[#003c80] text-white font-semibold"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Official Statement</span>
              </Button>
            </>
          )}
        </div>
      </div>


      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Outstanding Due */}
        <Card className="border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Outstanding Due
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
              AED {summary.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Across {invoices.length} unpaid invoices
            </span>
          </CardContent>
        </Card>

        {/* Overdue Amount */}
        <Card className="border-amber-200 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Past Due Date
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
              AED {summary.overdueAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {summary.overdueCount} invoices overdue
            </span>
          </CardContent>
        </Card>

        {/* Total Invoiced */}
        <Card className="shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Invoiced
            </span>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
              AED {summary.totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Pending billings
            </span>
          </CardContent>
        </Card>

        {/* Total Paid So Far */}
        <Card className="shadow-2xs">
          <CardContent className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Paid Towards Due
            </span>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              AED {summary.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Partial receipts recorded
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List / Empty State */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-emerald-500/30 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-base font-bold text-foreground">All Invoices Settled</h5>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {client.companyName} has zero outstanding balance. All issued invoices have been fully paid.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-2.5">Date</th>
                  <th className="py-2.5 px-2.5">Due Date</th>
                  <th className="py-2.5 px-2.5 text-center">Aging / Overdue</th>
                  <th className="py-2.5 px-3 text-right">Invoiced (AED)</th>
                  <th className="py-2.5 px-3 text-right">Paid (AED)</th>
                  <th className="py-2.5 px-3 text-right">Balance Due (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-2.5 text-muted-foreground">{inv.date}</td>
                    <td className="py-2.5 px-2.5 text-muted-foreground">{inv.dueDate}</td>
                    <td className="py-2.5 px-2.5 text-center">
                      {inv.daysOverdue > 0 ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] font-bold px-1.5 py-0 bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20"
                        >
                          {inv.daysOverdue}d overdue
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        >
                          Due soon
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                      {inv.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {inv.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/5">
                      {inv.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 font-bold border-t border-border">
                  <td colSpan={4} className="py-2.5 px-3 text-right text-foreground uppercase tracking-wider text-[11px]">
                    Total Balance Due:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                    AED {summary.totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    AED {summary.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10">
                    AED {summary.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SOA Preview / PDF Dialog */}
      <ClientSoaPreviewDialog
        soaData={soaData}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
