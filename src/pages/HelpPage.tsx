import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  BookOpen,
  TrendingUp,
  Award,
  Building2,
  Users,
  GraduationCap,
  Wallet,
  FileSpreadsheet,
  Clock,
  Users2,
  Settings,
  CheckCircle2,
  Info,
  Lock,
  Code2,
  Sparkles,
} from "lucide-react";
import {
  getActiveRole,
  checkFeaturePermission,
  PermissionKey,
  ROLE_LABELS,
} from "@/lib/permissions";

interface HelpGuide {
  title: string;
  description: string;
  steps: string[];
  badge?: string;
  developerOnly?: boolean;
  adminOnly?: boolean;
  requiredAction?: PermissionKey;
}

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  featureKey?: PermissionKey;
  adminOnly?: boolean;
  developerOnly?: boolean;
  guides: HelpGuide[];
}

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const activeRole = getActiveRole();

  const isDeveloper = activeRole === "super_admin" || (activeRole as string) === "developer";
  const isAdminOrSuper = activeRole === "super_admin" || activeRole === "operation_admin" || activeRole === "admin";

  const allSections: HelpSection[] = [
    {
      id: "dashboard",
      title: "Dashboard & Operational Intelligence",
      description: "Executive KPIs, 7-period time filters, custom calendar ranges, financial trends, and real-time operational lists.",
      icon: TrendingUp,
      featureKey: "dashboard",
      guides: [
        {
          title: "Understanding KPI Stats Cards & Metrics",
          description: "Learn what the top KPI cards represent and how data is aggregated across the platform.",
          steps: [
            "Active Trainings: Displays the total volume of training batches currently scheduled or ongoing.",
            "Certificates Issued: Total valid credentials generated for candidates across all courses.",
            "Expiring Soon: Proactive alert counter showing certificates reaching expiration within the next 90 days.",
            "Total Revenue / Collections: Aggregated financial collections from invoices issued to clients.",
            "Hover over the information (i) icon on any card to view detailed metric formulas and scope.",
          ],
          badge: "Overview",
        },
        {
          title: "Using Section Period Filters & Custom Date Range Dialog",
          description: "Filter individual charts and alert lists by standardized time intervals or exact dates.",
          steps: [
            "Each financial chart and operational card has an independent Section Period Filter dropdown in its header.",
            "Select from 7 preset options: 'This Month', 'Last Month', 'This Week', 'This Year', 'Last Year', 'All Time', or 'Custom Select'.",
            "When selecting 'Custom Select', the modal date dialog opens with dual 'Start Date' and 'End Date' calendar pickers.",
            "Choose convenient shortcuts ('Last 7 Days', 'Last 30 Days', 'This Month', 'This Year') or pick specific dates.",
            "Click 'Apply Date Range'. The section updates instantly, displaying the active date range pill and a 'Dates' button to re-edit anytime.",
          ],
          badge: "New Feature",
        },
        {
          title: "Analyzing Financial Charts (Revenue vs Expenses & Profit Trend)",
          description: "Monitor organizational financial health and cashflow trends over time.",
          steps: [
            "Revenue vs Expenses Chart: Shows dynamic comparisons. Switching filters automatically toggles Daily, Weekly, or Monthly bars.",
            "Profit Margin Trend: Visualizes net margin progression (Invoiced revenue minus recorded expenses).",
            "Hover over chart nodes or bars to view exact monetary values in AED currency.",
          ],
        },
        {
          title: "Managing Operational Action Lists & Alerts",
          description: "Act on high-priority items directly from the central dashboard.",
          steps: [
            "Unpaid Invoices: Identifies client invoices with overdue or pending payment balances. Click 'View All Invoices' in the card footer to open billing.",
            "Expiring Certificates: Highlights candidate credentials expiring within your selected timeframe for timely re-certification campaigns.",
            "Recent Trainings & Upcoming Sessions: Lists upcoming batches and recent completions for trainer coordination.",
          ],
        },
      ],
    },
    {
      id: "trainings",
      title: "Train & Inspect (Course Schedules)",
      description: "Scheduling training sessions, managing candidate attendance, calendar vs list views, and course completion workflows.",
      icon: GraduationCap,
      featureKey: "trainings",
      guides: [
        {
          title: "How to Schedule a New Training / Inspection Session",
          description: "Create a training batch for corporate clients or candidate cohorts.",
          steps: [
            "Navigate to 'Train & Insp' from the sidebar menu.",
            "Click '+ Schedule Session' at the top right.",
            "Select Course Title, Client Company, Assigned Trainer, and Awarding Body.",
            "Enter Training Start Date, End Date, Location/Venue, and expected Candidate Headcount.",
            "Click 'Create Session'. The training record is logged and immediately visible on the schedule.",
          ],
        },
        {
          title: "Switching Between Calendar, List, and Grid Views",
          description: "Visualize training schedules in the format most convenient for your workflow.",
          steps: [
            "In the top action bar, click the 'Calendar' view button to display an interactive monthly training calendar.",
            "Click any event badge on the calendar to open session details or modify schedules.",
            "Click 'List' view for a dense tabular overview or 'Grid' view for visual course cards.",
            "Use the awarding body and date quick-filters right above the views to isolate specific programs.",
          ],
        },
        {
          title: "Managing Candidate Rosters & Attendance",
          description: "Enroll participant names and track batch attendance.",
          steps: [
            "Click on any training session row or card to open the Training Details drawer.",
            "Under the 'Candidates' tab, review enrolled participants, national ID numbers, and contact details.",
            "Add additional students or modify participant records before concluding the training.",
          ],
        },
        {
          title: "Progressing Session Status to 'Completed'",
          description: "Unlock certificate generation by successfully concluding a training session.",
          steps: [
            "Locate the session in the table or grid.",
            "Click on the Status badge (`Scheduled`, `In Progress`, `Completed`, `Cancelled`).",
            "Select 'Completed' once the training and assessment conclude.",
            "Marking a session as 'Completed' unlocks certificate issuance for all enrolled candidates.",
          ],
        },
      ],
    },
    {
      id: "certificates",
      title: "Certificates & Document Generation",
      description: "Issuing certificates, company name filtering, instant status toggling, bulk updates, and downloading Word/PDF documents.",
      icon: Award,
      featureKey: "certificates",
      guides: [
        {
          title: "How to Issue a New Certificate",
          description: "Generate a digital training credential for an individual candidate.",
          steps: [
            "Go to 'Certificates' from the sidebar menu.",
            "Click the 'Issue Certificate' button at the top right.",
            "Select the Participant Name, Course Title, Client Company, and Awarding Body.",
            "Select Certificate Type (Specific, General, Duration, or Driving License).",
            "Enter Certificate Number (or leave auto-generated from sequence), Issue Date, and Expiry Date.",
            "Click 'Issue Certificate' to save and register the credential.",
          ],
        },
        {
          title: "Filtering by Company Name, Status, and Number Range",
          description: "Find specific certificates quickly using the advanced filter popover.",
          steps: [
            "Click the 'Filters' button next to the search bar.",
            "Certificate No. Range: Enter 'From No.' and 'To No.' to inspect a batch (e.g. 5715 to 5724).",
            "Cert Status: Filter by 'All Statuses', 'Created', or 'Sent'.",
            "Company Name: Select a corporate client to see only certificates issued for their staff.",
            "Awarding Body: Narrow down certificates accredited by Tatweer, Highfield, etc.",
            "Click 'Done' to apply. The active filter count badge reflects your criteria.",
          ],
          badge: "Updated Filter",
        },
        {
          title: "Instant Status Toggling (Created ↔ Sent)",
          description: "Update delivery status in 0ms with instant optimistic UI feedback.",
          steps: [
            "In either List or Grid view, locate the Status pill on any certificate.",
            "Click the pill to reveal status choices (`Created`, `Sent`).",
            "Select the desired status. The badge color and text update instantly with zero delay.",
            "The system automatically synchronizes the change with the database and updates KPI counters in the background.",
          ],
          badge: "Instant Sync",
        },
        {
          title: "Bulk Selection & Batch Status Updates",
          description: "Update dozens or hundreds of certificates simultaneously.",
          steps: [
            "Click the 'Select' mode button in the search & filter bar.",
            "Check individual certificates or click 'Select All Matching' in the bulk action bar.",
            "Click 'Mark Selected as Sent' or 'Mark Selected as Created'.",
            "All matching certificates across pages update synchronously.",
          ],
        },
        {
          title: "Downloading Editable Word (.docx) & Vector PDF Certificates",
          description: "Generate print-ready PDFs and official Word documents.",
          steps: [
            "Click on any certificate row or the action menu (...) and select 'View Details'.",
            "Word (.docx): Downloads the official Microsoft Word template populated with student name, course title, and dates.",
            "PDF (.pdf): Generates a high-resolution vector PDF certificate with embedded typography for instant printing.",
            "Note: Word generation applies to internal Tatweer certificates. For external bodies, third-party scans can be viewed directly.",
          ],
        },
        {
          title: "Managing Developer Sequence Counters",
          description: "Inspect and update the auto-incrementing certificate number sequence.",
          developerOnly: true,
          steps: [
            "Click the 'Next: #' sequence button in the page header (Exclusive to Developer / Super Admin).",
            "Review the current auto-increment number preview.",
            "Enter a new sequence number if calibrating against an external numbering ledger.",
            "Click 'Update Sequence'. New certificates will follow this counter.",
          ],
          badge: "Developer Only",
        },
      ],
    },
    {
      id: "clients",
      title: "Client & Corporate Accounts",
      description: "Managing corporate clients, individual candidates, contacts, tax numbers, and training history ledgers.",
      icon: Building2,
      featureKey: "clients",
      guides: [
        {
          title: "How to Create a New Client Account",
          description: "Register a corporate client or government partner in the system.",
          steps: [
            "Navigate to 'Clients' from the sidebar menu.",
            "Click '+ Add Client' at the top right.",
            "Enter Company Name, TRN/Tax Number, Contact Person Name, Email, Mobile, and Office Address.",
            "Select Client Category (Corporate, Government, Semi-Government, Academic).",
            "Click 'Save Client' to register the organization.",
          ],
        },
        {
          title: "Searching, Filtering, and Editing Client Information",
          description: "Keep contact details and representative info up to date.",
          steps: [
            "Use the live search bar to find clients by company name, contact person, or phone number.",
            "Click the actions dropdown (...) on any client card and select 'Edit Client'.",
            "Update phone numbers, billing address, or VAT registration numbers.",
            "Click 'Save Changes'.",
          ],
        },
        {
          title: "Reviewing Client History & Account Ledger",
          description: "View all trainings, unbilled certificates, and invoices associated with a client.",
          steps: [
            "Click directly on any client row or card to open the Client Details view.",
            "Review linked Training Sessions and completed participant headcounts.",
            "Inspect Issued Certificates and verify which sessions have unbilled invoices pending.",
            "View historical Invoices and lifetime revenue generated from this account.",
          ],
        },
      ],
    },
    {
      id: "reports",
      title: "Reports & Business Intelligence",
      description: "Auditing certificates, financial summaries, training activity reports, and awarding body fees with Excel export.",
      icon: FileSpreadsheet,
      featureKey: "reports",
      guides: [
        {
          title: "Certificates & Accreditations Report",
          description: "Audit issued certificates, validity windows, and accreditation distributions.",
          steps: [
            "Navigate to 'Reports' from the sidebar menu.",
            "Select the 'Certificates & Accreditations' tab.",
            "Filter by Date Range (From - To), Awarding Body, or specific Client Company.",
            "Inspect total certificates issued, valid credentials, and expiring credentials.",
            "Click 'Export Excel' to download the complete audit trail as a spreadsheet.",
          ],
          badge: "Reporting",
        },
        {
          title: "Financial & Revenue Breakdown Report",
          description: "Analyze billing volume, cash collections, outstanding receivables, and VAT totals.",
          steps: [
            "Select the 'Financial & Revenue' tab on the Reports page.",
            "Filter by custom timeframe (e.g. Q1, This Fiscal Year).",
            "Review Gross Invoiced Amount, Tax Collected (VAT 5%), Net Received, and Unpaid Balances.",
            "Export the revenue reconciliation report for monthly accounting audits.",
          ],
        },
        {
          title: "Trainings & Inspection Activity Report",
          description: "Evaluate course delivery metrics, trainer workloads, and participant numbers.",
          steps: [
            "Select the 'Trainings & Inspections' tab on the Reports page.",
            "View total batches delivered, completion rates, and candidate volume by course category.",
            "Identify top performing programs and trainer allocations.",
          ],
        },
        {
          title: "Awarding Body Fees & Vendor Payables Report",
          description: "Track accreditation provider costs and outstanding exam fees.",
          steps: [
            "Select the 'Awarding Body Fees' tab on the Reports page.",
            "Audit fees incurred per candidate certification across external providers (Highfield, ACTVET, etc.).",
            "Verify settled vendor payments vs outstanding payables.",
          ],
        },
      ],
    },
    {
      id: "finance",
      title: "Billing: Invoices, Receipts & Expenses",
      description: "Creating VAT invoices, recording payments, issuing receipts, voiding receipts, and tracking operational expenditures.",
      icon: Wallet,
      featureKey: "finance",
      guides: [
        {
          title: "How to Create and Issue a Formal VAT Invoice",
          description: "Generate compliant tax invoices for training batches and client services.",
          steps: [
            "Go to 'Finance' -> 'Billing' from the sidebar menu.",
            "On the 'Invoices' tab, click '+ Create Invoice'.",
            "Select the Client Company and optionally pull unbilled certificates automatically.",
            "Enter Invoice Issue Date, Payment Due Date, and custom Line Items (description, quantity, unit rate).",
            "The system automatically calculates 5% VAT and computes the Grand Total.",
            "Click 'Create & Issue Invoice'. The invoice appears in the ledger with auto-generated numbering.",
          ],
        },
        {
          title: "Recording Client Payments & Auto-Generating Receipts",
          description: "Log incoming cash, bank transfer, or cheque payments.",
          steps: [
            "In the Invoices table, locate the target invoice.",
            "Click the actions dropdown (...) and select 'Record Payment'.",
            "Enter Payment Date, Amount Received, Payment Mode (Bank Transfer, Cheque, Cash, Card), and Transaction Reference No.",
            "Click 'Submit Payment'. The invoice status transitions (`Paid` or `Partially Paid`), and an official Receipt Voucher is generated automatically.",
          ],
        },
        {
          title: "How to Void a Payment Receipt",
          description: "Cancel an erroneous payment or bounced cheque with an audit trail.",
          steps: [
            "Click on the 'Receipts' tab under Billing.",
            "Locate the receipt row, click 'View Details' -> 'Void Receipt'.",
            "Enter the mandatory Void Reason (e.g. 'Customer cheque returned by bank').",
            "Click 'Confirm Void'. The receipt status updates to 'Voided', and the linked invoice balance is automatically restored.",
          ],
        },
        {
          title: "Logging Operational Expenses by Category",
          description: "Track office, logistics, and instructor expenditures.",
          steps: [
            "Go to the 'Expenses' tab under Billing.",
            "Click '+ Add Expense'.",
            "Enter Expense Title, Category (Rent, Office Supplies, Trainer Fees, Utilities, Software), Amount, and Date.",
            "Click 'Save Expense'. Expenses reflect immediately in dashboard cashflow and profit margin calculations.",
          ],
        },
        {
          title: "Managing Vendor Bills (Awarding Body Payables)",
          description: "Track payables owed to external certification partners.",
          steps: [
            "Select the 'Vendor Bills' tab under Billing.",
            "Review bills issued by awarding bodies for candidate examination or registration fees.",
            "Record payments made to accreditation bodies to maintain balanced financial ledgers.",
          ],
        },
        {
          title: "Previewing & Printing Official Invoices & Receipt Vouchers",
          description: "Generate branded PDF previews and print tax invoices and payment vouchers.",
          steps: [
            "In either the Invoices or Receipts table, click the actions dropdown (...) and select 'Preview' or 'View Details'.",
            "A formatted, print-ready document displays company details, tax registration numbers, itemized rows, and signature lines.",
            "Click 'Print' or 'Download PDF' to generate the official hard-copy for client distribution.",
          ],
          badge: "Print & Export",
        },
      ],
    },
    {
      id: "payroll",
      title: "Payroll & Staff Compensation",
      description: "Setting up salary profiles, monthly payroll batch generation, advance salary requests, and payment settlement.",
      icon: Clock,
      featureKey: "view_payroll",
      guides: [
        {
          title: "Step 1: Setting Up Employee Salary Profiles",
          description: "Configure base compensation, allowances, and recurring deductions.",
          steps: [
            "Navigate to 'Finance' -> 'Payroll' from the sidebar menu.",
            "Click on the 'Salary Profiles' tab at the top of the page.",
            "Click '+ Add Salary Profile'.",
            "Select the staff member from the employee dropdown.",
            "Enter Base Salary, Housing Allowance, Transport Allowance, and Other Allowances.",
            "Define recurring Deductions if applicable.",
            "Click 'Save Profile'. This profile serves as the template for automated monthly calculations.",
          ],
          badge: "Prerequisite Step",
        },
        {
          title: "Step 2: Generating Monthly Payroll",
          description: "Process monthly compensation for individual staff or all active employees in bulk.",
          steps: [
            "On the Payroll page, select the 'Payroll Records' tab.",
            "Click '+ Generate Payroll'.",
            "Select the Month and Year (e.g., September 2026).",
            "Choose a specific employee or select 'All Active Employees'.",
            "The system computes Net Pay: Base Salary + Total Allowances - Standard Deductions - Outstanding Salary Advances.",
            "Click 'Generate Payroll'. Records are created with 'Pending' status.",
          ],
          badge: "Monthly Task",
        },
        {
          title: "Step 3: Requesting & Tracking Salary Advances",
          description: "Log emergency cash advances with automated payroll deduction.",
          steps: [
            "Click on the 'Salary Advances' tab on the Payroll page.",
            "Click '+ Request Advance'.",
            "Select the Employee, Advance Amount, Issue Date, and Reason.",
            "Set Repayment Terms (deduct fully next month or spread across installments).",
            "Click 'Record Advance'. The system automatically deducts installments during the next payroll generation.",
          ],
        },
        {
          title: "Step 4: Approving Payroll & Recording Bank Transfer References",
          description: "Mark payroll records as paid and record bank transaction numbers.",
          steps: [
            "In the Payroll Records table, click the actions dropdown (...) next to the staff record.",
            "Select 'Edit Notes / Status'.",
            "Paste the Bank Transfer Reference Number or WPS transaction ID.",
            "Change status from 'Pending' to 'Paid'.",
            "Click 'Save Changes'.",
          ],
        },
        {
          title: "Using Bulk Payroll Quick-Entry Mode",
          description: "Rapidly adjust allowances, deductions, and bonuses across all employees simultaneously.",
          steps: [
            "Click the 'Bulk Entry' mode toggle on the Payroll Records tab.",
            "A spreadsheet-style grid displays all employees side by side.",
            "Directly edit overtime bonuses, expense reimbursements, or custom deductions for the month.",
            "Click 'Save All Entries' to commit batch payroll adjustments in a single operation.",
          ],
        },
      ],
    },
    {
      id: "users",
      title: "User Management & Staff Accounts",
      description: "Adding system users, configuring role permissions (Super Admin, Admin, Operation Admin, Trainer), and password resets.",
      icon: Users2,
      featureKey: "users",
      adminOnly: true,
      guides: [
        {
          title: "Creating a New System User Account",
          description: "Set up login credentials for new administrative or training personnel.",
          steps: [
            "Navigate to 'System' -> 'Users' from the sidebar menu.",
            "Click '+ Add User' at the top right.",
            "Enter User's Full Name, Email Address, and Initial Password.",
            "Select Role: Super Admin, Admin, Operation Admin, or Trainer.",
            "Ensure the Status toggle is set to 'Active'.",
            "Click 'Create Account'. The user can immediately log in with their email credentials.",
          ],
          badge: "Admin Workflow",
        },
        {
          title: "Role Definitions & Access Scope",
          description: "Understand the permission hierarchy across the platform.",
          steps: [
            "Super Admin: Unrestricted access to all modules, developer settings, sequence configuration, and permission matrices.",
            "Operation Admin: Full access to operational modules (Clients, Trainings, Certificates, Finance, Payroll, Reports).",
            "Admin / Manager: Comprehensive access to client relations, trainings, certificates, and billing.",
            "Trainer: Focused access to scheduled trainings, client lists, candidate certificates, and course catalogs. Financial ledgers and reports are hidden.",
          ],
        },
        {
          title: "Configuring Full Employee Profiles (Bank IBAN & WPS Details)",
          description: "Maintain comprehensive staff HR data, addresses, and bank accounts for payroll transfers.",
          steps: [
            "When creating or editing a user, navigate through the Employee Profile tabs.",
            "Personal Details: Enter Date of Birth, Gender, Blood Group, Religion, and Marital Status.",
            "Address Details: Maintain Permanent Home Country Address and Local UAE Address.",
            "Bank Details: Enter Bank Name, Account Number, and official IBAN required for automated payroll transfers.",
            "Emergency Contacts & Nominee Details: Log primary contact persons and relationship details.",
            "Click 'Save Profile' to link HR records directly with the user account.",
          ],
          badge: "HR & Payroll Setup",
        },
        {
          title: "Editing Staff Details & Deactivating Accounts",
          description: "Update staff email addresses or revoke access for departed employees.",
          steps: [
            "In the Users table, click the actions dropdown (...) next to the target staff member.",
            "Click 'Edit User' to update their name, email, or assigned role.",
            "To revoke system access: Toggle Status to 'Inactive' and save. Inactive users are immediately blocked from logging in.",
          ],
        },
        {
          title: "Resetting User Passwords",
          description: "Generate a secure new password for a user who forgot their credentials.",
          steps: [
            "In the Users table, click the actions dropdown (...).",
            "Click 'Reset Password'.",
            "Type the new temporary password and confirm.",
            "Provide the credentials securely to the staff member to log in and update their password.",
          ],
        },
      ],
    },
    {
      id: "settings",
      title: "System Settings & Catalogs",
      description: "Managing course catalog with live duplicate prevention, awarding bodies, certificate types, and access control matrix.",
      icon: Settings,
      featureKey: "settings",
      guides: [
        {
          title: "Course Catalog Management with Live Search & Duplicate Prevention",
          description: "Manage courses and prevent accidental duplicate registrations.",
          steps: [
            "Navigate to 'System' -> 'Settings'.",
            "On the 'Courses' tab, use the real-time search bar to filter courses by title, code, awarding body, or category.",
            "To add a new course: Click '+ Add Course'.",
            "As you type the Course Title, the system performs real-time duplicate checking across the database.",
            "If a course with the same name already exists, a warning alert displays similar courses and disables the save button to ensure zero duplicates.",
            "Fill in Course Code, Category, Awarding Body, Duration (Days), and Validity (Years).",
            "Click 'Save Course'.",
          ],
          badge: "Search & Duplicate Shield",
        },
        {
          title: "Awarding Bodies & Accreditation Providers Catalog",
          description: "Configure official certification partners (Tatweer, Highfield, ACTVET, etc.).",
          steps: [
            "On the Settings page, select the 'Awarding Bodies' tab.",
            "View active accreditation partners, standard fees, and certificate prefixes.",
            "Click '+ Add Awarding Body' to register a new external certification board.",
          ],
        },
        {
          title: "Managing Company Documents & Compliance Expiration Alerts",
          description: "Store corporate licenses, accreditation permits, and track expiry dates.",
          steps: [
            "Select the 'Company Documents' tab on the Settings page.",
            "Click '+ Add Document' to record Trade Licenses, Establishment Cards, or MoHRE Registrations.",
            "Paste the Google Drive / cloud link for instant document preview.",
            "Enter Document Expiry Date. The system displays active validity countdowns and highlights expiring documents.",
          ],
          badge: "Compliance",
        },
        {
          title: "System Options: Custom Invoice Types & Expense Categories",
          description: "Customize billing categories and financial ledgers.",
          steps: [
            "Select the 'System Options' tab on the Settings page.",
            "Invoice Types: Add standard service types (Training Fee, Assessment, Re-test, Certification Fee).",
            "Expense Categories: Manage expenditure classifications (Rent, Office Supplies, Instructor Fees, Logistics).",
            "These options immediately populate dropdowns in the Billing module.",
          ],
        },
        {
          title: "Certificate Types & Word Template Variables",
          description: "Configure certificate templates and variable bindings.",
          steps: [
            "Select the 'Certificate Types' tab on the Settings page.",
            "Inspect supported types: Specific, General, Duration, and Driving License.",
            "Configure variable placeholders (e.g. `{{candidate_name}}`, `{{course_title}}`, `{{issue_date}}`) for official Word document generation.",
          ],
        },
        {
          title: "Dynamic Access Control Matrix",
          description: "Fine-tune screen and action permissions per role.",
          developerOnly: true,
          steps: [
            "Select the 'Access Control Matrix' tab on the Settings page (Developer / Super Admin only).",
            "Review the matrix of modules (Dashboard, Clients, Trainings, Certificates, Reports, Finance, Payroll, Users) against Roles.",
            "Check or uncheck specific permissions to grant or revoke capabilities.",
            "Click 'Save Permissions Matrix'. Changes propagate instantly across all active sessions.",
          ],
          badge: "Developer Only",
        },
      ],
    },
  ];

  // Role-Based Filtering: Filter out sections AND individual guides the user does not have permission to view!
  const visibleSections = useMemo(() => {
    return allSections
      .map((section) => {
        // 1. Check featureKey permission for entire section
        if (section.featureKey && !checkFeaturePermission(activeRole, section.featureKey)) {
          return null;
        }

        // 2. Check section level adminOnly / developerOnly
        if (section.adminOnly && !isAdminOrSuper) return null;
        if (section.developerOnly && !isDeveloper) return null;

        // 3. Filter individual guides based on role access
        const allowedGuides = section.guides.filter((guide) => {
          if (guide.developerOnly && !isDeveloper) return false;
          if (guide.adminOnly && !isAdminOrSuper) return false;
          if (guide.requiredAction && !checkFeaturePermission(activeRole, guide.requiredAction)) return false;
          return true;
        });

        // 4. If no guides are accessible in this section, hide section completely!
        if (allowedGuides.length === 0) return null;

        return {
          ...section,
          guides: allowedGuides,
        };
      })
      .filter(Boolean) as HelpSection[];
  }, [activeRole, isDeveloper, isAdminOrSuper]);

  // Filter sections by live search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return visibleSections;
    const query = searchQuery.toLowerCase();

    return visibleSections
      .map((section) => {
        const matchesSection =
          section.title.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query);

        const matchingGuides = section.guides.filter(
          (g) =>
            g.title.toLowerCase().includes(query) ||
            g.description.toLowerCase().includes(query) ||
            g.steps.some((s) => s.toLowerCase().includes(query))
        );

        if (matchesSection || matchingGuides.length > 0) {
          return {
            ...section,
            guides: matchesSection ? section.guides : matchingGuides,
          };
        }
        return null;
      })
      .filter(Boolean) as HelpSection[];
  }, [visibleSections, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Header */}
      <PageHeader
        title="Help Center & Knowledge Base"
        description={`User guides and step-by-step instructions. Showing guides available for your role: ${ROLE_LABELS[activeRole] || activeRole}`}
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 py-1 sm:py-1.5 px-2.5 sm:px-3 font-semibold">
            Role: {ROLE_LABELS[activeRole] || activeRole}
          </Badge>
        </div>
      </PageHeader>

      {/* Search Header Banner */}
      <div className="p-4 sm:p-6 rounded-xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-sm space-y-3 sm:space-y-4">
        <div className="max-w-2xl space-y-1.5 sm:space-y-2">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            How can we help you today?
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Search step-by-step instructions across all modules accessible to your account.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search guides (e.g. 'Certificates', 'Training', 'Filters', 'Invoices')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border shadow-sm text-xs sm:text-sm h-9 sm:h-10"
          />
        </div>
      </div>

      {/* Quick Jump Badges Bar - Touch Scrollable on Mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 text-xs border-b border-border/40 scrollbar-none scroll-smooth touch-pan-x">
        <span className="text-muted-foreground font-semibold shrink-0 mr-1 hidden md:inline text-xs">
          Accessible Modules:
        </span>
        {visibleSections.map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80 hover:bg-primary/10 hover:text-primary border border-border/80 transition-colors text-foreground font-medium shrink-0 text-xs shadow-xs"
          >
            {sec.title}
          </a>
        ))}
      </div>

      {/* Help Sections List */}
      <div className="space-y-4 sm:space-y-6">
        {filteredSections.length === 0 ? (
          <div className="p-8 sm:p-12 text-center border border-dashed border-border rounded-xl bg-card">
            <Info className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-semibold text-sm">No matching help topics found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query or clear the search filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-4 text-xs"
            >
              Clear Search Filter
            </Button>
          </div>
        ) : (
          filteredSections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div
                key={section.id}
                id={section.id}
                className="p-3.5 sm:p-5 rounded-xl border border-border bg-card shadow-sm space-y-3 sm:space-y-4 scroll-mt-20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <SectionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                        {section.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-2 sm:space-y-2.5">
                  {section.guides.map((guide, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`${section.id}-${idx}`}
                      className="border border-border/60 rounded-lg px-3 sm:px-4 bg-muted/20 data-[state=open]:bg-muted/40 transition-colors"
                    >
                      <AccordionTrigger className="hover:no-underline py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-foreground text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{guide.title}</span>
                          {guide.badge && (
                            <Badge variant="outline" className="text-[10px] py-0 font-normal border-primary/30 text-primary">
                              {guide.badge}
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-3 sm:pb-4 text-xs space-y-2.5 sm:space-y-3">
                        <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed">{guide.description}</p>
                        <div className="space-y-2 bg-card border border-border/80 p-2.5 sm:p-3.5 rounded-lg">
                          <h5 className="font-semibold text-foreground text-[10px] sm:text-[11px] uppercase tracking-wider text-primary">
                            Step-by-Step Instructions:
                          </h5>
                          <ol className="space-y-1.5 text-muted-foreground list-none pl-0">
                            {guide.steps.map((step, stepIdx) => (
                              <li key={stepIdx} className="flex items-start gap-2 pt-0.5">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold mt-0.5">
                                  {stepIdx + 1}
                                </span>
                                <span className="leading-relaxed text-foreground/90 text-[11px] sm:text-xs">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HelpPage;
