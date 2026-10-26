import { useState } from "react";
import { Receipt, FileText, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Client } from "../types/client.types";
import type { ClientSoaData } from "../types/soa.types";
import { ClientSoaTab } from "./ClientSoaTab";
import { ClientQuotationsTab } from "./ClientQuotationsTab";

interface ClientFinancialsTabProps {
  client: Client;
}

export function ClientFinancialsTab({ client }: ClientFinancialsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"soa" | "quotations">("soa");
  const [soaData, setSoaData] = useState<ClientSoaData | null>(null);

  const pendingCount = soaData?.invoices?.length ?? null;
  const outstandingAmount = soaData?.summary?.totalOutstanding ?? null;

  return (
    <div className="space-y-4">
      {/* Segmented Sub-Tab Switcher */}
      <div className="flex items-center justify-between p-1 bg-muted/70 rounded-xl border border-border/60">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          {/* Statement of Account (SOA) Switcher Button */}
          <button
            type="button"
            onClick={() => setActiveSubTab("soa")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "soa"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-primary" />
            <span>Statement of Account (SOA)</span>
            {outstandingAmount !== null && (
              <Badge
                variant={outstandingAmount > 0 ? "destructive" : "outline"}
                className={`text-[10px] px-1.5 py-0 font-bold ${
                  outstandingAmount > 0
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                {outstandingAmount > 0
                  ? `AED ${outstandingAmount.toLocaleString("en-US", { minimumFractionDigits: 0 })} Due`
                  : "Settled"}
              </Badge>
            )}
          </button>

          {/* Quotations Switcher Button */}
          <button
            type="button"
            onClick={() => setActiveSubTab("quotations")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === "quotations"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Quotations</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Content */}
      <div className="pt-1">
        {activeSubTab === "soa" ? (
          <ClientSoaTab client={client} onDataLoaded={setSoaData} />
        ) : (
          <ClientQuotationsTab client={client} />
        )}
      </div>
    </div>
  );
}
