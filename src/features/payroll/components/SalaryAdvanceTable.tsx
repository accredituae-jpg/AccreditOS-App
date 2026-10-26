import { Trash2, CheckCircle2, Clock, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED, cn } from "@/lib/utils";
import type { SalaryAdvance } from "../types/payroll.types";

interface SalaryAdvanceTableProps {
  advances: SalaryAdvance[];
  onDelete: (id: string) => void;
  canManage: boolean;
}

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

export function SalaryAdvanceTable({ advances, onDelete, canManage }: SalaryAdvanceTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "deducted":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 text-[10px] font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Deducted
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px] font-semibold">
            <Ban className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1 text-[10px] font-semibold">
            <Clock className="w-3 h-3" /> Pending Deduction
          </Badge>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment Date</th>
            <th className="px-4 py-3">Deduction Period</th>
            <th className="px-4 py-3">Payment Method</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Notes</th>
            {canManage && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {advances.length === 0 ? (
            <tr>
              <td colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground text-xs">
                No salary advances found.
              </td>
            </tr>
          ) : (
            advances.map((adv) => {
              const nameFallback = adv.employeeName || "Unknown Employee";
              const periodStr = `${MONTH_NAMES[adv.deductionMonth - 1]} ${adv.deductionYear}`;
              const formattedDate = new Date(adv.paymentDate).toLocaleDateString();

              return (
                <tr key={adv.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{nameFallback}</td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{formatAED(adv.amount, true)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formattedDate}</td>
                  <td className="px-4 py-3 font-medium">{periodStr}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-muted/40 text-[10px] uppercase font-mono font-medium">
                      {adv.paymentMethod.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(adv.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={adv.notes || ""}>
                    {adv.notes || "—"}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {adv.status === "Paid" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] px-2 text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(adv.id)}
                          title="Delete / cancel advance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
export default SalaryAdvanceTable;
