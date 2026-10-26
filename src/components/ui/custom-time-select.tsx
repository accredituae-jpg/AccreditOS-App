import React, { useState, useEffect } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CustomTimeSelectProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  className?: string;
}

const parseTime = (tStr: string | undefined) => {
  if (!tStr) return { hour: "08", minute: "00", period: "AM" };
  const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    return {
      hour: match[1].padStart(2, "0"),
      minute: match[2],
      period: match[3].toUpperCase() as "AM" | "PM",
    };
  }
  return { hour: "08", minute: "00", period: "AM" };
};

export function CustomTimeSelect({
  value,
  onChange,
  placeholder = "Select time",
  className,
}: CustomTimeSelectProps) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Sync state from value when popover opens
  useEffect(() => {
    if (open) {
      const parsed = parseTime(value);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [open, value]);

  const updateTime = (newHour: string, newMin: string, newPeriod: string) => {
    if (newHour !== "" && newMin !== "") {
      const fh = newHour.padStart(2, "0");
      const fm = newMin.padStart(2, "0");
      onChange?.(`${fh}:${fm} ${newPeriod}`);
    }
  };

  const incrementHour = () => {
    const next = parseInt(hour || "12") + 1;
    const val = (next > 12 ? 1 : next).toString().padStart(2, "0");
    setHour(val);
    updateTime(val, minute, period);
  };

  const decrementHour = () => {
    const next = parseInt(hour || "12") - 1;
    const val = (next < 1 ? 12 : next).toString().padStart(2, "0");
    setHour(val);
    updateTime(val, minute, period);
  };

  const incrementMinute = () => {
    const next = parseInt(minute || "00") + 1;
    const val = (next > 59 ? 0 : next).toString().padStart(2, "0");
    setMinute(val);
    updateTime(hour, val, period);
  };

  const decrementMinute = () => {
    const next = parseInt(minute || "00") - 1;
    const val = (next < 0 ? 59 : next).toString().padStart(2, "0");
    setMinute(val);
    updateTime(hour, val, period);
  };

  const togglePeriod = () => {
    const nextPeriod = period === "AM" ? "PM" : "AM";
    setPeriod(nextPeriod);
    updateTime(hour, minute, nextPeriod);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 2) {
      setHour(val);
      updateTime(val, minute, period);
    }
  };

  const handleHourBlur = () => {
    let num = parseInt(hour);
    if (isNaN(num) || num < 1) num = 12;
    if (num > 12) num = 12;
    const val = num.toString().padStart(2, "0");
    setHour(val);
    updateTime(val, minute, period);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 2) {
      setMinute(val);
      updateTime(hour, val, period);
    }
  };

  const handleMinuteBlur = () => {
    let num = parseInt(minute);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 59) num = 59;
    const val = num.toString().padStart(2, "0");
    setMinute(val);
    updateTime(hour, val, period);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "justify-start text-left font-normal h-10 px-3 bg-white dark:bg-card border border-border rounded-md hover:bg-white dark:hover:bg-card hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-colors w-full",
            !value && "text-muted-foreground/60",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-primary/60 flex-shrink-0" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-card border border-border shadow-xl rounded-2xl" align="start">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-3">
            Adjust Time
          </span>

          <div className="flex items-center justify-center gap-1 border border-border/80 bg-accent/5 dark:bg-accent/15 rounded-2xl py-2 px-3.5 w-[210px] h-20 shadow-inner select-none">
            {/* Hour Column */}
            <div className="flex flex-col items-center justify-center gap-0.5">
              <button
                type="button"
                onClick={incrementHour}
                className="text-muted-foreground/50 hover:text-primary transition-colors p-0.5 focus:outline-none active:scale-75"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={hour}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                className="w-10 h-8 text-center text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 leading-none text-foreground"
              />
              <button
                type="button"
                onClick={decrementHour}
                className="text-muted-foreground/50 hover:text-primary transition-colors p-0.5 focus:outline-none active:scale-75"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Separator - aligned perfectly in grid row */}
            <span className="text-xl font-bold text-muted-foreground/40 self-center h-8 flex items-center justify-center mb-0.5">
              :
            </span>

            {/* Minute Column */}
            <div className="flex flex-col items-center justify-center gap-0.5">
              <button
                type="button"
                onClick={incrementMinute}
                className="text-muted-foreground/50 hover:text-primary transition-colors p-0.5 focus:outline-none active:scale-75"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={minute}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                className="w-10 h-8 text-center text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 leading-none text-foreground"
              />
              <button
                type="button"
                onClick={decrementMinute}
                className="text-muted-foreground/50 hover:text-primary transition-colors p-0.5 focus:outline-none active:scale-75"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Spacer */}
            <div className="w-1.5" />

            {/* Period Column */}
            <div className="flex flex-col items-center justify-center gap-0.5">
              <button
                type="button"
                onClick={togglePeriod}
                className="text-muted-foreground/50 hover:text-primary transition-colors p-0.5 focus:outline-none active:scale-75"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={togglePeriod}
                className="w-11 h-8 text-center text-base font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 leading-none text-foreground cursor-pointer select-none active:scale-95 transition-transform"
              >
                {period}
              </button>
              <button
                type="button"
                onClick={togglePeriod}
                className="text-muted-foreground/50 hover:text-primary transition-colors p-0.5 focus:outline-none active:scale-75"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
