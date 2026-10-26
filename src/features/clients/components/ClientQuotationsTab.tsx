import { useState, useEffect } from "react";
import {
  Eye,
  FileText,
  Plus,
  Calendar,
  DollarSign,
  Building2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Client } from "../types/client.types";
import type { Quotation } from "../types/quotation.types";
import { QuotationPreviewDialog } from "../dialogs/QuotationPreviewDialog";
import { AddQuotationDialog } from "../dialogs/AddQuotationDialog";
import {
  getQuotationsForClient,
  subscribeQuotations,
  deleteStoredQuotation,
} from "../utils/quotationStorage";

interface ClientQuotationsTabProps {
  client: Client;
}

export function ClientQuotationsTab({ client }: ClientQuotationsTabProps) {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    getQuotationsForClient(client.companyName),
  );

  useEffect(() => {
    setQuotations(getQuotationsForClient(client.companyName));
    return subscribeQuotations(() => {
      setQuotations(getQuotationsForClient(client.companyName));
    });
  }, [client.companyName]);

  const handleView = (qtn: Quotation) => {
    setSelectedQuotation(qtn);
    setPreviewOpen(true);
  };

  const handleAddQuotation = (newQuotation: Quotation) => {
    setSelectedQuotation(newQuotation);
    setPreviewOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStoredQuotation(id);
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button Bar */}
      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Client Quotations</span>
          </h4>
          <p className="text-xs text-muted-foreground">
            Manage quotations for {client.companyName}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          className="gap-1.5 bg-[#004ba0] hover:bg-[#003c80] text-white text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Quotation</span>
        </Button>
      </div>

      {/* Quotations List */}
      <div className="space-y-3">
        {quotations.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border/80 rounded-xl bg-card/50 space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-foreground">
                No Quotations Issued Yet
              </h5>
            </div>
          </div>
        ) : (
          quotations.map((qtn) => (
            <div
              key={qtn.id}
              className="p-4 bg-card border border-border/80 rounded-xl hover:border-primary/40 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-primary">
                    {qtn.quotationNo}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-semibold"
                  >
                    {qtn.status || "sent"}
                  </Badge>
                </div>

                <h5 className="font-semibold text-sm text-foreground truncate">
                  {qtn.subject}
                </h5>

                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary/70" />
                    <span>{qtn.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-primary/70" />
                    <span>{qtn.items.length} Training Courses</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{qtn.totalAmount.toFixed(2)} AED</span>
                  </span>
                  {Boolean(qtn.discountAmount && qtn.discountAmount > 0) && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold"
                    >
                      {qtn.discountType === "percentage" && qtn.discountRate
                        ? `${qtn.discountRate}% Discount`
                        : `-${qtn.discountAmount?.toFixed(2)} AED Discount`}
                    </Badge>
                  )}
                  {qtn.paymentTerms && (
                    <span
                      className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50 truncate max-w-[240px]"
                      title={qtn.paymentTerms}
                    >
                      Terms: {qtn.paymentTerms}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(qtn)}
                  className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(qtn.id, e)}
                  title="Delete Quotation"
                  className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Quotation Dialog */}
      <AddQuotationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        client={client}
        onSave={handleAddQuotation}
      />

      {/* Quotation Preview Dialog */}
      <QuotationPreviewDialog
        quotation={selectedQuotation}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
