import { useState, useEffect, Suspense } from "react";
import type { ReactNode } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSidebar } from "./MobileSidebar";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { ROLE_LABELS, type UserRole } from "@/lib/permissions";
import { Eye, LogOut } from "lucide-react";
import { AiAssistantDrawer } from "@/features/ai-copilot/components/AiAssistantDrawer";

// Layout Constants
const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;

interface DashboardLayoutProps {
  children?: ReactNode;
}

const PageContentLoader = () => (
  <div className="space-y-6">
    {/* Title skeleton */}
    <div className="space-y-2">
      <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      ))}
    </div>

    {/* Content Section Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Card (e.g., Table or Chart) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-8 w-full rounded bg-slate-100 dark:bg-slate-900 animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-900">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Card (e.g., Activity log or List) */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
        <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="space-y-4 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const [impersonatorToken, setImpersonatorToken] = useState<string | null>(() =>
    localStorage.getItem("accreditOS_impersonator_token")
  );
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleRoleChanged = () => {
      setImpersonatorToken(localStorage.getItem("accreditOS_impersonator_token"));
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChanged);
    return () => {
      window.removeEventListener("accreditOS_role_changed", handleRoleChanged);
    };
  }, []);

  const handleReturnToAdmin = () => {
    const adminToken = localStorage.getItem("accreditOS_impersonator_token");
    const adminName = localStorage.getItem("accreditOS_impersonator_name") || "Developer";
    const adminRole = (localStorage.getItem("accreditOS_impersonator_role") as UserRole) || "super_admin";
    const adminEmail = localStorage.getItem("accreditOS_impersonator_email") || "";

    if (adminToken) {
      localStorage.removeItem("accreditOS_impersonator_token");
      localStorage.removeItem("accreditOS_impersonator_name");
      localStorage.removeItem("accreditOS_impersonator_role");
      localStorage.removeItem("accreditOS_impersonator_email");

      setImpersonatorToken(null);

      authStore.login(adminToken, {
        name: adminName,
        role: adminRole,
        email: adminEmail,
      });

      toast({
        title: "Session Restored",
        description: `Returned to ${adminName} (${ROLE_LABELS[adminRole] || adminRole}).`,
      });

      navigate("/users");
    }
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(true);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const handleCloseMobileSidebar = () => setMobileOpen(false);

  // Desktop left margin based on sidebar state
  const contentStyle = !isMobile
    ? {
        marginLeft: sidebarCollapsed
          ? SIDEBAR_WIDTH_COLLAPSED
          : SIDEBAR_WIDTH_EXPANDED,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} />}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <MobileSidebar open={mobileOpen} onClose={handleCloseMobileSidebar} />
      )}

      {/* Main content */}
      <div
        className="flex-1 flex flex-col transition-all duration-200 min-w-0"
        style={contentStyle}
      >
        {impersonatorToken && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300 flex-wrap shrink-0 z-30">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                Developer Impersonation: Viewing as{" "}
                <strong className="underline underline-offset-2 font-bold">
                  {authStore.userName || "User"} ({ROLE_LABELS[authStore.activeRole] || authStore.activeRole})
                </strong>
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReturnToAdmin}
              className="h-6.5 px-2.5 text-[11px] font-bold gap-1.5 bg-background/90 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs rounded-md"
            >
              <LogOut className="w-3 h-3" />
              <span>Return to Admin Account</span>
            </Button>
          </div>
        )}
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          isMobileMenuButton={isMobile}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="relative z-10">
            {children ? children : (
              <Suspense fallback={<PageContentLoader />}>
                <Outlet />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {/* Developer-Only AI Copilot Assistant */}
      <AiAssistantDrawer />
    </div>
  );
}
