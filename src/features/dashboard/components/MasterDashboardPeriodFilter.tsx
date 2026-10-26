import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  className,
}: MasterDashboardPeriodFilterProps) {
  const currentLabel =
    MASTER_PERIOD_OPTIONS.find((o) => o.value === value)?.label || "This Year";

  return (
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
        <DropdownMenuContent align="end" className="w-44 text-xs bg-popover border-border shadow-lg">
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
