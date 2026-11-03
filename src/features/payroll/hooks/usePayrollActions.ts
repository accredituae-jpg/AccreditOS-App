import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useConfirm } from "@/context/ConfirmContext";
import {
  apiGeneratePayroll,
  apiUpdatePayrollRecord,
  apiApprovePayrollRecord,
  apiPayPayrollRecord,
  apiCancelPayrollRecord,
  apiDeletePayrollRecord,
  apiCreateSalaryProfile,
  apiUpdateSalaryProfile,
} from "@/lib/api";
import type { PayrollRecord, SalaryProfilePayload } from "../types/payroll.types";

interface UsePayrollActionsProps {
  onRefresh: (silent?: boolean) => Promise<void> | void;
}

export function usePayrollActions({ onRefresh }: UsePayrollActionsProps) {
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const confirm = useConfirm();

  const handleGeneratePayroll = useCallback(async (
    month: number,
    year: number,
    userId?: string,
    notes?: string,
  ): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to generate payroll.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await apiGeneratePayroll({ month, year, userId, notes });
      if (response.success) {
        await onRefresh(true);
        toast({
          title: "Payroll Generated",
          description: `Payroll draft records created for ${month}/${year}.`,
        });
        return true;
      }
      toast({
        title: "Generation Failed",
        description: response.message || response.errors?.[0] || "Unable to generate payroll records.",
        variant: "destructive",
      });
      return false;
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err.message || "Unable to generate payroll records.",
        variant: "destructive",
      });
      return false;
    }
  }, [isOnline, onRefresh, toast]);

  const handleUpdateNotes = useCallback(async (id: string, notes: string) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to save notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await apiUpdatePayrollRecord(id, { notes });
      if (result.success) {
        await onRefresh(true);
        toast({
          title: "Notes Saved",
          description: "Payroll notes successfully updated.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to Save Notes",
        description: err.message || "Unable to update payroll notes.",
        variant: "destructive",
      });
    }
  }, [isOnline, onRefresh, toast]);

  const handleApprovePayroll = useCallback(async (record: PayrollRecord, scheduledPaymentDate: string): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to approve payroll.",
        variant: "destructive",
      });
      return false;
    }

    const employeeName = record.userName || record.user?.name || "this employee";
    try {
      const result = await apiApprovePayrollRecord(record.id, scheduledPaymentDate);
      if (result.success) {
        await onRefresh(true);
        toast({
          title: "Payroll Approved",
          description: `${employeeName}'s payroll is approved. Payment is planned for ${scheduledPaymentDate}.`,
        });
        return true;
      }
      toast({
        title: "Approval Failed",
        description: result.message || result.errors?.[0] || "Unable to approve payroll record.",
        variant: "destructive",
      });
      return false;
    } catch (err: any) {
      toast({
        title: "Approval Failed",
        description: err.message || "Unable to approve payroll record.",
        variant: "destructive",
      });
      return false;
    }
  }, [isOnline, onRefresh, toast]);

  const handlePayPayroll = useCallback(async (
    record: PayrollRecord,
    paymentReference: string,
    paymentDate: string,
    notes: string,
  ): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to record payment.",
        variant: "destructive",
      });
      return false;
    }

    const employeeName = record.userName || record.user?.name || "this employee";
    try {
      const result = await apiPayPayrollRecord(record.id, paymentReference, paymentDate, notes);
      if (result.success) {
        await onRefresh(true);
        toast({
          title: "Payroll Paid",
          description: `${employeeName}'s payroll has been marked paid.`,
        });
        return true;
      }
      toast({
        title: "Payment Failed",
        description: result.message || result.errors?.[0] || "Unable to record payroll payment.",
        variant: "destructive",
      });
      return false;
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "Unable to pay payroll record.",
        variant: "destructive",
      });
      return false;
    }
  }, [isOnline, onRefresh, toast]);

  const handleCancelPayroll = useCallback(async (record: PayrollRecord, cancellationReason?: string) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to cancel payroll.",
        variant: "destructive",
      });
      return;
    }

    const employeeName = record.userName || record.user?.name || "this employee";

    await confirm({
      title: "Cancel Payroll Record",
      description: `Are you sure you want to cancel the payroll of ${employeeName} for ${record.month}/${record.year}?`,
      type: "destructive",
      onConfirm: async () => {
        try {
          const result = await apiCancelPayrollRecord(record.id, cancellationReason || "Cancelled by admin");
          if (result.success) {
            await onRefresh(true);
            toast({
              title: "Payroll Cancelled",
              description: `Payroll record for ${employeeName} has been cancelled.`,
            });
          }
        } catch (err: any) {
          toast({
            title: "Cancellation Failed",
            description: err.message || "Unable to cancel payroll record.",
            variant: "destructive",
          });
        }
      },
    });
  }, [isOnline, onRefresh, toast, confirm]);

  const handleDeletePayroll = useCallback(async (id: string) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to delete payroll.",
        variant: "destructive",
      });
      return;
    }

    await confirm({
      title: "Delete Draft Payroll Record",
      description: "Are you sure you want to delete this draft payroll record? This action cannot be undone.",
      type: "destructive",
      onConfirm: async () => {
        try {
          const result = await apiDeletePayrollRecord(id);
          if (result.success) {
            await onRefresh(true);
            toast({
              title: "Payroll Deleted",
              description: "Draft payroll record successfully deleted.",
            });
          }
        } catch (err: any) {
          toast({
            title: "Deletion Failed",
            description: err.message || "Unable to delete payroll record.",
            variant: "destructive",
          });
        }
      },
    });
  }, [isOnline, onRefresh, toast, confirm]);

  const handleCreateSalaryProfile = useCallback(async (payload: SalaryProfilePayload) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to create salary profiles.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await apiCreateSalaryProfile(payload);
      if (result.success) {
        await onRefresh(true);
        toast({
          title: "Salary Profile Created",
          description: "The employee salary profile has been created.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Create Failed",
        description: err.message || "Unable to create salary profile.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, onRefresh, toast]);

  const handleUpdateSalaryProfile = useCallback(async (
    id: string,
    payload: Partial<SalaryProfilePayload>
  ) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to update salary profiles.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await apiUpdateSalaryProfile(id, payload);
      if (result.success) {
        await onRefresh(true);
        toast({
          title: "Salary Profile Updated",
          description: "The salary profile was updated successfully.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Unable to update salary profile.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, onRefresh, toast]);

  return {
    handleGeneratePayroll,
    handleUpdateNotes,
    handleApprovePayroll,
    handlePayPayroll,
    handleCancelPayroll,
    handleDeletePayroll,
    handleCreateSalaryProfile,
    handleUpdateSalaryProfile,
  };
}
export default usePayrollActions;
