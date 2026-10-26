import { motion } from "framer-motion";
import { User, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAED } from "@/lib/utils";
import type { SalaryAdvance } from "../types/payroll.types";

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
  const formattedDate = new Date(advance.paymentDate).toLocaleDateString();

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
      className="grid-card relative flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate text-primary">
                {nameFallback}
              </h3>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                {formattedDate}
              </p>
            </div>
          </div>
          {getStatusBadge(advance.status)}
        </div>

        <div className="space-y-2 text-sm pt-2 border-t border-border/40">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs">Amount Advanced</span>
            <span className="font-bold text-foreground font-mono">
              {formatAED(advance.amount, true)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Deduction Period</span>
            <span className="font-medium text-foreground">{periodStr}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium uppercase text-muted-foreground">
              {advance.paymentMethod.replace("_", " ")}
            </span>
          </div>
          {advance.notes && (
            <div className="text-xs text-muted-foreground pt-1 border-t border-border/40 italic">
              "{advance.notes}"
            </div>
          )}
        </div>
      </div>

      {canManage && advance.status === "Paid" && (
        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg gap-1 text-xs"
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
