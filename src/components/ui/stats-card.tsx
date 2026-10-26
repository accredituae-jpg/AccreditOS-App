import React, { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Info } from "lucide-react";
import { cn, DIRHAM_SYMBOL } from "@/lib/utils";
import { DirhamSymbol } from "dirham/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCalculationInfoDialog } from "@/features/dashboard/components/ChartCalculationInfoDialog";

export type StatsColor =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "destructive";

const colorClasses: Record<StatsColor, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

const borderAccentClasses: Record<StatsColor, string> = {
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  info: "border-l-info",
  destructive: "border-l-destructive",
};

export interface StatsCardItem {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  color: StatsColor;
  description?: string;
  change?: number;
  href?: string;
  loading?: boolean;
  onInfoClick?: () => void;
}

interface StatsCardProps extends StatsCardItem {
  index?: number;
  loading?: boolean;
}

function renderStatValue(val: React.ReactNode) {
  if (
    typeof val === "string" &&
    (val.includes(DIRHAM_SYMBOL) || val.includes("AED"))
  ) {
    const isNegative = val.trim().startsWith("-");
    const amountText = val
      .replace(DIRHAM_SYMBOL, "")
      .replace("AED", "")
      .replace("-", "")
      .trim();
    return (
      <span className="inline-flex items-center gap-1.5 font-bold">
        {isNegative && <span>-</span>}
        <DirhamSymbol
          size="0.85em"
          weight="bold"
          className="text-foreground shrink-0"
        />
        <span className="tabular-nums">{amountText}</span>
      </span>
    );
  }
  return val;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  index = 0,
  loading = false,
  onInfoClick,
}: StatsCardProps) {
  const [localDialogOpen, setLocalDialogOpen] = useState(false);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick();
    } else {
      setLocalDialogOpen(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25, ease: "easeOut" }}
        className={cn(
          "bg-card rounded-xl border border-border border-l-3 sm:border-l-4 p-2.5 sm:p-4",
          "transition-all duration-200 cursor-default shadow-sm hover:shadow-md",
          borderAccentClasses[color],
        )}
      >
        {/* Top row: Icon badge & Info dialog trigger button (no hover tooltip) */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-3 gap-1.5">
          <div
            className={cn(
              "w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              colorClasses[color],
            )}
          >
            <Icon
              className={cn(
                "w-3.5 h-3.5 sm:w-4.5 sm:h-4.5",
                loading && "animate-pulse opacity-70",
              )}
            />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {(description || onInfoClick) && (
              <button
                type="button"
                aria-label={`Information guide for ${title}`}
                onClick={handleInfoClick}
                className="p-1 -mr-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="min-h-[1.75rem] sm:min-h-[2rem] flex items-center mb-0.5 sm:mb-1">
          {loading ? (
            <Skeleton className="h-5 sm:h-7 w-20 sm:w-28 rounded-md bg-muted-foreground/15 animate-pulse" />
          ) : (
            <p className="text-lg sm:text-2xl font-bold leading-none text-foreground">
              {renderStatValue(value)}
            </p>
          )}
        </div>

        {/* Title */}
        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-snug truncate">
          {title}
        </p>
      </motion.div>

      {/* Standalone fallback dialog if StatsCard is rendered outside StatsGrid */}
      {!onInfoClick && (description || title) && (
        <ChartCalculationInfoDialog
          open={localDialogOpen}
          onOpenChange={setLocalDialogOpen}
          metricKey={title}
          title={title}
          description={description}
        />
      )}
    </>
  );
}

interface StatsGridProps {
  items: StatsCardItem[];
  columns?: 2 | 3 | 4 | 6;
  loading?: boolean;
  onItemInfoClick?: (item: StatsCardItem) => void;
}

const columnClasses: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

export function StatsGrid({
  items,
  columns = 4,
  loading = false,
  onItemInfoClick,
}: StatsGridProps) {
  const [activeItem, setActiveItem] = useState<StatsCardItem | null>(null);
  const effectiveCols = Math.min(columns, 4) as 2 | 3 | 4;

  const handleItemInfo = (item: StatsCardItem) => {
    if (item.onInfoClick) {
      item.onInfoClick();
    } else if (onItemInfoClick) {
      onItemInfoClick(item);
    } else {
      setActiveItem(item);
    }
  };

  return (
    <>
      <div className={cn("grid gap-2 sm:gap-4", columnClasses[effectiveCols])}>
        {items.map((item, index) => (
          <StatsCard
            key={`${item.title}-${index}`}
            {...item}
            onInfoClick={() => handleItemInfo(item)}
            loading={item.loading ?? loading}
            index={index}
          />
        ))}
      </div>

      {/* Universal Calculation Info Dialog for all status cards across all pages */}
      <ChartCalculationInfoDialog
        open={!!activeItem}
        onOpenChange={(open) => !open && setActiveItem(null)}
        metricKey={activeItem?.title}
        title={activeItem?.title}
        description={activeItem?.description}
      />
    </>
  );
}
