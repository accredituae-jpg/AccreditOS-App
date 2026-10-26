import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  isLoading?: boolean;
  className?: string;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 12,
  isLoading = false,
  className,
}: CustomPaginationProps) {
  const normalizedTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
  const normalizedCurrentPage = Number.isFinite(currentPage) && currentPage > 0
    ? Math.min(currentPage, normalizedTotalPages)
    : 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (normalizedTotalPages <= 7) {
      for (let i = 1; i <= normalizedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (normalizedCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", normalizedTotalPages);
      } else if (normalizedCurrentPage >= normalizedTotalPages - 2) {
        pages.push(1, "...", normalizedTotalPages - 3, normalizedTotalPages - 2, normalizedTotalPages - 1, normalizedTotalPages);
      } else {
        pages.push(1, "...", normalizedCurrentPage - 1, normalizedCurrentPage, normalizedCurrentPage + 1, "...", normalizedTotalPages);
      }
    }
    
    return pages;
  };

  const startItem = totalItems !== undefined && totalItems > 0 ? (normalizedCurrentPage - 1) * itemsPerPage + 1 : undefined;
  const endItem = totalItems !== undefined && totalItems > 0 ? Math.min(normalizedCurrentPage * itemsPerPage, totalItems) : undefined;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-0.5", className)}>
      {/* Items Range Summary */}
      <div className="text-xs text-muted-foreground font-medium">
        {totalItems !== undefined && totalItems > 0 ? (
          <span>
            Showing <strong className="text-foreground">{startItem}</strong>–<strong className="text-foreground">{endItem}</strong> of <strong className="text-foreground">{totalItems}</strong> entries
          </span>
        ) : (
          <span>Page {normalizedCurrentPage} of {normalizedTotalPages}</span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(normalizedCurrentPage - 1)}
          disabled={normalizedCurrentPage === 1 || isLoading}
          className="h-8 gap-1 px-2.5 text-xs font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, index) => (
            typeof page === "number" ? (
              <Button
                key={index}
                variant={normalizedCurrentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={cn(
                  "w-8 h-8 text-xs font-medium p-0 transition-all",
                  normalizedCurrentPage === page && "bg-primary text-primary-foreground font-semibold shadow-sm"
                )}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-1 text-xs text-muted-foreground">
                {page}
              </span>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(normalizedCurrentPage + 1)}
          disabled={normalizedCurrentPage === normalizedTotalPages || isLoading}
          className="h-8 gap-1 px-2.5 text-xs font-medium"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}