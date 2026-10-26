import { DetailDialog } from "@/components/ui/detail-dialog";
import { User, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import type { SalaryProfile } from "../types/payroll.types";

interface SalaryProfileDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  profile: SalaryProfile | null;
  onEdit?: (profile: SalaryProfile) => void;
  canEdit?: boolean;
}

export function SalaryProfileDetailsDialog({
  open,
  onClose,
  profile,
  onEdit,
  canEdit = false,
}: SalaryProfileDetailsDialogProps) {
  const nameFallback = profile?.userName || profile?.user?.name || "Unknown Employee";

  return (
    <DetailDialog
      open={open}
      onOpenChange={(op) => !op && onClose()}
      title={nameFallback}
      subtitle="Salary Profile Details"
      icon={<User className="w-6 h-6 text-primary" />}
      status={
        profile
          ? {
              label: profile.isActive ? "Active" : "Inactive",
              variant: profile.isActive ? "success" : "default",
            }
          : undefined
      }
      fields={
        profile
          ? [
              { label: "Basic Salary", value: formatAED(profile.basicSalary, true) },
              { label: "Housing Allowance", value: formatAED(profile.housingAllowance, true) },
              { label: "Transport Allowance", value: formatAED(profile.transportAllowance, true) },
              { label: "Food Allowance", value: formatAED(profile.foodAllowance, true) },
              { label: "Gross Salary", value: formatAED(profile.grossSalary, true) },
              { label: "Payment Method", value: profile.paymentMethod || "—" },
              { label: "Joining Date", value: profile.joiningDate || "—" },
            ]
          : []
      }
      actions={
        profile && (
          <div className="flex gap-2 w-full sm:w-auto">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(profile);
                  onClose();
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )
      }
    />
  );
}

export default SalaryProfileDetailsDialog;
