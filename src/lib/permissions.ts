import { apiGetPermissions, apiSavePermissions } from "./api";
import { appConfig } from "@/config/appConfig";

export const PERMISSIONS = {
  CLIENT_VIEW: "clients",
  CLIENT_CREATE: "create_client",
  CLIENT_EDIT: "edit_client",
  CLIENT_DELETE: "delete_client",
  CLIENT_VIEW_DETAILS: "view_client_details",

  TRAINING_VIEW: "trainings",
  TRAINING_CREATE: "create_training",
  TRAINING_EDIT: "edit_training",
  TRAINING_DELETE: "delete_training",
  TRAINING_VIEW_DETAILS: "view_training_details",

  CERTIFICATE_VIEW: "certificates",
  CERTIFICATE_ISSUE: "issue_certificate",
  CERTIFICATE_EDIT: "edit_certificate",
  CERTIFICATE_DELETE: "delete_certificate",
  CERTIFICATE_VIEW_DETAILS: "view_certificate_details",

  FINANCE_VIEW: "finance",
  FINANCE_CREATE: "create_invoice",
  FINANCE_EDIT: "edit_invoice",
  FINANCE_DELETE: "delete_invoice",
  FINANCE_VIEW_DETAILS: "view_invoice_details",
  PAYROLL_VIEW: "view_payroll",
  PAYROLL_MANAGE: "manage_payroll",

  USER_VIEW: "users",
  USER_CREATE: "create_user",
  USER_EDIT: "edit_user",
  USER_DELETE: "delete_user",

  REPORT_VIEW: "reports",

  SETTINGS_VIEW: "settings",
} as const;

export type UserRole = "super_admin" | "operation_admin" | "admin" | "trainer" | "sales";

export type FeatureKey =
  | "dashboard"
  | "clients"
  | "trainings"
  | "certificates"
  | "reports"
  | "finance"
  | "payroll"
  | "users"
  | "settings";

export type ActionKey =
  // Clients
  | "create_client"
  | "edit_client"
  | "delete_client"
  | "view_client_details"
  // Trainings
  | "create_training"
  | "edit_training"
  | "delete_training"
  | "view_training_details"
  // Certificates
  | "issue_certificate"
  | "edit_certificate"
  | "delete_certificate"
  | "view_certificate_details"
  // Finance
  | "create_invoice"
  | "edit_invoice"
  | "delete_invoice"
  | "view_invoice_details"
  // Payroll
  | "view_payroll"
  | "manage_payroll"
  // Users
  | "create_user"
  | "edit_user"
  | "delete_user"
  | "manage_users"
  // Settings
  | "manage_awarding_bodies"
  | "manage_system_options";

export type PermissionKey = FeatureKey | ActionKey;

export interface EmployeeProfileData {
  personalDetails: {
    name: string;
    fatherName: string;
    dateOfBirth: string;
    bloodGroup: string;
    gender: "M" | "F" | "Other";
    religion: string;
    email: string;
    maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
    country: string;
    state: string;
  };
  permanentAddress: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
    contactNumber: string;
  };
  localAddress: {
    address: string;
    contactNumber: string;
  };
  emergencyContacts: Array<{
    name: string;
    contactNumber: string;
    relation: string;
    country: string;
  }>;
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    iban: string;
  };
  education: Array<{
    courseName: string;
    institutionName: string;
    completedYear: number | string;
  }>;
  workExperience: Array<{
    companyName: string;
    designation: string;
    yearsOfExperience: number | string;
  }>;
  declaration: {
    accepted: boolean;
    signatureDate?: string;
  };
}

