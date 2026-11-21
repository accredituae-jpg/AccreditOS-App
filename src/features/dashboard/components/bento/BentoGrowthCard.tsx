import { TrendingUp, TrendingDown } from "lucide-react";

interface BentoGrowthCardProps {
  operatingResult: number;
  grossRevenue: number;
  formatAED: (val: number, compact?: boolean) => string;
}

export function BentoGrowthCard({
  operatingResult = 0,
  grossRevenue = 0,
  formatAED,
}: BentoGrowthCardProps) {
  const isPositive = operatingResult >= 0;
  const marginPct =
    grossRevenue > 0
      ? Math.round((operatingResult / grossRevenue) * 1000) / 10
      : 0;

  // Normalized bar height (between 15% and 95%)
  const barHeight =
    grossRevenue > 0
      ? Math.min(95, Math.max(15, Math.round(((operatingResult + grossRevenue) / (grossRevenue * 2)) * 100)))
      : 20;

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Operating Margin
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {isPositive ? `+${marginPct}%` : `${marginPct}%`}
        </span>
      </div>

      {/* Main Metric */}
      <div className="my-1">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">
          Net Profit
        </span>
        <span
          className={`text-lg sm:text-xl font-black font-mono tracking-tight block ${
            isPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {formatAED(operatingResult, true)}
        </span>
      </div>

      {/* Vertical Pill Progress Indicator */}
      <div className="flex items-end justify-center gap-2.5 h-12 my-0.5">
        <div className="w-4 h-full bg-muted/40 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
          <div
            className="w-full bg-muted-foreground/30 rounded-full transition-all duration-500"
            style={{ height: "40%" }}
          />
        </div>
        <div className="w-5 h-full bg-muted/40 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
          <div
            className={`w-full rounded-full shadow-sm transition-all duration-500 ${
              isPositive
                ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-emerald-500/30"
                : "bg-gradient-to-t from-rose-600 to-amber-400 shadow-rose-500/30"
            }`}
            style={{ height: `${barHeight}%` }}
          />
        </div>
      </div>

      {/* Footer Label */}
      <div className="text-center pt-1 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center justify-center gap-1">
          {isPositive ? (
            <>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Profitable velocity</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3 text-rose-500" />
              <span>Opex exceeds collections</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
