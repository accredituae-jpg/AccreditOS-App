import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredViewPreference, setStoredViewPreference, subscribeViewPreference, ViewMode } from "@/lib/viewPreference";
import { motion } from "framer-motion";
import {
  Plus,
  FileText,
  Receipt as ReceiptIcon,
  DollarSign,
  Building2,
  Calendar,
  X,
  Coins,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBilling, useBillingActions } from "../hooks";
import { InvoicesTab, ExpensesTab, ReceiptsTab, VendorBillsTab, InvoicePrintTemplate, ReceiptPrintTemplate } from "../components";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getInvoiceClientDisplayName, InvoiceItemGrouping, printElement } from "../utils/billing.utils";
import {
  AddInvoiceDialog,
  EditInvoiceDialog,
  AddExpenseDialog,
  EditExpenseDialog,
  InvoiceDetailsDialog,
  InvoicePreviewDialog,
  DownloadInvoiceDialog,
  DownloadReceiptDialog,
  AddReceiptDialog,
  ReceiptDetailsDialog,
  ReceiptPreviewDialog,
  VoidReceiptDialog,
  ExpenseDetailsDialog,
  AddVendorBillDialog,
  EditVendorBillDialog,
  RecordVendorPaymentDialog,
  VendorBillDetailsDialog,
  TopUpPettyCashDialog,
  PayVendorAccountDialog,
} from "../dialogs";
import { AddQuotationDialog } from "@/features/clients/dialogs/AddQuotationDialog";
import { QuotationPreviewDialog } from "@/features/clients/dialogs/QuotationPreviewDialog";
import type { Quotation } from "@/features/clients/types/quotation.types";
import { AwardingBodyDialog, type AwardingBodyFormData } from "@/features/settings/dialogs/AwardingBodyDialog";
import { apiGetAwardingBodies, apiUpdateAwardingBody } from "@/lib/api/settingsApi";
import {
  apiUpdateVendorBillStatus,
  apiDeleteVendorBill,
  apiGetVendorSummaries,
  apiGetClientsSummary,
  type VendorSummaryItem,
} from "@/lib/api/financeApi";
import { syncWithServer } from "@/lib/sync";
import type { Invoice, Expense, Receipt, VendorBill } from "../types/billing.types";

const MONTH_OPTIONS = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYearNum = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "all", label: "All Years" },
  { value: String(currentYearNum), label: String(currentYearNum) },
  { value: String(currentYearNum - 1), label: String(currentYearNum - 1) },
  { value: String(currentYearNum - 2), label: String(currentYearNum - 2) },
];