export interface UserAttachment {
  id: string;
  name: string;
  driveLink: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  bankName?: string;
  accountNo?: string;
  iban?: string;
  attachments?: UserAttachment[];
  employeeProfile?: EmployeeProfileData;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  bankName?: string;
  accountNo?: string;
  iban?: string;
  employeeProfile?: EmployeeProfileData;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Developer",
  admin: "Administrator",
  operation_admin: "Operator",
  trainer: "Trainer",
  sales: "Sales",
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: "Page: Dashboard Overview",
  clients: "Page: Clients Directory",
  trainings: "Page: Trainings Logs",
  certificates: "Page: Certificates Registry",
  reports: "Page: Reports & Analytics",
  finance: "Page: Finance & Invoices",
  payroll: "Page: Payroll",
  users: "Page: Users & Staff Profiles",
  settings: "Page: Settings & Configurations",
  // Clients
  create_client: "Action: Create New Clients",
  edit_client: "Action: Edit Client Profiles",
  delete_client: "Action: Delete Clients (Cascade)",
  view_client_details: "Action: View Client Details",
  // Trainings
  create_training: "Action: Create Trainings",
  edit_training: "Action: Edit Trainings",
  delete_training: "Action: Delete Trainings",
  view_training_details: "Action: View Training Details",
  // Certificates
  issue_certificate: "Action: Generate Certificates",
  edit_certificate: "Action: Edit Certificates",
  delete_certificate: "Action: Delete Certificates",
  view_certificate_details: "Action: View Certificate Details",
  // Finance
  create_invoice: "Action: Generate Invoices",
  edit_invoice: "Action: Edit Invoice Statuses",
  delete_invoice: "Action: Delete Invoices",
  view_invoice_details: "Action: View Invoice Details",
  // Payroll
  view_payroll: "Action: View Payroll",
  manage_payroll: "Action: Manage Payroll",
  // Users
  create_user: "Action: Create Staff Accounts",
  edit_user: "Action: Edit Staff Accounts",
  delete_user: "Action: Delete Staff Accounts",
  manage_users: "Action: Manage Staff Accounts (Legacy)",
  // Settings
  manage_awarding_bodies: "Action: Manage Awarding Bodies Directory",
  manage_system_options: "Action: Manage System Options & Classifications",
};

const DEFAULT_PERMISSIONS: Record<UserRole, Record<PermissionKey, boolean>> = {
  super_admin: {
    dashboard: true,
    clients: true,
    trainings: true,
    certificates: true,
    reports: true,
    finance: true,
    users: true,
    settings: true,
    // Clients
    create_client: true,
    edit_client: true,
    delete_client: true,
    view_client_details: true,
    // Trainings
    create_training: true,
    edit_training: true,
    delete_training: true,
    view_training_details: true,
    // Certificates
    issue_certificate: true,
    edit_certificate: true,
    delete_certificate: true,
    view_certificate_details: true,
    // Finance
    create_invoice: true,
    edit_invoice: true,
    delete_invoice: true,
    view_invoice_details: true,
    payroll: true,
    view_payroll: true,
    manage_payroll: true,
    // Users
    create_user: true,
    edit_user: true,
    delete_user: true,
    manage_users: true,
    // Settings
    manage_awarding_bodies: true,
    manage_system_options: true,
  },
  operation_admin: {
    dashboard: true,
    clients: true,
    trainings: true,
    certificates: true,
    reports: true,
    finance: true,
    users: true,
    settings: true,
    // Clients
    create_client: true,
    edit_client: true,
    delete_client: true,
    view_client_details: true,
    // Trainings
    create_training: true,
    edit_training: true,
    delete_training: true,
    view_training_details: true,
    // Certificates
    issue_certificate: true,
    edit_certificate: true,
    delete_certificate: true,
    view_certificate_details: true,
    // Finance
    create_invoice: true,
    edit_invoice: true,
    delete_invoice: true,
    view_invoice_details: true,
    payroll: true,
    view_payroll: true,
    manage_payroll: true,
    // Users
    create_user: true,
    edit_user: true,
    delete_user: true,
    manage_users: true,
    // Settings
    manage_awarding_bodies: true,
    manage_system_options: true,
  },
  admin: {
    dashboard: true,
    clients: true,
    trainings: true,
    certificates: true,
    reports: true,
    finance: true,
    users: false,
    settings: true,
    // Clients
    create_client: true,
    edit_client: true,
    delete_client: true,
    view_client_details: true,
    // Trainings
    create_training: true,
    edit_training: true,
    delete_training: true,
    view_training_details: true,
    // Certificates
    issue_certificate: true,
    edit_certificate: true,
    delete_certificate: true,
    view_certificate_details: true,
    // Finance
    create_invoice: true,
    edit_invoice: true,
    delete_invoice: true,
    view_invoice_details: true,
    payroll: true,
    view_payroll: true,
    manage_payroll: true,
    // Users
    create_user: false,
    edit_user: false,
    delete_user: false,
    manage_users: false,
    // Settings
    manage_awarding_bodies: true,
    manage_system_options: true,
  },
  trainer: {
    dashboard: true,
    clients: true,
    trainings: true,
    certificates: true,
    reports: true,
    finance: false,
    payroll: false,
    users: false,
    settings: true,
    // Clients
    create_client: true,
    edit_client: true,
    delete_client: true,
    view_client_details: true,
    // Trainings
    create_training: true,
    edit_training: true,
    delete_training: true,
    view_training_details: true,
    // Certificates
    issue_certificate: true,
    edit_certificate: true,
    delete_certificate: true,
    view_certificate_details: true,
    // Finance
    create_invoice: false,
    edit_invoice: false,
    delete_invoice: false,
    view_invoice_details: false,
    // Payroll
    view_payroll: false,
    manage_payroll: false,
    // Users
    create_user: false,
    edit_user: false,
    delete_user: false,
    manage_users: false,
    // Settings
    manage_awarding_bodies: true,
    manage_system_options: true,
  },
  sales: {
    dashboard: false,
    clients: true,
    trainings: false,
    certificates: false,
    reports: false,
    finance: false,
    payroll: false,
    users: false,
    settings: true,
    // Clients - STRICTLY VIEW ONLY (No Create, Edit, Delete)
    create_client: false,
    edit_client: false,
    delete_client: false,
    view_client_details: true,
    // Trainings
    create_training: false,
    edit_training: false,
    delete_training: false,
    view_training_details: false,
    // Certificates
    issue_certificate: false,
    edit_certificate: false,
    delete_certificate: false,
    view_certificate_details: false,
    // Finance
    create_invoice: false,
    edit_invoice: false,
    delete_invoice: false,
    view_invoice_details: false,
    // Payroll
    view_payroll: false,
    manage_payroll: false,
    // Users
    create_user: false,
    edit_user: false,
    delete_user: false,
    manage_users: false,
    // Settings
    manage_awarding_bodies: false,
    manage_system_options: false,
  },
};

