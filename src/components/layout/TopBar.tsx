import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthToken } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Menu,
  User,
  HelpCircle,
  Download,
  KeyRound,
  RotateCw,
  RefreshCw,
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { hardRefreshApp } from "@/lib/hardRefresh";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getActiveRole,
  setActiveRole,
  ROLE_LABELS,
  getCurrentUser,
  UserRole,
} from "@/lib/permissions";
import { UserProfileDialog } from "@/features/users/dialogs";
import { HelpCenterDialog } from "./HelpCenterDialog";
import { ChangePasswordDialog } from "@/features/auth/dialogs/ChangePasswordDialog";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/appConfig";

interface TopBarProps {
  isMobile?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuButton?: boolean;
}

export function TopBar({
  sidebarCollapsed = false,
  onToggleSidebar,
  isMobileMenuButton = false,
}: TopBarProps) {
  const navigate = useNavigate();
  const { showInstallButton, triggerInstall } = usePWA();
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "dark" || (!storedTheme && true);
  });
  const [activeRole, setActiveRoleState] = useState<UserRole>(getActiveRole());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleHardRefreshClick = async () => {
    setIsRefreshing(true);
    await hardRefreshApp();
  };

  useEffect(() => {
    const handleRoleChange = () => {
      setActiveRoleState(getActiveRole());
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

  const initials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = currentUser.name?.split(" ")[0] || "there";

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-background/95 backdrop-blur-xl border-b border-border/60 flex items-center justify-between px-3 md:px-6 shadow-sm">
      {/* Left side */}
      <div className="flex items-center gap-2 md:gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 hover:bg-muted"
            aria-label={
              isMobileMenuButton
                ? "Open menu"
                : sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
          >
            {isMobileMenuButton ? (
              <Menu className="w-5 h-5" />
            ) : sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </Button>
        )}
        <div className="flex flex-col">
          <h2 className="text-sm md:text-base font-bold text-foreground leading-tight">
            <span className="text-gradient">{greeting}</span>{" "}
            {/* <span className="text-foreground">{displayName}</span> */}
          </h2>
          <p className="text-[10px] text-muted-foreground block leading-tight">
            {/* {ROLE_LABELS[activeRole]} —{" "} */}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-2">
        {appConfig.enableRoleSwitcher && (
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 mr-2 shadow-sm shadow-primary/10">
            <span className="text-[10px] font-extrabold text-primary/60 uppercase tracking-widest hidden md:inline">
              Dev Role:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 hover:bg-primary/20 rounded-full text-xs font-bold gap-1.5 text-primary"
                >
                  {ROLE_LABELS[activeRole]}
                  <ChevronDown className="w-3 h-3 text-primary/60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover border border-border shadow-lg"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={cn(
                      "cursor-pointer text-xs font-medium",
                      activeRole === role &&
                        "bg-primary/10 text-primary focus:bg-primary/15",
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* PWA Download / Install App Button */}
        {showInstallButton && (
          <Button
            variant="default"
            size="sm"
            onClick={() => triggerInstall()}
            className="h-8 md:h-9 px-2.5 md:px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm rounded-lg animate-pulse hover:animate-none transition-all"
            title="Install AccreditOS ERP App"
            aria-label="Install App"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
        )}

        {/* Hard Refresh Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHardRefreshClick}
                disabled={isRefreshing}
                className="relative h-9 w-9 hover:bg-muted text-foreground/80 hover:text-foreground transition-all"
                aria-label="Hard Refresh App"
              >
                <RotateCw
                  className={cn(
                    "w-4 h-4 md:w-5 md:h-5 transition-transform duration-500",
                    isRefreshing && "animate-spin text-primary",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Hard Refresh (Clear Cache & Reload)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="relative h-9 w-9 hover:bg-muted"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            {darkMode ? (
              <motion.div
                key="moon"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-4 h-4 md:w-5 md:h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="w-4 h-4 md:w-5 md:h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-1 pr-2 md:pl-2 md:pr-3 hover:bg-muted h-9 md:h-10"
            >
              <Avatar className="w-7 h-7 md:w-8 md:h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover border border-border shadow-lg"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="font-medium text-sm">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
            <DropdownMenuItem
              onClick={() => setProfileOpen(true)}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="cursor-pointer"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleHardRefreshClick}
              disabled={isRefreshing}
              className="cursor-pointer"
            >
              <RotateCw
                className={cn(
                  "w-4 h-4 mr-2",
                  isRefreshing && "animate-spin text-primary",
                )}
              />
              Hard Refresh App
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                clearAuthToken();
                navigate("/login");
              }}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
      <HelpCenterDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
}
