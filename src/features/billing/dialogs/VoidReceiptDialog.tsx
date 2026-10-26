import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Receipt } from "../types/billing.types";
import { privateClient } from "@/lib/api/axios";

interface VoidReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptToVoid: Receipt | null;
  onVoidSuccess: () => Promise<void>;
}

export function VoidReceiptDialog({ open, onOpenChange, receiptToVoid, onVoidSuccess }: VoidReceiptDialogProps) {
  const { toast } = useToast();
  const [voidReason, setVoidReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear inputs when opening/closing
  useEffect(() => {
    if (!open) {
      setVoidReason("");
    }
  }, [open]);

  const handleVoid = async () => {
    if (!receiptToVoid) return;
    setLoading(true);
    try {
      const res = await privateClient.post(`/finance/receipts/${receiptToVoid.id}/void`, {
        reason: voidReason,
      });
      const data = res.data;
      
      toast({
        title: "Receipt Voided",
        description: `Receipt Voucher #${receiptToVoid.receiptNumber} has been successfully voided.`
      });
      onOpenChange(false);
      await onVoidSuccess();
    } catch (err: any) {
      toast({
        title: "Void Failed",
        description: err.message || "Failed to void receipt.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-1.5">
            <AlertCircle className="w-5 h-5" />
            Void Receipt Voucher
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to void this receipt? Voiding will roll back all payments made against its associated invoices. This action is irreversible.
          </p>
          <div className="space-y-2">
            <Label htmlFor="void-reason" className="text-xs font-semibold">Reason for Voiding <span className="text-muted-foreground font-normal">(Min. 5 characters)</span></Label>
            <Input
              id="void-reason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Bounced cheque / wrong amount"
              className="bg-white border border-border"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={voidReason.trim().length < 5 || loading}
              onClick={handleVoid}
            >
              {loading ? "Voiding..." : "Void Receipt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
