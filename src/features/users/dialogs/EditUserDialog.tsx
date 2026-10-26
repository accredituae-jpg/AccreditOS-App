import { useEffect, useState } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { UserRole, UserProfile, getCurrentUser, type CurrentUser } from "@/lib/permissions";
import { apiUpdateProfile, apiGetProfile } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useUserActions } from "../hooks/useUserActions";
import { UserForm, type UserFormSubmitData } from "../components/UserForm";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser?: UserProfile | null;
  activeRole?: UserRole;
  onSuccess?: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  selectedUser = null,
  activeRole = "super_admin",
  onSuccess,
}: EditUserDialogProps) {
  const { handleUpdate } = useUserActions();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<CurrentUser | UserProfile | null>(
    selectedUser || getCurrentUser(),
  );

  const isSelfProfile = !selectedUser;

  useEffect(() => {
    if (open) {
      if (selectedUser) {
        setCurrentUserData(selectedUser);
      } else {
        const localUser = getCurrentUser();
        setCurrentUserData(localUser);

        apiGetProfile()
          .then((res) => {
            if (res.success && res.data) {
              setCurrentUserData(res.data);
              if (res.data.employeeProfile) {
                localStorage.setItem(
                  "accreditOS_employee_profile",
                  JSON.stringify(res.data.employeeProfile),
                );
              }
            }
          })
          .catch((err) => console.error("Error fetching user profile:", err));
      }
    }
  }, [open, selectedUser?.id]);

  const handleSubmit = async (data: UserFormSubmitData) => {
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        // Admin updating another user
        await handleUpdate(selectedUser.id, data);
      } else {
        // Logged-in user updating own profile
        const res = await apiUpdateProfile(data);
        if (res.success && res.data) {
          setCurrentUserData(res.data);
          toast({
            title: "Profile Updated",
            description: "Your profile has been updated successfully.",
          });
          const updated = res.data;
          if (updated.name) localStorage.setItem("accreditOS_user_name", updated.name);
          if (updated.mobile) localStorage.setItem("accreditOS_user_mobile", updated.mobile);
          if (updated.bankName) localStorage.setItem("accreditOS_user_bank_name", updated.bankName);
          if (updated.accountNo) localStorage.setItem("accreditOS_user_account_no", updated.accountNo);
          if (updated.iban) localStorage.setItem("accreditOS_user_iban", updated.iban);
          if (data.employeeProfile) {
            localStorage.setItem(
              "accreditOS_employee_profile",
              JSON.stringify(data.employeeProfile),
            );
          }
          window.dispatchEvent(new Event("auth_changed"));
        }
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update user profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isSelfProfile ? "My User Profile" : "Edit User Profile"}
      description={
        isSelfProfile
          ? "Update your personal details, local address, contact numbers, and bank account details."
          : "Update account parameters, identity role, and employee details."
      }
      maxWidth="max-w-4xl"
    >
      <UserForm
        mode={isSelfProfile ? "profile" : "edit"}
        initialUser={currentUserData}
        activeRole={activeRole}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}
