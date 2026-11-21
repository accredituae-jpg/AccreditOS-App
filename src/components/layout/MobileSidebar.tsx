import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  WifiOff,
  Sun,
  Moon,
  RotateCw,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  checkFeaturePermission,
  getActiveRole,
  getCurrentUser,
  ROLE_LABELS,
  PermissionKey,
} from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { clearAuthToken } from "@/lib/api";
import { hardRefreshApp } from "@/lib/hardRefresh";
import { UserProfileDialog } from "@/features/users/dialogs";
import { ChangePasswordDialog } from "@/features/auth/dialogs/ChangePasswordDialog";
import { HelpCenterDialog } from "./HelpCenterDialog";
import accreditLogo from "@/assets/Accredit-Logo_Png.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  featureKey: PermissionKey;
  badge?: number | string;
}

const navItems: NavItem[] = [
  {
    icon: LayoutGrid,
    label: "Dashboard",
    path: "/",
    featureKey: "dashboard",
  },
  {
    icon: Users,
    label: "Clients & CRM",
    path: "/clients",
    featureKey: "clients",
  },
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
    label: "Reports & Logs",
    path: "/reports",
    featureKey: "reports",
  },
  {
    icon: Wallet,
    label: "Billing & Invoicing",
    path: "/finance/billing",
    featureKey: "finance",
  },
  {
    icon: Clock,
    label: "Payroll",
    path: "/finance/payroll",
    featureKey: "view_payroll",
  },
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
  const navigate = useNavigate();
  const [role, setRole] = useState(getActiveRole());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const isOnline = useOnlineStatus();

  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "dark" || (!storedTheme && true);
  });

  const openedAtPathRef = useRef(location.pathname);

  useEffect(() => {
    const handleRoleChange = () => {
      setRole(getActiveRole());
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("accreditOS_role_changed", handleRoleChange);
    window.addEventListener("auth_changed", handleRoleChange);
    return () => {
      window.removeEventListener("accreditOS_role_changed", handleRoleChange);
      window.removeEventListener("auth_changed", handleRoleChange);
    };
  }, []);

  useEffect(() => {
    if (open) {
      openedAtPathRef.current = location.pathname;
    }
  }, [open]);

  useEffect(() => {
    if (open && location.pathname !== openedAtPathRef.current) {
      onClose();
    }
  }, [location.pathname, open, onClose]);

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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleHardRefreshClick = async () => {
    setIsRefreshing(true);
    await hardRefreshApp();
  };

  const visibleNavItems = navItems.filter((item) =>
    checkFeaturePermission(role, item.featureKey),
  );

  const initials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "A";

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modern Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 max-w-[82vw] bg-card border-r border-border shadow-2xl flex flex-col justify-between rounded-r-3xl overflow-hidden"
            >
              {/* 1. Header with White-Tile Logo & Close Button */}
              <div className="p-4 border-b border-border/70 flex items-center justify-between bg-muted/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl p-1 bg-white shadow-sm border border-slate-200/90 flex items-center justify-center shrink-0">
                    <img
                      src={accreditLogo}
                      alt="AccreditOS"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-sm tracking-tight">
                        AccreditOS
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        ERP
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Enterprise Suite
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2. Navigation List */}
              <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75 px-3 py-1 block">
                  Modules
                </span>
                {visibleNavItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4.5 h-4.5 shrink-0",
                          isActive ? "text-primary-foreground" : "text-muted-foreground",
                        )}
                      />
                      <span className="tracking-tight">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* 3. Offline Alert (if disconnected) */}
              {!isOnline && (
                <div className="mx-3 mb-2 p-2 rounded-xl bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center gap-2">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Offline Mode Active</span>
                </div>
              )}

              {/* 4. Bottom User Card & Clean Utilities Footer */}
              <div className="p-3 border-t border-border/70 bg-muted/20 flex flex-col gap-2.5">
                {/* User Row + Theme Switcher */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-8 h-8 rounded-lg shrink-0 border border-primary/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {ROLE_LABELS[currentUser.role] || currentUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Theme Toggle Icon Button */}
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                    title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    aria-label="Toggle Theme"
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-sky-500" />
                    )}
                  </button>
                </div>

                {/* Quick Utility Actions Row */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setProfileOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-card border border-border/70 hover:bg-muted/70 text-foreground font-medium transition-all cursor-pointer shadow-2xs"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleHardRefreshClick}
                    disabled={isRefreshing}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-card border border-border/70 hover:bg-muted/70 text-foreground font-medium transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    title="Clear Cache & Reload"
                  >
                    <RotateCw
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground",
                        isRefreshing && "animate-spin text-primary",
                      )}
                    />
                    <span className="text-[11px]">Reload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      clearAuthToken();
                      navigate("/login");
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 font-medium transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <HelpCenterDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
