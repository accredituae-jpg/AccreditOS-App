import { useQuery } from "@tanstack/react-query";
import { apiGetCertificates } from "@/lib/api";
import { apiGetTrainings } from "@/lib/api/trainingApi";
import { qk } from "@/lib/queryKeys";
import type { Certificate } from "@/components/certificates";

interface UseInvoiceCertificatesOptions {
  open: boolean;
  clientId: string;
  serviceType?: string;
  enabled?: boolean;
}

export function useInvoiceCertificatesQuery({
  open,
  clientId,
  serviceType = "all",
  enabled = true,
}: UseInvoiceCertificatesOptions) {
  const shouldFetch = Boolean(open && clientId && enabled);

  return useQuery<any[]>({
    queryKey: qk.invoiceUnbilledCertificates(clientId, serviceType),
    queryFn: async () => {
      // 1. Fetch unbilled certificates (both training and inspection certificates)
      const certsPromise = apiGetCertificates(1, 500, "", "all", "all", "all", {
        clientId,
        unbilledOnly: true,
        serviceType: serviceType || "all",
      }).catch((err) => {
        console.error("Error fetching unbilled certificates:", err);
        return { success: false, data: [] };
      });

      // 2. Fetch unbilled completed inspections / trainings
      let trainingsPromise: Promise<any> = Promise.resolve({ success: true, data: [] });
      if (serviceType === "inspection" || serviceType === "all") {
        trainingsPromise = apiGetTrainings(
          "completed",
          1,
          "",
          500,
          undefined,
          undefined,
          false, // certificateIssued: false
          serviceType === "all" ? undefined : serviceType,
          clientId
        ).catch((err) => {
          console.error("Error fetching unbilled inspections/trainings:", err);
          return { success: false, data: [] };
        });
      }

      const [certsRes, trainingsRes] = await Promise.all([certsPromise, trainingsPromise]);
      const certsList = ((certsRes?.data || []) as any[]).map((c) => ({
        ...c,
        itemType: "certificate",
      }));

      const existingTrainingIdsInCerts = new Set(
        certsList.map((c: any) => c.trainingId).filter(Boolean)
      );

      const trainingsList = (((trainingsRes as any)?.data || []) as any[])
        .filter((t: any) => !existingTrainingIdsInCerts.has(t.id) && !t.certificateIssued)
        .map((t: any) => ({
          id: t.id,
          rawId: t.id,
          participantName: t.participantName,
          course: t.courseName || t.course?.name || "",
          courseName: t.courseName || t.course?.name || "",
          courseId: t.courseId,
          clientId: t.clientId,
          clientName: t.clientName || t.client?.companyName || "",
          company: t.clientName || t.client?.companyName || "",
          customCompany: t.customCompany || "",
          participantPhone: t.participantPhone || "",
          phone: t.participantPhone || "",
          mobile: t.participantPhone || "",
          awardingBodyName: t.awardingBodyName || "General",
          certificateNumber: null,
          serviceType: t.serviceType || (t.courseName?.toLowerCase().includes("inspection") ? "inspection" : "training"),
          itemType: "training",
          issueDate: t.issueDate,
          regDate: t.regDate,
          status: t.status,
          invoiceIssued: false,
        }));

      return [...certsList, ...trainingsList];
    },
    enabled: shouldFetch,
    staleTime: 60 * 1000, // 1 minute cache so step back/forward is instant
    refetchOnWindowFocus: false,
  });
}
