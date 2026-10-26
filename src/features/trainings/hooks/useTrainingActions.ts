import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { apiGetClientOptions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useConfirm } from "@/context/ConfirmContext";
import { useTrainingsStore } from "../store/trainings.store";
import type { Training } from "../types/trainings.types";

export function useTrainingActions(awardingBodiesMap: Map<string, string>) {
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const confirm = useConfirm();

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: qk.clientOptions,
    queryFn: async () => {
      const res = await apiGetClientOptions();
      return res.data || [];
    },
  });
  const { addTraining, updateTraining, deleteTraining } = useTrainingsStore();

  const getMappedClientAndCourse = useCallback(
    (clientName: string, courseName: string) => {
      const isIndividual =
        !clientName ||
        clientName.includes("Individual") ||
        clientName.includes("No Client");

      let matchedClient = clients.find(
        (c) =>
          c.id === clientName ||
          c.companyName === clientName ||
          c.label === clientName ||
          c.meta?.companyName === clientName ||
          (c.companyName &&
            c.companyName.toLowerCase().trim() ===
              (clientName || "").toLowerCase().trim()) ||
          (c.label &&
            c.label.toLowerCase().trim() ===
              (clientName || "").toLowerCase().trim()) ||
          (c.meta?.companyName &&
            c.meta.companyName.toLowerCase().trim() ===
              (clientName || "").toLowerCase().trim())
      );

      if (!matchedClient && isIndividual) {
        matchedClient = clients.find(
          (c) =>
            c.id === "individual" ||
            (c.companyName || c.label || c.meta?.companyName || "")
              .toLowerCase()
              .includes("individual")
        ) || {
          id: "individual",
          companyName: "Individual Candidate",
          label: "Individual Candidate",
          contactPerson: "Individual Candidate",
          phone: "+971 4 000 0000",
          email: "individual@accreditos.local",
          location: "Dubai, UAE",
          trnNo: "N/A",
          poBox: "N/A",
          status: "active",
          notes: "",
          createdAt: new Date().toISOString(),
        };
      }

      if (!matchedClient && clientName && clientName.trim()) {
        matchedClient = {
          id: clientName.trim(),
          companyName: clientName.trim(),
          label: clientName.trim(),
        };
      }

      if (!matchedClient) {
        matchedClient = {
          id: "individual",
          companyName: clientName || "Individual Candidate",
          label: clientName || "Individual Candidate",
        };
      }

      const storeCourses = useTrainingsStore.getState().courses;
      let matchedCourse = storeCourses.find(
        (c: any) =>
          c.id === courseName ||
          c.name === courseName ||
          c.label === courseName ||
          (c.name &&
            c.name.toLowerCase().trim() ===
              (courseName || "").toLowerCase().trim()) ||
          (c.label &&
            c.label.toLowerCase().trim() ===
              (courseName || "").toLowerCase().trim())
      );

      if (!matchedCourse && courseName && courseName.trim()) {
        matchedCourse = {
          id: courseName.trim(),
          name: courseName.trim(),
        };
      }

      if (!matchedCourse) {
        matchedCourse = {
          id: courseName || "general",
          name: courseName || "General Course",
        };
      }

      return { matchedClient, matchedCourse };
    },
    [clients]
  );

  const handleAddTraining = useCallback(
    async (trainingData: Omit<Training, "id">, options?: { silent?: boolean }) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot register new training sessions while offline.",
          variant: "destructive",
        });
        return;
      }

      const { matchedClient, matchedCourse } = getMappedClientAndCourse(
        trainingData.clientName,
        trainingData.courseName
      );
      if (!matchedClient || !matchedCourse) {
        toast({
          title: "Mapping Failed",
          description: "Selected Course or Client company is invalid.",
          variant: "destructive",
        });
        return;
      }

      try {
        await addTraining({
          serviceType: trainingData.serviceType,
          clientId: matchedClient.id,
          courseId: matchedCourse.id,
          clientName: trainingData.clientName,
          courseName: trainingData.courseName,
          trainingType: trainingData.trainingType,
          participantName: trainingData.participantName,
          participantPhone: trainingData.participantPhone,
          drivingLicenseNo: trainingData.drivingLicenseNo,
          drivingLicenseType: trainingData.drivingLicenseType,
          customCompany: trainingData.customCompany,
          regDate: trainingData.regDate,
          issueDate: trainingData.issueDate,
          time: trainingData.time,
          status: trainingData.status,
          awardingBodyId: trainingData.awardingBodyId || null,
          awardingBodyName: awardingBodiesMap.get(trainingData.awardingBodyId || "") || "",
        }, options);

        if (!options?.silent) {
          toast({
            title: "Training Entry Added",
            description: `Successfully registered "${trainingData.participantName}".`,
          });
        }
      } catch (err: any) {
        toast({
          title: "Failed to Add Training",
          description: err.message || "Failed to submit training.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [isOnline, addTraining, getMappedClientAndCourse, awardingBodiesMap, toast]
  );

  const handleUpdateTraining = useCallback(
    async (updatedTraining: Training) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot edit training sessions while offline.",
          variant: "destructive",
        });
        return;
      }

      const { matchedClient, matchedCourse } = getMappedClientAndCourse(
        updatedTraining.clientName,
        updatedTraining.courseName
      );
      if (!matchedClient || !matchedCourse) {
        toast({
          title: "Mapping Failed",
          description: "Selected Course or Client company is invalid.",
          variant: "destructive",
        });
        return;
      }

      try {
        await updateTraining({
          ...updatedTraining,
          clientId: matchedClient.id,
          courseId: matchedCourse.id,
          customCompany: updatedTraining.customCompany,
          awardingBodyName: awardingBodiesMap.get(updatedTraining.awardingBodyId || "") || "",
        });
        toast({
          title: "Training Updated",
          description: `Successfully modified "${updatedTraining.participantName}".`,
        });
      } catch (err: any) {
        toast({
          title: "Update Failed",
          description: err.message || "Failed to save changes.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [isOnline, updateTraining, getMappedClientAndCourse, awardingBodiesMap, toast]
  );

  const handleDeleteTraining = useCallback(
    async (id: string) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot delete training sessions while offline.",
          variant: "destructive",
        });
        return;
      }

      await confirm({
        title: "Delete Training Entirely",
        description: "Are you sure you want to permanently delete this training entry? This action cannot be undone.",
        type: "destructive",
        onConfirm: async () => {
          try {
            await deleteTraining(id);
            toast({
              title: "Training Deleted",
              description: "Training record has been successfully removed.",
            });
          } catch (err: any) {
            toast({
              title: "Delete Failed",
              description: err.message || "Failed to delete training record.",
              variant: "destructive",
            });
          }
        },
      });
    },
    [isOnline, deleteTraining, confirm, toast]
  );

  const handleStatusChangeTraining = useCallback(
    async (training: Training, newStatus: string) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot update status while offline.",
          variant: "destructive",
        });
        return;
      }
      try {
        await updateTraining({ ...training, status: newStatus as any });
        toast({
          title: "Status Updated",
          description: `"${training.participantName}" marked as ${newStatus}.`,
        });
      } catch (err: any) {
        toast({
          title: "Update Failed",
          description: err.message || "Failed to update status.",
          variant: "destructive",
        });
      }
    },
    [isOnline, updateTraining, toast]
  );

  return {
    handleAddTraining,
    handleUpdateTraining,
    handleDeleteTraining,
    handleStatusChangeTraining,
  };
}
export default useTrainingActions;
