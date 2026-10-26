import {
  TrendingUp,
  Building2,
  GraduationCap,
  Award,
  FileSpreadsheet,
  DollarSign,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";
import type { PermissionKey } from "@/lib/permissions";

export const MODULE_HIERARCHY = [
  {
    name: "Dashboard Overview",
    pageKey: "dashboard" as PermissionKey,
    description:
      "Access the central landing page showing summary cards, trends, and alerts.",
    icon: TrendingUp,
    actions: [] as PermissionKey[],
    actionMetadata: {} as Record<
      string,
      { name: string; description: string }
    >,
  },
  {
    name: "Clients Directory",
    pageKey: "clients" as PermissionKey,
    description:
      "Manage client files, company info, contact persons, and archive/active states.",
    icon: Building2,
    actions: [
      "create_client",
      "edit_client",
      "delete_client",
      "view_client_details",
    ] as PermissionKey[],
    actionMetadata: {
      create_client: {
        name: "Create Clients",
        description: "Add new corporate or individual client profiles.",
      },
      edit_client: {
        name: "Edit Clients",
        description: "Modify client records, contacts, and industry tags.",
      },
      delete_client: {
        name: "Delete Clients",
        description: "Permanently delete client files from the database.",
      },
      view_client_details: {
        name: "View Client Details",
        description:
          "Allows opening the detailed drawer when clicking on a client row.",
      },
    },
  },
  {
    name: "Trainings Management",
    pageKey: "trainings" as PermissionKey,
    description:
      "Create scheduled courses, register students, and mark completion progress.",
    icon: GraduationCap,
    actions: [
      "create_training",
      "edit_training",
      "delete_training",
      "view_training_details",
    ] as PermissionKey[],
    actionMetadata: {
      create_training: {
        name: "Schedule Courses",
        description:
          "Open new scheduled training batches and assign instructors.",
      },
      edit_training: {
        name: "Edit Trainings",
        description:
          "Modify dates, venue, trainer assignments, and student headcount.",
      },
      delete_training: {
        name: "Delete Trainings",
        description:
          "Permanently delete training sessions from the database.",
      },
      view_training_details: {
        name: "View Training Details",
        description:
          "Allows opening the detailed view when clicking on a training log.",
      },
    },
  },
  {
    name: "Certificates Registry",
    pageKey: "certificates" as PermissionKey,
    description:
      "Generate and store student credentials, track expiry states, and issue PDF files.",
    icon: Award,
    actions: [
      "issue_certificate",
      "edit_certificate",
      "delete_certificate",
      "view_certificate_details",
    ] as PermissionKey[],
    actionMetadata: {
      issue_certificate: {
        name: "Issue Certificates",
        description:
          "Generate new digital credentials for completed courses.",
      },
      edit_certificate: {
        name: "Edit Certificates",
        description: "Modify certificate metadata details (dates, names).",
      },
      delete_certificate: {
        name: "Delete Certificates",
        description: "Permanently delete certs and unlock training logs.",
      },
      view_certificate_details: {
        name: "View Certificate Details",
        description:
          "Allows opening the detailed view when clicking on a student certificate.",
      },
    },
  },
  {
    name: "Reports & Analytics",
    pageKey: "reports" as PermissionKey,
    description:
      "Access business intelligence, certificate statistics, financial breakdowns, and training summaries.",
    icon: FileSpreadsheet,
    actions: [] as PermissionKey[],
    actionMetadata: {} as Record<
      string,
      { name: string; description: string }
    >,
  },
  {
    name: "Finance & Invoices",
    pageKey: "finance" as PermissionKey,
    description:
      "Access invoices and expenses ledger, register payments, and monitor VAT totals.",
    icon: DollarSign,
    actions: [
      "create_invoice",
      "edit_invoice",
      "delete_invoice",
      "view_invoice_details",
    ] as PermissionKey[],
    actionMetadata: {
      create_invoice: {
        name: "Generate Invoices",
        description:
          "Create VAT invoices and link them to student certificates.",
      },
      edit_invoice: {
        name: "Edit Invoices",
        description:
          "Modify invoice status (pending/received) or expense details.",
      },
      delete_invoice: {
        name: "Delete Invoices",
        description:
          "Delete financial transactions and release certificate lock-states.",
      },
      view_invoice_details: {
        name: "View Finance Details",
        description: "Allows opening detailed invoice and expense views.",
      },
    },
  },
  {
    name: "Payroll",
    pageKey: "payroll" as PermissionKey,
    description:
      "Manage salary profiles, pending payroll, and salary payment records.",
    icon: DollarSign,
    actions: ["view_payroll", "manage_payroll"] as PermissionKey[],
    actionMetadata: {
      view_payroll: {
        name: "View Payroll",
        description: "Access payroll listings, salary profiles, and payment history.",
      },
      manage_payroll: {
        name: "Manage Payroll",
        description: "Create salary profiles and process payroll payments.",
      },
    },
  },
  {
    name: "Users & Staff Profiles",
    pageKey: "users" as PermissionKey,
    description:
      "Manage internal staff members, assign security roles, and view user details.",
    icon: Users,
    actions: ["create_user", "edit_user", "delete_user"] as PermissionKey[],
    actionMetadata: {
      create_user: {
        name: "Create Staff Accounts",
        description: "Add new operator, admin, or trainer accounts.",
      },
      edit_user: {
        name: "Edit Staff Profiles",
        description: "Modify credentials, names, and assign new roles.",
      },
      delete_user: {
        name: "Delete Staff Accounts",
        description: "Remove administrative/trainer accounts.",
      },
    },
  },
  {
    name: "System Settings",
    pageKey: "settings" as PermissionKey,
    description:
      "Configure dynamic options like course catalogs, access control, and configurations.",
    icon: SettingsIcon,
    actions: [
      "manage_awarding_bodies",
      "manage_system_options",
    ] as PermissionKey[],
    actionMetadata: {
      manage_awarding_bodies: {
        name: "Manage Awarding Bodies",
        description:
          "Register, edit details, and toggle active status of Awarding Bodies.",
      },
      manage_system_options: {
        name: "Manage System Options",
        description:
          "Register, edit, and toggle Invoice Classifications and Expense Categories.",
      },
    },
  },
];
