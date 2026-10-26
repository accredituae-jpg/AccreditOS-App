import { Building2, FileText, Info, MessageCircle, ShieldCheck } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatContactsList } from "../utils/client.utils";
import type { Client } from "../types/client.types";
import { ClientQuotationsTab } from "../components/ClientQuotationsTab";
import { ClientCourseRatesSection } from "../components/ClientCourseRatesSection";
import { normalizeClientCourseRates } from "../utils/courseRates.utils";

interface ClientDetailsDialogProps {
  client: Client | null;
  onClose: () => void;
  onEditClick: (client: Client) => void;
}

export function ClientDetailsDialog({
  client,
  onClose,
  onEditClick,
}: ClientDetailsDialogProps) {
  const statusLabels = {
    active: "Active",
    archived: "Archived",
  };

  if (!client) return null;

  const fields = [
    { label: "TRN Number", value: client.trnNo || "—" },
    { label: "PO Box", value: client.poBox || "—" },
    {
      label: "Contact Persons",
      value: formatContactsList(client.contactPerson),
      fullWidth: true,
    },
    {
      label: "Phone",
      value: client.phone ? (
        <button
          type="button"
          onClick={(e) => openWhatsApp(client.phone, `Hello ${client.companyName}, contacting you from AccreditOS.`, e)}
          className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
          title={`Chat on WhatsApp (${client.phone})`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          {client.phone}
        </button>
      ) : (
        "—"
      ),
    },
    { label: "Fax", value: client.fax || "—" },
    { label: "Email", value: client.email },
    {
      label: "Address / Location",
      value: client.location || "—",
      fullWidth: true,
    },
    { label: "Joined Date", value: client.createdAt },
    { label: "Notes", value: client.notes || "—", fullWidth: true },
  ];

  return (
    <DetailDialog
      open={!!client}
      onOpenChange={(open) => !open && onClose()}
      title={client.companyName || ""}
      subtitle={formatContactsList(client.contactPerson)}
      icon={<Building2 className="w-6 h-6 text-primary" />}
      status={{
        label: statusLabels[client.status],
        variant: client.status === "active" ? "success" : "warning",
      }}
      className="max-w-3xl sm:max-w-4xl"
      actions={
        <Button variant="outline" onClick={() => onEditClick(client)}>
          Edit Client
        </Button>
      }
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="overview"
            className="flex items-center justify-center gap-1.5 py-2 px-1 sm:px-3 rounded-lg font-semibold text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="hidden sm:inline truncate">General Info</span>
            <span className="sm:hidden truncate">Info</span>
          </TabsTrigger>
          <TabsTrigger
            value="rates"
            className="flex items-center justify-center gap-1.5 py-2 px-1 sm:px-3 rounded-lg font-semibold text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="hidden sm:inline truncate">Course Rates</span>
            <span className="sm:hidden truncate">Rates</span>
          </TabsTrigger>
          <TabsTrigger
            value="quotations"
            className="flex items-center justify-center gap-1.5 py-2 px-1 sm:px-3 rounded-lg font-semibold text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="hidden sm:inline truncate">Quotations</span>
            <span className="sm:hidden truncate">Quotes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-1">
            {fields.map((field, index) => (
              <div key={index} className={field.fullWidth ? "sm:col-span-2" : undefined}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {field.label}
                </p>
                <div className="text-sm font-medium">{field.value}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rates" className="mt-0 focus-visible:outline-none space-y-4">
          <ClientCourseRatesSection
            rates={normalizeClientCourseRates(client.courseRates)}
            onChange={() => {}}
            readOnly={true}
          />
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => onEditClick(client)}>
              Edit Agreed Rates
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="quotations" className="mt-0 focus-visible:outline-none">
          <ClientQuotationsTab client={client} />
        </TabsContent>
      </Tabs>
    </DetailDialog>
  );
}


