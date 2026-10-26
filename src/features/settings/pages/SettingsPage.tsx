import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ShieldCheck,
  Award,
  Settings as SettingsIcon,
  Building2,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { syncWithServer } from "@/lib/sync";

import { getCourses, saveCourses, Course } from "@/lib/courses";
import { getClients, Client } from "@/lib/clients";
import {
  apiGetInvoiceTypes,
  apiCreateInvoiceType,
  apiUpdateInvoiceType,
  apiGetExpenseCategories,
  apiCreateExpenseCategory,
  apiUpdateExpenseCategory,
  apiGetAwardingBodies,
  apiCreateAwardingBody,
  apiUpdateAwardingBody,
  apiGetCourses,
  apiCreateCourse,
  apiUpdateCourse,
  apiDeleteCourse,
} from "@/lib/api";
import {
  getPermissions,
  savePermissions,
  getActiveRole,
  checkFeaturePermission,
  UserRole,
  PermissionKey,
} from "@/lib/permissions";

import {
  CoursesTab,
  AccessControlTab,
  AwardingBodiesTab,
  SystemOptionsTab,
  CertificateTypesTab,
  CompanyDocumentsTab,
} from "../tabs";
import {
  CourseDialog,
  InvoiceTypeDialog,
  ExpenseCategoryDialog,
  AwardingBodyDialog,
} from "../dialogs";
import { MODULE_HIERARCHY } from "../constants/settings.constants";
import { DeveloperStorageWidget } from "@/features/dashboard/components/DeveloperStorageWidget";
import type { Training } from "@/features/trainings/types/trainings.types";
import type { Certificate } from "@/features/certificates/types/certificates.types";
function SettingsTabSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Skeleton Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 border border-border/40 p-4 rounded-xl">
        <div className="space-y-2 w-full sm:w-1/2">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Skeleton Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border/40 p-4 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="pt-2 border-t border-border/40 flex justify-between items-center">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [invoiceTypes, setInvoiceTypes] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [newInvoiceTypeName, setNewInvoiceTypeName] = useState("");
  const [newExpenseCategoryName, setNewExpenseCategoryName] = useState("");

  const [editingInvoiceType, setEditingInvoiceType] = useState<any | null>(
    null,
  );
  const [editInvoiceTypeName, setEditInvoiceTypeName] = useState("");
  const [editingExpenseCategory, setEditingExpenseCategory] = useState<
    any | null
  >(null);
  const [editExpenseCategoryName, setEditExpenseCategoryName] = useState("");

  const [awardingBodies, setAwardingBodies] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [newAwardingBody, setNewAwardingBody] = useState<any>({
    name: "",
    clientId: "",
    certificateFee: "0",
    isSystemIssued: false,
    trnNo: "",
    phone: "",
    email: "",
    location: "",
    poBox: "",
    contactPerson: "",
    paymentTerms: "",
    isVatRegistered: true,
    vatPercent: "5",
  });
  const [editingAwardingBody, setEditingAwardingBody] = useState<any | null>(
    null,
  );
  const [editAwardingBodyData, setEditAwardingBodyData] = useState<any>({
    name: "",
    clientId: "",
    certificateFee: "0",
    isSystemIssued: false,
    trnNo: "",
    phone: "",
    email: "",
    location: "",
    poBox: "",
    contactPerson: "",
    paymentTerms: "",
    isVatRegistered: true,
    vatPercent: "5",
  });

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [editCourseName, setEditCourseName] = useState("");
  const [showAddInvoiceType, setShowAddInvoiceType] = useState(false);
  const [showAddExpenseCategory, setShowAddExpenseCategory] = useState(false);
  const [showAddAwardingBody, setShowAddAwardingBody] = useState(false);

  const [activeRole, setActiveRole] = useState<UserRole>(getActiveRole());
  const [permissions, setPermissions] =
    useState<Record<UserRole, Record<PermissionKey, boolean>>>(
      getPermissions(),
    );
  const [selectedConfigRole, setSelectedConfigRole] =
    useState<Exclude<UserRole, "super_admin">>("operation_admin");

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    type: "confirm" | "warning" | "destructive" | "success" | "info";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    type: "confirm",
    onConfirm: () => {},
  });

  const [activeTab, setActiveTab] = useState(() =>
    getActiveRole() === "sales" ? "companyDocs" : "courses"
  );
  const [isTabLoading, setIsTabLoading] = useState(true);

  const loadFinanceSettings = async () => {
    try {
      const types = await apiGetInvoiceTypes();
      setInvoiceTypes(types);
      const cats = await apiGetExpenseCategories();
      setExpenseCategories(cats);
      const bodies = await apiGetAwardingBodies();
      setAwardingBodies(bodies);
    } catch (err: any) {
      console.error("Error loading settings lookups:", err);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await apiGetCourses();
      if (response.success && response.data) {
        setCourses(response.data);
        saveCourses(response.data);
        return;
      }
    } catch (err) {
      console.warn("Error loading courses:", err);
    }
    setCourses(getCourses());
  };

  useEffect(() => {
    const init = async () => {
      setIsTabLoading(true);
      await Promise.all([loadCourses(), loadFinanceSettings()]);
      setClientsList(getClients());
      setIsTabLoading(false);
    };
    init();

    const handleRoleChange = () => {
      const currentRole = getActiveRole();
      setActiveRole(currentRole);
      if (currentRole === "sales") {
        setActiveTab("companyDocs");
      }
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    return () =>
      window.removeEventListener("accreditOS_role_changed", handleRoleChange);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 220);
  };

  const handleAddInvoiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceTypeName.trim()) return;
    try {
      const added = await apiCreateInvoiceType(newInvoiceTypeName.trim());
      setInvoiceTypes((prev) => [...prev, added]);
      setNewInvoiceTypeName("");
      toast({
        title: "Invoice Type Added",
        description: `"${added.name}" has been successfully added.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add invoice type.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateInvoiceType = async (
    id: string,
    name?: string,
    isActive?: boolean,
  ) => {
    try {
      const updated = await apiUpdateInvoiceType(id, name, isActive);
      setInvoiceTypes((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (name) {
        setEditingInvoiceType(null);
      }
      toast({
        title: "Settings Saved",
        description: "Invoice Type has been successfully updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update invoice type.",
        variant: "destructive",
      });
    }
  };

  const handleAddExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseCategoryName.trim()) return;
    try {
      const added = await apiCreateExpenseCategory(
        newExpenseCategoryName.trim(),
      );
      setExpenseCategories((prev) => [...prev, added]);
      setNewExpenseCategoryName("");
      toast({
        title: "Expense Category Added",
        description: `"${added.name}" has been successfully added.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add expense category.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExpenseCategory = async (
    id: string,
    name?: string,
    isActive?: boolean,
  ) => {
    try {
      const updated = await apiUpdateExpenseCategory(id, name, isActive);
      setExpenseCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)),
      );
      if (name) {
        setEditingExpenseCategory(null);
      }
      toast({
        title: "Settings Saved",
        description: "Expense Category has been successfully updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update expense category.",
        variant: "destructive",
      });
    }
  };

  const handleAddAwardingBody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAwardingBody.name.trim()) return;
    try {
      const added = await apiCreateAwardingBody({
        name: newAwardingBody.name.trim(),
        clientId: newAwardingBody.clientId || null,
        certificateFee: parseFloat(newAwardingBody.certificateFee) || 0,
        isSystemIssued: newAwardingBody.isSystemIssued,
        trnNo: newAwardingBody.trnNo || null,
        phone: newAwardingBody.phone || null,
        email: newAwardingBody.email || null,
        location: newAwardingBody.location || null,
        poBox: newAwardingBody.poBox || null,
        contactPerson: newAwardingBody.contactPerson || null,
        paymentTerms: newAwardingBody.paymentTerms || null,
        isVatRegistered: newAwardingBody.isVatRegistered,
        vatPercent: parseFloat(newAwardingBody.vatPercent) || 5.0,
      });
      setAwardingBodies((prev) => [...prev, added]);
      setNewAwardingBody({
        name: "",
        clientId: "",
        certificateFee: "0",
        isSystemIssued: false,
        trnNo: "",
        phone: "",
        email: "",
        location: "",
        poBox: "",
        contactPerson: "",
        paymentTerms: "",
        isVatRegistered: true,
        vatPercent: "5",
      });
      toast({
        title: "Awarding Body Added",
        description: `"${added.name}" has been successfully added.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add awarding body.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAwardingBody = async (id: string, updates: any) => {
    try {
      const updated = await apiUpdateAwardingBody(id, updates);
      setAwardingBodies((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (editingAwardingBody) {
        setEditingAwardingBody(null);
      }
      toast({
        title: "Settings Saved",
        description: "Awarding Body has been successfully updated.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update awarding body.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourseConfirmed = async (id: string, name: string) => {
    const previousCourses = courses;
    const updated = previousCourses.filter((c) => c.id !== id);
    setCourses(updated);
    saveCourses(updated);

    try {
      const res = await apiDeleteCourse(id);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete course.");
      }
      toast({
        title: "Course Deleted",
        description: `"${name}" has been deleted from future selections.`,
      });
    } catch (err: any) {
      setCourses(previousCourses);
      saveCourses(previousCourses);
      toast({
        title: "Error",
        description: err.message || "Failed to delete course.",
        variant: "destructive",
      });
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCourseName.trim();
    if (!trimmedName) return;

    if (
      courses.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      toast({
        title: "Duplicate Course Name",
        description: "A course with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiCreateCourse(trimmedName);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to create course.");
      }
      const updated = [...courses, res.data];
      setCourses(updated);
      saveCourses(updated);
      setNewCourseName("");
      setShowAddCourse(false);
      toast({
        title: "Course Added",
        description: `"${res.data.name}" has been successfully added.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add course.",
        variant: "destructive",
      });
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editCourseName.trim();
    if (!editingCourse || !trimmedName) return;

    if (
      courses.some(
        (c) =>
          c.id !== editingCourse.id &&
          c.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      toast({
        title: "Duplicate Course Name",
        description: "Another course with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    const oldName = editingCourse.name;
    const newName = trimmedName;

    try {
      const res = await apiUpdateCourse(editingCourse.id, newName);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to update course.");
      }

      const updatedCourses = courses.map((c) =>
        c.id === editingCourse.id ? res.data : c,
      );
      setCourses(updatedCourses);
      saveCourses(updatedCourses);

      const storedTrainings = localStorage.getItem("accreditOS_trainings");
      if (storedTrainings) {
        try {
          const trainingsData = JSON.parse(storedTrainings);
          if (Array.isArray(trainingsData)) {
            const updatedTrainings = trainingsData.map((t: Training) => {
              if (t.courseName === oldName) {
                return { ...t, courseName: newName };
              }
              return t;
            });
            localStorage.setItem(
              "accreditOS_trainings",
              JSON.stringify(updatedTrainings),
            );
          }
        } catch (err) {
          console.error("Error updating courseName in trainings:", err);
        }
      }

      const storedCerts = localStorage.getItem("accreditOS_certificates");
      if (storedCerts) {
        try {
          const certsData = JSON.parse(storedCerts);
          if (Array.isArray(certsData)) {
            const updatedCerts = certsData.map((c: Certificate) => {
              if (c.course === oldName) {
                return { ...c, course: newName };
              }
              return c;
            });
            localStorage.setItem(
              "accreditOS_certificates",
              JSON.stringify(updatedCerts),
            );
          }
        } catch (err) {
          console.error("Error updating course in certificates:", err);
        }
      }

      syncWithServer();
      setEditingCourse(null);
      setEditCourseName("");

      toast({
        title: "Course Updated",
        description: `The course has been renamed to "${newName}". Existing training and certificate records have been updated automatically.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update course.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = (id: string, name: string) => {
    let trainingCount = 0;
    let certCount = 0;

    const storedTrainings = localStorage.getItem("accreditOS_trainings");
    if (storedTrainings) {
      try {
        const trainingsData = JSON.parse(storedTrainings);
        if (Array.isArray(trainingsData)) {
          trainingCount = trainingsData.filter(
            (t: Training) => t.courseName === name,
          ).length;
        }
      } catch (e) {
        console.error("Error counting trainings for delete", e);
      }
    }

    const storedCerts = localStorage.getItem("accreditOS_certificates");
    if (storedCerts) {
      try {
        const certsData = JSON.parse(storedCerts);
        if (Array.isArray(certsData)) {
          certCount = certsData.filter(
            (c: Certificate) => c.course === name,
          ).length;
        }
      } catch (e) {
        console.error("Error counting certificates for delete", e);
      }
    }

    let title = "Delete Training Course";
    let type: "destructive" | "warning" = "destructive";
    let msg = `Are you sure you want to delete "${name}"? This will remove it from future training selections.`;
    if (trainingCount > 0 || certCount > 0) {
      title = "Course Deletion Warning";
      type = "warning";
      msg = `Warning: There are ${trainingCount} training records and ${certCount} certificates associated with "${name}".\n\nIf you delete this course, these existing records will remain intact, but you won't be able to select "${name}" for new trainings.\n\nDo you want to proceed with deleting the course?`;
    }

    setConfirmDialog({
      open: true,
      title,
      description: msg,
      type,
      onConfirm: async () => {
        await handleDeleteCourseConfirmed(id, name);
      },
    });
  };

  const handleTogglePermission = (
    role: UserRole,
    key: PermissionKey,
    checked: boolean,
  ) => {
    if (role === "super_admin") return;

    const updated = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [key]: checked,
      },
    };

    if (!checked) {
      const module = MODULE_HIERARCHY.find((m) => m.pageKey === key);
      if (module) {
        module.actions.forEach((actionKey) => {
          updated[role][actionKey] = false;
        });
      }
    }
    setPermissions(updated);
  };

  const handleBatchUpdatePermissions = (
    role: UserRole,
    updates: Partial<Record<PermissionKey, boolean>>,
  ) => {
    if (role === "super_admin") return;

    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...updates,
      },
    }));
  };

  const handleSavePermissions = () => {
    savePermissions(permissions);
    toast({
      title: "Permissions Saved",
      description:
        "User roles and operational feature actions have been successfully updated.",
    });
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Configure application modules, dynamic lists, and system access"
      />

      {/* Tabs System */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated overflow-hidden bg-card"
        >
          {/* Header bar of the Settings card */}
          <div className="border-b border-border p-4 flex flex-col md:flex-row gap-4 justify-between md:items-center bg-card/50">
            <TabsList className="bg-transparent p-0 gap-4 sm:gap-6 h-auto justify-start border-0 rounded-none w-full max-w-full overflow-x-auto scrollbar-none flex-nowrap shrink-0 pb-1">
              {activeRole !== "sales" && (
                <TabsTrigger
                  value="courses"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  Course List
                </TabsTrigger>
              )}

              {activeRole === "super_admin" && (
                <TabsTrigger
                  value="access"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Access Control Matrix
                </TabsTrigger>
              )}

              {activeRole !== "sales" && (
                <TabsTrigger
                  value="awarding"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
                >
                  <Award className="w-4 h-4" />
                  Awarding Bodies
                </TabsTrigger>
              )}

              {activeRole !== "sales" && (
                <TabsTrigger
                  value="system"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
                >
                  <SettingsIcon className="w-4 h-4" />
                  System Options
                </TabsTrigger>
              )}

              <TabsTrigger
                value="companyDocs"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
              >
                {activeRole === "sales" ? (
                  <>
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    Training Materials
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 text-primary" />
                    Company Documents
                  </>
                )}
              </TabsTrigger>

              {(activeRole === "super_admin" ||
                (activeRole as string) === "developer") && (
                <TabsTrigger
                  value="certTypes"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1 pb-3 pt-1 shadow-none transition-all gap-2 text-muted-foreground data-[state=active]:text-foreground font-semibold text-sm shrink-0 whitespace-nowrap"
                >
                  <Award className="w-4 h-4 text-primary" />
                  Certificate Types
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Unified Tab Content Skeleton or Real Content */}
          {isTabLoading ? (
            <SettingsTabSkeleton />
          ) : (
            <>
              {/* Courses Tab Content */}
              <TabsContent value="courses" className="mt-0">
                <CoursesTab
                  courses={courses}
                  onAddClick={(prefillName?: string) => {
                    setNewCourseName(prefillName || "");
                    setShowAddCourse(true);
                  }}
                  onEditClick={(course) => {
                    setEditingCourse(course);
                    setEditCourseName(course.name);
                  }}
                  onDeleteClick={handleDeleteCourse}
                />
              </TabsContent>

              {/* Access Control Matrix Tab Content */}
              {activeRole === "super_admin" && (
                <TabsContent value="access" className="mt-0">
                  <AccessControlTab
                    selectedConfigRole={selectedConfigRole}
                    setSelectedConfigRole={setSelectedConfigRole}
                    permissions={permissions}
                    onTogglePermission={handleTogglePermission}
                    onBatchUpdatePermissions={handleBatchUpdatePermissions}
                    onReset={() => {
                      setPermissions(getPermissions());
                      toast({
                        title: "Permissions Reset",
                        description: "Restored configurations to last saved state.",
                      });
                    }}
                    onSave={handleSavePermissions}
                  />
                </TabsContent>
              )}

              {/* Awarding Bodies Tab Content */}
              <TabsContent value="awarding" className="mt-0">
                <AwardingBodiesTab
                  awardingBodies={awardingBodies}
                  canManage={
                    activeRole === "trainer" ||
                    checkFeaturePermission(activeRole, "manage_awarding_bodies")
                  }
                  onAddClick={() => {
                    setNewAwardingBody({
                      name: "",
                      clientId: "",
                      certificateFee: "0",
                      isSystemIssued: false,
                    });
                    setShowAddAwardingBody(true);
                  }}
                  onToggleAwardingBody={(id, checked) =>
                    handleUpdateAwardingBody(id, { isActive: checked })
                  }
                  onEditAwardingBody={(body) => {
                    setEditingAwardingBody(body);
                    setEditAwardingBodyData({
                      name: body.name || "",
                      clientId: body.clientId || "",
                      certificateFee: String(body.certificateFee || "0"),
                      isSystemIssued: Boolean(body.isSystemIssued),
                      trnNo: body.trnNo || "",
                      phone: body.phone || "",
                      email: body.email || "",
                      location: body.location || "",
                      poBox: body.poBox || "",
                      contactPerson: body.contactPerson || "",
                      paymentTerms: body.paymentTerms || "",
                      isVatRegistered: body.isVatRegistered ?? true,
                      vatPercent: String(body.vatPercent ?? 5),
                    });
                  }}
                />
              </TabsContent>

              {/* System Options Tab Content */}
              {activeRole !== "sales" && (
                <TabsContent value="system" className="mt-0">
                  <SystemOptionsTab
                    invoiceTypes={invoiceTypes}
                    expenseCategories={expenseCategories}
                    canManage={
                      activeRole === "trainer" ||
                      checkFeaturePermission(activeRole, "manage_system_options")
                    }
                    onAddInvoiceTypeClick={() => setShowAddInvoiceType(true)}
                    onAddExpenseCategoryClick={() => setShowAddExpenseCategory(true)}
                    onToggleInvoiceType={(id, checked) =>
                      handleUpdateInvoiceType(id, undefined, checked)
                    }
                    onToggleExpenseCategory={(id, checked) =>
                      handleUpdateExpenseCategory(id, undefined, checked)
                    }
                    onEditInvoiceType={(type) => {
                      setEditingInvoiceType(type);
                      setEditInvoiceTypeName(type.name);
                    }}
                    onEditExpenseCategory={(cat) => {
                      setEditingExpenseCategory(cat);
                      setEditExpenseCategoryName(cat.name);
                    }}
                  />
                </TabsContent>
              )}

              {/* Company Documents / Training Materials Tab Content */}
              <TabsContent value="companyDocs" className="mt-0">
                <CompanyDocumentsTab />
              </TabsContent>

              {/* Certificate Types Tab Content */}
              {(activeRole === "super_admin" ||
                (activeRole as string) === "developer") && (
                <TabsContent value="certTypes" className="mt-0 p-6">
                  <CertificateTypesTab />
                </TabsContent>
              )}
            </>
          )}
        </motion.div>
      </Tabs>

      {/* Add Course Dialog */}
      <CourseDialog
        open={showAddCourse}
        onOpenChange={setShowAddCourse}
        title="Add Training Course"
        value={newCourseName}
        onValueChange={setNewCourseName}
        onSubmit={handleAddCourse}
        buttonText="Add Course"
        existingCourses={courses}
      />

      {/* Edit Course Dialog */}
      <CourseDialog
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        title="Edit Training Course"
        value={editCourseName}
        onValueChange={setEditCourseName}
        onSubmit={handleEditCourse}
        buttonText="Save Changes"
        existingCourses={courses}
        currentCourseId={editingCourse?.id}
      />

      {/* Add Invoice Type Dialog */}
      <InvoiceTypeDialog
        open={showAddInvoiceType}
        onOpenChange={setShowAddInvoiceType}
        title="Add Invoice Classification"
        buttonText="Create Classification"
        value={newInvoiceTypeName}
        onValueChange={setNewInvoiceTypeName}
        onSubmit={(e) => {
          e.preventDefault();
          handleAddInvoiceType(e);
          setShowAddInvoiceType(false);
        }}
      />

      {/* Edit Invoice Type Dialog */}
      <InvoiceTypeDialog
        open={!!editingInvoiceType}
        onOpenChange={(open) => !open && setEditingInvoiceType(null)}
        title="Edit Invoice Classification"
        buttonText="Save Changes"
        value={editInvoiceTypeName}
        onValueChange={setEditInvoiceTypeName}
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdateInvoiceType(editingInvoiceType.id, editInvoiceTypeName);
        }}
      />

      {/* Add Expense Category Dialog */}
      <ExpenseCategoryDialog
        open={showAddExpenseCategory}
        onOpenChange={setShowAddExpenseCategory}
        title="Add Expense Category"
        buttonText="Create Category"
        value={newExpenseCategoryName}
        onValueChange={setNewExpenseCategoryName}
        onSubmit={(e) => {
          e.preventDefault();
          handleAddExpenseCategory(e);
          setShowAddExpenseCategory(false);
        }}
      />

      {/* Edit Expense Category Dialog */}
      <ExpenseCategoryDialog
        open={!!editingExpenseCategory}
        onOpenChange={(open) => !open && setEditingExpenseCategory(null)}
        title="Edit Expense Category"
        buttonText="Save Changes"
        value={editExpenseCategoryName}
        onValueChange={setEditExpenseCategoryName}
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdateExpenseCategory(
            editingExpenseCategory.id,
            editExpenseCategoryName,
          );
        }}
      />

      {/* Add Awarding Body Dialog */}
      <AwardingBodyDialog
        open={showAddAwardingBody}
        onOpenChange={setShowAddAwardingBody}
        title="Add Awarding Body"
        buttonText="Create Awarding Body"
        clientsList={clientsList}
        data={newAwardingBody}
        onDataChange={setNewAwardingBody as any}
        onSubmit={(e) => {
          e.preventDefault();
          handleAddAwardingBody(e);
          setShowAddAwardingBody(false);
        }}
      />

      {/* Edit Awarding Body Dialog */}
      <AwardingBodyDialog
        open={!!editingAwardingBody}
        onOpenChange={(open) => !open && setEditingAwardingBody(null)}
        title="Edit Awarding Body"
        buttonText="Save Changes"
        clientsList={clientsList}
        data={editAwardingBodyData}
        onDataChange={setEditAwardingBodyData}
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdateAwardingBody(editingAwardingBody.id, {
            name: editAwardingBodyData.name.trim(),
            clientId: editAwardingBodyData.clientId || null,
            certificateFee:
              parseFloat(editAwardingBodyData.certificateFee) || 0,
            isSystemIssued: editAwardingBodyData.isSystemIssued,
            trnNo: editAwardingBodyData.trnNo || null,
            phone: editAwardingBodyData.phone || null,
            email: editAwardingBodyData.email || null,
            location: editAwardingBodyData.location || null,
            poBox: editAwardingBodyData.poBox || null,
            contactPerson: editAwardingBodyData.contactPerson || null,
            paymentTerms: editAwardingBodyData.paymentTerms || null,
            isVatRegistered: editAwardingBodyData.isVatRegistered,
            vatPercent: parseFloat(editAwardingBodyData.vatPercent) || 5.0,
          });
        }}
      />

      {/* Global Confirmation Popup */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
