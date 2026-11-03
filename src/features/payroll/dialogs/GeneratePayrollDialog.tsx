import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface GeneratePayrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: { id: string; name: string }[];
  onGenerate: (month: number, year: number, userId?: string, notes?: string) => Promise<boolean | void>;
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

export function GeneratePayrollDialog({ isOpen, onClose, employees, onGenerate }: GeneratePayrollDialogProps) {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [employeeId, setEmployeeId] = useState("all");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setMonth((previousMonth.getMonth() + 1).toString());
      setYear(previousMonth.getFullYear().toString());
      setEmployeeId("all");
      setNotes("");
    }
  }, [isOpen]);

  const now = new Date();
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const generated = await onGenerate(
        Number(month),
        Number(year),
        employeeId === "all" ? undefined : employeeId,
        notes.trim() || undefined,
      );
      if (generated !== false) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Generate Monthly Payroll</DialogTitle>
            <DialogDescription>
              Select an employee or all active employees, then choose the payroll month and year. Drafts are created from each employee's salary profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payroll-employee" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Employee
              </Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="payroll-employee" className="w-full h-10 bg-background border-border">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All active employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Month
              </Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month" className="w-full h-10 bg-background border-border">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={(index + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Year
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year" className="w-full h-10 bg-background border-border">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payroll-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </Label>
              <Textarea
                id="payroll-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional note or receipt link. This note will be added to each generated record."
                className="min-h-[90px] bg-background"
              />
              <p className="text-xs text-muted-foreground">
                The same note is saved on each payroll record generated in this run.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-white">
              {submitting ? "Generating..." : "Generate Drafts"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
