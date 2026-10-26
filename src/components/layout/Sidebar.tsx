import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  FileSpreadsheet,
  Wallet,
  Clock,
  Settings,
  Users2,
  HelpCircle,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  checkFeaturePermission,
  getActiveRole,
  PermissionKey,
} from "@/lib/permissions";
import accreditLogo from "@/assets/Logo.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  featureKey: PermissionKey;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/",
        featureKey: "dashboard",
      },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      {
        icon: Users,
        label: "Clients",
        path: "/clients",
        featureKey: "clients",
      },
      {
        icon: GraduationCap,
        label: "Train & Insp",
        path: "/trainings",
        featureKey: "trainings",
      },
      {
        icon: Award,
        label: "Certificates",
        path: "/certificates",
        featureKey: "certificates",
      },
      {
        icon: FileSpreadsheet,
        label: "Reports",
        path: "/reports",
        featureKey: "reports",
      },
    ],
  },
  {
    label: "FINANCE",
    items: [
      {
        icon: Wallet,
        label: "Billing",
        path: "/finance/billing",
        featureKey: "finance",
      },
      {
        icon: Clock,
        label: "Payroll",
        path: "/finance/payroll",
        featureKey: "view_payroll",
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: Users2, label: "Users", path: "/users", featureKey: "users" },
      {
        icon: Settings,
        label: "Settings",
        path: "/settings",
        featureKey: "settings",
      },
      {
        icon: HelpCircle,
        label: "Help Center",
        path: "/help",
        featureKey: "dashboard",
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const [role, setRole] = useState(getActiveRole());
  const [permissionsTick, setPermissionsTick] = useState(0);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const handleRoleChange = () => {
      setRole(getActiveRole());
    };
    const handlePermissionsChange = () => {
      setPermissionsTick((prev) => prev + 1);
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            <img
              src={accreditLogo}
              alt="AccreditOS"
              className="w-full h-full object-contain"
            />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="font-bold text-sidebar-foreground text-sm">
                  AccreditOS
                </span>
                <span className="text-[10px] text-sidebar-muted">v.1.0.0</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            checkFeaturePermission(role, item.featureKey),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              {/* Section Label — hidden when collapsed */}
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[10px] font-extrabold tracking-[0.15em] text-sidebar-muted uppercase px-3 mb-1.5"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group relative",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon
                          className="w-4.5 h-4.5 flex-shrink-0"
                          style={{ width: 18, height: 18 }}
                        />
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15 }}
                              className="text-sm font-medium overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {item.badge && !collapsed && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sidebar-primary/20 text-sidebar-primary rounded-full ml-auto">
                            {item.badge}
                          </span>
                        )}
                        {/* Tooltip for collapsed state */}
                        {collapsed && (
                          <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-popover border border-border text-foreground text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap z-50 transition-all duration-150 shadow-lg">
                            {item.label}
                          </div>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Offline Status */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-t border-sidebar-border bg-destructive/10 text-destructive flex items-center justify-center gap-2 overflow-hidden flex-shrink-0"
          >
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold whitespace-nowrap"
              >
                Offline Mode
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
