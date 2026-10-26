import React, { memo } from "react";
import { Edit, CheckCircle2, DollarSign, MoreHorizontal, Clock, Trash2, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatAED, cn } from "@/lib/utils";
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

interface PayrollTableProps {
  records: PayrollRecord[];
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

export const PayrollTable = memo(function PayrollTable({
  records,
  permissions,
  actions,
  onView,
  openNotesDialog,
}: PayrollTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Gross Salary</th>
            <th className="px-4 py-3">Net Salary</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {records.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                No payroll records found.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={record.id}
                onClick={() => permissions.canView && onView(record)}
                className={cn(
                  "hover:bg-muted/10 transition-colors duration-150",
                  permissions.canView && "cursor-pointer"
                )}
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {record.userName || record.user?.name || "Unknown Employee"}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-medium">
                  {`${MONTH_NAMES[record.month - 1]} ${record.year}`}
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {formatAED(record.grossSalary, true)}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-foreground">
                  {formatAED(record.netSalary, true)}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {permissions.canManage && (record.status === "draft" || record.status === "approved") ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer focus:outline-none">
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize text-[10px] font-semibold gap-1",
                              record.status === "approved"
                                ? "bg-info/10 text-info border-info/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {record.status}
                          </Badge>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-card border border-border shadow-lg min-w-[130px]">
                        {record.status === "draft" && (
                          <>
                            <DropdownMenuItem
                              className="capitalize text-xs cursor-pointer"
                              onClick={() => actions.onApprove(record)}
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="capitalize text-xs cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => actions.onCancel(record)}
                            >
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                        {record.status === "approved" && (
                          <>
                            <DropdownMenuItem
                              className="capitalize text-xs cursor-pointer"
                              onClick={() => actions.onPay(record)}
                            >
                              Mark as paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="capitalize text-xs cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => actions.onCancel(record)}
                            >
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-[10px] font-semibold gap-1",
                        record.status === "paid"
                          ? "bg-success/10 text-success border-success/20"
                          : record.status === "cancelled"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-warning/10 text-warning border-warning/20"
                      )}
                    >
                      {record.status === "paid" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : record.status === "cancelled" ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {record.status}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-1">
                    {permissions.canView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(record)}
                        className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3 h-3" /> View
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg">
                        <DropdownMenuItem onClick={() => onView(record)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openNotesDialog(record)}>
                          <Edit className="w-4 h-4 mr-2" /> {record.status === "draft" ? "Edit notes" : "View notes"}
                        </DropdownMenuItem>
                        {permissions.canManage && record.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={() => actions.onApprove(record)}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-info" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => actions.onCancel(record)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2 text-destructive" /> Cancel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => actions.onDelete(record.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {permissions.canManage && record.status === "approved" && (
                          <>
                            <DropdownMenuItem onClick={() => actions.onPay(record)}>
                              <DollarSign className="w-4 h-4 mr-2 text-success" /> Mark as paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => actions.onCancel(record)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2 text-destructive" /> Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
export default PayrollTable;
