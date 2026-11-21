import { motion } from "framer-motion";
import { Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/permissions";

interface BentoHeroBannerProps {
  displayName?: string;
  pendingInvoicesCount: number;
  upcomingTrainingsCount: number;
  realizedCashFormatted: string;
  users?: UserProfile[];
  onQuickAction?: () => void;
}

export function BentoHeroBanner({
  displayName = "Team",
  pendingInvoicesCount,
  upcomingTrainingsCount,
  realizedCashFormatted,
  users = [],
  onQuickAction,
}: BentoHeroBannerProps) {
  const staffDisplay = users.slice(0, 3);
  const staffCount = users.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-[26px] bg-gradient-to-r from-[#121028] via-[#1a1738] to-[#121028] text-white p-5 sm:p-6 overflow-hidden border border-white/10 shadow-[0_15px_35px_rgba(18,16,40,0.35)] flex flex-col justify-between gap-5"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-56 h-32 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

      {/* Top row: Headline & Online Admins */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-[26px] font-bold tracking-tight text-white leading-tight">
            Your operations are having a <span className="italic font-serif font-normal text-violet-200">great week</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/65 mt-1.5 leading-relaxed max-w-xl">
            <span className="text-white font-semibold underline underline-offset-4 decoration-amber-400/80">
              {pendingInvoicesCount} invoices
            </span>{" "}
            pending settlement and{" "}
            <span className="text-white font-semibold underline underline-offset-4 decoration-violet-400/80">
              {upcomingTrainingsCount} batches
            </span>{" "}
            scheduled. Realized cash is on track.
          </p>
        </div>

        {/* Real Staff Online Pill Stack */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 self-start md:self-auto shrink-0 shadow-inner">
          {staffDisplay.length > 0 ? (
            <div className="flex -space-x-2">
              {staffDisplay.map((s, idx) => {
                const initials = s.name
                  ? s.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U";
                const colors = [
                  "bg-violet-600",
                  "bg-emerald-600",
                  "bg-amber-600",
                ];
                return (
                  <Avatar key={s.id} className="w-6 h-6 border-2 border-[#121028]">
                    <AvatarFallback className={`${colors[idx % 3]} text-[9px] text-white font-bold`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
          <span className="text-[11px] font-medium text-white/90 flex items-center gap-1.5 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {staffCount > 0 ? `${staffCount} active staff` : "System online"}
          </span>
        </div>
      </div>

      {/* Bottom row: Quick action electric pill & status pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onQuickAction}
            className="h-8.5 px-4 rounded-full bg-[#d9f99d] hover:bg-[#bef264] text-[#1a2e05] font-bold text-xs shadow-md shadow-[#d9f99d]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Quick Action</span>
          </Button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>
              Realized Cash:{" "}
              <strong className="text-white font-mono">{realizedCashFormatted}</strong>
            </span>
          </div>
        </div>

        <span className="text-[11px] text-white/60 font-medium tracking-wide flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Accredit-OS • All live streams synchronized
        </span>
      </div>
    </motion.div>
  );
}
