import { useState, useEffect } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
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
import { CustomTimeSelect } from "@/components/ui/custom-time-select";
import {
  Plus,
  Trash2,
  Users,
  GraduationCap,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiGetAwardingBodies, apiGetClientOptions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@/lib/clients";
import type { Training } from "../types/trainings.types";
import { cn } from "@/lib/utils";
import { QuickAddClientDialog } from "@/features/clients/dialogs";
import { useTrainingsStore } from "../store/trainings.store";

const formatDateToDDMMYYYY = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dy = String(date.getDate()).padStart(2, "0");
  return `${dy}-${mo}-${yyyy}`;
};

interface TrainingRow {
  id: string;
  name: string;
  phone: string;
  drivingLicenseNo?: string;
  drivingLicenseType?: string;
  courseName: string;
  trainingType: Training["trainingType"];
  awardingBodyId: string;
  regDate: Date;
  issueDate: Date;
  time: string;
  customized: boolean; // true if user customized per-row fields
  expanded: boolean; // true if expanded per-row settings panel
  status: "idle" | "submitting" | "done" | "error";
  error?: string;
}

interface BulkAddTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coursesList: { id: string; name: string }[];
  clients: Client[];
  prefillDate?: string;
  onAdd: (trainingData: Omit<Training, "id">, options?: { silent?: boolean }) => Promise<void> | void;
}

