import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { GraduationCap, AlertCircle, Info } from "lucide-react";
import type { Course } from "@/lib/courses";
import { getCourseShortName } from "@/features/billing/utils/course-abbreviation";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onValueChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  buttonText: string;
  existingCourses?: Course[];
  currentCourseId?: string;
}

export function CourseDialog({
  open,
  onOpenChange,
  title,
  value,
  onValueChange,
  onSubmit,
  buttonText,
  existingCourses = [],
  currentCourseId,
}: CourseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = value.trim();
  const isDuplicate = existingCourses.some(
    (c) =>
      c.id !== currentCourseId &&
      c.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  const similarCourses =
    trimmed.length >= 3 && !isDuplicate
      ? existingCourses
          .filter(
            (c) =>
              c.id !== currentCourseId &&
              c.name.toLowerCase().includes(trimmed.toLowerCase()) &&
              c.name.trim().toLowerCase() !== trimmed.toLowerCase(),
          )
          .slice(0, 3)
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate || !trimmed) return;
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } catch (err) {
      console.error("Error submitting course form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={title}
      description="Add or edit course offerings in your catalog"
      icon={GraduationCap}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={isDuplicate || !trimmed}
      submitLabel={buttonText}
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="courseName" className="text-xs font-semibold">
            Course Title *
          </Label>
          <Input
            id="courseName"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="e.g. OSHA 30-Hour Construction Safety"
            required
            autoFocus
            className={isDuplicate ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {trimmed && (
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <span>Invoice Abbreviation:</span>
              <span className="font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded font-mono">
                {getCourseShortName(trimmed)}
              </span>
            </p>
          )}
        </div>

        {/* Duplicate Error Warning */}
        {isDuplicate && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Course already exists</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                A course with the name "{trimmed}" is already registered in your catalog. Please use a unique title.
              </p>
            </div>
          </div>
        )}

        {/* Similar Courses Hint */}
        {similarCourses.length > 0 && (
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Similar existing courses:</span>
            </div>
            <ul className="space-y-0.5 pl-5 list-disc text-foreground text-[11px]">
              {similarCourses.map((c) => (
                <li key={c.id} className="truncate">
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
export default CourseDialog;
