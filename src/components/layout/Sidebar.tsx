import { useEffect, useState } from "react";
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
  WifiOff,
  Sun,
  Moon,
  User,
  KeyRound,
  RotateCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  UserCog,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    label: "Trainings & Inspect",
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
    icon: UserCog,
    label: "Staff & Users",
    path: "/users",
    featureKey: "users",
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

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = true }: SidebarProps) {
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

  const handleHardRefreshClick = async () => {
    setIsRefreshing(true);
    await hardRefreshApp();
  };

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

  const visibleItems = navItems.filter((item) =>
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
    <TooltipProvider delayDuration={150}>
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed left-3 top-3 bottom-3 z-40 w-[68px] bg-card/95 dark:bg-card/90 text-card-foreground rounded-[26px] border border-border/80 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between py-4 select-none backdrop-blur-xl"
      >
        {/* Top: Brand Capsule with Official Accredit Logo */}
        <div className="flex flex-col items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-11 h-11 rounded-2xl p-1 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative group flex items-center justify-center overflow-hidden"
                aria-label="AccreditOS ERP Dashboard"
              >
                <img
                  src={accreditLogo}
                  alt="Accredit ERP Logo"
                  className="w-full h-full object-contain filter drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground border-border text-xs font-semibold px-2.5 py-1 rounded-xl shadow-xl ml-2"
            >
              AccreditOS ERP
            </TooltipContent>
          </Tooltip>

          {/* Divider pip */}
          <div className="w-6 h-[1px] bg-border/60 my-1" />
        </div>

        {/* Center: Main Navigation Capsule Stack */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-2.5 w-full px-2 py-2 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group cursor-pointer",
                      isActive
                        ? "bg-primary/12 text-primary font-bold shadow-sm ring-1 ring-primary/25 dark:bg-primary/20 dark:text-sky-300 dark:ring-primary/35"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70 dark:hover:bg-muted/50",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-110",
                        isActive
                          ? "text-primary dark:text-sky-400 stroke-[2.2]"
                          : "stroke-[1.8]",
                      )}
                    />

                    {/* Active Indicator Glow Pip on right */}
                    {isActive && (
                      <motion.span
                        layoutId="activeNavPip"
                        className="absolute -right-1 w-1.5 h-4 rounded-full bg-primary shadow-[0_0_8px_rgba(4,160,219,0.7)]"
                      />
                    )}

                    {/* Optional Badge */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-black bg-rose-500 text-white rounded-full shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-popover text-popover-foreground border-border text-xs font-semibold px-2.5 py-1 rounded-xl shadow-xl ml-2 flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom: Quick Tools (Refresh, Theme & User Account) */}
        <div className="flex flex-col items-center gap-2.5 w-full pt-2 border-t border-border/60">
          {/* Hard Refresh Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleHardRefreshClick}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer disabled:opacity-50"
                aria-label="Hard Refresh App"
              >
                <RotateCw
                  className={cn(
                    "w-4.5 h-4.5 transition-transform duration-500",
                    isRefreshing && "animate-spin text-primary",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground border-border text-xs font-semibold px-2.5 py-1 rounded-xl shadow-xl ml-2"
            >
              Hard Refresh (Clear Cache & Reload)
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer"
                aria-label="Toggle Theme"
              >
                {darkMode ? (
                  <Sun className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                ) : (
                  <Moon className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground border-border text-xs font-semibold px-2.5 py-1 rounded-xl shadow-xl ml-2"
            >
              {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </TooltipContent>
          </Tooltip>

          {/* Offline alert pill */}
          {!isOnline && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <WifiOff className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-rose-950 text-rose-200 border-rose-800 text-xs px-2.5 py-1 rounded-xl shadow-xl ml-2"
              >
                Offline Mode
              </TooltipContent>
            </Tooltip>
          )}

          {/* User Profile Avatar with Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-sky-500 to-emerald-400 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer relative"
                    aria-label="User Account Menu"
                  >
                    <Avatar className="w-full h-full rounded-[14px]">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 text-[11px] font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-popover text-popover-foreground border-border text-xs font-semibold px-2.5 py-1 rounded-xl shadow-xl ml-2"
              >
                {currentUser.name || "User Account"}
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent
              side="right"
              align="end"
              className="w-56 bg-popover border border-border shadow-2xl ml-3 z-50"
            >
              <div className="px-3.5 py-2.5 border-b border-border/70">
                <p className="font-semibold text-xs text-foreground truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {currentUser.email}
                </p>
                <div className="mt-1">
                  <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => setProfileOpen(true)}
                className="cursor-pointer text-xs"
              >
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setChangePasswordOpen(true)}
                className="cursor-pointer text-xs"
              >
                <KeyRound className="w-4 h-4 mr-2 text-muted-foreground" />
                Change Password
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setHelpOpen(true)}
                className="cursor-pointer text-xs"
              >
                <HelpCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                Help Center
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleHardRefreshClick}
                disabled={isRefreshing}
                className="cursor-pointer text-xs"
              >
                <RotateCw
                  className={cn(
                    "w-4 h-4 mr-2 text-muted-foreground",
                    isRefreshing && "animate-spin text-primary",
                  )}
                />
                Hard Refresh App
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  clearAuthToken();
                  navigate("/login");
                }}
                className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <HelpCenterDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </TooltipProvider>
  );
}
