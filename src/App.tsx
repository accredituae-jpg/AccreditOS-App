import React, { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  getActiveRole,
  checkFeaturePermission,
  PermissionKey,
  syncPermissionsFromServer,
} from "@/lib/permissions";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { setGlobalNavigate } from "@/lib/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OfflineStatusBar } from "@/components/pwa/OfflineStatusBar";
import { PWAInstallDialog } from "@/components/pwa/PWAInstallDialog";
import { PWAUpdateBanner } from "@/components/pwa/PWAUpdateBanner";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Login = lazyWithRetry(() => import("./pages/Login"));
const Dashboard = lazyWithRetry(
  () => import("./features/dashboard/pages/DashboardPage"),
);
const Clients = lazyWithRetry(() => import("./features/clients/pages/ClientsPage"));
const Trainings = lazyWithRetry(
  () => import("./features/trainings/pages/TrainingsPage"),
);
const Certificates = lazyWithRetry(
  () => import("./features/certificates/pages/CertificatesPage"),
);
const Reports = lazyWithRetry(
  () => import("./features/reports/pages/ReportsPage"),
);
const Billing = lazyWithRetry(() => import("./features/billing/pages/BillingPage"));
const Payroll = lazyWithRetry(() => import("./features/payroll/pages/PayrollPage"));
const Settings = lazyWithRetry(() => import("./features/settings/pages/SettingsPage"));
const Users = lazyWithRetry(() => import("./features/users/pages/UsersPage"));
const Help = lazyWithRetry(() => import("./pages/HelpPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (
          error?.statusCode === 401 ||
          error?.name === "UnauthorizedError" ||
          error?.name === "AuthenticationError" ||
          (typeof error?.message === "string" && error.message.includes("session has expired"))
        ) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

import { PageLoader } from "@/components/ui/PageLoader";

interface RoleGuardProps {
  children: React.ReactNode;
  feature: PermissionKey;
}

const RoleGuard = ({ children, feature }: RoleGuardProps) => {
  const [role, setRole] = useState(getActiveRole());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleRoleChange = () => {
      setRole(getActiveRole());
    };
    const handlePermissionsChange = () => {
      setTick((prev) => prev + 1);
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    window.addEventListener(
      "accreditOS_permissions_changed",
      handlePermissionsChange,
    );
    return () => {
      window.removeEventListener("accreditOS_role_changed", handleRoleChange);
      window.removeEventListener(
        "accreditOS_permissions_changed",
        handlePermissionsChange,
      );
    };
  }, []);

  const token = localStorage.getItem("accreditOS_auth_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = checkFeaturePermission(role, feature);

  if (!hasAccess) {
    // If role is sales, redirect to /clients since dashboard is not allowed
    if (role === "sales") {
      return <Navigate to="/clients" replace />;
    }
    // If user has no access to target section, redirect to Dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const NavigationBinder = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setGlobalNavigate(navigate);
  }, [navigate]);
  return null;
};

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("accreditOS_auth_token");
    if (token) {
      syncPermissionsFromServer();
    }

    const handleAuthExpired = () => {
      queryClient.clear();
    };

    window.addEventListener("auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth_expired", handleAuthExpired);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <TooltipProvider>
          <OfflineStatusBar />
          <Toaster />
          <Sonner />
          <PWAInstallDialog />
          <PWAUpdateBanner />
          <BrowserRouter>
            <NavigationBinder />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<DashboardLayout />}>
                  <Route
                    path="/"
                    element={
                      <RoleGuard feature="dashboard">
                        <Dashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/clients"
                    element={
                      <RoleGuard feature="clients">
                        <Clients />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/trainings"
                    element={
                      <RoleGuard feature="trainings">
                        <Trainings />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/certificates"
                    element={
                      <RoleGuard feature="certificates">
                        <Certificates />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RoleGuard feature="reports">
                        <Reports />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/finance"
                    element={<Navigate to="/finance/billing" replace />}
                  />
                  <Route
                    path="/finance/billing"
                    element={
                      <RoleGuard feature="finance">
                        <Billing />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/finance/payroll"
                    element={
                      <RoleGuard feature="view_payroll">
                        <Payroll />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <RoleGuard feature="users">
                        <Users />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RoleGuard feature="settings">
                        <Settings />
                      </RoleGuard>
                    }
                  />
                  <Route path="/help" element={<Help />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ConfirmProvider>
    </QueryClientProvider>
  );
};

export default App;
