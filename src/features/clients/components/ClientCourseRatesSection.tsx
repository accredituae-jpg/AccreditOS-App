import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, Trash2, HelpCircle } from "lucide-react";
import { DIRHAM_SYMBOL } from "@/lib/utils";
import type { ClientCourseRates } from "@/lib/clients";

interface ClientCourseRatesSectionProps {
  rates: ClientCourseRates;
  onChange: (newRates: ClientCourseRates) => void;
  readOnly?: boolean;
}

const DEFAULT_BODIES = [
  { key: "tatweer", label: "Tatweer" },
  { key: "arbrit", label: "Arbrit" },
];

export function ClientCourseRatesSection({
  rates,
  onChange,
  readOnly = false,
}: ClientCourseRatesSectionProps) {
  const [newBodyKey, setNewBodyKey] = React.useState("");
  const [showAddCustom, setShowAddCustom] = React.useState(false);

  // Ensure default bodies exist in the display
  const allBodyKeys = React.useMemo(() => {
    const keys = new Set([...DEFAULT_BODIES.map((b) => b.key), ...Object.keys(rates || {})]);
    return Array.from(keys);
  }, [rates]);

  const handleRateChange = (bodyKey: string, tier: "normal" | "inspection", value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const existingTier = rates[bodyKey] || { normal: "", inspection: "" };
    onChange({
      ...rates,
      [bodyKey]: {
        ...existingTier,
        [tier]: sanitized,
      },
    });
  };

  const handleAddCustomBody = () => {
    const trimmed = newBodyKey.trim().toLowerCase();
    if (!trimmed) return;
    if (!rates[trimmed]) {
      onChange({
        ...rates,
        [trimmed]: { normal: "", inspection: "" },
      });
    }
    setNewBodyKey("");
    setShowAddCustom(false);
  };

  const handleRemoveBody = (bodyKey: string) => {
    const copy = { ...rates };
    delete copy[bodyKey];
    onChange(copy);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Agreed Course Pricing (AED)
          </Label>
          <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
            Tatweer & Arbrit
          </Badge>
        </div>

        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddCustom((p) => !p)}
            className="h-6 text-[11px] text-primary hover:text-primary gap-1 px-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddCustom ? "Cancel" : "Add Other Body"}
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Pre-set standard course fees for this client. When generating invoices for selected certificates, these rates automatically pre-fill for <strong>Tatweer</strong> and <strong>Arbrit</strong>.
      </p>

      {/* Add Custom Body Form */}
      {showAddCustom && !readOnly && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5">
          <Input
            value={newBodyKey}
            onChange={(e) => setNewBodyKey(e.target.value)}
            placeholder="e.g. Highfield or TUV"
            className="h-8 text-xs bg-background"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustomBody}
            disabled={!newBodyKey.trim()}
            className="h-8 text-xs px-3"
          >
            Add Body
          </Button>
        </div>
      )}

      {/* Rate Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allBodyKeys.map((bodyKey) => {
          const tier = rates[bodyKey] || { normal: "", inspection: "" };
          const isStandard = DEFAULT_BODIES.some((b) => b.key === bodyKey);
          const displayName =
            DEFAULT_BODIES.find((b) => b.key === bodyKey)?.label ||
            bodyKey.toUpperCase();

          return (
            <div
              key={bodyKey}
              className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/30 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {displayName}
                </span>

                {!isStandard && !readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBody(bodyKey)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Remove custom awarding body"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Normal Training Rate */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground block truncate">
                    Normal Training
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[10px] text-muted-foreground font-semibold pointer-events-none">
                      {DIRHAM_SYMBOL}
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={tier.normal ?? ""}
                      onChange={(e) => handleRateChange(bodyKey, "normal", e.target.value)}
                      placeholder="e.g. 50"
                      disabled={readOnly}
                      className="pl-7 h-8 text-xs font-mono font-bold bg-background text-right"
                    />
                  </div>
                </div>

                {/* Inspection / Supervisor Rate */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground block truncate">
                    Inspection / Super.
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[10px] text-muted-foreground font-semibold pointer-events-none">
                      {DIRHAM_SYMBOL}
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={tier.inspection ?? ""}
                      onChange={(e) => handleRateChange(bodyKey, "inspection", e.target.value)}
                      placeholder="e.g. 100"
                      disabled={readOnly}
                      className="pl-7 h-8 text-xs font-mono font-bold bg-background text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
