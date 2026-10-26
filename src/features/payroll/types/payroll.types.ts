export interface PayrollRecord {
  id: string;
  userId: string | null;
  userName: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  month: number;
  year: number;
  payrollNumber: string;
  payslipNumber: string | null;
  
  // Baseline Fixed
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;

  // Variable Monthly Earnings
  overtime: number;
  bonus: number;
  commission: number;
  reimbursement: number;
  otherEarnings: number;

  // Variable Monthly Deductions
  advance: number;
  loanInstallment: number;
  leaveDeduction: number;
  penalty: number;
  otherDeductions: number;

  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  status: "draft" | "approved" | "paid" | "cancelled";
  periodStart?: string | null;
  periodEnd?: string | null;
  paymentReference?: string | null;
  paymentDate?: string | null;
  notes?: string | null;
  approvalNote?: string | null;
  cancellationReason?: string | null;
  generatedById?: string | null;
  generatedAt?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  paidById?: string | null;
  paidAt?: string | null;
  expenseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryProfilePayload {
  userId: string;
  basicSalary: number;
  housingAllowance?: number;
  transportAllowance?: number;
  foodAllowance?: number;
  paymentMethod?: string;
  joiningDate?: string;
  isActive?: boolean;
}

export interface PayrollActions {
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateNotes: (payrollId: string, notes: string) => Promise<void>;
  onApprove: (record: PayrollRecord, approvalNote?: string) => Promise<void>;
  onPay: (record: PayrollRecord, paymentReference?: string, paymentDate?: string) => Promise<void>;
  onCancel: (record: PayrollRecord, cancellationReason?: string) => Promise<void>;
  onDelete: (payrollId: string) => Promise<void>;
  onCreateSalaryProfile: (payload: SalaryProfilePayload) => Promise<void>;
  onUpdateSalaryProfile: (id: string, payload: Partial<SalaryProfilePayload>) => Promise<void>;
}

export interface PayrollPermissions {
  canView: boolean;
  canManage: boolean;
}

export interface SalaryProfile {
  id: string;
  userId: string | null;
  userName: string;
  user: {
    id: string;
    name: string;
  } | null;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  paymentMethod?: string | null;
  joiningDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: string;
  deductionMonth: number;
  deductionYear: number;
  paymentMethod: string;
  status: "Paid" | "Deducted" | "Cancelled";
  notes?: string | null;
  payrollRecordId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryAdvancePayload {
  employeeId: string;
  amount: number;
  paymentDate: string;
  deductionMonth: number;
  deductionYear: number;
  paymentMethod: string;
  notes?: string;
}
