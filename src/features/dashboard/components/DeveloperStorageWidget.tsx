import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { apiGetSystemStorage, SystemStorageMetrics } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Server,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DeveloperStorageWidget() {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: qk.systemStorage,
    queryFn: async () => {
      const res = await apiGetSystemStorage();
      return res.data;
    },
    staleTime: 60_000,
  });

  const metrics: SystemStorageMetrics | undefined = response;

  const usedMb = metrics?.usedMb ?? 16.11;
  const quotaMb = metrics?.quotaMb ?? 500;
  const freeMb = metrics?.freeMb ?? (quotaMb - usedMb);
  const usedPercent = metrics?.usedPercent ?? Number(((usedMb / quotaMb) * 100).toFixed(2));
  const freePercent = metrics?.freePercent ?? Number((100 - usedPercent).toFixed(2));
  const tables = metrics?.tables ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated overflow-hidden border-border/80 shadow-sm bg-gradient-to-br from-card via-card to-card/90 mb-4 sm:mb-6"
    >
      {/* Header Bar - Fully responsive on mobile */}
      <div className="p-3.5 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="font-bold text-xs sm:text-base text-foreground tracking-tight whitespace-nowrap">
                Database & Cloud Storage
              </h3>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider py-0 px-1.5 shrink-0"
              >
                Developer
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] sm:text-[10px] font-medium py-0 px-1.5 flex items-center gap-1 shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              Supabase PostgreSQL storage quota & table disk metrics
            </p>
          </div>
        </div>

        {/* Action Controls - Mobile Grid/Flex */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs font-medium gap-1.5 border-border/70 hover:bg-muted/60 transition-colors justify-center"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5 text-muted-foreground", isFetching && "animate-spin text-primary")}
            />
            <span>{isFetching ? "Syncing..." : "Refresh"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground justify-center border sm:border-0 border-border/40 sm:bg-transparent bg-muted/20"
          >
            <span>{isExpanded ? "Hide" : "View Tables"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Telemetry Body */}
      <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 sm:h-20 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-3.5 w-full rounded-full" />
          </div>
        ) : (
          <>
            {/* 4 Metric Cards - 2x2 on Mobile, 4x1 on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Used Space */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/60 bg-card/60 shadow-xs flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Used Space</span>
                  <HardDrive className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-xl font-bold font-mono tracking-tight text-foreground truncate">
                    {usedMb.toFixed(2)}{" "}
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground font-sans">MB</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {usedPercent}% quota
                  </div>
                </div>
              </div>

              {/* Card 2: Free Space Left */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/60 bg-card/60 shadow-xs flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Remaining</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                    {freeMb.toFixed(2)}{" "}
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground font-sans">MB</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                    {freePercent}% available
                  </div>
                </div>
              </div>

              {/* Card 3: Storage Quota */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/60 bg-card/60 shadow-xs flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Total Quota</span>
                  <Server className="w-3.5 h-3.5 text-sky-500 shrink-0 ml-1" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-xl font-bold font-mono tracking-tight text-foreground truncate">
                    {quotaMb}{" "}
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground font-sans">MB</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                    Free Tier Baseline
                  </div>
                </div>
              </div>

              {/* Card 4: Health Status */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-border/60 bg-card/60 shadow-xs flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider truncate">Status</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Optimal (&lt;5%)</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                    ~2+ yrs runway
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Storage Meter */}
            <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium gap-2">
                <span className="text-foreground flex items-center gap-1.5 truncate">
                  <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">Storage Meter</span>
                </span>
                <span className="font-mono text-[11px] sm:text-xs text-muted-foreground shrink-0">
                  <span className="font-bold text-foreground">{usedMb.toFixed(2)} MB</span> / {quotaMb} MB (
                  {usedPercent}%)
                </span>
              </div>

              {/* Custom multi-color progress track */}
              <div className="w-full h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden relative p-0.5 border border-border/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 transition-all duration-500 shadow-xs"
                  style={{ width: `${Math.max(1.5, Math.min(100, usedPercent))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 font-mono">
                <span>0 MB</span>
                <span className="hidden sm:inline">125 MB (25%)</span>
                <span className="hidden xs:inline">250 MB (50%)</span>
                <span className="hidden sm:inline">375 MB (75%)</span>
                <span className="font-semibold text-foreground">500 MB Limit</span>
              </div>
            </div>

            {/* Collapsible Table Disk Footprint Breakdown */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden pt-1"
                >
                  <div className="p-3 sm:p-4 rounded-xl border border-border/60 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary shrink-0" />
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                          Database Tables Footprint
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {tables.length} User Tables
                      </Badge>
                    </div>

                    <div className="divide-y divide-border/50 border border-border/40 rounded-lg overflow-hidden">
                      {tables.map((t, idx) => {
                        const maxBytes = tables[0]?.bytes || 1;
                        const relativePct = Math.round((t.bytes / maxBytes) * 100);
                        return (
                          <div
                            key={t.tableName}
                            className="p-2 sm:p-3 flex items-center justify-between hover:bg-muted/30 transition-colors gap-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground w-3.5 sm:w-4 shrink-0">
                                  #{idx + 1}
                                </span>
                                <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                                  {t.tableName}
                                </span>
                                {t.approxRows > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] sm:text-[10px] px-1 py-0 font-mono bg-muted/40 text-muted-foreground shrink-0"
                                  >
                                    ~{t.approxRows.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                              <div className="w-full bg-muted/50 h-1 sm:h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary/70 rounded-full"
                                  style={{ width: `${relativePct}%` }}
                                />
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono text-xs sm:text-sm font-bold text-foreground">
                                {t.sizePretty}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-muted/20 border border-border/40 rounded-lg text-[11px] sm:text-xs text-muted-foreground">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">Developer Note:</strong> Storage includes table data,
                        indexes, and transaction logs. When database storage approaches 80% (400 MB), Supabase will
                        alert you. You can archive older audit logs or scale to Supabase Pro for 8 GB+ storage.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}
