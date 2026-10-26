import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Award, Users, Search, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { Training } from "@/lib/trainings";
import {
  apiGetAwardingBodies,
  apiGetCertificateTypes,
  apiGetNextCertificateNumber,
  apiGetTrainings,
  apiCreateCertificatesBulk,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getActiveRole } from "@/lib/permissions";
import {
  getCertificateTypes,
  mergeWithDefaultCertificateTypes,
  CertificateTypeItem,
} from "../utils/generateWordCertificate";
import { UpdateSequenceDialog } from "./UpdateSequenceDialog";

const formatDateToDDMMYYYY = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dy = String(date.getDate()).padStart(2, "0");
  return `${dy}-${mo}-${yyyy}`;
};

const normalizeDateStr = (dateStr?: string): string => {
  if (!dateStr) return "";
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  }
  return dateStr;
};

interface IssueCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (certificateData: any) => Promise<void> | void;
  onSubmit?: (certificateData: any) => Promise<void> | void;
  onBulkSubmit?: (items: any[]) => Promise<any> | void;
  initialMode?: "single" | "multiple";
  initialTrainingIds?: string[];
}

export function IssueCertificateDialog({
  open,
  onOpenChange,
  onAdd,
  onSubmit,
  onBulkSubmit,
  initialMode,
  initialTrainingIds,
}: IssueCertificateDialogProps) {
  const handleAddFn = onAdd || onSubmit;
  const { toast } = useToast();
  const [issueMode, setIssueMode] = useState<"single" | "multiple">(initialMode || "single");
  const [certCategory, setCertCategory] = useState<"training" | "inspection">("training");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [completedTrainings, setCompletedTrainings] = useState<Training[]>([]);
  const [awardingBodies, setAwardingBodies] = useState<any[]>([]);

  // Single mode state
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>("");
  const [formData, setFormData] = useState({
    participantName: "",
    company: "",
    customCompany: "",
    course: "",
    issueDate: "",
    expiryYears: "1",
    certificateType: "Specific" as string,
    durationDays: 3,
    drivingLicenseNo: "",
    drivingLicenseType: "",
    awardingBodyId: "",
    awardingBodyName: "",
    isSystemIssued: true,
    certificateNumber: "",
  });

  // Multiple mode state
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  // Batch shared settings: single certificate type & validity for the whole batch
  const [batchCertificateType, setBatchCertificateType] = useState("Specific");
  const [batchExpiryYears, setBatchExpiryYears] = useState("1");
  const [batchDurationDays, setBatchDurationDays] = useState(3);
  const [batchDefaultDate, setBatchDefaultDate] = useState(formatDateToDDMMYYYY(new Date()));

  // Only the issue date varies per participant
  const [participantDates, setParticipantDates] = useState<Record<string, string>>({});

  const [certificateTypesList, setCertificateTypesList] =
    useState<CertificateTypeItem[]>(getCertificateTypes);
  const [nextCertNumber, setNextCertNumber] = useState<string>("");
  const [showSequenceDialog, setShowSequenceDialog] = useState(false);
  const isDeveloper = getActiveRole() === "super_admin" || (getActiveRole() as string) === "developer";

  useEffect(() => {
    if (open) {
      apiGetCertificateTypes()
        .then((types) => {
          const merged = mergeWithDefaultCertificateTypes(types);
          setCertificateTypesList(merged);
          localStorage.setItem(
            "accreditos_certificate_types",
            JSON.stringify(merged),
          );
        })
        .catch(() => setCertificateTypesList(getCertificateTypes()));

      if (initialMode) {
        setIssueMode(initialMode);
      }

      setSelectedTrainingId("");
      const initialIdsSet = initialTrainingIds && initialTrainingIds.length > 0
        ? new Set(initialTrainingIds)
        : new Set<string>();
      setSelectedTrainingIds(initialIdsSet);
      setParticipantDates({});
      setSearchQuery("");
      setCourseFilter("all");
      setLoadingTrainings(true);

      const todayStr = formatDateToDDMMYYYY(new Date());
      setBatchDefaultDate(todayStr);
      setBatchCertificateType("Specific");
      setBatchExpiryYears("1");
      setBatchDurationDays(3);

      Promise.all([
        apiGetAwardingBodies().catch((err) => {
          console.error("Failed to load awarding bodies:", err);
          return [];
        }),
        apiGetTrainings(
          initialIdsSet.size > 0 ? undefined : "completed",
          1,
          "",
          1000,
          undefined,
          undefined,
          false
        ).catch((err) => {
          console.error("Failed to load trainings for certificate issue:", err);
          return { success: false, data: [] };
        }),
      ])
        .then(([bodies, trainingsRes]) => {
          if (Array.isArray(bodies)) setAwardingBodies(bodies);
          const rawList = (trainingsRes as any)?.data || [];
          const list = Array.isArray(rawList)
            ? rawList.filter((t: any) => {
                if (t.certificateIssued) return false;
                if (t.status === "cancelled") return false;
                // Only show completed trainings/inspections (unless explicitly pre-selected from Trainings page)
                if (initialIdsSet.size > 0 && initialIdsSet.has(t.id)) return true;
                return t.status === "completed";
              })
            : [];
          setCompletedTrainings(list);

          if (initialIdsSet.size > 0) {
            const initialDates: Record<string, string> = {};
            list.forEach((t: any) => {
              if (initialIdsSet.has(t.id)) {
                initialDates[t.id] =
                  normalizeDateStr(t.issueDate) ||
                  todayStr;
              }
            });
            setParticipantDates(initialDates);
          }
        })
        .finally(() => setLoadingTrainings(false));

      apiGetNextCertificateNumber()
        .then((res) => {
          if (res?.success && res.data) setNextCertNumber(res.data.nextNumber);
        })
        .catch(() => setNextCertNumber(""));

      setFormData({
        participantName: "",
        company: "",
        customCompany: "",
        course: "",
        issueDate: "",
        expiryYears: "1",
        certificateType: "Specific",
        durationDays: 3,
        drivingLicenseNo: "",
        drivingLicenseType: "",
        awardingBodyId: "",
        awardingBodyName: "",
        isSystemIssued: true,
        certificateNumber: "",
      });
    }
  }, [open]);

  const isInspectionItem = (t: any) => {
    if (t.serviceType === "inspection") return true;
    if (t.serviceType === "training") return false;
    const courseName = (t.courseName || t.course?.name || "").toLowerCase();
    return courseName.includes("inspection");
  };

  const filteredTrainings = useMemo(() => {
    return completedTrainings.filter((t: any) =>
      certCategory === "inspection" ? isInspectionItem(t) : !isInspectionItem(t)
    );
  }, [completedTrainings, certCategory]);

  const displayedBatchTrainings = useMemo(() => {
    return filteredTrainings.filter((t: any) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.participantName && t.participantName.toLowerCase().includes(q)) ||
        (t.clientName && t.clientName.toLowerCase().includes(q)) ||
        (t.courseName && t.courseName.toLowerCase().includes(q));

      const matchCourse =
        courseFilter === "all" ||
        t.courseId === courseFilter ||
        t.courseName === courseFilter;

      return matchSearch && matchCourse;
    });
  }, [filteredTrainings, searchQuery, courseFilter]);

  const availableCourses = useMemo(() => {
    const map = new Map<string, string>();
    filteredTrainings.forEach((t: any) => {
      const id = t.courseId || t.courseName;
      const name = t.courseName || "Unknown Course";
      if (id && !map.has(id)) {
        map.set(id, name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [filteredTrainings]);

  const selectedTraining = useMemo(
    () => completedTrainings.find((t) => t.id === selectedTrainingId),
    [completedTrainings, selectedTrainingId]
  );

  const isCurrentInspection = useMemo(() => {
    if (certCategory === "inspection") return true;
    if (selectedTraining) return isInspectionItem(selectedTraining);
    return false;
  }, [certCategory, selectedTraining]);

  // A certificate number field is only applicable if it's NOT an inspection AND has an awarding body (or system issued)
  const hasCertificateNumber = useMemo(() => {
    if (isCurrentInspection) return false;
    if (!formData.awardingBodyId || formData.awardingBodyId === "none") return false;
    return Boolean(formData.isSystemIssued || formData.awardingBodyName);
  }, [isCurrentInspection, formData.awardingBodyId, formData.isSystemIssued, formData.awardingBodyName]);

  // Sequence preview for both single and multiple modes
  const sequencePreview = useMemo(() => {
    if (certCategory === "inspection") return "";
    if (!nextCertNumber) return "";
    const match = nextCertNumber.match(/^TCT-(\d+)-AC$/);
    if (!match) return "";
    const startNum = parseInt(match[1], 10);

    if (issueMode === "single") {
      if (!hasCertificateNumber || !formData.isSystemIssued) return "";
      return formData.certificateNumber || `TCT-${startNum}-AC`;
    }

    if (selectedTrainingIds.size === 0) return "";
    const selectedList = completedTrainings.filter((t) => selectedTrainingIds.has(t.id));
    const hasSystemIssued = selectedList.some((t) => {
      if (isInspectionItem(t)) return false;
      const b = awardingBodies.find((body) => body.id === (t as any).awardingBodyId);
      return b ? Boolean(b.isSystemIssued) : false;
    });
    if (!hasSystemIssued) return "";

    if (selectedTrainingIds.size === 1) {
      return `TCT-${startNum}-AC`;
    }
    const endNum = startNum + selectedTrainingIds.size - 1;
    return `TCT-${startNum}-AC → TCT-${endNum}-AC`;
  }, [
    nextCertNumber,
    issueMode,
    formData.certificateNumber,
    selectedTrainingIds.size,
    certCategory,
    hasCertificateNumber,
    formData.isSystemIssued,
    completedTrainings,
    awardingBodies,
  ]);

  // Single participant select handler
  const handleParticipantSelect = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    const matched = completedTrainings.find((t) => t.id === trainingId);
    if (matched) {
      const matchedBody = awardingBodies.find(
        (b) => b.id === (matched as any).awardingBodyId,
      );
      const isInspection = isInspectionItem(matched);
      const hasLicense = !isInspection && Boolean((matched as any).drivingLicenseNo);
      setFormData((prev) => ({
        ...prev,
        participantName: matched.participantName,
        company: matched.clientName,
        customCompany: (matched as any).customCompany || "",
        course: matched.courseName,
        issueDate: normalizeDateStr(matched.issueDate) || formatDateToDDMMYYYY(new Date()),
        certificateType: hasLicense ? "License" : isInspection ? "Specific" : prev.certificateType,
        drivingLicenseNo: (matched as any).drivingLicenseNo || "",
        drivingLicenseType: (matched as any).drivingLicenseType || "",
        awardingBodyId: (matched as any).awardingBodyId || "",
        awardingBodyName: matchedBody?.name || "",
        isSystemIssued: matchedBody ? Boolean(matchedBody.isSystemIssued) : false,
        certificateNumber: "",
      }));
    }
  };

  // Toggle participant selection in multiple mode
  const toggleTrainingSelection = (training: Training) => {
    setSelectedTrainingIds((prev) => {
      const next = new Set(prev);
      if (next.has(training.id)) {
        next.delete(training.id);
      } else {
        next.add(training.id);
        if (!participantDates[training.id]) {
          const initialDate =
            normalizeDateStr(training.issueDate) ||
            batchDefaultDate ||
            formatDateToDDMMYYYY(new Date());
          setParticipantDates((prevDates) => ({
            ...prevDates,
            [training.id]: initialDate,
          }));
        }
      }
      return next;
    });
  };

  const handleSelectAllDisplayed = () => {
    const nextSet = new Set(selectedTrainingIds);
    const nextDates = { ...participantDates };

    displayedBatchTrainings.forEach((t) => {
      nextSet.add(t.id);
      if (!nextDates[t.id]) {
        nextDates[t.id] =
          normalizeDateStr(t.issueDate) ||
          batchDefaultDate ||
          formatDateToDDMMYYYY(new Date());
      }
    });

    setSelectedTrainingIds(nextSet);
    setParticipantDates(nextDates);
  };

  const handleClearSelection = () => {
    setSelectedTrainingIds(new Set());
  };

  const updateParticipantDate = (trainingId: string, date: string) => {
    setParticipantDates((prev) => ({
      ...prev,
      [trainingId]: date,
    }));
  };

  const handleApplyBatchDateToAll = () => {
    if (!batchDefaultDate) return;
    setParticipantDates((prev) => {
      const next = { ...prev };
      selectedTrainingIds.forEach((id) => {
        next[id] = batchDefaultDate;
      });
      return next;
    });
  };

  // Single certificate submit
  const handleSingleSubmit = async () => {
    if (!handleAddFn || !selectedTrainingId) return;
    setIsSubmitting(true);
    try {
      await handleAddFn({
        trainingId: selectedTrainingId,
        serviceType: certCategory,
        participantName: formData.participantName,
        company: formData.company,
        customCompany: formData.customCompany?.trim() || undefined,
        course: formData.course,
        expiryYears: formData.expiryYears,
        issueDate: formData.issueDate,
        certificateType: formData.certificateType,
        durationDays:
          formData.certificateType === "Duration"
            ? formData.durationDays
            : undefined,
        drivingLicenseNo:
          formData.certificateType === "License" || formData.drivingLicenseNo
            ? formData.drivingLicenseNo || undefined
            : undefined,
        drivingLicenseType:
          formData.certificateType === "License" || formData.drivingLicenseType
            ? formData.drivingLicenseType || undefined
            : undefined,
        certificateNumber:
          hasCertificateNumber && formData.certificateNumber
            ? formData.certificateNumber
            : undefined,
        awardingBodyId: formData.awardingBodyId || undefined,
      });
      toast({
        title: "Certificate Issued",
        description: `Successfully issued certificate for ${formData.participantName}.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error issuing single certificate:", err);
      toast({
        title: "Issuance Failed",
        description: err.message || "Failed to issue certificate.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multiple certificates submit
  const handleMultipleSubmit = async () => {
    if (selectedTrainingIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const items = Array.from(selectedTrainingIds).map((id) => {
        const training = completedTrainings.find((t) => t.id === id);

        const itemIssueDate =
          participantDates[id] ||
          normalizeDateStr(training?.issueDate) ||
          batchDefaultDate ||
          formatDateToDDMMYYYY(new Date());

        return {
          trainingId: id,
          serviceType: certCategory,
          participantName: training?.participantName || "",
          company: training?.clientName || "",
          customCompany: (training as any)?.customCompany || undefined,
          course: training?.courseName || "",
          issueDate: itemIssueDate,
          expiryYears: batchExpiryYears,
          certificateType: batchCertificateType,
          awardingBodyId: (training as any)?.awardingBodyId || undefined,
          durationDays:
            batchCertificateType === "Duration" ? batchDurationDays : undefined,
          drivingLicenseNo: (training as any)?.drivingLicenseNo || undefined,
          drivingLicenseType: (training as any)?.drivingLicenseType || undefined,
        };
      });

      if (onBulkSubmit) {
        await onBulkSubmit(items);
      } else {
        await apiCreateCertificatesBulk(items);
      }
      toast({
        title: "Certificates Issued",
        description: `Successfully issued ${items.length} certificate(s).`,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error issuing multiple certificates:", err);
      toast({
        title: "Issuance Failed",
        description: err.message || "Failed to issue certificates in bulk.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (issueMode === "single") {
      handleSingleSubmit();
    } else {
      handleMultipleSubmit();
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={issueMode === "single" ? "Issue Certificate" : "Issue Multiple Certificates"}
      description={
        issueMode === "single"
          ? "Select a completed participant, verify certificate type, and configure issue details."
          : "Issue credentials in batch. A single certificate type is applied to all, while issue dates can vary per candidate."
      }
      icon={issueMode === "single" ? Award : Users}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={
        issueMode === "single"
          ? "Issue Certificate"
          : `Issue ${selectedTrainingIds.size} Certificate${selectedTrainingIds.size !== 1 ? "s" : ""}`
      }
      submitDisabled={issueMode === "single" ? !selectedTrainingId : selectedTrainingIds.size === 0}
      maxWidth="max-w-3xl"
    >
      {/* Top Mode Selector Tabs */}
      <div className="flex items-center justify-between p-1 bg-muted/50 rounded-lg border border-border/60">
        <button
          type="button"
          onClick={() => setIssueMode("single")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            issueMode === "single"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Single Issue
        </button>
        <button
          type="button"
          onClick={() => setIssueMode("multiple")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            issueMode === "multiple"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Multiple Issue (Batch)
          {selectedTrainingIds.size > 0 && (
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] h-4">
              {selectedTrainingIds.size}
            </Badge>
          )}
        </button>
      </div>

      {/* Category Toggle (Training vs Inspection) */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold">Certificate Category</Label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => {
              setCertCategory("training");
              setSelectedTrainingId("");
              setSelectedTrainingIds(new Set());
            }}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              certCategory === "training"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Training Certificate
          </button>
          <button
            type="button"
            onClick={() => {
              setCertCategory("inspection");
              setSelectedTrainingId("");
              setSelectedTrainingIds(new Set());
            }}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              certCategory === "inspection"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Inspection Certificate
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SINGLE ISSUE MODE */}
      {/* ========================================================= */}
      {issueMode === "single" && (
        <div className="space-y-4">
          {/* Select Completed Training */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">
              Select Completed {certCategory === "inspection" ? "Inspection" : "Training"} *
            </Label>
            <Select
              value={selectedTrainingId}
              onValueChange={handleParticipantSelect}
              disabled={loadingTrainings}
            >
              <SelectTrigger className="w-full bg-background border-border/80 text-sm">
                <SelectValue
                  placeholder={
                    loadingTrainings
                      ? "Loading..."
                      : filteredTrainings.length === 0
                        ? `No pending completed ${certCategory === "inspection" ? "inspections" : "trainings"}`
                        : `Choose completed ${certCategory === "inspection" ? "inspection" : "training"}...`
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg max-h-[300px]">
                {filteredTrainings.map((t) => {
                  const bodyName =
                    (t as any).awardingBodyName ||
                    awardingBodies.find((b) => b.id === (t as any).awardingBodyId)?.name ||
                    "";
                  const bodyPrefix = bodyName ? bodyName.slice(0, 2).toUpperCase() : "";
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        {bodyPrefix && (
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            {bodyPrefix}
                          </span>
                        )}
                        <span>
                          {t.participantName} ({t.courseName})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Settings Card: Certificate Type (RIGHT ABOVE COMPANY), Valid For & Issue Date */}
          <div className="p-3.5 rounded-xl bg-primary/[0.03] border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Certificate Configuration</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Set certificate type and validity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Certificate Type (MOVED RIGHT ABOVE COMPANY) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold">Certificate Type *</Label>
                <Select
                  value={formData.certificateType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, certificateType: v as any })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    {certificateTypesList.map((t) => (
                      <SelectItem key={t.id || t.code} value={t.code}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valid For */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold">Valid For *</Label>
                <Select
                  value={formData.expiryYears}
                  onValueChange={(v) => setFormData({ ...formData, expiryYears: v })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Training Issue Date */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  Issue Date (DD-MM-YYYY)
                </Label>
                <Input
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  placeholder="DD-MM-YYYY"
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
            </div>

            {/* Extra Duration Days input if Duration type chosen */}
            {formData.certificateType === "Duration" && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <Label className="text-xs font-medium text-muted-foreground shrink-0">
                  Training Duration (Days):
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formData.durationDays}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setFormData({
                      ...formData,
                      durationDays: Math.max(1, parseInt(val) || 1),
                    });
                  }}
                  className="h-7 w-20 text-xs bg-background"
                />
              </div>
            )}

            {/* Extra License inputs if License type chosen */}
            {formData.certificateType === "License" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">
                    Driving License No. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.drivingLicenseNo}
                    onChange={(e) =>
                      setFormData({ ...formData, drivingLicenseNo: e.target.value })
                    }
                    placeholder="e.g. 1324136"
                    className="h-8 font-mono text-xs bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">License Type (Category)</Label>
                  <Input
                    value={formData.drivingLicenseType}
                    onChange={(e) =>
                      setFormData({ ...formData, drivingLicenseType: e.target.value })
                    }
                    placeholder="e.g. LV, HV, Light Bus"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Candidate & Course Information: Company directly follows Certificate Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Company</Label>
              <Input
                value={formData.company}
                disabled
                placeholder="Company auto-fills"
                className="h-8 text-xs bg-muted/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Course</Label>
              <Input
                value={formData.course}
                disabled
                placeholder="Course auto-fills"
                className="h-8 text-xs bg-muted/40"
              />
            </div>
          </div>

          {/* Optional Custom Company for Individual Candidates */}
          {Boolean(
            selectedTrainingId &&
            (
              formData.company === "Individual Candidate" ||
              formData.company?.toLowerCase().includes("individual") ||
              Boolean(formData.customCompany)
            )
          ) && (
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
              <Label htmlFor="issueCustomCompany" className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Display Company on Certificate <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="issueCustomCompany"
                value={formData.customCompany}
                onChange={(e) =>
                  setFormData({ ...formData, customCompany: e.target.value })
                }
                placeholder="e.g. Al Futtaim, Emirates Steel"
                className="bg-background text-xs h-8"
              />
              <p className="text-[11px] text-muted-foreground">
                Prints this company name on the certificate for this individual without registering a new client.
              </p>
            </div>
          )}

          {/* Awarding Body & Certificate Number */}
          {hasCertificateNumber ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Awarding Body</Label>
                <Input
                  value={formData.awardingBodyName || "Internal System"}
                  disabled
                  className="h-8 text-xs bg-muted/40"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Certificate Number</Label>
                <Input
                  value={formData.certificateNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, certificateNumber: e.target.value })
                  }
                  placeholder={
                    formData.isSystemIssued
                      ? (nextCertNumber ? `Auto: ${nextCertNumber}` : "Leave empty to auto-generate")
                      : "Enter certificate number"
                  }
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
            </div>
          ) : formData.awardingBodyName ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Awarding Body</Label>
              <Input
                value={formData.awardingBodyName}
                disabled
                className="h-8 text-xs bg-muted/40"
              />
            </div>
          ) : null}

          {/* Sequence Preview Box in Single Mode */}
          {sequencePreview && hasCertificateNumber && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/[0.04] border border-primary/20 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Will be assigned:{" "}
                  <strong className="font-mono text-primary">{sequencePreview}</strong>
                </span>
              </div>
              {isDeveloper && (
                <button
                  type="button"
                  onClick={() => setShowSequenceDialog(true)}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline underline-offset-2 transition-colors"
                >
                  Edit Sequence
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MULTIPLE ISSUE (BATCH) MODE */}
      {/* ========================================================= */}
      {issueMode === "multiple" && (
        <div className="flex flex-col gap-4">
          {/* Batch Common Settings Card: Identical to Single Mode */}
          <div className="p-3.5 rounded-xl bg-primary/[0.03] border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Batch Settings (Applied to all selected certificates)</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                One certificate type for the entire batch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Single Certificate Type for all */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold">Certificate Type *</Label>
                <Select
                  value={batchCertificateType}
                  onValueChange={setBatchCertificateType}
                >
                  <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    {certificateTypesList.map((t) => (
                      <SelectItem key={t.id || t.code} value={t.code}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Single Validity for all */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold">Valid For *</Label>
                <Select
                  value={batchExpiryYears}
                  onValueChange={setBatchExpiryYears}
                >
                  <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Issue Date */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold">Default Issue Date</Label>
                  <button
                    type="button"
                    onClick={handleApplyBatchDateToAll}
                    disabled={selectedTrainingIds.size === 0}
                    className="text-[10px] text-primary hover:underline font-medium disabled:opacity-40"
                  >
                    Apply to all
                  </button>
                </div>
                <Input
                  value={batchDefaultDate}
                  onChange={(e) => setBatchDefaultDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>
            </div>

            {/* Extra Duration Days input if Duration type chosen */}
            {batchCertificateType === "Duration" && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <Label className="text-xs font-medium text-muted-foreground shrink-0">
                  Course Duration (Days):
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={batchDurationDays}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setBatchDurationDays(Math.max(1, parseInt(val) || 1));
                  }}
                  className="h-7 w-20 text-xs bg-background"
                />
              </div>
            )}
          </div>

          {/* Search, Filter & Select All Bar */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search participant or company..."
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              {availableCourses.length > 1 && (
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    <SelectItem value="all">All Courses</SelectItem>
                    {availableCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleSelectAllDisplayed}
                disabled={displayedBatchTrainings.length === 0}
                className="text-xs text-primary font-medium hover:underline disabled:opacity-40"
              >
                Select All ({displayedBatchTrainings.length})
              </button>
              <span className="text-muted-foreground text-xs">•</span>
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={selectedTrainingIds.size === 0}
                className="text-xs text-muted-foreground hover:text-foreground font-medium disabled:opacity-40"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Participant Cards with Individual Issue Date */}
          <div className="flex flex-col border border-border/80 rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="p-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Available Candidates ({displayedBatchTrainings.length})</span>
              <span>
                Selected: <strong className="text-primary">{selectedTrainingIds.size}</strong>
              </span>
            </div>

            <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto">
              {loadingTrainings ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Loading available candidates...
                </div>
              ) : displayedBatchTrainings.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {filteredTrainings.length === 0
                    ? `No completed ${certCategory === "inspection" ? "inspections" : "trainings"} available for certificate issuance.`
                    : "No candidates match the search or filter."}
                </div>
              ) : (
                displayedBatchTrainings.map((t) => {
                  const isSelected = selectedTrainingIds.has(t.id);
                  const currentDate =
                    participantDates[t.id] ||
                    normalizeDateStr(t.issueDate) ||
                    batchDefaultDate ||
                    formatDateToDDMMYYYY(new Date());

                  const bodyName =
                    (t as any).awardingBodyName ||
                    awardingBodies.find((b) => b.id === (t as any).awardingBodyId)?.name ||
                    "";

                  return (
                    <div
                      key={t.id}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? "bg-primary/[0.04] dark:bg-primary/[0.08]"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      {/* Left: Checkbox & Participant Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Checkbox
                          id={`chk-${t.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleTrainingSelection(t)}
                        />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`chk-${t.id}`}
                            className="flex flex-wrap items-center gap-1.5 cursor-pointer"
                          >
                            <span className="font-semibold text-xs text-foreground truncate">
                              {t.participantName}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              • {t.courseName}
                            </span>
                          </label>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-normal py-0 px-1.5 h-4 bg-muted/30"
                            >
                              {t.clientName || "Individual"}
                            </Badge>
                            {bodyName && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-medium py-0 px-1.5 h-4 bg-primary/10 text-primary border-transparent"
                              >
                                {bodyName}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-bold py-0 px-1.5 h-4 ${
                                t.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {t.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right: Individual Issue Date Input */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary" />
                            Issue Date:
                          </span>
                          <Input
                            value={currentDate}
                            onChange={(e) => updateParticipantDate(t.id, e.target.value)}
                            disabled={!isSelected}
                            placeholder="DD-MM-YYYY"
                            className="h-7 w-28 text-xs font-mono bg-background text-right"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sequence Preview Box in Multiple Mode */}
          {sequencePreview && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/[0.04] border border-primary/20 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Sequence Preview ({selectedTrainingIds.size}):{" "}
                  <strong className="font-mono text-primary">{sequencePreview}</strong>
                </span>
              </div>
              {isDeveloper && (
                <button
                  type="button"
                  onClick={() => setShowSequenceDialog(true)}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 underline underline-offset-2 transition-colors"
                >
                  Edit Sequence
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showSequenceDialog && (
        <UpdateSequenceDialog
          open={showSequenceDialog}
          onOpenChange={setShowSequenceDialog}
          onSuccess={() => {
            apiGetNextCertificateNumber()
              .then((res) => {
                if (res?.success && res.data) setNextCertNumber(res.data.nextNumber);
              })
              .catch(() => {});
          }}
        />
      )}
    </FormDialog>
  );
}
