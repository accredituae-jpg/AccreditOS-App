import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { formatAED, cn } from "@/lib/utils";
import { Client } from "@/lib/clients";
import { Building2, Check, FileText, Lock, User, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { fetchApi, apiGetNextReceiptNumber } from "@/lib/api";
import { getActiveRole } from "@/lib/permissions";
import { UpdateSequenceDialog } from "@/features/certificates/dialogs/UpdateSequenceDialog";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { convertAmountToWords } from "../utils/billing.utils";
import type { Invoice, Receipt } from "../types/billing.types";
import { qk } from "@/lib/queryKeys";
import { apiGetPendingClientsSummary } from "@/lib/api/financeApi";

interface AddReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
  receiptToEdit?: Receipt | null;
  initialInvoice?: Invoice | null;
}

export function AddReceiptDialog({
  open,
  onClose,
  onSuccess,
  clients,
  receiptToEdit,
  initialInvoice,
}: AddReceiptDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [billingType, setBillingType] = useState<"company" | "individual">(
    "company",
  );
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CHEQUE" | "BANK_TRANSFER" | "ONLINE"
  >("CASH");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [drawnOnBank, setDrawnOnBank] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [nextReceiptNum, setNextReceiptNum] = useState<string>("Auto");
  const [showUpdateSeqDialog, setShowUpdateSeqDialog] =
    useState<boolean>(false);
  const activeRole = getActiveRole();
  const isDeveloper = activeRole === "super_admin";

  const loadNextReceiptNumber = () => {
    apiGetNextReceiptNumber()
      .then((res) => {
        if (res?.success && res.data?.nextNumber) {
          setNextReceiptNum(res.data.nextNumber);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (open) {
      loadNextReceiptNumber();
    }
  }, [open]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [allocations, setAllocations] = useState<
    Record<
      string,
      { selected: boolean; amount: string; discountWriteOff?: string }
    >
  >({});

  const [saving, setSaving] = useState(false);
  const [onlyUnpaidFilter, setOnlyUnpaidFilter] = useState(true);

  // Fetch pending clients summary (unpaid invoices per client)
  const { data: summaryRes } = useQuery({
    queryKey: qk.pendingClientsSummary,
    queryFn: apiGetPendingClientsSummary,
    staleTime: 30 * 1000,
  });

  const summaryData = (summaryRes as any)?.data || summaryRes;
  const pendingReceipts: Record<
    string,
    { count: number; totalBalance: number }
  > = summaryData?.pendingReceipts || {};

  const corporateClients = useMemo(() => {
    return clients.filter(
      (c) =>
        c.companyName &&
        !c.companyName.toLowerCase().includes("individual candidate"),
    );
  }, [clients]);

  const clientsWithUnpaid = useMemo(() => {
    return corporateClients.filter((c) => {
      const pending = pendingReceipts[c.id];
      return pending && pending.count > 0;
    });
  }, [corporateClients, pendingReceipts]);

  const displayedReceiptClients = useMemo(() => {
    if (onlyUnpaidFilter && clientsWithUnpaid.length > 0) {
      if (
        selectedClientId &&
        !clientsWithUnpaid.some((c) => c.id === selectedClientId)
      ) {
        const cur = corporateClients.find((c) => c.id === selectedClientId);
        if (cur) return [cur, ...clientsWithUnpaid];
      }
      return clientsWithUnpaid;
    }

    return [...corporateClients].sort((a, b) => {
      const countA = pendingReceipts[a.id]?.count || 0;
      const countB = pendingReceipts[b.id]?.count || 0;
      if (countA !== countB) return countB - countA;
      return a.companyName.localeCompare(b.companyName);
    });
  }, [
    onlyUnpaidFilter,
    clientsWithUnpaid,
    corporateClients,
    selectedClientId,
    pendingReceipts,
  ]);

  useEffect(() => {
    if (open) {
      if (receiptToEdit) {
        const isInd =
          receiptToEdit.clientSnapshot?.billingType === "individual" ||
          receiptToEdit.clientId === "individual" ||
          receiptToEdit.client?.companyName === "Individual Candidate" ||
          !clients.some((c) => c.id === receiptToEdit.clientId);

        setBillingType(isInd ? "individual" : "company");
        setSelectedClientId(receiptToEdit.clientId);
        setRecipientName(
          receiptToEdit.clientSnapshot?.candidateName ||
            receiptToEdit.clientSnapshot?.companyName ||
            "",
        );
        setReferenceNo(receiptToEdit.referenceNo || "");
        setDrawnOnBank(receiptToEdit.drawnOnBank || "");
        setNotes(receiptToEdit.notes || "");
        if (receiptToEdit.paymentDate) {
          const d = new Date(receiptToEdit.paymentDate);
          setPaymentDate(
            !isNaN(d.getTime())
              ? d.toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          );
        } else if (receiptToEdit.date) {
          const d = new Date(receiptToEdit.date);
          setPaymentDate(
            !isNaN(d.getTime())
              ? d.toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          );
        } else {
          setPaymentDate(new Date().toISOString().split("T")[0]);
        }
      } else if (initialInvoice) {
        const isInd =
          initialInvoice.clientId === "individual" ||
          !clients.some((c) => c.id === initialInvoice.clientId) ||
          (initialInvoice.client &&
            initialInvoice.client.toLowerCase().includes("individual")) ||
          (Boolean(initialInvoice.clientName) &&
            initialInvoice.clientName?.toLowerCase() !==
              "individual candidate" &&
            !clients.some(
              (c) =>
                c.companyName.toLowerCase() ===
                initialInvoice.clientName?.toLowerCase(),
            ));

        setBillingType(isInd ? "individual" : "company");
        setSelectedClientId(
          initialInvoice.clientId || (isInd ? "individual" : ""),
        );
        setRecipientName(
          isInd ? initialInvoice.clientName || initialInvoice.client || "" : "",
        );
        setPaymentMethod("CASH");
        setReferenceNo("");
        setDrawnOnBank("");
        setNotes(`Payment for ${initialInvoice.invoiceNumber}`);
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setInvoices([initialInvoice]);
        setAllocations({
          [initialInvoice.id]: {
            selected: true,
            amount: (initialInvoice.balance !== undefined &&
            initialInvoice.balance !== null
              ? initialInvoice.balance
              : initialInvoice.totalAmount
            ).toString(),
          },
        });
      } else {
        setBillingType("company");
        setSelectedClientId("");
        setRecipientName("");
        setPaymentMethod("CASH");
        setReferenceNo("");
        setDrawnOnBank("");
        setNotes("");
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setInvoices([]);
        setAllocations({});
      }
    }
  }, [open, receiptToEdit, initialInvoice, clients]);

  // Helper to calculate the allowable balance for an invoice in this dialog
  const getInvoiceAllowableBalance = (inv: Invoice) => {
    if (receiptToEdit) {
      // If editing this receipt, only deduct allocations from other receipts
      const committedByOthers = (inv.pendingReceipts || [])
        .filter((pr) => pr.receiptId !== receiptToEdit.id)
        .reduce((sum, pr) => sum + pr.amount, 0);
      return Math.max(
        0,
        Number((inv.totalAmount - committedByOthers).toFixed(2)),
      );
    }
    if (inv.allocatableBalance !== undefined) {
      return inv.allocatableBalance;
    }
    return inv.balance !== undefined ? inv.balance : inv.totalAmount;
  };

  const isInvoiceFullyCoveredInOtherReceipt = (inv: Invoice) => {
    return getInvoiceAllowableBalance(inv) <= 0;
  };

  useEffect(() => {
    const loadClientInvoices = async () => {
      const effectiveClientId =
        billingType === "individual" ? "individual" : selectedClientId;
      if (!open || !effectiveClientId) {
        setInvoices([]);
        setAllocations({});
        return;
      }
      setLoadingInvoices(true);
      try {
        const response = await fetchApi<Invoice[]>(
          `/api/finance/invoices?clientId=${effectiveClientId}&limit=100`,
        );
        const invoicesList =
          response.success && Array.isArray(response.data) ? response.data : [];

        let unpaid = invoicesList.filter(
          (inv: Invoice) =>
            inv.status === "issued" || inv.status === "partially_paid",
        );

        if (
          initialInvoice &&
          !unpaid.some((inv) => inv.id === initialInvoice.id)
        ) {
          unpaid = [initialInvoice, ...unpaid];
        }

        // Sort: available invoices first, fully covered invoices at the bottom
        unpaid.sort((a, b) => {
          const aCovered = isInvoiceFullyCoveredInOtherReceipt(a);
          const bCovered = isInvoiceFullyCoveredInOtherReceipt(b);
          if (aCovered === bCovered) return 0;
          return aCovered ? 1 : -1;
        });

        setInvoices(unpaid);

        const initialAllocations: Record<
          string,
          { selected: boolean; amount: string }
        > = {};

        unpaid.forEach((inv: Invoice) => {
          const allowable = getInvoiceAllowableBalance(inv);
          const isCovered = allowable <= 0;
          const existingAlloc = receiptToEdit?.allocations.find(
            (ri) => ri.invoiceId === inv.id,
          );
          const isInitialTarget =
            initialInvoice && initialInvoice.id === inv.id;

          if (existingAlloc) {
            initialAllocations[inv.id] = {
              selected: true,
              amount: existingAlloc.amount.toString(),
            };
          } else if (isInitialTarget && !isCovered) {
            initialAllocations[inv.id] = {
              selected: true,
              amount: allowable.toString(),
            };
          } else {
            initialAllocations[inv.id] = {
              selected: false,
              amount: isCovered ? "0" : allowable.toString(),
            };
          }
        });
        setAllocations(initialAllocations);
      } catch (err) {
        toast({
          title: "Error Loading Invoices",
          description: "Could not fetch outstanding client invoices.",
          variant: "destructive",
        });
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadClientInvoices();
  }, [open, selectedClientId, billingType, receiptToEdit, initialInvoice]);

  const totalAmount = Object.entries(allocations).reduce((sum, [_, alloc]) => {
    if (alloc.selected) {
      return sum + (parseFloat(alloc.amount) || 0);
    }
    return sum;
  }, 0);

  const amountInWords = convertAmountToWords(totalAmount);

  const handleToggleInvoice = (invoiceId: string, checked: boolean) => {
    const targetInv = invoices.find((i) => i.id === invoiceId);
    if (targetInv && isInvoiceFullyCoveredInOtherReceipt(targetInv)) {
      toast({
        title: "Invoice Already Covered",
        description: `Invoice ${targetInv.invoiceNumber} is already fully allocated in an active receipt voucher. Issuing another receipt on this invoice is not allowable.`,
        variant: "destructive",
      });
      return;
    }

    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        selected: checked,
      },
    }));

    if (checked && billingType === "individual" && !recipientName.trim()) {
      const candName = targetInv?.clientName || targetInv?.client;
      if (candName && candName.toLowerCase() !== "individual candidate") {
        setRecipientName(candName);
      }
    }
  };

  const handleAllocationAmountChange = (invoiceId: string, value: string) => {
    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        amount: value,
      },
    }));
  };

  const handleAllocationDiscountChange = (invoiceId: string, value: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    const allowable = inv ? getInvoiceAllowableBalance(inv) : 0;
    const discNum = parseFloat(value) || 0;

    setAllocations((prev) => {
      const currentAlloc = prev[invoiceId];
      if (!currentAlloc) return prev;

      let newAmount = currentAlloc.amount;
      const currentPaid = parseFloat(currentAlloc.amount) || 0;
      const oldDisc = parseFloat(currentAlloc.discountWriteOff || "0") || 0;

      if (allowable > 0) {
        if (discNum > 0) {
          // If payment was previously full balance OR payment + discount exceeds allowable:
          // automatically adjust payment to the remaining amount after discount
          if (
            Math.abs(currentPaid - allowable) < 0.01 ||
            currentPaid + discNum > allowable
          ) {
            const adjustedPayment = Math.max(
              0,
              Number((allowable - discNum).toFixed(2)),
            );
            newAmount = adjustedPayment.toString();
          }
        } else {
          // If discount was cleared and previous payment was the discounted amount, restore to full allowable
          if (Math.abs(currentPaid + oldDisc - allowable) < 0.01) {
            newAmount = allowable.toString();
          }
        }
      }

      return {
        ...prev,
        [invoiceId]: {
          ...currentAlloc,
          amount: newAmount,
          discountWriteOff: value,
        },
      };
    });
  };

  const totalDiscountWriteOff = Object.entries(allocations).reduce(
    (sum, [_, alloc]) => {
      if (alloc.selected) {
        return sum + (parseFloat(alloc.discountWriteOff || "0") || 0);
      }
      return sum;
    },
    0,
  );

  const handleSave = async (isConfirm: boolean = false) => {
    if (billingType === "company" && !selectedClientId) {
      toast({
        title: "Validation Error",
        description: "Please select a client company.",
        variant: "destructive",
      });
      return;
    }
    if (billingType === "individual" && !recipientName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter or select a candidate / recipient name.",
        variant: "destructive",
      });
      return;
    }
    if (totalAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Total receipt amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      const invoiceAllocations = Object.entries(allocations)
        .filter(([_, alloc]) => alloc.selected)
        .map(([invoiceId, alloc]) => {
          const inv = invoices.find((i) => i.id === invoiceId);
          const allowable = inv ? getInvoiceAllowableBalance(inv) : 0;
          const val = parseFloat(alloc.amount) || 0;
          const disc = parseFloat(alloc.discountWriteOff || "0") || 0;

          if (val <= 0 && disc <= 0) {
            throw new Error(
              `Allocation amount or discount for invoice ${inv?.invoiceNumber} must be greater than 0.`,
            );
          }
          if (allowable <= 0) {
            throw new Error(
              `Invoice ${inv?.invoiceNumber} is already fully covered in an active receipt voucher. Issuing another receipt on this invoice is not allowable.`,
            );
          }
          if (val + disc > allowable + 0.01) {
            throw new Error(
              `Total settlement (${(val + disc).toFixed(2)} AED) for invoice ${inv?.invoiceNumber} exceeds allowable remaining balance of ${allowable.toFixed(2)} AED.`,
            );
          }

          return {
            invoiceId,
            amount: val,
            discountWriteOff: disc > 0 ? disc : undefined,
          };
        });

      if (invoiceAllocations.length === 0) {
        toast({
          title: "Validation Error",
          description: "Select at least one invoice to settle.",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      const url = receiptToEdit
        ? `/api/finance/receipts/${receiptToEdit.id}`
        : "/api/finance/receipts";
      const method = receiptToEdit ? "PUT" : "POST";

      const response = await fetchApi<any>(url, {
        method,
        body: JSON.stringify({
          clientId:
            billingType === "individual"
              ? selectedClientId || "individual"
              : selectedClientId,
          billingType,
          recipientName:
            billingType === "individual" ? recipientName.trim() : undefined,
          paymentDate,
          amount: totalAmount,
          amountInWords,
          paymentMethod,
          referenceNo: referenceNo.trim() || null,
          drawnOnBank: drawnOnBank.trim() || null,
          notes: notes.trim() || null,
          invoices: invoiceAllocations,
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to save receipt draft.");
      }

      toast({
        title: receiptToEdit ? "Draft Updated" : "Draft Saved",
        description: `Receipt Voucher #${response.data.receiptNumber || ""} draft successfully recorded.`,
      });

      await queryClient.invalidateQueries({ queryKey: ["billing"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Transaction Failed",
        description: err.message || "Failed to record receipt.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FormDialog
        open={open}
        onCloseAttempt={onClose}
        title={
          receiptToEdit
            ? "Edit Receipt Voucher Draft"
            : "Record New Receipt Voucher"
        }
        description="Record client payment receipt allocations to outstanding invoices"
        icon={Building2}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        maxWidth="max-w-4xl"
        customFooter={
          <div className="p-5 border-t border-border flex justify-end gap-3 bg-muted/15 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || totalAmount <= 0}
              onClick={() => handleSave()}
              className="h-9 px-4 text-xs font-semibold shadow-sm gap-1"
            >
              {saving
                ? "Saving..."
                : receiptToEdit
                  ? "Update Draft"
                  : "Save as Draft"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Recipient Type Selector (Company vs Individual) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Receipt Recipient Type *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!!receiptToEdit || !!initialInvoice}
                onClick={() => {
                  setBillingType("company");
                  setSelectedClientId("");
                  setRecipientName("");
                  setInvoices([]);
                  setAllocations({});
                }}
                className={cn(
                  "flex items-center justify-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all",
                  billingType === "company"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/30 text-muted-foreground",
                  (!!receiptToEdit || !!initialInvoice) &&
                    "opacity-75 cursor-not-allowed",
                )}
              >
                <Building2
                  className={cn(
                    "w-4 h-4",
                    billingType === "company"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span>Company (B2B)</span>
              </button>

              <button
                type="button"
                disabled={!!receiptToEdit || !!initialInvoice}
                onClick={() => {
                  setBillingType("individual");
                  setSelectedClientId("individual");
                  setRecipientName("");
                  setInvoices([]);
                  setAllocations({});
                }}
                className={cn(
                  "flex items-center justify-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all",
                  billingType === "individual"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-500/30"
                    : "border-border hover:bg-muted/30 text-muted-foreground",
                  (!!receiptToEdit || !!initialInvoice) &&
                    "opacity-75 cursor-not-allowed",
                )}
              >
                <User
                  className={cn(
                    "w-4 h-4",
                    billingType === "individual"
                      ? "text-emerald-500"
                      : "text-muted-foreground",
                  )}
                />
                <span>Individual Candidate (B2C)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {billingType === "company" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label htmlFor="client-select">Client / Company *</Label>
                  {clientsWithUnpaid.length > 0 &&
                    !receiptToEdit &&
                    !initialInvoice && (
                      <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/70 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setOnlyUnpaidFilter(true)}
                          className={cn(
                            "px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1",
                            onlyUnpaidFilter
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>
                            Unpaid Invoices ({clientsWithUnpaid.length})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOnlyUnpaidFilter(false)}
                          className={cn(
                            "px-2 py-0.5 rounded-md font-medium transition-all",
                            !onlyUnpaidFilter
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span>All ({corporateClients.length})</span>
                        </button>
                      </div>
                    )}
                </div>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  disabled={!!receiptToEdit || !!initialInvoice}
                >
                  <SelectTrigger id="client-select">
                    <SelectValue placeholder="Select Client Company" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg max-h-56">
                    {displayedReceiptClients.map((c) => {
                      const pending = pendingReceipts[c.id];
                      const pendingCount = pending?.count || 0;
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="truncate">{c.companyName}</span>
                            {pendingCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                {pendingCount} unpaid ({formatAED(pending.totalBalance)})
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {onlyUnpaidFilter && clientsWithUnpaid.length === 0 && (
                  <p className="text-[11px] text-muted-foreground flex items-center justify-between pt-0.5">
                    <span>No clients currently have outstanding unpaid invoices.</span>
                    <button
                      type="button"
                      onClick={() => setOnlyUnpaidFilter(false)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Show all clients ({corporateClients.length})
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="recipient-name">
                  Candidate / Recipient Name *
                </Label>
                <Input
                  id="recipient-name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Jamshaid Iqbal"
                  disabled={!!receiptToEdit}
                  className="font-medium"
                />
                {invoices.length > 0 && !initialInvoice && !recipientName && (
                  <p className="text-[11px] text-muted-foreground">
                    Selecting an invoice below will auto-fill the candidate
                    name.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date (Date Paid) *</Label>
              <CustomCalendar
                value={paymentDate}
                onChange={(date: Date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  setPaymentDate(`${year}-${month}-${day}`);
                }}
                placeholder="Select payment date"
                className="h-10 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as any)}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    Bank Transfer / EFT
                  </SelectItem>
                  <SelectItem value="ONLINE">Online Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between h-6">
                <Label className="text-xs font-semibold">Receipt Number</Label>
                {isDeveloper && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[11px] px-1 text-amber-600 hover:text-amber-700 font-semibold gap-1"
                    onClick={() => setShowUpdateSeqDialog(true)}
                  >
                    Edit Sequence
                  </Button>
                )}
              </div>
              <Input
                type="text"
                readOnly
                value={`Auto: ${nextReceiptNum}`}
                className="bg-muted/50 font-mono text-xs font-semibold text-muted-foreground"
              />
              {isDeveloper && (
                <p className="text-[10px] text-amber-600/90 font-medium">
                  Will be assigned:{" "}
                  <span className="font-mono font-bold text-primary">
                    {nextReceiptNum}
                  </span>
                </p>
              )}
            </div>

            {(paymentMethod === "CHEQUE" ||
              paymentMethod === "BANK_TRANSFER") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ref-no">
                    {paymentMethod === "CHEQUE"
                      ? "Cheque Number"
                      : "Transaction Reference No."}
                  </Label>
                  <Input
                    id="ref-no"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. CHQ-92812"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank">Drawn on Bank</Label>
                  <Input
                    id="bank"
                    value={drawnOnBank}
                    onChange={(e) => setDrawnOnBank(e.target.value)}
                    placeholder="e.g. Emirates NBD"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Settle Outstanding Invoices
            </h3>

            {loadingInvoices ? (
              <div className="text-center py-6 text-sm text-muted-foreground italic">
                Loading outstanding invoices...
              </div>
            ) : billingType === "company" && !selectedClientId ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground italic bg-muted/20">
                Please select a client above to retrieve outstanding invoices.
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground italic bg-muted/10">
                {billingType === "individual"
                  ? "No outstanding individual candidate invoices found."
                  : "No outstanding invoices found for this client!"}
              </div>
            ) : (
              <div className="border border-border rounded-lg bg-card/30 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border font-semibold text-muted-foreground">
                      <th className="p-2.5 w-10 text-center">Select</th>
                      <th className="p-2.5">Invoice Details</th>
                      <th className="p-2.5 text-right">Invoice Total</th>
                      <th className="p-2.5 text-right">Due Balance</th>
                      <th className="p-2.5 text-right w-32">Payment (AED)</th>
                      <th className="p-2.5 text-right w-36">Discount / Round-off</th>
                      <th className="p-2.5 text-right w-36">Status After Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoices.map((inv) => {
                      const allowable = getInvoiceAllowableBalance(inv);
                      const isCovered = allowable <= 0;
                      const alloc = allocations[inv.id] || {
                        selected: false,
                        amount: "0",
                      };

                      const otherReceipts = (inv.pendingReceipts || []).filter(
                        (pr) =>
                          !receiptToEdit || pr.receiptId !== receiptToEdit.id,
                      );
                      const coveredByStr = otherReceipts
                        .map((pr) => pr.receiptNumber)
                        .join(", ");

                      const paid = parseFloat(alloc.amount) || 0;
                      const disc = parseFloat(alloc.discountWriteOff || "0") || 0;
                      const remainingAfter = Math.max(
                        0,
                        Number((allowable - paid - disc).toFixed(2)),
                      );
                      const isOverLimit = paid + disc > allowable + 0.01;
                      const isFullySettled =
                        alloc.selected &&
                        !isCovered &&
                        !isOverLimit &&
                        remainingAfter === 0 &&
                        (paid > 0 || disc > 0);
                      const isPartiallySettled =
                        alloc.selected &&
                        !isCovered &&
                        !isOverLimit &&
                        remainingAfter > 0 &&
                        (paid > 0 || disc > 0);

                      const roundOffDiff = Math.max(
                        0,
                        Number((allowable - paid).toFixed(2)),
                      );

                      return (
                        <tr
                          key={inv.id}
                          className={cn(
                            "transition-colors",
                            isCovered
                              ? "bg-muted/30 opacity-65"
                              : alloc.selected
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "hover:bg-muted/20",
                          )}
                        >
                          <td className="p-2.5 text-center">
                            <Checkbox
                              checked={alloc.selected}
                              disabled={isCovered}
                              onCheckedChange={(checked) =>
                                handleToggleInvoice(inv.id, !!checked)
                              }
                            />
                          </td>
                          <td className="p-2.5 font-medium">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={cn(
                                    isCovered &&
                                      "text-muted-foreground line-through decoration-muted-foreground/40",
                                  )}
                                >
                                  {inv.invoiceNumber}
                                </span>
                                {isCovered && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                    <Lock className="w-2.5 h-2.5" />
                                    Allocated in {coveredByStr || "Receipt"}
                                  </span>
                                )}
                                {!isCovered &&
                                inv.committedAmount &&
                                inv.committedAmount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    Partially in {coveredByStr}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-normal">
                                {inv.dueDate && <span>Due: {inv.dueDate}</span>}
                                {billingType === "individual" &&
                                  (inv.clientName || inv.client) && (
                                    <span>• {inv.clientName || inv.client}</span>
                                  )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {parseFloat(inv.totalAmount as any).toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {isCovered ? (
                              <span className="text-muted-foreground text-[11px] italic">
                                0.00 (Covered)
                              </span>
                            ) : (
                              <span className="font-semibold text-warning">
                                {allowable.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              disabled={!alloc.selected || isCovered}
                              className="h-7 text-xs font-semibold text-right font-mono w-28 ml-auto bg-background"
                              placeholder="0.00"
                              value={alloc.amount}
                              onChange={(e) =>
                                handleAllocationAmountChange(
                                  inv.id,
                                  e.target.value.replace(/[^0-9.]/g, ""),
                                )
                              }
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 justify-end w-full">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  disabled={!alloc.selected || isCovered}
                                  className="h-7 text-xs font-semibold text-right font-mono w-24 bg-background border-border"
                                  placeholder="0.00"
                                  value={alloc.discountWriteOff || ""}
                                  onChange={(e) =>
                                    handleAllocationDiscountChange(
                                      inv.id,
                                      e.target.value.replace(/[^0-9.]/g, ""),
                                    )
                                  }
                                />
                                {parseFloat(alloc.discountWriteOff || "0") > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAllocationDiscountChange(inv.id, "0")
                                    }
                                    className="text-muted-foreground hover:text-foreground text-[10px] px-0.5"
                                    title="Clear discount"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              {/* Quick 1-click round-off button */}
                              {alloc.selected &&
                                !isCovered &&
                                !parseFloat(alloc.discountWriteOff || "0") &&
                                roundOffDiff > 0 &&
                                roundOffDiff <= 50 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAllocationDiscountChange(
                                        inv.id,
                                        roundOffDiff.toString(),
                                      )
                                    }
                                    className="text-[10px] text-primary hover:underline font-semibold bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                                  >
                                    + {roundOffDiff} Round-off
                                  </button>
                                )}
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            {isCovered ? (
                              <span className="text-muted-foreground text-[11px] italic">
                                Fully Covered
                              </span>
                            ) : !alloc.selected ? (
                              <span className="text-muted-foreground font-mono text-[11px]">
                                {allowable.toFixed(2)} AED
                              </span>
                            ) : isOverLimit ? (
                              <span className="text-[10px] text-destructive font-semibold">
                                Exceeds balance!
                              </span>
                            ) : isFullySettled ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Fully Paid
                              </span>
                            ) : isPartiallySettled ? (
                              <div className="text-right">
                                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                                  {remainingAfter.toFixed(2)} AED
                                </span>
                                <span className="block text-[9px] text-muted-foreground uppercase font-medium">
                                  Partially Paid
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-mono text-[11px]">
                                {allowable.toFixed(2)} AED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalAmount > 0 && (
            <div className="p-4 border rounded-lg bg-primary/5 space-y-3 border-primary/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2 border-b border-primary/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Actual Received (Receipt Total)
                  </span>
                  <span className="text-lg font-bold font-mono text-primary">
                    {formatAED(totalAmount, true)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Settlement Discount / Round-off
                  </span>
                  <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
                    {totalDiscountWriteOff > 0
                      ? `-${formatAED(totalDiscountWriteOff)}`
                      : "0.00 AED"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Total Invoice Debt Settled
                  </span>
                  <span className="text-base font-bold font-mono text-foreground">
                    {formatAED(totalAmount + totalDiscountWriteOff)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground italic leading-relaxed pt-0.5">
                <strong>Amount in words:</strong> AED {amountInWords}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Internal Notes / Remarks
              </Label>
              <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded font-medium">
                Confidential • Not shown on receipt slip
              </span>
            </div>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via bank transfer, confirmed by finance department"
            />
            <p className="text-[11px] text-muted-foreground">
              This note is strictly for internal understanding and will never
              appear on the customer's receipt voucher slip.
            </p>
          </div>
        </div>
      </FormDialog>

      <UpdateSequenceDialog
        open={showUpdateSeqDialog}
        onOpenChange={setShowUpdateSeqDialog}
        sequenceType="receipt"
        onSuccess={loadNextReceiptNumber}
      />
    </>
  );
}
export default AddReceiptDialog;
