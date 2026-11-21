import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Training } from "@/features/trainings/types/trainings.types";

interface BentoCalendarStripProps {
  trainings?: Training[];
  onSelectDate?: (date: Date) => void;
}

export function BentoCalendarStrip({
  trainings = [],
  onSelectDate,
}: BentoCalendarStripProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Calculate the 7 days of the week based on current week offset
  const { weekDays, monthLabel } = useMemo(() => {
    const today = new Date();
    // Monday of current week
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + currentWeekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      // Check if this date has any real scheduled trainings
      const dayTrainingsCount = trainings.filter((t) => {
        if (!t.regDate) return false;
        const tDate = new Date(t.regDate);
        return (
          tDate.getFullYear() === d.getFullYear() &&
          tDate.getMonth() === d.getMonth() &&
          tDate.getDate() === d.getDate()
        );
      }).length;

      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      days.push({
        dateObj: d,
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        isToday,
        trainingsCount: dayTrainingsCount,
      });
    }

    const monthLabel = monday.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return { weekDays: days, monthLabel };
  }, [currentWeekOffset, trainings]);

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const todayIdx = weekDays.findIndex((d) => d.isToday);
    return todayIdx !== -1 ? todayIdx : 0;
  });

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 shadow-sm flex flex-col justify-between">
      {/* Month & Nav Controls */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-base font-bold text-foreground tracking-tight">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all border border-border/60 cursor-pointer"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all border border-border/60 cursor-pointer"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Pill Scrubber */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1">
        {weekDays.map((d, index) => {
          const isSelected = index === selectedDayIdx;
          return (
            <button
              key={`${d.name}-${d.dayNum}`}
              type="button"
              onClick={() => {
                setSelectedDayIdx(index);
                if (onSelectDate) onSelectDate(d.dateObj);
              }}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer group relative",
                isSelected
                  ? "bg-[#121028] text-white shadow-md shadow-[#121028]/25 ring-1 ring-white/10"
                  : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider mb-0.5",
                  isSelected ? "text-white/70" : "text-muted-foreground/80",
                )}
              >
                {d.name}
              </span>
              <span
                className={cn(
                  "text-xs sm:text-sm font-black font-mono leading-none",
                  isSelected ? "text-white" : "text-foreground",
                )}
              >
                {d.dayNum}
              </span>

              {/* Indicator dot if real trainings exist on this day */}
              {d.trainingsCount > 0 && (
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5",
                    isSelected ? "bg-[#d9f99d]" : "bg-violet-500",
                  )}
                  title={`${d.trainingsCount} training sessions`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
