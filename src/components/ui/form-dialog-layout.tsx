import * as React from "react";
import { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon | React.ReactNode;
}

export function FormDialogHeader({
  title,
  description,
  icon,
}: FormDialogHeaderProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="h-5 w-5 sm:h-7 sm:w-7" />;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/[0.04] to-card/20 backdrop-blur-sm p-3.5 sm:p-6 flex items-center gap-2.5 sm:gap-4 flex-shrink-0 border-b border-border/80">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0%,transparent_35%)] opacity-10 pointer-events-none" />
      <div className="relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg flex-shrink-0">
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl ring-8 ring-primary/5 pointer-events-none" />
        {renderIcon()}
      </div>
      <div className="flex-1 min-w-0 z-10 pr-7 sm:pr-8">
        <DialogTitle className="text-base sm:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight truncate">
          {title}
        </DialogTitle>
        <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed truncate sm:whitespace-normal">
          {description}
        </DialogDescription>
      </div>
    </div>
  );
}

interface FormDialogFooterProps {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  loadingText?: string;
  submitDisabled?: boolean;
}

export function FormDialogFooter({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel = "Save Changes",
  isSubmitting = false,
  loadingText = "Saving...",
  submitDisabled = false,
}: FormDialogFooterProps) {
  return (
    <div className="p-3.5 sm:p-5 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 bg-muted/15 flex-shrink-0">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="h-9 w-full sm:w-auto px-4 text-xs font-medium"
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        loading={isSubmitting}
        loadingText={loadingText}
        disabled={submitDisabled}
        className="h-9 w-full sm:w-auto px-4 text-xs font-semibold shadow-sm"
      >
        {submitLabel}
      </Button>
    </div>
  );
}

interface FormSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FormSectionHeader({
  icon: Icon,
  title,
  description,
}: FormSectionHeaderProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            {title}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <div className="border-b border-border/40" />
    </div>
  );
}

interface FormDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAttempt?: () => void;
  title: string;
  description: string;
  icon?: LucideIcon | React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  loadingText?: string;
  maxWidth?: string;
  children: React.ReactNode;
  topContent?: React.ReactNode;
  customFooter?: React.ReactNode;
  submitDisabled?: boolean;
  hideFooter?: boolean;
  isDirty?: boolean;
}

export function FormDialog({
  open,
  onOpenChange,
  onCloseAttempt,
  title,
  description,
  icon,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Changes",
  loadingText = "Saving...",
  maxWidth = "max-w-2xl",
  children,
  topContent,
  customFooter,
  submitDisabled = false,
  hideFooter = false,
}: FormDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onCloseAttempt) onCloseAttempt();
  };

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onCloseAttempt) onCloseAttempt();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`w-[95vw] sm:w-full ${maxWidth} p-0 gap-0 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] rounded-2xl sm:rounded-xl`}
      >
        {icon ? (
          <FormDialogHeader title={title} description={description} icon={icon} />
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-b from-primary/[0.04] to-card/20 backdrop-blur-sm p-3.5 sm:p-6 flex flex-col flex-shrink-0 border-b border-border/80">
            <DialogTitle className="text-base sm:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight truncate">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-relaxed truncate sm:whitespace-normal">
              {description}
            </DialogDescription>
          </div>
        )}
        {topContent}
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-6 flex-1">
              {children}
            </div>
            {!hideFooter &&
              (customFooter ? (
                customFooter
              ) : (
                <FormDialogFooter
                  onCancel={handleClose}
                  submitLabel={submitLabel}
                  isSubmitting={isSubmitting}
                  loadingText={loadingText}
                  submitDisabled={submitDisabled}
                />
              ))}
          </form>
        ) : (
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-6 flex-1">
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
