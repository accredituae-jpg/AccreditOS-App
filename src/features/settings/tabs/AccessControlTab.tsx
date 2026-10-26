import { motion, AnimatePresence } from "framer-motion";
import { Info, Lock, Edit3, CheckCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, UserRole, PermissionKey } from "@/lib/permissions";
import { MODULE_HIERARCHY } from "../constants/settings.constants";

interface AccessControlTabProps {
  selectedConfigRole: Exclude<UserRole, "super_admin">;
  setSelectedConfigRole: (role: Exclude<UserRole, "super_admin">) => void;
  permissions: Record<UserRole, Record<PermissionKey, boolean>>;
  onTogglePermission: (role: UserRole, key: PermissionKey, checked: boolean) => void;
  onBatchUpdatePermissions?: (role: UserRole, updates: Partial<Record<PermissionKey, boolean>>) => void;
  onReset: () => void;
  onSave: () => void;
}

export function AccessControlTab({
  selectedConfigRole,
  setSelectedConfigRole,
  permissions,
  onTogglePermission,
  onBatchUpdatePermissions,
  onReset,
  onSave,
}: AccessControlTabProps) {
  const handleEditAll = () => {
    const updates: Partial<Record<PermissionKey, boolean>> = {};
    MODULE_HIERARCHY.forEach((mod) => {
      const editActions = mod.actions.filter(
        (act) => act.startsWith("edit_") || act.startsWith("manage_"),
      );
      if (editActions.length > 0) {
        updates[mod.pageKey] = true;
        editActions.forEach((act) => {
          updates[act] = true;
        });
      }
    });

    if (onBatchUpdatePermissions) {
      onBatchUpdatePermissions(selectedConfigRole, updates);
    } else {
      Object.entries(updates).forEach(([key, val]) => {
        onTogglePermission(selectedConfigRole, key as PermissionKey, !!val);
      });
    }
  };

  const handleEnableAll = () => {
    const updates: Partial<Record<PermissionKey, boolean>> = {};
    MODULE_HIERARCHY.forEach((mod) => {
      updates[mod.pageKey] = true;
      mod.actions.forEach((act) => {
        updates[act] = true;
      });
    });

    if (onBatchUpdatePermissions) {
      onBatchUpdatePermissions(selectedConfigRole, updates);
    } else {
      Object.entries(updates).forEach(([key, val]) => {
        onTogglePermission(selectedConfigRole, key as PermissionKey, !!val);
      });
    }
  };

  const handleDisableAll = () => {
    const updates: Partial<Record<PermissionKey, boolean>> = {};
    MODULE_HIERARCHY.forEach((mod) => {
      updates[mod.pageKey] = false;
      mod.actions.forEach((act) => {
        updates[act] = false;
      });
    });

    if (onBatchUpdatePermissions) {
      onBatchUpdatePermissions(selectedConfigRole, updates);
    } else {
      Object.entries(updates).forEach(([key, val]) => {
        onTogglePermission(selectedConfigRole, key as PermissionKey, !!val);
      });
    }
  };

  const handleToggleModuleActions = (moduleActions: PermissionKey[], enable: boolean) => {
    const updates: Partial<Record<PermissionKey, boolean>> = {};
    moduleActions.forEach((act) => {
      updates[act] = enable;
    });

    if (onBatchUpdatePermissions) {
      onBatchUpdatePermissions(selectedConfigRole, updates);
    } else {
      moduleActions.forEach((act) => {
        onTogglePermission(selectedConfigRole, act, enable);
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Developer read-only notice card */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-primary">
            Developer Role Access
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            The <strong>Developer</strong> role bypasses all safety
            restrictions and retains full, permanent access to all
            dashboard pages, directories, action triggers, and
            configurations.
          </p>
        </div>
      </div>

      {/* Role Switcher & Batch Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 border border-border/60 p-3.5 rounded-xl">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Role to Configure
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              ["operation_admin", "admin", "trainer", "sales"] as Exclude<
                UserRole,
                "super_admin"
              >[]
            ).map((role) => (
              <Button
                key={role}
                type="button"
                variant={selectedConfigRole === role ? "default" : "outline"}
                className="h-8 px-3 rounded-lg text-xs font-semibold shadow-xs"
                onClick={() => setSelectedConfigRole(role)}
              >
                {ROLE_LABELS[role]}
              </Button>
            ))}
          </div>
        </div>

        {/* Batch Role Permissions Actions */}
        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditAll}
            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 rounded-lg font-semibold"
            title="Enable all edit actions across modules for this role"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit All</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEnableAll}
            className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg font-semibold"
            title="Enable all pages and actions for this role"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Enable All</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisableAll}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 rounded-lg font-medium"
            title="Disable all permissions for this role"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Disable All</span>
          </Button>
        </div>
      </div>

      {/* Grid of feature/module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column (even indices) */}
        <div className="space-y-6 flex flex-col">
          {MODULE_HIERARCHY.filter((_, idx) => idx % 2 === 0).map((module) => {
            const rolePerms = permissions[selectedConfigRole] || {};
            const pageActive = !!rolePerms[module.pageKey];
            const hasActions = module.actions.length > 0;
            const IconComponent = module.icon;

            return (
              <motion.div
                key={module.pageKey}
                layout
                className={cn(
                  "border rounded-2xl p-5 bg-card/40 backdrop-blur-sm transition-all duration-300 shadow-sm flex flex-col h-fit",
                  pageActive
                    ? "border-primary/30 shadow-primary/5 bg-primary/5"
                    : "border-border/60"
                )}
              >
                <div>
                  {/* Card Header with Icon, Name, and Main Switch */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          pageActive
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {module.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pageActive}
                      onCheckedChange={(checked) =>
                        onTogglePermission(
                          selectedConfigRole,
                          module.pageKey,
                          checked
                        )
                      }
                    />
                  </div>

                  {/* Animated Child Actions Section */}
                  {hasActions && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Operational Actions
                        </h4>
                        {pageActive && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleModuleActions(module.actions, true)}
                              className="text-[10px] text-primary hover:underline font-semibold"
                            >
                              Enable All
                            </button>
                            <span className="text-muted-foreground/40 text-[10px]">•</span>
                            <button
                              type="button"
                              onClick={() => handleToggleModuleActions(module.actions, false)}
                              className="text-[10px] text-muted-foreground hover:underline font-medium"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {pageActive ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 overflow-hidden"
                          >
                            {module.actions.map((actKey) => {
                              const meta = module.actionMetadata[actKey as keyof typeof module.actionMetadata] as any;
                              return (
                                <div
                                  key={actKey}
                                  className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-card/65 border border-border/40 hover:border-border transition-colors"
                                >
                                  <div>
                                    <p className="font-semibold text-xs text-foreground/90">
                                      {meta?.name || actKey}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {meta?.description}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={
                                      !!(permissions[selectedConfigRole]?.[actKey])
                                    }
                                    onCheckedChange={(checked) =>
                                      onTogglePermission(
                                        selectedConfigRole,
                                        actKey,
                                        checked
                                      )
                                    }
                                  />
                                </div>
                              );
                            })}
                          </motion.div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground/60 italic py-2 flex items-center gap-1.5">
                            Enable page access above to configure action
                            permissions.
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column (odd indices) */}
        <div className="space-y-6 flex flex-col">
          {MODULE_HIERARCHY.filter((_, idx) => idx % 2 !== 0).map((module) => {
            const rolePerms = permissions[selectedConfigRole] || {};
            const pageActive = !!rolePerms[module.pageKey];
            const hasActions = module.actions.length > 0;
            const IconComponent = module.icon;

            return (
              <motion.div
                key={module.pageKey}
                layout
                className={cn(
                  "border rounded-2xl p-5 bg-card/40 backdrop-blur-sm transition-all duration-300 shadow-sm flex flex-col h-fit",
                  pageActive
                    ? "border-primary/30 shadow-primary/5 bg-primary/5"
                    : "border-border/60"
                )}
              >
                <div>
                  {/* Card Header with Icon, Name, and Main Switch */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          pageActive
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {module.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pageActive}
                      onCheckedChange={(checked) =>
                        onTogglePermission(
                          selectedConfigRole,
                          module.pageKey,
                          checked
                        )
                      }
                    />
                  </div>

                  {/* Animated Child Actions Section */}
                  {hasActions && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Operational Actions
                        </h4>
                        {pageActive && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleModuleActions(module.actions, true)}
                              className="text-[10px] text-primary hover:underline font-semibold"
                            >
                              Enable All
                            </button>
                            <span className="text-muted-foreground/40 text-[10px]">•</span>
                            <button
                              type="button"
                              onClick={() => handleToggleModuleActions(module.actions, false)}
                              className="text-[10px] text-muted-foreground hover:underline font-medium"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <AnimatePresence initial={false}>
                        {pageActive ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4 overflow-hidden"
                          >
                            {module.actions.map((actKey) => {
                              const meta = module.actionMetadata[actKey as keyof typeof module.actionMetadata] as any;
                              return (
                                <div
                                  key={actKey}
                                  className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-card/65 border border-border/40 hover:border-border transition-colors"
                                >
                                  <div>
                                    <p className="font-semibold text-xs text-foreground/90">
                                      {meta?.name || actKey}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {meta?.description}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={
                                      !!(permissions[selectedConfigRole]?.[actKey])
                                    }
                                    onCheckedChange={(checked) =>
                                      onTogglePermission(
                                        selectedConfigRole,
                                        actKey,
                                        checked
                                      )
                                    }
                                  />
                                </div>
                              );
                            })}
                          </motion.div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground/60 italic py-2 flex items-center gap-1.5">
                            Enable page access above to configure action
                            permissions.
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex justify-end gap-3 border-t border-border pt-5 mt-6">
        <Button variant="outline" onClick={onReset} className="rounded-lg">
          Reset Changes
        </Button>
        <Button onClick={onSave} className="shadow-md font-semibold rounded-lg">
          Save Access Rules
        </Button>
      </div>
    </div>
  );
}
export default AccessControlTab;
