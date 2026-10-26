import { useCallback } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useConfirm } from "@/context/ConfirmContext";
import {
  apiGetClientOptions,
  apiGetCourses,
  apiCreateCertificate,
  apiCreateCertificatesBulk,
  apiUpdateCertificate,
  apiDeleteCertificate,
} from "@/lib/api";
import type { Certificate } from "../types/certificates.types";
import {
  generateWordCertificate,
  isTatweerCertificate,
} from "../utils/generateWordCertificate";
import { generatePdfCertificate } from "../utils/generatePdfCertificate";
import { generateBulkCertificates } from "../utils/generateBulkCertificates";
import { syncEntities } from "@/lib/sync";

export function useCertificateActions() {
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const { data: clientsList = [] } = useQuery<any[]>({
    queryKey: qk.clientOptions,
    queryFn: async () => (await apiGetClientOptions()).data || [],
  });

  const { data: coursesList = [] } = useQuery<any[]>({
    queryKey: qk.courses,
    queryFn: async () => (await apiGetCourses()).data || [],
  });

  const createMutation = useMutation({
    mutationFn: apiCreateCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: apiCreateCertificatesBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiUpdateCertificate(id, data),
    onSuccess: (_, variables) => {
      queryClient.setQueriesData(
        { queryKey: ["certificates"] },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.certificates)) return oldData;
          return {
            ...oldData,
            certificates: oldData.certificates.map((c: Certificate) =>
              c.id === variables.id ? { ...c, ...variables.data } : c,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleAddCertificate = useCallback(
    async (certData: {
      trainingId: string;
      participantName: string;
      company: string;
      course: string;
      expiryYears: string;
      issueDate: string;
      certificateType: "Specific" | "General" | "Duration" | "License" | string;
      certificateNumber?: string;
      awardingBodyId?: string;
      customCompany?: string;
      durationDays?: number;
      drivingLicenseNo?: string;
      drivingLicenseType?: string;
    }) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot issue new certificates while offline.",
          variant: "destructive",
        });
        return;
      }

      const isIndividual =
        !certData.company ||
        certData.company.includes("Individual") ||
        certData.company.includes("No Client") ||
        certData.company === "N/A";

      let matchedClient = clientsList.find(
        (c) =>
          c.id === certData.company ||
          c.companyName === certData.company ||
          c.label === certData.company ||
          c.meta?.companyName === certData.company ||
          (c.companyName &&
            c.companyName.toLowerCase().trim() ===
              (certData.company || "").toLowerCase().trim()) ||
          (c.label &&
            c.label.toLowerCase().trim() ===
              (certData.company || "").toLowerCase().trim()) ||
          (c.meta?.companyName &&
            c.meta.companyName.toLowerCase().trim() ===
              (certData.company || "").toLowerCase().trim()),
      );

      if (!matchedClient && isIndividual) {
        matchedClient = clientsList.find(
          (c) =>
            c.id === "individual" ||
            c.companyName === "Individual Candidate" ||
            c.label === "Individual Candidate" ||
            c.meta?.companyName === "Individual Candidate",
        ) || {
          id: "individual",
          label: "Individual Candidate",
          companyName: "Individual Candidate",
        };
      }

      if (!matchedClient && certData.company && certData.company.trim()) {
        matchedClient = {
          id: certData.company.trim(),
          label: certData.company.trim(),
          companyName: certData.company.trim(),
        };
      }

      if (!matchedClient) {
        matchedClient = {
          id: "individual",
          label: certData.company || "Individual Candidate",
          companyName: certData.company || "Individual Candidate",
        };
      }

      let matchedCourse = coursesList.find(
        (c) =>
          c.id === certData.course ||
          c.name === certData.course ||
          c.label === certData.course ||
          c.meta?.name === certData.course ||
          (c.name &&
            c.name.toLowerCase().trim() ===
              (certData.course || "").toLowerCase().trim()) ||
          (c.label &&
            c.label.toLowerCase().trim() ===
              (certData.course || "").toLowerCase().trim()) ||
          (c.meta?.name &&
            c.meta.name.toLowerCase().trim() ===
              (certData.course || "").toLowerCase().trim()),
      );

      if (!matchedCourse && certData.course && certData.course.trim()) {
        matchedCourse = {
          id: certData.course.trim(),
          name: certData.course.trim(),
        };
      }

      if (!matchedCourse) {
        matchedCourse = {
          id: certData.course || "general",
          name: certData.course || "General Course",
        };
      }

      try {
        await createMutation.mutateAsync({
          trainingId: certData.trainingId,
          participantName: certData.participantName,
          courseId: matchedCourse.id,
          clientId: matchedClient.id,
          issueDate: certData.issueDate,
          expiryYears: certData.expiryYears,
          certificateType: certData.certificateType,
          durationDays: certData.durationDays,
          drivingLicenseNo: certData.drivingLicenseNo,
          drivingLicenseType: certData.drivingLicenseType,
          certificateNumber: certData.certificateNumber || null,
          awardingBodyId: certData.awardingBodyId || null,
          customCompany: certData.customCompany || null,
        } as any);
        toast({
          title: "Certificate Issued",
          description: `Successfully issued credential for ${certData.participantName}.`,
        });
      } catch (err: any) {
        toast({
          title: "Failed to Issue Certificate",
          description: err.message || "Failed to submit certificate to server.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [isOnline, toast, clientsList, coursesList, createMutation],
  );

  const handleBulkIssueCertificates = useCallback(
    async (items: any[]) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot issue certificates while offline.",
          variant: "destructive",
        });
        return;
      }

      if (!items || items.length === 0) return;

      try {
        const res = await bulkCreateMutation.mutateAsync(items);
        const count = res?.data?.count || items.length;
        toast({
          title: "Certificates Issued",
          description: `Successfully issued ${count} certificate${count > 1 ? "s" : ""}.`,
        });
        return res;
      } catch (err: any) {
        toast({
          title: "Bulk Issuance Failed",
          description: err.message || "Failed to submit batch certificates to server.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [isOnline, toast, bulkCreateMutation],
  );

  const handleUpdateCertificate = useCallback(
    async (updatedCert: Certificate) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot edit certificates while offline.",
          variant: "destructive",
        });
        return;
      }

      try {
        await updateMutation.mutateAsync({
          id: updatedCert.id,
          data: {
            participantName: updatedCert.participantName,
            certificateNumber: updatedCert.certificateNumber,
            issueDate: updatedCert.issueDate,
            expiryDate: updatedCert.expiryDate,
            certificateType: updatedCert.certificateType,
            status: updatedCert.status,
            customCompany: updatedCert.customCompany !== undefined ? (updatedCert.customCompany || null) : undefined,
            awardingBodyId: updatedCert.awardingBodyId || null,
            invoiceIssued: updatedCert.invoiceIssued,
          },
        });
        toast({
          title: "Certificate Updated",
          description: "Certificate details successfully saved.",
        });
      } catch (err: any) {
        toast({
          title: "Update Failed",
          description: err.message || "Failed to update certificate.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [isOnline, toast, updateMutation],
  );

  const handleDeleteCertificate = useCallback(
    async (id: string) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot delete certificates while offline.",
          variant: "destructive",
        });
        return;
      }

      await confirm({
        title: "Delete Certificate",
        description:
          "Are you sure you want to delete this certificate? This action cannot be undone and will permanently remove this record.",
        type: "destructive",
        onConfirm: async () => {
          try {
            await deleteMutation.mutateAsync(id);
            toast({
              title: "Certificate Deleted",
              description: "Certificate record has been successfully removed.",
            });
          } catch (err: any) {
            toast({
              title: "Delete Failed",
              description: err.message || "Failed to delete certificate.",
              variant: "destructive",
            });
          }
        },
      });
    },
    [isOnline, toast, confirm, deleteMutation],
  );

  const handleStatusChangeCert = useCallback(
    async (cert: Certificate, newStatus: string) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot update status while offline.",
          variant: "destructive",
        });
        return;
      }

      // 1. Instant optimistic UI update
      queryClient.setQueriesData(
        { queryKey: ["certificates"] },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.certificates)) return oldData;
          return {
            ...oldData,
            certificates: oldData.certificates.map((c: Certificate) =>
              c.id === cert.id ? { ...c, status: newStatus as any } : c,
            ),
          };
        },
      );

      try {
        await apiUpdateCertificate(cert.id, { status: newStatus as any });
        toast({
          title: "Status Updated",
          description: `${cert.participantName}'s certificate marked as ${newStatus}.`,
        });
        await queryClient.invalidateQueries({ queryKey: ["certificates"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch (err: any) {
        await queryClient.invalidateQueries({ queryKey: ["certificates"] });
        toast({
          title: "Update Failed",
          description: err.message || "Failed to update status.",
          variant: "destructive",
        });
      }
    },
    [isOnline, toast, queryClient],
  );

  const handleDownload = useCallback(
    async (cert: Certificate) => {
      if (!isTatweerCertificate(cert)) {
        toast({
          title: "Third-Party Certificate",
          description: `This certificate is issued by ${cert.awardingBodyName || "an external awarding body"}. Tatweer Word template generation is only used for internal Tatweer certificates.`,
        });
        return;
      }

      try {
        await generateWordCertificate(cert);
        toast({
          title: "Certificate Generated",
          description: `Generated Word certificate for ${cert.participantName}.`,
        });
      } catch (err: any) {
        toast({
          title: "Download Failed",
          description: err.message || "Failed to generate Word certificate.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const handleDownloadPdf = useCallback(
    async (cert: Certificate) => {
      if (!isTatweerCertificate(cert)) {
        toast({
          title: "Third-Party Certificate",
          description: `This certificate is issued by ${cert.awardingBodyName || "an external awarding body"}. Tatweer PDF generation is only used for internal Tatweer certificates.`,
        });
        return;
      }

      try {
        await generatePdfCertificate(cert);
        toast({
          title: "PDF Downloaded",
          description: `Downloaded PDF certificate for ${cert.participantName}.`,
        });
      } catch (err: any) {
        toast({
          title: "Preview Failed",
          description:
            err.message || "Failed to generate PDF certificate preview.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const handleBulkStatusChangeCert = useCallback(
    async (certIds: string[], newStatus: string) => {
      if (!isOnline) {
        toast({
          title: "Offline Action Denied",
          description: "Cannot update status while offline.",
          variant: "destructive",
        });
        return;
      }

      const idSet = new Set(certIds);
      // 1. Instant optimistic UI update for all selected certificates
      queryClient.setQueriesData(
        { queryKey: ["certificates"] },
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData.certificates)) return oldData;
          return {
            ...oldData,
            certificates: oldData.certificates.map((c: Certificate) =>
              idSet.has(c.id) ? { ...c, status: newStatus as any } : c,
            ),
          };
        },
      );

      try {
        await Promise.all(
          certIds.map((id) =>
            apiUpdateCertificate(id, { status: newStatus as any }),
          ),
        );
        toast({
          title: "Bulk Status Updated",
          description: `Successfully updated ${certIds.length} certificate(s) to ${newStatus}.`,
        });
        await queryClient.invalidateQueries({ queryKey: ["certificates"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch (err: any) {
        await queryClient.invalidateQueries({ queryKey: ["certificates"] });
        toast({
          title: "Bulk Update Failed",
          description:
            err.message || "Failed to update some or all certificates.",
          variant: "destructive",
        });
      }
    },
    [isOnline, toast, queryClient],
  );

  const handleBulkDownload = useCallback(
    async (certsToDownload: Certificate[], format: "docx" | "pdf" = "docx") => {
      if (!certsToDownload.length) return;
      try {
        toast({
          title: "Generating ZIP Archive",
          description: `Bundling ${certsToDownload.length} certificates as ${format.toUpperCase()}...`,
        });

        const result = await generateBulkCertificates(certsToDownload, {
          format,
          saveZip: true,
        });

        toast({
          title: "Download Complete",
          description: `Downloaded ${result.count} certificates in ${result.filename}`,
        });
      } catch (err: any) {
        console.error("Bulk download error:", err);
        toast({
          title: "Download Failed",
          description: err.message || "Failed to generate certificates ZIP archive.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  return {
    handleAddCertificate,
    handleBulkIssueCertificates,
    handleUpdateCertificate,
    handleDeleteCertificate,
    handleStatusChangeCert,
    handleBulkStatusChangeCert,
    handleDownload,
    handleDownloadPdf,
    handleBulkDownload,
  };
}
export default useCertificateActions;
