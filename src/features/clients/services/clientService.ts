import {
  apiGetClients,
  apiCreateClient,
  apiUpdateClient,
  apiDeleteClient,
} from "@/lib/api";
import { Client } from "@/lib/clients";

export const clientService = {
  getClients: async (): Promise<Client[]> => {
    const res = await apiGetClients();
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to fetch clients");
    }
    return res.data;
  },

  createClient: async (clientData: Omit<Client, "id" | "createdAt">): Promise<Client> => {
    const res = await apiCreateClient(clientData);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to create client");
    }
    return res.data;
  },

  updateClient: async (id: string, clientData: Client): Promise<Client> => {
    const res = await apiUpdateClient(id, clientData);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to update client");
    }
    return res.data;
  },

  deleteClient: async (id: string): Promise<void> => {
    const res = await apiDeleteClient(id);
    if (!res.success) {
      throw new Error(res.message || "Failed to delete client");
    }
  },
};
