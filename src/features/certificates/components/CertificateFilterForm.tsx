import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Check, RotateCcw } from "lucide-react";

interface CertificateFilterFormProps {
  initialFromCertNo?: string;
  initialToCertNo?: string;
  initialStatus: string;
  initialClientId?: string;
  initialAwardingBody: string;
  initialServiceType?: "all" | "training" | "inspection";
  awardingBodiesOptions: { value: string; label: string }[];
  clientOptions: { value: string; label: string }[];
  onApply: (filters: {
    fromCertNo: string;
    toCertNo: string;
    statusFilter: string;
    clientIdFilter: string;
    awardingBodyFilter: string;
    serviceTypeFilter: "all" | "training" | "inspection";
  }) => void;
  onClose: () => void;
}

export function CertificateFilterForm({
  initialFromCertNo = "",
  initialToCertNo = "",
  initialStatus,
  initialClientId = "all",
  initialAwardingBody,
  initialServiceType = "all",
  awardingBodiesOptions,
  clientOptions,
  onApply,
  onClose,
}: CertificateFilterFormProps) {
  // Local draft states
  const [fromCertNo, setFromCertNo] = useState<string>(initialFromCertNo);
  const [toCertNo, setToCertNo] = useState<string>(initialToCertNo);
  const [status, setStatus] = useState<string>(initialStatus);
  const [clientId, setClientId] = useState<string>(initialClientId);
  const [awardingBody, setAwardingBody] = useState<string>(initialAwardingBody);
  const [serviceType, setServiceType] = useState<"all" | "training" | "inspection">(initialServiceType);

  useEffect(() => {
    setFromCertNo(initialFromCertNo || "");
    setToCertNo(initialToCertNo || "");
    setStatus(initialStatus);
    setClientId(initialClientId || "all");
    setAwardingBody(initialAwardingBody);
    setServiceType(initialServiceType || "all");
  }, [
    initialFromCertNo,
    initialToCertNo,
    initialStatus,
    initialClientId,
    initialAwardingBody,
    initialServiceType,
  ]);

  const handleReset = () => {
    const resetFilters = {
      fromCertNo: "",
      toCertNo: "",
      statusFilter: "all",
      clientIdFilter: "all",
      awardingBodyFilter: "all",
      serviceTypeFilter: "all" as const,
    };
    setFromCertNo("");
    setToCertNo("");
    setStatus("all");
    setClientId("all");
    setAwardingBody("all");
    setServiceType("all");
    onApply(resetFilters);
    onClose();
  };

  const handleApply = () => {
    onApply({
      fromCertNo: fromCertNo.trim(),
      toCertNo: toCertNo.trim(),
      statusFilter: status,
      clientIdFilter: clientId,
      awardingBodyFilter: awardingBody,
      serviceTypeFilter: serviceType,
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Draft Form Area */}
      <div className="space-y-3 pr-0.5">
        {/* ROW 1: Certificate Number Range (2 Cols) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-primary" />
            Certificate No. Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground">From No.</label>
              <Input
                value={fromCertNo}
                onChange={(e) => setFromCertNo(e.target.value)}
                placeholder="e.g. 5715"
                className="h-8 text-xs bg-white dark:bg-card border-border font-mono px-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground">To No.</label>
              <Input
                value={toCertNo}
                onChange={(e) => setToCertNo(e.target.value)}
                placeholder="e.g. 5724"
                className="h-8 text-xs bg-white dark:bg-card border-border font-mono px-2"
              />
            </div>
          </div>
        </div>

        {/* ROW 2: Service Type & Certificate Status */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Col 1: Service Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate block">
              Service Type
            </label>
            <Select value={serviceType} onValueChange={(val: "all" | "training" | "inspection") => setServiceType(val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-card border-border px-2">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg text-xs">
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Col 2: Certificate Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate block">
              Cert Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-card border-border px-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-lg text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ROW 3: Company Name (Client) (Full Width) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate block">
            Company Name
          </label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-card border-border px-2 truncate">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg text-xs max-h-56">
              {clientOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ROW 4: Awarding Body (Full Width) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate block">
            Awarding Body
          </label>
          <Select value={awardingBody} onValueChange={setAwardingBody}>
            <SelectTrigger className="w-full h-8 text-xs bg-white dark:bg-card border-border px-2">
              <SelectValue placeholder="Select Awarding Body" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg text-xs max-h-56">
              {awardingBodiesOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleApply}
          className="h-8 text-xs gap-1.5 font-semibold shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </Button>
      </div>
    </div>
  );
}

export default CertificateFilterForm;
