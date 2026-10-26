import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/ui/form-dialog-layout";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Plus,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Hash,
  Inbox,
  Printer,
  User,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clientFormSchema } from "../schemas/client.schema";
import { useToast } from "@/hooks/use-toast";
import { useClientActions } from "../hooks/useClientActions";
import type { Client, ContactPerson } from "../types/client.types";
import type { ClientCourseRates } from "@/lib/clients";
import { normalizeClientCourseRates } from "../utils/courseRates.utils";
import { ClientCourseRatesSection } from "../components/ClientCourseRatesSection";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddClientDialogProps) {
  const { toast } = useToast();
  const { handleCreate } = useClientActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    phone: "",
    fax: "",
    email: "",
    trnNo: "",
    poBox: "",
    location: "",
    status: "active" as Client["status"],
    notes: "",
  });

  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [courseRates, setCourseRates] = useState<ClientCourseRates>(normalizeClientCourseRates());

  const initialValuesRef = useRef(
    JSON.stringify({ ...formData, contacts: [], courseRates: normalizeClientCourseRates() })
  );

  useEffect(() => {
    if (open) {
      const emptyForm = {
        companyName: "",
        phone: "",
        fax: "",
        email: "",
        trnNo: "",
        poBox: "",
        location: "",
        status: "active" as Client["status"],
        notes: "",
      };
      setFormData(emptyForm);
      setContacts([]);
      setNewContactName("");
      setNewContactPhone("");
      const emptyRates = normalizeClientCourseRates();
      setCourseRates(emptyRates);
      initialValuesRef.current = JSON.stringify({ ...emptyForm, contacts: [], courseRates: emptyRates });
    }
  }, [open]);

  const isDirty = () => {
    const current = JSON.stringify({ ...formData, contacts, courseRates });
    return current !== initialValuesRef.current;
  };

  const handleCloseAttempt = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const addContact = () => {
    const name = newContactName.trim();
    const phone = newContactPhone.trim();
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Contact person name is required",
        variant: "destructive",
      });
      return;
    }
    setContacts([...contacts, { id: self.crypto.randomUUID(), name, phone }]);
    setNewContactName("");
    setNewContactPhone("");
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = clientFormSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Validation failed";
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    if (contacts.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one contact person is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        courseRates,
        contactPerson: JSON.stringify(contacts),
      };
      await handleCreate(payload);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      // keep open
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormDialog
        open={open}
        onCloseAttempt={handleCloseAttempt}
        title="Add New Client"
        description="Create a new corporate client profile and assign main contacts"
        icon={Building2}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Add Client"
        loadingText="Saving..."
        maxWidth="max-w-lg"
      >
        {/* Company Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="e.g. Middle East Manpower"
                className="pl-9 bg-card focus-visible:ring-primary/20"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(v) =>
                setFormData({ ...formData, status: v as Client["status"] })
              }
            >
              <SelectTrigger className="bg-card focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg">
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="archived">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Archived</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">TRN Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={formData.trnNo}
                onChange={(e) =>
                  setFormData({ ...formData, trnNo: e.target.value })
                }
                placeholder="100485624900003"
                className="pl-9 bg-card focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Communication & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="billing@mems.ae"
                className="pl-9 bg-card focus-visible:ring-primary/20"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Phone <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+971 2 644 7722"
                className="pl-9 bg-card focus-visible:ring-primary/20"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Fax</Label>
            <div className="relative">
              <Printer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={formData.fax}
                onChange={(e) =>
                  setFormData({ ...formData, fax: e.target.value })
                }
                placeholder="Fax number"
                className="pl-9 bg-card focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">
              Location / Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Abu Dhabi, UAE"
                className="pl-9 bg-card focus-visible:ring-primary/20"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-semibold">PO Box</Label>
            <div className="relative">
              <Inbox className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={formData.poBox}
                onChange={(e) =>
                  setFormData({ ...formData, poBox: e.target.value })
                }
                placeholder="31106"
                className="pl-9 bg-card focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Primary Contacts & Notes */}
        <div className="space-y-4">
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card/50 relative shadow-sm">
            <div className="bg-muted/35 border-b border-border/60 px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-foreground/90">
                  Contact Information
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Add phone, email and communication details
                </p>
              </div>
              {contacts.length > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                  {contacts.length} added
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <Input
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Contact name e.g. John Doe"
                    className="pl-10 text-xs h-9 bg-card"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                    <Input
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="Contact phone (optional)"
                      className="pl-10 text-xs h-9 bg-card"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={addContact}
                    className="h-9 w-9 flex-shrink-0 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {contacts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 pt-1.5">
                  <AnimatePresence>
                    {contacts.map((c) => {
                      const initials = c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center justify-between bg-card border border-border/80 p-2 rounded-lg text-xs hover:border-primary/20 transition-all hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] flex-shrink-0 border border-primary/5">
                              {initials || <User className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {c.name}
                              </p>
                              {c.phone && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {c.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            onClick={() => removeContact(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="border border-dashed border-border/70 rounded-lg p-5 text-center space-y-2 bg-muted/5">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground/80">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground/90">
                      No Contact Persons Added
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      At least one contact person is required to save the client profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ClientCourseRatesSection
            rates={courseRates}
            onChange={setCourseRates}
          />

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any additional notes about this client..."
              className="bg-card min-h-[90px] max-h-[140px] focus-visible:ring-primary/20 text-xs"
            />
          </div>
        </div>
      </FormDialog>

      {/* Discard changes confirmation */}
      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="max-w-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold">Unsaved Changes</h4>
              <p className="text-sm text-muted-foreground">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
              }}
            >
              Discard Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
