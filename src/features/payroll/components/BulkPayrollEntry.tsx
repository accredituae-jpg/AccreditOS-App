import { useState, useEffect } from "react";
import { Save, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatAED } from "@/lib/utils";
import { apiUpdatePayrollRecord } from "@/lib/api";
import type { PayrollRecord } from "../types/payroll.types";

interface BulkPayrollEntryProps {
  records: PayrollRecord[];
  loading: boolean;
  onRefresh: () => void;
  canManage: boolean;
}

function recalculatePayrollTotals(rec: PayrollRecord): PayrollRecord {
  const basic = Number(rec.basicSalary) || 0;
  const housing = Number(rec.housingAllowance) || 0;
  const transport = Number(rec.transportAllowance) || 0;
  const food = Number(rec.foodAllowance) || 0;
  const ot = Number(rec.overtime) || 0;
  const bonus = Number(rec.bonus) || 0;
  const comm = Number(rec.commission) || 0;
  const reimb = Number(rec.reimbursement) || 0;
  const otherEarn = Number(rec.otherEarnings) || 0;

  const gross = basic + housing + transport + food + ot + bonus + comm + reimb + otherEarn;

  const adv = Number(rec.advance) || 0;
  const loan = Number(rec.loanInstallment) || 0;
  const leave = Number(rec.leaveDeduction) || 0;
  const penalty = Number(rec.penalty) || 0;
  const abs = Number(rec.absentDeduction) || 0;
  const insurance = Number(rec.insurance) || 0;
  const otherDed = Number(rec.otherDeduction) || 0;

  const totalDeduction = adv + loan + leave + penalty + abs + insurance + otherDed;
  const net = Math.max(0, gross - totalDeduction);

  return {
    ...rec,
    grossSalary: gross,
    totalDeduction,
    netSalary: net,
  };
}

