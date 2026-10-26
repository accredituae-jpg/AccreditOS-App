import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Building2, BadgeCheck, FileClock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AwardingBodiesTabProps {
  awardingBodies: any[];
  onAddClick: () => void;
  onToggleAwardingBody: (id: string, checked: boolean) => void;
  onEditAwardingBody: (body: any) => void;
  canManage?: boolean;
}

export function AwardingBodiesTab({
  awardingBodies,
  onAddClick,
  onToggleAwardingBody,
  onEditAwardingBody,
  canManage = true,
}: AwardingBodiesTabProps) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Awarding Bodies Directory ({Array.isArray(awardingBodies) ? awardingBodies.length : 0})
          </h3>
          <p className="text-xs text-muted-foreground">
            Configure certificate stamp fees, billing clients, and system generation rules.
          </p>
        </div>
        {canManage && (
          <Button onClick={onAddClick} className="gap-2 h-9.5 shadow-sm shrink-0 rounded-lg">
            <Plus className="w-4 h-4" />
            Add Awarding Body
          </Button>
        )}
      </div>

      {!Array.isArray(awardingBodies) || awardingBodies.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
          <ShieldCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No awarding bodies registered</p>
          <p className="text-xs text-muted-foreground/70 mb-4">Click "Add Awarding Body" to create your first awarding body.</p>
          <Button variant="outline" size="sm" onClick={onAddClick} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Awarding Body
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {awardingBodies.map((body, idx) => (
              <motion.div
                key={body.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="group relative bg-card/60 hover:bg-card border border-border/60 hover:border-primary/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header: Title & Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        {body.name}
                      </h4>
                      {body.trnNo && (
                        <p className="text-[11px] text-muted-foreground/90 font-mono mt-0.5">
                          TRN: <span className="text-foreground font-semibold">{body.trnNo}</span>
                        </p>
                      )}
                      {(body.location || body.phone) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
                          {[body.location, body.phone].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {body.client && (
                        <p className="text-[11px] text-muted-foreground/90 font-medium mt-1">
                          Billing Client: <span className="text-foreground/90">{body.client.companyName}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={body.isActive}
                        onCheckedChange={(checked) => onToggleAwardingBody(body.id, checked)}
                        disabled={!canManage}
                        className="data-[state=checked]:bg-success"
                        title={body.isActive ? "Active" : "Inactive"}
                      />
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/30">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Stamp Fee</span>
                      <span className="font-mono font-bold text-primary text-xs mt-0.5">
                        AED {parseFloat(body.certificateFee).toFixed(2)}
                      </span>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                      {body.isSystemIssued ? (
                        <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-[10px] font-semibold gap-1 px-2 py-0.5">
                          <BadgeCheck className="w-3 h-3" />
                          System Generated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] font-semibold gap-1 px-2 py-0.5">
                          <FileClock className="w-3 h-3" />
                          Third-Party
                        </Badge>
                      )}
                      {body.isActive ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] font-semibold px-2 py-0.5">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] font-semibold px-2 py-0.5">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Button */}
                {canManage && (
                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/70"
                      onClick={() => onEditAwardingBody(body)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Details
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
export default AwardingBodiesTab;
