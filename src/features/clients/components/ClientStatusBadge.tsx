import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Client } from "../types/client.types";

const statusStyles = {
  active: "bg-success/15 text-success border-success/20",
  archived: "bg-muted text-muted-foreground border-muted-foreground/30 border",
} as const;

const statusLabels = {
  active: "Active",
  archived: "Archived",
} as const;

interface ClientStatusBadgeProps {
  status: Client["status"];
  className?: string;
  pulse?: boolean;
}

export function ClientStatusBadge({
  status,
  className,
  pulse = false,
}: ClientStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize flex items-center w-fit",
        statusStyles[status],
        className
      )}
    >
      {pulse && status === "active" && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
        </span>
      )}
      {statusLabels[status]}
    </Badge>
  );
}
