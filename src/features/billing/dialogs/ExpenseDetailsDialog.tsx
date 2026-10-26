import { DetailDialog } from "@/components/ui/detail-dialog";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import { Receipt as ReceiptIcon, Edit } from "lucide-react";
import type { Expense } from "../types/billing.types";

interface ExpenseDetailsDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onEditClick?: (expense: Expense) => void;
  canEdit?: boolean;
}

export function ExpenseDetailsDialog({
  expense,
  onClose,
  onEditClick,
  canEdit = false,
}: ExpenseDetailsDialogProps) {
  return (
    <DetailDialog
      open={!!expense}
      onOpenChange={(open) => !open && onClose()}
      title="Expense Details"
      subtitle={expense?.category}
      icon={<ReceiptIcon className="w-6 h-6 text-primary" />}
      fields={
        expense
          ? [
              { label: "Category", value: expense.category },
              { label: "Description", value: expense.description, fullWidth: true },
              { label: "Amount", value: formatAED(expense.amount, true) },
              { label: "Date", value: expense.date },
              {
                label: "Payment Method",
                value:
                  expense.paymentMethod === "petty_cash"
                    ? "Petty Cash"
                    : expense.paymentMethod === "cash"
                    ? "Cash"
                    : "Account (Bank)",
              },
              {
                label: "Paid By",
                value:
                  expense.paidByType === "employee"
                    ? `Employee: ${expense.paidByName || "Staff"}`
                    : "Company Direct",
              },
              {
                label: "Reimbursement Status",
                value:
                  expense.paidByType === "employee"
                    ? expense.status === "returned"
                      ? `Returned (${expense.returnedMethod === "petty_cash" ? "Petty Cash" : expense.returnedMethod === "cash" ? "Cash" : "Bank"})`
                      : "Not Returned (Owed to Employee)"
                    : "Paid Direct",
              },
              ...(expense.returnedAt
                ? [
                    {
                      label: "Returned Date",
                      value: expense.returnedAt,
                    },
                  ]
                : []),
              {
                label: "Created By",
                value: (expense as any).createdByName || (expense as any).createdBy?.name || "—",
              },
              ...((expense as any).updatedByName || (expense as any).updatedBy?.name
                ? [
                    {
                      label: "Last Updated By",
                      value: (expense as any).updatedByName || (expense as any).updatedBy?.name || "—",
                    },
                  ]
                : []),
            ]
          : []
      }
      actions={
        expense && canEdit && onEditClick && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onEditClick(expense)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Expense
            </Button>
          </div>
        )
      }
    />
  );
}
export default ExpenseDetailsDialog;
