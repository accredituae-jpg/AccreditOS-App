import { DetailDialog } from "@/components/ui/detail-dialog";
import { User, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import type { SalaryProfile } from "../types/payroll.types";
import { formatPayrollDate } from "../utils/date";

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
    >
      {profile && (
        <div className="space-y-4">
          <section className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/[0.045] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <p className="text-xs text-muted-foreground">Gross monthly baseline</p>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
                {formatAED(profile.grossSalary, true)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Monthly compensation · AED</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Compensation breakdown</h3>
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <div className="divide-y divide-border/70 px-4">
                <ProfileAmount label="Basic salary" amount={profile.basicSalary} />
                <ProfileAmount label="Housing allowance" amount={profile.housingAllowance} />
                <ProfileAmount label="Transport allowance" amount={profile.transportAllowance} />
                <ProfileAmount label="Food allowance" amount={profile.foodAllowance} />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Employment details</h3>
            <div className="overflow-hidden rounded-xl border border-border bg-card/60">
              <div className="divide-y divide-border/70">
                <ProfileDetail label="Payment method" value={profile.paymentMethod || "Not specified"} />
                <ProfileDetail
                  label="Joining date"
                  value={profile.joiningDate ? formatPayrollDate(profile.joiningDate) : "Not specified"}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </DetailDialog>
  );
}

function ProfileAmount({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex min-h-11 min-w-0 items-center justify-between gap-3 transition-colors hover:bg-primary/[0.025]">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatAED(amount || 0, true)}</span>
    </div>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground sm:text-right">{value}</p>
    </div>
  );
}

export default SalaryProfileDetailsDialog;
