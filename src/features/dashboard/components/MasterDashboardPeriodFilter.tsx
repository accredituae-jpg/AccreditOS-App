import { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CustomDateRangeDialog,
  DateRangeResult,
} from "@/components/ui/custom-date-range-dialog";
import { cn } from "@/lib/utils";
import { DashboardPeriod, CustomDateRange } from "./SectionPeriodFilter";

interface MasterDashboardPeriodFilterProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod, customRange?: CustomDateRange) => void;
  customRange?: CustomDateRange;
  className?: string;
}

export const MASTER_PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-year", label: "This Year" },
  { value: "all-time", label: "Whole Time" },
];

export function MasterDashboardPeriodFilter({
  value,
  onChange,
  customRange,
  className,
}: MasterDashboardPeriodFilterProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  let currentLabel =
    MASTER_PERIOD_OPTIONS.find((o) => o.value === value)?.label || "This Month";

  if (value === "custom" && customRange?.startDate && customRange?.endDate) {
    currentLabel = `${customRange.startDate} → ${customRange.endDate}`;
  }

  const handleApplyCustom = (result: DateRangeResult) => {
    onChange("custom", {
      startDate: result.startDate,
      endDate: result.endDate,
    });
    setCustomDialogOpen(false);
  };

  return (
    <>
      <div className={cn("inline-flex items-center", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold gap-2 rounded-xl border-border/80 bg-card hover:bg-muted/40 shadow-xs justify-between min-w-[130px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{currentLabel}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs bg-popover border-border shadow-lg">
            {MASTER_PERIOD_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className="flex items-center justify-between text-xs cursor-pointer py-1.5"
              >
                <span className={cn(value === opt.value ? "font-bold text-foreground" : "text-muted-foreground")}>
                  {opt.label}
                </span>
                {value === opt.value && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setCustomDialogOpen(true)}
              className="flex items-center justify-between text-xs cursor-pointer py-1.5 font-medium text-primary hover:text-primary"
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-primary" />
                <span>Custom Date Range...</span>
              </div>
              {value === "custom" && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CustomDateRangeDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        startDate={customRange?.startDate}
        endDate={customRange?.endDate}
        onApply={handleApplyCustom}
        title="Dashboard Custom Reporting Period"
        description="Select the custom date boundary in UAE business time to filter the executive and financial dashboard."
      />
    </>
  );
}
