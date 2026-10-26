import { Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, UserRole } from "@/lib/permissions";

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeRole: UserRole;
}

export function UserToolbar({
  searchQuery,
  onSearchChange,
  activeRole,
}: UserToolbarProps) {
  return (
    <div className="card-elevated p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 rounded-lg"
        />
      </div>
      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
        <ShieldAlert className="w-3.5 h-3.5 text-warning" />
        Showing role-relevant staff for: <span className="text-primary font-bold">{ROLE_LABELS[activeRole]}</span>
      </div>
    </div>
  );
}
