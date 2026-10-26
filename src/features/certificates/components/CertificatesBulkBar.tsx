import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  FilePlus2,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CertificatesBulkBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  onSelectAllFiltered: () => void | Promise<void>;
  onClearSelection: () => void;
  onBulkStatusUpdate: (newStatus: string) => Promise<void>;
  onUpdateAllFiltered?: (newStatus: string) => Promise<void>;
  bulkUpdatingAll?: boolean;
  onBulkDownloadWord?: () => Promise<void>;
  onBulkDownloadPdf?: () => Promise<void>;
}

export function CertificatesBulkBar({
  selectedCount,
  totalFilteredCount,
  onSelectAllFiltered,
  onClearSelection,
  onBulkStatusUpdate,
  onUpdateAllFiltered,
  bulkUpdatingAll = false,
  onBulkDownloadWord,
  onBulkDownloadPdf,
}: CertificatesBulkBarProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const handleUpdate = async (status: string) => {
    setUpdatingStatus(status);
    try {
      await onBulkStatusUpdate(status);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    setDownloadingFormat(format);
    try {
      if (format === "docx" && onBulkDownloadWord) {
        await onBulkDownloadWord();
      } else if (format === "pdf" && onBulkDownloadPdf) {
        await onBulkDownloadPdf();
      }
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="card-elevated mt-3 p-3 bg-primary/5 border border-primary/20 flex flex-col gap-2.5 text-xs rounded-xl shadow-sm"
      >
        {/* Top Row: Selected count, Select all matching, Clear selection */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="px-2.5 py-1 font-bold text-xs bg-primary text-primary-foreground shadow-sm"
            >
              {selectedCount} Selected
            </Badge>

            {selectedCount < totalFilteredCount && (
              <Button
                variant="link"
                size="sm"
                onClick={onSelectAllFiltered}
                className="text-xs text-primary p-0 h-auto font-medium hover:underline"
              >
                Select all {totalFilteredCount}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs text-muted-foreground hover:text-foreground h-7"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status Update Options */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
              Update Status:
            </span>

            <Button
              size="sm"
              variant="outline"
              disabled={!!updatingStatus || !!downloadingFormat}
              onClick={() => handleUpdate("sent")}
              className="gap-1.5 text-xs h-8 px-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20 font-medium"
            >
              {updatingStatus === "sent" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>Sent</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={!!updatingStatus || !!downloadingFormat}
              onClick={() => handleUpdate("created")}
              className="gap-1.5 text-xs h-8 px-3 bg-muted text-muted-foreground border-border hover:bg-muted/80 font-medium"
            >
              {updatingStatus === "created" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FilePlus2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>Created</span>
            </Button>
          </div>

          {/* Bulk Download Options */}
          {(onBulkDownloadWord || onBulkDownloadPdf) && (
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              {onBulkDownloadWord && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!downloadingFormat || !!updatingStatus}
                  onClick={() => handleDownload("docx")}
                  className="gap-1.5 text-xs h-8 px-3 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 font-medium"
                  aria-label="Download all selected certificates as Word (.docx) files in a ZIP archive"
                >
                  {downloadingFormat === "docx" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>Word ZIP ({selectedCount})</span>
                </Button>
              )}

              {onBulkDownloadPdf && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!downloadingFormat || !!updatingStatus}
                  onClick={() => handleDownload("pdf")}
                  className="gap-1.5 text-xs h-8 px-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 font-medium"
                  aria-label="Download all selected certificates as PDF files in a ZIP archive"
                >
                  {downloadingFormat === "pdf" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>PDF ZIP ({selectedCount})</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
