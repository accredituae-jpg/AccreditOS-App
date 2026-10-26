import { useState, useEffect, useMemo } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { formatAED, DIRHAM_SYMBOL, cn } from "@/lib/utils";
import { Client } from "@/lib/clients";
import {
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Award,
  Building2,
  Search,
  X,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DiscountInputControl } from "../components/DiscountInputControl";
import { apiGetInvoiceTypes } from "@/lib/api";
import type { Invoice } from "../types/billing.types";
import {
  parseDateFromDDMMYYYY,
  formatDateToDDMMYYYY,
} from "../utils/billing.utils";
import { useInvoiceCertificatesQuery } from "../hooks/useInvoiceCertificatesQuery";
import { TaxMode } from "../utils/invoice-calculations";
import { getCourseShortName } from "../utils/course-abbreviation";

interface EditInvoiceDialogProps {
  invoice: Invoice | null;
  onClose: () => void;
  clients: Client[];
  onUpdate: (updatedInvoice: any) => Promise<void> | void;
}

interface InvoiceCandidateItem {
  id: string;
  lineItemId?: string;
  rawId: string;
  type: "certificate" | "training";
  participantName: string;
  course: string;
  awardingBody: string;
  certificateNumber?: string | null;
  serviceType?: string;
  unitPrice: number;
  isExisting: boolean;
}

