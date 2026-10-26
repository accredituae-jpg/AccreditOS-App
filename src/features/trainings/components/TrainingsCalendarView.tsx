import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Users, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Training } from "../types/trainings.types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const STATUS_CONFIG: Record<
  string,
  {
    cardBg: string;
    cardBorder: string;
    titleColor: string;
    badgeBg: string;
    badgeText: string;
    dot: string;
    label: string;
  }
> = {
  pending: {
    cardBg: "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-950/40 dark:hover:bg-amber-900/50",
    cardBorder: "border-amber-500/30 dark:border-amber-500/40",
    titleColor: "text-amber-900 dark:text-amber-200",
    badgeBg: "bg-amber-500/20 dark:bg-amber-500/30",
    badgeText: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
    label: "Pending",
  },
  completed: {
    cardBg: "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50",
    cardBorder: "border-emerald-500/30 dark:border-emerald-500/40",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    badgeBg: "bg-emerald-500/20 dark:bg-emerald-500/30",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
    label: "Completed",
  },
  cancelled: {
    cardBg: "bg-rose-500/10 hover:bg-rose-500/15 dark:bg-rose-950/40 dark:hover:bg-rose-900/50",
    cardBorder: "border-rose-500/30 dark:border-rose-500/40",
    titleColor: "text-rose-900 dark:text-rose-200",
    badgeBg: "bg-rose-500/20 dark:bg-rose-500/30",
    badgeText: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
    label: "Cancelled",
  },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["completed", "cancelled"],
  completed: [], // no changes allowed from completed
  cancelled: ["pending"],
};

const DEFAULT_STATUS = STATUS_CONFIG.pending;

interface TrainingsCalendarViewProps {
  calendarMonth: Date;
  onCalendarMonthChange: (date: Date) => void;
  daysInMonth: number;
  startingDay: number;
  getTrainingsForDate: (day: number) => Training[];
  canViewDetails: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  onViewDetails: (training: Training) => void;
  onAddForDate?: (date: string) => void;
  onStatusChange?: (training: Training, newStatus: string) => void;
}

