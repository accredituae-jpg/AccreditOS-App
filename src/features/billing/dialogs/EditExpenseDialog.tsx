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
import { TrendingUp, User, Building2, Wallet, CheckCircle2 } from "lucide-react";
import { apiGetExpenseCategories, apiGetUsers } from "@/lib/api";
import type { Expense, ExpensePaymentMethod, ExpensePaidByType, ExpenseStatus } from "../types/billing.types";
import { parseDateFromDDMMYYYY, formatDateToDDMMYYYY } from "../utils/billing.utils";

interface EditExpenseDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onUpdate: (updatedExpense: any) => Promise<void> | void;
}

export function EditExpenseDialog({
  expense,
  onClose,
  onUpdate,
}: EditExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editExpenseDate, setEditExpenseDate] = useState<Date>();
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("account");
  const [paidByType, setPaidByType] = useState<ExpensePaidByType>("company");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [status, setStatus] = useState<ExpenseStatus>("paid");
  const [returnedMethod, setReturnedMethod] = useState<ExpensePaymentMethod>("petty_cash");

  const [editExpenseForm, setEditExpenseForm] = useState({
    description: "",
    amount: "",
  });

  useEffect(() => {
    if (expense) {
      apiGetExpenseCategories().then((cats) => {
        setCategories(cats);
      });
      apiGetUsers().then((res) => {
        const userList = (res as any)?.data || (Array.isArray(res) ? res : []);
        setUsers(userList);
      }).catch(() => {});
    }
  }, [expense]);

  useEffect(() => {
    if (expense) {
      setEditExpenseForm({
        description: expense.description,
        amount: String(expense.amount),
      });
      setSelectedCategoryId(expense.categoryId || "");
      setEditExpenseDate(parseDateFromDDMMYYYY(expense.date));
      setPaymentMethod(expense.paymentMethod || "account");
      setPaidByType(expense.paidByType || "company");
      setSelectedEmployeeId(expense.paidById || "");
      setSelectedEmployeeName(expense.paidByName || "");
      setStatus(expense.status || (expense.paidByType === "employee" ? "not_returned" : "paid"));
      setReturnedMethod(expense.returnedMethod || "petty_cash");
    }
  }, [expense]);

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const found = users.find((u) => u.id === empId);
    if (found) {
      setSelectedEmployeeName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    setIsSubmitting(true);
    try {
      const isEmp = paidByType === "employee";
      await onUpdate({
        ...expense,
        categoryId: selectedCategoryId,
        description: editExpenseForm.description,
        amount: parseFloat(editExpenseForm.amount) || 0,
        paymentMethod,
        paidByType,
        paidById: isEmp ? selectedEmployeeId : null,
        paidByName: isEmp ? selectedEmployeeName : null,
        status: isEmp ? status : "paid",
        returnedMethod: isEmp && status === "returned" ? returnedMethod : null,
        date:
          editExpenseDate
            ? formatDateToDDMMYYYY(editExpenseDate)
            : expense.date,
      });
      onClose();
    } catch (err) {
      console.error("Error updating expense:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={!!expense}
      onCloseAttempt={onClose}
      title="Edit Expense"
      description="Modify the details of this expense"
      icon={TrendingUp}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
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
              <SelectValue />
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
            value={editExpenseForm.description}
            onChange={(e) =>
              setEditExpenseForm({
                ...editExpenseForm,
                description: e.target.value,
              })
            }
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
              value={editExpenseForm.amount}
              onChange={(e) => {
                const val = e.target.value;
                const sanitized = val.replace(/[^0-9.]/g, "");
                setEditExpenseForm({
                  ...editExpenseForm,
                  amount: sanitized,
                });
              }}
              className="h-9 text-xs font-mono font-bold"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Date</Label>
            <CustomCalendar
              value={editExpenseDate}
              onChange={setEditExpenseDate}
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

        {/* Employee Details if Employee */}
        {paidByType === "employee" && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Staff Member *
              </Label>
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
            </div>

            {/* Status Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Reimbursement Status</Label>
                <Select
                  value={status}
                  onValueChange={(val: ExpenseStatus) => setStatus(val)}
                >
                  <SelectTrigger className="w-full h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    <SelectItem value="not_returned" className="text-xs text-amber-600 font-medium">
                      Not Returned (Owed)
                    </SelectItem>
                    <SelectItem value="returned" className="text-xs text-emerald-600 font-medium">
                      Returned to Employee
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "returned" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Returned From</Label>
                  <Select
                    value={returnedMethod}
                    onValueChange={(val: ExpensePaymentMethod) => setReturnedMethod(val)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border shadow-lg">
                      <SelectItem value="petty_cash" className="text-xs">
                        Petty Cash
                      </SelectItem>
                      <SelectItem value="account" className="text-xs">
                        Account (Bank)
                      </SelectItem>
                      <SelectItem value="cash" className="text-xs">
                        Cash
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
