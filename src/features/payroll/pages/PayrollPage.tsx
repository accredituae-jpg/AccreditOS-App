import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCcw, Filter, FileText, Users, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { StatsGrid } from "@/components/ui/stats-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiDeleteSalaryAdvance } from "@/lib/api";

import { useIsMobile } from "@/hooks/use-mobile";
import { usePayroll } from "../hooks/usePayroll";
import { usePayrollActions } from "../hooks/usePayrollActions";
import {
  PayrollTable,
  SalaryProfileTable,
  PayrollCard,
  SalaryProfileCard,
  SalaryAdvanceTable,
  SalaryAdvanceCard,
  BulkPayrollEntry,
} from "../components";
import {
  SalaryProfileDialog,
  EditPayrollNotesDialog,
  SalaryProfileDetailsDialog,
  PayrollDetailsDialog,
  SalaryAdvanceDialog,
  GeneratePayrollDialog,
} from "../dialogs";
import type { PayrollRecord, SalaryProfile } from "../types/payroll.types";

export default function PayrollPage() {
  const { toast } = useToast();
  const {
    records,
    salaryProfiles,
    employees,
    advances,
    loading,
    salaryProfilesLoading,
    advancesLoading,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    userFilter,
    setUserFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    pageRecords,
    pageProfiles,
    pageAdvances,
    statsItems,
    view,
    setView,
    yearOptions,
    canViewPayroll,
    canManagePayroll,
    loadPayrollData,
  } = usePayroll();

  const isMobile = useIsMobile();
  const effectiveView = isMobile ? "grid" : view;

  const {
    handleGeneratePayroll,
    handleUpdateNotes,
    handleApprovePayroll,
    handlePayPayroll,
    handleCancelPayroll,
    handleDeletePayroll,
    handleCreateSalaryProfile,
    handleUpdateSalaryProfile,
  } = usePayrollActions({ onRefresh: loadPayrollData });

  const [showFilters, setShowFilters] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SalaryProfile | null>(null);
  const [viewProfileDetails, setViewProfileDetails] = useState<SalaryProfile | null>(null);
  const [viewPayrollDetails, setViewPayrollDetails] = useState<PayrollRecord | null>(null);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const handleOpenNotesDialog = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setNoteDialogOpen(true);
  };

  const handleOpenProfileDialog = (profile: SalaryProfile | null = null) => {
    setSelectedProfile(profile);
    setProfileDialogOpen(true);
  };

  const handleDeleteAdvance = async (id: string) => {
    try {
      const res = await apiDeleteSalaryAdvance(id);
      if (res.success) {
        toast({
          title: "Advance Deleted",
          description: "Salary advance successfully deleted.",
        });
        loadPayrollData();
      } else {
        toast({
          title: "Failed to Delete",
          description: res.message || res.errors?.[0] || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  if (!canViewPayroll) {
    return (
      <div className="page-container">
        <PageHeader
          title="Payroll"
          description="You do not have permission to view payroll data."
        />
      </div>
    );
  }

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Payroll"
        description="Manage payroll, salary profiles, adjustments, and advances."
        actions={
          canManagePayroll ? (
            activeTab === "records" ? (
              <Button
                onClick={() => setGenerateDialogOpen(true)}
                className="gap-2 w-full sm:w-auto bg-primary text-white"
              >
                Generate Payroll
              </Button>
            ) : activeTab === "profiles" ? (
              <Button
                onClick={() => handleOpenProfileDialog(null)}
                className="gap-2 w-full sm:w-auto bg-primary text-white"
              >
                <Plus className="w-4 h-4" />
                Add Profile
              </Button>
            ) : activeTab === "advances" ? (
              <Button
                onClick={() => setAdvanceDialogOpen(true)}
                className="gap-2 w-full sm:w-auto bg-primary text-white"
              >
                <Plus className="w-4 h-4" />
                Record Advance
              </Button>
            ) : null
          ) : null
        }
      />

      <StatsGrid items={statsItems} />

      <SearchFilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder={
          activeTab === "profiles"
            ? "Search salary profiles..."
            : activeTab === "advances"
            ? "Search salary advances..."
            : "Search payroll..."
        }
        filterValue={activeTab === "records" ? statusFilter : undefined}
        onFilterChange={
          activeTab === "records"
            ? (val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }
            : undefined
        }
        filterOptions={
          activeTab === "records"
            ? [
                { value: "all", label: "All statuses" },
                { value: "draft", label: "Draft" },
                { value: "approved", label: "Approved" },
                { value: "paid", label: "Paid" },
              ]
            : undefined
        }
        filterWidth="w-full sm:w-48"
        view={isMobile ? undefined : view}
        onViewChange={setView}
      />

      {(activeTab === "records" || activeTab === "advances") && showFilters && (
        <div className="grid gap-3 sm:grid-cols-3 mt-4 card-elevated p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Month
            </span>
            <Select
              value={monthFilter}
              onValueChange={(val) => {
                setMonthFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-background h-10">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {MONTH_NAMES.map((label, index) => (
                  <SelectItem key={label} value={(index + 1).toString()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Year
            </span>
            <Select
              value={yearFilter}
              onValueChange={(val) => {
                setYearFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-background h-10">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {yearOptions.length > 0 ? (
                  yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year.toString()}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={new Date().getFullYear().toString()}>
                    {new Date().getFullYear().toString()}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Employee
            </span>
            <Select
              value={userFilter}
              onValueChange={(val) => {
                setUserFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full bg-background h-10">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as any);
          setCurrentPage(1);
        }}
        className="w-full mt-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="card-elevated overflow-hidden bg-card"
        >
          <div className="border-b border-border p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-card/50">
            <TabsList className="bg-transparent p-0 gap-4 sm:gap-6 h-auto justify-start border-0 rounded-none w-full max-w-full overflow-x-auto scrollbar-none flex-nowrap shrink-0 pb-1">
              <TabsTrigger
                value="records"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm shrink-0 whitespace-nowrap"
              >
                Payroll records
              </TabsTrigger>
              <TabsTrigger
                value="profiles"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm shrink-0 whitespace-nowrap"
              >
                Salary profiles
              </TabsTrigger>
              <TabsTrigger
                value="advances"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm shrink-0 whitespace-nowrap"
              >
                Salary advances
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium text-sm shrink-0 whitespace-nowrap"
              >
                Bulk Entry Grid
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {(activeTab === "records" || activeTab === "advances") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFilters((open) => !open)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? "Hide Filters" : "Filters"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadPayrollData()}
                className="gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <TabsContent value="records" className="mt-0">
            {loading ? (
              <div className="grid gap-4 p-4 md:p-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pageRecords.length === 0 ? (
              <div className="p-6 md:p-8">
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No Payroll Records Found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Click "Generate Payroll" in the top header to run payroll for the selected month.
                  </p>
                </div>
              </div>
            ) : effectiveView === "list" ? (
              <PayrollTable
                records={pageRecords}
                permissions={{
                  canView: canViewPayroll,
                  canManage: canManagePayroll,
                }}
                actions={{
                  onApprove: handleApprovePayroll,
                  onPay: handlePayPayroll,
                  onCancel: handleCancelPayroll,
                  onDelete: handleDeletePayroll,
                }}
                onView={setViewPayrollDetails}
                openNotesDialog={handleOpenNotesDialog}
              />
            ) : (
              <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageRecords.map((record, idx) => (
                  <PayrollCard
                    key={record.id}
                    record={record}
                    index={idx}
                    permissions={{
                      canView: canViewPayroll,
                      canManage: canManagePayroll,
                    }}
                    actions={{
                      onApprove: handleApprovePayroll,
                      onPay: handlePayPayroll,
                      onCancel: handleCancelPayroll,
                      onDelete: handleDeletePayroll,
                    }}
                    onView={setViewPayrollDetails}
                    openNotesDialog={handleOpenNotesDialog}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profiles" className="mt-0">
            {salaryProfilesLoading ? (
              <div className="grid gap-4 p-4 md:p-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                    <Skeleton className="h-5 w-24" />
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pageProfiles.length === 0 ? (
              <div className="p-6 md:p-8">
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No Salary Profiles Available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Click "Add Profile" in the top header to configure employee salary profiles.
                  </p>
                </div>
              </div>
            ) : effectiveView === "list" ? (
              <SalaryProfileTable
                profiles={pageProfiles}
                onEdit={handleOpenProfileDialog}
                onView={setViewProfileDetails}
              />
            ) : (
              <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageProfiles.map((profile, idx) => (
                  <SalaryProfileCard
                    key={profile.id}
                    profile={profile}
                    index={idx}
                    onEdit={handleOpenProfileDialog}
                    onView={setViewProfileDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="advances" className="mt-0">
            {advancesLoading ? (
              <div className="grid gap-4 p-4 md:p-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                    <Skeleton className="h-5 w-24" />
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pageAdvances.length === 0 ? (
              <div className="p-6 md:p-8">
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
                  <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No Salary Advances Recorded</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Click "Record Advance" in the top header to log an advance payout.
                  </p>
                </div>
              </div>
            ) : effectiveView === "list" ? (
              <SalaryAdvanceTable
                advances={pageAdvances}
                onDelete={handleDeleteAdvance}
                canManage={canManagePayroll}
              />
            ) : (
              <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageAdvances.map((adv, idx) => (
                  <SalaryAdvanceCard
                    key={adv.id}
                    advance={adv}
                    index={idx}
                    onDelete={handleDeleteAdvance}
                    canManage={canManagePayroll}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bulk" className="mt-0">
            <BulkPayrollEntry
              records={records}
              loading={loading}
              onRefresh={loadPayrollData}
              canManage={canManagePayroll}
            />
          </TabsContent>

          {activeTab !== "bulk" && totalPages > 1 && (
            <div className="p-4 border-t border-border bg-card/20 text-center">
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={12}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </motion.div>
      </Tabs>

      <EditPayrollNotesDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        record={selectedPayroll}
        onSave={handleUpdateNotes}
      />

      <SalaryProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profile={selectedProfile}
        employees={employees}
        salaryProfiles={salaryProfiles}
        onSave={handleCreateSalaryProfile}
        onUpdate={handleUpdateSalaryProfile}
      />

      <SalaryAdvanceDialog
        open={advanceDialogOpen}
        onOpenChange={setAdvanceDialogOpen}
        employees={employees}
        onSaved={loadPayrollData}
      />

      <SalaryProfileDetailsDialog
        open={!!viewProfileDetails}
        onClose={() => setViewProfileDetails(null)}
        profile={viewProfileDetails}
        onEdit={handleOpenProfileDialog}
        canEdit={canManagePayroll}
      />

      <PayrollDetailsDialog
        open={!!viewPayrollDetails}
        onClose={() => setViewPayrollDetails(null)}
        record={viewPayrollDetails}
        permissions={{
          canView: canViewPayroll,
          canManage: canManagePayroll,
        }}
        actions={{
          onApprove: handleApprovePayroll,
          onPay: handlePayPayroll,
          onCancel: handleCancelPayroll,
          onDelete: handleDeletePayroll,
        }}
        openNotesDialog={handleOpenNotesDialog}
      />

      <GeneratePayrollDialog
        isOpen={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleGeneratePayroll}
      />
    </div>
  );
}
