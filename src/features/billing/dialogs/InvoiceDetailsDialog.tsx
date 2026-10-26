import React, { useState } from "react";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatAED, cn } from "@/lib/utils";
import {
  FileText,
  Edit,
  Eye,
  Building2,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  Clock,
  Ban,
  FileCheck,
  CreditCard,
  Award,
  AlertCircle,
  Receipt as ReceiptIcon,
  Tag,
  Hash,
} from "lucide-react";
import type { Invoice } from "../types/billing.types";
import {
  formatContact,
  formatDateDDMMYYYY,
  formatInvoiceDescription,
  getInvoiceItems,
  type InvoiceItemGrouping,
} from "../utils/billing.utils";
import { ListFilter, GraduationCap, Users } from "lucide-react";

interface InvoiceDetailsDialogProps {
  invoice: Invoice | null;
  onClose: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditClick: (invoice: Invoice) => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export function InvoiceDetailsDialog({
  invoice,
  onClose,
  onViewInvoice,
  onEditClick,
  onRecordPayment,
}: InvoiceDetailsDialogProps) {
  const [showAwardingBody, setShowAwardingBody] = useState(false);
  const [groupingMode, setGroupingMode] =
    useState<InvoiceItemGrouping>("itemized");

  // Sync saved grouping preference from invoice notes or terms if available
  React.useEffect(() => {
    if (!invoice) return;
    if (
      invoice.notes?.includes("[format:course]") ||
      invoice.terms?.includes("[format:course]")
    ) {
      setGroupingMode("course");
    } else if (
      invoice.notes?.includes("[format:participant]") ||
      invoice.terms?.includes("[format:participant]")
    ) {
      setGroupingMode("participant");
    } else {
      setGroupingMode("itemized");
    }
  }, [invoice]);

  const displayedItems = React.useMemo(() => {
    if (!invoice) return [];
    return getInvoiceItems(invoice, {
      showAwardingBody,
      groupBy: groupingMode,
    });
  }, [invoice, showAwardingBody, groupingMode]);

  if (!invoice) return null;

  const isIndividual =
    invoice.clientId === "individual" ||
    (invoice.client && invoice.client.toLowerCase().includes("individual")) ||
    (invoice.clientName &&
      invoice.clientName.toLowerCase() !== "individual candidate");

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "paid":
        return { label: "Paid", variant: "success" as const };
      case "partially_paid":
        return { label: "Partially Paid", variant: "warning" as const };
      case "issued":
        return { label: "Issued / Open", variant: "info" as const };
      case "draft":
        return { label: "Draft", variant: "default" as const };
      case "cancelled":
        return { label: "Cancelled", variant: "destructive" as const };
      default:
        return { label: invoice.status, variant: "default" as const };
    }
  };

  const lineItems = invoice.lineItems || [];
  const paid =
    invoice.paidAmount !== undefined ? Number(invoice.paidAmount) : 0;
  const balance =
    invoice.balance !== undefined
      ? Number(invoice.balance)
      : Number(invoice.totalAmount) - paid;
  const isUnpaid =
    (invoice.status === "issued" || invoice.status === "partially_paid") &&
    balance > 0;
  const isFullySettled =
    balance <= 0 &&
    invoice.status !== "draft" &&
    invoice.status !== "cancelled";

  // Calculate payment due status
  const getDueStatus = () => {
    if (isFullySettled) {
      return {
        label: "Settled in Full",
        className:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    }
    if (!invoice.dueDate) return null;

    const parts = invoice.dueDate.split(/[-/]/).map(Number);
    let d: Date | null = null;
    if (parts.length === 3 && !parts.some(isNaN)) {
      if (String(parts[0]).length === 4) {
        d = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else {
      d = new Date(invoice.dueDate);
    }
    if (!d || isNaN(d.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)}d`,
        className:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold",
      };
    } else if (diffDays === 0) {
      return {
        label: "Due Today",
        className:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold",
      };
    } else {
      return {
        label: `Due in ${diffDays}d`,
        className: "bg-muted text-muted-foreground border-border/50",
      };
    }
  };

  const dueStatus = getDueStatus();

  const formatAuditDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      // fallback
    }
    return formatDateDDMMYYYY(dateStr);
  };

  return (
    <DetailDialog
      open={!!invoice}
      onOpenChange={(open) => !open && onClose()}
      title={invoice.invoiceNumber}
      subtitle={`Tax Invoice • Issued on ${formatDateDDMMYYYY(invoice.date)}`}
      icon={<FileText className="w-6 h-6 text-primary" />}
      status={getStatusBadge()}
      className="w-[95vw] sm:w-full max-w-4xl"
      actions={
        <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
          {invoice.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditClick(invoice)}
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit Invoice
            </Button>
          )}
          {isUnpaid && onRecordPayment && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              onClick={() => onRecordPayment(invoice)}
            >
              <DollarSign className="w-4 h-4 mr-1.5" />
              Record Payment
            </Button>
          )}
          <Button size="sm" onClick={() => onViewInvoice(invoice)}>
            <Eye className="w-4 h-4 mr-1.5" />
            View PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Cancelled Banner if applicable */}
        {invoice.status === "cancelled" && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-start gap-2.5">
            <Ban className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">
                This Invoice has been CANCELLED
              </p>
              <p className="text-[11px] text-destructive/85">
                Cancelled by{" "}
                {invoice.updatedByName || invoice.updatedBy?.name || "User"}
                {invoice.updatedAt &&
                  ` on ${formatAuditDate(invoice.updatedAt)}`}
              </p>
            </div>
          </div>
        )}

        {/* 1. Executive Metric Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Billed */}
          <div className="p-3 rounded-xl bg-card border border-border/70 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Total Invoice
              </span>
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold font-mono text-foreground leading-none">
                {formatAED(invoice.totalAmount, true)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Gross (incl. 5% VAT)
              </p>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="p-3 rounded-xl bg-card border border-border/70 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Total Received
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                {formatAED(paid, true)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {invoice.pendingReceipts?.length || (paid > 0 ? 1 : 0)}{" "}
                Settlement(s)
              </p>
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="p-3 rounded-xl bg-card border border-border/70 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Balance Due
              </span>
              {balance <= 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-base sm:text-lg font-bold font-mono leading-none",
                  balance <= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {formatAED(balance, true)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {balance <= 0 ? "Fully Settled" : "Awaiting Settlement"}
              </p>
            </div>
          </div>

          {/* Payment Due Date */}
          <div className="p-3 rounded-xl bg-card border border-border/70 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Payment Due
              </span>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold font-mono text-foreground leading-none">
                {formatDateDDMMYYYY(invoice.dueDate)}
              </p>
              {dueStatus && (
                <span
                  className={cn(
                    "inline-block text-[9px] px-1.5 py-0.5 rounded border mt-1 font-medium",
                    dueStatus.className,
                  )}
                >
                  {dueStatus.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Structured Information Cards (2-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Customer / Client Profile */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2 min-w-0">
                {isIndividual ? (
                  <User className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                )}
                <span className="font-bold text-sm text-foreground truncate">
                  {invoice.clientName || invoice.client || "Client"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isIndividual ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold"
                  >
                    Candidate
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold"
                  >
                    Company
                  </Badge>
                )}
                {invoice.trnNo && invoice.trnNo !== "N/A" && (
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                    TRN: {invoice.trnNo}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Attention / Reference
                </p>
                <p className="font-medium text-foreground truncate">
                  {formatContact(invoice.referenceContact) || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Phone / Mobile
                </p>
                <p className="font-medium text-foreground truncate">
                  {invoice.phone || invoice.mobile || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Email</p>
                <p className="font-medium text-foreground truncate">
                  {invoice.clientEmail || invoice.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Billing Address
                </p>
                <p className="font-medium text-foreground truncate">
                  {[
                    invoice.location,
                    invoice.poBox ? `P.O. ${invoice.poBox}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Particulars */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Invoice Particulars
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-muted text-foreground border-border/60 text-[10px] font-medium"
              >
                {invoice.typeName || "Standard Billing"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Invoice Reference
                </p>
                <p className="font-mono font-bold text-primary">
                  {invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Currency</p>
                <p className="font-mono font-semibold text-foreground">
                  {invoice.currency || "AED"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Issue Date</p>
                <p className="font-mono font-medium text-foreground">
                  {formatDateDDMMYYYY(invoice.date)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Due Date</p>
                <p className="font-mono font-medium text-foreground">
                  {formatDateDDMMYYYY(invoice.dueDate)}
                </p>
              </div>
            </div>

            {invoice.description && (
              <div className="pt-1 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground">
                  Scope / Description
                </p>
                <p className="text-[11px] font-medium text-foreground italic line-clamp-2">
                  {invoice.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Billed Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Billed Line Items ({displayedItems.length})
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Grouping Selector */}
              {lineItems.length > 1 && (
                <div className="flex items-center bg-muted/60 border border-border/70 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setGroupingMode("itemized")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1",
                      groupingMode === "itemized"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Detailed: 1 line per certificate"
                  >
                    <ListFilter className="w-3 h-3" />
                    <span>Itemized</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupingMode("course")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1",
                      groupingMode === "course"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Group by Course: Summarized across delegates"
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span>By Course</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupingMode("participant")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-medium transition-all flex items-center gap-1",
                      groupingMode === "participant"
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Group by Participant: Summarized per candidate"
                  >
                    <Users className="w-3 h-3" />
                    <span>By Person</span>
                  </button>
                </div>
              )}

              {/* Awarding Body Toggle */}
              <div className="flex items-center gap-1.5 bg-muted/60 border border-border/70 px-2 py-0.5 rounded-md">
                <Switch
                  id="details-toggle-awarding-body"
                  checked={showAwardingBody}
                  onCheckedChange={setShowAwardingBody}
                  className="scale-75 data-[state=checked]:bg-primary"
                />
                <Label
                  htmlFor="details-toggle-awarding-body"
                  className="text-[10px] font-medium cursor-pointer text-muted-foreground hover:text-foreground select-none flex items-center gap-1"
                >
                  <Award className="w-3 h-3 text-primary" />
                  Show Awarding Body
                </Label>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground">
                Net Subtotal:{" "}
                <strong className="text-foreground">
                  {formatAED(invoice.subtotal, true)}
                </strong>
              </span>
            </div>
          </div>

          <div className="border border-border/70 rounded-xl overflow-hidden bg-card shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/40 uppercase text-[10px] font-semibold text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-3.5 py-2.5 w-10 text-center">#</th>
                    <th className="px-3.5 py-2.5">
                      <span>Item Description</span>
                      <span className="block text-[8px] font-normal normal-case tracking-normal text-muted-foreground/80 leading-tight">
                        Safety Consultancy Services
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-center w-20">Qty</th>
                    <th className="px-3.5 py-2.5 text-right w-24">Unit Rate</th>
                    <th className="px-3.5 py-2.5 text-right w-24">Gross Subtotal</th>
                    <th className="px-3.5 py-2.5 text-right w-28">
                      Total (Inc. VAT)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {displayedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-muted-foreground italic"
                      >
                        No line items recorded on this invoice.
                      </td>
                    </tr>
                  ) : (
                    displayedItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-muted/15 transition-colors"
                      >
                        <td className="px-3.5 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-foreground">
                          {item.description}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
                          {item.qty}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                          {formatAED(item.unitPrice, true)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-muted-foreground">
                          {formatAED(item.grossAmount, true)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-foreground">
                          {formatAED(item.totalAmount, true)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Split Section: Settlements & Notes on Left, Financial Summary on Right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
          {/* Left Column: Settlement Receipts & Notes */}
          <div className="space-y-3">
            {/* Allocated Receipt Vouchers */}
            <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <ReceiptIcon className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Settlement Vouchers (
                    {invoice.pendingReceipts?.length || (paid > 0 ? 1 : 0)})
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {formatAED(paid, true)}
                </span>
              </div>

              {invoice.pendingReceipts && invoice.pendingReceipts.length > 0 ? (
                <div className="space-y-1.5">
                  {invoice.pendingReceipts.map((pr, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {pr.receiptNumber?.startsWith("RV-")
                              ? pr.receiptNumber
                              : `RV-${pr.receiptNumber}`}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-semibold px-1.5 py-0 bg-muted/80 text-muted-foreground"
                          >
                            {pr.status}
                          </Badge>
                        </div>
                        {(pr.date || pr.paymentMethod) && (
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {[
                              pr.date ? `Paid on ${pr.date}` : null,
                              pr.paymentMethod
                                ? pr.paymentMethod.replace("_", " ")
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAED(pr.amount, true)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : paid > 0 ? (
                <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Direct Payment Recorded</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAED(paid, true)}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-1">
                  No payment receipts allocated to this invoice yet.
                </p>
              )}
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-[11px] space-y-1">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                  Notes & Terms:
                </span>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {invoice.notes &&
                  invoice.terms &&
                  invoice.notes !== invoice.terms
                    ? `${invoice.notes}\n${invoice.terms}`
                    : invoice.notes || invoice.terms}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Financial Breakdown Summary */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2 font-medium">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Financial Breakdown
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (Net Excl. VAT):</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatAED(invoice.subtotal, true)}
                </span>
              </div>

              {Number(invoice.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Trade Discount:</span>
                  <span className="font-mono font-semibold">
                    -{formatAED(invoice.discountAmount, true)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Standard VAT (5%):</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatAED(invoice.vatAmount, true)}
                </span>
              </div>

              <div className="flex justify-between font-bold text-sm text-foreground border-t border-border/60 pt-2">
                <span>Total Invoice Amount:</span>
                <span className="font-mono text-primary text-base">
                  {formatAED(invoice.totalAmount, true)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-dashed border-border/50">
                <span>Total Received / Paid:</span>
                <span className="font-mono">{formatAED(paid, true)}</span>
              </div>

              <div className="flex justify-between font-bold pt-1.5 border-t border-border/60">
                <span
                  className={
                    balance <= 0
                      ? "text-emerald-600"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  Net Balance Due:
                </span>
                <span
                  className={cn(
                    "font-mono text-base",
                    balance <= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {formatAED(balance, true)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Audit Metadata Footer */}
        <div className="text-[10px] text-muted-foreground/70 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <span>
              Created by:{" "}
              <strong className="font-semibold text-muted-foreground">
                {invoice.createdByName || invoice.createdBy?.name || "System"}
              </strong>
              {invoice.createdAt && ` on ${formatAuditDate(invoice.createdAt)}`}
            </span>
          </div>

          {(invoice.updatedByName || invoice.updatedBy?.name) && (
            <div className="flex items-center gap-1.5">
              <span>
                Updated by:{" "}
                <strong className="font-semibold text-muted-foreground">
                  {invoice.updatedByName || invoice.updatedBy?.name}
                </strong>
                {invoice.updatedAt &&
                  ` on ${formatAuditDate(invoice.updatedAt)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </DetailDialog>
  );
}

export default InvoiceDetailsDialog;
