import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  PieChart as PieChartIcon,
  Building2,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertCircle,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Coins,
  Archive,
  Award,
  AlertTriangle,
  RefreshCw,
  Sun,
  Clock,
  FileText,
  Shield,
  CheckCircle,
} from "lucide-react";
import { DIRHAM_SYMBOL } from "@/lib/utils";

export interface MetricInfoDefinition {
  title: string;
  subtitle: string;
  badge: {
    label: string;
    variantClass: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconColorClass: string;
  whatIsIt: string;
  formula?: string;
  example?: string;
  tips?: string[];
}

export const METRIC_INFO_REGISTRY: Record<string, MetricInfoDefinition> = {
  // 1. Revenue
  revenue: {
    title: "Revenue Explained",
    subtitle: "Realized cash and payments collected from clients",
    badge: {
      label: "Cash Collected",
      variantClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    icon: DollarSign,
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    whatIsIt: "The actual money your business has received and deposited into your account from clients for training courses, corporate packages, and certified sessions during this period.",
    formula: "Revenue = Sum of all client invoice payments received in this period",
    example: "If 5 clients each paid a 2,000 AED invoice, your Revenue is 10,000 AED.",
    tips: [
      "Only real cash collections are counted here, not unpaid promises.",
      "Cancelled or voided invoices are strictly excluded.",
    ],
  },

  // 2. Expenses
  expenses: {
    title: "Expenses Explained",
    subtitle: "Operating expenditures and everyday business overheads",
    badge: {
      label: "Money Out",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: Receipt,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "All the money spent to run day-to-day operations during this period — including stationery, utilities, petty cash, office supplies, refreshments, and internal expenses.",
    formula: "Expenses = Sum of all valid operational expense logs in this period",
    example: "If you spent 300 AED on utilities and 700 AED on course stationery, your Expenses are 1,000 AED.",
    tips: [
      "Voided or draft expense logs are not counted.",
      "Check the Expense Distribution pie chart to see which category takes up the most money.",
    ],
  },

  // 3. Profit
  profit: {
    title: "Profit Explained",
    subtitle: "Net cash margin remaining after all operational expenses",
    badge: {
      label: "Net Margin",
      variantClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    icon: TrendingUp,
    iconBgClass: "bg-purple-500/10",
    iconColorClass: "text-purple-600 dark:text-purple-400",
    whatIsIt: "The real cash remaining in your business after paying all your operating expenses from your collected revenue.",
    formula: "Profit = Realized Cash Revenue - Total Operating Expenses",
    example: "You collected 30,000 AED in revenue and spent 5,000 AED on expenses → Your Net Cash Profit is 25,000 AED.",
    tips: [
      "A positive green number means your business is operating profitably.",
      "If expenses exceed revenue in a slow month, this number turns red to alert you.",
    ],
  },

  // 4. Pending Payments
  pending_payments: {
    title: "Pending Payments (AR) Explained",
    subtitle: "Outstanding client invoices awaiting collection",
    badge: {
      label: "Accounts Receivable",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: AlertCircle,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "The total unpaid money that clients still owe your company for invoices you have sent but have not yet received payment for.",
    formula: "Pending Payments = Total Invoiced Amount - Payments Received so far",
    example: "You sent a client an invoice for 5,000 AED and they paid 3,000 AED → The Pending Payment balance is 2,000 AED.",
    tips: [
      "Check the Client Accounts & Dues watchlist at the bottom of the dashboard to follow up on pending collections.",
      "Cancelled invoices are automatically removed so this balance remains 100% accurate.",
    ],
  },

  // 5. Total Clients
  total_clients: {
    title: "Total Clients Explained",
    subtitle: "Registered client companies and organizational accounts",
    badge: {
      label: "Client Directory",
      variantClass: "bg-primary/10 text-primary border-primary/20",
    },
    icon: Users,
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    whatIsIt: "The total number of client companies, corporate partners, and organizational accounts registered in your AccreditOS database.",
    formula: "Total count of active registered client profiles in the system",
    example: "Includes all corporate companies that send candidates for training and receive company invoices.",
    tips: [
      "You can add new clients anytime using the 'Add Client' button in the Quick Actions toolbar.",
    ],
  },

  // 6. Trainings Conducted
  trainings_conducted: {
    title: "Trainings Conducted Explained",
    subtitle: "Completed training course batches and participant sessions",
    badge: {
      label: "Operations",
      variantClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    },
    icon: GraduationCap,
    iconBgClass: "bg-cyan-500/10",
    iconColorClass: "text-cyan-600 dark:text-cyan-400",
    whatIsIt: "The count of training course batches and student cohorts that have been successfully conducted and completed in this scope.",
    formula: "Count of all training batches with status marked as 'Completed'",
    example: "If your instructors taught 12 First Aid courses and 8 Fire Safety sessions, Trainings Conducted is 20.",
    tips: [
      "Completed trainings allow you to issue candidate certificates and raise billing invoices.",
    ],
  },

  // 7. Upcoming Sessions
  upcoming_sessions: {
    title: "Upcoming Sessions Explained",
    subtitle: "Scheduled training batches on your calendar",
    badge: {
      label: "Schedule",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: Calendar,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "Training courses and workshops scheduled for future dates that are currently open for participant enrollment.",
    formula: "Count of future training sessions scheduled on the calendar",
    example: "Shows scheduled classes so you can ensure instructors and venues are prepared in advance.",
  },

  // 8. Pending Audits & Log Check
  pending_audits: {
    title: "Pending Audits & Log Checks",
    subtitle: "Training rosters awaiting verification and audit review",
    badge: {
      label: "Compliance",
      variantClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    icon: AlertCircle,
    iconBgClass: "bg-rose-500/10",
    iconColorClass: "text-rose-600 dark:text-rose-400",
    whatIsIt: "Training logs and student attendance rosters submitted by instructors that need administrative sign-off before accredited certificates can be issued.",
    formula: "Training batches submitted with attendance pending verification",
    example: "Ensures compliance with awarding body standards (like Highfield or Qualifi) before certificates are generated.",
  },

  // 9. Active Clients
  active_clients: {
    title: "Active Clients Explained",
    subtitle: "Client accounts currently eligible for courses and invoicing",
    badge: {
      label: "Active Accounts",
      variantClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    icon: CheckCircle2,
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    whatIsIt: "Registered corporate organizations and company accounts that have an active account status and are currently sending candidates for training.",
    formula: "Clients registered with status = 'Active'",
    example: "If you have 50 total registered companies and 5 are archived, your Active Clients count is 45.",
  },

  // 10. Archived Clients
  archived_clients: {
    title: "Archived Clients Explained",
    subtitle: "Historical client records preserved for audit and compliance",
    badge: {
      label: "Archived",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: Archive,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "Deactivated or past corporate client accounts. Their past certificates, student batches, and payment history remain safely preserved for historical audits.",
    formula: "Clients registered with status = 'Archived'",
  },

  // 11. Total Certificates
  total_certificates: {
    title: "Total Certificates Explained",
    subtitle: "All accredited certificates generated across all courses",
    badge: {
      label: "Issued",
      variantClass: "bg-primary/10 text-primary border-primary/20",
    },
    icon: Award,
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    whatIsIt: "The cumulative count of candidate qualification certificates issued across all awarding bodies (Highfield, Qualifi, Dubai Civil Defence, etc.).",
    formula: "Total count of certificates generated in the system",
    example: "If you issued 120 First Aid and 80 Fire Safety certificates, your Total Certificates count is 200.",
  },

  // 12. Valid Certificates
  valid_certificates: {
    title: "Valid Certificates Explained",
    subtitle: "Certificates currently in good standing with over 90 days remaining",
    badge: {
      label: "Valid",
      variantClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    icon: Award,
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    whatIsIt: "Official certificates that are fully valid and have more than 90 days before their renewal expiration date.",
    formula: "Certificates where expiry date is greater than 90 days from today",
    example: "Certificates that candidate holders and employers can legally rely on without imminent renewal.",
  },

  // 13. Expiring Soon Certificates
  expiring_soon_certificates: {
    title: "Expiring Soon Certificates Explained",
    subtitle: "Certificates due to expire within the next 90 days",
    badge: {
      label: "Renewal Alert",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: RefreshCw,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "Certificates reaching their expiration date within the next 90 calendar days. This gives your sales and admin team time to contact clients to schedule refresher training.",
    formula: "Certificates expiring between today and the next 90 days",
    example: "Alerts your team so you can contact the corporate client early for course renewals.",
  },

  // 14. Expired Certificates
  expired_certificates: {
    title: "Expired Certificates Explained",
    subtitle: "Certificates past their validity period",
    badge: {
      label: "Expired",
      variantClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    icon: AlertTriangle,
    iconBgClass: "bg-rose-500/10",
    iconColorClass: "text-rose-600 dark:text-rose-400",
    whatIsIt: "Accreditations and certificates whose validity window has ended. Candidates must take a refresher assessment to be re-issued an active certificate.",
    formula: "Certificates where expiry date is earlier than today",
  },

  // 15. Today's Sessions
  todays_sessions: {
    title: "Today's Sessions Explained",
    subtitle: "Training batches scheduled to take place today",
    badge: {
      label: "Today",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: Sun,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "Training courses and workshops taking place on today's calendar date, either in your training rooms or at client onsite facilities.",
    formula: "Sessions where scheduled date matches today's calendar date",
  },

  // 16. Pending Sessions
  pending_sessions: {
    title: "Pending Sessions Explained",
    subtitle: "Upcoming or ongoing training courses awaiting completion",
    badge: {
      label: "In Progress",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: Clock,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "Courses currently in progress, planned on future calendar dates, or awaiting instructor attendance verification.",
    formula: "Trainings with status = 'Pending' or 'In Progress'",
  },

  // 17. Total Invoiced
  total_invoiced: {
    title: "Total Invoiced (AR) Explained",
    subtitle: "Gross billing amount issued across client invoices",
    badge: {
      label: "Invoiced",
      variantClass: "bg-primary/10 text-primary border-primary/20",
    },
    icon: FileText,
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    whatIsIt: "The total gross monetary value (including VAT) of all active client invoices generated and dispatched in this scope.",
    formula: "Sum of total amount on all active, non-cancelled client invoices",
    example: "If you issued 3 invoices of 5,000 AED each, your Total Invoiced is 15,000 AED.",
  },

  // 18. Cash Collected
  cash_collected: {
    title: "Cash Collected Explained",
    subtitle: "Actual cash payments received into your company bank account",
    badge: {
      label: "Cash Collected",
      variantClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    icon: DollarSign,
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    whatIsIt: "The real money clients have already paid towards their invoices (via Bank Transfer, Card, Cheque, or Cash).",
    formula: "Sum of all payment receipts applied to client invoices",
    example: "If a client was billed 10,000 AED and paid 7,000 AED, Cash Collected is 7,000 AED.",
  },

  // 19. Total Invoices
  total_invoices: {
    title: "Total Invoices Explained",
    subtitle: "Count of all active client invoice documents",
    badge: {
      label: "Invoices",
      variantClass: "bg-primary/10 text-primary border-primary/20",
    },
    icon: FileText,
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    whatIsIt: "The total number of active client invoices recorded in your AccreditOS billing ledger.",
    formula: "Count of active, non-cancelled client invoices",
  },

  // 20. Employees Count
  employees_count: {
    title: "Employees Count Explained",
    subtitle: "Staff and instructors enrolled in payroll",
    badge: {
      label: "Roster",
      variantClass: "bg-primary/10 text-primary border-primary/20",
    },
    icon: Users,
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    whatIsIt: "The count of team members and instructors with an active payroll salary profile.",
    formula: "Unique count of employees with active salary profiles",
  },

  // 21. Administrators
  administrators: {
    title: "Administrators Explained",
    subtitle: "Users with executive permissions",
    badge: {
      label: "Admin",
      variantClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    icon: Shield,
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    whatIsIt: "Users with full administrative privileges to manage billing, certificates, company settings, and user permissions.",
    formula: "Count of active user accounts with the 'Admin' or 'Super Admin' role",
  },

  // 22. Operators
  operators: {
    title: "Operations Team Explained",
    subtitle: "Coordinators managing training operations",
    badge: {
      label: "Operations",
      variantClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    icon: Shield,
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    whatIsIt: "Team members handling day-to-day logistics, instructor scheduling, client bookings, and roster audits.",
    formula: "Count of active user accounts with the 'Operation Admin' role",
  },

  // 23. Trainers
  trainers: {
    title: "Trainers & Instructors Explained",
    subtitle: "Accredited instructors delivering courses",
    badge: {
      label: "Instructors",
      variantClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    },
    icon: Users,
    iconBgClass: "bg-cyan-500/10",
    iconColorClass: "text-cyan-600 dark:text-cyan-400",
    whatIsIt: "Trainers who conduct classroom or onsite courses and submit candidate attendance logs.",
    formula: "Count of active user accounts with the 'Trainer' role",
  },
};

export interface ChartCalculationInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "expense_operations" | "pie_chart" | "profit_trend" | "vendor_payables" | string;
  chartType?: "expense_operations" | "pie_chart" | "profit_trend" | "vendor_payables" | string;
  metricKey?: string;
  title?: string;
  description?: string;
}

// Normalizes any input key into a standard key
function normalizeKey(key?: string): string {
  if (!key) return "expense_operations";
  const lower = key.toLowerCase().trim().replace(/[\s_-]+/g, "_");

  // Exact / specific matches first:
  if (lower.includes("active_client")) return "active_clients";
  if (lower.includes("archive")) return "archived_clients";
  if (lower.includes("client")) return "total_clients";

  if (lower.includes("valid") && !lower.includes("expir")) return "valid_certificates";
  if (lower.includes("expiring_soon")) return "expiring_soon_certificates";
  if (lower.includes("expired")) return "expired_certificates";
  if (lower.includes("certificate")) return "total_certificates";

  if (lower.includes("today")) return "todays_sessions";
  if (lower.includes("upcoming")) return "upcoming_sessions";
  if (lower.includes("audit") || lower.includes("log_check")) return "pending_audits";
  if (lower.includes("completed") && (lower.includes("train") || lower.includes("session") || lower === "completed")) return "trainings_conducted";
  if (lower.includes("training") || lower.includes("conduct")) return "trainings_conducted";

  if (lower.includes("pie") || lower.includes("distribution") || lower === "expense_distribution") return "pie_chart";
  if (lower.includes("payable") || lower.includes("vendor_bill") || lower.includes("disbursed") || lower === "vendor_obligations" || lower === "need_to_pay") return "vendor_payables";
  if (lower.includes("operat") || lower.includes("velocity") || lower.includes("financial") || lower.includes("margin") || lower.includes("ratio")) return "expense_operations";

  if (lower.includes("invoiced") || lower === "total_invoiced") return "total_invoiced";
  if (lower.includes("invoice") && (lower.includes("count") || lower.includes("total_invoices") || lower === "total_invoices")) return "total_invoices";
  if (lower.includes("cash_collect") || lower.includes("collected")) return "cash_collected";
  if (lower.includes("receivable") || lower.includes("pending_pay")) return "pending_payments";

  if (lower.includes("revenue")) return "revenue";
  if (lower.includes("expense") || lower.includes("outflow")) return "expenses";
  if (lower.includes("profit")) return "profit";

  if (lower.includes("employee")) return "employees_count";
  if (lower.includes("admin")) return "administrators";
  if (lower.includes("operator")) return "operators";
  if (lower.includes("trainer")) return "trainers";

  if (lower === "pending") return "pending_sessions";

  return lower;
}

export function ChartCalculationInfoDialog({
  open,
  onOpenChange,
  type,
  chartType,
  metricKey,
  title,
  description,
}: ChartCalculationInfoDialogProps) {
  const activeKey = normalizeKey(metricKey || chartType || type);
  const statusInfo = METRIC_INFO_REGISTRY[activeKey];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto border-border/80 bg-card p-5 sm:p-6 shadow-2xl rounded-2xl">
        {/* ========================================================================= */}
        {/* 1. EXPENSE DISTRIBUTION (pie_chart)                                      */}
        {/* ========================================================================= */}
        {activeKey === "pie_chart" && (
          <>
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Expense Distribution Explained
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    A simple guide to how your operational spending is broken down
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Total Outflow (Money Spent)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    Total
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The combined amount of money your company spent on everyday operations (e.g. Stationery, Food, Office Supplies, Utilities) during the chosen time period.
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground flex items-center gap-1.5">
                  <strong className="text-cyan-600 font-sans font-semibold">How it's calculated:</strong>
                  <span>Sum of all active expense entries in this period</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Category Share (%)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-600 dark:text-purple-400">
                    Share %
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Shows what percentage of your total spending went to each specific category, so you can easily spot where most money is going.
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground space-y-1">
                  <div>
                    <strong className="text-purple-600 font-sans font-semibold">Formula: </strong>
                    <span>(Category Amount ÷ Total Money Spent) × 100</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans">
                    💡 <em>Example:</em> If you spent 100 AED in total and 70 AED was on Stationery, Stationery represents <strong>70%</strong> of your expenses.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Top 2 Categories Listing
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To keep your dashboard clean and focused, only the <strong>2 biggest spending categories</strong> are listed on this card.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  👉 Click <strong>"View All Expenses in Billing"</strong> at the bottom of the card anytime to see all categories and receipts.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. VENDOR OBLIGATIONS (vendor_payables)                                    */}
        {/* ========================================================================= */}
        {activeKey === "vendor_payables" && (
          <>
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Vendor Obligations (AP) Explained
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    A simple breakdown of what you owe vs. what you have already paid
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Need to Pay (Unpaid Balance)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-600 dark:text-amber-400">
                    Pending
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Money you <strong>still owe</strong> to awarding bodies (like Highfield or Qualifi) and suppliers for bills that haven't been fully paid yet.
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground space-y-1">
                  <div>
                    <strong className="text-amber-600 font-sans font-semibold">How it's calculated: </strong>
                    <span>Total Bill Amount - Amount Already Paid</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans">
                    💡 <em>Example:</em> An awarding body bill is 500 AED and you paid 200 AED → Your Need to Pay is <strong>300 AED</strong>.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Paid / Settled (Money Cleared)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Cleared
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Money you have <strong>already paid out</strong> to clear your vendor and awarding body bills during this period.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Total Payables (Grand Total)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-600 dark:text-purple-400">
                    Total
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The sum of all vendor bills received in this period, both paid and unpaid:
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground">
                  <strong>Total Payables = </strong> Need to Pay + Paid / Settled
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20 text-xs text-muted-foreground space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  What the Donut Chart Shows:
                </div>
                <p className="text-[11px]">
                  The green portion represents bills you have settled (100% green = all vendor bills are paid off). Any amber portion shows bills waiting for payment.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 3. FINANCIAL VELOCITY (expense_operations)                                */}
        {/* ========================================================================= */}
        {activeKey === "expense_operations" && (
          <>
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Financial Velocity Explained
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    A simple guide to your revenue, collections, and profit metrics
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Operating Expense Ratio (Opex Ratio %)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-violet-500/30 text-violet-600 dark:text-violet-400">
                    Efficiency
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tells you <strong>what percentage of your billed revenue goes into everyday expenses</strong>. Lower is better!
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground space-y-1">
                  <div>
                    <strong className="text-violet-600 font-sans font-semibold">Formula: </strong>
                    <span>(Total Expenses ÷ Total Billed Revenue) × 100</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans">
                    💡 <em>Example:</em> If you invoiced 10,000 AED and spent 100 AED on supplies, your ratio is <strong>1%</strong>. That means 99% is retained as gross margin.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Net Profit Margin (%)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Margin
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The percentage of revenue your business <strong>keeps as profit</strong> after deducting operating expenses.
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground">
                  <strong>Net Margin = </strong> 100% - Operating Expense Ratio (%)
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Billed Revenue vs. Realized Cash Collected
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 space-y-1">
                    <strong className="text-foreground block text-[11px] font-bold">Total Billed Revenue</strong>
                    <p className="text-[11px] text-muted-foreground">
                      The total value of invoices you issued to clients (including VAT) during this period.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 space-y-1">
                    <strong className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-bold">Realized Cash Collected</strong>
                    <p className="text-[11px] text-muted-foreground">
                      The actual cash clients have already deposited and cleared in your bank account so far.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Collection Rate (%)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Collections
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  How much of your billed money has already been collected in cash:
                </p>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground space-y-1">
                  <div>
                    <strong className="text-emerald-600 font-sans font-semibold">Formula: </strong>
                    <span>(Realized Cash ÷ Total Billed Revenue) × 100</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans">
                    💡 <em>Example:</em> You invoiced 40,000 AED and collected 30,000 AED → Your collection rate is <strong>75%</strong>.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 4. STATUS CARDS & REGISTERED METRICS (Revenue, Expenses, Profit, etc.)    */}
        {/* ========================================================================= */}
        {statusInfo && activeKey !== "pie_chart" && activeKey !== "vendor_payables" && activeKey !== "expense_operations" && (
          <>
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${statusInfo.iconBgClass} ${statusInfo.iconColorClass} flex items-center justify-center shrink-0`}>
                  <statusInfo.icon className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {statusInfo.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {statusInfo.subtitle}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs sm:text-sm">
                    What does this mean?
                  </span>
                  <Badge variant="outline" className={`text-[10px] font-mono ${statusInfo.badge.variantClass}`}>
                    {statusInfo.badge.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {statusInfo.whatIsIt}
                </p>
              </div>

              {statusInfo.formula && (
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                  <span className="font-bold text-foreground text-xs block">
                    How it's calculated:
                  </span>
                  <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-[11px] font-mono text-foreground">
                    {statusInfo.formula}
                  </div>
                  {statusInfo.example && (
                    <div className="text-[11px] text-muted-foreground pt-1">
                      💡 <em>Example:</em> {statusInfo.example}
                    </div>
                  )}
                </div>
              )}

              {statusInfo.tips && statusInfo.tips.length > 0 && (
                <div className="p-3 rounded-xl bg-primary/[0.04] border border-primary/20 space-y-1 text-xs">
                  <span className="font-bold text-foreground block text-[11px]">
                    Important Details:
                  </span>
                  <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                    {statusInfo.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {/* Fallback for unmapped custom metric */}
        {!statusInfo && activeKey !== "pie_chart" && activeKey !== "vendor_payables" && activeKey !== "expense_operations" && (
          <>
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {title || "Metric Details"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {description || "Understanding this operational statistic"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description || "This metric reflects live operational activity in AccreditOS based on your active scope."}
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
