import { create } from "zustand";
import type { PayrollRecord, SalaryProfile } from "../types/payroll.types";

interface PayrollState {
  records: PayrollRecord[];
  salaryProfiles: SalaryProfile[];
  employees: { id: string; name: string }[];
  loading: boolean;
  salaryProfilesLoading: boolean;
  activeTab: "records" | "profiles" | "advances" | "bulk";
  
  setRecords: (records: PayrollRecord[]) => void;
  setSalaryProfiles: (profiles: SalaryProfile[]) => void;
  setEmployees: (employees: { id: string; name: string }[]) => void;
  setLoading: (loading: boolean) => void;
  setSalaryProfilesLoading: (loading: boolean) => void;
  setActiveTab: (tab: "records" | "profiles" | "advances" | "bulk") => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  records: [],
  salaryProfiles: [],
  employees: [],
  loading: false,
  salaryProfilesLoading: false,
  activeTab: "records",

  setRecords: (records) => set({ records }),
  setSalaryProfiles: (salaryProfiles) => set({ salaryProfiles }),
  setEmployees: (employees) => set({ employees }),
  setLoading: (loading) => set({ loading }),
  setSalaryProfilesLoading: (salaryProfilesLoading) => set({ salaryProfilesLoading }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
