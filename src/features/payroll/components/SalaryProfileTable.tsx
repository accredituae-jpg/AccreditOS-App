import { Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED, cn } from "@/lib/utils";
import type { SalaryProfile } from "../types/payroll.types";

interface SalaryProfileTableProps {
  profiles: SalaryProfile[];
  onEdit: (profile: SalaryProfile) => void;
  onView: (profile: SalaryProfile) => void;
}

export function SalaryProfileTable({ profiles, onEdit, onView }: SalaryProfileTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Basic</th>
            <th className="px-4 py-3">Housing</th>
            <th className="px-4 py-3">Transport</th>
            <th className="px-4 py-3">Food</th>
            <th className="px-4 py-3 text-right">Gross Baseline</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {profiles.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                No salary profiles found.
              </td>
            </tr>
          ) : (
            profiles.map((profile) => {
              const nameFallback = profile.userName || profile.user?.name || "Unknown Employee";
              return (
                <tr
                  key={profile.id}
                  onClick={() => onView(profile)}
                  className="cursor-pointer hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          profile.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        )}
                        title={profile.isActive ? "Active Profile" : "Inactive Profile"}
                      />
                      <span>{nameFallback}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{formatAED(profile.basicSalary, true)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{formatAED(profile.housingAllowance || 0, true)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{formatAED(profile.transportAllowance || 0, true)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{formatAED(profile.foodAllowance || 0, true)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatAED(profile.grossSalary, true)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(profile)}
                        className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3 h-3" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(profile)}
                        className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
export default SalaryProfileTable;
