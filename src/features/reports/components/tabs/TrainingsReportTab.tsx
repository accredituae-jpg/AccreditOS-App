import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGetTrainings, apiGetCourses } from "@/lib/api/trainingApi";
import { apiGetClients } from "@/lib/api/clientApi";
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  RefreshCw,
  GraduationCap,
  Users,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DateRangePreset,
  getDateRangeBounds,
} from "@/features/certificates/utils/dateRangeUtils";
import { exportCustomReportToExcel } from "../../utils/exportReportExcel";
import { exportGenericReportToCsv } from "../../utils/exportReportCsv";
import { formatReportDate, parseReportDate } from "../../utils/reportDateUtils";
import {
  ExportColumnsDialog,
  ExportColumnItem,
} from "../dialogs/ExportColumnsDialog";

const TRAINING_COLUMNS = [
  "DATE",
  "PARTICIPANT",
  "CLIENT / COMPANY",
  "COURSE / SERVICE",
  "SERVICE TYPE",
  "PHONE",
  "STATUS",
  "CERTIFICATE",
];

export function TrainingsReportTab() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [serviceType, setServiceType] = useState("all");
  const [courseId, setCourseId] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const dateBounds = useMemo(() => {
    return getDateRangeBounds(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  const { data: trainings = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "reports",
      "trainings",
      datePreset,
      dateBounds.startDate,
      dateBounds.endDate,
    ],
    queryFn: async () => {
      const res = await apiGetTrainings(
        undefined,
        1,
        "",
        10000,
        datePreset !== "all" ? dateBounds.startDate : undefined,
        datePreset !== "all" ? dateBounds.endDate : undefined
      );
      return res.data || [];
    },
    staleTime: 60_000,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["reports", "options", "courses"],
    queryFn: async () => {
      const res = await apiGetCourses();
      return res.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["reports", "options", "clients"],
    queryFn: async () => {
      const res = await apiGetClients({ limit: 1000 });
      return res.data || [];
    },
    staleTime: 5 * 60_000,
  });

  const filteredTrainings = useMemo(() => {
    return trainings.filter((t: any) => {
      if (t.status === "cancelled") return false;

      if (serviceType !== "all") {
        const isInspection =
          t.serviceType === "inspection" ||
          t.trainingType === "inspection" ||
          (t.courseName || t.course?.name || "").toLowerCase().includes("inspection");
        if (serviceType === "training" && isInspection) return false;
        if (serviceType === "inspection" && !isInspection) return false;
      }

      if (courseId !== "all") {
        if (t.courseId !== courseId && t.course?.id !== courseId) return false;
      }

      if (clientId !== "all") {
        if (t.clientId !== clientId && t.client?.id !== clientId) return false;
      }

      if (dateBounds.startDate || dateBounds.endDate) {
        const rawD = t.regDate || t.trainingDate || t.startDate || t.createdAt;
        const d = parseReportDate(rawD);
        if (!d) return false;
        if (dateBounds.startDate) {
          const s = new Date(dateBounds.startDate);
          s.setHours(0, 0, 0, 0);
          if (d < s) return false;
        }
        if (dateBounds.endDate) {
          const e = new Date(dateBounds.endDate);
          e.setHours(23, 59, 59, 999);
          if (d > e) return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const pName = (t.participantName || "").toLowerCase();
        const cName = (t.clientName || t.client?.companyName || t.customCompany || "").toLowerCase();
        const crsName = (t.courseName || t.course?.name || "").toLowerCase();
        const phone = (t.participantPhone || t.client?.phone || "").toLowerCase();
        if (
          !pName.includes(q) &&
          !cName.includes(q) &&
          !crsName.includes(q) &&
          !phone.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [trainings, serviceType, courseId, clientId, dateBounds, search]);

  const stats = useMemo(() => {
    const totalSessions = filteredTrainings.length;
    const inspectionCount = filteredTrainings.filter(
      (t: any) =>
        t.serviceType === "inspection" ||
        t.trainingType === "inspection" ||
        (t.courseName || t.course?.name || "").toLowerCase().includes("inspection")
    ).length;
    const trainingCount = totalSessions - inspectionCount;
    const certIssuedCount = filteredTrainings.filter(
      (t: any) => t.certificateIssued || !!t.certificate
    ).length;

    return {
      totalSessions,
      trainingCount,
      inspectionCount,
      certIssuedCount,
    };
  }, [filteredTrainings]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTrainings.slice(start, start + pageSize);
  }, [filteredTrainings, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTrainings.length / pageSize));

  const exportExcel = (selectedColumns?: string[]) => {
    const rows = filteredTrainings.map((t: any) => ({
      "DATE": formatReportDate(t.regDate),
      "PARTICIPANT": t.participantName || "N/A",
      "CLIENT / COMPANY": t.clientName || t.client?.companyName || t.customCompany || "N/A",
      "COURSE / SERVICE": t.courseName || t.course?.name || "N/A",
      "SERVICE TYPE":
        t.serviceType === "inspection" ||
        t.trainingType === "inspection" ||
        (t.courseName || t.course?.name || "").toLowerCase().includes("inspection")
          ? "Inspection"
          : "Training",
      "PHONE": t.participantPhone || t.client?.phone || "N/A",
      "STATUS": (t.status || "").toUpperCase(),
      "CERTIFICATE": t.certificateIssued || !!t.certificate ? "YES" : "NO",
    }));

    const columnsToExport =
      selectedColumns && selectedColumns.length > 0
        ? selectedColumns
        : TRAINING_COLUMNS;

    exportCustomReportToExcel(
      "Trainings Report",
      rows,
      columnsToExport,
      "Trainings_Report"
    );
  };

  const exportCsv = (selectedColumns?: string[]) => {
    const columnsToExport =
      selectedColumns && selectedColumns.length > 0
        ? selectedColumns
        : TRAINING_COLUMNS;

    const rows = filteredTrainings.map((t: any) => ({
      "DATE": formatReportDate(t.regDate),
      "PARTICIPANT": t.participantName || "N/A",
      "CLIENT / COMPANY": t.clientName || t.client?.companyName || t.customCompany || "N/A",
      "COURSE / SERVICE": t.courseName || t.course?.name || "N/A",
      "SERVICE TYPE":
        t.serviceType === "inspection" ||
        t.trainingType === "inspection" ||
        (t.courseName || t.course?.name || "").toLowerCase().includes("inspection")
          ? "Inspection"
          : "Training",
      "PHONE": t.participantPhone || t.client?.phone || "N/A",
      "STATUS": (t.status || "").toUpperCase(),
      "CERTIFICATE": t.certificateIssued || !!t.certificate ? "YES" : "NO",
    }));

    exportGenericReportToCsv(columnsToExport, rows, "Trainings_Report");
  };

  return (
    <div className="space-y-6">
      {/* 1. FILTER CONTROLS */}
      <Card className="p-4 sm:p-5 border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap leading-tight">
                <span className="hidden sm:inline">Trainings </span>Filters
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight mt-0.5">
                {dateBounds?.label || "All Time"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="sm:hidden h-8 px-2 text-xs flex items-center gap-1 font-medium bg-muted/40"
            >
              <span>{mobileFiltersOpen ? "Hide" : "Filters"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  mobileFiltersOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDatePreset("this_month");
                setServiceType("all");
                setCourseId("all");
                setClientId("all");
                setSearch("");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="h-8 px-2 sm:px-2.5 text-xs shrink-0"
            >
              Reset<span className="hidden sm:inline">&nbsp;Filters</span>
            </Button>
          </div>
        </div>

        <div className={mobileFiltersOpen ? "block" : "hidden sm:block"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Period</label>
            <Select value={datePreset} onValueChange={(val: DateRangePreset) => { setDatePreset(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">Year-to-Date</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Service Type</label>
            <Select value={serviceType} onValueChange={(val) => { setServiceType(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="training">Training Courses</SelectItem>
                <SelectItem value="inspection">Equipment Inspections</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Course</label>
            <Select value={courseId} onValueChange={(val) => { setCourseId(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs truncate"><SelectValue placeholder="All Courses" /></SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Client</label>
            <Select value={clientId} onValueChange={(val) => { setClientId(val); setPage(1); }}>
              <SelectTrigger className="h-9 text-xs truncate"><SelectValue placeholder="All Clients" /></SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Participant, course..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 pl-8 pr-7 text-xs bg-background shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {datePreset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Start Date</label>
              <CustomCalendar
                value={customStartDate || undefined}
                onChange={(date) => {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setCustomStartDate(`${y}-${m}-${d}`);
                }}
                placeholder="From Date"
                className="h-9 text-xs w-full"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">End Date</label>
              <CustomCalendar
                value={customEndDate || undefined}
                onChange={(date) => {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  setCustomEndDate(`${y}-${m}-${d}`);
                }}
                placeholder="To Date"
                className="h-9 text-xs w-full"
              />
            </div>
          </div>
        )}
        </div>
      </Card>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight">{stats.totalSessions.toLocaleString()}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Recorded in {dateBounds?.label || "All Time"}</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Trainings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{stats.trainingCount.toLocaleString()}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Safety & vocational courses</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Inspections</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{stats.inspectionCount.toLocaleString()}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Site & equipment checks</p>
          </div>
        </Card>

        <Card className="p-4 border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Certificates Issued</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.certIssuedCount.toLocaleString()}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Accreditation complete</p>
          </div>
        </Card>
      </div>

      {/* 3. EXPORT ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold flex items-center gap-2 flex-wrap">
            <span>Trainings Registry</span>
            <Badge variant="secondary" className="text-[11px] font-normal shrink-0">{filteredTrainings.length} records</Badge>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">Session rosters and participant accreditation progress.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv()}
            disabled={filteredTrainings.length === 0 || isLoading}
            className="flex-1 sm:flex-initial h-8 px-3 text-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={filteredTrainings.length === 0 || isLoading}
            className="flex-1 sm:flex-initial h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* 4. PREVIEW TABLE */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900 dark:bg-slate-950 text-white">
              <TableRow className="hover:bg-slate-900 border-slate-800">
                <TableHead className="text-white text-[11px] font-semibold uppercase py-3 w-12">#</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[100px]">DATE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[180px]">PARTICIPANT</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[180px]">CLIENT / COMPANY</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[180px]">COURSE / SERVICE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[120px]">SERVICE TYPE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase min-w-[120px]">PHONE</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-center w-28">STATUS</TableHead>
                <TableHead className="text-white text-[11px] font-semibold uppercase text-center w-28">CERTIFICATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading trainings report...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground text-sm">
                    No records found matching your selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((t: any, idx: number) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  const courseName = t.courseName || t.course?.name || "N/A";
                  const clientName = t.clientName || t.client?.companyName || t.customCompany || "N/A";
                  const isInsp =
                    t.serviceType === "inspection" ||
                    t.trainingType === "inspection" ||
                    courseName.toLowerCase().includes("inspection");
                  const hasCert = t.certificateIssued || !!t.certificate;
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/40 transition-colors text-xs border-border/50">
                      <TableCell className="font-mono text-muted-foreground py-2.5">{rowNum}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatReportDate(t.regDate)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{t.participantName}</TableCell>
                      <TableCell className="text-muted-foreground">{clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{courseName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isInsp ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]" : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"}>
                          {isInsp ? "Inspection" : "Training"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{t.participantPhone || t.client?.phone || "N/A"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] uppercase">{t.status || "SCHEDULED"}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={hasCert ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                          {hasCert ? "ISSUED" : "PENDING"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border/60 bg-muted/10 text-xs">
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="whitespace-nowrap">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="whitespace-nowrap">
              {filteredTrainings.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredTrainings.length)} of {filteredTrainings.length} records
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 px-3 text-xs">
              Previous
            </Button>
            <span className="px-2 font-medium whitespace-nowrap">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 px-3 text-xs">
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* EXPORT COLUMN SELECTION DIALOG */}
      <ExportColumnsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        reportTitle="Trainings & Inspections"
        columns={TRAINING_COLUMNS}
        rowCount={filteredTrainings.length}
        onExport={(selectedKeys, format) => {
          if (format === "excel") {
            exportExcel(selectedKeys);
          } else {
            exportCsv(selectedKeys);
          }
        }}
      />
    </div>
  );
}
