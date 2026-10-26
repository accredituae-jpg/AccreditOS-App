import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { useToast } from "@/hooks/use-toast";
import { cn, formatAED } from "@/lib/utils";
import {
  Building2,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  ExternalLink,
  Percent,
  AlertCircle,
  Lock,
} from "lucide-react";
import { apiGetVendorBillCandidates, apiUpdateVendorBill } from "@/lib/api/financeApi";
import type { VendorBill } from "../types/billing.types";

interface EditVendorBillDialogProps {
  bill: VendorBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditVendorBillDialog({
  bill,
  open,
  onOpenChange,
  onSuccess,
}: EditVendorBillDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(true);
  const [status, setStatus] = useState<string>("ISSUED");

  // Vendor contact info
  const [vendorTRN, setVendorTRN] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorLocation, setVendorLocation] = useState("");

  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const hasPayments = Boolean(
    bill && (Number(bill.paidAmount) > 0 || (bill.payments && bill.payments.length > 0))
  );

  useEffect(() => {
    if (open && bill) {
      setDueDate(bill.dueDate ? new Date(bill.dueDate) : undefined);
      setPeriodStart(bill.billingPeriodStart ? new Date(bill.billingPeriodStart) : undefined);
      setPeriodEnd(bill.billingPeriodEnd ? new Date(bill.billingPeriodEnd) : undefined);
      setNotes(bill.notes || "");
      setIsVatEnabled(Number(bill.vatAmount) > 0);
      setStatus(bill.status || "ISSUED");
      setVendorTRN(bill.vendorTRN || "");
      setVendorPhone(bill.vendorPhone || "");
      setVendorEmail(bill.vendorEmail || "");
      setVendorLocation(bill.vendorLocation || "");

      // Initial selected certificate IDs from bill
      const currentCertIds = (bill.lineItems || [])
        .map((li) => li.certificateId)
        .filter((id): id is string => Boolean(id));
      setSelectedCertIds(currentCertIds);

      // Fetch candidate certificates including certificates from this bill
      if (bill.awardingBodyId) {
        setLoadingCandidates(true);
        const fromStr = bill.billingPeriodStart ? String(bill.billingPeriodStart).split("T")[0] : undefined;
        const toStr = bill.billingPeriodEnd ? String(bill.billingPeriodEnd).split("T")[0] : undefined;

        apiGetVendorBillCandidates(bill.awardingBodyId, fromStr, toStr, bill.id)
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setCandidates(res.data);
            } else {
              setCandidates([]);
            }
          })
          .catch((err) => {
            console.error("Failed to load candidates for edit:", err);
            setCandidates([]);
          })
          .finally(() => setLoadingCandidates(false));
      }
    }
  }, [open, bill]);

  if (!bill) return null;

  const selectedCandidates = candidates.filter((c) => selectedCertIds.includes(c.id));
  const vatPct = isVatEnabled ? 5.0 : 0;

  // If candidate items are loaded and editable, calculate preview
  const subtotal = !hasPayments && candidates.length > 0
    ? selectedCandidates.reduce((sum, c) => sum + (c.awardingBodyFee || 0), 0)
    : Number(bill.subtotal);

  const vatAmount = !hasPayments && candidates.length > 0
    ? (isVatEnabled ? subtotal * (vatPct / 100) : 0)
    : Number(bill.vatAmount);

  const totalAmount = !hasPayments && candidates.length > 0
    ? subtotal + vatAmount
    : Number(bill.totalAmount);

  const detectedUrls = notes.match(/(https?:\/\/[^\s]+)/g) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) {
      toast({
        title: "Validation Error",
        description: "Please select a due date.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPayments && selectedCertIds.length === 0 && candidates.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one certificate line item.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        dueDate: dueDate.toISOString().split("T")[0],
        billingPeriodStart: periodStart ? periodStart.toISOString().split("T")[0] : null,
        billingPeriodEnd: periodEnd ? periodEnd.toISOString().split("T")[0] : null,
        notes: notes.trim(),
        vendorTRN: vendorTRN.trim() || null,
        vendorPhone: vendorPhone.trim() || null,
        vendorEmail: vendorEmail.trim() || null,
        vendorLocation: vendorLocation.trim() || null,
      };

      if (!hasPayments) {
        payload.isVatEnabled = isVatEnabled;
        if (candidates.length > 0) {
          payload.certificateIds = selectedCertIds;
        }
        if (bill.status === "DRAFT" || bill.status === "ISSUED") {
          payload.status = status;
        }
      }

      const res = await apiUpdateVendorBill(bill.id, payload);

      if (!res.success) {
        throw new Error(res.message || "Failed to update vendor bill.");
      }

      toast({
        title: "Vendor Bill Updated",
        description: `Vendor Bill #${bill.billNumber} has been updated successfully.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update vendor bill.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCertIds.length === candidates.length) {
      setSelectedCertIds([]);
    } else {
      setSelectedCertIds(candidates.map((c) => c.id));
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={`Edit Vendor Bill — ${bill.billNumber}`}
      description={`Update bill particulars, notes, due date, and line items for ${bill.vendorName}`}
      icon={Building2}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Payment Lock Alert if payments exist */}
        {hasPayments && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Financial Line Items Locked</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Payments have been recorded against this bill (Paid: {formatAED(bill.paidAmount)}).
                Financial line items and VAT settings cannot be modified to preserve accounting integrity. You can still update due date, notes, and vendor contact info.
              </p>
            </div>
          </div>
        )}

        {/* Vendor Header Display */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Awarding Body / Vendor
            </span>
            <p className="text-sm font-bold text-foreground mt-0.5">{bill.vendorName}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Current Status
            </span>
            <Badge variant="outline" className="ml-2 capitalize text-xs">
              {bill.status}
            </Badge>
          </div>
        </div>

        {/* Date and Period selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Payment Due Date *</Label>
            <CustomCalendar
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select due date"
            />
          </div>

          {!hasPayments && (bill.status === "DRAFT" || bill.status === "ISSUED") ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bill Status</Label>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant={status === "ISSUED" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs flex-1"
                  onClick={() => setStatus("ISSUED")}
                >
                  Issued (Active AP)
                </Button>
                <Button
                  type="button"
                  variant={status === "DRAFT" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs flex-1"
                  onClick={() => setStatus("DRAFT")}
                >
                  Draft
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">TRN Number</Label>
              <Input
                value={vendorTRN}
                onChange={(e) => setVendorTRN(e.target.value)}
                placeholder="e.g. 100XXXXXXXXX003"
                className="h-9 text-xs font-mono"
              />
            </div>
          )}
        </div>

        {/* Billing Period (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Billing Period Start (Optional)</Label>
            <CustomCalendar
              value={periodStart}
              onChange={setPeriodStart}
              placeholder="From date..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Billing Period End (Optional)</Label>
            <CustomCalendar
              value={periodEnd}
              onChange={setPeriodEnd}
              placeholder="To date..."
            />
          </div>
        </div>

        {/* VAT Toggle (only if no payments) */}
        {!hasPayments && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/70 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" />
                <Label htmlFor="vat-toggle-edit" className="text-xs font-semibold cursor-pointer">
                  Standard VAT (5.0%)
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Apply standard 5% UAE VAT on taxable certificate fees
              </p>
            </div>
            <Switch
              id="vat-toggle-edit"
              checked={isVatEnabled}
              onCheckedChange={setIsVatEnabled}
            />
          </div>
        )}

        {/* Certificate Line Items Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Certificate Line Items ({hasPayments ? bill.lineItems?.length : `${selectedCertIds.length} of ${candidates.length}`})
            </Label>
            {!hasPayments && candidates.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-primary hover:text-primary/90"
                onClick={toggleSelectAll}
              >
                {selectedCertIds.length === candidates.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {hasPayments ? (
            /* Read-only line items view for bills with payments */
            <div className="border border-border/60 rounded-xl overflow-hidden max-h-[180px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-3 py-2 text-left">Cert #</th>
                    <th className="px-3 py-2 text-left">Participant</th>
                    <th className="px-3 py-2 text-left">Course</th>
                    <th className="px-3 py-2 text-right">Fee (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {bill.lineItems?.map((li) => (
                    <tr key={li.id} className="hover:bg-muted/10">
                      <td className="px-3 py-2 font-mono font-bold text-primary">{li.certificateNumber || "CERT"}</td>
                      <td className="px-3 py-2 font-medium">{li.participantName || "N/A"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{li.courseName || "Training Course"}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatAED(li.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : loadingCandidates ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              Scanning candidate certificates...
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              No additional candidate certificates found for this awarding body.
            </div>
          ) : (
            <div className="border border-border/60 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto divide-y divide-border/40">
              {candidates.map((cert) => {
                const isSelected = selectedCertIds.includes(cert.id);
                return (
                  <div
                    key={cert.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCertIds((prev) => prev.filter((id) => id !== cert.id));
                      } else {
                        setSelectedCertIds((prev) => [...prev, cert.id]);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between p-2.5 text-xs cursor-pointer transition-colors",
                      isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground truncate">
                            {cert.certificateNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80">• {cert.issueDate}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {cert.participantName} — {cert.courseName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono font-bold text-primary pl-2">
                      {formatAED(cert.awardingBodyFee || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Financial Summary Preview */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal ({hasPayments ? bill.lineItems?.length : selectedCandidates.length} certificates):</span>
            <span className="font-mono font-medium">{formatAED(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT ({isVatEnabled ? "5%" : "0% / Exempt"}):</span>
            <span className="font-mono font-medium">{formatAED(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-foreground border-t border-border/60 pt-1.5 text-sm">
            <span>Total Liability:</span>
            <span className="font-mono text-primary">{formatAED(totalAmount)}</span>
          </div>
          {Number(bill.paidAmount) > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
              <span>Paid to date:</span>
              <span className="font-mono">{formatAED(bill.paidAmount)}</span>
            </div>
          )}
        </div>

        {/* Notes & Attached Invoice/Receipt Links */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Notes & Attached Invoice/Receipt Link</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Official Vendor Invoice #TAT-4091: https://drive.google.com/file/d/..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />

          {detectedUrls.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {detectedUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded border border-primary/20"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview Link {detectedUrls.length > 1 ? `#${i + 1}` : ""}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormDialog>
  );
}
export default EditVendorBillDialog;
