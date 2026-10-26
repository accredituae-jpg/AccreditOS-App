import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Award,
  Wallet,
  GraduationCap,
  Receipt,
  FileSpreadsheet,
  ArrowDownUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { getActiveRole } from "@/lib/permissions";
import { CertificatesReportTab } from "../components/tabs/CertificatesReportTab";
import { FinancialReportTab } from "../components/tabs/FinancialReportTab";
import { TrainingsReportTab } from "../components/tabs/TrainingsReportTab";
import { VendorBillsReportTab } from "../components/tabs/VendorBillsReportTab";
import { TransactionsReportTab } from "../components/tabs/TransactionsReportTab";

const REPORT_TABS = [
  {
    key: "certificates",
    label: "Certificates & Accreditations",
    icon: Award,
    iconColor: "text-primary",
    badgeBg: "bg-primary/15 text-primary",
    developerOnly: false,
  },
  {
    key: "financial",
    label: "Financial & Revenue",
    icon: Wallet,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    developerOnly: false,
  },
  {
    key: "transactions",
    label: "Transactions Passbook",
    icon: ArrowDownUp,
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    developerOnly: false,
  },
  {
    key: "trainings",
    label: "Trainings & Inspections",
    icon: GraduationCap,
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    developerOnly: false,
  },
  {
    key: "vendor_bills",
    label: "Awarding Body Fees",
    icon: Receipt,
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    developerOnly: false,
  },
];

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRole, setActiveRole] = React.useState(getActiveRole());

  React.useEffect(() => {
    const handler = () => setActiveRole(getActiveRole());
    window.addEventListener("accreditOS_role_changed", handler);
    window.addEventListener("auth_changed", handler);
    return () => {
      window.removeEventListener("accreditOS_role_changed", handler);
      window.removeEventListener("auth_changed", handler);
    };
  }, []);

  const canViewTransactions =
    activeRole === "super_admin" ||
    (activeRole as string) === "developer" ||
    activeRole === "admin" ||
    activeRole === "operation_admin";

  const isDeveloper =
    activeRole === "super_admin" || (activeRole as string) === "developer";

  const visibleTabs = React.useMemo(() => {
    return REPORT_TABS.filter((t) => {
      if (t.developerOnly && !isDeveloper) return false;
      if (t.key === "transactions" && !canViewTransactions) return false;
      return true;
    });
  }, [isDeveloper, canViewTransactions]);

  const activeTab = searchParams.get("tab") || "certificates";

  React.useEffect(() => {
    if (activeTab === "transactions" && !canViewTransactions) {
      setSearchParams({ tab: "certificates" });
    }
  }, [activeTab, canViewTransactions, setSearchParams]);

  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  const currentTab = visibleTabs.find((t) => t.key === activeTab) || visibleTabs[0];
  const CurrentIcon = currentTab.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Reports & Analytics Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Authoritative reporting, compliance auditing, financial reconciliation, and enterprise data exports.
            </p>
          </div>
        </div>
      </div>

      {/* REPORT TABS */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full space-y-6"
      >
        {/* MOBILE: Single-Line Dropdown Selector */}
        <div className="sm:hidden bg-card/70 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-xs">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full h-11 bg-muted/40 border-0 rounded-lg px-3 font-semibold text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${currentTab.badgeBg}`}
                >
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <span className="truncate">{currentTab.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover shadow-lg">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.key;
                return (
                  <SelectItem
                    key={tab.key}
                    value={tab.key}
                    className="py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected ? tab.badgeBg : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold">{tab.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* TABLET / DESKTOP: Single-Line Navigation */}
        <div className="hidden sm:flex items-center w-full overflow-x-auto scrollbar-none pb-0.5">
          <TabsList className="h-auto p-1 bg-muted/50 dark:bg-muted/30 border border-border/70 rounded-xl inline-flex flex-nowrap items-center gap-1 shrink-0">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={`h-9 sm:h-10 px-3.5 sm:px-4 flex items-center gap-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-card text-foreground shadow-xs font-semibold border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? tab.badgeBg : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-tight">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent
          value="certificates"
          className="mt-0 focus-visible:outline-hidden"
        >
          <CertificatesReportTab />
        </TabsContent>

        <TabsContent
          value="financial"
          className="mt-0 focus-visible:outline-hidden"
        >
          <FinancialReportTab />
        </TabsContent>

        {canViewTransactions && (
          <TabsContent
            value="transactions"
            className="mt-0 focus-visible:outline-hidden"
          >
            <TransactionsReportTab />
          </TabsContent>
        )}

        <TabsContent
          value="trainings"
          className="mt-0 focus-visible:outline-hidden"
        >
          <TrainingsReportTab />
        </TabsContent>

        <TabsContent
          value="vendor_bills"
          className="mt-0 focus-visible:outline-hidden"
        >
          <VendorBillsReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
