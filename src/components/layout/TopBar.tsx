import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import accreditLogo from "@/assets/Accredit-Logo_Png.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getActiveRole,
  setActiveRole,
  ROLE_LABELS,
  getCurrentUser,
  UserRole,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/appConfig";
import { QuickSearchDialog } from "./QuickSearchDialog";

interface TopBarProps {
  isMobile?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuButton?: boolean;
}

export function TopBar({
  onToggleSidebar,
  isMobileMenuButton = false,
}: TopBarProps) {
  const [activeRole, setActiveRoleState] = useState<UserRole>(getActiveRole());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [searchOpen, setSearchOpen] = useState(false);

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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = currentUser.name?.split(" ")[0] || "there";

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-background/85 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-2.5 sm:px-4 md:px-6 shadow-2xs transition-all">
        {/* Left Section: Mobile Logo + Greeting & Live System Indicator */}
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0">
          {/* Official Accredit Brand Logo for Mobile */}
          <Link
            to="/"
            className="flex md:hidden w-8 h-8 rounded-xl p-1 bg-white border border-slate-200/90 shadow-2xs items-center justify-center shrink-0 overflow-hidden hover:scale-105 active:scale-95 transition-all"
            aria-label="AccreditOS Home"
          >
            <img
              src={accreditLogo}
              alt="Accredit ERP Logo"
              className="w-full h-full object-contain filter drop-shadow-2xs"
            />
          </Link>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-tight tracking-tight truncate">
                <span>{greeting}</span>,{" "}
                <span className="text-primary font-black">{displayName}</span>
              </h2>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ops
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground leading-tight mt-0.5 truncate">
              <Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Center / Right Section: Global Quick Search & System Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          {/* Quick Search & Command Trigger Bar (Enhanced Mobile & Desktop UI) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-border/80 bg-muted/40 dark:bg-muted/20 hover:bg-muted/70 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs transition-all shadow-2xs group cursor-pointer"
            title="Search modules & actions (⌘K)"
            aria-label="Search modules and operations"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground/90 group-hover:text-foreground transition-colors hidden xs:inline sm:inline">
              <span className="inline md:hidden">Search</span>
              <span className="hidden md:inline">Search modules & actions...</span>
            </span>
            <kbd className="hidden md:inline-flex ml-2 px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-background border border-border/80 rounded text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Developer Role Switcher (if enabled) */}
          {appConfig.enableRoleSwitcher && (
            <div className="flex items-center gap-1 bg-primary/10 border border-primary/25 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-2xs">
              <span className="text-[10px] font-extrabold text-primary/70 uppercase tracking-widest hidden md:inline">
                Role:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 sm:px-1.5 hover:bg-primary/20 rounded-full text-[11px] sm:text-xs font-bold gap-1 text-primary cursor-pointer max-w-[85px] sm:max-w-none truncate"
                  >
                    <span className="truncate">{ROLE_LABELS[activeRole]}</span>
                    <ChevronDown className="w-3 h-3 text-primary/70 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-popover border border-border shadow-xl z-50"
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => setActiveRole(role)}
                      className={cn(
                        "cursor-pointer text-xs font-medium",
                        activeRole === role &&
                          "bg-primary/10 text-primary focus:bg-primary/15 font-semibold",
                      )}
                    >
                      {ROLE_LABELS[role]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Global Quick Search Command Palette */}
      <QuickSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
