import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatAED, DIRHAM_SYMBOL, cn } from "@/lib/utils";
import { Percent, Sparkles, X } from "lucide-react";

export interface DiscountInputControlProps {
  discountType: "percentage" | "amount";
  discountValue: string;
  onDiscountTypeChange: (type: "percentage" | "amount") => void;
  onDiscountValueChange: (value: string) => void;
  subtotal: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  compact?: boolean;
  showPresets?: boolean;
}

export function DiscountInputControl({
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  subtotal,
  disabled = false,
  className,
  label = "Invoice Discount / Trade Concession",
  description = "Apply a discount as a percentage (%) or fixed amount (AED)",
  compact = false,
  showPresets = true,
}: DiscountInputControlProps) {
  const parsedVal = parseFloat(discountValue) || 0;
  const isDisabled = disabled || subtotal <= 0;

  let effectiveDiscountAmount = 0;
  let effectiveDiscountRate = 0;

  if (parsedVal > 0 && subtotal > 0) {
    if (discountType === "percentage") {
      const pct = Math.min(100, Math.max(0, parsedVal));
      effectiveDiscountRate = pct;
      effectiveDiscountAmount = (subtotal * pct) / 100;
    } else {
      effectiveDiscountAmount = Math.min(subtotal, Math.max(0, parsedVal));
      effectiveDiscountRate = Number(
        ((effectiveDiscountAmount / subtotal) * 100).toFixed(1)
      );
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = val.split(".");
    if (parts.length > 2) {
      val = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    if (discountType === "percentage" && parseFloat(val) > 100) {
      val = "100";
    }
    onDiscountValueChange(val);
  };

  const handleTypeSwitch = (nextType: "percentage" | "amount") => {
    if (nextType === discountType) return;
    onDiscountTypeChange(nextType);
    if (nextType === "percentage" && parseFloat(discountValue) > 100) {
      onDiscountValueChange("100");
    }
  };

  const handlePresetClick = (presetPct: number) => {
    if (presetPct === 0) {
      onDiscountValueChange("");
      return;
    }
    onDiscountTypeChange("percentage");
    onDiscountValueChange(String(presetPct));
  };

  const PRESETS = [5, 10, 15, 20];

  return (
    <div
      className={cn(
        "p-3 rounded-xl border border-border/80 bg-muted/20 transition-all",
        isDisabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span>{label}</span>
          </Label>
          {description && !compact && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Dual Mode Pill Switcher */}
        <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => handleTypeSwitch("percentage")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              discountType === "percentage"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Percent className="w-3 h-3" />
            <span>% Percentage</span>
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => handleTypeSwitch("amount")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              discountType === "amount"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{DIRHAM_SYMBOL} AED Amount</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Input Row */}
        <div className="relative">
          <Input
            type="text"
            inputMode="decimal"
            value={discountValue}
            onChange={handleInputChange}
            placeholder={
              discountType === "percentage"
                ? "e.g. 10 (for 10% discount)"
                : "e.g. 150.00"
            }
            disabled={isDisabled}
            className="h-8 text-xs font-mono font-bold pr-16 bg-background text-foreground"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {discountValue && !isDisabled && (
              <button
                type="button"
                onClick={() => onDiscountValueChange("")}
                className="text-muted-foreground hover:text-destructive p-0.5 rounded cursor-pointer transition-colors"
                title="Clear discount"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="font-mono text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {discountType === "percentage" ? "%" : "AED"}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        {showPresets && subtotal > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium mr-0.5">
              Presets:
            </span>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => handlePresetClick(0)}
              className={cn(
                "px-2 py-0.5 text-[10px] rounded-md border font-semibold transition-all cursor-pointer",
                !discountValue || parsedVal === 0
                  ? "bg-muted border-foreground/20 text-foreground font-bold"
                  : "bg-background border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              None (0%)
            </button>
            {PRESETS.map((pct) => (
              <button
                key={pct}
                type="button"
                disabled={isDisabled}
                onClick={() => handlePresetClick(pct)}
                className={cn(
                  "px-2 py-0.5 text-[10px] rounded-md border font-semibold transition-all cursor-pointer",
                  discountType === "percentage" && discountValue === String(pct)
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                    : "bg-background border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        )}

        {/* Live Calculation Feedback */}
        {effectiveDiscountAmount > 0 && subtotal > 0 && (
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                {discountType === "percentage"
                  ? `${effectiveDiscountRate}% discount applied`
                  : `Fixed discount applied (${effectiveDiscountRate}% of subtotal)`}
              </span>
            </span>
            <span className="font-mono font-bold">
              -{formatAED(effectiveDiscountAmount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
