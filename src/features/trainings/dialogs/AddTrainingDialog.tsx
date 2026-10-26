import { useState, useEffect, useRef } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { apiGetAwardingBodies, apiGetClientOptions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Client } from "@/lib/clients";
import type { Training } from "../types/trainings.types";
import { QuickAddClientDialog } from "@/features/clients/dialogs";

const formatDateToDDMMYYYY = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dy = String(date.getDate()).padStart(2, "0");
  return `${dy}-${mo}-${yyyy}`;
};

const trainingFormSchema = z.object({
  participantName: z
    .string()
    .min(2, "Participant name must be at least 2 characters"),
  participantPhone: z.string().optional().default(""),
  drivingLicenseNo: z.string().optional().default(""),
  drivingLicenseType: z.string().optional().default(""),
  customCompany: z.string().optional().default(""),
  clientName: z.string().min(1, "Client selection is required"),
  courseName: z
    .string()
    .min(1, "Course / Inspection category selection is required"),
  trainingType: z.enum(["classroom", "online", "site"]),
  time: z.string().optional().default(""),
  status: z.enum(["pending", "completed", "cancelled"]),
  awardingBodyId: z.string().optional(),
});

interface AddTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coursesList: { id: string; name: string }[];
  clients: Client[];
  onAdd: (trainingData: Omit<Training, "id">) => Promise<void> | void;
  /** Pre-fill the registration date (DD-MM-YYYY) when opened from calendar */
  prefillDate?: string;
}

