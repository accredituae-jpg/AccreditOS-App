import { useState, useMemo } from "react";
import { Bell, ArrowUpRight, FileText, GraduationCap, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Invoice } from "@/features/billing/types/billing.types";
import type { Training } from "@/features/trainings/types/trainings.types";
import type { Certificate } from "@/features/certificates/types/certificates.types";

interface BentoActivityFeedCardProps {
  invoices?: Invoice[];
  trainings?: Training[];
  certificates?: Certificate[];
  formatAED: (val: number, compact?: boolean) => string;
}

export function BentoActivityFeedCard({
  invoices = [],
  trainings = [],
  certificates = [],
  formatAED,
}: BentoActivityFeedCardProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "billing" | "trainings" | "certificates">("all");

  const realActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      amount?: string;
      date: Date;
      timeStr: string;
      type: "billing" | "trainings" | "certificates";
      link: string;
      initials: string;
      color: string;
    }> = [];

    // 1. Invoices
    invoices.slice(0, 10).forEach((inv) => {
      const d = inv.date ? new Date(inv.date) : new Date();
      list.push({
        id: `inv-${inv.id}`,
        title: `Invoice #${inv.invoiceNumber}`,
        subtitle: inv.clientName || "Corporate Account",
        amount: formatAED(inv.totalAmount || 0, true),
        date: isNaN(d.getTime()) ? new Date() : d,
        timeStr: isNaN(d.getTime()) ? "Recent" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        type: "billing",
        link: "/finance/billing",
        initials: "INV",
        color: "bg-violet-600",
      });
    });

    // 2. Trainings
    trainings.slice(0, 10).forEach((tr) => {
      const d = tr.regDate ? new Date(tr.regDate) : new Date();
      list.push({
        id: `tr-${tr.id}`,
        title: tr.courseName || "Training Session",
        subtitle: tr.clientName || "Direct Candidate",
        date: isNaN(d.getTime()) ? new Date() : d,
        timeStr: isNaN(d.getTime()) ? "Scheduled" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        type: "trainings",
        link: "/trainings",
        initials: "TRN",
        color: "bg-emerald-600",
      });
    });

    // 3. Certificates
    certificates.slice(0, 10).forEach((c) => {
      const d = c.issueDate ? new Date(c.issueDate) : new Date();
      list.push({
        id: `ct-${c.id}`,
        title: `Cert #${c.certificateNumber || "Issued"}`,
        subtitle: `${c.candidateName || "Candidate"} • ${c.courseName || "Course"}`,
        date: isNaN(d.getTime()) ? new Date() : d,
        timeStr: isNaN(d.getTime()) ? "Issued" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        type: "certificates",
        link: "/certificates",
        initials: "CRT",
        color: "bg-amber-600",
      });
    });

    // Sort descending by date
    return list.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
  }, [invoices, trainings, certificates, formatAED]);

  const filtered = useMemo(() => {
    if (filter === "all") return realActivities;
    return realActivities.filter((a) => a.type === filter);
  }, [realActivities, filter]);

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-foreground">
            Live Activity & Logs
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono">
            {filtered.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="View activity logs"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-2.5 border-b border-border/50 text-[10px] font-bold overflow-x-auto">
        {(["all", "billing", "trainings", "certificates"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={cn(
              "capitalize px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0",
              filter === tab
                ? "bg-[#121028] text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Real Feed List */}
      <div className="space-y-1.5 py-1 min-h-[160px]">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="w-7 h-7 shrink-0 border border-border/70">
                  <AvatarFallback className={`${item.color} text-white font-bold text-[9px] tracking-wider`}>
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    <span>{item.title}</span>
                    {item.amount && (
                      <strong className="ml-1 text-emerald-600 dark:text-emerald-400 font-mono">
                        {item.amount}
                      </strong>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.subtitle} • <span className="font-mono">{item.timeStr}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(item.link)}
                className="h-6 px-2 rounded-full text-[10px] font-bold bg-[#121028] text-white hover:bg-violet-600 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
              >
                <span>Open</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No recent activity recorded in this scope.
          </div>
        )}
      </div>
    </div>
  );
}
