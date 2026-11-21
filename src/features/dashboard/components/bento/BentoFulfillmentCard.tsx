import { useState } from "react";
import { Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoFulfillmentCardProps {
  completedTrainings: number;
  upcomingTrainings: number;
  issuedCertificatesCount: number;
}

export function BentoFulfillmentCard({
  completedTrainings = 0,
  upcomingTrainings = 0,
  issuedCertificatesCount = 0,
}: BentoFulfillmentCardProps) {
  const [scope, setScope] = useState<"completed" | "upcoming">("completed");

  const total = completedTrainings + upcomingTrainings;
  const progressRatio = total > 0 ? Math.round((completedTrainings / total) * 100) : 0;
  const activeSegments = Math.max(1, Math.round((progressRatio / 100) * 18));

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header with Completed / Upcoming Pill Toggle */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-xs sm:text-sm font-bold text-foreground">
          Training Delivery & Certs
        </h3>
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-full border border-border/50">
          <button
            type="button"
            onClick={() => setScope("completed")}
            className={cn(
              "px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer",
              scope === "completed"
                ? "bg-[#121028] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setScope("upcoming")}
            className={cn(
              "px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer",
              scope === "upcoming"
                ? "bg-[#121028] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Real Counter Row */}
      <div className="flex items-baseline gap-2.5 my-1">
        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
          {scope === "completed" ? completedTrainings : upcomingTrainings}
        </span>
        <span className="text-sm font-bold font-mono text-muted-foreground">
          / {total} total batches
        </span>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono ml-auto">
          {progressRatio}% done
        </span>
      </div>

      {/* Segmented Dot Track based on actual ratio */}
      <div className="flex items-center gap-1 my-2">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              i < activeSegments
                ? "bg-violet-600 dark:bg-violet-500 shadow-2xs"
                : "bg-muted/70",
            )}
          />
        ))}
      </div>

      {/* 2 Sub-tiles with real counts */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center text-center">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
            <Award className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-black font-mono text-foreground">
            {issuedCertificatesCount}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            Certs Issued
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-muted/20 border border-border/50 flex flex-col items-center text-center">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-black font-mono text-foreground">
            {upcomingTrainings}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            Active Batches
          </span>
        </div>
      </div>
    </div>
  );
}
