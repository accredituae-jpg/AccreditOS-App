export interface AwardingBodyRateTier {
  normal?: number | string;
  inspection?: number | string;
}

export type ClientCourseRates = Record<string, AwardingBodyRateTier>;

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  fax: string;
  email: string;
  trnNo: string;
  poBox: string;
  location: string;
  status: "active" | "archived";
  notes: string;
  courseRates?: ClientCourseRates | null;
  createdAt: string;
}

export function getClients(): Client[] {
  return [];
}

export function saveClients(clients: Client[]): void {
  // Deprecated: client-side persistence is replaced by server-side DB operations
}

