import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DetailField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: {
    label: string;
    variant: "success" | "warning" | "destructive" | "info" | "default";
  };
  fields?: DetailField[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const statusStyles = {
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/15 text-warning border-warning/20",
  destructive: "bg-destructive/15 text-destructive border-destructive/20",
  info: "bg-info/15 text-info border-info/20",
  default: "bg-muted text-muted-foreground",
};

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  icon,
  status,
  fields = [],
  children,
  actions,
  className,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[calc(100dvh-2rem)] w-[94vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-full", className)}>
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-primary/[0.06] via-card to-card p-3.5 sm:gap-4 sm:p-4">
          {icon && (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-4 [&>svg]:w-4 sm:h-10 sm:w-10 [&>svg]:sm:h-5 [&>svg]:sm:w-5">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 pr-6">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base">
                  {title}
                </DialogTitle>
                {status && (
                  <Badge variant="outline" className={cn("py-0.5 text-[11px] font-semibold capitalize", statusStyles[status.variant])}>
                    {status.label}
                  </Badge>
                )}
              </div>
              {subtitle && <p className="mt-1 truncate text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-5">
          {children ? (
            children
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className={cn(
                    "min-w-0 rounded-xl border border-border/70 bg-background/60 p-3",
                    field.fullWidth && "sm:col-span-2"
                  )}
                >
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </p>
                  <div className="min-w-0 break-words text-sm font-medium leading-relaxed text-foreground">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-shrink-0 flex-col-reverse items-stretch gap-2 border-t border-border bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-end sm:p-3.5 [&>button]:w-full [&>button]:sm:w-auto">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