export default function BillingPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const {
    invoices,
    expenses,
    receipts,
    clients,
    activeTab,
    handleTabChange,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loading,
    statsItems,
    statusFilterOptions,
    paginatedInvoices,
    paginatedExpenses,
    paginatedReceipts,
    vendorBills,
    invoiceTotalPages,
    expenseTotalPages,
    receiptTotalPages,
    vendorBillTotalPages,
    invoiceTotalCount,
    expenseTotalCount,
    receiptTotalCount,
    vendorBillTotalCount,
    invoicePage,
    setInvoicePage,
    expensePage,
    setExpensePage,
    receiptPage,
    setReceiptPage,
    vendorBillPage,
    setVendorBillPage,
    currentRole,
    canCreateInvoice,
    canViewInvoiceDetails,
    canEditInvoice,
    canDeleteInvoice,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    setThisMonth,
    setThisYear,
    clearDateFilter,
    refresh,
  } = useBilling();

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const isStatusFiltered = statusFilter !== "all";
  const isYearFiltered = selectedYear !== "all";
  const isMonthFiltered = selectedMonth !== "all";
  const activeFiltersCount =
    (isStatusFiltered ? 1 : 0) +
    (isYearFiltered ? 1 : 0) +
    (isMonthFiltered ? 1 : 0);

  const { toast } = useToast();

  const {
    handleAddInvoice,
    handleUpdateInvoice,
    handleToggleInvoiceStatus,
    handleCancelInvoice,
    handleDeleteInvoice,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleReturnExpense,
    handleConfirmIssueReceipt,
    handleDeleteReceiptDraft,
  } = useBillingActions();

  const [view, setViewState] = useState<ViewMode>(getStoredViewPreference());

  useEffect(() => {
    setViewState(getStoredViewPreference());
    return subscribeViewPreference((mode) => {
      setViewState(mode);
    });
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setStoredViewPreference(mode);
    setViewState(mode);
  };

  const effectiveView = isMobile ? "grid" : view;

  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [showAddVendorBill, setShowAddVendorBill] = useState(false);
  const [showTopUpPettyCash, setShowTopUpPettyCash] = useState(false);

  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [receiptToVoid, setReceiptToVoid] = useState<Receipt | null>(null);

  const [viewVendorBill, setViewVendorBill] = useState<VendorBill | null>(null);
  const [editingVendorBill, setEditingVendorBill] = useState<VendorBill | null>(null);
  const [editingVendorData, setEditingVendorData] = useState<AwardingBodyFormData | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [payVendorBill, setPayVendorBill] = useState<VendorBill | null>(null);
  const [payVendorAccount, setPayVendorAccount] = useState<VendorSummaryItem | null>(null);
  const [cancelVendorBill, setCancelVendorBill] = useState<VendorBill | null>(null);
  const [deleteVendorBill, setDeleteVendorBill] = useState<VendorBill | null>(null);

  const {
    data: vendorSummariesData,
    isLoading: isVendorSummariesLoading,
    refetch: refetchVendorSummaries,
  } = useQuery({
    queryKey: ["vendor-summaries"],
    queryFn: async () => {
      const res = await apiGetVendorSummaries();
      return res.data;
    },
    enabled: activeTab === "vendor-bills",
  });

  const {
    data: clientsSummaryData,
    isLoading: isClientsSummaryLoading,
    refetch: refetchClientsSummary,
  } = useQuery({
    queryKey: ["clients-summary"],
    queryFn: async () => {
      const res = await apiGetClientsSummary();
      return res.data;
    },
    enabled: activeTab === "invoices",
  });

  const handleEditVendorClick = async (vendorId: string, vendorName: string) => {
    try {
      const bodies = await apiGetAwardingBodies();
      const target = bodies.find((b: any) => b.id === vendorId || b.name === vendorName);
      if (target) {
        setEditingVendorId(target.id);
        setEditingVendorData({
          name: target.name || "",
          clientId: target.clientId || "",
          certificateFee: String(target.certificateFee || "0"),
          isSystemIssued: Boolean(target.isSystemIssued),
          trnNo: target.trnNo || "",
          phone: target.phone || "",
          email: target.email || "",
          location: target.location || "",
          poBox: target.poBox || "",
          contactPerson: target.contactPerson || "",
          paymentTerms: target.paymentTerms || "",
          isVatRegistered: target.isVatRegistered ?? true,
          vatPercent: String(target.vatPercent ?? 5),
        });
      }
    } catch (err) {
      console.error("Failed to load vendor details for edit:", err);
      toast({
        title: "Error",
        description: "Could not retrieve vendor profile for editing.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCancelVendorBill = async () => {
    if (!cancelVendorBill) return;
    try {
      const res = await apiUpdateVendorBillStatus(cancelVendorBill.id, "CANCELLED", "Cancelled by user");
      if (!res.success) throw new Error(res.message || "Failed to cancel vendor bill.");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({
        title: "Bill Cancelled",
        description: `Vendor Bill #${cancelVendorBill.billNumber} cancelled. Candidate certificates released.`,
      });
      refetchVendorSummaries();
      refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to cancel vendor bill.",
        variant: "destructive",
      });
    } finally {
      setCancelVendorBill(null);
    }
  };

  const handleConfirmDeleteVendorBill = async () => {
    if (!deleteVendorBill) return;
    try {
      const res = await apiDeleteVendorBill(deleteVendorBill.id);
      if (!res.success) throw new Error(res.message || "Failed to delete vendor bill.");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({
        title: "Bill Deleted",
        description: `Vendor Bill #${deleteVendorBill.billNumber} permanently deleted.`,
      });
      if (viewVendorBill?.id === deleteVendorBill.id) {
        setViewVendorBill(null);
      }
      refetchVendorSummaries();
      refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete vendor bill.",
        variant: "destructive",
      });
    } finally {
      setDeleteVendorBill(null);
    }
  };

  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);

  const handleRecordInvoicePayment = (invoice: Invoice) => {
    setInvoiceToPay(invoice);
    setShowAddReceipt(true);
  };

  const [downloadingInvoice, setDownloadingInvoice] = useState<{
    invoice: Invoice;
    showSeal: boolean;
  } | null>(null);

  const handleDownloadInvoicePdf = (invoice: Invoice, showSeal: boolean = true) => {
    if (downloadingInvoice) return;
    setDownloadingInvoice({ invoice, showSeal });
  };

  useEffect(() => {
    if (!downloadingInvoice) return;
    let isCancelled = false;

    const performDownload = async () => {
      try {
        // Wait for offscreen template to mount and layout
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (isCancelled) return;

        const el = document.getElementById("invoice-instant-download-area");
        if (!el) throw new Error("Offscreen print area not found");

        // Wait for all images inside el to be loaded
        const imgs = Array.from(el.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );
        if (isCancelled) return;

        if (document.fonts) {
          await document.fonts.ready;
        }

        const canvas = await html2canvas(el, {
          scale: 3.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
        });

        if (isCancelled) return;

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "SLOW");

        const targetInvoice = downloadingInvoice.invoice;
        const targetShowSeal = downloadingInvoice.showSeal;

        const clientDisplayName = getInvoiceClientDisplayName(targetInvoice);
        let clientFirstName = "";
        if (clientDisplayName) {
          const clean = clientDisplayName.replace(/[<>:"/\\|?*]/g, "").trim();
          if (clean) {
            const words = clean.split(/\s+/).filter(Boolean);
            if (words.length > 0) {
              if (
                (words[0].toLowerCase() === "al" || words[0].toLowerCase() === "el") &&
                words.length > 1
              ) {
                clientFirstName = `${words[0]} ${words[1]}`;
              } else {
                clientFirstName = words[0];
              }
            }
          }
        }

        const sealSuffix = targetShowSeal ? "" : " (Without Seal)";
        const fileName = targetInvoice.invoiceNumber
          ? clientFirstName
            ? `Tax Invoice -${clientFirstName}- ${targetInvoice.invoiceNumber}${sealSuffix}.pdf`
            : `Tax Invoice - ${targetInvoice.invoiceNumber}${sealSuffix}.pdf`
          : `Tax Invoice${sealSuffix}.pdf`;

        pdf.save(fileName);

        toast({
          title: "Download Successful",
          description: `Invoice ${targetInvoice.invoiceNumber} downloaded successfully${targetShowSeal ? "" : " (without seal)"}.`,
        });
      } catch (err) {
        console.error("Instant PDF download error:", err);
        toast({
          title: "Download Failed",
          description: "An error occurred while generating the PDF.",
          variant: "destructive",
        });
      } finally {
        if (!isCancelled) {
          setDownloadingInvoice(null);
        }
      }
    };

    performDownload();

    return () => {
      isCancelled = true;
    };
  }, [downloadingInvoice, toast]);

  useEffect(() => {
    if (!downloadingReceipt) return;
    let isCancelled = false;

    const performDownload = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (isCancelled) return;

        const el = document.getElementById("receipt-instant-download-area");
        if (!el) throw new Error("Offscreen receipt print area not found");

        const imgs = Array.from(el.querySelectorAll("img"));
        await Promise.all(
          imgs.map((img) => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );
        if (isCancelled) return;

        if (document.fonts) {
          await document.fonts.ready;
        }

        const canvas = await html2canvas(el, {
          scale: 3.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
        });

        if (isCancelled) return;

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "SLOW");

        const targetReceipt = downloadingReceipt.receipt;
        const targetShowSeal = downloadingReceipt.showSeal;
        const sealSuffix = targetShowSeal ? "" : "-without-seal";
        const fileName = `receipt-voucher-${targetReceipt.receiptNumber || "draft"}${sealSuffix}.pdf`;

        pdf.save(fileName);

        toast({
          title: "Download Successful",
          description: `Receipt voucher RV-${targetReceipt.receiptNumber || ""} downloaded successfully${targetShowSeal ? "" : " (without seal)"}.`,
        });
      } catch (err) {
        console.error("Instant receipt PDF download error:", err);
        toast({
          title: "Download Failed",
          description: "An error occurred while generating the receipt PDF.",
          variant: "destructive",
        });
      } finally {
        if (!isCancelled) {
          setDownloadingReceipt(null);
        }
      }
    };

    performDownload();

    return () => {
      isCancelled = true;
    };
  }, [downloadingReceipt, toast]);


  const invoiceActions = {
    onView: setViewInvoice,
    onPreview: setPreviewInvoice,
    onDownloadPdf: handleDownloadInvoicePdf,
    onOpenDownloadDialog: (invoice: Invoice) => setDownloadDialogInvoice(invoice),
    onEdit: setEditingInvoice,
    onDelete: handleDeleteInvoice,
    onCancel: handleCancelInvoice,
    onToggleStatus: handleToggleInvoiceStatus,
    onRecordPayment: handleRecordInvoicePayment,
  };

  const invoicePermissions = {
    canViewDetails: canViewInvoiceDetails,
    canEdit: canEditInvoice,
    canDelete: canDeleteInvoice,
  };

  const invoicePagination = {
    currentPage: invoicePage,
    totalPages: invoiceTotalPages,
    onPageChange: setInvoicePage,
  };

  const expenseActions = {
    onView: setViewExpense,
    onEdit: setEditingExpense,
    onDelete: handleDeleteExpense,
    onReturn: handleReturnExpense,
  };

  const expensePermissions = {
    canViewDetails: canViewInvoiceDetails,
    canEdit: canEditInvoice,
    canDelete: canDeleteInvoice,
    isSuperAdmin: currentRole === "super_admin",
  };

  const expensePagination = {
    currentPage: expensePage,
    totalPages: expenseTotalPages,
    onPageChange: setExpensePage,
  };

  const receiptActions = {
    onView: setViewReceipt,
    onPreview: setPreviewReceipt,
    onDownloadPdf: handleDownloadReceiptPdf,
    onOpenDownloadDialog: (receipt: Receipt) => setDownloadDialogReceipt(receipt),
    onConfirmIssue: handleConfirmIssueReceipt,
    onEditDraft: setEditingReceipt,
    onDeleteDraft: handleDeleteReceiptDraft,
    onVoidClick: (receipt: Receipt) => {
      setReceiptToVoid(receipt);
      setShowVoidDialog(true);
    },
  };

  const receiptPermissions = {
    canViewDetails: canViewInvoiceDetails,
    canCreate: canCreateInvoice,
    canEdit: canEditInvoice,
    canDelete: canDeleteInvoice,
  };

  const receiptPagination = {
    currentPage: receiptPage,
    totalPages: receiptTotalPages,
    onPageChange: setReceiptPage,
  };

  const vendorBillPagination = {
    currentPage: vendorBillPage,
    totalPages: vendorBillTotalPages,
    onPageChange: setVendorBillPage,
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Billing"
        description="Manage invoices, expenses, receipts, and vendor bills workflows."
        actions={
          (activeTab === "invoices" && canCreateInvoice && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowQuotationDialog(true)}
                className="gap-2 w-full sm:w-auto text-primary border-primary/30 hover:bg-primary/5 font-semibold text-xs h-9"
              >
                <FileText className="w-4 h-4" />
                New Quotation
              </Button>
              <Button
                onClick={() => setShowAddInvoice(true)}
                className="gap-2 w-full sm:w-auto text-xs h-9 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </div>
          )) ||
          (activeTab === "expenses" && canCreateInvoice && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowTopUpPettyCash(true)}
                className="gap-1.5 w-full sm:w-auto text-amber-600 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Coins className="w-4 h-4" />
                Top Up Petty Cash
              </Button>
              <Button
                onClick={() => setShowAddExpense(true)}
                className="gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>
          )) ||
          (activeTab === "receipts" && canCreateInvoice && (
            <Button
              onClick={() => setShowAddReceipt(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Record Receipt
            </Button>
          )) ||
          (activeTab === "vendor-bills" && canCreateInvoice && (
            <Button
              onClick={() => setShowAddVendorBill(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Create Vendor Bill
            </Button>
          ))
        }
      />

      <StatsGrid items={statsItems} loading={loading} />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={
          activeTab === "invoices"
            ? "Search invoices by #, client, TRN..."
            : activeTab === "receipts"
            ? "Search receipts by RV#, client, bank..."
            : "Search invoices, expenses, receipts, vendor bills..."
        }
        activeFiltersCount={activeFiltersCount}
        filterPopoverOpen={filterPopoverOpen}
        onFilterPopoverOpenChange={setFilterPopoverOpen}
        filterPopoverContent={
          <div className="space-y-3 p-0.5">
            {/* Status Filter */}
            {statusFilterOptions && statusFilterOptions.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val)}
                >
                  <SelectTrigger className="w-full h-8 sm:h-9 bg-white dark:bg-card border-border font-medium text-xs sm:text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-lg max-h-60">
                    {statusFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Year & Month Filters - Two in one row (for Invoices & Receipts) */}
            {(activeTab === "invoices" || activeTab === "receipts") && (
              <div className="grid grid-cols-2 gap-2">
                {/* Year Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Year
                  </label>
                  <Select
                    value={selectedYear}
                    onValueChange={(val) => setSelectedYear(val)}
                  >
                    <SelectTrigger className="w-full h-8 sm:h-9 bg-white dark:bg-card border-border font-medium text-xs sm:text-sm">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-lg">
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y.value} value={y.value}>
                          {y.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Month
                  </label>
                  <Select
                    value={selectedMonth}
                    onValueChange={(val) => {
                      setSelectedMonth(val);
                      if (val !== "all" && selectedYear === "all") {
                        setSelectedYear(String(currentYearNum));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-8 sm:h-9 bg-white dark:bg-card border-border font-medium text-xs sm:text-sm">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-lg max-h-60">
                      {MONTH_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Actions: Reset & Done */}
            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeFiltersCount === 0}
                onClick={() => {
                  setStatusFilter("all");
                  setSelectedYear("all");
                  setSelectedMonth("all");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset All
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setFilterPopoverOpen(false)}
                className="h-8 text-xs font-semibold px-4"
              >
                Done
              </Button>
            </div>
          </div>
        }
        view={isMobile ? undefined : view}
        onViewChange={handleViewChange}
      />

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-1 text-xs">
          <span className="text-muted-foreground font-medium">Filtered by:</span>
          {isStatusFiltered && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 text-[11px]">
              Status: {statusFilterOptions?.find((o) => o.value === statusFilter)?.label || statusFilter}
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="hover:text-primary/70 ml-0.5"
                title="Remove status filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(isYearFiltered || isMonthFiltered) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 text-[11px]">
              <Calendar className="w-3 h-3 mr-0.5" />
              {isMonthFiltered
                ? `${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} ${selectedYear !== "all" ? selectedYear : currentYearNum}`
                : `Year ${selectedYear}`}
              <button
                type="button"
                onClick={() => {
                  setSelectedYear("all");
                  setSelectedMonth("all");
                }}
                className="hover:text-primary/70 ml-0.5"
                title="Remove date filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setSelectedYear("all");
              setSelectedMonth("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="card-elevated overflow-hidden bg-card"
        >
          <div className="border-b border-border p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-card/50">
            <TabsList className="bg-transparent p-0 gap-4 sm:gap-6 h-auto justify-start border-0 rounded-none w-full max-w-full overflow-x-auto scrollbar-none flex-nowrap shrink-0 pb-1">
              {[
                { key: "invoices", label: "Invoices (AR)", icon: FileText, count: invoiceTotalCount },
                { key: "vendor-bills", label: "Vendor Bills (AP)", icon: Building2, count: vendorBillTotalCount },
                { key: "expenses", label: "Expenses", icon: ReceiptIcon, count: expenseTotalCount },
                { key: "receipts", label: "Receipts", icon: DollarSign, count: receiptTotalCount },
              ].map((tab) => {
                const Icon = tab.icon;
                const count = tab.count;
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm shrink-0 whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {count > 0 && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <InvoicesTab
            invoices={paginatedInvoices}
            clientsSummary={clientsSummaryData}
            loadingClients={isClientsSummaryLoading}
            searchQuery={searchQuery}
            view={effectiveView}
            actions={invoiceActions}
            permissions={invoicePermissions}
            pagination={invoicePagination}
            downloadingInvoiceId={downloadingInvoice?.invoice.id}
            loading={loading}
            onFilterByClient={(clientName) => setSearchQuery(clientName)}
          />
          <VendorBillsTab
            bills={vendorBills}
            vendorsSummary={vendorSummariesData}
            loadingVendors={isVendorSummariesLoading}
            onPayVendorAccount={setPayVendorAccount}
            view={effectiveView}
            loading={loading}
            pagination={vendorBillPagination}
            onAddClick={() => setShowAddVendorBill(true)}
            onEditBillClick={setEditingVendorBill}
            onEditVendorClick={handleEditVendorClick}
            onRecordPaymentClick={setPayVendorBill}
            onCancelBillClick={setCancelVendorBill}
            onDeleteBillClick={setDeleteVendorBill}
            onViewBillClick={setViewVendorBill}
          />
          <ExpensesTab
            expenses={paginatedExpenses}
            view={effectiveView}
            actions={expenseActions}
            permissions={expensePermissions}
            pagination={expensePagination}
            loading={loading}
          />
          <ReceiptsTab
            receipts={paginatedReceipts}
            view={effectiveView}
            actions={receiptActions}
            permissions={receiptPermissions}
            pagination={receiptPagination}
            loading={loading}
          />
        </motion.div>
      </Tabs>

      <InvoiceDetailsDialog
        invoice={viewInvoice}
        onClose={() => setViewInvoice(null)}
        onViewInvoice={(inv) => {
          setPreviewInvoice(inv);
          setViewInvoice(null);
        }}
        onEditClick={(inv) => {
          setViewInvoice(null);
          setEditingInvoice(inv);
        }}
        onRecordPayment={(inv) => {
          setViewInvoice(null);
          handleRecordInvoicePayment(inv);
        }}
      />

      
      {/* Download Invoice Dialog with Grouping & Seal choices */}
      <DownloadInvoiceDialog
        invoice={downloadDialogInvoice}
        open={!!downloadDialogInvoice}
        onOpenChange={(open) => !open && setDownloadDialogInvoice(null)}
        onDownload={({ groupBy, showSeal, showAwardingBody }) => {
          if (downloadDialogInvoice) {
            handleDownloadInvoicePdf(downloadDialogInvoice, showSeal, groupBy, showAwardingBody);
          }
        }}
        onPrint={({ groupBy, showSeal, showAwardingBody }) => {
          if (downloadDialogInvoice) {
            setPreviewInvoice(downloadDialogInvoice);
          }
        }}
        onPreview={(inv) => {
          setDownloadDialogInvoice(null);
          setPreviewInvoice(inv);
        }}
        isDownloading={!!downloadingInvoice}
      />

      {/* Download Receipt Dialog with Seal choices */}
      <DownloadReceiptDialog
        receipt={downloadDialogReceipt}
        open={!!downloadDialogReceipt}
        onOpenChange={(open) => !open && setDownloadDialogReceipt(null)}
        onDownload={({ showSeal }) => {
          if (downloadDialogReceipt) {
            handleDownloadReceiptPdf(downloadDialogReceipt, showSeal);
          }
        }}
        onPrint={({ showSeal }) => {
          if (downloadDialogReceipt) {
            setPreviewReceipt(downloadDialogReceipt);
          }
        }}
        onPreview={(rcp) => {
          setDownloadDialogReceipt(null);
          setPreviewReceipt(rcp);
        }}
        isDownloading={!!downloadingReceipt}
      />

      <InvoicePreviewDialog
        invoice={previewInvoice}
        open={!!previewInvoice}
        onOpenChange={(open) => !open && setPreviewInvoice(null)}
      />

      <AddInvoiceDialog
        open={showAddInvoice}
        onOpenChange={setShowAddInvoice}
        clients={clients}
        onAdd={handleAddInvoice}
      />

      <EditInvoiceDialog
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        clients={clients}
        onUpdate={handleUpdateInvoice}
      />

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onAdd={handleAddExpense}
      />

      <EditExpenseDialog
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdate={handleUpdateExpense}
      />

      <AddReceiptDialog
        open={showAddReceipt || !!editingReceipt}
        onClose={() => {
          setShowAddReceipt(false);
          setEditingReceipt(null);
          setInvoiceToPay(null);
        }}
        onSuccess={async () => {
          setInvoiceToPay(null);
          await queryClient.invalidateQueries({ queryKey: ["billing"] });
          await queryClient.invalidateQueries({ queryKey: ["invoices"] });
          await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          refresh();
          if (activeTab !== "receipts") {
            handleTabChange("receipts");
          }
          await syncWithServer();
        }}
        clients={clients}
        receiptToEdit={editingReceipt}
        initialInvoice={invoiceToPay}
      />

      <ReceiptDetailsDialog
        receipt={viewReceipt}
        onClose={() => setViewReceipt(null)}
        canEdit={canEditInvoice}
        onViewReceipt={(receipt) => {
          setPreviewReceipt(receipt);
          setViewReceipt(null);
        }}
        onEditClick={(receipt) => {
          setViewReceipt(null);
          setEditingReceipt(receipt);
        }}
        onVoidClick={(receipt) => {
          setViewReceipt(null);
          setReceiptToVoid(receipt);
          setShowVoidDialog(true);
        }}
      />

      <ReceiptPreviewDialog
        receipt={previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        canVoid={canEditInvoice}
        onVoidClick={(receipt) => {
          setPreviewReceipt(null);
          setReceiptToVoid(receipt);
          setShowVoidDialog(true);
        }}
      />

      <ExpenseDetailsDialog
        expense={viewExpense}
        onClose={() => setViewExpense(null)}
        canEdit={canEditInvoice}
        onEditClick={(expense) => {
          setViewExpense(null);
          setEditingExpense(expense);
        }}
      />

      <VoidReceiptDialog
        open={showVoidDialog}
        onOpenChange={setShowVoidDialog}
        receiptToVoid={receiptToVoid}
        onVoidSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ["billing"] });
          await queryClient.invalidateQueries({ queryKey: ["invoices"] });
          await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          refresh();
          await syncWithServer();
        }}
      />

      <AddVendorBillDialog
        open={showAddVendorBill}
        onOpenChange={setShowAddVendorBill}
        onSuccess={() => {
          refetchVendorSummaries();
          refresh();
        }}
      />

      <EditVendorBillDialog
        bill={editingVendorBill}
        open={!!editingVendorBill}
        onOpenChange={(open) => !open && setEditingVendorBill(null)}
        onSuccess={() => {
          refetchVendorSummaries();
          refresh();
        }}
      />

      {editingVendorData && editingVendorId && (
        <AwardingBodyDialog
          open={!!editingVendorId}
          onOpenChange={(open) => !open && setEditingVendorId(null)}
          title="Edit Vendor / Awarding Body"
          buttonText="Save Vendor Changes"
          clientsList={clients}
          data={editingVendorData}
          onDataChange={setEditingVendorData as any}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiUpdateAwardingBody(editingVendorId, {
                name: editingVendorData.name.trim(),
                clientId: editingVendorData.clientId || null,
                certificateFee: parseFloat(editingVendorData.certificateFee) || 0,
                isSystemIssued: editingVendorData.isSystemIssued,
                trnNo: editingVendorData.trnNo || null,
                phone: editingVendorData.phone || null,
                email: editingVendorData.email || null,
                location: editingVendorData.location || null,
                poBox: editingVendorData.poBox || null,
                contactPerson: editingVendorData.contactPerson || null,
                paymentTerms: editingVendorData.paymentTerms || null,
                isVatRegistered: editingVendorData.isVatRegistered,
                vatPercent: parseFloat(editingVendorData.vatPercent) || 5.0,
              });
              toast({
                title: "Vendor Updated",
                description: `Vendor "${editingVendorData.name}" has been successfully updated.`,
              });
              setEditingVendorId(null);
              setEditingVendorData(null);
              refresh();
            } catch (err: any) {
              toast({
                title: "Error",
                description: err.message || "Failed to update vendor.",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      <RecordVendorPaymentDialog
        bill={payVendorBill}
        open={!!payVendorBill}
        onOpenChange={(open) => !open && setPayVendorBill(null)}
        onSuccess={() => {
          refetchVendorSummaries();
          refresh();
        }}
      />

      <PayVendorAccountDialog
        vendor={payVendorAccount}
        open={Boolean(payVendorAccount)}
        onOpenChange={(open) => !open && setPayVendorAccount(null)}
        onSuccess={() => {
          refetchVendorSummaries();
          refresh();
        }}
      />

      <VendorBillDetailsDialog
        bill={viewVendorBill}
        onClose={() => setViewVendorBill(null)}
        onEditClick={setEditingVendorBill}
        onEditVendorClick={handleEditVendorClick}
        onRecordPaymentClick={setPayVendorBill}
        onDeleteClick={setDeleteVendorBill}
      />

      <ConfirmationDialog
        open={!!cancelVendorBill}
        onOpenChange={(open) => !open && setCancelVendorBill(null)}
        title="Cancel Vendor Bill"
        description={`Are you sure you want to cancel Vendor Bill #${cancelVendorBill?.billNumber}? Linked candidate certificates will be released back to the unbilled candidate pool for future billing.`}
        type="warning"
        confirmText="Cancel Bill"
        onConfirm={handleConfirmCancelVendorBill}
      />

      <ConfirmationDialog
        open={!!deleteVendorBill}
        onOpenChange={(open) => !open && setDeleteVendorBill(null)}
        title="Delete Vendor Bill"
        description={`Are you sure you want to permanently delete Vendor Bill #${deleteVendorBill?.billNumber}? This action cannot be undone.`}
        type="destructive"
        confirmText="Delete Bill"
        onConfirm={handleConfirmDeleteVendorBill}
      />

      <TopUpPettyCashDialog
        open={showTopUpPettyCash}
        onOpenChange={setShowTopUpPettyCash}
        onSuccess={refresh}
      />

      {/* New Quotation Dialog */}
      <AddQuotationDialog
        open={showQuotationDialog}
        onOpenChange={setShowQuotationDialog}
        onSave={(newQtn) => {
          setPreviewQuotation(newQtn);
        }}
      />

      {/* Quotation Preview & PDF Dialog */}
      <QuotationPreviewDialog
        quotation={previewQuotation}
        open={Boolean(previewQuotation)}
        onOpenChange={(open) => !open && setPreviewQuotation(null)}
      />

      {/* Hidden container for instant offscreen invoice PDF rendering */}
      {downloadingInvoice && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "800px",
            height: "1131px",
            opacity: 1,
            pointerEvents: "none",
            zIndex: -9999,
            backgroundColor: "#ffffff",
          }}
        >
          <InvoicePrintTemplate
            id="invoice-instant-download-area"
            invoice={downloadingInvoice.invoice}
            showSeal={downloadingInvoice.showSeal}
          />
        </div>
      )}
    </div>
  );
}