const AUTH_USER_KEYS = {
  id: "accreditOS_user_id",
  name: "accreditOS_user_name",
  email: "accreditOS_user_email",
  mobile: "accreditOS_user_mobile",
  role: "accreditOS_user_role",
  bankName: "accreditOS_user_bank_name",
  accountNo: "accreditOS_user_account_no",
  iban: "accreditOS_user_iban",
} as const;

function isUserRole(value: string | null): value is UserRole {
  return !!value && value in ROLE_LABELS;
}

// 1. Get authenticated user identity
export function getCurrentUser(): CurrentUser {
  const storedRole = localStorage.getItem(AUTH_USER_KEYS.role);
  const storedProfileStr = localStorage.getItem("accreditOS_employee_profile");
  let empProfile: EmployeeProfileData | undefined = undefined;
  if (storedProfileStr) {
    try {
      empProfile = JSON.parse(storedProfileStr);
    } catch (e) {}
  }

  return {
    id: localStorage.getItem(AUTH_USER_KEYS.id) || "",
    name: localStorage.getItem(AUTH_USER_KEYS.name) || empProfile?.personalDetails?.name || "User",
    email: localStorage.getItem(AUTH_USER_KEYS.email) || empProfile?.personalDetails?.email || "",
    mobile: localStorage.getItem(AUTH_USER_KEYS.mobile) || empProfile?.permanentAddress?.contactNumber || empProfile?.localAddress?.contactNumber || undefined,
    role: isUserRole(storedRole) ? storedRole : "trainer",
    bankName: localStorage.getItem(AUTH_USER_KEYS.bankName) || empProfile?.bankDetails?.bankName || undefined,
    accountNo: localStorage.getItem(AUTH_USER_KEYS.accountNo) || empProfile?.bankDetails?.accountNumber || undefined,
    iban: localStorage.getItem(AUTH_USER_KEYS.iban) || empProfile?.bankDetails?.iban || undefined,
    employeeProfile: empProfile,
  };
}

