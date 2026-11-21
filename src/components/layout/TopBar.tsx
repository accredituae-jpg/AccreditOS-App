import { useState, useEffect } from "react";
import { Menu, ChevronDown, Search, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-background/85 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-3 md:px-6 shadow-2xs transition-all">
        {/* Left Section: Mobile menu toggle + Greeting & Live System Indicator */}
        <div className="flex items-center gap-2 md:gap-3">
          {isMobileMenuButton && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9 hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-foreground leading-tight tracking-tight">
                <span>{greeting}</span>,{" "}
                <span className="text-primary font-black">{displayName}</span>
              </h2>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ops
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground leading-tight mt-0.5">
              <Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Center / Right Section: Global Quick Search & System Utilities */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Search & Command Trigger Bar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border/70 bg-card/70 hover:bg-muted/40 hover:border-primary/40 text-muted-foreground hover:text-foreground text-xs transition-all shadow-2xs group cursor-pointer"
            title="Search modules & operations (⌘K)"
            aria-label="Search modules and operations"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden md:inline text-[11px] font-medium text-muted-foreground">
              Search modules & actions...
            </span>
            <kbd className="ml-1 sm:ml-2 px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-background border border-border/80 rounded text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Live System Health Badge (desktop) */}
          {/* <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card/60 border border-border/50 text-[11px] font-semibold text-muted-foreground shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400">
              All Systems Nominal
            </span>
          </div> */}

          {/* Developer Role Switcher (if enabled) */}
          {appConfig.enableRoleSwitcher && (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/25 rounded-full px-2.5 py-1 shadow-2xs">
              <span className="text-[10px] font-extrabold text-primary/70 uppercase tracking-widest hidden md:inline">
                Role:
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 hover:bg-primary/20 rounded-full text-xs font-bold gap-1 text-primary cursor-pointer"
                  >
                    {ROLE_LABELS[activeRole]}
                    <ChevronDown className="w-3 h-3 text-primary/70" />
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
