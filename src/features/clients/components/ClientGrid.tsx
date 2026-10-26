import { motion } from "framer-motion";
import {
  Building2,
  MoreHorizontal,
  Edit,
  Archive,
  CheckCircle,
  Trash2,
  Eye,
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

interface ClientGridProps {
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

export function ClientGrid({
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
}: ClientGridProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-card-${i}`} className="grid-card space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="pt-3 border-t border-border flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          ))
        ) : paginatedClients.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed border-border/60 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground">No clients found.</p>
          </div>
        ) : (
          paginatedClients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className={cn(
              "grid-card relative",
              canViewDetails && "cursor-pointer",
            )}
            onClick={() => canViewDetails && onViewDetails(client)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate text-primary">
                    {client.companyName}
                  </h3>
                </div>
              </div>
              <ClientStatusBadge
                status={client.status}
                pulse={true}
                className="text-xs font-semibold px-2 py-0.5 shrink-0"
              />
            </div>

            <div className="space-y-2 text-sm pt-1">
              <div
                className="flex justify-between items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-muted-foreground text-xs">Phone</span>
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
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors group cursor-pointer"
                    title={`Chat on WhatsApp (${client.phone})`}
                  >
                    <span className="">{client.phone}</span>
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span
                  className="font-medium text-foreground truncate max-w-[160px] text-right"
                  title={client.email}
                >
                  {client.email}
                </span>
              </div>
              {client.trnNo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TRN No.</span>
                  <span className="font-mono text-xs text-foreground font-medium">
                    {client.trnNo}
                  </span>
                </div>
              )}
              {client.location && (
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span className="text-muted-foreground">Location</span>
                  <span
                    className="text-foreground truncate max-w-[160px] text-right"
                    title={client.location}
                  >
                    {client.location}
                  </span>
                </div>
              )}
            </div>

            <div
              className="mt-3 pt-3 border-t border-border flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => onViewDetails(client)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                View Profile
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Profile
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() => onToggleArchive(client.id)}
                    >
                      {client.status === "active" ? (
                        <>
                          <Archive className="w-4 h-4 mr-2" /> Archive
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" /> Activate
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
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )))}
      </motion.div>

      {totalPages > 1 && (
        <div className="card-elevated p-4 mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
