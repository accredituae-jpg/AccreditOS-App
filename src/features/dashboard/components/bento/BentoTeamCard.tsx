import { ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS, type UserProfile, type CurrentUser } from "@/lib/permissions";

interface BentoTeamCardProps {
  users?: UserProfile[];
  currentUser?: CurrentUser;
}

const roleGradients: Record<string, string> = {
  super_admin: "from-violet-600 to-indigo-600",
  admin: "from-blue-600 to-cyan-600",
  operation_admin: "from-emerald-600 to-teal-600",
  trainer: "from-amber-600 to-orange-600",
  staff: "from-slate-600 to-zinc-600",
};

export function BentoTeamCard({ users = [], currentUser }: BentoTeamCardProps) {
  const navigate = useNavigate();

  // If no users fetched, display the current authenticated user
  const effectiveUsers: Array<{
    id: string;
    name: string;
    roleLabel: string;
    initials: string;
    gradient: string;
  }> =
    users.length > 0
      ? users.slice(0, 6).map((u) => {
          const parts = (u.name || "User").trim().split(" ");
          const initials =
            parts.length >= 2
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : (parts[0]?.slice(0, 2) || "U").toUpperCase();
          const roleLabel = ROLE_LABELS[u.role] || u.role || "Staff";
          const gradient = roleGradients[u.role] || "from-violet-600 to-indigo-600";
          return { id: u.id, name: parts[0] || u.name, roleLabel, initials, gradient };
        })
      : currentUser
        ? [
            {
              id: currentUser.id || "curr",
              name: currentUser.name?.split(" ")[0] || "User",
              roleLabel: ROLE_LABELS[currentUser.role] || currentUser.role || "Admin",
              initials: (currentUser.name?.slice(0, 2) || "U").toUpperCase(),
              gradient: roleGradients[currentUser.role] || "from-violet-600 to-indigo-600",
            },
          ]
        : [];

  const topThree = effectiveUsers.slice(0, 3);
  const remaining = effectiveUsers.slice(3);

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-foreground">Team</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono">
            {users.length || effectiveUsers.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="View all users"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Real Avatars Row */}
      <div className="grid grid-cols-3 gap-2 py-2">
        {topThree.map((member) => (
          <div
            key={member.id}
            className="flex flex-col items-center text-center group cursor-pointer"
            onClick={() => navigate("/users")}
          >
            <div className="relative mb-1">
              <Avatar className="w-11 h-11 border-2 border-background shadow-xs group-hover:scale-105 transition-transform">
                <AvatarImage src="" />
                <AvatarFallback
                  className={`bg-gradient-to-tr ${member.gradient} text-white font-black text-xs`}
                >
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-background bg-emerald-500" />
            </div>
            <span className="text-xs font-bold text-foreground leading-tight truncate w-full">
              {member.name}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium truncate w-full">
              {member.roleLabel}
            </span>
          </div>
        ))}

        {topThree.length === 0 && (
          <div className="col-span-3 py-3 text-center text-xs text-muted-foreground">
            No team accounts registered yet.
          </div>
        )}
      </div>

      {/* Real Secondary Avatars Footer */}
      <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/50 min-h-[24px]">
        {remaining.length > 0 ? (
          <>
            <div className="flex -space-x-1.5">
              {remaining.map((m) => (
                <Avatar key={m.id} className="w-5 h-5 border-2 border-background">
                  <AvatarFallback className="bg-muted text-[8px] font-bold text-muted-foreground">
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium font-mono">
              +{remaining.length} more staff
            </span>
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">
            Authorized personnel
          </span>
        )}
      </div>
    </div>
  );
}
