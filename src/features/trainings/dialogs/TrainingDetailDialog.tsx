import { DetailDialog } from "@/components/ui/detail-dialog";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ClipboardCheck, MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Training } from "../types/trainings.types";

const typeStyles = {
  classroom: "bg-info/15 text-info border-info/20",
  online: "bg-success/15 text-success border-success/20",
  site: "bg-warning/15 text-warning border-warning/20",
};

interface TrainingDetailDialogProps {
  training: Training | null;
  onClose: () => void;
}

export function TrainingDetailDialog({
  training,
  onClose,
}: TrainingDetailDialogProps) {
  return (
    <DetailDialog
      open={!!training}
      onOpenChange={(open) => !open && onClose()}
      title={training?.participantName || ""}
      subtitle={training?.courseName}
      icon={
        training?.serviceType === "inspection" ? (
          <ClipboardCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <GraduationCap className="w-6 h-6 text-primary" />
        )
      }
      status={
        training
          ? {
              label: training.status,
              variant:
                training.status === "completed"
                  ? "success"
                  : training.status === "pending"
                    ? "warning"
                    : "info",
            }
          : undefined
      }
      fields={
        training
          ? [
              {
                label: "Service Type",
                value: (
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-xs font-semibold px-2 py-0.5",
                      training.serviceType === "inspection"
                        ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                        : "bg-primary/10 text-primary border-primary/20",
                    )}
                  >
                    {training.serviceType === "inspection"
                      ? " Inspection"
                      : " Training"}
                  </Badge>
                ),
              },
              {
                label:
                  training.serviceType === "inspection"
                    ? "Inspection Subject / Item"
                    : "Participant Name",
                value: training.participantName,
              },
              ...(training.serviceType === "inspection"
                ? [
                    {
                      label: "Quantity / Units",
                      value: training.quantity ? String(training.quantity) : "1",
                    },
                  ]
                : []),
              {
                label: "Phone Number",
                value: training.participantPhone ? (
                  <button
                    type="button"
                    onClick={(e) =>
                      openWhatsApp(
                        training.participantPhone,
                        `Hello ${training.participantName}, contacting you from AccreditOS regarding your ${training.courseName} training.`,
                        e,
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    title={`Chat on WhatsApp (${training.participantPhone})`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {training.participantPhone}
                  </button>
                ) : (
                  "—"
                ),
              },
              { label: "Client/Company", value: training.clientName },
              {
                label: "Training Type",
                value: (
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-xs font-semibold px-2 py-0.5",
                      typeStyles[training.trainingType],
                    )}
                  >
                    {training.trainingType}
                  </Badge>
                ),
              },
              { label: "Registration Date", value: training.regDate },
              { label: "Issue Date", value: training.issueDate || "—" },
              { label: "Time / Schedule", value: training.time || "—" },
              {
                label: "Awarding Body",
                value: training.awardingBodyName || "None / Generic",
              },
            ]
          : []
      }
    />
  );
}
export default TrainingDetailDialog;
