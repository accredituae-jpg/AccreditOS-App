import { useState } from "react";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User } from "lucide-react";
import { apiCreateClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@/lib/clients";

interface QuickAddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: (newClient: Client) => void;
}

export function QuickAddClientDialog({
  open,
  onOpenChange,
  onClientAdded,
}: QuickAddClientDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientType, setClientType] = useState<"company" | "individual">("company");
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    location: "Dubai, UAE",
    trnNo: "",
    poBox: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast({ title: "Validation Error", description: "Company or Client name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactPerson: formData.contactPerson.trim() || formData.companyName.trim(),
        email: formData.email.trim() || `${formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}@client.com`,
        phone: formData.phone.trim() || "+971 4 000 0000",
        location: formData.location.trim() || "Dubai, UAE",
        trnNo: formData.trnNo.trim() || "",
        poBox: formData.poBox.trim() || "",
        status: "active",
      };

      const res = await apiCreateClient(payload as any);
      const createdClient = res?.data || res;

      toast({
        title: "Client Created",
        description: `Successfully added "${payload.companyName}".`,
      });

      onClientAdded(createdClient);
      onOpenChange(false);
      setFormData({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        location: "Dubai, UAE",
        trnNo: "",
        poBox: "",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Add Client",
        description: err.message || "An error occurred while creating client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onCloseAttempt={() => onOpenChange(false)}
      title="Quick Add Client"
      description="Register a new company or client inline"
      icon={Building2}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Client"
      loadingText="Saving..."
      maxWidth="max-w-md"
    >
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg mb-4">
        <button
          type="button"
          onClick={() => {
            setClientType("company");
            if (formData.companyName === "Individual Candidate") setFormData({ ...formData, companyName: "" });
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            clientType === "company" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Corporate Company
        </button>
        <button
          type="button"
          onClick={() => {
            setClientType("individual");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
            clientType === "individual" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Individual Candidate
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold">
            {clientType === "company" ? "Company Name" : "Participant Full Name"} <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder={clientType === "company" ? "e.g. Al Futtaim Group" : "e.g. John Doe"}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold">Contact Person</Label>
          <Input
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="e.g. Mr. Ahmed"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-semibold">Phone Number</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+971 50 123 4567"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Email Address</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@client.com"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs font-semibold">Location / Address</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Dubai, UAE"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">TRN No (Optional)</Label>
            <Input
              value={formData.trnNo}
              onChange={(e) => setFormData({ ...formData, trnNo: e.target.value })}
              placeholder="100XXXXXXXXXXXX"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </FormDialog>
  );
}
