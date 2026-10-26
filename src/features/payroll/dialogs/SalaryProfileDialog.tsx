import { useState, useEffect, useMemo } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import type { SalaryProfile, SalaryProfilePayload } from "../types/payroll.types";

interface SalaryProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: SalaryProfile | null;
  employees: { id: string; name: string }[];
  salaryProfiles: SalaryProfile[];
  onSave: (payload: SalaryProfilePayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<SalaryProfilePayload>) => Promise<void>;
}

export function SalaryProfileDialog({
  open,
  onOpenChange,
  profile,
  employees,
  salaryProfiles,
  onSave,
  onUpdate,
}: SalaryProfileDialogProps) {
  const [profileSaving, setProfileSaving] = useState(false);
  const [joiningDate, setJoiningDate] = useState<Date>();
  const [profileForm, setProfileForm] = useState({
    userId: "",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    foodAllowance: "",
    paymentMethod: "",
    isActive: true,
  });

  const availableEmployees = useMemo(() => {
    if (profile) {
      return employees.filter((emp) => emp.id === profile.userId);
    }
    const existingUserIds = new Set(salaryProfiles.map((p) => p.userId));
    return employees.filter((emp) => !existingUserIds.has(emp.id));
  }, [employees, salaryProfiles, profile]);

  useEffect(() => {
    if (open) {
      if (profile) {
        setProfileForm({
          userId: profile.userId || "",
          basicSalary: profile.basicSalary.toString(),
          housingAllowance: (profile.housingAllowance ?? 0).toString(),
          transportAllowance: (profile.transportAllowance ?? 0).toString(),
          foodAllowance: (profile.foodAllowance ?? 0).toString(),
          paymentMethod: profile.paymentMethod || "",
          isActive: profile.isActive,
        });
        setJoiningDate(profile.joiningDate ? new Date(profile.joiningDate) : undefined);
      } else {
        const existingUserIds = new Set(salaryProfiles.map((p) => p.userId));
        const firstAvailable = employees.find((emp) => !existingUserIds.has(emp.id));
        setProfileForm({
          userId: firstAvailable?.id || "",
          basicSalary: "",
          housingAllowance: "",
          transportAllowance: "",
          foodAllowance: "",
          paymentMethod: "",
          isActive: true,
        });
        setJoiningDate(undefined);
      }
    }
  }, [open, profile, employees, salaryProfiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    const payload: SalaryProfilePayload = {
      userId: profileForm.userId,
      basicSalary: Number(profileForm.basicSalary) || 0,
      housingAllowance: Number(profileForm.housingAllowance) || 0,
      transportAllowance: Number(profileForm.transportAllowance) || 0,
      foodAllowance: Number(profileForm.foodAllowance) || 0,
      paymentMethod: profileForm.paymentMethod || undefined,
      joiningDate: joiningDate?.toISOString().split("T")[0] || undefined,
      isActive: profileForm.isActive,
    };

    try {
      if (profile) {
        await onUpdate(profile.id, payload);
      } else {
        await onSave(payload);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save salary profile:", err);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={profile ? "Edit Salary Profile" : "Add Salary Profile"}
      description={
        profile
          ? "Update monthly breakdown allocations for this employee."
          : "Create a salary profile mapping basic wages and allowances."
      }
      icon={Users}
      onSubmit={handleSubmit}
      isSubmitting={profileSaving}
      submitLabel={profile ? "Update Profile" : "Create Profile"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Toggle active switch styled beautifully at the top */}
        <div className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-muted/20 shadow-sm">
          <div className="space-y-0.5">
            <Label htmlFor="profile-active" className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Profile Status
            </Label>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Active salary profiles generate monthly payroll draft records automatically.
            </p>
          </div>
          <Switch
            id="profile-active"
            checked={profileForm.isActive}
            onCheckedChange={(checked) =>
              setProfileForm((prev) => ({ ...prev, isActive: checked }))
            }
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="profile-user">Employee *</Label>
          <Select
            value={profileForm.userId}
            onValueChange={(val) => setProfileForm((prev) => ({ ...prev, userId: val }))}
            disabled={!!profile}
          >
            <SelectTrigger id="profile-user" className="h-10 w-full bg-background border-border/80">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border shadow-lg max-h-56 overflow-y-auto">
              {availableEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="profile-basicSalary">Basic Salary *</Label>
            <Input
              id="profile-basicSalary"
              value={profileForm.basicSalary}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, basicSalary: e.target.value }))
              }
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-housingAllowance">Housing Allowance</Label>
            <Input
              id="profile-housingAllowance"
              value={profileForm.housingAllowance}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, housingAllowance: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="profile-transportAllowance">Transport Allowance</Label>
            <Input
              id="profile-transportAllowance"
              value={profileForm.transportAllowance}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, transportAllowance: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-foodAllowance">Food Allowance</Label>
            <Input
              id="profile-foodAllowance"
              value={profileForm.foodAllowance}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, foodAllowance: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="profile-paymentMethod">Payment Method</Label>
            <Select
              value={profileForm.paymentMethod}
              onValueChange={(val) => setProfileForm((prev) => ({ ...prev, paymentMethod: val }))}
            >
              <SelectTrigger id="profile-paymentMethod" className="h-10 w-full bg-background border-border/80">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer / EFT</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <Label>Joining Date</Label>
            <CustomCalendar
              value={joiningDate}
              onChange={setJoiningDate}
              placeholder="Select joining date"
            />
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
export default SalaryProfileDialog;
