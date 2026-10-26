import React, { memo } from "react";
import {
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Receipt as ReceiptIcon,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatAED, cn } from "@/lib/utils";
import type { Expense, ExpensePaymentMethod } from "../types/billing.types";
import { isExpenseEditable } from "../utils/billing.utils";

interface ExpenseTableProps {
  expenses: Expense[];
  permissions: {
    canViewDetails?: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isSuperAdmin?: boolean;
  };
  actions: {
    onView?: (expense: Expense) => void;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string, category: string) => void;
    onReturn?: (id: string, method?: ExpensePaymentMethod) => void;
  };
  loading?: boolean;
}

export const ExpenseTable = memo(function ExpenseTable({ expenses, actions, permissions, loading = false }: ExpenseTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Expense Category</th>
            <th>Description</th>
            <th>Paid By / Method</th>
            <th>Status</th>
            <th>Date</th>
            <th className="text-right">Amount</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skel-exp-${i}`}>
                <td>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </td>
                <td><Skeleton className="h-4 w-32" /></td>
                <td><Skeleton className="h-4 w-28" /></td>
                <td><Skeleton className="h-5 w-20 rounded-full" /></td>
                <td><Skeleton className="h-4 w-20" /></td>
                <td className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className="text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
              </tr>
            ))
          ) : expenses.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                No expenses found.
              </td>
            </tr>
          ) : (
            expenses.map((expense, index) => {
              const isEmployee = expense.paidByType === "employee";
              const isNotReturned = isEmployee && expense.status === "not_returned";
              const isReturned = isEmployee && expense.status === "returned";

              const editCheck = isExpenseEditable(expense, permissions.isSuperAdmin);
              const allowEdit = permissions.canEdit && editCheck.canEdit;

              const methodLabel =
                expense.paymentMethod === "petty_cash"
                  ? "Petty Cash"
                  : expense.paymentMethod === "cash"
                  ? "Cash"
                  : "Account (Bank)";

              return (
                <tr
                  key={expense.id}
                  onClick={() => permissions.canViewDetails && actions.onView && actions.onView(expense)}
                  className="hover:bg-muted/10 transition-colors duration-150 cursor-pointer group"
                >
                  {/* Category Cell with Avatar */}
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0 transition-colors group-hover:bg-destructive group-hover:text-destructive-foreground">
                        <ReceiptIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs truncate">
                          {expense.category}
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-semibold px-1.5 py-0"
                        >
                          Expense
                        </Badge>
                      </div>
                    </div>
                  </td>

                  {/* Description Cell */}
                  <td className="py-3">
                    <p className="text-muted-foreground text-xs max-w-[220px] truncate" title={expense.description}>
                      {expense.description || "—"}
                    </p>
                  </td>

                  {/* Paid By & Method */}
                  <td className="py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        {isEmployee ? (
                          <>
                            <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[130px]" title={expense.paidByName || "Employee"}>
                              {expense.paidByName || "Employee"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>Company</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {methodLabel}
                      </span>
                    </div>
                  </td>

                  {/* Status Cell */}
                  <td className="py-3 whitespace-nowrap">
                    {isEmployee ? (
                      isReturned ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] gap-1 font-semibold py-0.5"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Returned
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-1 font-semibold py-0.5"
                        >
                          <Clock className="w-3 h-3" /> Not Returned
                        </Badge>
                      )
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground text-[10px] font-medium py-0.5"
                      >
                        Paid Direct
                      </Badge>
                    )}
                  </td>

                  {/* Date Cell */}
                  <td className="py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{expense.date}</span>
                    </div>
                  </td>

                  {/* Amount Cell */}
                  <td className="py-3 text-right">
                    <span className="font-mono font-bold text-destructive text-xs">
                      -{formatAED(expense.amount, true)}
                    </span>
                  </td>

                  {/* Actions Cell */}
                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Quick Return Button for Not Returned Employee Expenses */}
                      {isNotReturned && actions.onReturn && permissions.canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => actions.onReturn!(expense.id, "petty_cash")}
                          className="h-7 text-[11px] px-2 gap-1 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/15 font-semibold"
                          title="Mark as Returned (Reimbursed from Petty Cash)"
                        >
                          <RotateCcw className="w-3 h-3" /> Return
                        </Button>
                      )}

                      {permissions.canViewDetails && actions.onView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => actions.onView!(expense)}
                          className="h-7 text-xs px-2.5 gap-1 text-foreground hover:bg-muted font-medium"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover shadow-lg border border-border min-w-[150px]"
                        >
                          {isNotReturned && actions.onReturn && permissions.canEdit && (
                            <>
                              <DropdownMenuItem
                                onClick={() => actions.onReturn!(expense.id, "petty_cash")}
                                className="cursor-pointer text-amber-600 font-semibold"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" /> Return via Petty Cash
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => actions.onReturn!(expense.id, "cash")}
                                className="cursor-pointer text-amber-600 font-semibold"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" /> Return via Cash
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => actions.onReturn!(expense.id, "account")}
                                className="cursor-pointer text-amber-600 font-semibold"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" /> Return via Bank
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {allowEdit && (
                            <DropdownMenuItem
                              onClick={() => actions.onEdit(expense)}
                              className="cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" /> Edit Expense
                            </DropdownMenuItem>
                          )}
                          {permissions.canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => actions.onDelete(expense.id, expense.category)}
                                className="text-destructive font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});
export default ExpenseTable;
