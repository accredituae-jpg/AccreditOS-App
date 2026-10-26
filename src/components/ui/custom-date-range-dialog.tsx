import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { cn } from "@/lib/utils";

export interface DateRangeResult {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startDateObj: Date;
  endDateObj: Date;
}

export interface CustomDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  onApply: (range: DateRangeResult) => void;
  title?: string;
  description?: string;
}

const formatDateToISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseToDate = (val?: Date | string | null): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === "string") {
    const clean = val.trim();
    if (!clean) return undefined;
    if (clean.includes("T")) {
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const parts = clean.split(/[-/]/).map(Number);
    if (parts.length >= 3 && !parts.slice(0, 3).some(isNaN)) {
      if (String(parts[0]).length === 4) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) return d;
      } else if (String(parts[2]).length === 4) {
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
};

export function CustomDateRangeDialog({
  open,
  onOpenChange,
  startDate,
  endDate,
  onApply,
  title = "Select Custom Date Range",
  description = "Choose start and end dates to filter your view.",
}: CustomDateRangeDialogProps) {
  const [selectedStart, setSelectedStart] = useState<Date | undefined>(() =>
    parseToDate(startDate)
  );
  const [selectedEnd, setSelectedEnd] = useState<Date | undefined>(() =>
    parseToDate(endDate)
  );

  // Sync state whenever dialog opens or initial values change
  useEffect(() => {
    if (open) {
      setSelectedStart(parseToDate(startDate) || new Date());
      setSelectedEnd(parseToDate(endDate) || new Date());
    }
  }, [open, startDate, endDate]);

  const isInvalidRange =
    selectedStart &&
    selectedEnd &&
    new Date(selectedEnd.getFullYear(), selectedEnd.getMonth(), selectedEnd.getDate()).getTime() <
      new Date(selectedStart.getFullYear(), selectedStart.getMonth(), selectedStart.getDate()).getTime();

  const handleApply = () => {
    if (!selectedStart || !selectedEnd || isInvalidRange) return;

    const startObj = new Date(selectedStart);
    startObj.setHours(0, 0, 0, 0);

    const endObj = new Date(selectedEnd);
    endObj.setHours(23, 59, 59, 999);

    onApply({
      startDate: formatDateToISO(startObj),
      endDate: formatDateToISO(endObj),
      startDateObj: startObj,
      endDateObj: endObj,
    });
    onOpenChange(false);
  };

  const applyPreset = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    setSelectedStart(start);
    setSelectedEnd(end);
  };

  const applyThisMonth = () => {
    const now = new Date();
    setSelectedStart(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  };

  const applyThisYear = () => {
    const now = new Date();
    setSelectedStart(new Date(now.getFullYear(), 0, 1));
    setSelectedEnd(new Date(now.getFullYear(), 11, 31));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 gap-4">
        <DialogHeader className="gap-1 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Presets Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-medium"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-medium"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={applyThisMonth}
            className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-medium"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={applyThisYear}
            className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-medium"
          >
            This Year
          </button>
        </div>

        {/* Two Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/70">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Start Date (From)
            </label>
            <CustomCalendar
              value={selectedStart}
              onChange={(date) => setSelectedStart(date)}
              placeholder="Select start date"
              className="h-10 text-xs w-full bg-card"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              End Date (To)
            </label>
            <CustomCalendar
              value={selectedEnd}
              onChange={(date) => setSelectedEnd(date)}
              placeholder="Select end date"
              className="h-10 text-xs w-full bg-card"
            />
          </div>
        </div>

        {/* Range validation alert */}
        {isInvalidRange && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>End date cannot be earlier than start date.</span>
          </div>
        )}

        {/* Summary pill */}
        {selectedStart && selectedEnd && !isInvalidRange && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/80 text-xs">
            <span className="text-muted-foreground font-medium">Selected Range:</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span>{formatDateToISO(selectedStart)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{formatDateToISO(selectedEnd)}</span>
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedStart || !selectedEnd || isInvalidRange}
            onClick={handleApply}
            className="h-9 text-xs gap-1.5"
          >
            <span>Apply Filter</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
