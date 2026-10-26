import { TabsContent } from "@/components/ui/tabs";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { DollarSign } from "lucide-react";
import { ReceiptTable } from "./ReceiptTable";
import { ReceiptCard } from "./ReceiptCard";
import type { Receipt } from "../types/billing.types";

interface ReceiptsTabProps {
  receipts: Receipt[];
  view: "list" | "grid";
  permissions: {
    canViewDetails: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  actions: {
    onView: (receipt: Receipt) => void;
    onPreview?: (receipt: Receipt) => void;
    onConfirmIssue: (id: string, receiptNumStr: string) => void;
    onEditDraft: (receipt: Receipt) => void;
    onDeleteDraft: (id: string) => void;
    onVoidClick: (receipt: Receipt) => void;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
}

export function ReceiptsTab({
  receipts,
  view,
  actions,
  permissions,
  pagination,
  loading = false,
}: ReceiptsTabProps) {
  return (
    <TabsContent value="receipts" className="mt-0">
      {loading ? (
        <div className="grid gap-4 p-4 md:p-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted/80" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted/80" />
              </div>
              <div className="mt-4 h-9 animate-pulse rounded-lg bg-muted/80" />
            </div>
          ))}
        </div>
      ) : receipts.length === 0 ? (
        <div className="p-6 md:p-8">
          <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card/20">
            <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No Receipts Recorded</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click "Record Receipt" in the header to log payment vouchers received from clients.
            </p>
          </div>
        </div>
      ) : view === "list" ? (
        <ReceiptTable
          receipts={receipts}
          actions={actions}
          permissions={permissions}
          loading={loading}
        />
      ) : (
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {receipts.map((receipt, index) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              index={index}
              actions={actions}
              permissions={permissions}
            />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-border bg-card/20">
          <CustomPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </TabsContent>
  );
}
export default ReceiptsTab;
