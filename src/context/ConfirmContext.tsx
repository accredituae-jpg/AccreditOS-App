import React, { createContext, useContext, useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ConfirmOptions {
  title: string;
  description: string;
  type?: "confirm" | "warning" | "success" | "info" | "destructive";
  confirmText?: string;
  cancelText?: string;
  requireVerificationText?: string;
  onConfirm?: () => Promise<void> | void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const defaultConfirm = async (options: ConfirmOptions): Promise<boolean> => {
  const confirmed = window.confirm(`${options.title}\n\n${options.description}`);
  if (confirmed && options.onConfirm) {
    try {
      await options.onConfirm();
    } catch (err) {
      console.error("Fallback confirmation callback failed:", err);
    }
  }
  return confirmed;
};

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: defaultConfirm,
});

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions & { resolve?: (val: boolean) => void }>({
    title: "",
    description: "",
  });

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...opts,
        resolve,
      });
      setOpen(true);
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      options.resolve?.(false);
    }
  };

  const handleConfirm = async () => {
    if (options.onConfirm) {
      try {
        await options.onConfirm();
      } catch (err) {
        console.error("Context confirmation callback failed:", err);
        throw err;
      }
    }
    options.resolve?.(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={options.title}
        description={options.description}
        type={options.type || "confirm"}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        requireVerificationText={options.requireVerificationText}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  return context ? context.confirm : defaultConfirm;
};
