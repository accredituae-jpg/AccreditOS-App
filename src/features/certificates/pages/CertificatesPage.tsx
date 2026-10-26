import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid } from "@/components/ui/stats-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { Button } from "@/components/ui/button";
import { Plus, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConfirm } from "@/context/ConfirmContext";
import { apiGetCertificateSequence, apiGetCertificates } from "@/lib/api";
import { useCertificates, useCertificateActions } from "../hooks";
import {
  CertificatesListView,
  CertificatesGridView,
  CertificatesBulkBar,
} from "../components";
import { CertificateFilterForm } from "../components/CertificateFilterForm";
import {
  IssueCertificateDialog,
  EditCertificateDialog,
  CertificateDetailDialog,
} from "../dialogs";
import { UpdateSequenceDialog } from "../dialogs/UpdateSequenceDialog";
import type { Certificate } from "../types/certificates.types";

export default function CertificatesPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const isMobile = useIsMobile();
  const {
    searchTerm,
    setSearchTerm,
    clientIdFilter,
    setClientIdFilter,
    clientOptions,
    awardingBodyFilter,
    setAwardingBodyFilter,
    statusFilter,
    setStatusFilter,
    fromCertNo,
    setFromCertNo,
    toCertNo,
    setToCertNo,
    serviceTypeFilter,
    setServiceTypeFilter,
    awardingBodiesOptions,
    selectedCertificateIds,
    toggleSelectCertificate,
    selectAllCertificates,
    clearSelectedCertificates,
    currentPage,
    setCurrentPage,
    view,
    setView,
    loading,
    totalPages,
    totalItems,
    paginatedCertificates,
    statsItems,
    canIssue,
    canViewDetails,
    canEdit,
    canDelete,
    isDeveloper,
  } = useCertificates();

  const {
    handleAddCertificate,
    handleBulkIssueCertificates,
    handleUpdateCertificate,
    handleDeleteCertificate,
    handleStatusChangeCert,
    handleBulkStatusChangeCert,
    handleDownload,
    handleDownloadPdf,
    handleBulkDownload,
  } = useCertificateActions();

  const [showAddForm, setShowAddForm] = useState(false);
  const [viewCertificate, setViewCertificate] = useState<Certificate | null>(
    null,
  );
  const [editCertificate, setEditCertificate] = useState<Certificate | null>(
    null,
  );
  const [showSequenceDialog, setShowSequenceDialog] = useState(false);
  const [nextSeqPreview, setNextSeqPreview] = useState<string>("");

  useEffect(() => {
    if (isDeveloper) {
      apiGetCertificateSequence()
        .then((res) => {
          if (res?.success && res.data) {
            setNextSeqPreview(res.data.nextNumber);
          }
        })
        .catch(() => {});
    }
  }, [isDeveloper]);

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkUpdatingAll, setBulkUpdatingAll] = useState(false);

  const activeView = isMobile ? "grid" : view;

  // Active filters count calculation
  const activeFiltersCount =
    (clientIdFilter && clientIdFilter !== "all" ? 1 : 0) +
    (awardingBodyFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (serviceTypeFilter !== "all" ? 1 : 0) +
    (fromCertNo || toCertNo ? 1 : 0);

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      clearSelectedCertificates();
    }
    setSelectionMode(!selectionMode);
  };

  const handleUpdateAllFiltered = async (newStatus: string) => {
    if (totalItems === 0 || bulkUpdatingAll) return;
    const ok = await confirm({
      title: `Update All ${totalItems} Certificates?`,
      description: `Are you sure you want to mark all ${totalItems} matching certificate(s) in the database as "${newStatus.toUpperCase()}"?`,
      confirmText: `Yes, Mark All as ${newStatus.toUpperCase()}`,
      type: "info",
    });
    if (!ok) return;

    setBulkUpdatingAll(true);
    try {
      const res = await apiGetCertificates(
        1,
        10000,
        searchTerm,
        "all",
        awardingBodyFilter,
        statusFilter,
        {
          clientId: clientIdFilter !== "all" ? clientIdFilter : undefined,
          fromCertNo,
          toCertNo,
        },
      );
      if (res.success && Array.isArray(res.data)) {
        const allMatchingIds = res.data.map((c: any) => c.id);
        await handleBulkStatusChangeCert(allMatchingIds, newStatus);
        clearSelectedCertificates();
      } else {
        throw new Error(
          res.message || "Failed to fetch matching certificates.",
        );
      }
    } catch (err: any) {
      toast({
        title: "Bulk Update Failed",
        description: err.message || "Failed to update matching certificates.",
        variant: "destructive",
      });
    } finally {
      setBulkUpdatingAll(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedCertificateIds.length === 0) return;
    await handleBulkStatusChangeCert(selectedCertificateIds, newStatus);
    clearSelectedCertificates();
    setSelectionMode(false);
  };

  const handleBulkDownloadWord = async () => {
    if (selectedCertificateIds.length === 0) return;
    let certsToDownload = paginatedCertificates.filter((c) =>
      selectedCertificateIds.includes(c.id),
    );
    if (certsToDownload.length < selectedCertificateIds.length) {
      try {
        const res = await apiGetCertificates(1, 10000);
        if (res.success && Array.isArray(res.data)) {
          const map = new Map(res.data.map((c: any) => [c.id, c]));
          certsToDownload = selectedCertificateIds
            .map((id) => map.get(id))
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("Could not fetch full certificate set:", e);
      }
    }
    await handleBulkDownload(certsToDownload, "docx");
  };

  const handleBulkDownloadPdf = async () => {
    if (selectedCertificateIds.length === 0) return;
    let certsToDownload = paginatedCertificates.filter((c) =>
      selectedCertificateIds.includes(c.id),
    );
    if (certsToDownload.length < selectedCertificateIds.length) {
      try {
        const res = await apiGetCertificates(1, 10000);
        if (res.success && Array.isArray(res.data)) {
          const map = new Map(res.data.map((c: any) => [c.id, c]));
          certsToDownload = selectedCertificateIds
            .map((id) => map.get(id))
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("Could not fetch full certificate set:", e);
      }
    }
    await handleBulkDownload(certsToDownload, "pdf");
  };

  const handleSelectAllFiltered = async () => {
    try {
      const res = await apiGetCertificates(
        1,
        10000,
        searchTerm,
        "all",
        awardingBodyFilter,
        statusFilter,
        {
          clientId: clientIdFilter !== "all" ? clientIdFilter : undefined,
          fromCertNo,
          toCertNo,
        },
      );
      if (res.success && Array.isArray(res.data)) {
        const allMatchingIds = res.data.map((c: any) => c.id);
        selectAllCertificates(allMatchingIds);
        toast({
          title: "All Certificates Selected",
          description: `Selected all ${allMatchingIds.length} certificate(s) across all pages.`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Selection Failed",
        description: err.message || "Failed to select all certificates.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container relative pb-20">
      {/* Page Header */}
      <PageHeader
        title="Certificates"
        description="Track and manage training certificates"
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {isDeveloper && (
              <Button
                onClick={() => setShowSequenceDialog(true)}
                variant="outline"
                className="gap-1.5 w-full sm:w-auto border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-mono text-xs"
                title="Developer Sequence Counter Settings"
              >
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>Next: {nextSeqPreview || "..."}</span>
              </Button>
            )}

            {canIssue && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="gap-2 w-full sm:w-auto bg-primary text-white font-semibold"
              >
                <Plus className="w-4 h-4" />
                Issue Certificate
              </Button>
            )}
          </div>
        }
      />

      {/* Stats Cards */}
      <StatsGrid items={statsItems} />

      <SearchFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search certificates..."
        selectionMode={selectionMode}
        onToggleSelectionMode={canEdit ? handleToggleSelectionMode : undefined}
        selectedCount={selectedCertificateIds.length}
        activeFiltersCount={activeFiltersCount}
        view={isMobile ? undefined : view}
        onViewChange={setView}
        filterPopoverOpen={filterPopoverOpen}
        onFilterPopoverOpenChange={setFilterPopoverOpen}
        filterPopoverContent={
          <CertificateFilterForm
            initialFromCertNo={fromCertNo}
            initialToCertNo={toCertNo}
            initialStatus={statusFilter}
            initialClientId={clientIdFilter}
            initialAwardingBody={awardingBodyFilter}
            initialServiceType={serviceTypeFilter}
            awardingBodiesOptions={awardingBodiesOptions}
            clientOptions={clientOptions}
            onApply={(applied) => {
              setFromCertNo(applied.fromCertNo);
              setToCertNo(applied.toCertNo);
              setStatusFilter(applied.statusFilter);
              setClientIdFilter(applied.clientIdFilter);
              setAwardingBodyFilter(applied.awardingBodyFilter);
              setServiceTypeFilter(applied.serviceTypeFilter);
              setCurrentPage(1);
            }}
            onClose={() => setFilterPopoverOpen(false)}
          />
        }
      />

      {/* Bulk Operations Action Bar */}
      {selectionMode && (
        <CertificatesBulkBar
          selectedCount={selectedCertificateIds.length}
          totalFilteredCount={totalItems}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelection={clearSelectedCertificates}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onUpdateAllFiltered={handleUpdateAllFiltered}
          bulkUpdatingAll={bulkUpdatingAll}
          onBulkDownloadWord={isDeveloper ? handleBulkDownloadWord : undefined}
          onBulkDownloadPdf={isDeveloper ? handleBulkDownloadPdf : undefined}
        />
      )}

      {/* Main Content: List or Grid View */}
      {activeView === "grid" ? (
        <CertificatesGridView
          paginatedCertificates={paginatedCertificates}
          loading={loading}
          selectionMode={selectionMode}
          selectedCertificateIds={selectedCertificateIds}
          onToggleSelect={toggleSelectCertificate}
          onViewDetails={
            canViewDetails ? (cert) => setViewCertificate(cert) : undefined
          }
          onEdit={canEdit ? (cert) => setEditCertificate(cert) : undefined}
          onDelete={canDelete ? handleDeleteCertificate : undefined}
          onStatusChange={canEdit ? handleStatusChangeCert : undefined}
          onDownload={isDeveloper ? handleDownload : undefined}
          onDownloadPdf={isDeveloper ? handleDownloadPdf : undefined}
          isDeveloper={isDeveloper}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
        />
      ) : (
        <CertificatesListView
          paginatedCertificates={paginatedCertificates}
          loading={loading}
          selectionMode={selectionMode}
          selectedCertificateIds={selectedCertificateIds}
          onToggleSelect={toggleSelectCertificate}
          onSelectAllPage={selectAllCertificates}
          onViewDetails={
            canViewDetails ? (cert) => setViewCertificate(cert) : undefined
          }
          onEdit={canEdit ? (cert) => setEditCertificate(cert) : undefined}
          onDelete={canDelete ? handleDeleteCertificate : undefined}
          onStatusChange={canEdit ? handleStatusChangeCert : undefined}
          onDownload={isDeveloper ? handleDownload : undefined}
          onDownloadPdf={isDeveloper ? handleDownloadPdf : undefined}
          isDeveloper={isDeveloper}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
        />
      )}

      {/* Issue Certificate Dialog */}
      <IssueCertificateDialog
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleAddCertificate}
        onBulkSubmit={handleBulkIssueCertificates}
      />

      {/* Edit Certificate Dialog */}
      {editCertificate && (
        <EditCertificateDialog
          open={!!editCertificate}
          onOpenChange={(open) => !open && setEditCertificate(null)}
          certificate={editCertificate}
          onSubmit={handleUpdateCertificate}
        />
      )}

      {/* View Certificate Details Dialog */}
      {viewCertificate && (
        <CertificateDetailDialog
          open={!!viewCertificate}
          onOpenChange={(open) => !open && setViewCertificate(null)}
          certificate={viewCertificate}
          onEdit={() => {
            setEditCertificate(viewCertificate);
            setViewCertificate(null);
          }}
          onDownload={isDeveloper ? handleDownload : undefined}
          onDownloadPdf={isDeveloper ? handleDownloadPdf : undefined}
          isDeveloper={isDeveloper}
        />
      )}

      {/* Sequence Counter Settings Dialog */}
      {showSequenceDialog && (
        <UpdateSequenceDialog
          open={showSequenceDialog}
          onOpenChange={setShowSequenceDialog}
        />
      )}
    </div>
  );
}
