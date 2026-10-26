import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  onGenerate: (month: number, year: number) => Promise<void> | void;
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

export function GeneratePayrollDialog({ isOpen, onClose, onGenerate }: GeneratePayrollDialogProps) {
  const now = new Date();
  
  // Default to previous month
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [month, setMonth] = useState<string>((prevMonthDate.getMonth() + 1).toString());
  const [year, setYear] = useState<string>(prevMonthDate.getFullYear().toString());
  const [submitting, setSubmitting] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onGenerate(Number(month), Number(year));
      onClose();
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
              Select the target month and year. This will create draft payroll records for all active employees based on their salary profiles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
