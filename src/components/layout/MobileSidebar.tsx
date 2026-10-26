import { useEffect, useRef, useState } from "react";
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
  X,
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
}

const mainNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    featureKey: "dashboard",
  },
  { icon: Users, label: "Clients", path: "/clients", featureKey: "clients" },
  {
    icon: GraduationCap,
    label: "Trainings & Inspections",
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
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const [role, setRole] = useState(getActiveRole());
  const [permissionsTick, setPermissionsTick] = useState(0);
  const isOnline = useOnlineStatus();

  // Track the pathname when the sidebar was opened so we only close
  // on *actual* navigation, not on stale comparisons from initial mount.
  const openedAtPathRef = useRef(location.pathname);

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

  // Snapshot the current path every time the sidebar opens
  useEffect(() => {
    if (open) {
      openedAtPathRef.current = location.pathname;
    }
  }, [open]);

  // Close on route change — only when the sidebar is actually open
  // and the path has genuinely changed since opening
  useEffect(() => {
    if (open && location.pathname !== openedAtPathRef.current) {
      onClose();
    }
  }, [location.pathname, open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const visibleNavItems = mainNavItems.filter((item) =>
    checkFeaturePermission(role, item.featureKey),
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed left-0 top-0 z-50 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col"
          >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <img
                    src={accreditLogo}
                    alt="AccreditOS"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sidebar-foreground text-sm">
                    AccreditOS
                  </span>
                  <span className="text-[10px] text-sidebar-muted">
                    v.1.0.0
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              <ul className="space-y-0.5">
                {visibleNavItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
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
                  <span className="text-xs font-semibold whitespace-nowrap">
                    Offline Mode
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
