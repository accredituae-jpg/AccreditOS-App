import { motion } from "framer-motion";
import { User, Eye, Edit, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn, formatAED } from "@/lib/utils";
import type { SalaryProfile } from "../types/payroll.types";

interface SalaryProfileCardProps {
  profile: SalaryProfile;
  index: number;
  onEdit: (profile: SalaryProfile) => void;
  onView: (profile: SalaryProfile) => void;
}

export function SalaryProfileCard({ profile, index, onEdit, onView }: SalaryProfileCardProps) {
  const nameFallback = profile.userName || profile.user?.name || "Unknown Employee";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className="grid-card group relative flex h-full min-w-0 cursor-pointer flex-col justify-between gap-3 overflow-hidden p-3.5 transition-all hover:border-primary/30 hover:shadow-md sm:p-4 sm:hover:-translate-y-0.5"
      onClick={() => onView(profile)}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">{nameFallback}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Monthly salary</p>
            </div>
          </div>
          <Badge
            variant={profile.isActive ? "outline" : "secondary"}
            className={cn(
              "shrink-0 px-2 py-0.5 text-[10px] font-semibold capitalize",
              profile.isActive
                ? "bg-success/15 text-success border-success/20 hover:bg-success/15"
                : "bg-muted/15 text-muted-foreground border-muted-foreground/20 hover:bg-muted/15"
            )}
          >
            {profile.isActive ? "active" : "inactive"}
          </Badge>
        </div>

        <div className="rounded-lg border border-primary/10 bg-primary/[0.035] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Gross monthly baseline</p>
          <p className="mt-0.5 break-words text-lg font-bold leading-tight tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-xl">
            {formatAED(profile.grossSalary, true)}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/60 pt-2 text-xs">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground">Basic salary</span>
              <span className="break-words font-semibold leading-tight text-foreground">{formatAED(profile.basicSalary, true)}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground">Housing</span>
              <span className="break-words font-semibold leading-tight text-foreground">{formatAED(profile.housingAllowance || 0, true)}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground">Transport</span>
              <span className="break-words font-semibold leading-tight text-foreground">{formatAED(profile.transportAllowance || 0, true)}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground">Food</span>
              <span className="break-words font-semibold leading-tight text-foreground">{formatAED(profile.foodAllowance || 0, true)}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 border-t border-border/70 pt-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-0 flex-1 rounded-md px-2 text-xs"
          onClick={() => onView(profile)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0 rounded-md p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg">
            <DropdownMenuItem onClick={() => onEdit(profile)} className="cursor-pointer text-xs">
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default SalaryProfileCard;
