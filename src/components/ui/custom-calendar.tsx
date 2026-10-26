import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CustomCalendarProps {
  value?: Date | string | null;
  selected?: Date | string | null;
  onChange?: (date: Date) => void;
  onSelect?: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const shortMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const parseDate = (val?: Date | string | null): Date | undefined => {
  if (!val) return undefined;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
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
        // YYYY-MM-DD
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) return d;
      } else if (String(parts[2]).length === 4) {
        // DD-MM-YYYY
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
};

export function CustomCalendar({
  value,
  selected,
  onChange,
  onSelect,
  placeholder = "Select date",
  className,
}: CustomCalendarProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  const effectiveValue = value !== undefined ? value : selected;
  const effectiveDate = parseDate(effectiveValue);
  const [viewDate, setViewDate] = useState<Date>(() => effectiveDate || new Date());
  const [yearRangeStart, setYearRangeStart] = useState<number>(() => 
    Math.floor(((effectiveDate || new Date()).getFullYear()) / 12) * 12
  );

  useEffect(() => {
    if (effectiveDate) {
      setViewDate(effectiveDate);
      setYearRangeStart(Math.floor(effectiveDate.getFullYear() / 12) * 12);
    }
  }, [value, selected]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(viewDate);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange?.(newDate);
    onSelect?.(newDate);
    setOpen(false);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setViewMode("days");
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setYearRangeStart(Math.floor(year / 12) * 12);
    setViewMode("months");
  };

  const navigateMonth = (direction: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1));
  };

  const navigateYearRange = (direction: number) => {
    setYearRangeStart(yearRangeStart + direction * 12);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!effectiveDate) return false;
    return (
      day === effectiveDate.getDate() &&
      viewDate.getMonth() === effectiveDate.getMonth() &&
      viewDate.getFullYear() === effectiveDate.getFullYear()
    );
  };

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return "";
    return `${shortMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "w-full justify-start text-left h-10 px-3 bg-white dark:bg-card border border-border rounded-md hover:bg-white dark:hover:bg-card hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-colors",
            effectiveDate ? "text-foreground font-medium opacity-100" : "text-muted-foreground/60 font-normal",
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4 text-primary/70 flex-shrink-0" />
          <span className="truncate">
            {effectiveDate ? formatDate(effectiveDate) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border border-border shadow-xl z-[100]" align="start">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => viewMode === "years" ? navigateYearRange(-1) : navigateMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {viewMode === "days" && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-sm font-medium"
                  onClick={() => setViewMode("months")}
                >
                  {months[viewDate.getMonth()]}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-sm font-medium"
                  onClick={() => setViewMode("years")}
                >
                  {viewDate.getFullYear()}
                </Button>
              </div>
            )}
            
            {viewMode === "months" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-sm font-medium"
                onClick={() => setViewMode("years")}
              >
                {viewDate.getFullYear()}
              </Button>
            )}
            
            {viewMode === "years" && (
              <span className="text-sm font-medium">
                {yearRangeStart} - {yearRangeStart + 11}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => viewMode === "years" ? navigateYearRange(1) : navigateMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days View */}
          {viewMode === "days" && (
            <div className="grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
                  {day}
                </div>
              ))}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "w-8 h-8 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground",
                      isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          {/* Months View */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2">
              {shortMonths.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className={cn(
                    "py-2 px-3 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    viewDate.getMonth() === index && "bg-primary text-primary-foreground"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {/* Years View */}
          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const year = yearRangeStart + i;
                return (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      viewDate.getFullYear() === year && "bg-primary text-primary-foreground"
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {/* Today Button */}
          <div className="mt-3 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                const today = new Date();
                onChange?.(today);
                onSelect?.(today);
                setViewDate(today);
                setOpen(false);
              }}
            >
              Today
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
