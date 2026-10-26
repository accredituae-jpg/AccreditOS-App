import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
  className?: string;
  showListOnMobile?: boolean;
}

export function ViewToggle({
  view,
  onViewChange,
  className,
  showListOnMobile = false,
}: ViewToggleProps) {
  return (
    <div className={cn("view-toggle", className)}>
      {/* List option - hidden on mobile by default */}
      <button
        onClick={() => onViewChange("list")}
        className={cn(
          "view-toggle-btn",
          view === "list" && "active",
          !showListOnMobile && "hidden md:flex items-center gap-1.5",
        )}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
        {/* <span className="hidden sm:inline">List</span> */}
      </button>
      <button
        onClick={() => onViewChange("grid")}
        className={cn(
          "view-toggle-btn flex items-center gap-1.5",
          view === "grid" && "active",
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
        {/* <span className="hidden sm:inline">Grid</span> */}
      </button>
    </div>
  );
}
