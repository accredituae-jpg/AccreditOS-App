import { DetailDialog } from "@/components/ui/detail-dialog";
import { FileText, Edit, CheckCircle2, DollarSign, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import type { PayrollRecord } from "../types/payroll.types";

interface PayrollDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
  permissions: {
    canView: boolean;
    canManage: boolean;
  };
  actions: {
    onApprove: (record: PayrollRecord) => void;
    onPay: (record: PayrollRecord) => void;
    onCancel: (record: PayrollRecord) => void;
    onDelete: (payrollId: string) => void;
  };
  openNotesDialog: (record: PayrollRecord) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function PayrollDetailsDialog({
  open,
  onClose,
  record,
  permissions,
  actions,
  openNotesDialog,
}: PayrollDetailsDialogProps) {
  const nameFallback = record?.userName || record?.user?.name || "Unknown Employee";
  const periodStr = record ? `${MONTH_NAMES[record.month - 1]} ${record.year}` : "";

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "approved":
        return "info";
      case "cancelled":
        return "destructive";
      default:
        return "warning";
    }
  };

  return (
    <DetailDialog
      open={open}
      onOpenChange={(op) => !op && onClose()}
      title={nameFallback}
      subtitle={`Payroll Details — ${periodStr}`}
      icon={<FileText className="w-6 h-6 text-primary" />}
      status={
        record
          ? {
              label: record.status,
              variant: getStatusVariant(record.status),
            }
          : undefined
      }
      fields={
        record
          ? [
              { label: "Payroll Number", value: record.payrollNumber || "—" },
              { label: "Payslip Number", value: record.payslipNumber || "—" },
              { label: "Basic Salary", value: formatAED(record.basicSalary, true) },
              { label: "Housing Allowance", value: formatAED(record.housingAllowance, true) },
              { label: "Transport Allowance", value: formatAED(record.transportAllowance, true) },
              { label: "Food Allowance", value: formatAED(record.foodAllowance, true) },
              { label: "Overtime", value: formatAED(record.overtime, true) },
              { label: "Bonus", value: formatAED(record.bonus, true) },
              { label: "Commission", value: formatAED(record.commission, true) },
              { label: "Reimbursement", value: formatAED(record.reimbursement, true) },
              { label: "Other Earnings", value: formatAED(record.otherEarnings, true) },
              { label: "Salary Advance", value: formatAED(record.advance, true) },
              { label: "Loan Installment", value: formatAED(record.loanInstallment, true) },
              { label: "Leave Deduction", value: formatAED(record.leaveDeduction, true) },
              { label: "Penalty", value: formatAED(record.penalty, true) },
              { label: "Other Deductions", value: formatAED(record.otherDeductions, true) },
              { label: "Gross Salary", value: formatAED(record.grossSalary, true) },
              { label: "Total Deduction", value: formatAED(record.totalDeduction, true) },
              { label: "Net Salary", value: formatAED(record.netSalary, true), fullWidth: true },
              { label: "Payment Reference", value: record.paymentReference || "—" },
              {
                label: "Payment Date",
                value: record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : "—",
              },
              { label: "Notes / Remarks", value: record.notes || "—", fullWidth: true },
              ...(record.approvalNote
                ? [{ label: "Approval Note", value: record.approvalNote, fullWidth: true }]
                : []),
              ...(record.cancellationReason
                ? [{ label: "Cancellation Reason", value: record.cancellationReason, fullWidth: true }]
                : []),
              ...(record.generatedAt
                ? [
                    {
                      label: "Generated At",
                      value: new Date(record.generatedAt).toLocaleString(),
                      fullWidth: true,
                    },
                  ]
                : []),
            ]
          : []
      }
      actions={
        record && (
          <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                openNotesDialog(record);
                onClose();
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              {record.status === "draft" ? "Edit Notes" : "View Notes"}
            </Button>

            {permissions.canManage && record.status === "draft" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    actions.onApprove(record);
                    onClose();
                  }}
                  className="bg-info hover:bg-info/90 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    actions.onCancel(record);
                    onClose();
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    actions.onDelete(record.id);
                    onClose();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </>
            )}

            {permissions.canManage && record.status === "approved" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    actions.onPay(record);
                    onClose();
                  }}
                  className="bg-success hover:bg-success/90 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" /> Pay
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    actions.onCancel(record);
                    onClose();
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </>
            )}
            <Button size="sm" onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        )
      }
    />
  );
}

export default PayrollDetailsDialog;
