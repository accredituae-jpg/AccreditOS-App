import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  User,
  Plus,
  FileText,
  CheckCircle2,
  Hash,
  Sparkles,
  Filter,
} from "lucide-react";
import { Client } from "@/lib/clients";
import { QuickAddClientDialog } from "@/features/clients/dialogs";
import {
  CustomerFormState,
  BillingType,
} from "../../types/invoice-wizard.types";
import { qk } from "@/lib/queryKeys";
import { apiGetPendingClientsSummary } from "@/lib/api/financeApi";
import { cn } from "@/lib/utils";

interface Step1CustomerProps {
  billingType: BillingType;
  onBillingTypeChange: (type: BillingType) => void;
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  clients: Client[];
  invoiceTypes: any[];
  selectedTypeId: string;
  onTypeIdChange: (typeId: string) => void;
  customerForm: CustomerFormState;
  onFieldChange: (field: keyof CustomerFormState, value: string) => void;
  nextInvoiceNum: string;
  isDeveloper?: boolean;
  onEditSequence?: () => void;
}

export function Step1Customer({
  billingType,
  onBillingTypeChange,
  selectedClientId,
  onClientChange,
  clients,
  invoiceTypes,
  selectedTypeId,
  onTypeIdChange,
  customerForm,
  onFieldChange,
  nextInvoiceNum,
  isDeveloper = false,
  onEditSequence,
}: Step1CustomerProps) {
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [localClients, setLocalClients] = useState<Client[]>(clients);
  const [onlyPendingFilter, setOnlyPendingFilter] = useState(true);

  React.useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  // Fetch pending clients summary (unbilled certs & inspections)
  const { data: summaryRes } = useQuery({
    queryKey: qk.pendingClientsSummary,
    queryFn: apiGetPendingClientsSummary,
    staleTime: 30 * 1000,
  });

  const summaryData = (summaryRes as any)?.data || summaryRes;
  const pendingInvoicing: Record<
    string,
    { count: number; certCount: number; inspectionCount: number }
  > = summaryData?.pendingInvoicing || {};

  const corporateClients = useMemo(() => {
    return localClients.filter((c: any) => {
      const name = c.companyName || c.label || c.meta?.companyName;
      return name && !name.toLowerCase().includes("individual candidate");
    });
  }, [localClients]);

  const clientsWithPending = useMemo(() => {
    return corporateClients.filter((c) => {
      const pending = pendingInvoicing[c.id];
      return pending && pending.count > 0;
    });
  }, [corporateClients, pendingInvoicing]);

  const displayedClients = useMemo(() => {
    if (onlyPendingFilter && clientsWithPending.length > 0) {
      if (
        selectedClientId &&
        !clientsWithPending.some((c) => c.id === selectedClientId)
      ) {
        const cur = corporateClients.find((c) => c.id === selectedClientId);
        if (cur) return [cur, ...clientsWithPending];
      }
      return clientsWithPending;
    }

    return [...corporateClients].sort((a, b) => {
      const countA = pendingInvoicing[a.id]?.count || 0;
      const countB = pendingInvoicing[b.id]?.count || 0;
      if (countA !== countB) return countB - countA;
      const nameA = a.companyName || a.label || "";
      const nameB = b.companyName || b.label || "";
      return nameA.localeCompare(nameB);
    });
  }, [
    onlyPendingFilter,
    clientsWithPending,
    corporateClients,
    selectedClientId,
    pendingInvoicing,
  ]);

  const handleSelectClient = (clientId: string) => {
    onClientChange(clientId);
    const clientObj = (localClients as any[]).find((c) => c.id === clientId);
    if (clientObj) {
      const companyName =
        clientObj.companyName ||
        clientObj.label ||
        clientObj.meta?.companyName ||
        "";
      onFieldChange("client", companyName);
      onFieldChange("trnNo", clientObj.trnNo || "");
      onFieldChange("poBox", clientObj.poBox || "");
      onFieldChange("location", clientObj.location || "");
      onFieldChange("phone", clientObj.phone || "");
      onFieldChange("referenceContact", clientObj.contactPerson || "");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Top Header Card: Invoice Category & Invoice Number / Sequence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-card/60 shadow-xs">
        {/* Invoice Category */}
        <div className="space-y-1.5">
          <div className="flex items-center h-5">
            <Label className="text-xs font-semibold text-foreground">
              Invoice Category <span className="text-destructive">*</span>
            </Label>
          </div>
          <Select value={selectedTypeId} onValueChange={onTypeIdChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {invoiceTypes.map((type) => (
                <SelectItem key={type.id} value={type.id} className="text-xs">
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Service category for this invoice
          </p>
        </div>

        {/* Invoice Number & Sequence */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-5">
            <Label className="text-xs font-semibold text-foreground">
              Invoice Number
            </Label>
            {isDeveloper && onEditSequence && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 text-[11px] px-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold gap-1 hover:bg-amber-500/10 rounded"
                onClick={onEditSequence}
              >
                <Hash className="w-3 h-3 text-amber-600" />
                Edit Sequence
              </Button>
            )}
          </div>
          <Input
            type="text"
            readOnly
            value={`Auto: ${nextInvoiceNum}`}
            className="h-9 bg-muted/40 font-mono text-xs font-bold text-primary tracking-wide cursor-default border-border/80"
          />
          <p className="text-[11px] text-muted-foreground">
            Will be assigned:{" "}
            <span className="font-mono font-bold text-primary">
              {nextInvoiceNum}
            </span>
          </p>
        </div>
      </div>

      {/* Billing To: Company vs Individual */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Billing Recipient *
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onBillingTypeChange("company")}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all ${
              billingType === "company"
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                : "border-border hover:bg-muted/30 text-muted-foreground"
            }`}
          >
            <Building2
              className={`w-4 h-4 ${billingType === "company" ? "text-primary" : "text-muted-foreground"}`}
            />
            <span>Company (B2B)</span>
          </button>

          <button
            type="button"
            onClick={() => onBillingTypeChange("individual")}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all ${
              billingType === "individual"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500/30"
                : "border-border hover:bg-muted/30 text-muted-foreground"
            }`}
          >
            <User
              className={`w-4 h-4 ${billingType === "individual" ? "text-emerald-500" : "text-muted-foreground"}`}
            />
            <span>Individual Candidate (B2C)</span>
          </button>
        </div>
      </div>

      {/* Recipient Details */}
      {billingType === "company" ? (
        <div className="space-y-3.5 p-3.5 rounded-xl border border-border/80 bg-card/40">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs font-semibold text-foreground">
                  Select Company *
                </Label>
                {clientsWithPending.length > 0 && (
                  <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/70 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOnlyPendingFilter(true)}
                      className={cn(
                        "px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1",
                        onlyPendingFilter
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Pending Billing ({clientsWithPending.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlyPendingFilter(false)}
                      className={cn(
                        "px-2 py-0.5 rounded-md font-medium transition-all",
                        !onlyPendingFilter
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span>All ({corporateClients.length})</span>
                    </button>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-1.5 text-primary hover:text-primary/80 gap-1"
                onClick={() => setShowQuickAddClient(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Quick Add Company
              </Button>
            </div>
            <Select value={selectedClientId} onValueChange={handleSelectClient}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Choose a corporate client..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {displayedClients.map((c: any) => {
                  const name = c.companyName || c.label || c.meta?.companyName;
                  const pending = pendingInvoicing[c.id];
                  const pendingCount = pending?.count || 0;

                  return (
                    <SelectItem key={c.id} value={c.id} className="text-xs py-1.5">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="truncate">{name}</span>
                        {pendingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                            {pendingCount} pending
                          </span>
                        ) : null}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {onlyPendingFilter && clientsWithPending.length === 0 && (
              <p className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between">
                <span>No clients have pending unbilled items.</span>
                <button
                  type="button"
                  onClick={() => setOnlyPendingFilter(false)}
                  className="text-primary hover:underline font-semibold"
                >
                  Show all clients ({corporateClients.length})
                </button>
              </p>
            )}
          </div>

          {selectedClientId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  TRN Number
                </Label>
                <Input
                  value={customerForm.trnNo}
                  onChange={(e) => onFieldChange("trnNo", e.target.value)}
                  placeholder="e.g. 100..."
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  City / Location
                </Label>
                <Input
                  value={customerForm.location}
                  onChange={(e) => onFieldChange("location", e.target.value)}
                  placeholder="e.g. Abu Dhabi, UAE"
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  P.O. Box
                </Label>
                <Input
                  value={customerForm.poBox}
                  onChange={(e) => onFieldChange("poBox", e.target.value)}
                  placeholder="e.g. 12345"
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Contact Person / Phone
                </Label>
                <Input
                  value={customerForm.phone}
                  onChange={(e) => onFieldChange("phone", e.target.value)}
                  placeholder="+971..."
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Private Candidate Invoicing (B2C)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Auto-populated from training & certificate records
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-background/80 rounded-lg p-3 border border-emerald-500/20 space-y-1.5">
            <p className="flex items-center gap-1.5 text-foreground font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>No manual data entry required</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Candidate full name, mobile number, and course details will be
              automatically loaded from their training record as soon as you
              select their certificate in Step 2.
            </p>
          </div>
        </div>
      )}

      <QuickAddClientDialog
        open={showQuickAddClient}
        onOpenChange={setShowQuickAddClient}
        onClientAdded={(newClient) => {
          setLocalClients((prev) => [newClient, ...prev]);
          handleSelectClient(newClient.id);
        }}
      />
    </div>
  );
}
