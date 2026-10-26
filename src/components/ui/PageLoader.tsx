import React from "react";
import { cn } from "@/lib/utils";
import accreditLogo from "@/assets/Logo.png";

interface PageLoaderProps {
  className?: string;
  text?: string;
}

export function PageLoader({
  className,
  text = "Loading AccreditOS...",
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-screen bg-background text-foreground overflow-hidden items-center justify-center select-none",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <img
            src={accreditLogo}
            alt="AccreditOS"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
        {text && (
          <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

export default PageLoader;
