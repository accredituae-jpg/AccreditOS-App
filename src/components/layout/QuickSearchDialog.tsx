import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  GraduationCap,
  Award,
  FileSpreadsheet,
  Wallet,
  Clock,
  Settings,
  HelpCircle,
  Plus,
  RotateCw,
  Search,
  ArrowDownUp,
  Receipt,
  FileText,
  BadgeDollarSign,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { hardRefreshApp } from "@/lib/hardRefresh";

interface QuickSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickSearchDialog({
  open,
  onOpenChange,
}: QuickSearchDialogProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search navigation, modules, or actions (e.g. 'add cer', 'invoices', 'reports')..." />
      <CommandList>
        <CommandEmpty>
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Search className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              No matching operations or modules found
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Try searching for{" "}
              <span className="text-primary font-medium">"certificates"</span>,{" "}
              <span className="text-primary font-medium">"add cer"</span>,{" "}
              <span className="text-primary font-medium">"clients"</span>, or{" "}
              <span className="text-primary font-medium">"billing"</span>
            </p>
          </div>
        </CommandEmpty>

        {/* Quick Actions (matched for 'add cer', 'new client', 'create', etc.) */}
        <CommandGroup heading="Quick Actions & Operations">
          <CommandItem
            value="issue certificate add certificate new certificate add cer create cer"
            onSelect={() => handleSelect(() => navigate("/certificates"))}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Issue / Add Certificate
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Generate new certificate accreditation
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
              Certificates
            </span>
          </CommandItem>

          <CommandItem
            value="add new client create client register client company new crm"
            onSelect={() => handleSelect(() => navigate("/clients"))}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Add New Client
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Register corporate partner or trainee
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
              Clients
            </span>
          </CommandItem>

          <CommandItem
            value="create training course add training schedule inspection session"
            onSelect={() => handleSelect(() => navigate("/trainings"))}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Create Training / Inspection
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Schedule new training batch or site inspection
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
              Trainings
            </span>
          </CommandItem>

          <CommandItem
            value="create invoice new bill billing add invoice charge client"
            onSelect={() => handleSelect(() => navigate("/finance/billing"))}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Create Invoice & Billing
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Bill corporate clients for trainings & certs
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
              Finance
            </span>
          </CommandItem>

          <CommandItem
            value="record expense add expense spend cost opex petty cash"
            onSelect={() =>
              handleSelect(() => navigate("/finance/billing?tab=expenses"))
            }
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BadgeDollarSign className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Record Business Expense
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Log operational costs, supplies or office float
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
              Expenses
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Modules */}
        <CommandGroup heading="Navigation & Core Modules">
          <CommandItem
            value="executive dashboard home analytics kpis overview"
            onSelect={() => handleSelect(() => navigate("/"))}
            className="cursor-pointer"
          >
            <LayoutGrid className="mr-2.5 h-4 w-4 text-primary" />
            <span>Executive Dashboard</span>
          </CommandItem>

          <CommandItem
            value="clients crm directory companies candidates"
            onSelect={() => handleSelect(() => navigate("/clients"))}
            className="cursor-pointer"
          >
            <Users className="mr-2.5 h-4 w-4 text-primary" />
            <span>Clients & CRM</span>
          </CommandItem>

          <CommandItem
            value="trainings inspections calendar sessions schedule"
            onSelect={() => handleSelect(() => navigate("/trainings"))}
            className="cursor-pointer"
          >
            <GraduationCap className="mr-2.5 h-4 w-4 text-primary" />
            <span>Trainings & Inspections</span>
          </CommandItem>

          <CommandItem
            value="certificates registry search certs view cer add cer"
            onSelect={() => handleSelect(() => navigate("/certificates"))}
            className="cursor-pointer"
          >
            <Award className="mr-2.5 h-4 w-4 text-primary" />
            <span>Certificates Registry</span>
          </CommandItem>

          <CommandItem
            value="billing invoicing invoices client payments receipts"
            onSelect={() => handleSelect(() => navigate("/finance/billing"))}
            className="cursor-pointer"
          >
            <Wallet className="mr-2.5 h-4 w-4 text-primary" />
            <span>Billing & Invoicing</span>
          </CommandItem>

          <CommandItem
            value="transactions passbook cashbook revenue profit august september october cash flow ledger"
            onSelect={() =>
              handleSelect(() => navigate("/reports?tab=transactions"))
            }
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <ArrowDownUp className="mr-2.5 h-4 w-4 text-purple-500" />
              <span>Cash & Transactions Passbook</span>
            </div>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Reports
            </span>
          </CommandItem>

          <CommandItem
            value="invoices billing report statement of account soa receivables reports"
            onSelect={() =>
              handleSelect(() => navigate("/reports?tab=financial"))
            }
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <FileSpreadsheet className="mr-2.5 h-4 w-4 text-emerald-500" />
              <span>Invoices & Billing Report</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Reports
            </span>
          </CommandItem>

          <CommandItem
            value="certificates accreditations report export logs"
            onSelect={() =>
              handleSelect(() => navigate("/reports?tab=certificates"))
            }
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <FileText className="mr-2.5 h-4 w-4 text-blue-500" />
              <span>Certificates & Accreditations Report</span>
            </div>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Reports
            </span>
          </CommandItem>

          <CommandItem
            value="payroll management salary staff employee disbursements"
            onSelect={() => handleSelect(() => navigate("/finance/payroll"))}
            className="cursor-pointer"
          >
            <Clock className="mr-2.5 h-4 w-4 text-primary" />
            <span>Payroll Management</span>
          </CommandItem>

          <CommandItem
            value="system settings preferences config users permissions"
            onSelect={() => handleSelect(() => navigate("/settings"))}
            className="cursor-pointer"
          >
            <Settings className="mr-2.5 h-4 w-4 text-primary" />
            <span>System Settings</span>
          </CommandItem>

          <CommandItem
            value="help center documentation guide faq"
            onSelect={() => handleSelect(() => navigate("/help"))}
            className="cursor-pointer"
          >
            <HelpCircle className="mr-2.5 h-4 w-4 text-primary" />
            <span>Help Center & Documentation</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* System Utilities */}
        <CommandGroup heading="System Utilities">
          <CommandItem
            value="hard refresh app cache clear update reload"
            onSelect={() => handleSelect(hardRefreshApp)}
            className="cursor-pointer"
          >
            <RotateCw className="mr-2.5 h-4 w-4 text-sky-500" />
            <span>Hard Refresh App Cache</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Modern Command Palette Footer */}
      <div className="border-t border-border/60 px-4 py-2 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground select-none">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-card font-mono text-[9px] text-foreground">
            ↑
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-card font-mono text-[9px] text-foreground">
            ↓
          </kbd>
          <span>to navigate</span>
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-card font-mono text-[9px] text-foreground">
            ↵
          </kbd>
          <span>to open</span>
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-card font-mono text-[9px] text-foreground">
            ESC
          </kbd>
          <span>to dismiss</span>
        </span>
      </div>
    </CommandDialog>
  );
}
