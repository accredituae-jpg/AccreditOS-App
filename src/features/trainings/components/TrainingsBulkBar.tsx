import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Award,
  GraduationCap,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrainingsBulkBarProps {
  selectedCount: number;
  totalFilteredCount?: number;
  onSelectAllFiltered?: () => void | Promise<void>;
  onClearSelection: () => void;
  onBulkIssueCertificates: () => void;
  onBulkStatusUpdate?: (newStatus: string) => Promise<void>;
  canIssue?: boolean;
}

export const TrainingsBulkBar = memo(function TrainingsBulkBar({
  selectedCount,
  totalFilteredCount,
  onSelectAllFiltered,
  onClearSelection,
  onBulkIssueCertificates,
  onBulkStatusUpdate,
  canIssue = true,
}: TrainingsBulkBarProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const handleStatusUpdate = async (status: string) => {
    if (!onBulkStatusUpdate) return;
    setUpdatingStatus(status);
    try {
      await onBulkStatusUpdate(status);
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="card-elevated my-3 p-3 bg-primary/5 border border-primary/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
      >
        {/* Left: Selected count, Select all matching, Clear selection */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge
            variant="default"
            className="px-2.5 py-1 font-bold text-xs bg-primary text-primary-foreground shadow-sm"
          >
            {selectedCount} Selected
          </Badge>

          {totalFilteredCount && selectedCount < totalFilteredCount && onSelectAllFiltered && (
            <Button
              variant="link"
              size="sm"
              onClick={onSelectAllFiltered}
              className="text-xs text-primary p-0 h-auto font-medium hover:underline"
            >
              Select all {totalFilteredCount}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canIssue && (
            <Button
              size="sm"
              onClick={onBulkIssueCertificates}
              className="gap-1.5 text-xs h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Issue Certificates ({selectedCount})</span>
            </Button>
          )}

          {onBulkStatusUpdate && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={!!updatingStatus}
                onClick={() => handleStatusUpdate("completed")}
                className="gap-1.5 text-xs h-8 px-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-medium"
              >
                {updatingStatus === "completed" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5" />
                )}
                <span>Mark Completed</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={!!updatingStatus}
                onClick={() => handleStatusUpdate("cancelled")}
                className="gap-1.5 text-xs h-8 px-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 font-medium"
              >
                {updatingStatus === "cancelled" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Cancel</span>
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
