import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Banknote,
  Landmark,
  RotateCcw,
  User,
  Calendar,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGetPettyCashSummary } from "@/lib/api/financeApi";
import { formatAED, cn } from "@/lib/utils";
import type { Expense, ExpensePaymentMethod } from "../types/billing.types";

interface ReimburseExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onConfirm: (id: string, method: ExpensePaymentMethod) => Promise<void> | void;
}

export function ReimburseExpenseDialog({
  open,
  onOpenChange,
  expense,
  onConfirm,
}: ReimburseExpenseDialogProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<ExpensePaymentMethod>("petty_cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live balances for Petty Cash & Cash in Hand to give full visibility
  const { data: summaryRes } = useQuery({
    queryKey: ["petty-cash", "summary"],
    queryFn: apiGetPettyCashSummary,
    enabled: open,
  });

  const pettyBalance = summaryRes?.data?.pettyCashBalance ?? 0;
  const cashInHandBalance = summaryRes?.data?.cashInHandBalance ?? 0;

  useEffect(() => {
    if (open) {
      setSelectedMethod("petty_cash");
      setIsSubmitting(false);
    }
  }, [open, expense]);

  if (!expense) return null;

  const expenseAmount = Number(expense.amount) || 0;
  const isPettyLow =
    selectedMethod === "petty_cash" &&
    pettyBalance < expenseAmount &&
    pettyBalance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onConfirm(expense.id, selectedMethod);
      onOpenChange(false);
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = expense.date
    ? new Date(expense.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="p-5 pb-4 bg-muted/20 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Reimburse Employee Expense
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Mark out-of-pocket payment as repaid to staff
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Expense Snapshot Card */}
          <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  {expense.paidByName || "Employee / Staff"}
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold"
              >
                Out-of-Pocket
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
              <p className="font-medium text-foreground line-clamp-2">
                {expense.description || "Expense Reimbursement"}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-muted-foreground/70" />
                  {expense.category || "General"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground/70" />
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Amount to Return:
              </span>
              <span className="text-base font-mono font-bold text-foreground">
                {formatAED(expenseAmount)}
              </span>
            </div>
          </div>

          {/* Funding Source Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Select Funding Source to Return From</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Where will cash/funds come from?
              </span>
            </Label>

            <div className="grid gap-2">
              {/* Option 1: Petty Cash Float */}
              <button
                type="button"
                onClick={() => setSelectedMethod("petty_cash")}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3",
                  selectedMethod === "petty_cash"
                    ? "border-amber-500 bg-amber-500/10 shadow-sm"
                    : "border-border/70 hover:border-border hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    selectedMethod === "petty_cash"
                      ? "bg-amber-500 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Petty Cash Drawer
                    </span>
                    {selectedMethod === "petty_cash" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Reimburse employee from physical cash float drawer
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">
                    <span>Available in drawer:</span>
                    <span className="font-bold">{formatAED(pettyBalance)}</span>
                  </div>
                </div>
              </button>

              {/* Option 2: Company Bank Account */}
              <button
                type="button"
                onClick={() => setSelectedMethod("account")}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3",
                  selectedMethod === "account"
                    ? "border-blue-500 bg-blue-500/10 shadow-sm"
                    : "border-border/70 hover:border-border hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    selectedMethod === "account"
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Company Bank Account
                    </span>
                    {selectedMethod === "account" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Reimburse via online bank transfer / company card
                  </p>
                </div>
              </button>

              {/* Option 3: Cash in Hand */}
              <button
                type="button"
                onClick={() => setSelectedMethod("cash")}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3",
                  selectedMethod === "cash"
                    ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                    : "border-border/70 hover:border-border hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    selectedMethod === "cash"
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Cash in Hand
                    </span>
                    {selectedMethod === "cash" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Reimburse employee directly from office cash on hand
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    <span>Available in cash:</span>
                    <span className="font-bold">
                      {formatAED(cashInHandBalance)}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {isPettyLow && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Note: Expense exceeds current drawer float ({formatAED(pettyBalance)}).
              </span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Returning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm Return ({formatAED(expenseAmount)})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
