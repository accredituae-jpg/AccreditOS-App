import { motion } from "framer-motion";
import { User, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAED } from "@/lib/utils";
import type { SalaryAdvance } from "../types/payroll.types";
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

interface SalaryAdvanceCardProps {
  advance: SalaryAdvance;
  index: number;
  onDelete: (id: string) => void;
  canManage: boolean;
}

export function SalaryAdvanceCard({
  advance,
  index,
  onDelete,
  canManage,
}: SalaryAdvanceCardProps) {
  const nameFallback = advance.employeeName || "Unknown Employee";
  const periodStr = `${MONTH_NAMES[advance.deductionMonth - 1]} ${advance.deductionYear}`;
  const formattedDate = formatPayrollDate(advance.paymentDate);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "deducted":
        return (
          <Badge className="bg-success/15 text-success border-success/20 hover:bg-success/15 capitalize text-xs">
            Deducted
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/15 capitalize text-xs">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/15 text-warning border-warning/20 hover:bg-warning/15 capitalize text-xs">
            Paid (Pending)
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className="grid-card relative flex h-full min-w-0 flex-col justify-between gap-3 overflow-hidden p-3.5 transition-all hover:border-primary/30 hover:shadow-md sm:p-4 sm:hover:-translate-y-0.5"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">{nameFallback}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                {formattedDate}
              </p>
            </div>
          </div>
          <div className="shrink-0">{getStatusBadge(advance.status)}</div>
        </div>

        <div className="rounded-lg border border-primary/10 bg-primary/[0.035] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Amount advanced</p>
          <p className="mt-0.5 break-words text-lg font-bold leading-tight tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-xl">
            {formatAED(advance.amount, true)}
          </p>
          <div className="mt-2 space-y-1.5 border-t border-border/60 pt-2 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Deduction period</span>
              <span className="text-right font-medium text-foreground">{periodStr}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Payment method</span>
              <span className="text-right font-medium capitalize text-foreground">
                {advance.paymentMethod.replace("_", " ").toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        {advance.notes && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{advance.notes}</p>
        )}
      </div>

      {canManage && advance.status === "Paid" && (
        <div className="flex justify-end border-t border-border/70 pt-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-md text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(advance.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Cancel Advance
          </Button>
        </div>
      )}
    </motion.div>
  );
}
