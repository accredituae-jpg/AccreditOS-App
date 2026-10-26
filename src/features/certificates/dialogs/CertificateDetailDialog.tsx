import { useState } from "react";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  FileText,
  FileType,
  Copy,
  Check,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getActiveRole } from "@/lib/permissions";
import type { Certificate } from "../types/certificates.types";

interface CertificateDetailDialogProps {
  certificate: Certificate | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onEdit?: () => void;
  onDownload?: (cert: Certificate) => void;
  onDownloadPdf?: (cert: Certificate) => void;
  isDeveloper?: boolean;
}

export function CertificateDetailDialog({
  certificate,
  open,
  onOpenChange,
  onClose,
  onEdit,
  onDownload,
  onDownloadPdf,
  isDeveloper = false,
}: CertificateDetailDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const activeRole = getActiveRole();
  const isSuperAdmin = isDeveloper || activeRole === "super_admin";

  const isOpen = open !== undefined ? open : !!certificate;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const copyNumberToClipboard = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopied(true);
    toast({
      title: "Copied to Clipboard",
      description: `Certificate number (${num}) copied!`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!certificate) return null;

  return (
    <DetailDialog
      open={isOpen}
      onOpenChange={(op) => !op && handleClose()}
      title={certificate.participantName}
      subtitle={`${
        certificate.certificateNumber
          ? `Cert #${certificate.certificateNumber}`
          : certificate.awardingBodyName && certificate.awardingBodyName.toLowerCase() !== "tatweer"
          ? certificate.awardingBodyName
          : "Pending"
      } • ${certificate.company}`}
      icon={<Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />}
      status={{
        label:
          certificate.renewalStatus === "valid"
            ? "Valid"
            : certificate.renewalStatus === "expiring-soon"
            ? `${certificate.daysUntilExpiry} days left`
            : "Expired",
        variant:
          certificate.renewalStatus === "valid"
            ? "success"
            : certificate.renewalStatus === "expiring-soon"
            ? "warning"
            : "destructive",
      }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && certificate.isSystemIssued !== false && (
            <>
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1.5 font-semibold text-xs rounded-lg"
                  onClick={() => onDownload(certificate)}
                  aria-label="Download Word (.docx) Certificate"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Word (.docx)</span>
                </Button>
              )}

              {onDownloadPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 font-semibold text-xs rounded-lg"
                  onClick={() => onDownloadPdf(certificate)}
                  aria-label="Download PDF (.pdf) Certificate"
                >
                  <FileType className="w-3.5 h-3.5 text-emerald-500" />
                  <span>PDF (.pdf)</span>
                </Button>
              )}
            </>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleClose}
            className="h-8 px-5 text-xs font-semibold shadow-xs rounded-lg"
          >
            Close
          </Button>
        </div>
      }
    >
      {/* Clean Seamless Divided List (No inner boxes) */}
      <div className="divide-y divide-border/40 py-1">
        {/* Certificate Number */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Certificate Number / Body</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sky-500 dark:text-sky-400 text-xs sm:text-sm">
              {certificate.certificateNumber ||
                (certificate.awardingBodyName && certificate.awardingBodyName.toLowerCase() !== "tatweer"
                  ? certificate.awardingBodyName
                  : "NO NUMBER ASSIGNED")}
            </span>
            {certificate.certificateNumber && (
              <button
                type="button"
                onClick={() => copyNumberToClipboard(certificate.certificateNumber)}
                className="p-1 hover:bg-accent rounded-md text-primary transition-colors"
                title="Copy Certificate Number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Participant Name */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Participant Name</span>
          <span className="font-bold text-foreground text-xs sm:text-sm text-right">{certificate.participantName}</span>
        </div>

        {/* Company / Client */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Company / Client</span>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-foreground text-xs sm:text-sm text-right">
              {certificate.customCompany || certificate.company}
            </span>
            {certificate.customCompany && (
              <span className="text-[11px] text-muted-foreground font-normal">
                (Individual Candidate)
              </span>
            )}
          </div>
        </div>

        {/* Course Name */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Training Course</span>
          <span className="font-bold text-foreground text-xs sm:text-sm text-right max-w-[240px] truncate">{certificate.course}</span>
        </div>

        {/* Certificate Type */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Certificate Type</span>
          <Badge variant="outline" className="border-sky-500/30 text-sky-400 bg-sky-500/10 font-mono text-xs">
            {certificate.certificateType || "Specific"} Certificate
          </Badge>
        </div>

        {/* Driving License Information if present */}
        {certificate.drivingLicenseNo && (
          <div className="py-2.5 flex items-center justify-between gap-2">
            <span className="text-muted-foreground font-medium text-xs sm:text-sm">Driving License</span>
            <span className="font-mono font-bold text-amber-500 dark:text-amber-400 text-xs sm:text-sm text-right">
              {certificate.drivingLicenseNo}
              {certificate.drivingLicenseType ? ` (${certificate.drivingLicenseType})` : ""}
            </span>
          </div>
        )}

        {/* Awarding Body */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Awarding Body</span>
          <span className="font-bold text-foreground text-xs sm:text-sm text-right">{certificate.awardingBodyName || "Tatweer"}</span>
        </div>

        {/* Status */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Status</span>
          <Badge variant="outline" className="capitalize text-xs font-semibold px-2.5 py-0.5">
            {certificate.status || "issued"}
          </Badge>
        </div>

        {/* Issue Date */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Issue Date</span>
          <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm">{certificate.issueDate}</span>
        </div>

        {/* Expiry Date */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Expiry Date</span>
          <span className="font-mono font-bold text-rose-500 dark:text-rose-400 text-xs sm:text-sm">{certificate.expiryDate}</span>
        </div>

        {/* Billing Status */}
        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-medium text-xs sm:text-sm">Billing Status</span>
          {certificate.invoiceIssued ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Invoiced / Billed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
              Not Invoiced
            </Badge>
          )}
        </div>
      </div>
    </DetailDialog>
  );
}

export default CertificateDetailDialog;
