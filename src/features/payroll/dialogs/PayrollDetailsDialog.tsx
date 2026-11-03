import { DetailDialog } from "@/components/ui/detail-dialog";
import { FileText, Edit, CheckCircle2, DollarSign, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import type { PayrollRecord } from "../types/payroll.types";
import { formatPayrollDate } from "../utils/date";

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

function renderNotesWithLinks(notes: string) {
  return notes.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//i.test(part) ? (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-primary underline"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

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
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={nameFallback}
      subtitle={`Payroll Details · ${periodStr}${record?.payrollNumber ? ` · ${record.payrollNumber}` : ""}`}
      icon={<FileText className="w-6 h-6 text-primary" />}
      className="max-w-3xl"
      status={
        record
          ? {
              label: record.status,
              variant: getStatusVariant(record.status),
            }
          : undefined
      }
      actions={
        record && (
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                openNotesDialog(record);
                onClose();
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
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
                  className="bg-info text-white hover:bg-info/90"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    actions.onCancel(record);
                    onClose();
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    actions.onDelete(record.id);
                    onClose();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                  className="bg-success text-white hover:bg-success/90"
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Pay
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    actions.onCancel(record);
                    onClose();
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </>
            )}
            <Button size="sm" onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        )
      }
    >
      {record && (
        <div className="space-y-4">
          <section className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.045] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Net salary</p>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
                {formatAED(record.netSalary, true)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:min-w-[280px]">
              <span className="text-xs text-muted-foreground">Gross salary</span>
              <span className="text-right text-xs font-semibold tabular-nums">{formatAED(record.grossSalary, true)}</span>
              <span className="text-xs text-muted-foreground">Total deductions</span>
              <span className="text-right text-xs font-semibold tabular-nums">{formatAED(record.totalDeduction, true)}</span>
            </div>
          </section>

          <section className="space-y-2">
            <SectionHeading title="Salary breakdown" subtitle="All amounts in AED" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <BreakdownTable
                title="Earnings"
                total={record.grossSalary}
                rows={[
                  ["Basic salary", record.basicSalary],
                  ["Housing allowance", record.housingAllowance],
                  ["Transport allowance", record.transportAllowance],
                  ["Food allowance", record.foodAllowance],
                  ["Overtime", record.overtime],
                  ["Bonus", record.bonus],
                  ["Commission", record.commission],
                  ["Reimbursement", record.reimbursement],
                  ["Other earnings", record.otherEarnings],
                ]}
              />
              <BreakdownTable
                title="Deductions"
                total={record.totalDeduction}
                rows={[
                  ["Salary advance", record.advance],
                  ["Loan installment", record.loanInstallment],
                  ["Leave deduction", record.leaveDeduction],
                  ["Penalty", record.penalty],
                  ["Other deductions", record.otherDeductions],
                ]}
              />
            </div>
          </section>

          <section className="space-y-2">
            <SectionHeading title="Payment" subtitle="Planned date and payment record" />
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <PaymentDateSummary
                  label="Planned payment"
                  value={record.scheduledPaymentDate ? formatPayrollDate(record.scheduledPaymentDate) : "Not scheduled"}
                  hint={record.status === "paid" ? "Scheduled" : "Expected"}
                />
                <PaymentDateSummary
                  label="Actual payment"
                  value={record.paymentDate ? formatPayrollDate(record.paymentDate) : "Not paid yet"}
                  hint={record.paidAt ? `Recorded ${formatTimestamp(record.paidAt)}` : "Awaiting payment"}
                  complete={Boolean(record.paymentDate)}
                />
              </div>
              <div className="grid grid-cols-1 border-t border-border sm:grid-cols-2">
                <CompactDetail label="Payroll number" value={record.payrollNumber || "—"} />
                <CompactDetail label="Payslip number" value={record.payslipNumber || "Not issued"} />
                <div className="border-t border-border sm:col-span-2">
                  <CompactDetail label="Payment reference / receipt" value={renderReference(record.paymentReference)} />
                </div>
              </div>
            </div>
          </section>

          {(record.notes || record.approvalNote || record.cancellationReason) && (
            <section className="space-y-2">
              <SectionHeading title="Notes" />
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {record.notes && <CompactDetail label="Notes / remarks" value={renderNotesWithLinks(record.notes)} />}
                {record.approvalNote && <CompactDetail label="Approval note" value={record.approvalNote} />}
                {record.cancellationReason && <CompactDetail label="Cancellation reason" value={record.cancellationReason} />}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <SectionHeading title="Record history" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/10 p-4 sm:grid-cols-4">
              <TimelinePoint label="Created" value={formatTimestamp(record.createdAt)} />
              <TimelinePoint label="Generated" value={formatTimestamp(record.generatedAt)} />
              <TimelinePoint label="Approved" value={formatTimestamp(record.approvedAt)} />
              <TimelinePoint label="Marked paid" value={formatTimestamp(record.paidAt)} />
            </div>
          </section>
        </div>
      )}
    </DetailDialog>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function BreakdownTable({ title, total, rows }: { title: string; total: number; rows: [string, number][] }) {
  const isEarnings = title === "Earnings";
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${
          isEarnings
            ? "border-success/15 bg-success/[0.07]"
            : "border-warning/15 bg-warning/[0.07]"
        }`}
      >
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        <span className={`text-xs font-semibold tabular-nums ${isEarnings ? "text-success" : "text-warning"}`}>
          {formatAED(total, true)}
        </span>
      </div>
      <div className="divide-y divide-border/70 px-3.5">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex min-h-8 items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="shrink-0 text-right tabular-nums text-foreground">
              {formatAED(amount, true)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentDateSummary({ label, value, hint, complete = false }: { label: string; value: string; hint: string; complete?: boolean }) {
  return (
    <div className={`p-4 ${complete ? "bg-success/[0.045]" : "bg-info/[0.035]"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      <p className={`mt-1 text-[11px] font-medium ${complete ? "text-success" : "text-info"}`}>{hint}</p>
    </div>
  );
}

function CompactDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-left text-xs font-medium leading-relaxed text-foreground sm:text-right">
        {value}
      </span>
    </div>
  );
}

function TimelinePoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-2 border-primary/20 pl-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function renderReference(reference: string | null | undefined) {
  if (!reference) return "—";
  if (/^https?:\/\//i.test(reference)) {
    return (
      <a href={reference} target="_blank" rel="noopener noreferrer" className="text-primary underline">
        Open receipt
      </a>
    );
  }
  return reference;
}

function formatTimestamp(value?: string | null) {
  return value ? new Date(value).toLocaleString("en-GB") : "—";
}

export default PayrollDetailsDialog;
