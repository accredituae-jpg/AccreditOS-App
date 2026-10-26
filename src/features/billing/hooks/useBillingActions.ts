import { useCallback } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useConfirm } from "@/context/ConfirmContext";
import {
  apiCreateInvoice,
  apiUpdateInvoice,
  apiDeleteInvoice,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
  apiReturnExpense,
} from "@/lib/api";
import type { Invoice, Expense } from "../types/billing.types";
import { privateClient } from "@/lib/api/axios";

export function useBillingActions() {
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const handleAddInvoice = useCallback(async (invoiceData: any) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to create invoices.",
        variant: "destructive",
      });
      return;
    }
    try {
      const created = await apiCreateInvoice(invoiceData);
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["clients-summary"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Invoice Created",
        description: `Invoice ${created.data?.invoiceNumber || "created"} has been successfully created.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create invoice.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, toast, queryClient]);

  const handleUpdateInvoice = useCallback(async (updatedInvoice: Invoice) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to update invoices.",
        variant: "destructive",
      });
      return;
    }

    // 1. Instant optimistic cache update
    queryClient.setQueriesData({ queryKey: ["billing", "invoices"] }, (oldData: any) => {
      if (!oldData || !Array.isArray(oldData.data)) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((inv: Invoice) =>
          inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv
        ),
      };
    });

    try {
      await apiUpdateInvoice(updatedInvoice.id, updatedInvoice);
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["clients-summary"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Invoice Updated",
        description: `Invoice ${updatedInvoice.invoiceNumber} has been updated.`,
      });
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      toast({
        title: "Error",
        description: err.message || "Failed to update invoice.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, toast, queryClient]);

  const handleToggleInvoiceStatus = useCallback(async (
    id: string,
    targetStatus: Invoice["status"]
  ) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to update status.",
        variant: "destructive",
      });
      return;
    }

    // 1. Instant optimistic cache update (0ms UI latency)
    queryClient.setQueriesData({ queryKey: ["billing", "invoices"] }, (oldData: any) => {
      if (!oldData || !Array.isArray(oldData.data)) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((inv: Invoice) =>
          inv.id === id ? { ...inv, status: targetStatus } : inv
        ),
      };
    });

    try {
      await apiUpdateInvoice(id, { status: targetStatus });
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["clients-summary"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Status Updated",
        description: `Invoice status has been successfully updated to ${targetStatus === "issued" ? "Sent" : targetStatus}.`,
      });
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
      toast({
        title: "Error",
        description: err.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  }, [isOnline, toast, queryClient]);

  const handleCancelInvoice = useCallback(async (id: string, invoiceNumber: string) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to cancel invoices.",
        variant: "destructive",
      });
      return;
    }

    await confirm({
      title: "Cancel Invoice",
      description: `Are you sure you want to cancel Invoice ${invoiceNumber}? Linked certificates will be released back to the unbilled pool and the invoice will be marked as cancelled.`,
      type: "destructive",
      onConfirm: async () => {
        // 1. Instant optimistic cache update
        queryClient.setQueriesData({ queryKey: ["billing", "invoices"] }, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((inv: Invoice) =>
              inv.id === id ? { ...inv, status: "cancelled" } : inv
            ),
          };
        });

        try {
          await apiDeleteInvoice(id, false);
          queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
          queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
          queryClient.invalidateQueries({ queryKey: ["clients-summary"] });
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["certificates"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "Invoice Cancelled",
            description: `Invoice ${invoiceNumber} was successfully cancelled.`,
          });
        } catch (err: any) {
          queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
          toast({
            title: "Error",
            description: err.message || "Failed to cancel invoice.",
            variant: "destructive",
          });
        }
      },
    });
  }, [isOnline, toast, confirm, queryClient]);

  const handleDeleteInvoice = useCallback(async (id: string, invoiceNumber: string, permanent: boolean = true) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to delete invoices.",
        variant: "destructive",
      });
      return;
    }

    await confirm({
      title: "Delete Invoice Permanently",
      description: `Are you sure you want to permanently delete Invoice ${invoiceNumber}? This will remove the invoice record completely from the system and release any linked certificates. This action cannot be undone.`,
      type: "destructive",
      onConfirm: async () => {
        // 1. Instant optimistic cache update
        queryClient.setQueriesData({ queryKey: ["billing", "invoices"] }, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.data)) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((inv: Invoice) => inv.id !== id),
            pagination: oldData.pagination
              ? {
                  ...oldData.pagination,
                  total: Math.max(0, (oldData.pagination.total || 0) - 1),
                }
              : oldData.pagination,
          };
        });

        try {
          await apiDeleteInvoice(id, permanent);
          queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
          queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
          queryClient.invalidateQueries({ queryKey: ["clients-summary"] });
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["certificates"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "Invoice Deleted",
            description: `Invoice ${invoiceNumber} was successfully deleted.`,
          });
        } catch (err: any) {
          queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
          toast({
            title: "Error",
            description: err.message || "Failed to delete invoice.",
            variant: "destructive",
          });
        }
      },
    });
  }, [isOnline, toast, confirm, queryClient]);

  const handleAddExpense = useCallback(async (expenseData: any) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to log expenses.",
        variant: "destructive",
      });
      return;
    }
    try {
      await apiCreateExpense(expenseData);
      queryClient.invalidateQueries({ queryKey: ["billing", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Expense Logged",
        description: "Your expense has been logged successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to log expense.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, toast, queryClient]);

  const handleUpdateExpense = useCallback(async (updatedExpense: Expense) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to update expenses.",
        variant: "destructive",
      });
      return;
    }
    try {
      await apiUpdateExpense(updatedExpense.id, updatedExpense);
      queryClient.invalidateQueries({ queryKey: ["billing", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Expense Updated",
        description: "The expense details have been updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update expense.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, toast, queryClient]);

  const handleDeleteExpense = useCallback(async (id: string, category: string) => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to delete expenses.",
        variant: "destructive",
      });
      return;
    }

    await confirm({
      title: "Delete Expense Entry",
      description: `Are you sure you want to delete this expense entry under "${category}"? This action cannot be undone.`,
      type: "destructive",
      onConfirm: async () => {
        try {
          await apiDeleteExpense(id);
          queryClient.invalidateQueries({ queryKey: ["billing", "expenses"] });
          queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast({
            title: "Expense Deleted",
            description: "The expense entry has been deleted.",
          });
        } catch (err: any) {
          toast({
            title: "Error",
            description: err.message || "Failed to delete expense.",
            variant: "destructive",
          });
        }
      },
    });
  }, [isOnline, toast, confirm, queryClient]);

  const handleConfirmIssueReceipt = useCallback(async (receiptId: string, receiptNumStr: string) => {
    await confirm({
      title: "Confirm & Clear Payment",
      description: `Are you sure you want to mark this receipt as Paid? This will confirm receipt of funds in the bank, recalculate invoice balances, and update the status of all associated invoices.`,
      type: "confirm",
      onConfirm: async () => {
        try {
          const res = await privateClient.post(`/finance/receipts/${receiptId}/confirm-payment`);
          const data = res.data;

          toast({
            title: "Payment Confirmed",
            description: `Successfully cleared and paid Receipt Voucher #${data.receiptNumber || receiptNumStr}`,
          });
          queryClient.invalidateQueries({ queryKey: ["billing"] });
          queryClient.invalidateQueries({ queryKey: ["receipts"] });
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        } catch (err: any) {
          const errMsg =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Failed to clear receipt payment.";
          toast({
            title: "Confirmation Failed",
            description: errMsg,
            variant: "destructive",
          });
        }
      },
    });
  }, [toast, confirm, queryClient]);

  const handleDeleteReceiptDraft = useCallback(async (receiptId: string) => {
    await confirm({
      title: "Delete Draft Receipt",
      description: "Are you sure you want to permanently delete this draft receipt voucher? This action is irreversible.",
      type: "destructive",
      onConfirm: async () => {
        try {
          const res = await privateClient.delete(`/finance/receipts/${receiptId}`);
          const data = res.data;

          toast({
            title: "Draft Deleted",
            description: "The draft receipt voucher was deleted.",
          });
          queryClient.invalidateQueries({ queryKey: ["billing"] });
          queryClient.invalidateQueries({ queryKey: ["clients-summary"] });
          queryClient.invalidateQueries({ queryKey: ["receipts"] });
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        } catch (err: any) {
          const errMsg =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Failed to delete draft.";
          toast({
            title: "Delete Failed",
            description: errMsg,
            variant: "destructive",
          });
        }
      },
    });
  }, [toast, confirm, queryClient]);

  const handleReturnExpense = useCallback(async (id: string, returnedMethod: "account" | "petty_cash" | "cash" = "petty_cash") => {
    if (!isOnline) {
      toast({
        title: "Connection Offline",
        description: "You must be online to update expenses.",
        variant: "destructive",
      });
      return;
    }
    try {
      await apiReturnExpense(id, returnedMethod);
      queryClient.invalidateQueries({ queryKey: ["billing", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "tab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports", "cashbook"] });
      toast({
        title: "Expense Returned",
        description: "Expense has been marked as returned to employee.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to mark expense as returned.",
        variant: "destructive",
      });
      throw err;
    }
  }, [isOnline, toast, queryClient]);

  return {
    handleAddInvoice,
    handleUpdateInvoice,
    handleToggleInvoiceStatus,
    handleCancelInvoice,
    handleDeleteInvoice,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleReturnExpense,
    handleConfirmIssueReceipt,
    handleDeleteReceiptDraft,
  };
}
export default useBillingActions;

