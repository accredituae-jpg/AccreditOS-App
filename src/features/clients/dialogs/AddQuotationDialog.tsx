import { useState, useEffect, memo } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  Plus,
  Trash2,
  FileText,
  Check,
  ChevronsUpDown,
  Percent,
  Building2,
  User,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Client } from "../types/client.types";
import type { Quotation, QuotationItem } from "../types/quotation.types";
import { apiGetCourses } from "@/lib/api/trainingApi";
import { apiGetClientOptions } from "@/lib/api/clientApi";
import { saveStoredQuotation } from "../utils/quotationStorage";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { amountToWords } from "@/features/billing/utils/billing.utils";

interface AddQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave?: (newQuotation: Quotation) => void;
}

// Fallback course names if API is empty
const DEFAULT_FALLBACK_COURSES = [
  "Fire Watcher",
  "Work at Height (WAH)",
  "WAH Rescue",
  "Rigging & Slinging",
  "Power Tool Operator",
  "Scaffolding Inspector",
  "First Aid & CPR",
  "Chemical Handling",
  "Defensive Driving",
  "Confined Space Entry",
  "H2S Safety Awareness",
  "Forklift Operator Safety",
  "Crane Operator Safety",
];

interface FormQuotationItem {
  trainingName: string;
  qty: number | string;
  rateType: "amount" | "text";
  ratePerUnit: number;
  rateText: string;
}