export function BulkAddTrainingDialog({
  open,
  onOpenChange,
  coursesList,
  clients,
  prefillDate,
  onAdd,
}: BulkAddTrainingDialogProps) {
  const { toast } = useToast();
  const [awardingBodies, setAwardingBodies] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [localClients, setLocalClients] = useState<Client[]>(clients);

  useEffect(() => {
    if (clients && clients.length > 0) {
      setLocalClients(clients);
    }
  }, [clients]);

  useEffect(() => {
    if (open && (!localClients || localClients.length === 0)) {
      apiGetClientOptions()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setLocalClients(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load client options:", err);
        });
    }
  }, [open, localClients]);

  // Client is shared for the entire bulk batch
  const [clientName, setClientName] = useState("");

  // Default shared settings
  const [defaults, setDefaults] = useState({
    courseName: "",
    trainingType: "classroom" as Training["trainingType"],
    awardingBodyId: "",
    regDate: new Date(),
    issueDate: new Date(),
    time: "",
  });

  const [rows, setRows] = useState<TrainingRow[]>([]);

  // Create a new row inheriting defaults
  const createNewRow = (
    overrideDefaults?: Partial<typeof defaults>,
  ): TrainingRow => ({
    id: crypto.randomUUID(),
    name: "",
    phone: "",
    drivingLicenseNo: "",
    drivingLicenseType: "",
    courseName: overrideDefaults?.courseName ?? defaults.courseName,
    trainingType: overrideDefaults?.trainingType ?? defaults.trainingType,
    awardingBodyId: overrideDefaults?.awardingBodyId ?? defaults.awardingBodyId,
    regDate: overrideDefaults?.regDate ?? defaults.regDate,
    issueDate: overrideDefaults?.issueDate ?? defaults.issueDate,
    time: overrideDefaults?.time ?? defaults.time,
    customized: false,
    expanded: false,
    status: "idle",
  });

  useEffect(() => {
    if (open) {
      setClientName("");
      const initialDate = prefillDate
        ? (() => {
            const [dd, mm, yyyy] = prefillDate.split("-").map(Number);
            return new Date(yyyy, mm - 1, dd);
          })()
        : new Date();

      const initDefaults = {
        courseName: "",
        trainingType: "classroom" as Training["trainingType"],
        awardingBodyId: "",
        regDate: initialDate,
        issueDate: initialDate,
        time: "",
      };
      setDefaults(initDefaults);
      setSubmitDone(false);

      // Initialize initial rows synchronously
      setRows([
        { ...createNewRow(initDefaults), id: crypto.randomUUID() },
        { ...createNewRow(initDefaults), id: crypto.randomUUID() },
      ]);

      apiGetAwardingBodies()
        .then((res) => {
          if (Array.isArray(res)) {
            const active = res.filter((b) => b.isActive);
            setAwardingBodies(active);
            const tatweer = active.find(
              (b: any) => b.name.toLowerCase() === "tatweer",
            );
            if (tatweer) {
              setDefaults((prev) => ({ ...prev, awardingBodyId: tatweer.id }));
              setRows((prev) =>
                prev.map((row) =>
                  row.customized || row.awardingBodyId
                    ? row
                    : { ...row, awardingBodyId: tatweer.id },
                ),
              );
            }
          }
        })
        .catch(() => {});
    }
  }, [open, prefillDate]);

  // Update default setting & apply to non-customized rows
  const handleDefaultChange = (field: keyof typeof defaults, value: any) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
    setRows((prev) =>
      prev.map((row) => (row.customized ? row : { ...row, [field]: value })),
    );
  };

  const handleDefaultRegDateChange = (newDate: Date) => {
    const shouldSync =
      formatDateToDDMMYYYY(defaults.issueDate) ===
      formatDateToDDMMYYYY(defaults.regDate);
    setDefaults((prev) => ({
      ...prev,
      regDate: newDate,
      issueDate: shouldSync ? newDate : prev.issueDate,
    }));
    setRows((prev) =>
      prev.map((row) => {
        if (row.customized) return row;
        return {
          ...row,
          regDate: newDate,
          issueDate: shouldSync ? newDate : row.issueDate,
        };
      }),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createNewRow()]);
  };

  const addCourseForParticipant = (currentRow: TrainingRow) => {
    const newRow: TrainingRow = {
      id: crypto.randomUUID(),
      name: currentRow.name,
      phone: currentRow.phone,
      drivingLicenseNo: currentRow.drivingLicenseNo,
      drivingLicenseType: currentRow.drivingLicenseType,
      courseName: "",
      trainingType: currentRow.trainingType,
      awardingBodyId: currentRow.awardingBodyId,
      regDate: currentRow.regDate,
      issueDate: currentRow.issueDate,
      time: currentRow.time,
      customized: true,
      expanded: true,
      status: "idle",
    };

    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === currentRow.id);
      if (idx === -1) return [...prev, newRow];
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      return next;
    });
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<TrainingRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const isCustomizingFields =
          "courseName" in updates ||
          "trainingType" in updates ||
          "awardingBodyId" in updates ||
          "regDate" in updates ||
          "issueDate" in updates ||
          "time" in updates;
        return {
          ...r,
          ...updates,
          customized: isCustomizingFields ? true : r.customized,
        };
      }),
    );
  };

  const toggleExpandRow = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r)),
    );
  };

  const filledRows = rows.filter(
    (r) => r.name.trim().length >= 2 && r.courseName,
  );
  const isValid = clientName && filledRows.length > 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitDone) {
      handleClose();
      return;
    }
    if (!isValid) return;
    setIsSubmitting(true);

    const selectedClient = localClients.find(
      (c: any) =>
        c.id === clientName ||
        c.companyName === clientName ||
        c.label === clientName ||
        c.meta?.companyName === clientName,
    );

    let successCount = 0;

    for (const row of filledRows) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: "submitting" } : r)),
      );
      try {
        const selectedCourse = coursesList.find(
          (c: any) =>
            c.name === row.courseName ||
            c.id === row.courseName ||
            c.label === row.courseName,
        );
        const selectedBody = awardingBodies.find(
          (b) => b.id === row.awardingBodyId,
        );
        const regDateStr = formatDateToDDMMYYYY(row.regDate);
        const issueDateStr = formatDateToDDMMYYYY(row.issueDate);

        await onAdd(
          {
            courseId: selectedCourse?.id || "",
            courseName: row.courseName,
            trainingType: row.trainingType,
            clientId:
              selectedClient?.id ||
              (clientName === "Individual Candidate"
                ? "individual"
                : clientName),
            clientName,
            participantName: row.name.trim(),
            participantPhone: row.phone.trim(),
            drivingLicenseNo: row.drivingLicenseNo
              ? row.drivingLicenseNo.trim()
              : undefined,
            drivingLicenseType: row.drivingLicenseType
              ? row.drivingLicenseType.trim()
              : undefined,
            regDate: regDateStr,
            issueDate: issueDateStr,
            time: row.time,
            status: "pending",
            certificateIssued: false,
            awardingBodyId: row.awardingBodyId || null,
            awardingBodyName: selectedBody?.name || "",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
          { silent: true },
        );

        successCount++;
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: "done" } : r)),
        );
      } catch (err: any) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, status: "error", error: err.message || "Failed" }
              : r,
          ),
        );
      }
    }

    if (successCount > 0) {
      const store = useTrainingsStore.getState();
      await Promise.all([
        store.fetchTab(store.activeTab, store.currentPage, store.searchQuery),
        store.fetchTrainings(),
      ]);
    }

    setIsSubmitting(false);
    setSubmitDone(true);
    toast({
      title: `${successCount} Training${successCount !== 1 ? "s" : ""} Added`,
      description: `Successfully registered ${successCount} training participant${successCount !== 1 ? "s" : ""}.`,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) onOpenChange(false);
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={handleClose}
      title="Bulk Add Trainings"
      description="Register multiple training participants for a client. Set shared defaults or customize per participant."
      icon={Users}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={
        submitDone
          ? "Done"
          : isSubmitting
          ? `Registering... (${rows.filter((r) => r.status === "done").length}/${filledRows.length})`
          : `Register ${filledRows.length > 0 ? filledRows.length : ""} Training${filledRows.length !== 1 ? "s" : ""}`
      }
      submitDisabled={!isValid || isSubmitting}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Shared Defaults Section */}
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1. Client &amp; Shared Defaults
            </p>
            <span className="text-[11px] text-muted-foreground">
              Applies to all participants unless customized per row
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Client / Company *
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[11px] px-1 text-primary hover:text-primary/80 gap-1"
                  onClick={() => setShowQuickAddClient(true)}
                >
                  <Plus className="w-3 h-3" />
                  Quick Add
                </Button>
              </div>
              <Select value={clientName} onValueChange={setClientName}>
                <SelectTrigger className="bg-background border-border/80">
                  <SelectValue placeholder="Select client company..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem
                    value="Individual Candidate"
                    className="font-semibold text-amber-600 dark:text-amber-400"
                  >
                    No Client (Individual Candidate)
                  </SelectItem>
                  {localClients
                    .filter((c: any) => {
                      const companyName =
                        c.companyName || c.label || c.meta?.companyName || "";
                      return (
                        companyName &&
                        companyName !== "Individual Candidate" &&
                        c.id !== "Individual Candidate"
                      );
                    })
                    .map((c: any, index: number) => {
                      const companyName =
                        c.companyName || c.label || c.meta?.companyName || "";
                      return (
                        <SelectItem
                          key={c.id || `client-opt-${index}`}
                          value={companyName}
                        >
                          {companyName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Default Course */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Default Course *
              </Label>
              <Select
                value={defaults.courseName}
                onValueChange={(v) => handleDefaultChange("courseName", v)}
              >
                <SelectTrigger className="bg-background border-border/80">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  {coursesList.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default Training Type */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Default Type *</Label>
              <Select
                value={defaults.trainingType}
                onValueChange={(v) => handleDefaultChange("trainingType", v)}
              >
                <SelectTrigger className="bg-background border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="classroom">Classroom</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default Awarding Body */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Default Awarding Body
              </Label>
              <Select
                value={defaults.awardingBodyId || "none"}
                onValueChange={(v) =>
                  handleDefaultChange("awardingBodyId", v === "none" ? "" : v)
                }
              >
                <SelectTrigger className="bg-background border-border/80">
                  <SelectValue placeholder="Select awarding body..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="none">
                    No Awarding Body / Generic
                  </SelectItem>
                  {awardingBodies.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default Time */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Default Schedule Time *
              </Label>
              <CustomTimeSelect
                value={defaults.time}
                onChange={(v) => handleDefaultChange("time", v)}
              />
            </div>

            {/* Default Registration Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Default Registration Date *
              </Label>
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <CustomCalendar
                  value={defaults.regDate}
                  onChange={(d) => d && handleDefaultRegDateChange(d)}
                />
              </div>
            </div>

            {/* Default Issue Date */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Default Issue Date *
                </Label>
                <button
                  type="button"
                  onClick={() => handleDefaultChange("issueDate", defaults.regDate)}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Match Reg Date
                </button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <CustomCalendar
                  value={defaults.issueDate}
                  onChange={(d) => d && handleDefaultChange("issueDate", d)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participant Rows Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                2. Participants ({filledRows.length} ready)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fill participant names. Click &quot;Customize&quot; to change
                course/date/time for a specific row.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addRow}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Row
            </Button>
          </div>

          <div className="space-y-2.5">
            {rows.map((row, idx) => {
              const bodyName =
                awardingBodies.find((b) => b.id === row.awardingBodyId)
                  ?.name || "Generic";
              return (
                <div
                  key={row.id}
                  className={cn(
                    "border rounded-xl p-3 transition-all space-y-2",
                    row.status === "done"
                      ? "border-green-500/30 bg-green-500/5"
                      : row.status === "error"
                        ? "border-red-500/30 bg-red-500/5"
                        : row.status === "submitting"
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card",
                  )}
                >
                  {/* Main Row Header */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        value={row.name}
                        onChange={(e) =>
                          updateRow(row.id, { name: e.target.value })
                        }
                        placeholder="Participant full name *"
                        className="flex-1 h-9 text-sm bg-background border-border/80"
                        disabled={
                          row.status === "done" || row.status === "submitting"
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 pl-7 sm:pl-0">
                      <Input
                        value={row.phone}
                        onChange={(e) =>
                          updateRow(row.id, { phone: e.target.value })
                        }
                        placeholder="Phone (optional)"
                        className="flex-1 sm:w-36 h-9 text-sm bg-background border-border/80"
                        disabled={
                          row.status === "done" || row.status === "submitting"
                        }
                      />

                      {/* Add Another Course for this Participant */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCourseForParticipant(row)}
                        title="Add another course for this participant"
                        className="h-9 px-2 text-xs text-primary border-primary/30 hover:bg-primary/10 shrink-0 gap-1"
                        disabled={
                          row.status === "done" ||
                          row.status === "submitting" ||
                          !row.name.trim()
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px] font-medium">+ Course</span>
                      </Button>

                      {/* Expand / Customize button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpandRow(row.id)}
                        className={cn(
                          "h-9 px-2.5 text-xs shrink-0 gap-1",
                          row.customized &&
                            "border-primary/50 text-primary bg-primary/5",
                        )}
                        disabled={
                          row.status === "done" || row.status === "submitting"
                        }
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {row.expanded ? (
                          <ChevronUp className="w-3 h-3 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        )}
                      </Button>

                      {/* Status Icon or Delete */}
                      {row.status === "done" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      {row.status === "error" && (
                        <span
                          className="text-[10px] text-red-400 shrink-0 max-w-[80px] truncate"
                          title={row.error}
                        >
                          {row.error}
                        </span>
                      )}
                      {row.status === "idle" && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 rounded hover:bg-muted"
                          disabled={rows.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary row when collapsed */}
                  {!row.expanded && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pl-7">
                      <span className="bg-muted px-2 py-0.5 rounded font-medium text-foreground">
                        {row.courseName || "No course chosen"}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{row.trainingType}</span>
                      <span>•</span>
                      <span>{bodyName}</span>
                      <span>•</span>
                      <span>Reg: {formatDateToDDMMYYYY(row.regDate)}</span>
                      <span>•</span>
                      <span>Issue: {formatDateToDDMMYYYY(row.issueDate)}</span>
                      <span>•</span>
                      <span className="font-mono">
                        {row.time || "No time"}
                      </span>
                    </div>
                  )}

                  {/* Expanded Per-Row Customize Panel */}
                  {row.expanded && (
                    <div className="pl-7 pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Per-row Course */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          Course
                        </Label>
                        <Select
                          value={row.courseName}
                          onValueChange={(v) =>
                            updateRow(row.id, { courseName: v })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select course..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border">
                            {coursesList.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Per-row Training Type */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          Training Type
                        </Label>
                        <Select
                          value={row.trainingType}
                          onValueChange={(v) =>
                            updateRow(row.id, { trainingType: v as any })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border">
                            <SelectItem value="classroom">
                              Classroom
                            </SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="site">Site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Per-row Awarding Body */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          Awarding Body
                        </Label>
                        <Select
                          value={row.awardingBodyId || "none"}
                          onValueChange={(v) =>
                            updateRow(row.id, {
                              awardingBodyId: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Select awarding body..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border">
                            <SelectItem value="none">
                              No Awarding Body / Generic
                            </SelectItem>
                            {awardingBodies.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Per-row Schedule Time */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          Schedule Time
                        </Label>
                        <CustomTimeSelect
                          value={row.time}
                          onChange={(v) => updateRow(row.id, { time: v })}
                        />
                      </div>

                      {/* Per-row Driving License No */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          Driving License No. (Optional)
                        </Label>
                        <Input
                          value={row.drivingLicenseNo || ""}
                          onChange={(e) =>
                            updateRow(row.id, { drivingLicenseNo: e.target.value })
                          }
                          placeholder="e.g. 1324136"
                          className="h-8 text-xs font-mono bg-background"
                        />
                      </div>

                      {/* Per-row Driving License Type */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          License Type (e.g. LV, HV)
                        </Label>
                        <Input
                          value={row.drivingLicenseType || ""}
                          onChange={(e) =>
                            updateRow(row.id, { drivingLicenseType: e.target.value })
                          }
                          placeholder="e.g. LV, HV"
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      {/* Per-row Registration Date */}
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          Registration Date
                        </Label>
                        <div className="border border-border rounded-lg overflow-hidden bg-background">
                          <CustomCalendar
                            value={row.regDate}
                            onChange={(d) => {
                              if (!d) return;
                              const shouldSync =
                                formatDateToDDMMYYYY(row.issueDate) ===
                                formatDateToDDMMYYYY(row.regDate);
                              updateRow(row.id, {
                                regDate: d,
                                issueDate: shouldSync ? d : row.issueDate,
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Per-row Issue Date */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Issue Date
                          </Label>
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.id, { issueDate: row.regDate })
                            }
                            className="text-[10px] text-primary hover:underline font-medium"
                          >
                            Match Reg Date
                          </button>
                        </div>
                        <div className="border border-border rounded-lg overflow-hidden bg-background">
                          <CustomCalendar
                            value={row.issueDate}
                            onChange={(d) =>
                              d && updateRow(row.id, { issueDate: d })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <QuickAddClientDialog
        open={showQuickAddClient}
        onOpenChange={setShowQuickAddClient}
        onClientAdded={(newClient) => {
          setLocalClients((prev) => [newClient, ...prev]);
          setClientName(newClient.companyName);
        }}
      />
    </FormDialog>
  );
}
