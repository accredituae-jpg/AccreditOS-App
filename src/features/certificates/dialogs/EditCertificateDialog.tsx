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
import { Award } from "lucide-react";
import { getActiveRole } from "@/lib/permissions";
import { apiGetCertificateTypes } from "@/lib/api";
import {
  getCertificateTypes,
  mergeWithDefaultCertificateTypes,
  CertificateTypeItem,
} from "../utils/generateWordCertificate";
import type { Certificate } from "../types/certificates.types";

interface EditCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
  onUpdate?: (updatedCertificate: Certificate) => Promise<void> | void;
  onSubmit?: (updatedCertificate: Certificate) => Promise<void> | void;
}

export function EditCertificateDialog({
  open,
  onOpenChange,
  certificate,
  onUpdate,
  onSubmit,
}: EditCertificateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    id: "",
    participantName: "",
    company: "",
    customCompany: "",
    course: "",
    certificateNumber: "",
    certificateType: "Specific" as Certificate["certificateType"],
    durationDays: 3,
    drivingLicenseNo: "",
    drivingLicenseType: "",
    status: "created" as Certificate["status"],
  });

  const [certificateTypesList, setCertificateTypesList] = useState<CertificateTypeItem[]>(getCertificateTypes);

  useEffect(() => {
    if (certificate && open) {
      apiGetCertificateTypes()
        .then((types) => {
          const merged = mergeWithDefaultCertificateTypes(types);
          setCertificateTypesList(merged);
          localStorage.setItem("accreditos_certificate_types", JSON.stringify(merged));
        })
        .catch(() => setCertificateTypesList(getCertificateTypes()));

      setFormData({
        id: certificate.id,
        participantName: certificate.participantName,
        company: certificate.company,
        customCompany: certificate.customCompany || "",
        course: certificate.course,
        certificateNumber: certificate.certificateNumber || "",
        certificateType: certificate.certificateType || "Specific",
        durationDays: certificate.durationDays || 3,
        drivingLicenseNo: certificate.drivingLicenseNo || "",
        drivingLicenseType: certificate.drivingLicenseType || "",
        status: certificate.status || "created",
      });

      const parseDate = (dStr: string) => {
        if (!dStr) return new Date();
        const parts = dStr.split("-").map(Number);
        if (parts.length !== 3 || isNaN(parts[0])) return new Date();
        const [dy, mo, yr] = parts;
        return new Date(yr, mo - 1, dy);
      };

      setIssueDate(parseDate(certificate.issueDate));
      setExpiryDate(parseDate(certificate.expiryDate));
    }
  }, [certificate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !certificate) return;

    const formatDate = (date: Date) => {
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, "0");
      const dy = String(date.getDate()).padStart(2, "0");
      return `${dy}-${mo}-${yr}`;
    };

    const isTatweer =
      !certificate?.awardingBodyName ||
      certificate.awardingBodyName.toLowerCase() === "tatweer";

    setIsSubmitting(true);
    try {
      const updateFn = onUpdate || onSubmit;
      if (updateFn) {
        await updateFn({
          ...certificate,
          id: formData.id,
          participantName: formData.participantName,
          company: formData.company,
          customCompany: formData.customCompany !== undefined ? (formData.customCompany.trim() || null) : undefined,
          course: formData.course,
          certificateNumber: formData.certificateNumber,
          certificateType: formData.certificateType,
          durationDays: formData.certificateType === "Duration" ? formData.durationDays : undefined,
          drivingLicenseNo:
            formData.certificateType === "License" || formData.drivingLicenseNo
              ? formData.drivingLicenseNo || undefined
              : undefined,
          drivingLicenseType:
            formData.certificateType === "License" || formData.drivingLicenseType
              ? formData.drivingLicenseType || undefined
              : undefined,
          status: formData.status,
          issueDate: formatDate(issueDate),
          expiryDate: formatDate(expiryDate),
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating certificate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTatweer =
    !certificate?.awardingBodyName ||
    certificate.awardingBodyName.toLowerCase() === "tatweer";

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Edit Certificate"
      description="Update certificate validity, number, and status"
      icon={Award}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      submitDisabled={isTatweer && !formData.certificateNumber.trim()}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-2">
        <Label>Participant Name</Label>
        <Input
          value={formData.participantName}
          disabled
          className="bg-muted/40"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Company</Label>
        <Input value={formData.company} disabled className="bg-muted/40" />
      </div>

      {Boolean(
        certificate?.company === "Individual Candidate" ||
        certificate?.company?.toLowerCase().includes("individual") ||
        Boolean(certificate?.customCompany)
      ) && (
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
          <Label htmlFor="editCertCustomCompany" className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Display Company on Certificate <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <Input
            id="editCertCustomCompany"
            value={formData.customCompany}
            onChange={(e) =>
              setFormData({ ...formData, customCompany: e.target.value })
            }
            placeholder="e.g. Al Futtaim, Emirates Steel"
            className="bg-background text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Prints this company on the candidate's certificate. Leave blank to omit company from the certificate.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Course</Label>
        <Input value={formData.course} disabled className="bg-muted/40" />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Certificate Number {isTatweer ? "*" : `(Optional for ${certificate?.awardingBodyName || "Non-Tatweer"})`}
        </Label>
        <Input
          value={formData.certificateNumber}
          onChange={(e) =>
            setFormData({ ...formData, certificateNumber: e.target.value })
          }
          placeholder={isTatweer ? "Enter certificate number (e.g. TCT-5724-AC)" : "Optional certificate number"}
          required={isTatweer}
        />
      </div>

      {(getActiveRole() === "super_admin" || (getActiveRole() as string) === "developer") && (
        <div className="flex flex-col gap-2">
          <Label>Certificate Type *</Label>
          <Select
            value={formData.certificateType}
            onValueChange={(v) =>
              setFormData({ ...formData, certificateType: v as any })
            }
          >
            <SelectTrigger className="w-full bg-background border-border/80">
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
      )}

      {formData.certificateType === "Duration" && (
        <div className="flex flex-col gap-2">
          <Label>Training Duration (Number of Days) *</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={formData.durationDays}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setFormData({ ...formData, durationDays: Math.max(1, parseInt(val) || 1) });
            }}
            placeholder="e.g. 3"
          />
        </div>
      )}

      {formData.certificateType === "License" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
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
            <Label className="text-xs font-semibold">
              License Type (Category)
            </Label>
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

      <div className="flex flex-col gap-2">
        <Label>Certificate Status</Label>
        <Select
          value={formData.status || "created"}
          onValueChange={(v) => setFormData({ ...formData, status: v as any })}
        >
          <SelectTrigger className="w-full bg-background border-border/80">
            <SelectValue className="capitalize" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border shadow-lg">
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Issue Date</Label>
          <CustomCalendar
            value={issueDate}
            onChange={setIssueDate}
            placeholder="Select issue date"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Expiry Date</Label>
          <CustomCalendar
            value={expiryDate}
            onChange={setExpiryDate}
            placeholder="Select expiry date"
          />
        </div>
      </div>
    </FormDialog>
  );
}
export default EditCertificateDialog;
