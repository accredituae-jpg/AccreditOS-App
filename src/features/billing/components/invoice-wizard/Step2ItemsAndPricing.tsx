import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  X,
  Plus,
  Trash2,
  Percent,
  Check,
  AlertCircle,
  User,
  Layers,
  ListFilter,
  GraduationCap,
  Users,
} from "lucide-react";
import { formatAED, DIRHAM_SYMBOL, cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { isInspectionOrSupervisorCourse } from "@/features/clients/utils/courseRates.utils";
import {
  BillableCertificateItem,
  ManualLineItem,
  TaxMode,
} from "../../utils/invoice-calculations";
import { DiscountInputControl } from "../DiscountInputControl";
import {
  PricingGroup,
  BillingType,
  CustomerFormState,
  InvoiceItemGrouping,
} from "../../types/invoice-wizard.types";

interface Step2ItemsAndPricingProps {
  billingType?: BillingType;
  customerForm?: CustomerFormState;
  isTrainingType: boolean;
  isLoadingCertificates: boolean;
  billableItems: BillableCertificateItem[];
  filteredBillableItems: BillableCertificateItem[];
  selectedCertIds: string[];
  onToggleSelectCertificate: (id: string) => void;
  onSelectAllFiltered: () => void;
  onDeselectAllFiltered: () => void;
  certSearchQuery: string;
  onSearchChange: (q: string) => void;
  pricingGroups: PricingGroup[];
  courseRates: Record<string, string>;
  onRateChange: (groupKey: string, rate: string) => void;
  taxMode: TaxMode;
  onTaxModeChange: (mode: TaxMode) => void;
  saveRatesToClient?: boolean;
  onSaveRatesToClientChange?: (val: boolean) => void;
  manualLineItems: ManualLineItem[];
  onManualLineItemsChange: React.Dispatch<
    React.SetStateAction<ManualLineItem[]>
  >;
  calculations: {
    subtotal: number;
    discount?: number;
    discountRate?: number;
    vatAmount: number;
    total: number;
  };
  discountType?: "percentage" | "amount";
  discountValue?: string;
  onDiscountTypeChange?: (type: "percentage" | "amount") => void;
  onDiscountValueChange?: (val: string) => void;
  groupingMode?: InvoiceItemGrouping;
  onGroupingModeChange?: (mode: InvoiceItemGrouping) => void;
}

export function Step2ItemsAndPricing({
  billingType,
  customerForm,
  isTrainingType,
  isLoadingCertificates,
  billableItems,
  filteredBillableItems,
  selectedCertIds,
  onToggleSelectCertificate,
  onSelectAllFiltered,
  onDeselectAllFiltered,
  certSearchQuery,
  onSearchChange,
  pricingGroups,
  courseRates,
  onRateChange,
  taxMode,
  onTaxModeChange,
  saveRatesToClient = true,
  onSaveRatesToClientChange,
  manualLineItems,
  onManualLineItemsChange,
  calculations,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  groupingMode = "itemized",
  onGroupingModeChange,
}: Step2ItemsAndPricingProps) {
  const maxCertLimit = 13;

  const activeCandidateName = React.useMemo(() => {
    if (billingType !== "individual" || selectedCertIds.length === 0) return "";
    const firstSelected = billableItems.find((i) =>
      selectedCertIds.includes(i.id),
    );
    return firstSelected?.participantName?.trim().toLowerCase() || "";
  }, [billingType, selectedCertIds, billableItems]);

  const isInspectionMode = React.useMemo(() => {
    return (
      billableItems.length > 0 &&
      billableItems.every((b) => b.serviceType === "inspection")
    );
  }, [billableItems]);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* 1. Certificate Selection (if Training/Inspection) */}
      {isTrainingType && (
        <div className="border border-border rounded-xl p-3.5 bg-muted/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Select Services / Certificates to Invoice
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selectedCertIds.length} of {billableItems.length} unbilled service
                {billableItems.length === 1 ? "" : "s"} selected (Training & Inspection)
              </p>
            </div>

            {billableItems.length > 0 && (
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border self-start sm:self-auto",
                  selectedCertIds.length > maxCertLimit
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : selectedCertIds.length >= maxCertLimit - 2
                      ? "bg-amber-500/10 text-amber-600 border-amber-400/30"
                      : "bg-primary/10 text-primary border-primary/30",
                )}
              >
                {selectedCertIds.length} / {maxCertLimit} selected
              </span>
            )}
          </div>

          {/* Individual mode candidate lock reminder */}
          {billingType === "individual" && activeCandidateName && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg font-medium">
              <span>
                Selected for:{" "}
                <strong>{customerForm?.client || activeCandidateName}</strong>.
                Certificates for other candidates are disabled for this invoice.
              </span>
            </div>
          )}

          {isLoadingCertificates ? (
            <div className="space-y-2.5 py-1 animate-pulse">
              <Skeleton className="h-8 w-full rounded-md" />
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border border-border/40 bg-card/60 flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-border/40 bg-card/60 flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                </div>
              </div>
            </div>
          ) : billableItems.length > 0 ? (
            <>
              {/* Search and Select All Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={certSearchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search candidate name, cert number (e.g. 5899), course..."
                    className="h-8 pl-8 pr-8 text-xs bg-background"
                  />
                  {certSearchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {filteredBillableItems.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] px-2.5 whitespace-nowrap font-medium"
                    onClick={() => {
                      const selectableItems =
                        billingType === "individual" && activeCandidateName
                          ? filteredBillableItems.filter(
                              (i) =>
                                i.participantName?.trim().toLowerCase() ===
                                activeCandidateName,
                            )
                          : filteredBillableItems;
                      const targetIds = selectableItems.map((i) => i.id);
                      const allSelected = targetIds.every((id) =>
                        selectedCertIds.includes(id),
                      );
                      if (allSelected) {
                        onDeselectAllFiltered();
                      } else {
                        onSelectAllFiltered();
                      }
                    }}
                  >
                    {filteredBillableItems.every((i) =>
                      selectedCertIds.includes(i.id),
                    )
                      ? "Deselect Filtered"
                      : "Select Filtered"}
                  </Button>
                )}
              </div>

              {/* Certificate Checklist */}
              {filteredBillableItems.length > 0 ? (
                <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5">
                  {filteredBillableItems.map((item) => {
                    const isChecked = selectedCertIds.includes(item.id);
                    const isDifferentCandidate =
                      billingType === "individual" &&
                      Boolean(activeCandidateName) &&
                      item.participantName?.trim().toLowerCase() !==
                        activeCandidateName;
                    const certNum = item.certificateNumber
                      ? item.certificateNumber.match(/\d+/)?.[0] ||
                        item.certificateNumber
                      : null;
                    const isInspection = item.serviceType === "inspection";
                    const body = (item.awardingBody || "").trim();
                    const isTatweer =
                      body.toLowerCase().includes("tatweer") ||
                      body.toLowerCase().includes("tct") ||
                      (!body && Boolean(certNum));
                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          !isDifferentCandidate &&
                          onToggleSelectCertificate(item.id)
                        }
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs transition-all select-none ${
                          isDifferentCandidate
                            ? "border-border/30 bg-muted/20 opacity-40 cursor-not-allowed"
                            : isChecked
                              ? "border-primary/40 bg-primary/5 text-foreground cursor-pointer"
                              : "border-border/50 bg-card hover:border-primary/20 text-muted-foreground cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDifferentCandidate}
                          onChange={() => {}} // Handled by container click
                          className={`w-4 h-4 mt-0.5 rounded text-primary accent-primary ${
                            isDifferentCandidate
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isInspection ? (
                              <span className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-[10px] px-1.5 py-0.5 rounded">
                                Inspection
                              </span>
                            ) : isTatweer ? (
                              certNum ? (
                                <span className="font-mono font-bold text-primary text-[11px]">
                                  #{certNum}
                                </span>
                              ) : (
                                <span className="font-semibold text-primary/80 bg-primary/10 border border-primary/20 text-[10px] px-1.5 py-0.5 rounded">
                                  Tatweer
                                </span>
                              )
                            ) : (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0.5 rounded">
                                {certNum
                                  ? `${body || "External"} #${certNum}`
                                  : body || "External"}
                              </span>
                            )}
                            <span className="font-semibold text-foreground truncate">
                              {item.participantName}
                            </span>
                            {item.customCompany && (
                              <span className="text-[10px] text-muted-foreground font-normal">
                                [{item.customCompany}]
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.course} • {item.awardingBody || "General"}
                          </p>
                        </div>
                        {isDifferentCandidate && (
                          <span className="text-[9px] font-semibold text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0 self-center">
                            Different Candidate
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  No certificates match "{certSearchQuery}"
                </p>
              )}

              {selectedCertIds.length > maxCertLimit && (
                <p className="text-[10px] text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {selectedCertIds.length} items selected — PDF may overflow to
                  2 pages. Recommended max is {maxCertLimit}.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic py-2">
              No un-invoiced certificates found for this customer.
            </p>
          )}
        </div>
      )}

      {/* Candidate Auto-fill Banner for Individual Invoices */}
      {billingType === "individual" && customerForm?.client && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-foreground">
                Billed Candidate: {customerForm.client}
              </span>
              {customerForm.phone && (
                <span className="text-[11px] font-mono text-muted-foreground ml-2">
                  • Phone: {customerForm.phone}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
            Auto-linked from Training
          </span>
        </div>
      )}

      {/* 2. Course & Awarding Body Pricing Cards */}
      {isTrainingType && selectedCertIds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
              Course Pricing Rates
            </Label>
            <span className="text-[10px] text-muted-foreground">
              {pricingGroups.length} course tier
              {pricingGroups.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pricingGroups.map((grp) => {
              const rate = courseRates[grp.key] || "";
              const rawRate = parseFloat(rate) || 0;
              const groupTotal =
                taxMode === "exclusive"
                  ? grp.count * Number((rawRate * 1.05).toFixed(2))
                  : grp.count * rawRate;

              const isInspection = isInspectionOrSupervisorCourse(grp.course);

              return (
                <div
                  key={grp.key}
                  className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {grp.course}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {grp.awardingBody} • {grp.count} candidate
                          {grp.count > 1 ? "s" : ""}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.2 rounded border",
                            isInspection
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
                              : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25"
                          )}
                        >
                          {isInspection ? "Inspection / Super." : "Normal Training"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                      {grp.count} {grp.count > 1 ? "certs" : "cert"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {DIRHAM_SYMBOL}
                      </span>
                      <Input
                        type="text"
                        value={rate}
                        onChange={(e) => onRateChange(grp.key, e.target.value)}
                        placeholder="Rate / candidate"
                        className="h-7 text-xs w-24 font-mono font-bold bg-background text-right"
                        required
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-primary">
                        {formatAED(groupTotal)}
                      </span>
                      <p className="text-[9px] text-muted-foreground leading-none">
                        {taxMode === "exclusive"
                          ? "+5% VAT"
                          : taxMode === "inclusive"
                            ? "Tax Included"
                            : "0% VAT"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remember / Save rates for this client option */}
          {onSaveRatesToClientChange && billingType !== "individual" && (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
              <div className="space-y-0.5 pr-2">
                <p className="font-bold text-foreground text-xs">
                  Remember & Save Rates for Client
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Update agreed course pricing so you won't need to re-enter them on future invoices for {customerForm?.client || "this client"}.
                </p>
              </div>
              <Switch
                checked={saveRatesToClient}
                onCheckedChange={onSaveRatesToClientChange}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. Manual Line Items (Only for General / non-certificate invoices) */}
      {!isTrainingType && (
        <div className="border border-border rounded-xl p-3.5 bg-muted/10 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Invoice Line Items
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onManualLineItemsChange((prev) => [
                  ...prev,
                  {
                    description: "",
                    quantity: 1,
                    unit: "Qty",
                    unitPrice: 0,
                    discount: 0,
                    vatPercent: 5.0,
                  },
                ])
              }
              className="h-7 text-xs px-2 gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {manualLineItems.map((li, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end border-b border-border/40 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="col-span-6 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Description
                  </Label>
                  <Input
                    value={li.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      onManualLineItemsChange((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, description: val } : item,
                        ),
                      );
                    }}
                    placeholder="Description of service / item"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Qty
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={li.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      onManualLineItemsChange((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, quantity: val } : item,
                        ),
                      );
                    }}
                    className="h-8 text-xs bg-background text-center"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    Rate ({DIRHAM_SYMBOL})
                  </Label>
                  <Input
                    type="text"
                    value={li.unitPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      onManualLineItemsChange((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, unitPrice: val } : item,
                        ),
                      );
                    }}
                    placeholder="0.00"
                    className="h-8 text-xs bg-background font-mono text-right"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={manualLineItems.length === 1}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() =>
                      onManualLineItemsChange((prev) =>
                        prev.filter((_, idx) => idx !== index),
                      )
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tax / VAT Calculation Mode */}
      <div className="border border-border rounded-xl p-3 bg-muted/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-primary" />
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              VAT / Tax Calculation
            </Label>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {taxMode === "exclusive" && "5% VAT added on top of amount"}
            {taxMode === "inclusive" && "5% VAT included inside amount"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onTaxModeChange("exclusive")}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
              taxMode === "exclusive"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <input
              type="radio"
              name="taxMode"
              checked={taxMode === "exclusive"}
              onChange={() => onTaxModeChange("exclusive")}
              className="w-3.5 h-3.5 text-primary accent-primary cursor-pointer"
            />
            <span>+5% Tax Added</span>
          </button>

          <button
            type="button"
            onClick={() => onTaxModeChange("inclusive")}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
              taxMode === "inclusive"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                : "border-border hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <input
              type="radio"
              name="taxMode"
              checked={taxMode === "inclusive"}
              onChange={() => onTaxModeChange("inclusive")}
              className="w-3.5 h-3.5 text-primary accent-primary cursor-pointer"
            />
            <span>5% Tax Included</span>
          </button>
        </div>
      </div>

      {/* 5. Discount Control */}
      {calculations.subtotal > 0 && onDiscountTypeChange && onDiscountValueChange && (
        <DiscountInputControl
          discountType={discountType ?? "percentage"}
          discountValue={discountValue ?? ""}
          onDiscountTypeChange={onDiscountTypeChange}
          onDiscountValueChange={onDiscountValueChange}
          subtotal={calculations.subtotal}
          compact={true}
        />
      )}

      {/* 6. Live Totals Strip */}
      {calculations.subtotal > 0 && (
        <div className="p-3.5 rounded-xl bg-card border border-border/80 flex items-center justify-between shadow-xs flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                Subtotal
              </span>
              <span className="font-mono font-semibold">
                {formatAED(calculations.subtotal)}
              </span>
            </div>
            {(calculations.discount ?? 0) > 0 && (
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase block font-semibold">
                  Discount {calculations.discountRate ? `(${calculations.discountRate}%)` : ""}
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  -{formatAED(calculations.discount)}
                </span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                VAT (5%)
              </span>
              <span className="font-mono font-semibold">
                {formatAED(calculations.vatAmount)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-primary uppercase font-bold block">
              Grand Total
            </span>
            <span className="text-base font-extrabold font-mono text-primary">
              {formatAED(calculations.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
