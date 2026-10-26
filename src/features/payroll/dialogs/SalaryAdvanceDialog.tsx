import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiCreateSalaryAdvance } from "@/lib/api";

interface SalaryAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: { id: string; name: string }[];
  onSaved: () => void;
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

export function SalaryAdvanceDialog({
  open,
  onOpenChange,
  employees,
  onSaved,
}: SalaryAdvanceDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  
  const [form, setForm] = useState({
    employeeId: "",
    amount: "",
    deductionMonth: (new Date().getMonth() + 1).toString(),
    deductionYear: new Date().getFullYear().toString(),
    paymentMethod: "CASH",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setPaymentDate(new Date());
      setForm({
        employeeId: employees[0]?.id || "",
        amount: "",
        deductionMonth: (new Date().getMonth() + 1).toString(),
        deductionYear: new Date().getFullYear().toString(),
        paymentMethod: "CASH",
        notes: "",
      });
    }
  }, [open, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.amount || !paymentDate) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amt = Number(form.amount);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Advance amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiCreateSalaryAdvance({
        employeeId: form.employeeId,
        amount: amt,
        paymentDate: paymentDate.toISOString().split("T")[0],
        deductionMonth: Number(form.deductionMonth),
        deductionYear: Number(form.deductionYear),
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      });

      if (res.success) {
        toast({
          title: "Salary Advance Recorded",
          description: "The salary advance was recorded and scheduled for deduction.",
        });
        onSaved();
        onOpenChange(false);
      } else {
        toast({
          title: "Failed to Record",
          description: res.message || res.errors?.[0] || "An error occurred while saving the advance.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to Record",
        description: err.message || "An error occurred while saving the advance.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Record Salary Advance"
      description="Record a cash or bank advance paid to an employee to deduct from their upcoming payroll."
      icon={DollarSign}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel="Record Advance"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="advance-employee">Employee *</Label>
          <Select
            value={form.employeeId}
            onValueChange={(val) => setForm((prev) => ({ ...prev, employeeId: val }))}
          >
            <SelectTrigger id="advance-employee" className="h-10 w-full bg-background border-border/80">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border shadow-lg max-h-56 overflow-y-auto">
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="advance-amount">Amount (AED) *</Label>
            <Input
              id="advance-amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value.replace(/[^0-9.]/g, "") }))}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <Label>Payment Date *</Label>
            <CustomCalendar
              value={paymentDate}
              onChange={(date) => date && setPaymentDate(date)}
              placeholder="Select payment date"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="advance-month">Deduction Month *</Label>
            <Select
              value={form.deductionMonth}
              onValueChange={(val) => setForm((prev) => ({ ...prev, deductionMonth: val }))}
            >
              <SelectTrigger id="advance-month" className="h-10 w-full bg-background border-border/80">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg max-h-56 overflow-y-auto">
                {MONTH_NAMES.map((m, idx) => (
                  <SelectItem key={m} value={(idx + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="advance-year">Deduction Year *</Label>
            <Select
              value={form.deductionYear}
              onValueChange={(val) => setForm((prev) => ({ ...prev, deductionYear: val }))}
            >
              <SelectTrigger id="advance-year" className="h-10 w-full bg-background border-border/80">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="advance-method">Payment Method *</Label>
          <Select
            value={form.paymentMethod}
            onValueChange={(val) => setForm((prev) => ({ ...prev, paymentMethod: val }))}
          >
            <SelectTrigger id="advance-method" className="h-10 w-full bg-background border-border/80">
              <SelectValue placeholder="Select Method" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border shadow-lg">
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer / EFT</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="advance-notes">Notes / Remarks</Label>
          <Textarea
            id="advance-notes"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g. Requested early for personal emergency"
            rows={2}
          />
        </div>
      </div>
    </FormDialog>
  );
}
export default SalaryAdvanceDialog;
