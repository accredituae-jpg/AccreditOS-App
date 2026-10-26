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
      <DialogContent className={cn("w-[94vw] sm:w-full max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] rounded-2xl sm:rounded-xl", className)}>
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary/[0.04] to-card/20 backdrop-blur-sm p-4 sm:p-6 flex items-center gap-3 sm:gap-4 flex-shrink-0 border-b border-border/80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0%,transparent_35%)] opacity-10 pointer-events-none" />
          {icon && (
            <div className="relative flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-7 sm:[&>svg]:h-7">
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl ring-8 ring-primary/5 pointer-events-none" />
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 z-10 pr-6 sm:pr-8">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight truncate">
                  {title}
                </DialogTitle>
                {status && (
                  <Badge variant="outline" className={cn("text-xs py-0.5 font-semibold", statusStyles[status.variant])}>
                    {status.label}
                  </Badge>
                )}
              </div>
              {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed truncate">{subtitle}</p>}
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {children ? (
            children
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {fields.map((field, index) => (
                <div key={index} className={cn(field.fullWidth && "sm:col-span-2")}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{field.label}</p>
                  <div className="text-sm font-medium">{field.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="p-4 sm:p-5 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-2 bg-muted/15 flex-shrink-0 [&>button]:w-full [&>button]:sm:w-auto">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
