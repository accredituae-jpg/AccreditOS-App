import { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid } from "@/components/ui/stats-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useClients } from "../hooks/useClients";
import { useClientActions } from "../hooks/useClientActions";
import { ClientTable, ClientGrid } from "../components";
import {
  AddClientDialog,
  EditClientDrawer,
  ClientDetailsDialog,
  AddQuotationDialog,
  QuotationPreviewDialog,
} from "../dialogs";
import type { Client } from "../types/client.types";
import type { Quotation } from "../types/quotation.types";
import { getStoredViewPreference, setStoredViewPreference, subscribeViewPreference, ViewMode } from "@/lib/viewPreference";

export default function ClientsPage() {
  const isMobile = useIsMobile();

  const {
    filteredClients,
    paginatedClients,
    totalPages,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    statsItems,
    canCreateClient,
    canViewClientDetails,
    canEditClient,
    canDeleteClient,
    loading,
    refresh,
  } = useClients();

  const { handleToggleArchive, handleDeleteClient } = useClientActions();

  // Selected item states for dialogs
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
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

  const handleEditClickFromDetail = (client: Client) => {
    setViewClient(null);
    setEditClient(client);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Clients"
        description="Manage client accounts, profiles, and invoicing information"
        actions={
          canCreateClient && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowQuotationModal(true)}
                className="gap-2 w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs h-9"
              >
                <FileText className="w-4 h-4" />
                New Quotation
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="gap-2 w-full sm:w-auto text-xs h-9 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </div>
          )
        }
      />

      {/* Stats Cards */}
      <StatsGrid items={statsItems} columns={3} />

      {/* Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search clients by name, contact, or TRN..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { value: "all", label: "All Status" },
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
        ]}
        view={isMobile ? undefined : view}
        onViewChange={handleViewChange}
      />

      {/* List View */}
      {effectiveView === "list" && (
        <ClientTable
          paginatedClients={paginatedClients}
          canViewDetails={canViewClientDetails}
          canEdit={canEditClient}
          canDelete={canDeleteClient}
          onViewDetails={setViewClient}
          onEdit={setEditClient}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDeleteClient}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          loading={loading}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Grid View */}
      {effectiveView === "grid" && (
        <ClientGrid
          paginatedClients={paginatedClients}
          canViewDetails={canViewClientDetails}
          canEdit={canEditClient}
          canDelete={canDeleteClient}
          onViewDetails={setViewClient}
          onEdit={setEditClient}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDeleteClient}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          loading={loading}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Client Detail Dialog */}
      <ClientDetailsDialog
        client={viewClient}
        onClose={() => setViewClient(null)}
        onEditClick={handleEditClickFromDetail}
      />

      {/* Add Client Dialog */}
      <AddClientDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={refresh}
      />

      {/* Edit Client Drawer */}
      <EditClientDrawer
        client={editClient}
        onClose={() => setEditClient(null)}
        onSuccess={refresh}
      />

      {/* New Quotation Dialog (Can create for any prospect without adding client) */}
      <AddQuotationDialog
        open={showQuotationModal}
        onOpenChange={setShowQuotationModal}
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
    </div>
  );
}
