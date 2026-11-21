import { useMemo } from "react";
import { GraduationCap, Award, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Training } from "@/features/trainings/types/trainings.types";

interface BentoTopCoursesCardProps {
  trainings?: Training[];
}

export function BentoTopCoursesCard({ trainings = [] }: BentoTopCoursesCardProps) {
  const navigate = useNavigate();

  // Aggregate real courses by courseName
  const topCourses = useMemo(() => {
    if (!trainings || trainings.length === 0) return [];

    const map = new Map<
      string,
      {
        title: string;
        count: number;
        awardingBody: string;
        clients: Set<string>;
      }
    >();

    for (const t of trainings) {
      const name = (t.courseName || "").trim();
      if (!name) continue;

      const existing = map.get(name) || {
        title: name,
        count: 0,
        awardingBody: t.awardingBodyName || "Accredited",
        clients: new Set<string>(),
      };

      existing.count += 1;
      if (t.clientName) existing.clients.add(t.clientName);
      if (t.awardingBodyName) existing.awardingBody = t.awardingBodyName;
      map.set(name, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
  }, [trainings]);

  return (
    <div className="rounded-[24px] bg-card border border-border/70 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-foreground">
            Top Training Programs
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono">
            {topCourses.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/trainings")}
          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {/* Real Course Cards Grid */}
      {topCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topCourses.map((course, idx) => (
            <div
              key={course.title}
              onClick={() => navigate("/trainings")}
              className="p-3 rounded-2xl border border-border/60 bg-muted/15 hover:bg-muted/30 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-2xs"
            >
              {/* Top row: Awarding Body badge & batch count */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 truncate max-w-[120px]">
                  {course.awardingBody}
                </span>
                <span className="font-mono font-black text-xs text-foreground bg-muted/60 px-1.5 py-0.5 rounded-lg shrink-0">
                  {course.count} {course.count === 1 ? "batch" : "batches"}
                </span>
              </div>

              {/* Title & Icon */}
              <div className="flex items-start gap-2 pt-1">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                    idx === 0
                      ? "bg-violet-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h4>
              </div>

              {/* Bottom stats: client count */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-muted-foreground/70" />
                  {course.clients.size} {course.clients.size === 1 ? "Client" : "Clients"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center flex flex-col items-center justify-center text-muted-foreground gap-2">
          <GraduationCap className="w-8 h-8 stroke-1 text-muted-foreground/40" />
          <span className="text-xs font-medium">No training batches recorded yet.</span>
          <button
            type="button"
            onClick={() => navigate("/trainings")}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Create First Training</span>
          </button>
        </div>
      )}
    </div>
  );
}