export function BulkPayrollEntry({
  records,
  loading,
  onRefresh,
  canManage,
}: BulkPayrollEntryProps) {
  const { toast } = useToast();
  const [draftRecords, setDraftRecords] = useState<PayrollRecord[]>([]);
  const [localRecords, setLocalRecords] = useState<PayrollRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Filter only draft records for the spreadsheet view
  useEffect(() => {
    const drafts = records.filter((r) => r.status === "draft");
    setDraftRecords(drafts);
    setLocalRecords(drafts.map((r) => ({ ...r })));
    setIsDirty(false);
  }, [records]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Loading draft payroll records...
      </div>
    );
  }

  if (draftRecords.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card text-muted-foreground">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-warning" />
        <p className="text-sm font-semibold text-foreground mb-1">
          No Draft Payroll Found
        </p>
        <p className="text-xs">
          Spreadsheet mode only displays **Draft** payroll records. Please
          generate payroll first or check if they are already approved/paid.
        </p>
      </div>
    );
  }

  const handleCellChange = (
    recordId: string,
    field: keyof PayrollRecord,
    value: string,
  ) => {
    const valNum = Number(value) || 0;
    if (valNum < 0) return; // Disallow negative values

    setLocalRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;

        const updated = { ...rec, [field]: valNum };
        return recalculatePayrollTotals(updated);
      })
    );
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      // Find all modified records
      const updates = localRecords.filter((localRec) => {
        const original = draftRecords.find((r) => r.id === localRec.id);
        if (!original) return false;
        return (
          localRec.overtime !== original.overtime ||
          localRec.bonus !== original.bonus ||
          localRec.commission !== original.commission ||
          localRec.reimbursement !== original.reimbursement ||
          localRec.otherEarnings !== original.otherEarnings ||
          localRec.advance !== original.advance ||
          localRec.loanInstallment !== original.loanInstallment ||
          localRec.leaveDeduction !== original.leaveDeduction ||
          localRec.penalty !== original.penalty ||
          localRec.otherDeductions !== original.otherDeductions
        );
      });

      if (updates.length === 0) {
        setSaving(false);
        setIsDirty(false);
        return;
      }

      const results = await Promise.all(
        updates.map((rec) =>
          apiUpdatePayrollRecord(rec.id, {
            overtime: rec.overtime,
            bonus: rec.bonus,
            commission: rec.commission,
            reimbursement: rec.reimbursement,
            otherEarnings: rec.otherEarnings,
            advance: rec.advance,
            loanInstallment: rec.loanInstallment,
            leaveDeduction: rec.leaveDeduction,
            penalty: rec.penalty,
            otherDeductions: rec.otherDeductions,
          }),
        ),
      );

      const failed = results.filter((res) => !res.success);
      if (failed.length > 0) {
        toast({
          title: "Save Completed with Errors",
          description: `Failed to save ${failed.length} record(s).`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Changes Saved",
          description: `Successfully updated adjustments for ${updates.length} employee(s).`,
        });
      }

      onRefresh();
    } catch (err: any) {
      toast({
        title: "Failed to Save Changes",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalRecords(JSON.parse(JSON.stringify(draftRecords)));
    setIsDirty(false);
  };

  return (
    <div className="space-y-4">
      {/* Spreadsheet Header Bar */}
      <div className="flex justify-between items-center bg-muted/20 border border-border p-3 rounded-lg">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Editable Adjustments Sheet ({draftRecords.length} Drafts)
        </span>
        <div className="flex items-center gap-2">
          {isDirty && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
              {canManage && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-primary hover:bg-primary/95 text-white"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save All"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto border border-border bg-card shadow-sm rounded-lg max-h-[500px]">
        <table className="min-w-full divide-y divide-border border-collapse text-left text-xs">
          <thead className="bg-muted/40 sticky top-0 z-10">
            <tr className="divide-x divide-border">
              <th className="px-3 py-2.5 font-bold text-foreground bg-muted/65 min-w-[150px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Employee
              </th>
              <th className="px-3 py-2.5 font-bold text-muted-foreground text-center">
                Basic
              </th>
              <th className="px-3 py-2.5 font-bold text-muted-foreground text-center">
                Housing
              </th>
              <th className="px-3 py-2.5 font-bold text-muted-foreground text-center">
                Transport
              </th>
              <th className="px-3 py-2.5 font-bold text-muted-foreground text-center">
                Food
              </th>
              <th className="px-3 py-2.5 font-bold text-primary text-center bg-primary/5">
                Overtime
              </th>
              <th className="px-3 py-2.5 font-bold text-primary text-center bg-primary/5">
                Bonus
              </th>
              <th className="px-3 py-2.5 font-bold text-primary text-center bg-primary/5">
                Commission
              </th>
              <th className="px-3 py-2.5 font-bold text-primary text-center bg-primary/5">
                Reimb.
              </th>
              <th className="px-3 py-2.5 font-bold text-primary text-center bg-primary/5">
                Other Earn
              </th>
              <th className="px-3 py-2.5 font-bold text-destructive text-center bg-destructive/5">
                Advance
              </th>
              <th className="px-3 py-2.5 font-bold text-destructive text-center bg-destructive/5">
                Loan Inst.
              </th>
              <th className="px-3 py-2.5 font-bold text-destructive text-center bg-destructive/5">
                Leave Ded.
              </th>
              <th className="px-3 py-2.5 font-bold text-destructive text-center bg-destructive/5">
                Penalty
              </th>
              <th className="px-3 py-2.5 font-bold text-destructive text-center bg-destructive/5">
                Other Ded.
              </th>
              <th className="px-3 py-2.5 font-bold text-foreground text-center bg-muted/30">
                Net Pay
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border divide-x divide-border">
            {localRecords.map((rec) => {
              const nameFallback = rec.userName || rec.user?.name || "Unknown";
              return (
                <tr
                  key={rec.id}
                  className="hover:bg-muted/5 transition-colors divide-x divide-border"
                >
                  <td className="px-3 py-1.5 font-semibold text-foreground bg-card sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {nameFallback}
                  </td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground font-mono">
                    {formatAED(rec.basicSalary)}
                  </td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground font-mono">
                    {formatAED(rec.housingAllowance)}
                  </td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground font-mono">
                    {formatAED(rec.transportAllowance)}
                  </td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground font-mono">
                    {formatAED(rec.foodAllowance)}
                  </td>

                  {/* Variable Earnings */}
                  <td className="p-0.5 bg-primary/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-primary p-1 text-xs"
                      value={rec.overtime || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "overtime",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-primary/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-primary p-1 text-xs"
                      value={rec.bonus || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "bonus",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-primary/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-primary p-1 text-xs"
                      value={rec.commission || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "commission",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-primary/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-primary p-1 text-xs"
                      value={rec.reimbursement || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "reimbursement",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-primary/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-primary p-1 text-xs"
                      value={rec.otherEarnings || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "otherEarnings",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* Variable Deductions */}
                  <td className="p-0.5 bg-destructive/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-destructive p-1 text-xs text-destructive font-semibold"
                      value={rec.advance || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "advance",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-destructive/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-destructive p-1 text-xs text-destructive"
                      value={rec.loanInstallment || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "loanInstallment",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-destructive/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-destructive p-1 text-xs text-destructive"
                      value={rec.leaveDeduction || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "leaveDeduction",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-destructive/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-destructive p-1 text-xs text-destructive"
                      value={rec.penalty || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "penalty",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0.5 bg-destructive/5 min-w-[75px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full h-8 text-center font-mono bg-transparent border-0 outline-none focus:bg-background focus:ring-1 focus:ring-destructive p-1 text-xs text-destructive"
                      value={rec.otherDeductions || ""}
                      disabled={!canManage}
                      onChange={(e) =>
                        handleCellChange(
                          rec.id,
                          "otherDeductions",
                          e.target.value.replace(/[^0-9.]/g, ""),
                        )
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* Calculated Net Salary */}
                  <td className="px-3 py-1.5 text-center font-bold font-mono bg-muted/15 text-foreground">
                    {formatAED(rec.netSalary)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default BulkPayrollEntry;
