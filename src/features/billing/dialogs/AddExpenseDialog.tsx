import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { TrendingUp, User, Building2, Wallet } from "lucide-react";
import { apiGetExpenseCategories, apiGetUsers } from "@/lib/api";
import { formatDateToDDMMYYYY } from "../utils/billing.utils";
import type { ExpensePaymentMethod, ExpensePaidByType } from "../types/billing.types";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (expenseData: any) => Promise<void> | void;
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  onAdd,
}: AddExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseDate, setExpenseDate] = useState<Date>();
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("account");
  const [paidByType, setPaidByType] = useState<ExpensePaidByType>("company");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
  });

  useEffect(() => {
    if (open) {
      apiGetExpenseCategories().then((cats) => {
        const active = cats.filter((c) => c.isActive);
        setCategories(active);
        if (active.length > 0) {
          setSelectedCategoryId(active[0].id);
        }
      });
      apiGetUsers().then((res) => {
        const userList = (res as any)?.data || (Array.isArray(res) ? res : []);
        setUsers(userList);
        if (userList.length > 0) {
          setSelectedEmployeeId(userList[0].id);
          setSelectedEmployeeName(userList[0].name);
        }
      }).catch(() => {});
    }
  }, [open]);

  const resetForm = () => {
    setExpenseForm({ description: "", amount: "" });
    setSelectedCategoryId("");
    setExpenseDate(undefined);
    setPaymentMethod("account");
    setPaidByType("company");
    setSelectedEmployeeId("");
    setSelectedEmployeeName("");
  };

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const found = users.find((u) => u.id === empId);
    if (found) {
      setSelectedEmployeeName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEmp = paidByType === "employee";
      await onAdd({
        categoryId: selectedCategoryId,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount) || 0,
        paymentMethod,
        paidByType,
        paidById: isEmp ? selectedEmployeeId : undefined,
        paidByName: isEmp ? selectedEmployeeName : undefined,
        status: isEmp ? "not_returned" : "paid",
        date: expenseDate
          ? formatDateToDDMMYYYY(expenseDate)
          : formatDateToDDMMYYYY(new Date()),
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={handleClose}
      title="Add Expense"
      description="Record a company operating expense or employee spend"
      icon={TrendingUp}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Add Expense"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold">Category *</Label>
          <Select
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
          >
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border shadow-lg">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Description *</Label>
          <Input
            value={expenseForm.description}
            onChange={(e) =>
              setExpenseForm({
                ...expenseForm,
                description: e.target.value,
              })
            }
            placeholder="e.g. Office stationery, training folders, tea/coffee"
            className="h-9 text-xs"
            required
          />
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Amount (AED) *</Label>
            <Input
              type="text"
              value={expenseForm.amount}
              onChange={(e) => {
                const val = e.target.value;
                const sanitized = val.replace(/[^0-9.]/g, "");
                setExpenseForm({ ...expenseForm, amount: sanitized });
              }}
              placeholder="0.00"
              className="h-9 text-xs font-mono font-bold"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Expense Date</Label>
            <CustomCalendar
              value={expenseDate}
              onChange={setExpenseDate}
              placeholder="Select date"
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Payment Method & Who Paid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              Payment Method *
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(val: ExpensePaymentMethod) => setPaymentMethod(val)}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                <SelectItem value="account" className="text-xs">
                  Account (Bank / Card)
                </SelectItem>
                <SelectItem value="petty_cash" className="text-xs">
                  Petty Cash
                </SelectItem>
                <SelectItem value="cash" className="text-xs">
                  Cash
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Paid By */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              {paidByType === "company" ? (
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              Paid By *
            </Label>
            <Select
              value={paidByType}
              onValueChange={(val: ExpensePaidByType) => {
                setPaidByType(val);
                if (val === "employee" && users.length > 0 && !selectedEmployeeId) {
                  setSelectedEmployeeId(users[0].id);
                  setSelectedEmployeeName(users[0].name);
                }
              }}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                <SelectItem value="company" className="text-xs">
                  Company Direct
                </SelectItem>
                <SelectItem value="employee" className="text-xs">
                  Employee (Out of Pocket)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employee Selection if Paid By Employee */}
        {paidByType === "employee" && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Select Employee *
              </Label>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                Status: Not Returned (Owed)
              </span>
            </div>
            <Select
              value={selectedEmployeeId}
              onValueChange={handleEmployeeChange}
            >
              <SelectTrigger className="w-full h-9 text-xs bg-background">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name} {u.role ? `(${u.role.replace(/_/g, " ")})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This will be marked as <strong className="text-foreground">Not Returned</strong>. When the company repays the employee, you can mark it as <strong className="text-foreground">Returned</strong> with one click.
            </p>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
