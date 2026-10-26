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
      className="grid-card relative flex flex-col justify-between cursor-pointer"
      onClick={() => onView(profile)}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate text-primary">
                {nameFallback}
              </h3>
            </div>
          </div>
          <Badge
            variant={profile.isActive ? "outline" : "secondary"}
            className={cn(
              "capitalize text-[9px] font-bold px-1.5 py-0.5 shrink-0",
              profile.isActive
                ? "bg-success/15 text-success border-success/20 hover:bg-success/15"
                : "bg-muted/15 text-muted-foreground border-muted-foreground/20 hover:bg-muted/15"
            )}
          >
            {profile.isActive ? "active" : "inactive"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm pt-1 border-t border-border/40">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Basic Salary</span>
            <span className="font-medium text-foreground">
              {formatAED(profile.basicSalary, true)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Housing Allowance</span>
            <span className="font-medium text-foreground">
              {formatAED(profile.housingAllowance || 0, true)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transport Allowance</span>
            <span className="font-medium text-foreground">
              {formatAED(profile.transportAllowance || 0, true)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Food Allowance</span>
            <span className="font-medium text-foreground">
              {formatAED(profile.foodAllowance || 0, true)}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-border">
            <span className="text-muted-foreground font-semibold">Gross Baseline</span>
            <span className="text-foreground font-bold font-mono">
              {formatAED(profile.grossSalary, true)}
            </span>
          </div>
        </div>
      </div>

      <div
        className="mt-3 pt-3 border-t border-border flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg"
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
              className="h-9 w-9 p-0 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
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