export function AddTrainingDialog({
  open,
  onOpenChange,
  coursesList,
  clients,
  onAdd,
  prefillDate,
}: AddTrainingDialogProps) {
  const { toast } = useToast();
  const [regDate, setRegDate] = useState<Date>(new Date());
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");
  const [awardingBodies, setAwardingBodies] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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

  const [formData, setFormData] = useState({
    serviceType: "training" as NonNullable<Training["serviceType"]>,
    quantity: "1",
    courseName: "",
    trainingType: "classroom" as Training["trainingType"],
    clientName: "",
    participantName: "",
    participantPhone: "",
    drivingLicenseNo: "",
    drivingLicenseType: "",
    customCompany: "",
    status: "pending" as Training["status"],
    awardingBodyId: "",
  });

  const initialValuesRef = useRef("");

  useEffect(() => {
    if (open) {
      const defaultForm = {
        serviceType: "training" as NonNullable<Training["serviceType"]>,
        quantity: "1",
        courseName: "",
        trainingType: "classroom" as Training["trainingType"],
        clientName: "",
        participantName: "",
        participantPhone: "",
        drivingLicenseNo: "",
        drivingLicenseType: "",
        customCompany: "",
        status: "pending" as Training["status"],
        awardingBodyId: "",
      };
      setFormData(defaultForm);
      // If prefillDate (DD-MM-YYYY) is provided, parse and use it
      if (prefillDate) {
        const [dd, mm, yyyy] = prefillDate.split("-").map(Number);
        const d = new Date(yyyy, mm - 1, dd);
        setRegDate(d);
        setIssueDate(d);
      } else {
        setRegDate(new Date());
        setIssueDate(new Date());
      }
      setTime("");

      apiGetAwardingBodies()
        .then((res) => {
          if (Array.isArray(res)) {
            const activeList = res.filter((b) => b.isActive);
            setAwardingBodies(activeList);
            const tatweer = activeList.find(
              (b) => b.name.toLowerCase() === "tatweer",
            );
            if (tatweer) {
              setFormData((prev) => ({ ...prev, awardingBodyId: tatweer.id }));
              initialValuesRef.current = JSON.stringify({
                ...defaultForm,
                awardingBodyId: tatweer.id,
                regDate: formatDateToDDMMYYYY(new Date()),
                issueDate: formatDateToDDMMYYYY(new Date()),
                time: "",
              });
            } else {
              initialValuesRef.current = JSON.stringify({
                ...defaultForm,
                regDate: formatDateToDDMMYYYY(new Date()),
                issueDate: formatDateToDDMMYYYY(new Date()),
                time: "",
              });
            }
          }
        })
        .catch((err) => console.error(err));
    }
  }, [open]);

  const isDirty = () => {
    const current = JSON.stringify({
      ...formData,
      regDate: regDate ? formatDateToDDMMYYYY(regDate) : "",
      issueDate: issueDate ? formatDateToDDMMYYYY(issueDate) : "",
      time,
    });
    return current !== initialValuesRef.current;
  };

  const handleCloseAttempt = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleServiceTypeSwitch = (type: "training" | "inspection") => {
    if (type === formData.serviceType) return;
    setFormData((prev) => ({
      ...prev,
      serviceType: type,
      courseName: "",
      participantName: "",
      participantPhone: "",
      quantity: "1",
      trainingType: type === "inspection" ? "site" : "classroom",
    }));
    setTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTime =
      formData.serviceType === "inspection" && !time ? "N/A" : time;

    const payload = {
      ...formData,
      time: finalTime,
    };

    const validation = trainingFormSchema.safeParse(payload);
    if (!validation.success) {
      const firstError =
        validation.error.errors[0]?.message || "Validation failed";
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        serviceType: formData.serviceType,
        quantity: formData.quantity,
        courseName: formData.courseName,
        trainingType: formData.trainingType,
        clientName: formData.clientName,
        participantName: formData.participantName,
        participantPhone: formData.participantPhone,
        drivingLicenseNo: formData.drivingLicenseNo || undefined,
        drivingLicenseType: formData.drivingLicenseType || undefined,
        customCompany: formData.customCompany?.trim() || undefined,
        regDate: regDate
          ? formatDateToDDMMYYYY(regDate)
          : formatDateToDDMMYYYY(new Date()),
        issueDate: issueDate
          ? formatDateToDDMMYYYY(issueDate)
          : formatDateToDDMMYYYY(new Date()),
        time: finalTime,
        status: formData.status,
        awardingBodyId: formData.awardingBodyId || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      // keep open
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormDialog
        open={open}
        onCloseAttempt={handleCloseAttempt}
        title={
          formData.serviceType === "inspection"
            ? "Add Inspection"
            : "Add Training"
        }
        description={
          formData.serviceType === "inspection"
            ? "Create a new inspection session record"
            : "Create a new training session record"
        }
        icon={
          formData.serviceType === "inspection" ? ClipboardCheck : GraduationCap
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={
          formData.serviceType === "inspection"
            ? "Create Inspection"
            : "Create Training"
        }
        loadingText="Creating..."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Service Type Switcher */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Service Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => handleServiceTypeSwitch("training")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  formData.serviceType === "training"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Training
              </button>
              <button
                type="button"
                onClick={() => handleServiceTypeSwitch("inspection")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  formData.serviceType === "inspection"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Inspection
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Participant Name / Item Name */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                {formData.serviceType === "inspection"
                  ? "Inspection Subject / Item Name"
                  : "Participant Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.participantName}
                onChange={(e) =>
                  setFormData({ ...formData, participantName: e.target.value })
                }
                placeholder={
                  formData.serviceType === "inspection"
                    ? "e.g. Harness, Thread Inspection, Shackle"
                    : "Enter participant name"
                }
                required
              />
            </div>

            {/* Participant Phone */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Participant Phone{" "}
                <span className="text-muted-foreground font-normal text-[11px]">
                  (Optional)
                </span>
              </Label>
              <Input
                value={formData.participantPhone}
                onChange={(e) =>
                  setFormData({ ...formData, participantPhone: e.target.value })
                }
                placeholder="e.g. +971 50 000 0000"
              />
            </div>

            {/* Driving License Section (Training only) */}
            {formData.serviceType === "training" && (
              <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">
                    Driving License No.{" "}
                    <span className="text-muted-foreground font-normal text-[11px]">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    value={formData.drivingLicenseNo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drivingLicenseNo: e.target.value,
                      })
                    }
                    placeholder="e.g. 1324136"
                    className="h-8 font-mono text-xs bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">
                    License Type / Category{" "}
                    <span className="text-muted-foreground font-normal text-[11px]">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    value={formData.drivingLicenseType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drivingLicenseType: e.target.value,
                      })
                    }
                    placeholder="e.g. LV, HV, Light Bus"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            )}

            {/* Client Selection */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Client <span className="text-destructive">*</span>
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
              <Select
                value={formData.clientName}
                onValueChange={(v) =>
                  setFormData({ ...formData, clientName: v })
                }
              >
                <SelectTrigger className="w-full bg-background border-border/80">
                  <SelectValue placeholder="Select a client" />
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

            {/* Course Name / Inspection Category */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                {formData.serviceType === "inspection"
                  ? "Inspection Category"
                  : "Course Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {formData.serviceType === "inspection" ? (
                <Input
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({ ...formData, courseName: e.target.value })
                  }
                  placeholder="Enter inspection category (e.g. Harness Inspection)"
                  required
                />
              ) : (
                <Select
                  value={formData.courseName}
                  onValueChange={(v) =>
                    setFormData({ ...formData, courseName: v })
                  }
                >
                  <SelectTrigger className="w-full bg-background border-border/80">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    {coursesList.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Optional Company on Certificate for Individual Candidates */}
            {formData.clientName === "Individual Candidate" && (
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <Label
                  htmlFor="addCustomCompany"
                  className="text-xs font-semibold text-amber-900 dark:text-amber-200"
                >
                  Company Name on Certificate{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="addCustomCompany"
                  value={formData.customCompany}
                  onChange={(e) =>
                    setFormData({ ...formData, customCompany: e.target.value })
                  }
                  placeholder="e.g. Al Futtaim, Emirates Steel"
                  className="bg-background text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Prints this company name on the certificate without adding
                  them to your Client database.
                </p>
              </div>
            )}

            {/* Training Type / Inspection Mode */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                {formData.serviceType === "inspection"
                  ? "Inspection Mode"
                  : "Training Type"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.trainingType}
                onValueChange={(v) =>
                  setFormData({ ...formData, trainingType: v as any })
                }
              >
                <SelectTrigger className="w-full bg-background border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  {formData.serviceType === "inspection" ? (
                    <>
                      <SelectItem value="site">On-Site</SelectItem>
                      <SelectItem value="classroom">Workshop</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="classroom">Classroom</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="site">On-Site</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status Selection */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData({ ...formData, status: v as any })
                }
              >
                <SelectTrigger className="w-full bg-background border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inspection Quantity / Units */}
            {formData.serviceType === "inspection" && (
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">
                  Quantity / Units
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="e.g. 20"
                />
              </div>
            )}

            {/* Registration Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Registration Date <span className="text-destructive">*</span>
              </Label>
              <CustomCalendar
                value={regDate}
                onChange={setRegDate}
                placeholder="Select date"
              />
            </div>

            {/* Issue Date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Issue Date <span className="text-destructive">*</span>
              </Label>
              <CustomCalendar
                value={issueDate}
                onChange={setIssueDate}
                placeholder="Select date"
              />
            </div>

            {/* Start Time (Training only) */}
            {formData.serviceType === "training" && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">
                  Start Time <span className="text-destructive">*</span>
                </Label>
                <CustomTimeSelect
                  value={time}
                  onChange={setTime}
                  placeholder="Select time"
                />
              </div>
            )}

            {/* Awarding Body */}
            <div
              className={`flex flex-col gap-1.5 ${formData.serviceType === "training" ? "col-span-1" : "col-span-1 sm:col-span-2"}`}
            >
              <Label className="text-xs font-semibold">Awarding Body</Label>
              <Select
                value={formData.awardingBodyId || "none"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    awardingBodyId: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger className="w-full bg-background border-border/80">
                  <SelectValue placeholder="Select Awarding Body..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="none">
                    No Awarding Body / Generic
                  </SelectItem>
                  {awardingBodies.map((body) => (
                    <SelectItem key={body.id} value={body.id}>
                      {body.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </FormDialog>

      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="max-w-md p-6 bg-card border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold">Unsaved Changes</h4>
              <p className="text-sm text-muted-foreground">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
              }}
            >
              Discard Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QuickAddClientDialog
        open={showQuickAddClient}
        onOpenChange={setShowQuickAddClient}
        onClientAdded={(newClient) => {
          setLocalClients((prev) => [newClient, ...prev]);
          setFormData((prev) => ({
            ...prev,
            clientName: newClient.companyName,
          }));
        }}
      />
    </>
  );
}
export default AddTrainingDialog;