export function getActiveRole(): UserRole {
  return getCurrentUser().role;
}

export function setActiveRole(role: UserRole) {
  if (!appConfig.enableRoleSwitcher) {
    return;
  }

  localStorage.setItem(AUTH_USER_KEYS.role, role);
  window.dispatchEvent(new Event("accreditOS_role_changed"));
  window.dispatchEvent(new Event("auth_changed"));
}

// 2. Get/Set Role Permissions Configuration Map
export function getPermissions(): Record<UserRole, Record<PermissionKey, boolean>> {
  const stored = localStorage.getItem("accreditOS_permissions");
  if (!stored) {
    localStorage.setItem("accreditOS_permissions", JSON.stringify(DEFAULT_PERMISSIONS));
    return DEFAULT_PERMISSIONS;
  }
  try {
    let parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      if ("success" in parsed && "data" in parsed) {
        parsed = parsed.data;
      } else if ("version" in parsed && "data" in parsed) {
        parsed = parsed.data;
      }
    }

    // Deep-merge: DEFAULT_PERMISSIONS wins for any key that is missing in stored data.
    // This ensures new permission entries added to defaults are always picked up.
    const merged: Record<string, Record<string, boolean>> = {};
    for (const role of Object.keys(DEFAULT_PERMISSIONS) as UserRole[]) {
      merged[role] = {
        ...DEFAULT_PERMISSIONS[role],
        ...(parsed[role] ?? {}),
      };

      // Guarantee admin & trainer roles pick up default access for settings and certificates
      if (role === "admin") {
        if (!parsed[role] || parsed[role].settings === undefined || parsed[role].settings === false) {
          merged[role] = { ...DEFAULT_PERMISSIONS.admin, ...(parsed[role] ?? {}), settings: true, finance: true, users: false };
        } else {
          merged[role].users = false;
        }
      }
      if (role === "trainer") {
        merged[role].reports = true;
        merged[role].settings = true;
        merged[role].manage_awarding_bodies = true;
        merged[role].manage_system_options = true;
        if (!parsed[role] || parsed[role].certificates === undefined || parsed[role].certificates === false) {
          merged[role].certificates = DEFAULT_PERMISSIONS.trainer.certificates;
          merged[role].issue_certificate = DEFAULT_PERMISSIONS.trainer.issue_certificate;
          merged[role].edit_certificate = DEFAULT_PERMISSIONS.trainer.edit_certificate;
          merged[role].delete_certificate = DEFAULT_PERMISSIONS.trainer.delete_certificate;
          merged[role].view_certificate_details = DEFAULT_PERMISSIONS.trainer.view_certificate_details;
        }
      }
      if (role === "sales") {
        merged[role] = {
          ...DEFAULT_PERMISSIONS.sales,
          ...(parsed[role] ?? {}),
          clients: true,
          view_client_details: true,
          create_client: false,
          edit_client: false,
          delete_client: false,
          settings: true,
          dashboard: false,
          trainings: false,
          certificates: false,
          reports: false,
          finance: false,
          payroll: false,
          users: false,
        };
      }
    }

    return merged as Record<UserRole, Record<PermissionKey, boolean>>;
  } catch (e) {
    return DEFAULT_PERMISSIONS;
  }
}


export function savePermissions(perms: Record<UserRole, Record<PermissionKey, boolean>>) {
  localStorage.setItem("accreditOS_permissions", JSON.stringify(perms));
  window.dispatchEvent(new Event("accreditOS_permissions_changed"));
  apiSavePermissions(perms).catch(e => console.error("Failed to save permissions to server:", e));
}

export async function syncPermissionsFromServer(): Promise<void> {
  try {
    const perms = await apiGetPermissions();
    if (perms.success && perms.data) {
      localStorage.setItem("accreditOS_permissions", JSON.stringify(perms.data));
      window.dispatchEvent(new Event("accreditOS_permissions_changed"));
    }
  } catch (e) {
    console.warn("Failed to sync permissions from server:", e);
  }
}

export function checkFeaturePermission(role: UserRole, key: PermissionKey): boolean {
  if (role === "super_admin") return true;
  const perms = getPermissions();
  return perms[role]?.[key] ?? false;
}
