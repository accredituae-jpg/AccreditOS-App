import { useState, useMemo } from "react";
import { ArrowUpRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Training } from "@/features/trainings/types/trainings.types";
import type { Invoice } from "@/features/billing/types/billing.types";

interface BentoNeedsApprovalCardProps {
  pendingTrainings?: Training[];
  unpaidInvoices?: Invoice[];
  formatAED: (val: number, compact?: boolean) => string;
}

export function BentoNeedsApprovalCard({
  pendingTrainings = [],
  unpaidInvoices = [],
  formatAED,
}: BentoNeedsApprovalCardProps) {
  const navigate = useNavigate();

  // Consolidate real items that need attention/action
  const actionItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      amount?: string;
      link: string;
      type: "training" | "invoice";
    }> = [];

    // 1. Pending Trainings
    pendingTrainings.slice(0, 3).forEach((t) => {
      list.push({
        id: `t-${t.id}`,
        title: `Pending Training: ${t.courseName || "Training Session"}`,
        subtitle: `Client: ${t.clientName || "Direct"} • Participant: ${t.participantName || "Batch"}`,
        link: "/trainings",
        type: "training",
      });
    });

    // 2. Unpaid/Overdue Invoices
    unpaidInvoices.slice(0, 3).forEach((inv) => {
      list.push({
        id: `inv-${inv.id}`,
        title: `Outstanding Due: #${inv.invoiceNumber}`,
        subtitle: `Client: ${inv.clientName || "Corporate Account"}`,
        amount: formatAED(inv.balance || inv.totalAmount || 0, true),
        link: "/finance/billing",
        type: "invoice",
      });
    });

    return list;
  }, [pendingTrainings, unpaidInvoices, formatAED]);

  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const currentItem = actionItems[activeItemIndex] || actionItems[0];

  return (
    <div className="rounded-[24px] bg-[#121028] text-white p-4 sm:p-5 shadow-lg shadow-[#121028]/30 border border-white/10 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Needs Attention & Action
          </span>
          <span className="w-5 h-5 rounded-full bg-[#d9f99d] text-[#1a2e05] font-black text-[10px] flex items-center justify-center shadow-xs font-mono">
            {actionItems.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(currentItem?.link || "/finance/billing")}
          className="text-[10px] font-bold text-violet-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
        >
          <span>View all</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Real Action Item Card */}
      <div className="my-2">
        <AnimatePresence mode="wait">
          {currentItem ? (
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              onClick={() => navigate(currentItem.link)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3 shadow-inner cursor-pointer group transition-all"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white truncate block group-hover:text-amber-300 transition-colors">
                  {currentItem.title}
                </span>
                <span className="text-[10px] text-white/70 block truncate mt-0.5">
                  {currentItem.amount && (
                    <strong className="text-amber-300 font-mono mr-1.5 font-black">
                      {currentItem.amount}
                    </strong>
                  )}
                  {currentItem.subtitle}
                </span>
              </div>

              <div className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-[#d9f99d] group-hover:text-[#1a2e05] text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/5 text-center text-xs text-white/60 border border-white/10 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All operations on track • 0 pending approvals required</span>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation indicators */}
      <div className="flex items-center justify-between pt-1 text-[10px] text-white/50">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Real-time compliance monitoring
        </span>
        {actionItems.length > 1 && (
          <div className="flex gap-1">
            {actionItems.slice(0, 4).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveItemIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  i === activeItemIndex ? "w-3 bg-[#d9f99d]" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
