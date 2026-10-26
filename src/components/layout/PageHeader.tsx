import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  const headerActions = children ?? actions;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {headerActions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerActions}
        </div>
      )}
    </motion.div>
  );
}