export const AddQuotationDialog = memo(function AddQuotationDialog({
  open,
  onOpenChange,
  client,
  onSave,
}: AddQuotationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client Selection / Lead State
  const [clientMode, setClientMode] = useState<"manual" | "existing">(
    client ? "existing" : "manual",
  );
  const [companyName, setCompanyName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [trnNo, setTrnNo] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [registeredClients, setRegisteredClients] = useState<any[]>([]);

  const [quotationNo, setQuotationNo] = useState("");
  const [quotationDate, setQuotationDate] = useState<Date | undefined>(
    new Date(),
  );
  const [subject, setSubject] = useState("Quotation for Training Program");
  const [paymentTerms, setPaymentTerms] = useState(
    "Payment to be made on or before the scheduled training date.",
  );
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState<string>("");

  const [availableCourseNames, setAvailableCourseNames] = useState<string[]>(
    DEFAULT_FALLBACK_COURSES,
  );

  const [items, setItems] = useState<FormQuotationItem[]>([]);

  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);

  // Fetch courses dynamically and reset form on open
  useEffect(() => {
    if (open) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const currentYear = new Date().getFullYear().toString().slice(-2);
      setQuotationNo(`AMC/QTN/${randomNum}-${currentYear}`);
      setQuotationDate(new Date());
      setSubject("Quotation for Training Program");

      if (client) {
        setClientMode("existing");
        setCompanyName(client.companyName || "");
        setContactNo(client.phone || "");
        setEmail(client.email || "");
        setLocation(client.location || "");
        setTrnNo(client.trnNo || "");
        setSelectedClientId(client.id || "");
      } else {
        setClientMode("manual");
        setCompanyName("");
        setContactNo("");
        setEmail("");
        setLocation("");
        setTrnNo("");
        setSelectedClientId("");
      }

      setPaymentTerms(
        "Payment to be made on or before the scheduled training date.",
      );
      setDiscountType("percentage");
      setDiscountValue("");
      setItems([]);

      // Fetch client options for existing client dropdown
      apiGetClientOptions()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setRegisteredClients(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch client options:", err);
        });

      apiGetCourses()
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const names = res.data.map((c: any) =>
              typeof c === "string" ? c : c.name || c.courseName || String(c),
            );
            setAvailableCourseNames(names);
          } else {
            setAvailableCourseNames(DEFAULT_FALLBACK_COURSES);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch courses from API:", err);
          setAvailableCourseNames(DEFAULT_FALLBACK_COURSES);
        });
    }
  }, [open, client]);

  const isAllText =
    items.length > 0 && items.every((i) => i.rateType === "text");
  const hasTextItems = items.some((i) => i.rateType === "text");

  const subtotal = items.reduce(
    (sum, item) =>
      item.rateType === "text"
        ? sum
        : sum + (Number(item.qty) || 0) * (Number(item.ratePerUnit) || 0),
    0,
  );

  const parsedDiscountVal = parseFloat(discountValue) || 0;
  let calculatedDiscountAmount = 0;
  let effectiveDiscountRate: number | undefined = undefined;

  if (parsedDiscountVal > 0 && subtotal > 0 && !isAllText) {
    if (discountType === "percentage") {
      const percentage = Math.min(100, Math.max(0, parsedDiscountVal));
      effectiveDiscountRate = percentage;
      calculatedDiscountAmount = (subtotal * percentage) / 100;
    } else {
      calculatedDiscountAmount = Math.min(
        subtotal,
        Math.max(0, parsedDiscountVal),
      );
      effectiveDiscountRate =
        subtotal > 0
          ? Number(((calculatedDiscountAmount / subtotal) * 100).toFixed(2))
          : 0;
    }
  }

  const taxableAmount = Math.max(0, subtotal - calculatedDiscountAmount);
  const vatRate = 5;
  const vatAmount = taxableAmount * (vatRate / 100);
  const totalAmount = taxableAmount + vatAmount;

  const displayAmountInWords = isAllText
    ? "Upon Request — Subject to final confirmation"
    : amountToWords(totalAmount) +
      (hasTextItems ? " (plus Upon Request items)" : "");

  const handleSelectCourseName = (courseName: string) => {
    if (
      items.some(
        (i) => i.trainingName.toLowerCase() === courseName.toLowerCase(),
      )
    ) {
      toast({
        title: "Course Already Added",
        description: `${courseName} is already in the quotation list.`,
      });
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        trainingName: courseName,
        qty: 1,
        rateType: "amount",
        ratePerUnit: 0,
        rateText: "Upon Request",
      },
    ]);
    setCoursePopoverOpen(false);
  };

  const handleAddBlankRow = () => {
    setItems((prev) => [
      ...prev,
      {
        trainingName: "",
        qty: 1,
        rateType: "amount",
        ratePerUnit: 0,
        rateText: "Upon Request",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof FormQuotationItem,
    val: any,
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "ratePerUnit" ? Math.max(0, Number(val) || 0) : val,
            }
          : item,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter the client / company name for this quotation.",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one course to the quotation.",
      });
      return;
    }

    const hasEmptyName = items.some((item) => !item.trainingName.trim());
    if (hasEmptyName) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description:
          "Please enter a course name for all items in the quotation.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = quotationDate
        ? format(quotationDate, "dd-MM-yyyy")
        : format(new Date(), "dd-MM-yyyy");

      const formattedItems: QuotationItem[] = items.map((item, index) => {
        const q = Number(item.qty) || 1;
        const isText = item.rateType === "text";
        const r = isText ? 0 : Number(item.ratePerUnit) || 0;
        const rText = isText
          ? item.rateText?.trim() || "Upon Request"
          : undefined;
        return {
          sNo: index + 1,
          trainingName: item.trainingName || `Training Course ${index + 1}`,
          qty: q,
          ratePerUnit: r,
          rateType: isText ? "text" : "amount",
          rateText: rText,
          rateCalculation: isText ? rText! : `${q}x${r}=${q * r}`,
          totalAmount: isText ? 0 : q * r,
        };
      });

      const newQuotation: Quotation = {
        id: `qtn-${Date.now()}`,
        quotationNo,
        date: formattedDate,
        companyName: companyName.trim(),
        contactNo: contactNo.trim() || "—",
        email: email.trim() || "—",
        location: location.trim() || undefined,
        trnNo: trnNo.trim() || undefined,
        subject,
        items: formattedItems,
        subtotal,
        discountType: calculatedDiscountAmount > 0 ? discountType : undefined,
        discountRate:
          calculatedDiscountAmount > 0 ? effectiveDiscountRate : undefined,
        discountAmount:
          calculatedDiscountAmount > 0
            ? Number(calculatedDiscountAmount.toFixed(2))
            : 0,
        vatRate,
        vatAmount: Number(vatAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        amountInWords: displayAmountInWords,
        paymentTerms,
        status: "sent",
        pricingSummaryText: isAllText ? "Upon Request" : undefined,
      };

      saveStoredQuotation(newQuotation);
      onSave?.(newQuotation);
      toast({
        title: "Quotation Created",
        description: `Quotation ${quotationNo} successfully created for ${companyName.trim()}.`,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Create New Quotation"
      description={
        companyName.trim()
          ? `Generate a commercial quotation for ${companyName.trim()}`
          : "Generate a commercial quotation for any client or prospective lead"
      }
      icon={FileText}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Create Quotation"
      maxWidth="max-w-3xl"
    >
      {/* Form Content */}
      <div className="space-y-4 sm:space-y-5">
        {/* Client / Prospect Information Card */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                Billed Client / Prospect
              </span>
              <p className="text-[11px] text-muted-foreground">
                {clientMode === "manual"
                  ? "Enter any prospect name directly — no need to create a client account in the system"
                  : "Choose an existing registered client from the system"}
              </p>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center bg-background border border-border p-0.5 rounded-lg text-xs shrink-0 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setClientMode("manual")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5",
                  clientMode === "manual"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <User className="w-3 h-3" />
                <span>New / Unregistered</span>
              </button>
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5",
                  clientMode === "existing"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Building2 className="w-3 h-3" />
                <span>Existing Client</span>
              </button>
            </div>
          </div>

          {/* Existing Client Dropdown */}
          {clientMode === "existing" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Select Existing Client
              </Label>
              <Select
                value={selectedClientId}
                onValueChange={(val) => {
                  setSelectedClientId(val);
                  const matched = registeredClients.find((c) => c.id === val);
                  if (matched) {
                    setCompanyName(matched.companyName || "");
                    setContactNo(matched.phone || "");
                    setEmail(matched.email || "");
                    setLocation(matched.location || "");
                    setTrnNo(matched.trnNo || "");
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Choose registered client..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {registeredClients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.companyName} {c.phone ? `(${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-foreground">
                Company / Client Name *
              </Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Al Futtaim Engineering LLC, Marine Logistics, or Candidate Name"
                required
                className="h-9 text-xs font-bold bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Contact Person / Phone
              </Label>
              <Input
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                placeholder="e.g. +971 50 123 4567"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Client Email
              </Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. info@company.com"
                type="email"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Location / Address (Optional)
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dubai, Abu Dhabi, UAE"
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Client TRN (Optional)
              </Label>
              <Input
                value={trnNo}
                onChange={(e) => setTrnNo(e.target.value)}
                placeholder="e.g. 100523098500003"
                className="h-9 text-xs font-mono bg-background"
              />
            </div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Quotation No.
            </Label>
            <Input
              value={quotationNo}
              onChange={(e) => setQuotationNo(e.target.value)}
              required
              className="h-9 text-xs font-mono font-bold"
            />
          </div>

          {/* Custom Calendar Date Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Quotation Date
            </Label>
            <CustomCalendar
              value={quotationDate}
              onChange={setQuotationDate}
              placeholder="Select quotation date"
            />
          </div>
        </div>

        {/* Subject Row */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">
            Subject Line
          </Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quotation for Training Program"
            required
            className="h-9 text-xs font-semibold"
          />
        </div>

        {/* Course Selection Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-2.5">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <Label className="text-xs font-bold text-primary uppercase tracking-wide">
                Training Courses & Pricing
              </Label>
              {items.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Select Course from Settings Popover (No rates shown inside dropdown) */}
              <Popover
                open={coursePopoverOpen}
                onOpenChange={setCoursePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select Course</span>
                    <ChevronsUpDown className="w-3 h-3 opacity-50 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2.5rem)] sm:w-72 max-w-sm p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search course from Settings..." />
                    <CommandList>
                      <CommandEmpty className="p-3 text-center text-xs text-muted-foreground">
                        No course found in Settings.
                      </CommandEmpty>
                      <CommandGroup heading="Available Courses">
                        {availableCourseNames.map((courseName, i) => {
                          const isSelected = items.some(
                            (item) =>
                              item.trainingName.toLowerCase() ===
                              courseName.toLowerCase(),
                          );
                          return (
                            <CommandItem
                              key={i}
                              onSelect={() =>
                                handleSelectCourseName(courseName)
                              }
                              className="flex items-center justify-between text-xs py-2 cursor-pointer"
                            >
                              <span className="font-medium">{courseName}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Add Custom Row Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddBlankRow}
                className="flex-1 sm:flex-initial h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/80 sm:border-0 justify-center"
              >
                + Add Row
              </Button>
            </div>
          </div>

          {/* Empty State */}
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground bg-muted/10 border border-dashed border-border rounded-xl">
              No courses added yet. Click{" "}
              <span className="font-semibold text-primary">
                "Select Course"
              </span>{" "}
              or{" "}
              <span className="font-semibold text-primary">
                "+ Add Row"
              </span>{" "}
              above to build this quotation.
            </div>
          ) : (
            <>
              {/* MOBILE VIEW (Cards - block sm:hidden) */}
              <div className="space-y-3 sm:hidden">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/80 bg-card shadow-xs space-y-2.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Item #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-7 px-2 text-destructive hover:bg-destructive/10 text-xs gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">
                        Training Course Name
                      </Label>
                      <Input
                        value={item.trainingName}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "trainingName",
                            e.target.value,
                          )
                        }
                        className="h-8 text-xs font-semibold"
                        placeholder="e.g. Fire Watcher, First Aid..."
                      />
                    </div>

                    <div className="grid grid-cols-12 gap-2 pt-0.5">
                      <div className="col-span-4 space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground">
                          QTY
                        </Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "qty",
                              e.target.value.replace(/[^0-9]/g, ""),
                            )
                          }
                          className="h-8 text-xs text-center font-bold"
                        />
                      </div>

                      <div className="col-span-8 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-semibold text-muted-foreground">
                            Pricing / Rate
                          </Label>
                          {/* Direct 2-option switcher */}
                          <div className="inline-flex rounded-md border p-0.5 bg-muted/60 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(idx, "rateType", "amount");
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                                item.rateType === "amount"
                                  ? "bg-white text-primary shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Amt
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(idx, "rateType", "text");
                                handleItemChange(
                                  idx,
                                  "rateText",
                                  "Upon Request",
                                );
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                                item.rateType === "text"
                                  ? "bg-[#0f4c81] text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Text
                            </button>
                          </div>
                        </div>

                        {item.rateType === "text" ? (
                          <div className="h-8 rounded-md bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center">
                            Upon Request
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={item.ratePerUnit}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "ratePerUnit",
                                  e.target.value.replace(/[^0-9.]/g, ""),
                                )
                              }
                              placeholder="0.00"
                              className="h-8 text-xs text-right font-bold pr-11"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold pointer-events-none">
                              AED
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {item.rateType === "amount" && (
                      <div className="flex justify-end pt-0.5 text-[11px] text-muted-foreground">
                        <span>
                          Subtotal:{" "}
                          <strong className="text-foreground font-bold">
                            {(
                              (Number(item.qty) || 0) *
                              (Number(item.ratePerUnit) || 0)
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            AED
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* DESKTOP/TABLET VIEW (Table - hidden sm:block) */}
              <div className="hidden sm:block border border-border rounded-xl overflow-x-auto bg-card">
                <div className="min-w-[520px]">
                  <div className="bg-muted/60 px-3 py-2 grid grid-cols-12 gap-2 text-[11px] font-bold text-muted-foreground uppercase border-b">
                    <div className="col-span-5">Training Course Name</div>
                    <div className="col-span-2 text-center">QTY</div>
                    <div className="col-span-4 text-right">Pricing / Rate</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>

                  <div className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 grid grid-cols-12 gap-2 items-center text-xs hover:bg-muted/20"
                      >
                        <div className="col-span-5">
                          <Input
                            value={item.trainingName}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "trainingName",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs font-semibold"
                            placeholder="Course name..."
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "qty",
                                e.target.value.replace(/[^0-9]/g, ""),
                              )
                            }
                            className="h-8 text-xs text-center font-bold"
                          />
                        </div>
                        <div className="col-span-4 flex items-center gap-1.5">
                          {item.rateType === "text" ? (
                            <div className="flex-1 min-w-0 h-8 rounded-md bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs flex items-center justify-center">
                              Upon Request
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0 relative">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={item.ratePerUnit}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "ratePerUnit",
                                    e.target.value.replace(/[^0-9.]/g, ""),
                                  )
                                }
                                placeholder="0.00"
                                className="h-8 text-xs text-right font-bold pr-11"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold pointer-events-none">
                                AED
                              </span>
                            </div>
                          )}

                          {/* Direct 2-option switcher: Amount or Upon Request */}
                          <div className="inline-flex rounded-md border p-0.5 bg-muted/60 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(idx, "rateType", "amount");
                              }}
                              className={`px-2 py-1 text-[10.5px] font-bold rounded transition-colors ${
                                item.rateType === "amount"
                                  ? "bg-white text-primary shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Amt
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(idx, "rateType", "text");
                                handleItemChange(
                                  idx,
                                  "rateText",
                                  "Upon Request",
                                );
                              }}
                              className={`px-2 py-1 text-[10.5px] font-bold rounded transition-colors ${
                                item.rateType === "text"
                                  ? "bg-[#0f4c81] text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Text
                            </button>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Terms & Commercial Discount Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start">
          {/* Payment Terms */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Payment Terms
            </Label>
            <Input
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="h-9 text-xs"
              placeholder="e.g. Payment on or before training date..."
            />
            <p className="text-[11px] text-muted-foreground">
              Official payment terms printed on the quotation proposal.
            </p>
          </div>

          {/* Discount Section */}
          <div className="space-y-2 p-3 rounded-xl border border-border/80 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span>Quotation Discount</span>
              </Label>

              {/* Discount Type Switcher: % Percentage vs AED Amount */}
              <div className="inline-flex rounded-md border p-0.5 bg-background shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType("percentage");
                    if (parseFloat(discountValue) > 100) setDiscountValue("100");
                  }}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    discountType === "percentage"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("amount")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    discountType === "amount"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AED Amount
                </button>
              </div>
            </div>

            {/* Input with Affix and Preset Buttons */}
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={discountValue}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, "");
                    if (discountType === "percentage" && parseFloat(val) > 100) {
                      val = "100";
                    }
                    setDiscountValue(val);
                  }}
                  placeholder={
                    discountType === "percentage"
                      ? "e.g. 10 (for 10% discount)"
                      : "e.g. 250.00"
                  }
                  disabled={isAllText || subtotal <= 0}
                  className="h-8 text-xs font-semibold pr-12 bg-background"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {discountValue && (
                    <button
                      type="button"
                      onClick={() => setDiscountValue("")}
                      className="text-muted-foreground hover:text-destructive text-[11px] font-bold mr-1"
                      title="Clear discount"
                    >
                      ✕
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-muted-foreground pointer-events-none">
                    {discountType === "percentage" ? "%" : "AED"}
                  </span>
                </div>
              </div>

              {/* Percentage Quick Chips */}
              {discountType === "percentage" && !isAllText && subtotal > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Quick:
                  </span>
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountValue(String(pct))}
                      className={`px-1.5 py-0.5 text-[10px] rounded border font-semibold transition-colors ${
                        discountValue === String(pct)
                          ? "bg-primary/10 border-primary text-primary font-bold"
                          : "bg-background border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}

              {/* Live calculation feedback */}
              {calculatedDiscountAmount > 0 && !isAllText ? (
                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                  <span>
                    {discountType === "percentage"
                      ? `${effectiveDiscountRate}% discount applied:`
                      : "Fixed discount applied:"}
                  </span>
                  <span>
                    -{calculatedDiscountAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    AED
                  </span>
                </div>
              ) : isAllText || subtotal <= 0 ? (
                <p className="text-[10px] text-muted-foreground italic">
                  Discount can be applied once priced courses are added.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Calculations & Totals Summary */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-start gap-3 sm:gap-4 pt-1">
          {/* Amount in Words Box */}
          <div className="flex-1 bg-card border border-border/80 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 self-stretch flex flex-col justify-center min-h-[75px] sm:min-h-[85px] shadow-xs">
            <div className="font-extrabold text-primary uppercase text-[10px] tracking-wider mb-1">
              AMOUNT IN WORDS
            </div>
            <div className="font-bold text-foreground italic text-[11px] sm:text-[11.5px] leading-snug">
              {displayAmountInWords}
            </div>
          </div>

          {/* Totals Table Card */}
          <div className="w-full sm:w-72 bg-card border border-border/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs shrink-0">
            <div className="flex justify-between items-center px-3.5 sm:px-4 py-2 sm:py-2.5 text-primary font-bold text-xs">
              <span>
                {`Subtotal (${items.length} ${items.length === 1 ? "course" : "courses"})`}
              </span>
              <span className="font-extrabold text-foreground">
                {isAllText
                  ? "Upon Request"
                  : `${subtotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} AED`}
              </span>
            </div>
            {calculatedDiscountAmount > 0 && !isAllText && (
              <div className="flex justify-between items-center px-3.5 sm:px-4 py-1.5 sm:py-2 text-emerald-600 font-bold text-xs border-t border-border/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="flex items-center gap-1">
                  <span>Discount</span>
                  {discountType === "percentage" && effectiveDiscountRate !== undefined && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-600/10">
                      ({effectiveDiscountRate}%)
                    </span>
                  )}
                </span>
                <span className="font-extrabold">
                  -{calculatedDiscountAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} AED
                </span>
              </div>
            )}
            <div className="flex justify-between items-center px-3.5 sm:px-4 py-2 sm:py-2.5 text-primary font-bold text-xs border-t border-border/60">
              <span>Vat ({vatRate}%)</span>
              <span className="font-extrabold text-foreground">
                {isAllText ? "Applicable" : `${vatAmount.toFixed(2)} AED`}
              </span>
            </div>
            <div className="flex justify-between items-center px-3.5 sm:px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground font-extrabold text-xs">
              <span className="uppercase tracking-wider">TOTAL</span>
              <span className="font-black text-sm">
                {isAllText
                  ? "Upon Request"
                  : `${totalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} AED`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </FormDialog>
  );
});
