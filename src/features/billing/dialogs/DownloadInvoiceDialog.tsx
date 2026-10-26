import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Printer,
  FileText,
  ListFilter,
  GraduationCap,
  Users,
  Stamp,
  Award,
  CheckCircle2,
  FileCheck,
  Eye,
} from "lucide-react";
import { cn, formatAED } from "@/lib/utils";
import type { Invoice } from "../types/billing.types";
import {
  InvoiceItemGrouping,
  getInvoiceClientDisplayName,
  getInvoiceItems,
} from "../utils/billing.utils";

interface DownloadInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (options: {
    groupBy: InvoiceItemGrouping;
    showSeal: boolean;
    showAwardingBody: boolean;
  }) => void;
  onPrint?: (options: {
    groupBy: InvoiceItemGrouping;
    showSeal: boolean;
    showAwardingBody: boolean;
  }) => void;
  onPreview?: (invoice: Invoice) => void;
  isDownloading?: boolean;
}

export function DownloadInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  onDownload,
  onPrint,
  onPreview,
  isDownloading = false,
}: DownloadInvoiceDialogProps) {
  const [groupBy, setGroupBy] = useState<InvoiceItemGrouping>("itemized");
  const [showSeal, setShowSeal] = useState<boolean>(true);
  const [showAwardingBody, setShowAwardingBody] = useState<boolean>(false);

  const clientName = useMemo(() => {
    return invoice ? getInvoiceClientDisplayName(invoice) : "";
  }, [invoice]);

  const rawItemCount = invoice?.lineItems?.length || 0;

  const itemizedCount = useMemo(() => {
    if (!invoice) return 0;
    return getInvoiceItems(invoice, { groupBy: "itemized" }).length;
  }, [invoice]);

  const courseCount = useMemo(() => {
    if (!invoice) return 0;
    return getInvoiceItems(invoice, { groupBy: "course" }).length;
  }, [invoice]);

  const participantCount = useMemo(() => {
    if (!invoice) return 0;
    return getInvoiceItems(invoice, { groupBy: "participant" }).length;
  }, [invoice]);

  const hasMultipleItems = rawItemCount > 1;

  if (!invoice) return null;

  const handleDownload = () => {
    onDownload({
      groupBy,
      showSeal,
      showAwardingBody,
    });
    onOpenChange(false);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint({
        groupBy,
        showSeal,
        showAwardingBody,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Download Tax Invoice
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {invoice.invoiceNumber || "Draft"} • {clientName || "Client"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Section 1: Line Item Format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Line Item Format
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Choose how items appear on the PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Itemized */}
              <button
                type="button"
                onClick={() => setGroupBy("itemized")}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between relative",
                  groupBy === "itemized"
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ListFilter className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">Itemized</span>
                </div>
                <p className="text-[10px] leading-tight opacity-80 mb-2">
                  1 row per certificate
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "self-start text-[9px] px-1.5 py-0 font-mono",
                    groupBy === "itemized"
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {itemizedCount} lines
                </Badge>
              </button>

              {/* By Course */}
              <button
                type="button"
                onClick={() => setGroupBy("course")}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between relative",
                  groupBy === "course"
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">By Course</span>
                </div>
                <p className="text-[10px] leading-tight opacity-80 mb-2">
                  Matches client LPO
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "self-start text-[9px] px-1.5 py-0 font-mono",
                    groupBy === "course"
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {courseCount} courses
                </Badge>
              </button>

              {/* By Person */}
              <button
                type="button"
                onClick={() => setGroupBy("participant")}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between relative",
                  groupBy === "participant"
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs">By Person</span>
                </div>
                <p className="text-[10px] leading-tight opacity-80 mb-2">
                  Grouped per candidate
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "self-start text-[9px] px-1.5 py-0 font-mono",
                    groupBy === "participant"
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {participantCount} candidates
                </Badge>
              </button>
            </div>
          </div>

          {/* Section 2: Seal & Signature Option */}
          <div className="space-y-2 pt-1 border-t border-border/70">
            <Label className="text-xs font-semibold text-foreground block">
              Official Seal & Signature
            </Label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowSeal(true)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5",
                  showSeal
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-primary" />
                    With Seal
                  </span>
                  {showSeal && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Digital stamp & signature for electronic copy / email.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShowSeal(false)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5",
                  !showSeal
                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-xs ring-1 ring-amber-500/30"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Without Seal
                  </span>
                  {!showSeal && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Blank space for physical ink-stamping and pen signature.
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Extra Options */}
          <div className="pt-2 border-t border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-muted-foreground" />
              <Label
                htmlFor="download-awarding-toggle"
                className="text-xs font-medium cursor-pointer"
              >
                Include Awarding Body (NSC / HABC)
              </Label>
            </div>
            <Switch
              id="download-awarding-toggle"
              checked={showAwardingBody}
              onCheckedChange={setShowAwardingBody}
              className="scale-90 data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/70 mt-2 gap-2 flex-wrap">
          <div>
            {onPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onPreview(invoice);
                }}
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground px-2.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Full Preview</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs gap-1.5 border-border hover:bg-muted font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 text-xs gap-1.5 bg-[#004ba0] hover:bg-[#003c80] text-white font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
