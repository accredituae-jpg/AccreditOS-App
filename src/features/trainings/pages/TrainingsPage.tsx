import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsGrid } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { motion } from "framer-motion";
import {
  Plus,
  Clock,
  GraduationCap,
  ClipboardCheck,
  Layers,
  Users,
  Sun,
  ChevronRight,
  X,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { apiBulkUpdateTrainingStatus, apiGetTrainings } from "@/lib/api";
import { useTrainings, useTrainingActions } from "../hooks";
import {
  TrainingsListView,
  TrainingsCalendarView,
  TrainingsBulkBar,
} from "../components";
import {
  AddTrainingDialog,
  BulkAddTrainingDialog,
  EditTrainingDialog,
  TrainingDetailDialog,
} from "../dialogs";
import { IssueCertificateDialog } from "@/features/certificates/dialogs";
import type { Training } from "../types/trainings.types";
import type { TrainingTab } from "../store/trainings.store";

const TABS: { key: TrainingTab; label: string; icon: React.ElementType }[] = [
  { key: "today", label: "Today", icon: Sun },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "completed", label: "Completed", icon: GraduationCap },
  { key: "cancelled", label: "Cancelled", icon: X },
];

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CustomCalendar } from "@/components/ui/custom-calendar";

export default function TrainingsPage() {
  const isMobile = useIsMobile();
  const {
    activeTab,
    tabCounts,
    handleTabChange,
    paginatedTrainings,
    courses,
    clients,
    loading,
    view,
    setView,
    currentPage,
    totalPages,
    totalItems,
    handlePageChange,
    searchQuery,
    handleSearchChange,
    dateFilter,
    setDateFilter,
    serviceTypeFilter,
    setServiceTypeFilter,
    awardingBodyFilter,
    setAwardingBodyFilter,
    awardingBodiesOptions,
    calendarMonth,
    setCalendarMonth,
    daysInMonth,
    startingDay,
    getTrainingsForDate,
    awardingBodiesMap,
    canViewDetails,
    canEdit,
    canDelete,
    canCreate,
    refreshTab,
  } = useTrainings();

  const { toast } = useToast();
  const [selectedTrainingIds, setSelectedTrainingIds] = useState<string[]>([]);
  const [showIssueCertDialog, setShowIssueCertDialog] = useState(false);
  const [issueDialogInitialIds, setIssueDialogInitialIds] = useState<string[]>([]);

  const selectedDateObj = dateFilter
    ? new Date(dateFilter + "T00:00:00")
    : undefined;

  const handleDateChange = (d?: Date) => {
    if (!d) {
      setDateFilter("");
      return;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setDateFilter(`${y}-${m}-${day}`);
  };

  const hasActiveFilters =
    awardingBodyFilter !== "all" ||
    Boolean(dateFilter) ||
    serviceTypeFilter !== "all";

  const handleClearAllFilters = () => {
    setAwardingBodyFilter("all");
    setDateFilter("");
    setServiceTypeFilter("all");
  };

  const {
    handleAddTraining,
    handleUpdateTraining,
    handleDeleteTraining,
    handleStatusChangeTraining,
  } = useTrainingActions(awardingBodiesMap);

  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [viewTraining, setViewTraining] = useState<Training | null>(null);
  const [editTraining, setEditTraining] = useState<Training | null>(null);

  // Selection handlers
  const handleToggleSelect = (training: Training) => {
    setSelectedTrainingIds((prev) =>
      prev.includes(training.id)
        ? prev.filter((id) => id !== training.id)
        : [...prev, training.id],
    );
  };

  const allPageIds = paginatedTrainings.map((t) => t.id);
  const allPageSelected =
    allPageIds.length > 0 &&
    allPageIds.every((id) => selectedTrainingIds.includes(id));

  const handleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedTrainingIds((prev) =>
        prev.filter((id) => !allPageIds.includes(id)),
      );
    } else {
      setSelectedTrainingIds((prev) => [
        ...prev,
        ...allPageIds.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const handleClearSelection = () => {
    setSelectedTrainingIds([]);
  };

  const handleSelectAllFiltered = async () => {
    try {
      const res = await apiGetTrainings(
        activeTab,
        1,
        searchQuery,
        10000,
        dateFilter || undefined,
        dateFilter || undefined,
        undefined,
        serviceTypeFilter !== "all" ? serviceTypeFilter : undefined,
        undefined,
        awardingBodyFilter !== "all" ? awardingBodyFilter : undefined,
      );
      if (res.success && Array.isArray(res.data)) {
        const allMatchingIds = res.data.map((t: any) => t.id);
        setSelectedTrainingIds(allMatchingIds);
        toast({
          title: "All Trainings Selected",
          description: `Selected all ${allMatchingIds.length} training(s) across all pages.`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Selection Failed",
        description: err.message || "Failed to select all trainings.",
        variant: "destructive",
      });
    }
  };

  const handleOpenBulkIssue = () => {
    setIssueDialogInitialIds(selectedTrainingIds);
    setShowIssueCertDialog(true);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedTrainingIds.length === 0) return;
    try {
      const res = await apiBulkUpdateTrainingStatus(
        selectedTrainingIds,
        newStatus,
      );
      toast({
        title: "Status Updated",
        description: `Successfully marked ${res.data?.count || selectedTrainingIds.length} training(s) as ${newStatus}.`,
      });
      setSelectedTrainingIds([]);
      refreshTab();
    } catch (err: any) {
      toast({
        title: "Bulk Update Failed",
        description: err.message || "Failed to update training statuses.",
        variant: "destructive",
      });
    }
  };

  const onTabChange = (t: TrainingTab) => {
    setSelectedTrainingIds([]);
    handleTabChange(t);
  };

  // On mobile always use grid/calendar view
  const activeView = isMobile ? "grid" : view;
  const isCalendarView = activeView === "grid";

  const handleAddForDate = (date: string) => {
    setPrefillDate(date);
    setShowAddWizard(true);
  };

  const handleOpenAdd = () => {
    setPrefillDate(undefined);
    setShowAddWizard(true);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Trainings & Inspections"
        description="Register, schedule, and view all active client training & inspection sessions"
        actions={
          canCreate && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setIssueDialogInitialIds(selectedTrainingIds);
                  setShowIssueCertDialog(true);
                }}
                className="gap-2 flex-1 sm:flex-none border-primary/40 text-primary hover:bg-primary/10 font-medium"
              >
                <Award className="w-4 h-4" />
                Issue Certificates
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkAdd(true)}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Users className="w-4 h-4" />
                Bulk Add
              </Button>
              <Button
                onClick={handleOpenAdd}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" />
                Add Training
              </Button>
            </div>
          )
        }
      />

      {/* Stats Cards */}
      <StatsGrid
        items={[
          {
            title: "Today's Sessions",
            value: tabCounts.today,
            icon: Sun,
            color: "warning",
            description: "Trainings and sessions scheduled for today's date.",
            loading,
          },
          {
            title: "Pending",
            value: tabCounts.pending,
            icon: Clock,
            color: "warning",
            description: "Upcoming or ongoing training sessions awaiting completion.",
            loading,
          },
          {
            title: "Completed",
            value: tabCounts.completed,
            icon: GraduationCap,
            color: "success",
            description: "Successfully concluded training batches with attendance verified.",
            loading,
          },
          {
            title: "Total Trainings",
            value:
              tabCounts.pending + tabCounts.completed + tabCounts.cancelled,
            icon: Users,
            color: "info",
            description: "Total recorded training sessions across all statuses.",
            loading,
          },
        ]}
        columns={4}
      />

      {/* Search & View Toggle Bar (List | Calendar View) */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by participant, course or company..."
        activeFiltersCount={
          (awardingBodyFilter !== "all" ? 1 : 0) +
          (dateFilter ? 1 : 0) +
          (serviceTypeFilter !== "all" ? 1 : 0)
        }
        view={view}
        onViewChange={setView}
        filterPopoverContent={
          <div className="space-y-4">
            {/* Service Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Service Type
              </label>
              <Select
                value={serviceTypeFilter}
                onValueChange={(val: "all" | "training" | "inspection") =>
                  setServiceTypeFilter(val)
                }
              >
                <SelectTrigger className="w-full h-9 bg-white dark:bg-card border-border">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-lg">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>All Services</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="training">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Trainings Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inspection">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Inspections Only</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Training Date Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Specific Training Date
              </label>
              <CustomCalendar
                value={selectedDateObj}
                onChange={handleDateChange}
                placeholder="Filter by date..."
                className="w-full"
              />
            </div>

            {/* Awarding Body Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Awarding Body
              </label>
              <Select
                value={awardingBodyFilter}
                onValueChange={setAwardingBodyFilter}
              >
                <SelectTrigger className="w-full h-9 bg-white dark:bg-card border-border">
                  <SelectValue placeholder="Awarding Body" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-lg">
                  {awardingBodiesOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Active Filter Chips */}
      {(awardingBodyFilter !== "all" ||
        Boolean(dateFilter) ||
        serviceTypeFilter !== "all") && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 px-1">
          <span className="text-muted-foreground font-medium text-xs">
            Active filters:
          </span>
          {serviceTypeFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
              onClick={() => setServiceTypeFilter("all")}
            >
              {serviceTypeFilter === "training" ? (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Trainings Only</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Inspections Only</span>
                </>
              )}
              <X className="w-3 h-3 ml-0.5 hover:text-foreground" />
            </Badge>
          )}
          {dateFilter && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
              onClick={() => setDateFilter("")}
            >
              <span>Date: {dateFilter}</span>
              <X className="w-3 h-3 ml-0.5 hover:text-foreground" />
            </Badge>
          )}
          {awardingBodyFilter !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
              onClick={() => setAwardingBodyFilter("all")}
            >
              <span>
                Awarding:{" "}
                {awardingBodiesMap.get(awardingBodyFilter) ||
                  awardingBodyFilter}
              </span>
              <X className="w-3 h-3 ml-0.5 hover:text-foreground" />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Calendar view */}
      {isCalendarView && (
        <TrainingsCalendarView
          calendarMonth={calendarMonth}
          onCalendarMonthChange={setCalendarMonth}
          startingDay={startingDay}
          daysInMonth={daysInMonth}
          getTrainingsForDate={getTrainingsForDate}
          canViewDetails={canViewDetails}
          canEdit={canEdit}
          canCreate={canCreate}
          onViewDetails={setViewTraining}
          onAddForDate={handleAddForDate}
          onStatusChange={canEdit ? handleStatusChangeTraining : undefined}
        />
      )}

      {/* Trainings Bulk Action Bar */}
      {!isCalendarView && (
        <TrainingsBulkBar
          selectedCount={selectedTrainingIds.length}
          totalFilteredCount={totalItems}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelection={handleClearSelection}
          onBulkIssueCertificates={handleOpenBulkIssue}
          onBulkStatusUpdate={canEdit ? handleBulkStatusUpdate : undefined}
          canIssue={canCreate}
        />
      )}

      {/* List view — with tabs */}
      {!isCalendarView && (
        <>
          {/* Tabs — same structure as PayrollPage */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as TrainingTab)}
            className="w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="card-elevated overflow-hidden bg-card"
            >
              {/* Tab header row */}
              <div className="border-b border-border p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-card/50">
                <TabsList className="bg-transparent p-0 gap-4 sm:gap-6 h-auto justify-start border-0 rounded-none w-full max-w-full overflow-x-auto scrollbar-none flex-nowrap shrink-0 pb-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count = tabCounts[tab.key];
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

              {/* Tab content */}
              {TABS.map((tab) => (
                <TabsContent
                  key={tab.key}
                  value={tab.key}
                  className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
                >
                  <TrainingsListView
                    paginatedTrainings={paginatedTrainings}
                    loading={loading}
                    canViewDetails={canViewDetails}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onViewDetails={setViewTraining}
                    onEdit={setEditTraining}
                    onDelete={handleDeleteTraining}
                    onStatusChange={
                      canEdit ? handleStatusChangeTraining : undefined
                    }
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    activeTab={activeTab}
                    serviceTypeFilter={serviceTypeFilter}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={handleClearAllFilters}
                    selectedTrainingIds={selectedTrainingIds}
                    onToggleSelect={handleToggleSelect}
                    onSelectAllPage={handleSelectAllPage}
                    allPageSelected={allPageSelected}
                  />
                </TabsContent>
              ))}
            </motion.div>
          </Tabs>
        </>
      )}

      {/* View toggle for desktop — shown only when not already in list mode */}
      {!isCalendarView && isMobile === false && (
        <div className="fixed bottom-6 right-6 z-10">
          {/* handled by SearchFilterBar view toggle */}
        </div>
      )}

      {/* Dialogs */}
      <AddTrainingDialog
        open={showAddWizard}
        onOpenChange={(open) => {
          setShowAddWizard(open);
          if (!open) setPrefillDate(undefined);
        }}
        coursesList={courses}
        clients={clients}
        onAdd={handleAddTraining}
        prefillDate={prefillDate}
      />
      <BulkAddTrainingDialog
        open={showBulkAdd}
        onOpenChange={(open) => {
          setShowBulkAdd(open);
          if (!open) setPrefillDate(undefined);
        }}
        coursesList={courses}
        clients={clients}
        onAdd={handleAddTraining}
        prefillDate={prefillDate}
      />
      <TrainingDetailDialog
        training={viewTraining}
        onClose={() => setViewTraining(null)}
      />
      <EditTrainingDialog
        open={!!editTraining}
        onOpenChange={(open) => !open && setEditTraining(null)}
        coursesList={courses}
        clients={clients}
        training={editTraining}
        onUpdate={handleUpdateTraining}
      />
      <IssueCertificateDialog
        open={showIssueCertDialog}
        onOpenChange={(open) => {
          setShowIssueCertDialog(open);
          if (!open) {
            setSelectedTrainingIds([]);
            refreshTab();
          }
        }}
        initialMode="multiple"
        initialTrainingIds={issueDialogInitialIds}
      />
    </div>
  );
}
