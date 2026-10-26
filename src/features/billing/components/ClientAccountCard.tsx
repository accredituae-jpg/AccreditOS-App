import React from "react";
import {
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Share2,
  Eye,
  User,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAED, cn } from "@/lib/utils";
import type { ClientSummaryItem } from "@/lib/api/financeApi";
import { openWhatsApp } from "@/lib/whatsapp";
import { formatContact } from "../utils/billing.utils";

interface ClientAccountCardProps {
  client: ClientSummaryItem;
  onViewSoa: (client: ClientSummaryItem) => void;
  onRecordPayment?: (client: ClientSummaryItem) => void;
  onViewInvoices?: (client: ClientSummaryItem) => void;
}

export function ClientAccountCard({
  client,
  onViewSoa,
  onRecordPayment,
  onViewInvoices,
}: ClientAccountCardProps) {
  const total = Number(client.totalInvoiced) || 0;
  const paid = Number(client.totalPaid) || 0;
  const pending = Number(client.totalOutstanding) || 0;
  const overdue = Number(client.overdueAmount) || 0;

  const pctPaid =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;

  const isIndividual =
    client.name.toLowerCase().includes("individual") ||
    client.companyName.toLowerCase().includes("individual");

  const cleanContactPerson = formatContact(client.contactPerson);
  const contactDisplayName =
    cleanContactPerson !== "—" ? cleanContactPerson : client.name;

  const handleWhatsApp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!client.phone) return;
    const message = `Hello ${contactDisplayName},\n\nThis is a friendly payment reminder from Accredit Management Consultancy.\n\nYou have ${client.unpaidCount} unpaid invoice(s) with an outstanding balance of *${formatAED(pending)}*.\n\nKindly arrange the settlement or share the transfer proof at your earliest convenience. Thank you!`;
    openWhatsApp(client.phone, message, e);
  };

  const getStatusBadge = () => {
    switch (client.status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold gap-1">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold gap-1">
            <Clock className="w-3 h-3" /> Partial
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold gap-1">
            <AlertTriangle className="w-3 h-3" /> Due
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            No Dues
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5 relative overflow-hidden group">
      {/* Accent top stripe */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 transition-colors",
          pending > 0.01
            ? overdue > 0.01
              ? "bg-rose-500"
              : "bg-amber-500"
            : paid > 0
              ? "bg-emerald-500"
              : "bg-muted",
        )}
      />

      {/* 1. Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isIndividual
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/10 text-primary",
              )}
            >
              {isIndividual ? (
                <User className="w-4 h-4" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {client.name}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">
                {cleanContactPerson !== "—" ? cleanContactPerson : ""}
                {cleanContactPerson !== "—" && client.phone ? " • " : ""}
                {client.phone ? client.phone : ""}
                {client.trnNo && client.trnNo !== "N/A"
                  ? ` • TRN: ${client.trnNo}`
                  : ""}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* 2. Key Metrics Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">
              Outstanding Due
            </span>
            <span
              className={cn(
                "font-mono font-bold text-sm block mt-0.5",
                pending > 0.01
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground",
              )}
            >
              {formatAED(pending)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground font-medium block">
              Collected to Date
            </span>
            <span className="font-mono font-bold text-sm block mt-0.5 text-emerald-600 dark:text-emerald-400">
              {formatAED(paid)}
            </span>
          </div>
        </div>

        {/* 3. Settlement Progress Bar */}
        <div className="mt-2.5 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span>Settlement: {pctPaid}%</span>
            <span>Total Invoiced: {formatAED(total)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pctPaid >= 100
                  ? "bg-emerald-500"
                  : pctPaid > 0
                    ? "bg-blue-500"
                    : "bg-amber-500",
              )}
              style={{ width: `${pctPaid}%` }}
            />
          </div>
        </div>

        {/* 4. Subtext breakdown */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span
            className={cn(
              client.unpaidCount > 0
                ? "font-medium text-amber-600 dark:text-amber-400"
                : "",
            )}
          >
            {client.unpaidCount} unpaid invoice
            {client.unpaidCount !== 1 ? "s" : ""}
          </span>
          <span>
            {client.totalInvoicesCount} invoice
            {client.totalInvoicesCount !== 1 ? "s" : ""} recorded
          </span>
        </div>

        {/* Overdue alert notice if any */}
        {overdue > 0.01 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Overdue past payment terms: {formatAED(overdue)}</span>
          </div>
        )}
      </div>

      {/* 5. Actions Footer */}
      <div className="pt-2 border-t border-border/60 flex items-center gap-2">
        {pending > 0.01 ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => onViewSoa(client)}
              className="flex-1 h-8 text-xs font-semibold gap-1.5 shadow-2xs bg-[#004ba0] hover:bg-[#003c80] text-white"
              title="Open official Statement of Account (SOA)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SOA</span>
            </Button>

            {onRecordPayment && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRecordPayment(client)}
                className="h-8 text-[11px] px-2.5 gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                title="Record Receipt Payment for this client"
              >
                {/* <DollarSign className="w-3.5 h-3.5" /> */}
                <span>Receipt</span>
              </Button>
            )}

            {client.phone && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="h-8 text-[11px] px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                title="Send WhatsApp payment reminder"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            )}

            {onViewInvoices && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onViewInvoices(client)}
                className="h-8 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                title="Filter and view invoices for this client"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            )}
          </>
        ) : (
          onViewInvoices && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewInvoices(client)}
              className="flex-1 h-8 text-xs font-semibold gap-1.5 text-foreground hover:bg-muted"
              title="View all settled invoices for this client"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>View Invoices ({client.totalInvoicesCount})</span>
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default ClientAccountCard;
