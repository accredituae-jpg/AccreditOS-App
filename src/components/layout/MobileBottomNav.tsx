import { useEffect, useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Users,
  Award,
  UserCog,
  MoreVertical,
  GraduationCap,
  Wallet,
  Clock,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ArrowDownUp,
  FileText,
  X,
  Sun,
  Moon,
  RotateCw,
  LogOut,
  KeyRound,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getActiveRole,
  getCurrentUser,
  checkFeaturePermission,
  ROLE_LABELS,
  type UserRole,
  type PermissionKey,
} from "@/lib/permissions";
import { clearAuthToken } from "@/lib/api";
import { hardRefreshApp } from "@/lib/hardRefresh";
import { UserProfileDialog } from "@/features/users/dialogs";
import { ChangePasswordDialog } from "@/features/auth/dialogs/ChangePasswordDialog";
import { HelpCenterDialog } from "./HelpCenterDialog";

interface MobileBottomNavProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileBottomNav({
  isOpen: controlledIsOpen,
  onOpenChange,
}: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [internalOpen, setInternalOpen] = useState(false);
  const isQuickAccessOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const setQuickAccessOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [role, setRole] = useState<UserRole>(getActiveRole());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "dark" || (!storedTheme && true);
  });

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

  const handleSignOut = () => {
    setQuickAccessOpen(false);
    clearAuthToken();
    navigate("/login");
  };

  const canViewUsers = checkFeaturePermission(role, "users");

  // Primary 4 Tabs in the floating bar
  const primaryTabs = [
    {
      label: "Home",
      path: "/",
      icon: LayoutGrid,
      exact: true,
    },
    {
      label: "Clients",
      path: "/clients",
      icon: Users,
    },
    {
      label: "Certs",
      path: "/certificates",
      icon: Award,
    },
    canViewUsers
      ? {
          label: "Users",
          path: "/users",
          icon: UserCog,
        }
      : {
          label: "Sessions",
          path: "/trainings",
          icon: GraduationCap,
        },
  ];

  // Quick Access feature modules only (clean 4x2 grid)
  const quickAccessModules = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      icon: React.ElementType;
      featureKey?: PermissionKey;
      action?: () => void;
      path?: string;
      badge?: string | number;
    }> = [
      {
        id: "trainings",
        label: "Trainings & Inspect",
        icon: GraduationCap,
        path: "/trainings",
        featureKey: "trainings",
      },
      {
        id: "billing",
        label: "Billing & Invoicing",
        icon: Wallet,
        path: "/finance/billing",
        featureKey: "finance",
      },
      {
        id: "payroll",
        label: "Salary & Payroll",
        icon: Clock,
        path: "/finance/payroll",
        featureKey: "view_payroll",
      },
      {
        id: "transactions",
        label: "Cash Passbook",
        icon: ArrowDownUp,
        path: "/reports?tab=transactions",
        featureKey: "reports",
      },
      {
        id: "fin_report",
        label: "Invoices Report",
        icon: FileSpreadsheet,
        path: "/reports?tab=financial",
        featureKey: "reports",
      },
      {
        id: "cert_report",
        label: "Certs Report",
        icon: FileText,
        path: "/reports?tab=certificates",
        featureKey: "reports",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/settings",
        featureKey: "settings",
      },
      {
        id: "help",
        label: "Help Center",
        icon: HelpCircle,
        action: () => setHelpOpen(true),
        featureKey: "dashboard",
      },
    ];

    return list.filter((item) =>
      item.featureKey ? checkFeaturePermission(role, item.featureKey) : true,
    );
  }, [role]);

  // Check if any secondary page is active
  const isDirectActive = primaryTabs.some((tab) =>
    tab.exact
      ? location.pathname === tab.path
      : location.pathname.startsWith(tab.path),
  );
  const isMoreActive = !isDirectActive || isQuickAccessOpen;

  // Auto-hide bottom nav when any modal dialog is active
  const [hasOpenDialog, setHasOpenDialog] = useState(false);

  useEffect(() => {
    const checkModal = () => {
      const isLocked = document.body.hasAttribute("data-scroll-locked");
      const hasModal = Boolean(
        document.querySelector('[role="dialog"]:not([data-bottom-sheet])'),
      );
      setHasOpenDialog(isLocked || hasModal);
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  const handleTileClick = (item: (typeof quickAccessModules)[number]) => {
    setQuickAccessOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* 1. Floating Island Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={cn(
          "fixed bottom-3 inset-x-4 max-w-sm sm:max-w-md mx-auto z-40 md:hidden bg-card/95 dark:bg-card/90 backdrop-blur-2xl rounded-full border border-border/80 shadow-[0_12px_36px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.65)] select-none px-3 py-1.5 transition-all duration-200",
          hasOpenDialog && "opacity-0 pointer-events-none translate-y-8",
        )}
      >
        <div className="grid grid-cols-5 items-center w-full h-14">
          {primaryTabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === tab.path
              : location.pathname.startsWith(tab.path);

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                onClick={() => setQuickAccessOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center py-0.5 transition-all duration-200 group cursor-pointer text-center",
                  isActive
                    ? "text-primary dark:text-sky-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="relative h-8 w-8 flex items-center justify-center">
                  <tab.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200 group-active:scale-90",
                      isActive
                        ? "stroke-[2.2] scale-105 text-primary dark:text-sky-400 drop-shadow-[0_2px_8px_rgba(4,160,219,0.35)]"
                        : "stroke-[1.8]",
                    )}
                  />

                  {isActive && (
                    <motion.div
                      layoutId="floatingNavPip"
                      className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(4,160,219,0.7)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] tracking-tight mt-0.5 leading-none transition-colors duration-200 truncate max-w-[56px]",
                    isActive
                      ? "font-bold text-foreground"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          })}

          {/* More Action Button with balanced circular gradient */}
          <button
            type="button"
            onClick={() => setQuickAccessOpen(!isQuickAccessOpen)}
            className="flex flex-col items-center justify-center py-0.5 transition-all duration-200 group cursor-pointer text-center"
            aria-label="Toggle Quick Access"
          >
            <div className="relative h-8 w-8 flex items-center justify-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
                  isMoreActive
                    ? "bg-gradient-to-tr from-primary to-sky-400 text-white shadow-primary/35 scale-105 ring-2 ring-primary/40"
                    : "bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-300 hover:bg-primary/20",
                )}
              >
                <MoreVertical className="w-4 h-4 stroke-[2.4]" />
              </div>
            </div>

            <span
              className={cn(
                "text-[10px] tracking-tight mt-0.5 leading-none transition-colors duration-200 font-bold",
                isMoreActive
                  ? "text-primary dark:text-sky-400"
                  : "text-muted-foreground",
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* 2. Quick Access Bottom Sheet Modal */}
      <AnimatePresence>
        {isQuickAccessOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setQuickAccessOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Bottom Sheet Card */}
            <motion.div
              initial={{ opacity: 0, y: 70, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 70, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed bottom-20 inset-x-4 max-w-sm sm:max-w-md mx-auto z-50 md:hidden bg-card/98 dark:bg-card/95 backdrop-blur-2xl rounded-[32px] border border-border/80 shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-5 select-none overflow-hidden flex flex-col"
            >
              {/* Drag Pill Handle */}
              <div
                onClick={() => setQuickAccessOpen(false)}
                className="w-12 h-1.5 rounded-full bg-muted-foreground/25 mx-auto mb-3 cursor-pointer hover:bg-muted-foreground/40 transition-colors"
              />

              {/* Header: QUICK ACCESS | X modules */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-xs font-black tracking-widest text-muted-foreground/90 uppercase">
                  Quick Access
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {quickAccessModules.length} modules
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuickAccessOpen(false)}
                    className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4-Column Grid of Feature Modules */}
              <div className="py-4 px-1">
                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                  {quickAccessModules.map((item) => {
                    const isItemActive = item.path
                      ? location.pathname.startsWith(item.path)
                      : false;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTileClick(item)}
                        className="flex flex-col items-center group cursor-pointer text-center"
                      >
                        {/* Rounded Squircle Tile */}
                        <div
                          className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 relative group-hover:scale-105 active:scale-95 shadow-xs border",
                            isItemActive
                              ? "bg-primary/15 border-primary/50 text-primary dark:text-sky-400 shadow-sm"
                              : "bg-secondary/70 dark:bg-slate-800/80 border-border/80 dark:border-slate-700/80 text-foreground group-hover:bg-primary/10 group-hover:border-primary/40",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-6 h-6 transition-colors duration-200 stroke-[1.8]",
                              isItemActive
                                ? "text-primary dark:text-sky-400 stroke-[2.2]"
                                : "text-primary/90 dark:text-sky-300 group-hover:text-primary",
                            )}
                          />

                          {/* Optional Badge */}
                          {item.badge && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-black bg-rose-500 text-white rounded-full shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Label underneath */}
                        <span
                          className={cn(
                            "text-[10px] tracking-tight mt-1.5 line-clamp-2 leading-tight max-w-[68px] transition-colors",
                            isItemActive
                              ? "font-bold text-foreground"
                              : "font-medium text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. System & Account Utilities Footer Row (Sidebar parity on mobile) */}
              <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 mt-auto">
                {/* User Profile Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setQuickAccessOpen(false);
                    setProfileOpen(true);
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer truncate text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-primary/25">
                    {currentUser.name ? currentUser.name[0]?.toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-foreground truncate leading-none">
                      {currentUser.name || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                      {ROLE_LABELS[currentUser.role] || currentUser.role}
                    </span>
                  </div>
                </button>

                {/* Quick Action Utilities */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Theme Toggle */}
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle Theme"
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  {/* Hard Refresh / Reload Cache */}
                  <button
                    type="button"
                    onClick={handleHardRefreshClick}
                    disabled={isRefreshing}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer disabled:opacity-50"
                    title="Hard Refresh & Reload Cache"
                    aria-label="Hard Refresh"
                  >
                    <RotateCw
                      className={cn(
                        "w-4 h-4",
                        isRefreshing && "animate-spin text-primary",
                      )}
                    />
                  </button>

                  {/* Change Password */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAccessOpen(false);
                      setChangePasswordOpen(true);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                    title="Change Password"
                    aria-label="Change Password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Support Dialogs */}
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <HelpCenterDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
