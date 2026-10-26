import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";

export interface ExportColumnItem {
  key: string;
  label?: string;
  defaultSelected?: boolean;
}

export type ExportColumnInput = string | ExportColumnItem;

interface ExportColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle: string;
  columns: ExportColumnInput[];
  rowCount: number;
  onExport: (selectedKeys: string[], format: "excel" | "csv") => void;
  isExporting?: boolean;
}

export function ExportColumnsDialog({
  open,
  onOpenChange,
  reportTitle,
  columns,
  rowCount,
  onExport,
  isExporting = false,
}: ExportColumnsDialogProps) {
  // Normalize columns so every entry has key and label (defaults to exact header name)
  const normalizedColumns = useMemo<ExportColumnItem[]>(() => {
    return columns.map((col) => {
      if (typeof col === "string") {
        return { key: col, label: col };
      }
      return { key: col.key, label: col.label || col.key };
    });
  }, [columns]);

  // Selected column keys in memory only (no localStorage)
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    normalizedColumns.map((c) => c.key)
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Whenever the dialog opens, start fresh with all available headers selected
  const prevOpenRef = React.useRef(open);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSelectedKeys(normalizedColumns.map((c) => c.key));
      setSearchTerm("");
    }
    prevOpenRef.current = open;
  }, [open, normalizedColumns]);

  const filteredColumns = useMemo(() => {
    if (!searchTerm.trim()) return normalizedColumns;
    const term = searchTerm.toLowerCase();
    return normalizedColumns.filter(
      (c) =>
        (c.label || "").toLowerCase().includes(term) ||
        c.key.toLowerCase().includes(term)
    );
  }, [normalizedColumns, searchTerm]);

  const handleToggleColumn = (key: string) => {
    setSelectedKeys((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      // Preserve canonical order defined by normalizedColumns
      return normalizedColumns
        .map((c) => c.key)
        .filter((k) => next.includes(k));
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys(normalizedColumns.map((c) => c.key));
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  const handleExport = (format: "excel" | "csv") => {
    if (selectedKeys.length === 0) return;
    onExport(selectedKeys, format);
    onOpenChange(false);
  };

  const isAllSelected = selectedKeys.length === normalizedColumns.length;
  const isNoneSelected = selectedKeys.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[94vw] p-0 gap-0 overflow-hidden border-border/80 bg-background shadow-2xl rounded-2xl">
        {/* HEADER */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Export {reportTitle}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Select the headers you want to export. Unchecked headers will be excluded from the downloaded Excel file.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs px-2.5 py-0.5 font-medium">
              {rowCount.toLocaleString()} {rowCount === 1 ? "record" : "records"}
            </Badge>
          </div>
        </DialogHeader>

        {/* CONTROLS & SEARCH */}
        <div className="p-4 sm:px-6 border-b border-border/50 bg-card/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search headers..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              className="h-8 px-2.5 text-xs flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select All</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={isNoneSelected}
              className="h-8 px-2.5 text-xs flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Clear All</span>
            </Button>
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2 py-1 ml-1 ${
                selectedKeys.length > 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              }`}
            >
              {selectedKeys.length} / {normalizedColumns.length}
            </Badge>
          </div>
        </div>

        {/* AVAILABLE HEADERS LIST / GRID */}
        <div className="p-4 sm:p-6 max-h-[50vh] overflow-y-auto">
          {filteredColumns.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No headers match &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredColumns.map((col) => {
                const isSelected = selectedKeys.includes(col.key);
                return (
                  <div
                    key={col.key}
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => handleToggleColumn(col.key)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/50 text-foreground shadow-xs font-semibold"
                        : "bg-card/40 border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <Checkbox
                      id={`col-${col.key}`}
                      checked={isSelected}
                      className={
                        isSelected
                          ? "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 pointer-events-none"
                          : "pointer-events-none"
                      }
                      tabIndex={-1}
                    />
                    <span className="flex-1 truncate tracking-wide">
                      {col.label || col.key}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 sm:px-6 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left">
            {isNoneSelected ? (
              <span className="text-destructive font-medium flex items-center justify-center sm:justify-start gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Select at least 1 header to export
              </span>
            ) : (
              <span>
                Exporting <strong>{selectedKeys.length}</strong> of {normalizedColumns.length} headers ({rowCount} {rowCount === 1 ? "row" : "rows"})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-3 text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isNoneSelected || isExporting || rowCount === 0}
              onClick={() => handleExport("csv")}
              className="h-9 px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isNoneSelected || isExporting || rowCount === 0}
              onClick={() => handleExport("excel")}
              className="h-9 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Excel</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
