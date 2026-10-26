import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Landmark } from "lucide-react";
import type { Client } from "@/lib/clients";

export interface AwardingBodyFormData {
  name: string;
  clientId: string;
  certificateFee: string;
  isSystemIssued: boolean;
  trnNo?: string;
  phone?: string;
  email?: string;
  location?: string;
  poBox?: string;
  contactPerson?: string;
  paymentTerms?: string;
  isVatRegistered?: boolean;
  vatPercent?: string;
}

interface AwardingBodyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  buttonText: string;
  clientsList: Client[];
  data: AwardingBodyFormData;
  onDataChange: React.Dispatch<React.SetStateAction<AwardingBodyFormData>>;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
}

export function AwardingBodyDialog({
  open,
  onOpenChange,
  title,
  buttonText,
  clientsList,
  data,
  onDataChange,
  onSubmit,
}: AwardingBodyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } catch (err) {
      console.error("Error submitting awarding body form:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title={title}
      description="Configure awarding body properties, contact details, and vendor billing rules"
      icon={Landmark}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={buttonText}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="editBodyName" className="text-xs font-semibold">Awarding Body Name *</Label>
            <Input
              id="editBodyName"
              value={data.name}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Tatweer"
              required
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editBodyFee" className="text-xs font-semibold">
              Stamp / Cert Fee (AED) *
            </Label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-muted-foreground/70 font-semibold select-none">
                AED
              </span>
              <Input
                id="editBodyFee"
                type="text"
                inputMode="decimal"
                value={data.certificateFee}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  onDataChange((prev) => ({
                    ...prev,
                    certificateFee: val,
                  }));
                }}
                placeholder="0.00"
                required
                className="pl-12 h-9 text-xs font-semibold font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editTrnNo" className="text-xs font-semibold">TRN Number</Label>
            <Input
              id="editTrnNo"
              value={data.trnNo || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, trnNo: e.target.value }))
              }
              placeholder="e.g. 100234567800003"
              className="h-9 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
          <div className="space-y-1.5">
            <Label htmlFor="editContactPerson" className="text-xs font-semibold">Contact Person</Label>
            <Input
              id="editContactPerson"
              value={data.contactPerson || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, contactPerson: e.target.value }))
              }
              placeholder="e.g. John Smith"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editPhone" className="text-xs font-semibold">Phone Number</Label>
            <Input
              id="editPhone"
              value={data.phone || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="e.g. +971 4 123 4567"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editEmail" className="text-xs font-semibold">Email Address</Label>
            <Input
              id="editEmail"
              type="email"
              value={data.email || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="billing@tatweer.ae"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editLocation" className="text-xs font-semibold">Location / Address</Label>
            <Input
              id="editLocation"
              value={data.location || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Dubai, UAE"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editPoBox" className="text-xs font-semibold">P.O. Box</Label>
            <Input
              id="editPoBox"
              value={data.poBox || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, poBox: e.target.value }))
              }
              placeholder="e.g. 12345"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editPaymentTerms" className="text-xs font-semibold">Payment Terms</Label>
            <Input
              id="editPaymentTerms"
              value={data.paymentTerms || ""}
              onChange={(e) =>
                onDataChange((prev) => ({ ...prev, paymentTerms: e.target.value }))
              }
              placeholder="e.g. Net 30 Days"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-border/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="editBodyVat" className="text-xs font-semibold cursor-pointer">
                VAT Registered (5%)
              </Label>
              <span className="font-normal text-[10px] text-muted-foreground leading-normal">
                Apply standard 5% UAE VAT on vendor bills for this body.
              </span>
            </div>
            <Switch
              id="editBodyVat"
              checked={data.isVatRegistered !== false}
              onCheckedChange={(val) =>
                onDataChange((prev) => ({ ...prev, isVatRegistered: val }))
              }
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="editBodySystem" className="text-xs font-semibold cursor-pointer">
                System-Issued Certificate
              </Label>
              <span className="font-normal text-[10px] text-muted-foreground leading-normal">
                Generate PDFs automatically within accreditOS.
              </span>
            </div>
            <Switch
              id="editBodySystem"
              checked={data.isSystemIssued}
              onCheckedChange={(val) =>
                onDataChange((prev) => ({ ...prev, isSystemIssued: val }))
              }
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
export default AwardingBodyDialog;
