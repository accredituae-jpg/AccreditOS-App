import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BentoRevenueCardProps {
  totalRevenue: number;
  cashCollected: number;
  expenses: number;
  formatAED: (val: number, compact?: boolean) => string;
}

export function BentoRevenueCard({
  totalRevenue = 0,
  cashCollected = 0,
  expenses = 0,
  formatAED,
}: BentoRevenueCardProps) {
  const navigate = useNavigate();

  const total = totalRevenue + cashCollected + expenses;
  const cashPct = total > 0 ? Math.round((cashCollected / total) * 100) : 0;
  const revPct = total > 0 ? Math.round((totalRevenue / total) * 100) : 0;
  const expPct = total > 0 ? Math.round((expenses / total) * 100) : 0;

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Billed Revenue
        </span>
        <button
          type="button"
          onClick={() => navigate("/finance/billing")}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="View billing"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Big Currency Metric */}
      <div className="my-1">
        <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
          {formatAED(totalRevenue, true)}
        </h2>
        <span className="text-[10px] text-muted-foreground font-medium">
          Invoiced in active scope
        </span>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full h-2 rounded-full bg-muted/60 flex overflow-hidden gap-0.5">
          <div
            style={{ width: `${Math.max(cashPct, 2)}%` }}
            className="h-full bg-emerald-500 rounded-l-full"
            title={`Realized Cash: ${cashPct}%`}
          />
          <div
            style={{ width: `${Math.max(revPct, 2)}%` }}
            className="h-full bg-violet-500"
            title={`Invoiced Revenue: ${revPct}%`}
          />
          <div
            style={{ width: `${Math.max(expPct, 2)}%` }}
            className="h-full bg-rose-500 rounded-r-full"
            title={`Operating Opex: ${expPct}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9px] font-bold font-mono text-muted-foreground">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Cash {cashPct}%
          </span>
          <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            Rev {revPct}%
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Opex {expPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
