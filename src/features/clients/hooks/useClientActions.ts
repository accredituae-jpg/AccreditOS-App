import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { apiGetClients, apiCreateClient, apiUpdateClient, apiDeleteClient } from "@/lib/api/clientApi";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/lib/clients";
import { useConfirm } from "@/context/ConfirmContext";
import { getTrainings, Training } from "@/lib/trainings";

export function useClientActions() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: qk.clients(),
    queryFn: async () => {
      const res = await apiGetClients({ limit: 1000 });
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (clientData: Omit<Client, "id" | "createdAt">) => apiCreateClient(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedClient: Partial<Client> & { id: string }) => apiUpdateClient(updatedClient.id, updatedClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleCreate = async (clientData: Omit<Client, "id" | "createdAt">) => {
    try {
      const res = await createMutation.mutateAsync(clientData);
      if (!res.success) {
        throw new Error(res.message || "Failed to create client");
      }
      toast({
        title: "Client Created",
        description: `Successfully added "${clientData.companyName}".`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to Add Client",
        description: err.message || "An error occurred while creating client",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleUpdate = async (updatedClient: Client) => {
    try {
      const res = await updateMutation.mutateAsync(updatedClient);
      if (!res.success) {
        throw new Error(res.message || "Failed to update client");
      }
      toast({
        title: "Client Profile Updated",
        description: `Successfully saved changes for "${updatedClient.companyName}".`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "An error occurred while updating client",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleToggleArchive = async (id: string) => {
    const target = clients.find((c) => c.id === id);
    if (!target) return;

    const nextStatus: Client["status"] = target.status === "active" ? "archived" : "active";
    try {
      const res = await updateMutation.mutateAsync({ ...target, status: nextStatus });
      if (!res.success) {
        throw new Error(res.message || "Failed to toggle client archive status");
      }
      toast({
        title: nextStatus === "archived" ? "Client Archived" : "Client Activated",
        description: `Client "${target.companyName}" has been ${nextStatus === "archived" ? "archived" : "activated"}.`,
      });
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClient = async (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return false;

    const allTrainings = getTrainings();
    const trainingCount = allTrainings.filter((t: Training) => t.clientId === client.id).length;

    const descMsg = `This client has ${trainingCount} linked Training record(s).\n\nDeleting will permanently remove all related client data. This action cannot be undone.`;

    return await confirm({
      title: `Delete Client Profile: ${client.companyName}`,
      description: descMsg,
      type: "destructive",
      requireVerificationText: "DELETE",
      onConfirm: async () => {
        try {
          const res = await deleteMutation.mutateAsync(id);
          if (!res.success) {
            throw new Error(res.message || "Failed to delete client");
          }
          toast({
            title: "Client Profile Deleted",
            description: `Permanently removed client "${client.companyName}" and all associated records.`,
          });
        } catch (err: any) {
          toast({
            title: "Delete Blocked",
            description: err.message || "Failed to delete client due to existing dependencies.",
            variant: "destructive",
          });
          throw err;
        }
      }
    });
  };

  return {
    handleCreate,
    handleUpdate,
    handleToggleArchive,
    handleDeleteClient,
  };
}

