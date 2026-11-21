import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { useToast } from "@/hooks/use-toast";
import {
  apiAddPettyCashTopUp,
  apiGetPettyCashSummary,
} from "@/lib/api/financeApi";
import {
  Coins,
  Banknote,
  Landmark,
  Calendar,
  Loader2,
  ArrowRight,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatAED, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TopUpPettyCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialMode?: "topup" | "deposit";
}

export function TopUpPettyCashDialog({
  open,
  onOpenChange,
  onSuccess,
  initialMode = "topup",
}: TopUpPettyCashDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mode: "topup" (Inflow to Petty Cash) vs "deposit" (Petty Cash/Cash to Company Bank)
  const [mode, setMode] = useState<"topup" | "deposit">(initialMode);
  const [amount, setAmount] = useState("");
  const [topUpSource, setTopUpSource] = useState<"cash" | "account">("cash");
  const [depositSource, setDepositSource] = useState<
    "petty_to_bank" | "cash_to_bank"
  >("petty_to_bank");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync mode whenever dialog opens or initialMode changes
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setAmount("");
      setNotes("");
      setDate(new Date());
    }
  }, [open, initialMode]);

  // Fetch live petty cash & cash in hand balances
  const { data: summaryRes } = useQuery({
    queryKey: ["petty-cash", "summary"],
    queryFn: apiGetPettyCashSummary,
    enabled: open,
  });

  const pettyBalance = summaryRes?.data?.pettyCashBalance ?? 0;
  const cashInHandBalance = summaryRes?.data?.cashInHandBalance ?? 0;

  const currentAvailableBalance =
    depositSource === "petty_to_bank" ? pettyBalance : cashInHandBalance;

  const parsedAmount = parseFloat(amount) || 0;
  const isOverBalance =
    mode === "deposit" && parsedAmount > currentAvailableBalance && currentAvailableBalance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      const resolvedSource =
        mode === "deposit" ? depositSource : topUpSource;

      const res = await apiAddPettyCashTopUp({
        amount: parsedAmount,
        date: `${y}-${m}-${d}`,
        source: resolvedSource,
        type: mode,
        notes: notes.trim() || undefined,
      });

      if (
        res?.success ||
        (res as any)?.status === 201 ||
        (res as any)?.status === 200
      ) {
        if (mode === "deposit") {
          toast({
            title: "Bank Deposit Recorded",
            description: `${formatAED(parsedAmount, true)} deposited into Company Bank Account from ${
              depositSource === "petty_to_bank"
                ? "Petty Cash Float"
                : "Cash in Hand"
            }.`,
          });
        } else {
          toast({
            title: "Petty Cash Topped Up",
            description: `${formatAED(parsedAmount, true)} added to Petty Cash Float from ${
              topUpSource === "cash" ? "Cash in Hand" : "Bank Account"
            }.`,
          });
        }

        // Invalidate queries to refresh balances across the ERP
        queryClient.invalidateQueries({ queryKey: ["reports", "cashbook"] });
        queryClient.invalidateQueries({ queryKey: ["petty-cash", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["billing", "expenses"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });

        setAmount("");
        setNotes("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(
          res?.message ||
            (res as any)?.data?.message ||
            "Failed to record transaction.",
        );
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: mode === "deposit" ? "Deposit Failed" : "Top-Up Failed",
        description:
          err.message ||
          (mode === "deposit"
            ? "Failed to record bank deposit."
            : "Failed to record petty cash top-up."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
        {/* Header with Mode Tabs */}
        <div className="bg-muted/40 p-4 border-b border-border/80 space-y-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-colors",
                mode === "deposit"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
              )}
            >
              {mode === "deposit" ? (
                <Landmark className="w-4 h-4" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>
                  {mode === "deposit"
                    ? "Deposit Cash to Bank Account"
                    : "Top-Up Petty Cash Float"}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold",
                    mode === "deposit"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/25",
                  )}
                >
                  {mode === "deposit" ? "Bank Deposit" : "Float Inflow"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode === "deposit"
                  ? "Deposit excess petty cash or client cash into company bank account"
                  : "Replenish the office petty cash drawer from Cash in Hand or Bank"}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-background/80 rounded-xl border border-border/70 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("topup");
                setAmount("");
              }}
              className={cn(
                "py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                mode === "topup"
                  ? "bg-amber-500 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Top-Up Float</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("deposit");
                setAmount("");
              }}
              className={cn(
                "py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                mode === "deposit"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Deposit to Bank</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Transfer Visual Direction Pill */}
          <div className="p-2.5 rounded-xl bg-card border border-border/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              {mode === "deposit" ? (
                <>
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {depositSource === "petty_to_bank"
                      ? "Petty Cash Float"
                      : "Cash in Hand"}
                  </span>
                </>
              ) : (
                <>
                  {topUpSource === "cash" ? (
                    <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Landmark className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span>
                    {topUpSource === "cash" ? "Cash in Hand" : "Bank Account"}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted/60">
              <span>Transfer</span>
              <ArrowRight className="w-3 h-3 text-primary" />
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              {mode === "deposit" ? (
                <>
                  <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Company Bank</span>
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Petty Cash Drawer</span>
                </>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="transfer-amount" className="text-xs font-semibold">
                {mode === "deposit" ? "Deposit Amount (AED)" : "Top-Up Amount (AED)"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {mode === "deposit" && (
                <span className="text-[11px] text-muted-foreground">
                  Available:{" "}
                  <strong className="text-foreground font-mono">
                    {formatAED(currentAvailableBalance, true)}
                  </strong>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                AED
              </span>
              <Input
                id="transfer-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 font-mono font-semibold text-base h-10"
                autoFocus
              />
            </div>
            {isOverBalance && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>
                  Note: Amount exceeds current drawer balance ({formatAED(currentAvailableBalance)}). Ledger will reflect net drawer movement.
                </span>
              </p>
            )}
          </div>

          {/* Source Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {mode === "deposit" ? "Deposit From (Source Drawer)" : "Funding Source"}
            </Label>
            {mode === "deposit" ? (
              <Select
                value={depositSource}
                onValueChange={(val: "petty_to_bank" | "cash_to_bank") =>
                  setDepositSource(val)
                }
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petty_to_bank" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-semibold leading-tight flex items-center gap-1.5">
                          <span>Petty Cash Float</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({formatAED(pettyBalance, true)})
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Excess drawer cash deposit
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="cash_to_bank" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-semibold leading-tight flex items-center gap-1.5">
                          <span>Cash in Hand</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({formatAED(cashInHandBalance, true)})
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Client payment receipts deposit
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={topUpSource}
                onValueChange={(val: "cash" | "account") => setTopUpSource(val)}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-semibold leading-tight">Cash in Hand</p>
                        <p className="text-[10px] text-muted-foreground">
                          Physical collections drawer
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="account" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-semibold leading-tight">Bank Account</p>
                        <p className="text-[10px] text-muted-foreground">
                          Withdrawal from company bank
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>
                {mode === "deposit" ? "Bank Deposit Date" : "Top-Up Date"}
              </span>
            </Label>
            <CustomCalendar
              value={date}
              onChange={(d) => setDate(d)}
              className="h-10 text-xs w-full"
            />
          </div>

          {/* Notes / Reference */}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-notes" className="text-xs font-semibold">
              {mode === "deposit"
                ? "Bank Deposit Slip / Reference (Optional)"
                : "Purpose / Reference Note (Optional)"}
            </Label>
            <Textarea
              id="transfer-notes"
              rows={2}
              placeholder={
                mode === "deposit"
                  ? "e.g. ATM deposit slip #12345 / Al Ansari deposit slip / Excess float banking"
                  : "e.g. Monthly float replenish for office refreshments & courier"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Accounting Notice */}
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {mode === "deposit"
                ? "This is an internal transfer (Contra). It reduces cash and increases bank balance without creating an expense or altering Net Profit."
                : "Internal float transfer. Does not create an operating expense."}
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className={cn(
                mode === "deposit"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  : "",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Recording...
                </>
              ) : mode === "deposit" ? (
                <>
                  <Landmark className="w-3.5 h-3.5 mr-1.5" />
                  Confirm Bank Deposit
                </>
              ) : (
                "Confirm Top-Up"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
