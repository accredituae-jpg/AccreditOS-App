import { useState, memo } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  Loader2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Training } from "../types/trainings.types";
import type { TrainingTab } from "../store/trainings.store";

const TYPE_DOT_COLORS = {
  classroom: "bg-blue-500",
  online: "bg-green-500",
  site: "bg-amber-500",
} as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-500 hover:text-amber-600",
  completed: "text-green-500 hover:text-green-600",
  cancelled: "text-rose-500 hover:text-rose-600",
};

// Valid transitions per status — completed is final, can't go back
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["completed", "cancelled"],
  completed: [], // no changes allowed from completed
  cancelled: ["pending"],
};

interface TrainingsListViewProps {
  paginatedTrainings: Training[];
  loading?: boolean;
  canViewDetails: boolean;
  canEdit: boolean;
  canDelete: boolean;
  activeTab: TrainingTab;
  onViewDetails: (training: Training) => void;
  onEdit: (training: Training) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (training: Training, newStatus: string) => void;
  serviceTypeFilter?: "all" | "training" | "inspection";
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  selectedTrainingIds?: string[];
  onToggleSelect?: (training: Training) => void;
  onSelectAllPage?: () => void;
  allPageSelected?: boolean;
}

export const TrainingsListView = memo(function TrainingsListView({
  paginatedTrainings,
  loading = false,
  canViewDetails,
  canEdit,
  canDelete,
  activeTab,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  serviceTypeFilter = "all",
  hasActiveFilters = false,
  onClearFilters,
  selectedTrainingIds = [],
  onToggleSelect,
  onSelectAllPage,
  allPageSelected = false,
}: TrainingsListViewProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusClick = async (training: Training, newStatus: string) => {
    if (updatingId || !onStatusChange) return;
    setUpdatingId(training.id);
    try {
      await onStatusChange(training, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {onToggleSelect && (
                <th className="w-10 text-center">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={onSelectAllPage}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              <th>Date &amp; Time</th>
              <th>Participant &amp; Client</th>
              <th>{serviceTypeFilter === "inspection" ? "Inspection Category" : "Course"}</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows while fetching
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {onToggleSelect && (
                    <td className="w-10 text-center">
                      <Skeleton className="w-4 h-4 rounded mx-auto" />
                    </td>
                  )}
                  <td>
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td>
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
                  </td>
                </tr>
              ))
            ) : paginatedTrainings.length === 0 ? (
              <tr>
                <td
                  colSpan={onToggleSelect ? 6 : 5}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-medium text-foreground/80">
                      {serviceTypeFilter === "inspection"
                        ? "No inspection sessions found."
                        : serviceTypeFilter === "training"
                        ? "No training sessions found."
                        : "No sessions found."}
                    </p>
                    {hasActiveFilters && onClearFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="mt-1 h-7 text-xs"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTrainings.map((training, index) => {
                const allowedStatuses =
                  STATUS_TRANSITIONS[training.status] ?? [];
                const canChangeStatus =
                  canEdit && onStatusChange && allowedStatuses.length > 0;
                const isUpdating = updatingId === training.id;
                const isSelected = selectedTrainingIds.includes(training.id);

                return (
                  <tr
                    key={training.id}
                    onClick={() => canViewDetails && onViewDetails(training)}
                    className={cn(
                      "transition-colors duration-150 hover:bg-muted/40",
                      canViewDetails && "cursor-pointer",
                      isSelected && "bg-primary/[0.04] dark:bg-primary/[0.08]"
                    )}
                  >
                    {onToggleSelect && (
                      <td
                        className="w-10 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect(training)}
                          aria-label={`Select ${training.participantName}`}
                        />
                      </td>
                    )}
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            TYPE_DOT_COLORS[
                              training.trainingType as keyof typeof TYPE_DOT_COLORS
                            ] || "bg-slate-400",
                          )}
                          title={`Type: ${training.trainingType}`}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {training.regDate}
                          </span>
                          {training.time && (
                            <span className="text-xs text-muted-foreground">
                              {training.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground text-sm">
                            {training.participantName}
                          </span>
                          {training.quantity ? (
                            <span className="text-[10px] bg-muted/80 text-muted-foreground border border-border/80 px-1.5 py-0.5 rounded font-semibold leading-none">
                              Qty: {training.quantity}
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {training.clientName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{training.courseName}</span>
                          {training.serviceType === "inspection" && (
                            <span className="text-[10px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded font-semibold leading-none">
                              Inspection
                            </span>
                          )}
                        </div>
                        {training.awardingBodyName && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium w-fit mt-0.5">
                            {training.awardingBodyName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {canChangeStatus ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={isUpdating}
                              className={cn(
                                "inline-flex items-center gap-1.5 font-semibold capitalize transition-colors hover:opacity-85 cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                                STATUS_STYLES[training.status] ||
                                  "text-slate-500",
                              )}
                            >
                              {isUpdating ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                  Updating...
                                </span>
                              ) : (
                                <>
                                  {training.status}
                                  <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                </>
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="bg-card border border-border shadow-lg min-w-[120px]"
                          >
                            {allowedStatuses.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusClick(training, s)}
                                className="capitalize text-xs cursor-pointer"
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span
                          className={cn(
                            "capitalize text-sm font-semibold",
                            STATUS_STYLES[training.status] || "text-slate-500",
                          )}
                        >
                          {training.status}
                        </span>
                      )}
                    </td>
                    <td
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border border-border shadow-lg"
                        >
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => onEdit(training)}
                              className="cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canEdit &&
                            onStatusChange &&
                            training.status !== "completed" &&
                            training.status !== "cancelled" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusClick(training, "cancelled")
                                }
                                className="cursor-pointer font-medium"
                              >
                                <XCircle className="w-4 h-4 mr-2 text-rose-500" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          {canEdit &&
                            onStatusChange &&
                            training.status === "cancelled" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusClick(training, "pending")
                                }
                                className="cursor-pointer font-medium"
                              >
                                <RotateCcw className="w-4 h-4 mr-2 text-blue-500" />
                                Restore
                              </DropdownMenuItem>
                            )}
                          {(canEdit || canDelete) && <DropdownMenuSeparator />}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(training.id)}
                              className="text-destructive cursor-pointer font-semibold"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {paginatedTrainings.length > 0 && totalPages > 1 && (
        <div className="p-4 border-t border-border bg-card/20">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
});
export default TrainingsListView;