export function EditInvoiceDialog({
  invoice,
  onClose,
  clients,
  onUpdate,
}: EditInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceTypes, setInvoiceTypes] = useState<any[]>([]);
  const [editInvoiceDate, setEditInvoiceDate] = useState<Date>();
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState<Invoice["status"]>("draft");
  const [description, setDescription] = useState("");

  // Collapsible client details
  const [showClientDetails, setShowClientDetails] = useState(false);

  const [editInvoiceForm, setEditInvoiceForm] = useState({
    client: "",
    trnNo: "",
    poBox: "",
    location: "",
    phone: "",
    mobile: "",
    referenceContact: "",
  });

  // Mode: Training/Course-based vs Manual rows
  const [mode, setMode] = useState<"training" | "manual">("training");
  const [taxMode, setTaxMode] = useState<TaxMode>("exclusive");
  const [editDiscountType, setEditDiscountType] = useState<"percentage" | "amount">("amount");
  const [editDiscountValue, setEditDiscountValue] = useState<string>("");

  // Candidates & Course Rates state
  const [candidateItems, setCandidateItems] = useState<InvoiceCandidateItem[]>(
    [],
  );
  const [courseRates, setCourseRates] = useState<Record<string, string>>({});
  const [unbilledSearch, setUnbilledSearch] = useState("");

  // Manual fallback line items
  const [manualLineItems, setManualLineItems] = useState<any[]>([]);

  useEffect(() => {
    if (invoice) {
      apiGetInvoiceTypes().then((types) => {
        setInvoiceTypes(types || []);
      });
    }
  }, [invoice]);

  // Determine effective clientId
  const effectiveClientId = useMemo(() => {
    if (invoice?.clientId) return invoice.clientId;
    const match = clients.find(
      (c) =>
        c.companyName?.trim().toLowerCase() ===
        (invoice?.client || invoice?.clientName || "").trim().toLowerCase(),
    );
    return match?.id || "";
  }, [invoice, clients]);

  // Query unbilled certificates/trainings for this client
  const { data: rawUnbilled = [], isLoading: isLoadingUnbilled } =
    useInvoiceCertificatesQuery({
      open: Boolean(invoice && effectiveClientId),
      clientId: effectiveClientId,
      serviceType: "all",
    });

  // Initialize state when invoice changes
  useEffect(() => {
    if (invoice) {
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
      setStatus(invoice.status || "draft");
      setDescription(invoice.description || "");

      setEditInvoiceForm({
        client: invoice.client || invoice.clientName || "",
        trnNo: invoice.trnNo || "",
        poBox: invoice.poBox || "",
        location: invoice.location || "",
        phone: invoice.phone || "",
        mobile: invoice.mobile || "",
        referenceContact: invoice.referenceContact || "",
      });

      setEditInvoiceDate(parseDateFromDDMMYYYY(invoice.date));
      setEditInvoiceDueDate(parseDateFromDDMMYYYY(invoice.dueDate));
      if (
        invoice.discountAmount !== undefined &&
        Number(invoice.discountAmount) > 0
      ) {
        setEditDiscountType("amount");
        setEditDiscountValue(String(Number(invoice.discountAmount)));
      } else {
        setEditDiscountType("percentage");
        setEditDiscountValue("");
      }

      // Initial tax mode (always with tax)
      setTaxMode("exclusive");

      // Mode detection
      const hasCertsOrTrainings = invoice.lineItems?.some(
        (li) =>
          li.certificateId ||
          li.trainingId ||
          li.certificateNumber ||
          li.certificate ||
          li.training,
      );
      const isTrainingTypeName =
        invoice.typeName?.toLowerCase().includes("train") ||
        invoice.typeName?.toLowerCase().includes("inspect") ||
        invoice.typeName?.toLowerCase().includes("course") ||
        invoice.typeName?.toLowerCase().includes("tatweer");

      setMode(
        hasCertsOrTrainings || isTrainingTypeName ? "training" : "manual",
      );

      // Parse candidates from invoice.lineItems
      const initialRates: Record<string, string> = {};
      const parsedCandidates: InvoiceCandidateItem[] = (
        invoice.lineItems || []
      ).map((li, idx) => {
        let participantName = "";
        let course = "";
        let awardingBody = "General";
        let certNum = li.certificateNumber || null;

        if (li.certificate) {
          participantName = li.certificate.participantName || "";
          course = li.certificate.courseName || "";
          awardingBody = li.certificate.awardingBodyName || "General";
          certNum = li.certificate.certificateNumber || certNum;
        } else if (li.training) {
          participantName = li.training.participantName || "";
          course = li.training.courseName || "";
          awardingBody = li.training.awardingBodyName || "General";
        }

        // If not found in relations, parse from item description
        if (!participantName || !course) {
          const desc = li.description || "";
          const cleanDesc = desc.replace(/^\[.*?\]\s*/, "");
          const parts = cleanDesc.split(" - ").map((p) => p.trim());
          if (parts.length >= 3) {
            if (!certNum && /^\d+$/.test(parts[0])) certNum = parts[0];
            else if (!awardingBody || awardingBody === "General")
              awardingBody = parts[0];
            participantName = parts[1];
            course = parts.slice(2).join(" - ");
          } else if (parts.length === 2) {
            participantName = parts[0];
            course = parts[1];
          } else {
            participantName = desc || `Participant ${idx + 1}`;
            course = "General Course";
          }
        }

        const groupKey = `${course}:::${awardingBody}`;
        const unitPriceNum = Number(li.unitPrice) || 0;
        if (!initialRates[groupKey] && unitPriceNum > 0) {
          initialRates[groupKey] = String(unitPriceNum);
        }

        return {
          id: li.id || `existing-${idx}`,
          lineItemId: li.id,
          rawId:
            li.certificateId || (li as any).trainingId || li.id || `raw-${idx}`,
          type: li.certificateId || certNum ? "certificate" : "training",
          participantName: participantName.replace(/\s*\[.*?\]$/, "").trim(),
          course: course.trim(),
          awardingBody: awardingBody.trim(),
          certificateNumber: certNum,
          unitPrice: unitPriceNum,
          isExisting: true,
        };
      });

      setCandidateItems(parsedCandidates);
      setCourseRates(initialRates);

      // Initialize manual line items
      if (!invoice.lineItems || invoice.lineItems.length === 0) {
        setManualLineItems([
          {
            description: invoice.description || "General Services",
            quantity: 1,
            unit: "Qty",
            unitPrice: invoice.subtotal || invoice.totalAmount || 0,
            discount: invoice.discountAmount || 0,
            vatPercent: 5.0,
            lineSubtotal: invoice.subtotal || invoice.totalAmount || 0,
            lineVat: invoice.vatAmount || 0,
            lineTotal: invoice.totalAmount || 0,
            sortOrder: 0,
          },
        ]);
      } else {
        setManualLineItems(
          invoice.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            quantity: li.quantity,
            unit: li.unit || "Qty",
            unitPrice: li.unitPrice,
            discount: li.discount || 0,
            vatPercent: li.vatPercent ?? 5.0,
            lineSubtotal: li.lineSubtotal,
            lineVat: li.lineVat,
            lineTotal: li.lineTotal,
            certificateId: li.certificateId || undefined,
            certificateNumber: li.certificateNumber || undefined,
            trainingId: (li as any).trainingId || undefined,
            sortOrder: li.sortOrder || 0,
          })),
        );
      }
    }
  }, [invoice]);

  const isOriginalDraft = invoice?.status === "draft";
  const canEditLineItems = isOriginalDraft || status === "draft";

  const statusOptions = useMemo(() => {
    const original = invoice?.status || "draft";
    if (original === "draft") {
      return [
        { value: "draft", label: "Draft" },
        { value: "issued", label: "Sent / Issued" },
        { value: "cancelled", label: "Cancelled" },
      ];
    }
    if (original === "issued") {
      return [
        { value: "issued", label: "Sent / Issued" },
        { value: "cancelled", label: "Cancelled" },
      ];
    }
    if (original === "partially_paid") {
      return [{ value: "partially_paid", label: "Partially Paid" }];
    }
    if (original === "paid") {
      return [{ value: "paid", label: "Paid" }];
    }
    return [{ value: "cancelled", label: "Cancelled" }];
  }, [invoice?.status]);

  // Pricing groups for training mode: Group by Course & Awarding Body
  const pricingGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        course: string;
        awardingBody: string;
        count: number;
      }
    >();

    candidateItems.forEach((cand) => {
      const body = cand.awardingBody || "General";
      const key = `${cand.course}:::${body}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          course: cand.course,
          awardingBody: body,
          count: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [candidateItems]);

  // Handle course rate edit
  const handleRateChange = (key: string, val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, "");
    setCourseRates((prev) => ({ ...prev, [key]: sanitized }));
  };

  // Remove individual candidate / training item
  const handleRemoveCandidate = (candidateId: string) => {
    setCandidateItems((prev) => prev.filter((c) => c.id !== candidateId));
  };

  // Add an unbilled training / certificate to the invoice
  const handleAddUnbilled = (unbilledItem: any) => {
    const rawId = String(unbilledItem.rawId || unbilledItem.id);
    const course =
      unbilledItem.course || unbilledItem.courseName || "General Course";
    const awardingBody =
      unbilledItem.awardingBody || unbilledItem.awardingBodyName || "General";
    const groupKey = `${course}:::${awardingBody}`;

    const newCandidate: InvoiceCandidateItem = {
      id: `new-${rawId}-${Date.now()}`,
      rawId,
      type: unbilledItem.itemType === "training" ? "training" : "certificate",
      participantName: unbilledItem.participantName || "Participant",
      course,
      awardingBody,
      certificateNumber: unbilledItem.certificateNumber || null,
      serviceType: unbilledItem.serviceType || "training",
      unitPrice: parseFloat(courseRates[groupKey] || "0") || 0,
      isExisting: false,
    };

    setCandidateItems((prev) => [...prev, newCandidate]);
  };

  // Filter available unbilled items
  const existingRawIds = useMemo(() => {
    return new Set(candidateItems.map((c) => String(c.rawId)));
  }, [candidateItems]);

  const availableUnbilled = useMemo(() => {
    return (rawUnbilled || []).filter((u: any) => {
      const rawId = String(u.rawId || u.id);
      return !existingRawIds.has(rawId);
    });
  }, [rawUnbilled, existingRawIds]);

  const filteredUnbilled = useMemo(() => {
    if (!unbilledSearch.trim()) return availableUnbilled;
    const q = unbilledSearch.toLowerCase();
    return availableUnbilled.filter((u: any) => {
      const pName = (u.participantName || "").toLowerCase();
      const cName = (u.course || u.courseName || "").toLowerCase();
      const body = (u.awardingBody || u.awardingBodyName || "").toLowerCase();
      const certNum = (u.certificateNumber || "").toLowerCase();
      return (
        pName.includes(q) ||
        cName.includes(q) ||
        body.includes(q) ||
        certNum.includes(q)
      );
    });
  }, [availableUnbilled, unbilledSearch]);

  // Calculate training line items and totals
  const calculatedTrainingLineItems = useMemo(() => {
    return candidateItems.map((cand, index) => {
      const groupKey = `${cand.course}:::${cand.awardingBody || "General"}`;
      const rawRate =
        parseFloat(courseRates[groupKey] ?? courseRates[cand.course]) ||
        cand.unitPrice ||
        0;

      let unitPrice = rawRate;
      let vatPercent = 5.0;
      let lineSubtotal = rawRate;
      let lineVat = 0;
      let lineTotal = rawRate;

      if (taxMode === "inclusive") {
        vatPercent = 5.0;
        unitPrice = Number((rawRate / 1.05).toFixed(2));
        lineSubtotal = unitPrice;
        lineVat = Number((rawRate - unitPrice).toFixed(2));
        lineTotal = rawRate;
      } else {
        // Exclusive: 5% VAT on top
        vatPercent = 5.0;
        unitPrice = rawRate;
        lineSubtotal = rawRate;
        lineVat = Number((rawRate * 0.05).toFixed(2));
        lineTotal = Number((rawRate + lineVat).toFixed(2));
      }

      const certNum = cand.certificateNumber
        ? cand.certificateNumber.match(/\d+/)?.[0] || cand.certificateNumber
        : null;
      const descPrefix = certNum ? `${certNum} - ` : "";

      const isCert = cand.type === "certificate";
      const courseShort = getCourseShortName(cand.course);
      return {
        id: cand.lineItemId,
        description: `${descPrefix}${cand.participantName} - ${courseShort}`,
        quantity: 1,
        unit: isCert ? "Cert" : "Session",
        unitPrice,
        discount: 0,
        vatPercent,
        lineSubtotal,
        lineVat,
        lineTotal,
        certificateId: isCert ? cand.rawId : null,
        trainingId: !isCert ? cand.rawId : null,
        sortOrder: index,
      };
    });
  }, [candidateItems, courseRates, taxMode]);

  const trainingTotals = useMemo(() => {
    let subtotal = 0;
    let totalVat = 0;
    let total = 0;

    calculatedTrainingLineItems.forEach((li) => {
      subtotal += li.lineSubtotal;
      totalVat += li.lineVat;
      total += li.lineTotal;
    });

    const parsedVal = parseFloat(editDiscountValue) || 0;
    let disc = 0;
    let discRate = 0;

    if (parsedVal > 0 && subtotal > 0) {
      if (editDiscountType === "percentage") {
        const pct = Math.min(100, Math.max(0, parsedVal));
        discRate = pct;
        disc = (subtotal * pct) / 100;
      } else {
        disc = Math.min(subtotal, Math.max(0, parsedVal));
        discRate =
          subtotal > 0 ? Number(((disc / subtotal) * 100).toFixed(2)) : 0;
      }
    }

    const finalTotal = Math.max(0, Math.round((total - disc) * 100) / 100);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(disc * 100) / 100,
      discountRate: discRate,
      discountType: editDiscountType,
      vatAmount: Math.round(totalVat * 100) / 100,
      total: finalTotal,
    };
  }, [calculatedTrainingLineItems, editDiscountValue, editDiscountType]);

  // Manual Line Items calculations
  const manualTotals = useMemo(() => {
    let subtotal = 0;
    let totalLineDiscount = 0;
    let totalVat = 0;

    manualLineItems.forEach((li) => {
      const qty = parseFloat(li.quantity) || 0;
      const price = parseFloat(li.unitPrice) || 0;
      const disc = parseFloat(li.discount) || 0;
      const vat = parseFloat(li.vatPercent) || 0;

      const lineSub = qty * price;
      const lineVat = (lineSub - disc) * (vat / 100);

      subtotal += lineSub;
      totalLineDiscount += disc;
      totalVat += lineVat;
    });

    const parsedVal = parseFloat(editDiscountValue) || 0;
    let globalDisc = 0;
    let discRate = 0;

    if (parsedVal > 0 && subtotal > 0) {
      if (editDiscountType === "percentage") {
        const pct = Math.min(100, Math.max(0, parsedVal));
        discRate = pct;
        globalDisc = (subtotal * pct) / 100;
      } else {
        globalDisc = Math.min(subtotal, Math.max(0, parsedVal));
        discRate =
          subtotal > 0
            ? Number(((globalDisc / subtotal) * 100).toFixed(2))
            : 0;
      }
    }

    const netDiscount = totalLineDiscount + globalDisc;
    const finalTotal = Math.max(
      0,
      Math.round((subtotal - netDiscount + totalVat) * 100) / 100,
    );

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(netDiscount * 100) / 100,
      globalDiscount: Math.round(globalDisc * 100) / 100,
      discountRate: discRate,
      discountType: editDiscountType,
      vatAmount: Math.round(totalVat * 100) / 100,
      total: finalTotal,
    };
  }, [manualLineItems, editDiscountValue, editDiscountType]);

  const handleManualLineItemChange = (
    index: number,
    field: string,
    val: any,
  ) => {
    setManualLineItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextItem = { ...item, [field]: val };
        const qty = parseFloat(nextItem.quantity) || 0;
        const price = parseFloat(nextItem.unitPrice) || 0;
        const disc = parseFloat(nextItem.discount) || 0;
        const vat = parseFloat(nextItem.vatPercent) || 0;

        const lineSub = qty * price;
        const lineVat = (lineSub - disc) * (vat / 100);

        return {
          ...nextItem,
          lineSubtotal: lineSub,
          lineVat,
          lineTotal: lineSub - disc + lineVat,
        };
      }),
    );
  };

  const activeTotals = mode === "training" ? trainingTotals : manualTotals;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      const discVal =
        activeTotals.discount > 0
          ? activeTotals.discount
          : parseFloat(editDiscountValue) || 0;
      const payload: any = {
        ...invoice,
        status,
        date: editInvoiceDate
          ? formatDateToDDMMYYYY(editInvoiceDate)
          : invoice.date,
        dueDate: editInvoiceDueDate
          ? formatDateToDDMMYYYY(editInvoiceDueDate)
          : "",
        description,
        notes,
        terms,
        trnNo: editInvoiceForm.trnNo,
        poBox: editInvoiceForm.poBox,
        location: editInvoiceForm.location,
        phone: editInvoiceForm.phone,
        mobile: editInvoiceForm.mobile,
        referenceContact: editInvoiceForm.referenceContact,
        discount: discVal,
        discountAmount: discVal,
      };

      if (canEditLineItems) {
        if (mode === "training") {
          payload.amount = trainingTotals.subtotal;
          payload.subtotal = trainingTotals.subtotal;
          payload.discount = trainingTotals.discount;
          payload.discountAmount = trainingTotals.discount;
          payload.vatAmount = trainingTotals.vatAmount;
          payload.total = trainingTotals.total;
          payload.totalAmount = trainingTotals.total;
          payload.lineItems = calculatedTrainingLineItems;
        } else {
          payload.amount = manualTotals.subtotal;
          payload.subtotal = manualTotals.subtotal;
          payload.discount = manualTotals.discount;
          payload.discountAmount = manualTotals.discount;
          payload.vatAmount = manualTotals.vatAmount;
          payload.total = manualTotals.total;
          payload.totalAmount = manualTotals.total;
          payload.lineItems = manualLineItems.map((li, index) => ({
            id: li.id,
            description: li.description,
            quantity: parseFloat(li.quantity) || 1,
            unit: li.unit || "Qty",
            unitPrice: parseFloat(li.unitPrice) || 0,
            discount: parseFloat(li.discount) || 0,
            vatPercent: parseFloat(li.vatPercent) || 5.0,
            lineSubtotal: li.lineSubtotal,
            lineVat: li.lineVat,
            lineTotal: li.lineTotal,
            certificateId: li.certificateId || null,
            trainingId: li.trainingId || null,
            sortOrder: index,
          }));
        }
      }

      await onUpdate(payload);
      onClose();
    } catch (err) {
      console.error("Error updating invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={!!invoice}
      onCloseAttempt={onClose}
      title={`Edit Tax Invoice ${invoice ? `(${invoice.invoiceNumber})` : ""}`}
      description="Modify course rates, remove or add trainings, and review invoice totals on a single page."
      icon={FileText}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* 1. COMPACT CLIENT HEADER WITH EXPAND/COLLAPSE BUTTON */}
        <div className="p-3 rounded-xl border border-border/70 bg-muted/15 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-sm text-foreground truncate block">
                  {editInvoiceForm.client || "Client"}
                </span>
                {invoice?.typeName && (
                  <span className="text-[10px] text-muted-foreground block">
                    Type: {invoice.typeName}
                  </span>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowClientDetails((prev) => !prev)}
              className="h-7 text-xs px-2.5 gap-1.5 self-start sm:self-auto font-medium"
            >
              <span>
                {showClientDetails
                  ? "Hide Client Details"
                  : "View / Edit Client Details"}
              </span>
              {showClientDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* HIDDEN CLIENT DETAILS (Opens only on button click) */}
          {showClientDetails && (
            <div className="pt-3 mt-1 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in-50 duration-150">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  TRN Number
                </Label>
                <Input
                  value={editInvoiceForm.trnNo}
                  onChange={(e) =>
                    setEditInvoiceForm((prev) => ({
                      ...prev,
                      trnNo: e.target.value,
                    }))
                  }
                  disabled={!canEditLineItems}
                  placeholder="TRN..."
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Location
                </Label>
                <Input
                  value={editInvoiceForm.location}
                  onChange={(e) =>
                    setEditInvoiceForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  disabled={!canEditLineItems}
                  placeholder="e.g. Dubai, UAE"
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  PO Box
                </Label>
                <Input
                  value={editInvoiceForm.poBox}
                  onChange={(e) =>
                    setEditInvoiceForm((prev) => ({
                      ...prev,
                      poBox: e.target.value,
                    }))
                  }
                  disabled={!canEditLineItems}
                  placeholder="PO Box..."
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Phone / Mobile
                </Label>
                <Input
                  value={editInvoiceForm.phone || editInvoiceForm.mobile}
                  onChange={(e) =>
                    setEditInvoiceForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                      mobile: e.target.value,
                    }))
                  }
                  disabled={!canEditLineItems}
                  placeholder="+971..."
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-muted-foreground">
                  Attention / Reference Contact
                </Label>
                <Input
                  value={editInvoiceForm.referenceContact}
                  onChange={(e) =>
                    setEditInvoiceForm((prev) => ({
                      ...prev,
                      referenceContact: e.target.value,
                    }))
                  }
                  disabled={!canEditLineItems}
                  placeholder="Attn / Contact person"
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. MODE SWITCHER & TAX CONTROLS TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          {/* Mode Switchers: Course & Trainings (X) vs Manual Rows (Y) */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => setMode("training")}
              className={cn(
                "px-3 py-1 rounded-md text-[11px] font-semibold transition-colors",
                mode === "training"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Course & Trainings ({candidateItems.length})
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={cn(
                "px-3 py-1 rounded-md text-[11px] font-semibold transition-colors",
                mode === "manual"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Manual Rows ({manualLineItems.length})
            </button>
          </div>

          {/* Tax Modes: +5% VAT, Tax Inc. */}
          {mode === "training" && (
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-[11px] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTaxMode("exclusive")}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-semibold transition-colors",
                  taxMode === "exclusive"
                    ? "bg-background text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                +5% VAT
              </button>
              <button
                type="button"
                onClick={() => setTaxMode("inclusive")}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-semibold transition-colors",
                  taxMode === "inclusive"
                    ? "bg-background text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Tax Inc.
              </button>
            </div>
          )}
        </div>

        {!canEditLineItems && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This invoice is in <strong>{status.toUpperCase()}</strong> status.
              Line items cannot be modified. Revert status to{" "}
              <strong>Draft</strong> below to make changes.
            </span>
          </div>
        )}

        {/* 3. MAIN TRAINING FLOW ON SINGLE PAGE */}
        {mode === "training" ? (
          <div className="space-y-4">
            {/* A. WHOLE EXISTING SELECTED TRAININGS (WITH REMOVE OPTION) */}
            <div className="border border-border/70 rounded-xl p-3.5 bg-muted/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Selected Trainings on Invoice ({candidateItems.length})
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Click trash icon to remove any training
                </span>
              </div>

              {candidateItems.length > 0 ? (
                <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5">
                  {candidateItems.map((cand) => {
                    const groupKey = `${cand.course}:::${cand.awardingBody || "General"}`;
                    const currentRate =
                      courseRates[groupKey] ??
                      courseRates[cand.course] ??
                      cand.unitPrice;

                    return (
                      <div
                        key={cand.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {cand.participantName}
                          </span>
                          {cand.certificateNumber && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 font-mono text-primary bg-primary/5 border-primary/20 shrink-0"
                            >
                              <Award className="w-2.5 h-2.5 mr-0.5" />#
                              {cand.certificateNumber}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                            • {cand.course} ({cand.awardingBody})
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {formatAED(Number(currentRate) || 0)}
                          </span>

                          {cand.isExisting ? (
                            <span className="text-[9px] text-muted-foreground font-medium px-1.5 py-0.5 bg-muted rounded border border-border/40">
                              Billed
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                              New
                            </span>
                          )}

                          {canEditLineItems && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCandidate(cand.id)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md"
                              title="Remove training from invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  No trainings currently attached to this invoice. Add
                  candidates from the list below.
                </p>
              )}
            </div>

            {/* B. EACH COURSE AND ITS AMOUNT (RATE EDIT OPTION) */}
            {pricingGroups.length > 0 && (
              <div className="border border-primary/20 rounded-xl p-3.5 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Courses & Rates ({pricingGroups.length} Course
                    {pricingGroups.length > 1 ? "s" : ""})
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Edit rate below to update all candidates in that course
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pricingGroups.map((grp) => {
                    const rate = courseRates[grp.key] || "";
                    const rawRate = parseFloat(rate) || 0;
                    const groupTotal =
                      taxMode === "exclusive"
                        ? grp.count * Number((rawRate * 1.05).toFixed(2))
                        : grp.count * rawRate;

                    return (
                      <div
                        key={grp.key}
                        className="p-3 rounded-xl border border-border/60 bg-background/90 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {grp.course}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {grp.awardingBody} • {grp.count} candidate
                              {grp.count > 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30 shrink-0"
                          >
                            {grp.count} {grp.count > 1 ? "certs" : "cert"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              {DIRHAM_SYMBOL}
                            </span>
                            <Input
                              type="text"
                              value={rate}
                              onChange={(e) =>
                                handleRateChange(grp.key, e.target.value)
                              }
                              placeholder="Rate / cand."
                              disabled={!canEditLineItems}
                              className="h-7 text-xs w-24 font-mono font-bold bg-background text-right"
                              required
                            />
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-primary">
                              {formatAED(groupTotal)}
                            </span>
                            <p className="text-[9px] text-muted-foreground leading-none">
                              {taxMode === "exclusive"
                                ? "+5% VAT"
                                : "Tax Included"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C. ADD UNINVOICED TRAININGS OPTION */}
            {canEditLineItems && (
              <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Add Uninvoiced Trainings for Client
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-primary/10 text-primary border-primary/30"
                    >
                      {availableUnbilled.length} Available
                    </Badge>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={unbilledSearch}
                    onChange={(e) => setUnbilledSearch(e.target.value)}
                    placeholder="Search candidate name, certificate #, or course..."
                    className="h-8 pl-8 pr-8 text-xs bg-background"
                  />
                  {unbilledSearch && (
                    <button
                      type="button"
                      onClick={() => setUnbilledSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* List of Available Uninvoiced Items */}
                {isLoadingUnbilled ? (
                  <div className="space-y-1.5 py-1">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : filteredUnbilled.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto pr-1 space-y-1.5">
                    {filteredUnbilled.map((item: any) => {
                      const rawId = String(item.rawId || item.id);
                      const certNum = item.certificateNumber
                        ? item.certificateNumber.match(/\d+/)?.[0] ||
                          item.certificateNumber
                        : null;
                      const body = (
                        item.awardingBody ||
                        item.awardingBodyName ||
                        ""
                      ).trim();

                      return (
                        <div
                          key={rawId}
                          className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background hover:border-primary/40 transition-colors text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {item.participantName}
                              </span>
                              {certNum && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1 font-mono text-primary bg-primary/5 border-primary/20"
                                >
                                  #{certNum}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.course || item.courseName} •{" "}
                              {body || "General"}
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddUnbilled(item)}
                            className="h-7 text-xs px-2.5 gap-1 shrink-0 font-semibold"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    {unbilledSearch
                      ? `No unbilled trainings match "${unbilledSearch}"`
                      : "No unbilled trainings currently available for this client."}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* MANUAL LINE ITEMS VIEW */
          <div className="border border-border/70 rounded-xl p-4 bg-muted/10 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Manual Line Items ({manualLineItems.length})
              </p>
              {canEditLineItems && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setManualLineItems((prev) => [
                      ...prev,
                      {
                        description: "",
                        quantity: 1,
                        unit: "Qty",
                        unitPrice: 0,
                        discount: 0,
                        vatPercent: 5.0,
                        lineSubtotal: 0,
                        lineVat: 0,
                        lineTotal: 0,
                      },
                    ])
                  }
                  className="h-7 text-xs px-2.5 gap-1.5 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {manualLineItems.map((li, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <div className="col-span-5 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Description
                    </Label>
                    <Input
                      value={li.description}
                      onChange={(e) =>
                        handleManualLineItemChange(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Item description"
                      className="h-8 text-xs bg-background"
                      required
                      disabled={!canEditLineItems}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Qty
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={li.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        handleManualLineItemChange(index, "quantity", val);
                      }}
                      className="h-8 text-xs bg-background"
                      required
                      disabled={!canEditLineItems}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Rate (AED)
                    </Label>
                    <Input
                      type="text"
                      value={li.unitPrice}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        handleManualLineItemChange(index, "unitPrice", val);
                      }}
                      className="h-8 text-xs bg-background"
                      required
                      disabled={!canEditLineItems}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      VAT %
                    </Label>
                    <Input
                      type="text"
                      value={li.vatPercent}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        handleManualLineItemChange(index, "vatPercent", val);
                      }}
                      className="h-8 text-xs bg-background"
                      disabled={!canEditLineItems}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={
                        !canEditLineItems || manualLineItems.length === 1
                      }
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() =>
                        setManualLineItems((prev) =>
                          prev.filter((_, idx) => idx !== index),
                        )
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DATES, STATUS, NOTES & TERMS BELOW IT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Issue Date</Label>
            <CustomCalendar
              value={editInvoiceDate}
              onChange={setEditInvoiceDate}
              placeholder="Select issue date"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Due Date</Label>
            <CustomCalendar
              value={editInvoiceDueDate}
              onChange={setEditInvoiceDueDate}
              placeholder="Select due date"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold">Invoice Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bank details or general notes"
              className="h-8 text-xs bg-background"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Payment Terms</Label>
            <Input
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. Net 30 days, Cash on Delivery"
              className="h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Discount Control */}
        <DiscountInputControl
          discountType={editDiscountType}
          discountValue={editDiscountValue}
          onDiscountTypeChange={setEditDiscountType}
          onDiscountValueChange={setEditDiscountValue}
          subtotal={activeTotals.subtotal}
          disabled={!canEditLineItems}
        />

        {/* 5. TOTALS SUMMARY */}
        {activeTotals.subtotal > 0 && (
          <div className="border-t border-border pt-3 space-y-1 text-sm font-medium">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Gross Subtotal:</span>
              <span className="font-mono">
                {formatAED(activeTotals.subtotal)}
              </span>
            </div>
            {activeTotals.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span>
                  Discount
                  {(activeTotals as any).discountRate
                    ? ` (${(activeTotals as any).discountRate}%)`
                    : ""}:
                </span>
                <span className="font-mono">
                  -{formatAED(activeTotals.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>VAT (5%):</span>
              <span className="font-mono">
                {formatAED(activeTotals.vatAmount)}
              </span>
            </div>
            <div className="flex justify-between text-foreground font-bold text-base border-t border-border pt-1.5">
              <span>Total Amount (Inc. VAT):</span>
              <span className="font-mono text-primary font-bold">
                {formatAED(activeTotals.total)}
              </span>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
