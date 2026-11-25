import { useEffect, useState, useMemo } from "react";
import {
  Plane,
  Calculator,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Wallet,
  Receipt,
  Info,
  DollarSign,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { formatAED, cn } from "@/lib/utils";
import type {
  SalaryProfile,
  SalaryAdvance,
  GeneratePayrollCustomOptions,
} from "../types/payroll.types";

interface GeneratePayrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: { id: string; name: string }[];
  salaryProfiles?: SalaryProfile[];
  advances?: SalaryAdvance[];
  onGenerate: (
    month: number,
    year: number,
    userId?: string,
    notes?: string,
    customOptions?: GeneratePayrollCustomOptions,
  ) => Promise<boolean | void>;
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

export function GeneratePayrollDialog({
  isOpen,
  onClose,
  employees,
  salaryProfiles = [],
  advances = [],
  onGenerate,
}: GeneratePayrollDialogProps) {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [employeeId, setEmployeeId] = useState("all");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Custom compensation fields when issuing for a single employee
  const [basicSalary, setBasicSalary] = useState<string>("");
  const [housingAllowance, setHousingAllowance] = useState<string>("");
  const [transportAllowance, setTransportAllowance] = useState<string>("");
  const [foodAllowance, setFoodAllowance] = useState<string>("");
  const [travelAllowance, setTravelAllowance] = useState<string>("");
  const [bonus, setBonus] = useState<string>("");
  const [overtime, setOvertime] = useState<string>("");
  const [otherEarnings, setOtherEarnings] = useState<string>("");

  // Deductions
  const [leaveDeduction, setLeaveDeduction] = useState<string>("");
  const [otherDeductions, setOtherDeductions] = useState<string>("");

  // Leave / Prorated days calculator tool state
  const [showProrateTool, setShowProrateTool] = useState(false);
  const [totalMonthDays, setTotalMonthDays] = useState<number>(30);
  const [daysWorked, setDaysWorked] = useState<number>(20);
  const [showAdvancedAllowances, setShowAdvancedAllowances] = useState(false);

  // Active profile matching selected employee
  const activeProfile = useMemo(() => {
    if (employeeId === "all") return null;
    return salaryProfiles.find((p) => p.userId === employeeId) || null;
  }, [employeeId, salaryProfiles]);

  // Detected advances for this employee in selected month/year
  const detectedAdvances = useMemo(() => {
    if (employeeId === "all" || !month || !year) return [];
    const m = Number(month);
    const y = Number(year);
    return advances.filter(
      (adv) =>
        adv.employeeId === employeeId &&
        adv.deductionMonth === m &&
        adv.deductionYear === y &&
        adv.status === "Paid" &&
        !adv.payrollRecordId,
    );
  }, [employeeId, month, year, advances]);

  const totalDetectedAdvanceAmount = useMemo(() => {
    return detectedAdvances.reduce((sum, adv) => sum + Number(adv.amount || 0), 0);
  }, [detectedAdvances]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const defaultMonth = (previousMonth.getMonth() + 1).toString();
      const defaultYear = previousMonth.getFullYear().toString();
      setMonth(defaultMonth);
      setYear(defaultYear);
      setEmployeeId("all");
      setNotes("");
      setBasicSalary("");
      setHousingAllowance("");
      setTransportAllowance("");
      setFoodAllowance("");
      setTravelAllowance("");
      setBonus("");
      setOvertime("");
      setOtherEarnings("");
      setLeaveDeduction("");
      setOtherDeductions("");
      setShowProrateTool(false);
      setShowAdvancedAllowances(false);
      setTotalMonthDays(30);
      setDaysWorked(20);
    }
  }, [isOpen]);

  // Whenever employeeId changes, populate default values from their salary profile
  useEffect(() => {
    if (employeeId !== "all" && activeProfile) {
      setBasicSalary(Number(activeProfile.basicSalary || 0).toString());
      setHousingAllowance(Number(activeProfile.housingAllowance || 0).toString());
      setTransportAllowance(Number(activeProfile.transportAllowance || 0).toString());
      setFoodAllowance(Number(activeProfile.foodAllowance || 0).toString());
      setTravelAllowance("");
      setBonus("");
      setOvertime("");
      setOtherEarnings("");
      setLeaveDeduction("");
      setOtherDeductions("");
    }
  }, [employeeId, activeProfile]);

  const now = new Date();
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  // Prorated calculations based on profile base salary
  const baseSalaryForProrate = activeProfile
    ? Number(activeProfile.basicSalary) || 0
    : Number(basicSalary) || 0;

  const proratedCalculatedAmount = useMemo(() => {
    if (totalMonthDays <= 0) return 0;
    const perDay = baseSalaryForProrate / totalMonthDays;
    return Math.round(perDay * daysWorked * 100) / 100;
  }, [baseSalaryForProrate, totalMonthDays, daysWorked]);

  const calculatedLeaveDeductionAmount = useMemo(() => {
    if (totalMonthDays <= 0) return 0;
    const unpaidDays = Math.max(0, totalMonthDays - daysWorked);
    const perDay = baseSalaryForProrate / totalMonthDays;
    return Math.round(perDay * unpaidDays * 100) / 100;
  }, [baseSalaryForProrate, totalMonthDays, daysWorked]);

  // Apply prorated calculation to Basic Salary
  const handleApplyProratedBasic = () => {
    setBasicSalary(proratedCalculatedAmount.toString());
    setLeaveDeduction("");
    setShowProrateTool(false);
  };

  // Apply leave days as Leave Deduction
  const handleApplyAsLeaveDeduction = () => {
    if (activeProfile) {
      setBasicSalary(Number(activeProfile.basicSalary).toString());
    }
    setLeaveDeduction(calculatedLeaveDeductionAmount.toString());
    setShowProrateTool(false);
  };

  // Live real-time calculations for preview
  const numBasic = Number(basicSalary) || 0;
  const numHousing = Number(housingAllowance) || 0;
  const numTransport = Number(transportAllowance) || 0;
  const numFood = Number(foodAllowance) || 0;
  const numTravel = Number(travelAllowance) || 0;
  const numBonus = Number(bonus) || 0;
  const numOvertime = Number(overtime) || 0;
  const numOtherEarnings = Number(otherEarnings) || 0;

  const liveGrossSalary =
    numBasic +
    numHousing +
    numTransport +
    numFood +
    numTravel +
    numBonus +
    numOvertime +
    numOtherEarnings;

  const numLeaveDeduction = Number(leaveDeduction) || 0;
  const numOtherDeductions = Number(otherDeductions) || 0;
  const liveTotalDeductions =
    totalDetectedAdvanceAmount + numLeaveDeduction + numOtherDeductions;

  const liveNetSalary = Math.max(0, liveGrossSalary - liveTotalDeductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let customOptions: GeneratePayrollCustomOptions | undefined = undefined;

      if (employeeId !== "all") {
        customOptions = {
          basicSalary: numBasic,
          housingAllowance: numHousing,
          transportAllowance: numTransport,
          foodAllowance: numFood,
          travelAllowance: numTravel,
          bonus: numBonus,
          overtime: numOvertime,
          otherEarnings: numOtherEarnings,
          leaveDeduction: numLeaveDeduction,
          otherDeductions: numOtherDeductions,
        };
      }

      const generated = await onGenerate(
        Number(month),
        Number(year),
        employeeId === "all" ? undefined : employeeId,
        notes.trim() || undefined,
        customOptions,
      );
      if (generated !== false) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Issue Monthly Salary</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Generate and customize salary with leave adjustments, air ticket allowance, and prorated days.
            </DialogDescription>
          </DialogHeader>

          {/* Target Period & Employee Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/70">
            <div className="sm:col-span-1 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Month
              </Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full h-9 bg-background border-border text-xs">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={(index + 1).toString()} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Year
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full h-9 bg-background border-border text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={yr.toString()} className="text-xs">
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1 space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Employee
              </Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="w-full h-9 bg-background border-border text-xs">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">
                    All active employees
                  </SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ALL EMPLOYEES NOTICE */}
          {employeeId === "all" ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Bulk Payroll Generation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates monthly draft payslips for all active employees based on their saved basic salary profiles and automatically applies any pending advances for this month.
              </p>
              <p className="text-[11px] text-muted-foreground/80">
                Tip: To customize prorated days for an employee who took leave, select their name above to adjust their specific salary.
              </p>
            </div>
          ) : (
            /* INDIVIDUAL EMPLOYEE SALARY CUSTOMIZATION */
            <div className="space-y-4 pt-1">
              {/* Profile Notice if no profile */}
              {!activeProfile && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    No salary profile found for this employee. Please enter their basic salary and allowances below.
                  </span>
                </div>
              )}

              {/* 1. BASIC SALARY & LEAVE PRORATE TOOL */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label htmlFor="basic-salary" className="text-xs font-bold text-foreground">
                      Basic Salary (AED)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {activeProfile
                        ? `Standard profile basic: ${formatAED(activeProfile.basicSalary)}`
                        : "Enter monthly basic salary"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProrateTool((prev) => !prev)}
                    className="h-7 text-[11px] gap-1.5 border-primary/30 text-primary hover:bg-primary/10 self-start sm:self-auto cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showProrateTool ? "Hide Leave Proration" : "Calculate Prorated (Leave)"}</span>
                  </Button>
                </div>

                <div className="relative">
                  <Input
                    id="basic-salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="2500.00"
                    className="font-mono font-bold text-base h-10 bg-background"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground">
                    AED
                  </span>
                </div>

                {/* PRORATE LEAVE CALCULATOR POPDOWN */}
                {showProrateTool && (
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 space-y-3 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-primary" />
                        Prorate for Leave / Partial Month
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Base: {formatAED(baseSalaryForProrate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Month Days</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={totalMonthDays}
                          onChange={(e) => setTotalMonthDays(Number(e.target.value) || 30)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Days Worked</Label>
                        <Input
                          type="number"
                          min="0"
                          max={totalMonthDays}
                          value={daysWorked}
                          onChange={(e) => setDaysWorked(Number(e.target.value) || 0)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-md bg-background/80 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Calculated for {daysWorked} days: </span>
                        <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatAED(proratedCalculatedAmount)}
                        </strong>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          (Leave: {totalMonthDays - daysWorked} days / {formatAED(calculatedLeaveDeductionAmount)})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={handleApplyProratedBasic}
                          className="h-7 text-[10px] px-2.5 bg-primary text-white"
                        >
                          Apply to Basic
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleApplyAsLeaveDeduction}
                          className="h-7 text-[10px] px-2.5"
                        >
                          Apply as Deduction
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. TRAVEL / FLIGHT TICKET ALLOWANCE (SPECIFICALLY REQUESTED!) */}
              <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/[0.03] space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="travel-allowance" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-500" />
                    <span>Travel / Flight Ticket Allowance</span>
                  </Label>
                  <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-semibold">
                    Yearly / Annual Leave
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Annual vacation ticket allowance or holiday passage grant. Added to monthly gross pay.
                </p>
                <div className="relative">
                  <Input
                    id="travel-allowance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={travelAllowance}
                    onChange={(e) => setTravelAllowance(e.target.value)}
                    placeholder="0.00 (e.g. 1500.00)"
                    className="font-mono text-xs h-9 bg-background"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground">
                    AED
                  </span>
                </div>
              </div>

              {/* 3. ADDITIONAL ALLOWANCES & DEDUCTIONS TOGGLE */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowAdvancedAllowances((prev) => !prev)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-primary" />
                    <span>Allowances, Overtime & Deductions</span>
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {showAdvancedAllowances ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {showAdvancedAllowances && (
                  <div className="p-3.5 pt-1 border-t border-border/50 space-y-3.5 text-xs">
                    {/* Allowances Row */}
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Fixed Allowances
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Housing</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={housingAllowance}
                            onChange={(e) => setHousingAllowance(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Transport</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={transportAllowance}
                            onChange={(e) => setTransportAllowance(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Food</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={foodAllowance}
                            onChange={(e) => setFoodAllowance(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variable Additions Row */}
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Variable Additions
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Overtime</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={overtime}
                            onChange={(e) => setOvertime(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Bonus</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={bonus}
                            onChange={(e) => setBonus(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Other Earnings</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={otherEarnings}
                            onChange={(e) => setOtherEarnings(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deductions Row */}
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Deductions & Unpaid Leave
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Leave Deduction</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={leaveDeduction}
                            onChange={(e) => setLeaveDeduction(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Other Deductions</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={otherDeductions}
                            onChange={(e) => setOtherDeductions(e.target.value)}
                            placeholder="0.00"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {totalDetectedAdvanceAmount > 0 && (
                        <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
                          <span>Salary Advance Linked:</span>
                          <span className="font-mono font-bold">-{formatAED(totalDetectedAdvanceAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. LIVE SALARY PREVIEW BOX */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-card via-card to-emerald-500/[0.04] border border-emerald-500/30 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/50 pb-2">
                  <span>Gross Earnings: <strong className="font-mono text-foreground font-bold">{formatAED(liveGrossSalary)}</strong></span>
                  <span>Deductions: <strong className="font-mono text-destructive font-bold">-{formatAED(liveTotalDeductions)}</strong></span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Net Payable Salary
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Final amount employee will receive
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatAED(liveNetSalary, true)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES */}
          <div className="space-y-1.5">
            <Label htmlFor="payroll-notes" className="text-xs font-semibold text-foreground">
              Notes / Remarks
            </Label>
            <Textarea
              id="payroll-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Annual leave 10 days, flight ticket allowance included."
              className="h-16 text-xs bg-background resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !month || !year}
              className="bg-primary text-white text-xs h-9 font-semibold gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? "Issuing..." : "Issue Salary"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
