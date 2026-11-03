import { motion } from "framer-motion";
import { Edit, CheckCircle2, DollarSign, Clock, FileText, MoreHorizontal, Trash2, XCircle, Eye, CalendarCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatAED } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { PayrollRecord } from "../types/payroll.types";
import { formatPayrollDate } from "../utils/date";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface PayrollCardProps {
  record: PayrollRecord;
  index: number;
  permissions: {
    canView: boolean;
    canManage: boolean;
  };
  actions: {
    onApprove: (record: PayrollRecord) => void;
    onPay: (record: PayrollRecord) => void;
    onCancel: (record: PayrollRecord) => void;
    onDelete: (payrollId: string) => void;
  };
  onView: (record: PayrollRecord) => void;
  openNotesDialog: (record: PayrollRecord) => void;
}

export function PayrollCard({
  record,
  index,
  actions,
  permissions,
  onView,
  openNotesDialog,
}: PayrollCardProps) {
  const nameFallback = record.userName || record.user?.name || "Unknown Employee";
  const isPaid = record.status === "paid";
  const paymentDate = isPaid ? record.paymentDate || record.paidAt : record.scheduledPaymentDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn(
        "grid-card group relative flex h-full min-w-0 flex-col justify-between gap-3 overflow-hidden p-3.5 transition-all hover:border-primary/30 hover:shadow-md sm:p-4 sm:hover:-translate-y-0.5",
        permissions.canView && "cursor-pointer"
      )}
      onClick={() => permissions.canView && onView(record)}
    >
      <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
            <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">{nameFallback}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {`${MONTH_NAMES[record.month - 1]} ${record.year}`}
              </p>
            </div>
          </div>

          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <Badge
              variant="outline"
              className={cn(
                "capitalize px-2 py-0.5 text-[10px] font-semibold",
                record.status === "paid"
                  ? "bg-success/15 text-success border-success/20 hover:bg-success/15"
                  : record.status === "approved"
                  ? "bg-info/15 text-info border-info/20 hover:bg-info/15"
                  : record.status === "cancelled"
                  ? "bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/15"
                  : "bg-warning/15 text-warning border-warning/20 hover:bg-warning/15"
              )}
            >
              {record.status}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-primary/10 bg-primary/[0.035] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Net salary</p>
          <p className="mt-0.5 break-words text-lg font-bold leading-tight tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-xl">
            {formatAED(record.netSalary, true)}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/60 pt-2 text-xs">
            <span className="text-muted-foreground">Gross salary</span>
            <span className="shrink-0 text-right font-semibold text-foreground">{formatAED(record.grossSalary, true)}</span>
          </div>
        </div>
        <div
          className={cn(
            "flex min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 py-2",
            isPaid
              ? "border-success/20 bg-success/[0.07]"
              : "border-info/20 bg-info/[0.06]"
          )}
        >
          <span className={cn(
            "flex min-w-0 items-center gap-1.5 text-xs font-medium",
            isPaid ? "text-success" : "text-info"
          )}>
            {isPaid ? <CalendarCheck2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{isPaid ? "Paid date" : "Planned pay date"}</span>
          </span>
          <span className={cn(
            "shrink-0 text-right text-xs font-semibold tabular-nums",
            isPaid ? "text-success" : "text-info"
          )}>
            {paymentDate ? formatPayrollDate(paymentDate) : isPaid ? "Date unavailable" : "Not scheduled"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-2.5" onClick={(e) => e.stopPropagation()}>
        {permissions.canManage && record.status === "draft" && (
          <Button
            variant="default"
            size="sm"
            className="h-8 flex-1 rounded-md text-xs"
            onClick={() => actions.onApprove(record)}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
          </Button>
        )}

        {permissions.canManage && record.status === "approved" && (
          <Button
            variant="default"
            size="sm"
            className="h-8 flex-1 rounded-md text-xs"
            onClick={() => actions.onPay(record)}
          >
            <DollarSign className="mr-1 h-3.5 w-3.5" /> Pay
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg">
            <DropdownMenuItem onClick={() => onView(record)} className="cursor-pointer text-xs">
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openNotesDialog(record)} className="cursor-pointer text-xs">
              <Edit className="w-4 h-4 mr-2" /> Notes
            </DropdownMenuItem>
            {permissions.canManage && (record.status === "draft" || record.status === "approved") && (
              <DropdownMenuItem
                onClick={() => actions.onCancel(record)}
                className="text-destructive focus:text-destructive text-xs cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel Payroll
              </DropdownMenuItem>
            )}
            {permissions.canManage && record.status === "draft" && (
              <DropdownMenuItem
                onClick={() => actions.onDelete(record.id)}
                className="text-destructive focus:text-destructive text-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Payroll
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default PayrollCard;
