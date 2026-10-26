import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { useToast } from "@/hooks/use-toast";
import { cn, formatAED } from "@/lib/utils";
import { Building2, Calendar, FileText, CheckSquare, Square, ExternalLink, Percent } from "lucide-react";
import { apiGetAwardingBodies } from "@/lib/api/settingsApi";
import { apiGetVendorBillCandidates, apiCreateVendorBill } from "@/lib/api/financeApi";

interface AddVendorBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddVendorBillDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddVendorBillDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awardingBodies, setAwardingBodies] = useState<any[]>([]);
  const [selectedBodyId, setSelectedBodyId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date>();
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(true);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    if (open) {
      apiGetAwardingBodies().then((bodies) => {
        setAwardingBodies(bodies.filter((b) => b.isActive));
        if (bodies.length > 0) {
          setSelectedBodyId(bodies[0].id);
        }
      });
      // Default due date to 30 days from now
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 30);
      setDueDate(defaultDue);
    }
  }, [open]);

  // Synchronize VAT toggle default when selected Awarding Body changes
  useEffect(() => {
    if (selectedBodyId) {
      const body = awardingBodies.find((b) => b.id === selectedBodyId);
      if (body) {
        setIsVatEnabled(body.isVatRegistered !== false);
      }
    }
  }, [selectedBodyId, awardingBodies]);

  useEffect(() => {
    if (open && selectedBodyId) {
      setLoadingCandidates(true);
      const fromStr = periodStart ? periodStart.toISOString().split("T")[0] : undefined;
      const toStr = periodEnd ? periodEnd.toISOString().split("T")[0] : undefined;

      apiGetVendorBillCandidates(selectedBodyId, fromStr, toStr)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setCandidates(res.data);
            // Select all candidates by default
            setSelectedCertIds(res.data.map((c: any) => c.id));
          } else {
            setCandidates([]);
            setSelectedCertIds([]);
          }
        })
        .finally(() => setLoadingCandidates(false));
    }
  }, [open, selectedBodyId, periodStart, periodEnd]);

  const selectedCandidates = candidates.filter((c) => selectedCertIds.includes(c.id));

  const selectedBody = awardingBodies.find((b) => b.id === selectedBodyId);
  const rawVat = selectedBody ? Number(selectedBody.vatPercent) : 5.0;
  const vatPct = isVatEnabled ? (rawVat > 0 ? rawVat : 5.0) : 0;
  const selectedBodyFee = selectedBody ? Number(selectedBody.certificateFee || 0) : 0;

  const subtotal = selectedCandidates.reduce((sum, c) => {
    const fee = selectedBodyFee > 0 ? selectedBodyFee : Number(c.awardingBodyFee || 0);
    return sum + fee;
  }, 0);
  const vatAmount = isVatEnabled ? subtotal * (vatPct / 100) : 0;
  const totalAmount = subtotal + vatAmount;

  const detectedUrls = notes.match(/(https?:\/\/[^\s]+)/g) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBodyId) {
      toast({ title: "Validation Error", description: "Please select an awarding body.", variant: "destructive" });
      return;
    }
    if (!dueDate) {
      toast({ title: "Validation Error", description: "Please select a due date.", variant: "destructive" });
      return;
    }
    if (selectedCertIds.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one candidate certificate.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiCreateVendorBill({
        awardingBodyId: selectedBodyId,
        dueDate: dueDate.toISOString().split("T")[0],
        certificateIds: selectedCertIds,
        billingPeriodStart: periodStart ? periodStart.toISOString().split("T")[0] : undefined,
        billingPeriodEnd: periodEnd ? periodEnd.toISOString().split("T")[0] : undefined,
        notes: notes.trim(),
        isVatEnabled,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to create vendor bill.");
      }

      toast({
        title: "Vendor Bill Created",
        description: `Bill #${res.data.billNumber} for ${res.data.vendorName} created successfully (Total: ${formatAED(res.data.totalAmount)}).`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create vendor bill.",
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
      title="Create Vendor Bill (Accounts Payable)"
      description="Bundle un-billed certificate stamp fees into an official vendor liability bill"
      icon={Building2}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Generate Vendor Bill"
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Awarding Body (Supplier) *</Label>
          <Select value={selectedBodyId} onValueChange={setSelectedBodyId}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Select Awarding Body..." />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border shadow-lg">
              {awardingBodies.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name} (Fee: AED {Number(b.certificateFee || 0).toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Due Date *</Label>
          <CustomCalendar
            value={dueDate}
            onChange={setDueDate}
            placeholder="Select due date"
          />
        </div>
      </div>

      {/* Date Range Filter for Billing Period */}
      <div className="border border-border/60 rounded-xl p-3 bg-muted/10 space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          Filter Certificates by Billing Period (Optional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Period Start</Label>
            <CustomCalendar
              value={periodStart}
              onChange={setPeriodStart}
              placeholder="From date"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Period End</Label>
            <CustomCalendar
              value={periodEnd}
              onChange={setPeriodEnd}
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Candidate Certificates Section */}
      <div className="border border-border rounded-xl p-3.5 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-foreground">
              Unbilled Certificates ({selectedCertIds.length}/{candidates.length})
            </p>
          </div>
          {candidates.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="h-7 text-[11px] px-2 gap-1 text-primary hover:bg-primary/10"
            >
              {selectedCertIds.length === candidates.length ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5" /> Select All
                </>
              )}
            </Button>
          )}
        </div>

        {loadingCandidates ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Loading candidate certificates...</p>
        ) : candidates.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center italic">
            No un-billed certificates found for this awarding body in the selected period.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {candidates.map((c) => {
              const isChecked = selectedCertIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 hover:border-primary/30 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`cert-cand-${c.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCertIds((prev) => [...prev, c.id]);
                        } else {
                          setSelectedCertIds((prev) => prev.filter((id) => id !== c.id));
                        }
                      }}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    <Label htmlFor={`cert-cand-${c.id}`} className="cursor-pointer font-medium flex flex-col">
                      <span className="text-foreground font-semibold">{c.participantName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        [{c.certificateNumber}] • {c.courseName} ({c.issueDate})
                      </span>
                    </Label>
                  </div>
                  <span className="font-mono font-bold text-primary">
                    AED {(selectedBodyFee > 0 ? selectedBodyFee : Number(c.awardingBodyFee || 0)).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VAT Option Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="vatToggle" className="text-xs font-semibold cursor-pointer">
              Apply Standard VAT ({rawVat > 0 ? `${rawVat}%` : "5%"})
            </Label>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                isVatEnabled
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              {isVatEnabled ? "VAT Enabled" : "Zero-Rated / Exempt"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isVatEnabled
              ? "Calculates standard VAT on vendor stamp fees and adds to total bill liability."
              : "VAT will be disabled (0%) for this vendor bill."}
          </p>
        </div>
        <Switch
          id="vatToggle"
          checked={isVatEnabled}
          onCheckedChange={setIsVatEnabled}
          className="data-[state=checked]:bg-primary shrink-0"
        />
      </div>

      {/* Notes & Attached Invoice / Receipt Link */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">
            Notes / Attached Invoice or Receipt Link
          </Label>
          {detectedUrls.length > 0 && (
            <span className="text-[10px] font-medium text-primary flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {detectedUrls.length} link{detectedUrls.length > 1 ? "s" : ""} detected
            </span>
          )}
        </div>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Supplier Invoice # or paste Google Drive / Portal URL (https://...)"
          className="h-9 text-xs"
        />
        {detectedUrls.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-muted-foreground">Detected link:</span>
            {detectedUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 max-w-[260px] truncate"
              >
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          You can paste invoice or receipt links (Drive, Dropbox, vendor portal, etc.). They will be rendered as clickable links on this bill.
        </p>
      </div>

      {totalAmount > 0 && (
        <div className="border-t border-border pt-3 space-y-1.5 text-xs font-medium bg-muted/10 p-3 rounded-lg">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal ({selectedCandidates.length} Certs):</span>
            <span>{formatAED(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT ({isVatEnabled ? `${vatPct}%` : "0% / Exempt"}):</span>
            <span>{formatAED(vatAmount)}</span>
          </div>
          <div className="flex justify-between text-foreground font-bold text-sm border-t border-border pt-1.5">
            <span>Total Vendor Bill Liability:</span>
            <span className="text-primary font-mono">{formatAED(totalAmount)}</span>
          </div>
        </div>
      )}
    </FormDialog>
  );
}
