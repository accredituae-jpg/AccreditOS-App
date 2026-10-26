import { ReactNode, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, SlidersHorizontal, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ViewToggle } from "@/components/ui/view-toggle";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  // Selection mode toggle
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  selectedCount?: number;
  // Filter popover content
  activeFiltersCount?: number;
  filterPopoverContent?: ReactNode;
  filterPopoverOpen?: boolean;
  onFilterPopoverOpenChange?: (open: boolean) => void;
  // Legacy single select support
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  filterWidth?: string;
  view?: "list" | "grid";
  onViewChange?: (view: "list" | "grid") => void;
  extraContent?: ReactNode;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  selectionMode,
  onToggleSelectionMode,
  selectedCount = 0,
  activeFiltersCount = 0,
  filterPopoverContent,
  filterPopoverOpen,
  onFilterPopoverOpenChange,
  view,
  onViewChange,
  extraContent,
}: SearchFilterBarProps) {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const isFirstRender = useRef(true);

  // Sync internal state when external prop changes (e.g. filter reset)
  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce search input to eliminate network spam and typing stutter
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (internalQuery === searchQuery) return;

    const timer = setTimeout(() => {
      onSearchChange(internalQuery);
    }, 280);

    return () => clearTimeout(timer);
  }, [internalQuery, onSearchChange, searchQuery]);

  const handleClear = () => {
    setInternalQuery("");
    onSearchChange("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="card-elevated p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input — left side */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 pr-9 h-9 sm:h-10 bg-white dark:bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
          />
          {internalQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted cursor-pointer"
              onClick={handleClear}
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Right side controls: Select Toggle, Filter & Sort Popover, View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Select Mode Toggle Button */}
          {onToggleSelectionMode && (
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleSelectionMode}
              className={`h-9 sm:h-10 gap-2 font-medium text-xs sm:text-sm transition-all ${
                selectionMode
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-white dark:bg-card border-border hover:bg-accent"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              {selectionMode ? "Cancel" : "Select"}
              {selectionMode && selectedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0.2 text-[11px] font-bold"
                >
                  {selectedCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Filter Popover Button */}
          {filterPopoverContent && (
            <Popover open={filterPopoverOpen} onOpenChange={onFilterPopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 sm:h-10 gap-2 font-medium text-xs sm:text-sm bg-white dark:bg-card border-border hover:bg-accent"
                >
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span>Filter</span>
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0.2 text-[11px] font-bold bg-primary/10 text-primary border-primary/20"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 sm:w-[380px] max-w-[92vw] p-3 sm:p-4 bg-card border border-border shadow-xl rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-semibold text-xs sm:text-sm">
                    Filter &amp; Options
                  </h4>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                </div>
                {filterPopoverContent}
              </PopoverContent>
            </Popover>
          )}

          {extraContent}

          {/* View Toggle */}
          {view && onViewChange && (
            <div className="hidden sm:flex items-center">
              <ViewToggle view={view} onViewChange={onViewChange} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