/** Expanded day panel rendered via Portal */
function DayExpandedPanel({
  day,
  dayTrainings,
  isToday,
  dateFormattedStr,
  canEdit,
  canCreate,
  onViewDetails,
  onAddForDate,
  onStatusChange,
  formatDayKey,
  onClose,
}: {
  day: number;
  dayTrainings: Training[];
  isToday: boolean;
  dateFormattedStr: string;
  canEdit?: boolean;
  canCreate?: boolean;
  onViewDetails: (t: Training) => void;
  onAddForDate?: (date: string) => void;
  onStatusChange?: (training: Training, newStatus: string) => void;
  formatDayKey: (d: number) => string;
  onClose: () => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusClick = async (training: Training, newStatus: string) => {
    if (updatingId || !onStatusChange) return;
    setUpdatingId(training.id);
    try {
      await onStatusChange(training, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-[92vw] max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ maxHeight: "82vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {dayTrainings.length} Training{dayTrainings.length !== 1 ? "s" : ""}
              </span>
              {isToday && (
                <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
                  Today
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{dateFormattedStr}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Training list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[52vh]">
          {dayTrainings.map((t, idx) => {
            const st = STATUS_CONFIG[t.status] || DEFAULT_STATUS;
            const isUpdating = updatingId === t.id;
            const allowedStatuses = STATUS_TRANSITIONS[t.status] || [];
            const canChangeStatus = canEdit && !!onStatusChange && allowedStatuses.length > 0;

            return (
              <div
                key={t.id}
                onClick={() => {
                  onClose();
                  onViewDetails(t);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer space-y-1.5",
                  st.cardBg,
                  st.cardBorder
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={cn("font-bold text-sm truncate", st.titleColor)}>
                    {idx + 1}. {t.participantName}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {canChangeStatus ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={isUpdating}
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-current/20 hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-60",
                              st.badgeBg,
                              st.badgeText
                            )}
                          >
                            {isUpdating ? (
                              <span className="inline-flex items-center gap-1 text-[10px]">
                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                Updating...
                              </span>
                            ) : (
                              <>
                                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                                {st.label}
                                <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                              </>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg min-w-[120px] z-[100000]">
                          {allowedStatuses.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusClick(t, s)}
                              className="capitalize text-xs cursor-pointer"
                            >
                              <span className={cn(
                                "inline-block w-2 h-2 rounded-full mr-2",
                                s === "completed" && "bg-emerald-500",
                                s === "cancelled" && "bg-rose-500",
                                s === "pending" && "bg-amber-500"
                              )} />
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-current/20",
                          st.badgeBg,
                          st.badgeText
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                        {st.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-medium opacity-85 truncate text-foreground flex items-center gap-1.5">
                  {t.serviceType === "inspection" && (
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded font-semibold leading-none shrink-0">
                      Inspection
                    </span>
                  )}
                  <span className="truncate">{t.courseName}</span>
                </div>

                {t.time && (
                  <div className="flex items-center gap-1.5 text-xs opacity-75 font-mono text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-foreground/70" />
                    <span>{t.time}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick add footer */}
        {canCreate && onAddForDate && (
          <div className="border-t border-border p-3 bg-muted/20">
            <button
              onClick={() => {
                onClose();
                onAddForDate(formatDayKey(day));
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-primary hover:bg-primary/10 py-2.5 px-3 rounded-xl transition-colors border border-primary/20 bg-primary/5"
            >
              <Plus className="w-4 h-4" />
              Add training on this day
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function TrainingsCalendarView({
  calendarMonth,
  onCalendarMonthChange,
  daysInMonth,
  startingDay,
  getTrainingsForDate,
  canViewDetails,
  canEdit,
  canCreate,
  onViewDetails,
  onAddForDate,
  onStatusChange,
}: TrainingsCalendarViewProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === calendarMonth.getFullYear() &&
    today.getMonth() === calendarMonth.getMonth();
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  const handlePrevMonth = () => {
    setExpandedDay(null);
    onCalendarMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setExpandedDay(null);
    onCalendarMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const formatDayKey = (day: number) => {
    const yyyy = calendarMonth.getFullYear();
    const mo = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    const dy = String(day).padStart(2, "0");
    return `${dy}-${mo}-${yyyy}`;
  };

  const formatFormattedDateStr = (day: number) => {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated p-3 sm:p-5 md:p-6"
      onClick={() => setExpandedDay(null)}
    >
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevMonth();
          }}
          className="rounded-lg h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          {isCurrentMonth && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Today is{" "}
              <span className="text-primary font-semibold">
                {today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleNextMonth();
          }}
          className="rounded-lg h-8 w-8 sm:h-9 sm:w-9"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-1 sm:p-2 text-center text-[11px] sm:text-xs font-semibold text-muted-foreground"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[52px] sm:min-h-[75px] md:min-h-[90px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayTrainings = getTrainingsForDate(day);
          const isToday = day === todayDay;
          const isExpanded = expandedDay === day;
          const hasTrainings = dayTrainings.length > 0;

          // Status of primary training
          const primarySt = hasTrainings ? STATUS_CONFIG[dayTrainings[0].status] || DEFAULT_STATUS : DEFAULT_STATUS;

          return (
            <div
              key={day}
              className={cn(
                "relative min-h-[52px] sm:min-h-[75px] md:min-h-[90px] border rounded-xl sm:rounded-lg transition-all group cursor-pointer",
                isToday
                  ? "border-primary bg-primary/8 shadow-sm shadow-primary/20"
                  : hasTrainings
                  ? `${primarySt.cardBg} ${primarySt.cardBorder}`
                  : "border-border/40 bg-background/20 hover:bg-muted/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (hasTrainings) {
                  setExpandedDay(isExpanded ? null : day);
                } else if (canCreate && onAddForDate) {
                  onAddForDate(formatDayKey(day));
                }
              }}
            >
              {/* Day number + quick add */}
              <div className="flex items-start justify-between p-1 sm:px-1.5 sm:pt-1.5">
                <span
                  className={cn(
                    "text-xs sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shrink-0",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                >
                  {day}
                </span>
                {canCreate && onAddForDate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddForDate(formatDayKey(day));
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 mt-0.5 hidden sm:flex"
                    title="Add training on this day"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mobile count badge with status colors */}
              {hasTrainings && (
                <div className="sm:hidden px-1 pb-1">
                  <div
                    className={cn(
                      "w-full text-center text-[10px] font-bold px-1 py-0.5 rounded-md border flex items-center justify-center gap-1",
                      primarySt.badgeBg,
                      primarySt.badgeText,
                      primarySt.cardBorder
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", primarySt.dot)} />
                    {dayTrainings.length}
                  </div>
                </div>
              )}

              {/* Desktop: training chips with distinct status styling */}
              <div className="hidden sm:block px-1 pb-1 space-y-0.5 mt-0.5">
                {dayTrainings.slice(0, 2).map((t) => {
                  const st = STATUS_CONFIG[t.status] || DEFAULT_STATUS;
                  return (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canViewDetails && !isExpanded) onViewDetails(t);
                      }}
                      className={cn(
                        "w-full text-left text-[10px] px-1.5 py-1 rounded-md border truncate font-medium transition-all hover:opacity-90 hover:scale-[1.01] flex items-center gap-1",
                        st.cardBg,
                        st.cardBorder,
                        st.titleColor
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                      <div className="font-semibold truncate flex-1">{t.participantName}</div>
                      {t.time && <div className="opacity-75 font-mono text-[9px] shrink-0">{t.time}</div>}
                    </button>
                  );
                })}

                {dayTrainings.length > 2 && !isExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDay(day);
                    }}
                    className="w-full text-[10px] text-primary font-semibold text-left px-1.5 py-0.5 hover:bg-primary/10 rounded transition-colors"
                  >
                    +{dayTrainings.length - 2} more
                  </button>
                )}
              </div>

              {/* Floating expanded panel via Portal */}
              {isExpanded && (
                <DayExpandedPanel
                  day={day}
                  dayTrainings={dayTrainings}
                  isToday={isToday}
                  dateFormattedStr={formatFormattedDateStr(day)}
                  canEdit={canEdit}
                  canCreate={canCreate}
                  onViewDetails={onViewDetails}
                  onAddForDate={onAddForDate}
                  onStatusChange={onStatusChange}
                  formatDayKey={formatDayKey}
                  onClose={() => setExpandedDay(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default TrainingsCalendarView;
