import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CustomDateRangeDialog,
  DateRangeResult,
} from "@/components/ui/custom-date-range-dialog";
import { cn } from "@/lib/utils";

export type DashboardPeriod =
  | "this-month"
  | "last-month"
  | "this-week"
  | "this-year"
  | "last-year"
  | "all-time"
  | "custom";

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface SectionPeriodFilterProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod, customRange?: CustomDateRange) => void;
  customRange?: CustomDateRange;
  className?: string;
}

export const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-week", label: "This Week" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "all-time", label: "All Time" },
  { value: "custom", label: "Custom Select" },
];

export function SectionPeriodFilter({
  value,
  onChange,
  customRange,
  className,
}: SectionPeriodFilterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelectChange = (val: DashboardPeriod) => {
    if (val === "custom") {
      setDialogOpen(true);
      // Even before opening dialog, notify parent that custom mode is active
      if (customRange?.startDate && customRange?.endDate) {
        onChange("custom", customRange);
      }
    } else {
      onChange(val);
    }
  };

  const handleApplyCustomRange = (result: DateRangeResult) => {
    onChange("custom", {
      startDate: result.startDate,
      endDate: result.endDate,
    });
  };

  const getDisplayLabel = () => {
    if (value === "custom") {
      if (customRange?.startDate && customRange?.endDate) {
        // e.g. "05/10 - 20/10"
        return `${customRange.startDate.slice(5)} to ${customRange.endDate.slice(5)}`;
      }
      return "Custom Select";
    }
    return PERIOD_OPTIONS.find((o) => o.value === value)?.label || "Period";
  };

  return (
    <div className={cn("flex items-center gap-1.5 shrink-0", className)}>
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger className="h-7 text-[11px] sm:text-xs font-medium px-2.5 py-0 rounded-md border border-border/70 bg-card hover:bg-muted/50 text-foreground transition-all gap-1 focus:ring-0 focus:ring-offset-0 shadow-none min-w-[95px] max-w-[140px]">
          <span className="truncate">{getDisplayLabel()}</span>
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg text-xs z-50">
          {PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Button to reopen popup if Custom is already selected */}
      {value === "custom" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="h-7 px-2 text-[10px] sm:text-[11px] font-medium border-border/80 bg-background hover:bg-muted text-foreground gap-1 rounded-md"
          title="Change Custom Dates"
        >
          <SlidersHorizontal className="w-3 h-3 text-primary" />
          <span>Dates</span>
        </Button>
      )}

      {/* Reusable Modal Dialog with two CustomCalendar pickers */}
      <CustomDateRangeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        startDate={customRange?.startDate}
        endDate={customRange?.endDate}
        onApply={handleApplyCustomRange}
        title="Custom Date Filter"
        description="Filter this section by selecting custom start and end dates."
      />
    </div>
  );
}
