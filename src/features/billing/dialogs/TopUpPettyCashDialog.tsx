import React, { useState } from "react";
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
import { apiAddPettyCashTopUp } from "@/lib/api/financeApi";
import { Coins, Banknote, Landmark, Calendar, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface TopUpPettyCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TopUpPettyCashDialog({
  open,
  onOpenChange,
  onSuccess,
}: TopUpPettyCashDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"cash" | "account">("cash");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive top-up amount.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      const res = await apiAddPettyCashTopUp({
        amount: parsedAmount,
        date: `${y}-${m}-${d}`,
        source,
        notes: notes.trim() || undefined,
      });

      if (res?.success || (res as any)?.status === 201 || (res as any)?.status === 200) {
        toast({
          title: "Petty Cash Topped Up",
          description: `AED ${parsedAmount.toFixed(2)} added to Petty Cash from ${
            source === "cash" ? "Cash in Hand" : "Bank Account"
          }.`,
        });

        // Invalidate queries to refresh balances everywhere
        queryClient.invalidateQueries({ queryKey: ["reports", "cashbook"] });
        queryClient.invalidateQueries({ queryKey: ["petty-cash", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["billing", "expenses"] });

        setAmount("");
        setNotes("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res?.message || (res as any)?.data?.message || "Failed to top up petty cash.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Top-Up Failed",
        description: err.message || "Failed to record petty cash top-up.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
        <div className="bg-primary/5 p-4 border-b border-border/80 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">
              Top-Up Petty Cash Float
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Replenish the office petty cash drawer from Cash in Hand or Bank
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Top-up Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="topup-amount" className="text-xs font-semibold">
              Top-Up Amount (AED) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                AED
              </span>
              <Input
                id="topup-amount"
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
          </div>

          {/* Funding Source */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Funding Source</Label>
            <Select
              value={source}
              onValueChange={(val: "cash" | "account") => setSource(val)}
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
                        Withdrawal / Corporate account
                      </p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date
            </Label>
            <CustomCalendar
              value={date}
              onChange={(d) => setDate(d)}
              className="h-10 text-xs w-full"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="topup-notes" className="text-xs font-semibold">
              Purpose / Reference Note (Optional)
            </Label>
            <Textarea
              id="topup-notes"
              rows={2}
              placeholder="e.g. Monthly float replenish for office refreshments & courier"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
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
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Recording...
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
