import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RenewalBadge, InvoiceBadge } from "./CertificatesBadges";
import type { Certificate } from "../types/certificates.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { isTatweerCertificate } from "../utils/generateWordCertificate";
import { getActiveRole } from "@/lib/permissions";

const CERT_STATUS_OPTIONS = ["created", "sent"] as const;

const CERT_STATUS_STYLES: Record<string, string> = {
  created: "bg-muted/80 text-muted-foreground border-border",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  printed: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  distributed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

interface CertificatesGridViewProps {
  paginatedCertificates?: Certificate[];
  certificates?: Certificate[];
  selectedCertificateIds?: string[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
  canViewDetails?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  isDeveloper?: boolean;
  onViewDetails?: (cert: Certificate) => void;
  onEdit?: (cert: Certificate) => void;
  onDelete?: (id: string) => void;
  onDownload?: (cert: Certificate) => void;
  onDownloadPdf?: (cert: Certificate) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onStatusChange?: (cert: Certificate, newStatus: string) => void;
}

export function CertificatesGridView(props: CertificatesGridViewProps) {
  const {
    paginatedCertificates: rawPaginated,
    certificates: rawCerts,
    selectedCertificateIds: rawSelected,
    selectedIds: rawSelectedIds,
    selectionMode = false,
    onToggleSelect,
    canViewDetails = true,
    canEdit = true,
    canDelete = true,
    isDeveloper = false,
    onViewDetails,
    onEdit,
    onDelete,
    onDownload,
    onDownloadPdf,
    onStatusChange,
    currentPage = 1,
    totalPages = 1,
    loading = false,
    onPageChange,
  } = props;

  const paginatedCertificates = Array.isArray(rawPaginated)
    ? rawPaginated
    : Array.isArray(rawCerts)
      ? rawCerts
      : [];

  const selectedCertificateIds = Array.isArray(rawSelected)
    ? rawSelected
    : Array.isArray(rawSelectedIds)
      ? rawSelectedIds
      : [];

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const activeRole = getActiveRole();
  const isSuperAdmin = isDeveloper || activeRole === "super_admin";

  const handleStatusClick = async (cert: Certificate, newStatus: string) => {
    if (updatingId || !onStatusChange) return;
    setUpdatingId(cert.id);
    try {
      await onStatusChange(cert, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
      >
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skel-cert-grid-${i}`}
              className="card-elevated p-4 space-y-3 rounded-2xl"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="pt-3 border-t border-border flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          ))
        ) : paginatedCertificates.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed border-border/60 rounded-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              No certificates found.
            </p>
          </div>
        ) : (
          paginatedCertificates.map((cert, index) => {
            const isSelected = selectedCertificateIds.includes(cert.id);
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
                className={cn(
                  "card-elevated p-4 sm:p-5 rounded-2xl relative flex flex-col justify-between transition-all duration-200 hover:border-primary/40 shadow-sm hover:shadow-md",
                  canViewDetails && "cursor-pointer",
                  isSelected && "ring-2 ring-primary bg-primary/5",
                  !isSelected &&
                    cert.renewalStatus === "expired" &&
                    "border-destructive/30",
                  !isSelected &&
                    cert.renewalStatus === "expiring-soon" &&
                    "border-warning/30",
                )}
                onClick={() => {
                  if (selectionMode && onToggleSelect) {
                    onToggleSelect(cert.id);
                  } else if (canViewDetails) {
                    onViewDetails?.(cert);
                  }
                }}
              >
                {/* Header Section */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectionMode && onToggleSelect ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(cert.id);
                          }}
                          className="p-1 -ml-1 hover:bg-accent rounded-md cursor-pointer shrink-0 z-10"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleSelect(cert.id)}
                            aria-label={`Select certificate ${cert.certificateNumber || cert.id}`}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-sky-500 dark:text-sky-400 truncate">
                          {cert.participantName}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {cert.company}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <RenewalBadge cert={cert} />
                    </div>
                  </div>

                  {/* Body Key-Value Rows */}
                  <div className="space-y-2 text-xs py-1">
                    {/* Course */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">
                        Course
                      </span>
                      <span className="font-bold text-foreground text-xs truncate max-w-[160px] text-right">
                        {cert.course}
                      </span>
                    </div>

                    {/* Type */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">
                        Type
                      </span>
                      <div className="flex items-center gap-1.5">
                        {cert.serviceType === "inspection" && (
                          <span className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none">
                            Inspection
                          </span>
                        )}
                        <span className="border border-sky-500/30 text-sky-500 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-[11px] font-mono font-medium truncate max-w-[170px]">
                          {cert.certificateType
                            ? `${cert.certificateType}`
                            : "AssessmentCertificate"}
                        </span>
                      </div>
                    </div>

                    {/* Cert No. / Body */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">
                        Cert No. / Body
                      </span>
                      <span className="font-mono font-bold text-sky-500 dark:text-sky-400 text-xs">
                        {cert.certificateNumber ||
                          (cert.awardingBodyName &&
                          cert.awardingBodyName.toLowerCase() !== "tatweer"
                            ? cert.awardingBodyName
                            : "Pending")}
                      </span>
                    </div>

                    {/* Awarding Body */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">
                        Awarding Body
                      </span>
                      <span className="font-bold text-foreground text-xs truncate max-w-[150px] text-right">
                        {cert.awardingBodyName || "Tatweer"}
                      </span>
                    </div>

                    {/* Issue Date */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">
                        Issue Date
                      </span>
                      <span className="text-emerald-500 dark:text-emerald-400 font-mono font-semibold text-xs">
                        {cert.issueDate}
                      </span>
                    </div>

                    {/* Status Dropdown */}
                    <div
                      className="flex justify-between items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-muted-foreground text-xs">
                        Status
                      </span>
                      {canEdit && onStatusChange ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={updatingId === cert.id}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize transition-colors hover:opacity-85 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                                cert.status
                                  ? CERT_STATUS_STYLES[cert.status]
                                  : "bg-muted text-muted-foreground border-border",
                              )}
                            >
                              {updatingId === cert.id ? (
                                <Loader2 className="w-3 h-3 animate-spin shrink-0 text-current" />
                              ) : null}
                              <span>{cert.status || "—"}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-card border border-border shadow-lg min-w-[130px]"
                          >
                            {CERT_STATUS_OPTIONS.filter(
                              (s) => s !== cert.status,
                            ).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                className="capitalize text-xs cursor-pointer"
                                onClick={() => handleStatusClick(cert, s)}
                              >
                                <span
                                  className={cn(
                                    "inline-block w-2 h-2 rounded-full mr-2",
                                    s === "sent" && "bg-blue-500",
                                    s === "created" && "bg-slate-400",
                                  )}
                                />
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
                            cert.status
                              ? CERT_STATUS_STYLES[cert.status]
                              : "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {cert.status || "—"}
                        </span>
                      )}
                    </div>

                    {/* Billing */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">
                        Billing
                      </span>
                      <InvoiceBadge cert={cert} />
                    </div>

                    {/* Expiry Date */}
                    <div className="flex justify-between items-center font-semibold pt-2 mt-1 border-t border-border/50">
                      <span className="text-muted-foreground font-semibold text-xs">
                        Expiry Date
                      </span>
                      <span className="text-rose-500 dark:text-rose-400 font-mono font-bold text-xs">
                        {cert.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div
                  className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canViewDetails && onViewDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-full bg-accent/80 hover:bg-accent text-foreground font-semibold text-xs border-border/60"
                      onClick={() => onViewDetails(cert)}
                    >
                      View
                    </Button>
                  )}
                  {isSuperAdmin &&
                    isTatweerCertificate(cert) &&
                    onDownloadPdf && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-full bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5"
                        onClick={() => onDownloadPdf(cert)}
                        aria-label="Download PDF Certificate"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </Button>
                    )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full shrink-0 bg-accent/80 hover:bg-accent border-border/60 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-card border border-border shadow-lg"
                    >
                      {canViewDetails && onViewDetails && (
                        <DropdownMenuItem
                          onClick={() => onViewDetails(cert)}
                          className="cursor-pointer"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {isSuperAdmin &&
                        isTatweerCertificate(cert) &&
                        onDownload && (
                          <DropdownMenuItem
                            onClick={() => onDownload(cert)}
                            className="cursor-pointer text-blue-400 font-medium"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download Word (.docx)
                          </DropdownMenuItem>
                        )}
                      {isSuperAdmin &&
                        isTatweerCertificate(cert) &&
                        onDownloadPdf && (
                          <DropdownMenuItem
                            onClick={() => onDownloadPdf(cert)}
                            className="cursor-pointer text-emerald-400 font-medium"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Download PDF (.pdf)
                          </DropdownMenuItem>
                        )}
                      {canEdit && onEdit && (
                        <DropdownMenuItem
                          onClick={() => onEdit(cert)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Record
                        </DropdownMenuItem>
                      )}
                      {canEdit && canDelete && <DropdownMenuSeparator />}
                      {canDelete && onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(cert.id)}
                          className="text-destructive cursor-pointer font-semibold"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {totalPages > 1 && onPageChange && (
        <div className="card-elevated p-4 mt-4 text-center rounded-2xl">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}

export default CertificatesGridView;
