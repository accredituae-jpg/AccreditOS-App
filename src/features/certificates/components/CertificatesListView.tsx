import { useState, memo } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  FileText,
  Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { isTatweerCertificate } from "../utils/generateWordCertificate";
import { getActiveRole } from "@/lib/permissions";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const CERT_STATUS_OPTIONS = [
  "created",
  "sent",
] as const;

const CERT_STATUS_STYLES: Record<string, string> = {
  created: "text-slate-500 hover:text-slate-600",
  sent: "text-blue-500 hover:text-blue-600",
  printed: "text-amber-500 hover:text-amber-600",
  distributed: "text-green-500 hover:text-green-600",
};

interface CertificatesListViewProps {
  paginatedCertificates?: Certificate[];
  certificates?: Certificate[];
  selectedCertificateIds?: string[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAllPage?: (ids: string[]) => void;
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

export const CertificatesListView = memo(function CertificatesListView(props: CertificatesListViewProps) {
  const {
    paginatedCertificates: rawPaginated,
    certificates: rawCerts,
    selectedCertificateIds: rawSelected,
    selectedIds: rawSelectedIds,
    selectionMode = false,
    onToggleSelect,
    onSelectAllPage,
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
    totalItems = 0,
    loading = false,
    onPageChange,
  } = props;

  const paginatedCertificates = rawPaginated || rawCerts || [];
  const selectedCertificateIds = rawSelected || rawSelectedIds || [];
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

  const allPageSelected =
    paginatedCertificates.length > 0 &&
    paginatedCertificates.every((c) => selectedCertificateIds.includes(c.id));

  const handleHeaderCheckboxChange = (checked: boolean) => {
    if (!onSelectAllPage) return;
    if (checked) {
      onSelectAllPage(paginatedCertificates.map((c) => c.id));
    } else {
      onSelectAllPage([]);
    }
  };

  return (
    <div className="card-elevated overflow-hidden border border-border/40">
      <div className="overflow-x-auto">
        <table
          className={cn(
            "data-table",
            updatingId && "pointer-events-none opacity-80",
          )}
        >
          <thead>
            <tr>
              {selectionMode && onToggleSelect && (
                <th className="w-10 text-center">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={handleHeaderCheckboxChange}
                    aria-label="Select all on page"
                  />
                </th>
              )}
              <th>Certificate</th>
              <th>Participant & Course</th>
              <th>Validity Dates</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Billing</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-cert-${i}`}>
                  {selectionMode && onToggleSelect && (
                    <td>
                      <Skeleton className="w-4 h-4 mx-auto" />
                    </td>
                  )}
                  <td>
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-36 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto rounded-lg" />
                  </td>
                </tr>
              ))
            ) : paginatedCertificates.length === 0 ? (
              <tr>
                <td
                  colSpan={selectionMode && onToggleSelect ? 8 : 7}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No certificates found.
                </td>
              </tr>
            ) : (
              paginatedCertificates.map((cert, index) => {
                const isSelected = selectedCertificateIds.includes(cert.id);
                return (
                  <tr
                    key={cert.id}
                    className={cn(
                      "transition-colors duration-150 hover:bg-muted/40",
                      isSelected && "bg-primary/5 hover:bg-primary/10",
                    )}
                    onClick={() => {
                      if (selectionMode && onToggleSelect) {
                        onToggleSelect(cert.id);
                      }
                    }}
                  >
                    {selectionMode && onToggleSelect && (
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect(cert.id)}
                          aria-label={`Select certificate ${cert.certificateNumber}`}
                        />
                      </td>
                    )}
                    <td className="font-mono text-sm font-semibold text-primary">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>
                          {cert.certificateNumber ||
                            cert.awardingBodyName ||
                            "Pending"}
                        </span>
                        {cert.serviceType === "inspection" && (
                          <span className="text-[10px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded font-semibold leading-none font-sans">
                            Inspection
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-foreground">
                        {cert.participantName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cert.course}
                      </div>
                    </td>
                    <td className="text-xs font-semibold whitespace-nowrap">
                      <div className="text-emerald-600 dark:text-emerald-400">
                        {cert.issueDate}
                      </div>
                      <div className="text-rose-600 dark:text-rose-400 mt-0.5">
                        {cert.expiryDate}
                      </div>
                    </td>
                    <td>
                      <RenewalBadge cert={cert} />
                    </td>
                    <td>
                      {canEdit && onStatusChange ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={updatingId === cert.id}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
                                CERT_STATUS_STYLES[cert.status] ||
                                  "text-muted-foreground border-border",
                              )}
                            >
                              {updatingId === cert.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                              )}
                              <span className="capitalize">{cert.status}</span>
                              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-36">
                            {CERT_STATUS_OPTIONS.map((st) => (
                              <DropdownMenuItem
                                key={st}
                                onClick={() => handleStatusClick(cert, st)}
                                className={cn(
                                  "capitalize cursor-pointer text-xs font-medium",
                                  cert.status === st && "bg-accent font-bold",
                                )}
                              >
                                {st}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize",
                            CERT_STATUS_STYLES[cert.status] ||
                              "text-muted-foreground border-border",
                          )}
                        >
                          <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                          {cert.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <InvoiceBadge cert={cert} />
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canViewDetails && (
                            <DropdownMenuItem
                              onClick={() => onViewDetails(cert)}
                              className="cursor-pointer"
                            >
                              <Award className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {isSuperAdmin &&
                            isTatweerCertificate(cert) &&
                            onDownload && (
                              <DropdownMenuItem
                                onClick={() => onDownload(cert)}
                                className="cursor-pointer text-blue-600 font-medium"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Word (.docx)
                              </DropdownMenuItem>
                            )}
                          {isSuperAdmin &&
                            isTatweerCertificate(cert) &&
                            onDownloadPdf && (
                              <DropdownMenuItem
                                onClick={() => onDownloadPdf(cert)}
                                className="cursor-pointer text-emerald-600 font-medium"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                PDF (.pdf)
                              </DropdownMenuItem>
                            )}
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => onEdit(cert)}
                              className="cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canEdit && canDelete && <DropdownMenuSeparator />}
                          {canDelete && (
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages >= 1 && (
        <div className="p-3 border-t border-border bg-card/20">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            isLoading={loading}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
});
export default CertificatesListView;
