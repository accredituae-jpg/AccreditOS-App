export type EntityName =
  | "clients"
  | "courses"
  | "trainings"
  | "certificates"
  | "invoices"
  | "expenses"
  | "receipts"
  | "dashboard";

/**
 * Deprecated: React Query manages query invalidation and refetching.
 */
export async function syncEntities(entities: EntityName[]): Promise<void> {
  // No-op: React Query handles invalidations directly
}

/**
 * Deprecated: React Query manages server data state.
 */
export async function syncWithServer(): Promise<void> {
  // No-op: React Query handles invalidations directly
}

