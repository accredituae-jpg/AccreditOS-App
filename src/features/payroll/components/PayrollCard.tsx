import { motion } from "framer-motion";
import { Edit, CheckCircle2, DollarSign, Clock, FileText, MoreHorizontal, Trash2, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatAED } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { PayrollRecord } from "../types/payroll.types";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn("grid-card relative flex flex-col justify-between cursor-pointer", permissions.canView && "cursor-pointer")}
      onClick={() => permissions.canView && onView(record)}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate text-primary">
                {nameFallback}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {`${MONTH_NAMES[record.month - 1]} ${record.year}`}
              </p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Badge
              variant="outline"
              className={cn(
                "capitalize text-xs font-semibold px-2 py-0.5 shrink-0",
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

        <div className="space-y-2 text-sm pt-1 border-t border-border/40">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Salary</span>
            <span className="font-medium text-foreground">
              {formatAED(record.grossSalary, true)}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-border">
            <span className="text-muted-foreground font-semibold">Net Salary</span>
            <span className="text-foreground font-bold font-mono">
              {formatAED(record.netSalary, true)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {permissions.canManage && record.status === "draft" && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 rounded-lg"
            onClick={() => actions.onApprove(record)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        )}

        {permissions.canManage && record.status === "approved" && (
          <Button
            variant="default"
            size="sm"
            className="flex-1 rounded-lg animate-pulse"
            onClick={() => actions.onPay(record)}
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 p-0 rounded-lg shrink-0 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
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
