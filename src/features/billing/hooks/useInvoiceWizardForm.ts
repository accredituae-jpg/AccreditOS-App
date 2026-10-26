import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetInvoiceTypes, apiGetNextInvoiceNumber } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { Client } from "@/lib/clients";
import {
  BillingType,
  CustomerFormState,
  InvoiceItemGrouping,
  InvoiceWizardFormContext,
  PricingGroup,
  WizardStep,
} from "../types/invoice-wizard.types";
import {
  BillableCertificateItem,
  calculateInvoice,
  ManualLineItem,
  TaxMode,
} from "../utils/invoice-calculations";
import { useInvoiceCertificatesQuery } from "./useInvoiceCertificatesQuery";
import {
  getClientCourseRate,
  isInspectionOrSupervisorCourse,
} from "@/features/clients/utils/courseRates.utils";
import { apiUpdateClientCourseRates } from "@/lib/api/clientApi";
import { getCourseShortName } from "../utils/course-abbreviation";

interface UseInvoiceWizardFormOptions {
  open: boolean;
  clients: Client[];
}

export function useInvoiceWizardForm({
  open,
  clients,
}: UseInvoiceWizardFormOptions): InvoiceWizardFormContext & {
  canProceedToStep2: boolean;
  canProceedToStep3: boolean;
  resetForm: () => void;
  getSubmissionPayload: () => any;
  syncRatesToClient: () => Promise<void>;
} {
  const [step, setStep] = useState<WizardStep>(1);
  const [billingType, setBillingType] = useState<BillingType>("company");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [taxMode, setTaxMode] = useState<TaxMode>("exclusive");
  const [saveRatesToClient, setSaveRatesToClient] = useState(true);

  const [customerForm, setCustomerForm] = useState<CustomerFormState>({
    client: "",
    trnNo: "",
    poBox: "",
    location: "",
    phone: "",
    mobile: "",
    referenceContact: "",
  });

  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [certSearchQuery, setCertSearchQuery] = useState<string>("");
  const [courseRates, setCourseRates] = useState<Record<string, string>>({});

  const [manualLineItems, setManualLineItems] = useState<ManualLineItem[]>([
    {
      description: "",
      quantity: 1,
      unit: "Qty",
      unitPrice: 0,
      discount: 0,
      vatPercent: 5.0,
    },
  ]);

  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [groupingMode, setGroupingMode] = useState<InvoiceItemGrouping>("itemized");

  // Next Invoice Number Query
  const { data: nextNumData } = useQuery({
    queryKey: qk.nextInvoiceNumber,
    queryFn: async () => {
      const res: any = await apiGetNextInvoiceNumber();
      return res?.data?.nextNumber || res?.nextNumber || "INV-XXXX";
    },
    enabled: open,
    staleTime: 30 * 1000,
  });
  const nextInvoiceNum = nextNumData || "INV-XXXX";

  // Invoice Types Query
  const { data: invoiceTypes = [] } = useQuery({
    queryKey: qk.invoiceTypes,
    queryFn: async () => {
      const types = await apiGetInvoiceTypes();
      return types.filter((t: any) => t.isActive);
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Automatically select Training type if available
  useEffect(() => {
    if (open && invoiceTypes.length > 0 && !selectedTypeId) {
      const training = invoiceTypes.find((t: any) =>
        t.name.toLowerCase().includes("training")
      );
      setSelectedTypeId(training ? training.id : invoiceTypes[0].id);
    }
  }, [open, invoiceTypes, selectedTypeId]);

  const selectedTypeObj = useMemo(
    () => invoiceTypes.find((t: any) => t.id === selectedTypeId),
    [invoiceTypes, selectedTypeId]
  );
  const selectedTypeName = (selectedTypeObj?.name || "").toLowerCase();
  // Unbilled services picker supports both training and inspection together
  const isTrainingType = true;
  const serviceTypeParam: "all" = "all";

  // React Query cached certificates: fetch all unbilled services (both trainings & inspections)
  const { data: allCertificates = [], isLoading: isLoadingCertificates } =
    useInvoiceCertificatesQuery({
      open,
      clientId: selectedClientId,
      serviceType: "all",
      enabled: Boolean(selectedClientId),
    });

  // Client Selection Handler
  const handleCustomerFieldChange = useCallback(
    (field: keyof CustomerFormState, value: string) => {
      setCustomerForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setStep(1);
    setBillingType("company");
    setSelectedClientId("");
    setTaxMode("exclusive");
    setCustomerForm({
      client: "",
      trnNo: "",
      poBox: "",
      location: "",
      phone: "",
      mobile: "",
      referenceContact: "",
    });
    setSelectedCertIds([]);
    setCertSearchQuery("");
    setCourseRates({});
    setManualLineItems([
      {
        description: "",
        quantity: 1,
        unit: "Qty",
        unitPrice: 0,
        discount: 0,
        vatPercent: 5.0,
      },
    ]);
    setInvoiceDate(new Date());
    setDueDate(undefined);
    setNotes("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setGroupingMode("itemized");
  }, []);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  // Handle Billing Type Change
  const handleBillingTypeChange = useCallback(
    (type: BillingType) => {
      setBillingType(type);
      setSelectedCertIds([]);
      setCertSearchQuery("");
      setCourseRates({});

      if (type === "individual") {
        setSelectedClientId("individual");
        setCustomerForm({
          client: "",
          trnNo: "N/A",
          poBox: "N/A",
          location: "Dubai, UAE",
          phone: "",
          mobile: "",
          referenceContact: "",
        });
      } else {
        setSelectedClientId("");
        setCustomerForm({
          client: "",
          trnNo: "",
          poBox: "",
          location: "",
          phone: "",
          mobile: "",
          referenceContact: "",
        });
      }
    },
    []
  );

  // Handle Corporate Client Selection with immediate field auto-fill
  const handleSelectCompany = useCallback(
    (clientId: string) => {
      setSelectedClientId(clientId);
      setSelectedCertIds([]);
      setCertSearchQuery("");
      setCourseRates({});

      const clientObj = (clients as any[]).find((c) => c.id === clientId);
      if (clientObj) {
        const companyName =
          clientObj.companyName || clientObj.label || clientObj.meta?.companyName || "";
        setCustomerForm({
          client: companyName,
          trnNo: clientObj.trnNo || "",
          poBox: clientObj.poBox || "",
          location: clientObj.location || "",
          phone: clientObj.phone || "",
          mobile: clientObj.phone || "",
          referenceContact: clientObj.contactPerson || "",
        });
      }
    },
    [clients]
  );

  // Map unbilled certificates into BillableCertificateItem
  const billableItems = useMemo(() => {
    const clientObj = (clients as any[]).find((c) => c.id === selectedClientId);
    const companyName = clientObj
      ? clientObj.companyName || clientObj.label || clientObj.meta?.companyName || ""
      : "";
    const isIndividualSelect =
      billingType === "individual" ||
      selectedClientId === "individual" ||
      companyName.toLowerCase().includes("individual");

    return allCertificates
      .filter((c) => {
        if (c.invoiceIssued) return false;
        if (isIndividualSelect) return true;
        const certClient =
          c.company || (c as any).clientName || (c as any).client?.companyName || "";
        return (
          c.clientId === selectedClientId ||
          (certClient &&
            companyName &&
            certClient.toLowerCase().trim() === companyName.toLowerCase().trim()) ||
          (c.participantName &&
            companyName &&
            c.participantName.toLowerCase().trim() === companyName.toLowerCase().trim())
        );
      })
      .map((c: any) => {
        const isTrainingItem = c.itemType === "training" || c.type === "training";
        const serviceType: "training" | "inspection" =
          c.serviceType || (c.courseName?.toLowerCase().includes("inspection") ? "inspection" : "training");
        const awardingBody =
          c.awardingBodyName ||
          (c.awardingBody && typeof c.awardingBody === "object" ? c.awardingBody.name : c.awardingBody) ||
          (c.certificateNumber ? "Tatweer" : "General");
        const certNum = c.certificateNumber
          ? c.certificateNumber.match(/\d+/)?.[0] || c.certificateNumber
          : null;
        const displayComp = c.customCompany
          ? ` [${c.customCompany}]`
          : "";
        const candPhone =
          c.participantPhone || c.phone || c.mobile || "";

        return {
          id: isTrainingItem ? `training-${c.id}` : `cert-${c.id}`,
          rawId: c.id,
          type: isTrainingItem ? ("training" as const) : ("certificate" as const),
          serviceType,
          participantName: c.participantName,
          course: c.course || c.courseName || "",
          awardingBody,
          certificateNumber: c.certificateNumber || null,
          customCompany: c.customCompany || "",
          phone: candPhone,
          mobile: c.mobile || candPhone,
        };
      });
  }, [allCertificates, selectedClientId, billingType, clients]);

  // Filtered Billable Items
  const filteredBillableItems = useMemo(() => {
    if (!certSearchQuery.trim()) return billableItems;
    const q = certSearchQuery.toLowerCase().trim();
    return billableItems.filter((item) => {
      const pName = (item.participantName || "").toLowerCase();
      const cName = (item.course || "").toLowerCase();
      const body = (item.awardingBody || "").toLowerCase();
      const certNum = (item.certificateNumber || "").toLowerCase();
      return (
        pName.includes(q) ||
        cName.includes(q) ||
        body.includes(q) ||
        certNum.includes(q)
      );
    });
  }, [billableItems, certSearchQuery]);

  // Selected Items
  const selectedItems = useMemo(() => {
    return billableItems.filter((item) => selectedCertIds.includes(item.id));
  }, [billableItems, selectedCertIds]);

  // Pricing Groups
  const pricingGroups = useMemo(() => {
    const map = new Map<string, PricingGroup>();
    selectedItems.forEach((item) => {
      const body = item.awardingBody || "General";
      const key = `${item.course}:::${body}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          course: item.course,
          awardingBody: body,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [selectedItems]);

  // Auto-populate course rates from client's pre-configured rates (e.g. Tatweer & Arbrit)
  useEffect(() => {
    if (!isTrainingType || pricingGroups.length === 0 || !selectedClientId) return;

    const clientObj = (clients as any[]).find((c) => c.id === selectedClientId);
    if (!clientObj || !clientObj.courseRates) return;

    setCourseRates((prev) => {
      let changed = false;
      const next = { ...prev };

      pricingGroups.forEach((grp) => {
        if (!next[grp.key] || next[grp.key].trim() === "") {
          const autoRate = getClientCourseRate(
            clientObj.courseRates,
            grp.awardingBody,
            grp.course
          );
          if (autoRate !== null && autoRate > 0) {
            next[grp.key] = String(autoRate);
            changed = true;
          }
        }
      });

      return changed ? next : prev;
    });
  }, [pricingGroups, selectedClientId, clients, isTrainingType]);

  // Auto-fill candidate info for B2C individual invoices from certificate
  useEffect(() => {
    if (billingType === "individual") {
      if (selectedItems.length > 0) {
        const first = selectedItems[0];
        const candPhone = first.phone || first.mobile || "";
        setCustomerForm((prev) => ({
          ...prev,
          client: first.participantName || "",
          referenceContact: first.participantName || "",
          phone: candPhone,
          mobile: candPhone,
          trnNo: "N/A",
          poBox: "N/A",
          location: prev.location || "Dubai, UAE",
        }));
      } else {
        setCustomerForm((prev) => ({
          ...prev,
          client: "",
          referenceContact: "",
          phone: "",
          mobile: "",
          trnNo: "N/A",
          poBox: "N/A",
          location: "Dubai, UAE",
        }));
      }
    }
  }, [billingType, selectedItems]);

  // Toggle single certificate selection (enforces single candidate in individual mode)
  const toggleSelectCertificate = useCallback(
    (id: string) => {
      setSelectedCertIds((prev) => {
        const isSelected = prev.includes(id);
        if (isSelected) {
          return prev.filter((i) => i !== id);
        }
        // If individual mode, ensure new cert belongs to the same candidate
        if (billingType === "individual" && prev.length > 0) {
          const currentFirst = billableItems.find((b) => prev.includes(b.id));
          const targetItem = billableItems.find((b) => b.id === id);
          if (
            currentFirst?.participantName &&
            targetItem?.participantName &&
            currentFirst.participantName.trim().toLowerCase() !==
              targetItem.participantName.trim().toLowerCase()
          ) {
            return prev; // Block selecting a different candidate
          }
        }
        return [...prev, id];
      });
    },
    [billingType, billableItems]
  );

  // Select all filtered (restricted to same candidate in individual mode)
  const selectAllFiltered = useCallback(() => {
    let selectable = filteredBillableItems;
    if (billingType === "individual") {
      if (selectedCertIds.length > 0) {
        const first = billableItems.find((b) => selectedCertIds.includes(b.id));
        if (first?.participantName) {
          const targetName = first.participantName.trim().toLowerCase();
          selectable = filteredBillableItems.filter(
            (i) => i.participantName?.trim().toLowerCase() === targetName
          );
        }
      } else if (filteredBillableItems.length > 0) {
        const firstName = filteredBillableItems[0].participantName?.trim().toLowerCase();
        if (firstName) {
          selectable = filteredBillableItems.filter(
            (i) => i.participantName?.trim().toLowerCase() === firstName
          );
        }
      }
    }
    const allFilteredIds = selectable.map((i) => i.id);
    setSelectedCertIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  }, [filteredBillableItems, billingType, selectedCertIds, billableItems]);

  // Deselect all filtered
  const deselectAllFiltered = useCallback(() => {
    const allFilteredIds = filteredBillableItems.map((i) => i.id);
    setSelectedCertIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
  }, [filteredBillableItems]);

  // Set course rate helper
  const setCourseRate = useCallback((key: string, rate: string) => {
    const sanitized = rate.replace(/[^0-9.]/g, "");
    setCourseRates((prev) => ({ ...prev, [key]: sanitized }));
  }, []);

  // Calculations Engine
  const calculations = useMemo(() => {
    return calculateInvoice({
      isTrainingOrInspection: isTrainingType,
      selectedItems,
      courseRates,
      manualLineItems,
      taxMode,
      discountType,
      discountValue,
    });
  }, [
    isTrainingType,
    selectedItems,
    courseRates,
    manualLineItems,
    taxMode,
    discountType,
    discountValue,
  ]);

  // Helper to sync updated rates back to client profile if option is enabled
  const syncRatesToClient = useCallback(async () => {
    if (!selectedClientId || selectedClientId === "individual" || !saveRatesToClient) return;
    const clientObj = (clients as any[]).find((c) => c.id === selectedClientId);
    if (!clientObj) return;

    const currentRates: Record<string, any> = { ...(clientObj.courseRates || {}) };
    let hasChanges = false;

    pricingGroups.forEach((grp) => {
      const rateVal = courseRates[grp.key];
      if (!rateVal || isNaN(Number(rateVal)) || Number(rateVal) <= 0) return;

      const bodyKey = (grp.awardingBody || "tatweer").toLowerCase().trim();
      const isInspection = isInspectionOrSupervisorCourse(grp.course);
      const tierKey = isInspection ? "inspection" : "normal";

      const existingTier = currentRates[bodyKey] || { normal: "", inspection: "" };
      if (String(existingTier[tierKey]) !== String(rateVal)) {
        currentRates[bodyKey] = {
          ...existingTier,
          [tierKey]: Number(rateVal),
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      try {
        await apiUpdateClientCourseRates(selectedClientId, currentRates);
      } catch (err) {
        console.error("Failed to sync course rates to client profile:", err);
      }
    }
  }, [selectedClientId, saveRatesToClient, clients, pricingGroups, courseRates]);

  // Auto-fill Description
  useEffect(() => {
    if (isTrainingType && selectedItems.length > 0) {
      const first = selectedItems[0];
      let descPrefix = "";
      if (first.certificateNumber) {
        const certNum = first.certificateNumber.match(/\d+/)?.[0] || first.certificateNumber;
        descPrefix = certNum ? `${certNum} - ` : "";
      }

      const courseShort = getCourseShortName(first.course);
      const firstText = `${descPrefix}${first.participantName} - ${courseShort}`;
      const descText = selectedItems.length > 1 ? `${firstText} & Others` : firstText;
      const hasTraining = selectedItems.some((it) => it.serviceType === "training");
      const hasInspection = selectedItems.some((it) => it.serviceType === "inspection");
      const serviceLabel =
        hasTraining && hasInspection
          ? "Training & Inspection"
          : hasInspection || selectedTypeName.includes("inspection")
          ? "Inspection"
          : "Training";
      setDescription(`Invoice for ${serviceLabel} Services - ${descText}`);
    }
  }, [isTrainingType, selectedItems, selectedTypeName]);

  // Validation rules
  const canProceedToStep2 = useMemo(() => {
    if (!selectedTypeId) return false;
    if (billingType === "company") {
      return Boolean(selectedClientId && customerForm.client);
    }
    // Individual can select candidate on step 2, or has candidate name
    return true;
  }, [selectedTypeId, billingType, selectedClientId, customerForm.client]);

  const canProceedToStep3 = useMemo(() => {
    if (isTrainingType) {
      if (selectedItems.length === 0) return false;
      // All pricing groups must have a valid rate > 0
      const allRatesSet = pricingGroups.every((grp) => {
        const rate = parseFloat(courseRates[grp.key] || courseRates[grp.course]);
        return !isNaN(rate) && rate > 0;
      });
      return allRatesSet;
    } else {
      // General invoice must have at least one line item with description & price > 0
      return manualLineItems.some(
        (li) => li.description.trim() && parseFloat(String(li.unitPrice)) > 0
      );
    }
  }, [isTrainingType, selectedItems, pricingGroups, courseRates, manualLineItems]);

  // Helper to build submission payload for POST /api/finance/invoices
  const getSubmissionPayload = useCallback(() => {
    const fallbackCandidate =
      selectedItems.length > 0 && selectedItems[0].participantName
        ? selectedItems[0].participantName
        : "";
    const finalClient =
      customerForm.client &&
      customerForm.client.trim().toLowerCase() !== "individual candidate"
        ? customerForm.client.trim()
        : fallbackCandidate || (billingType === "individual" ? "Individual Candidate" : customerForm.client);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedDate = `${pad(invoiceDate.getDate())}-${pad(invoiceDate.getMonth() + 1)}-${invoiceDate.getFullYear()}`;
    const formattedDueDate = dueDate
      ? `${pad(dueDate.getDate())}-${pad(dueDate.getMonth() + 1)}-${dueDate.getFullYear()}`
      : "";

    const finalNotes = notes || "";

    return {
      clientId: selectedClientId || "individual",
      client: finalClient,
      trnNo: customerForm.trnNo || "N/A",
      poBox: customerForm.poBox || "N/A",
      location: customerForm.location || "Dubai, UAE",
      phone: customerForm.phone || "",
      mobile: customerForm.mobile || customerForm.phone || "",
      referenceContact: customerForm.referenceContact || finalClient,
      typeId: selectedTypeId,
      amount: calculations.subtotal,
      discount: calculations.discount,
      discountAmount: calculations.discount,
      vatAmount: calculations.vatAmount,
      total: calculations.total,
      date: formattedDate,
      dueDate: formattedDueDate,
      description: description || `${finalClient} Invoice`,
      notes: finalNotes,
      terms: "Due Upon Receipt",
      status: "draft" as const,
      selectedCertificateIds: selectedCertIds
        .filter((id) => id.startsWith("cert-"))
        .map((id) => id.substring(5)),
      lineItems: calculations.lineItems,
    };
  }, [
      selectedItems,
      customerForm,
      billingType,
      invoiceDate,
      dueDate,
      selectedClientId,
      selectedTypeId,
      calculations,
      description,
      notes,
      groupingMode,
      selectedCertIds,
    ],
  );

  return {
    step,
    setStep,
    billingType,
    setBillingType: handleBillingTypeChange,
    selectedClientId,
    setSelectedClientId,
    handleSelectCompany,
    selectedTypeId,
    setSelectedTypeId,
    invoiceTypes,
    customerForm,
    setCustomerForm,
    handleCustomerFieldChange,
    allCertificates,
    isLoadingCertificates,
    selectedCertIds,
    setSelectedCertIds,
    toggleSelectCertificate,
    selectAllFiltered,
    deselectAllFiltered,
    certSearchQuery,
    setCertSearchQuery,
    billableItems,
    filteredBillableItems,
    selectedItems,
    pricingGroups,
    courseRates,
    setCourseRate,
    taxMode,
    setTaxMode,
    saveRatesToClient,
    setSaveRatesToClient,
    manualLineItems,
    setManualLineItems,
    invoiceDate,
    setInvoiceDate,
    dueDate,
    setDueDate,
    notes,
    setNotes,
    description,
    setDescription,
    nextInvoiceNum,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    groupingMode,
    setGroupingMode,
    calculations,
    isTrainingType,
    serviceTypeParam,
    canProceedToStep2,
    canProceedToStep3,
    resetForm,
    getSubmissionPayload,
    syncRatesToClient,
  };
}
