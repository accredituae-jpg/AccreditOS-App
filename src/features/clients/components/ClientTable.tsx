import React, { memo } from "react";
import {
  MoreHorizontal,
  Edit,
  Archive,
  CheckCircle,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ClientStatusBadge } from "./ClientStatusBadge";
import type { Client } from "../types/client.types";

interface ClientTableProps {
  paginatedClients: Client[];
  canViewDetails: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onViewDetails: (client: Client) => void;
  onEdit: (client: Client) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export const ClientTable = memo(function ClientTable({
  paginatedClients,
  canViewDetails,
  canEdit,
  canDelete,
  onViewDetails,
  onEdit,
  onToggleArchive,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  loading = false,
  onPageChange,
}: ClientTableProps) {
  return (
    <div className="card-elevated overflow-hidden border border-border/40">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>TRN Number</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  <td><Skeleton className="h-4 w-36" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-28" /></td>
                  <td><Skeleton className="h-4 w-40" /></td>
                  <td><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : paginatedClients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No clients found.
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => canViewDetails && onViewDetails(client)}
                  className={cn(
                    "transition-colors duration-150 hover:bg-muted/30",
                    canViewDetails && "cursor-pointer"
                  )}
                >
                  <td>
                    <span className="font-medium">{client.companyName}</span>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">
                    {client.trnNo || "—"}
                  </td>
                  <td className="text-muted-foreground">
                    {client.phone ? (
                      <button
                        type="button"
                        onClick={(e) =>
                          openWhatsApp(
                            client.phone,
                            `Hello ${client.companyName}, contacting you from AccreditOS.`,
                            e,
                          )
                        }
                        className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors group cursor-pointer"
                        title={`Chat on WhatsApp (${client.phone})`}
                      >
                        <span className="">{client.phone}</span>
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-muted-foreground">{client.email}</td>
                  <td>
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(client)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => onToggleArchive(client.id)}
                          >
                            {client.status === "active" ? (
                              <>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(client.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages >= 1 && (
        <div className="p-3 border-t border-border">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            isLoading={loading}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
});
