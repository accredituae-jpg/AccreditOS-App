import { motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface ExpenseCardProps {
  expense: Expense;
  index: number;
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
}

export function ExpenseCard({
  expense,
  index,
  actions,
  permissions,
}: ExpenseCardProps) {
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
    <motion.div
      key={expense.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className={cn(
        "grid-card relative group hover:border-destructive/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between",
        permissions.canViewDetails && actions.onView && "cursor-pointer"
      )}
      onClick={() =>
        permissions.canViewDetails && actions.onView && actions.onView(expense)
      }
    >
      <div>
        {/* Card Header: Avatar, Category and Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0 transition-colors group-hover:bg-destructive group-hover:text-destructive-foreground">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-sm tracking-tight truncate">
                {expense.category}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isEmployee ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 truncate">
                    <User className="w-3 h-3 shrink-0" />
                    {expense.paidByName || "Employee"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                    <Building2 className="w-3 h-3 shrink-0" />
                    Company Direct
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            {isEmployee ? (
              isReturned ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[10px] font-semibold px-2 py-0.5"
                >
                  <CheckCircle2 className="w-3 h-3" /> Returned
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-[10px] font-semibold px-2 py-0.5"
                >
                  <Clock className="w-3 h-3" /> Not Returned
                </Badge>
              )
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground text-[10px] font-medium px-2 py-0.5"
              >
                Paid Direct
              </Badge>
            )}
          </div>
        </div>

        {/* Expense Info Container */}
        <div className="p-2.5 rounded-lg bg-muted/40 dark:bg-muted/15 border border-border/50 mb-3 space-y-1">
          <p className="font-medium text-foreground text-xs line-clamp-2">
            {expense.description || "No description provided"}
          </p>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>Method:</span>
            <span className="font-medium text-foreground">{methodLabel}</span>
          </div>
        </div>

        {/* Dates & Financial Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              Expense Date
            </span>
            <span className="font-medium text-foreground">{expense.date}</span>
          </div>

          <div className="mt-3 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/60 p-2.5 flex justify-between items-center">
            <span className="text-xs font-semibold text-foreground">
              Total Amount
            </span>
            <span className="text-base font-bold font-mono text-destructive">
              -{formatAED(expense.amount, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div
        className="mt-3 pt-3 border-t border-border flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {isNotReturned && actions.onReturn && permissions.canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg h-8 text-xs gap-1.5 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/15 font-semibold"
            onClick={() => actions.onReturn!(expense.id, "petty_cash")}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Mark Returned
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg h-8 text-xs gap-1.5 text-foreground hover:bg-muted font-medium"
          disabled={!actions.onView}
          onClick={() => actions.onView && actions.onView(expense)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>

        {allowEdit && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs px-2.5 gap-1.5 text-foreground hover:bg-muted"
            onClick={() => actions.onEdit(expense)}
            title="Edit Expense details"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-popover border border-border shadow-lg min-w-[150px]"
          >
            {isNotReturned && actions.onReturn && permissions.canEdit && (
              <>
                <DropdownMenuItem
                  onClick={() => actions.onReturn!(expense.id, "petty_cash")}
                  className="cursor-pointer text-amber-600 font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Return (Petty Cash)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onReturn!(expense.id, "cash")}
                  className="cursor-pointer text-amber-600 font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Return (Cash)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => actions.onReturn!(expense.id, "account")}
                  className="cursor-pointer text-amber-600 font-semibold"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Return (Bank)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {permissions.canViewDetails && actions.onView && (
              <DropdownMenuItem onClick={() => actions.onView!(expense)}>
                <Eye className="w-4 h-4 mr-2" /> View Details
              </DropdownMenuItem>
            )}
            {allowEdit && (
              <DropdownMenuItem onClick={() => actions.onEdit(expense)}>
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
    </motion.div>
  );
}
export default ExpenseCard;
