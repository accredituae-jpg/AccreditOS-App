import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Edit2, Trash2, Plus, Layers, Search, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Course } from "@/lib/courses";
import { getCourseShortName } from "@/features/billing/utils/course-abbreviation";

interface CoursesTabProps {
  courses: Course[];
  onAddClick: (prefillName?: string) => void;
  onEditClick: (course: Course) => void;
  onDeleteClick: (id: string, name: string) => void;
}

export function CoursesTab({
  courses,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: CoursesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.id && c.id.toLowerCase().includes(q)),
    );
  }, [courses, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Accredited Courses</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {courses.length}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage course catalog offered for participant certifications and inspections.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Live Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course by name or ID..."
              className="pl-9 pr-8 h-9 text-xs bg-card border-border/80 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            onClick={() => onAddClick()}
            className="gap-2 h-9 text-xs shadow-sm shrink-0 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </Button>
        </div>
      </div>

      {/* Filter status indicator when searching */}
      {searchQuery && (
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/40 border border-border/60">
          <span className="text-muted-foreground">
            Showing <strong className="text-foreground">{filteredCourses.length}</strong> of{" "}
            <strong className="text-foreground">{courses.length}</strong> courses matching "
            <span className="text-primary font-medium">{searchQuery}</span>"
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* Course Cards Grid or Empty State */}
      {courses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No courses registered yet
          </p>
          <p className="text-xs text-muted-foreground/70 mb-4">
            Click "Add Course" to create your first training course.
          </p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20 space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No existing course matching "{searchQuery}"
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              This course name is available and has not been registered yet. You can safely add it.
            </p>
          </div>
          <Button
            onClick={() => onAddClick(searchQuery)}
            className="gap-1.5 h-8.5 text-xs mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add "{searchQuery.trim()}" as New Course</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="group relative bg-card/60 hover:bg-card border border-border/60 hover:border-primary/40 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md"
                        onClick={() => onEditClick(course)}
                        title="Edit Course"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={() => onDeleteClick(course.id, course.name)}
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1.5 rounded-md bg-muted/50 text-primary shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {course.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground/80">
                          ID: {course.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                          Invoice: {getCourseShortName(course.name)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
export default CoursesTab;
