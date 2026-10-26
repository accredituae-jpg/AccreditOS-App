import { useEffect, useState } from "react";
import { Award, Plus, Edit2, CheckCircle2, ShieldCheck, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGetCertificateTypes, apiSaveCertificateTypes } from "@/lib/api";
import {
  mergeWithDefaultCertificateTypes,
  getCertificateTypes,
} from "@/features/certificates/utils/generateWordCertificate";

export interface CertificateTypeItem {
  id: string;
  name: string;
  code: "Specific" | "General" | "Duration" | string;
  description: string;
  completionTextTemplate: string;
  isSystemDefault: boolean;
}

const DEFAULT_TYPES: CertificateTypeItem[] = [
  {
    id: "cert-type-specific",
    name: "Specific Certificate",
    code: "Specific",
    description: "Standard individual assessment certificate issued upon successful course completion.",
    completionTextTemplate: "has successfully completed the assessment/ training for",
    isSystemDefault: true,
  },
  {
    id: "cert-type-general",
    name: "General Certificate",
    code: "General",
    description: "Safety awareness certificate issued for standard general orientation modules.",
    completionTextTemplate: "has successfully completed the safety awareness training for",
    isSystemDefault: true,
  },
  {
    id: "cert-type-duration",
    name: "Duration Certificate",
    code: "Duration",
    description: "Multi-day training certificate including calculated training dates (e.g. 17/05, 18/05, and 19/05).",
    completionTextTemplate: "has successfully completed the {duration}-day training course held on {dates}.",
    isSystemDefault: true,
  },
  {
    id: "cert-type-license",
    name: "License Certificate",
    code: "License",
    description: "Driver assessment certificate including driving license number and vehicle category (e.g. LV, HV).",
    completionTextTemplate: "D.Lic# {licenseNo}({licenseType}) has successfully completed the assessment/ training for",
    isSystemDefault: true,
  },
];

export function CertificateTypesTab() {
  const { toast } = useToast();
  const [types, setTypes] = useState<CertificateTypeItem[]>(getCertificateTypes);

  const [editingType, setEditingType] = useState<CertificateTypeItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeTemplate, setNewTypeTemplate] = useState("");

  useEffect(() => {
    apiGetCertificateTypes()
      .then((res) => {
        const merged = mergeWithDefaultCertificateTypes(res);
        setTypes(merged);
        localStorage.setItem("accreditos_certificate_types", JSON.stringify(merged));
        if (!Array.isArray(res) || res.length !== merged.length) {
          apiSaveCertificateTypes(merged).catch((err) =>
            console.error("Failed to sync default certificate types to server:", err)
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load certificate types:", err);
      });
  }, []);

  const saveTypesToStorage = async (updated: CertificateTypeItem[]) => {
    setTypes(updated);
    localStorage.setItem("accreditos_certificate_types", JSON.stringify(updated));
    try {
      await apiSaveCertificateTypes(updated);
    } catch (err) {
      console.error("Failed to sync certificate types to server:", err);
    }
  };

  const handleSaveEdit = () => {
    if (!editingType) return;
    const cleanedEdit = {
      ...editingType,
      completionTextTemplate: editingType.completionTextTemplate
        .trim()
        .replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, "")
        .trim(),
    };
    const updated = types.map((t) => (t.id === editingType.id ? cleanedEdit : t));
    saveTypesToStorage(updated);
    toast({
      title: "Certificate Type Updated",
      description: `Updated completion text template for ${editingType.name}.`,
    });
    setEditingType(null);
  };

  const handleAddType = () => {
    if (!newTypeName.trim() || !newTypeTemplate.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter type name and completion text template.",
        variant: "destructive",
      });
      return;
    }

    const trimmedName = newTypeName.trim();
    const codeName = trimmedName.replace(/\s+/g, "");

    const exists = types.some(
      (t) =>
        t.name.toLowerCase() === trimmedName.toLowerCase() ||
        t.code.toLowerCase() === codeName.toLowerCase()
    );

    if (exists) {
      toast({
        title: "Duplicate Certificate Type",
        description: `A certificate type named '${trimmedName}' already exists.`,
        variant: "destructive",
      });
      return;
    }

    const cleanTemplate = newTypeTemplate
      .trim()
      .replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, "")
      .trim();

    const newItem: CertificateTypeItem = {
      id: `cert-type-${Date.now()}`,
      name: trimmedName,
      code: codeName,
      description: newTypeDescription.trim() || "Custom certificate type",
      completionTextTemplate: cleanTemplate,
      isSystemDefault: false,
    };

    const updated = [...types, newItem];
    saveTypesToStorage(updated);
    toast({
      title: "Certificate Type Added",
      description: `Created new certificate type: ${newItem.name}`,
    });
    setIsAddOpen(false);
    setNewTypeName("");
    setNewTypeDescription("");
    setNewTypeTemplate("");
  };

  const getIconForType = (code: string) => {
    switch (code) {
      case "Specific":
        return <Award className="w-5 h-5 text-primary" />;
      case "General":
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case "Duration":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Certificate Types & Wording
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure certificate categories and customize completion text wording dynamically injected into Word templates.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Certificate Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted/60">{getIconForType(t.code)}</div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{t.name}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider px-1.5 py-0">
                      {t.code}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingType(t)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mb-3">{t.description}</p>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                  Template Wording:
                </span>
                <p className="font-mono text-primary text-[11px] leading-relaxed italic">
                  "{t.completionTextTemplate}"
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{t.isSystemDefault ? "System Default" : "Custom Type"}</span>
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Certificate Type Dialog */}
      {editingType && (
        <Dialog open={Boolean(editingType)} onOpenChange={() => setEditingType(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" /> Edit Certificate Type
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Type Name *</Label>
                <Input
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  placeholder="e.g. Specific Certificate"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={editingType.description}
                  onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                  placeholder="Brief description of when to issue this type"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Completion Text Template *</Label>
                <textarea
                  value={editingType.completionTextTemplate}
                  onChange={(e) => setEditingType({ ...editingType, completionTextTemplate: e.target.value })}
                  rows={3}
                  placeholder="e.g. has successfully completed the assessment/ training for"
                  className="w-full text-xs font-mono p-2.5 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-none mt-1"
                />
                <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Supported placeholders: <code className="text-primary font-bold">{"{licenseNo}"}</code>,{" "}
                    <code className="text-primary font-bold">{"{licenseType}"}</code>,{" "}
                    <code className="text-primary font-bold">{"{duration}"}</code>, and{" "}
                    <code className="text-primary font-bold">{"{dates}"}</code>.
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingType(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add New Certificate Type Dialog */}
      {isAddOpen && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add New Certificate Type
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Type Name *</Label>
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Advanced Diploma"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                  placeholder="Brief description of when to issue this type"
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Completion Text Template *</Label>
                <textarea
                  value={newTypeTemplate}
                  onChange={(e) => setNewTypeTemplate(e.target.value)}
                  rows={3}
                  placeholder="e.g. has successfully completed the advanced diploma assessment for"
                  className="w-full text-xs font-mono p-2.5 rounded-md bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-none mt-1"
                />
                <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Supported placeholders: <code className="text-primary font-bold">{"{licenseNo}"}</code>,{" "}
                    <code className="text-primary font-bold">{"{licenseType}"}</code>,{" "}
                    <code className="text-primary font-bold">{"{duration}"}</code>, and{" "}
                    <code className="text-primary font-bold">{"{dates}"}</code>.
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddType}>
                Create Certificate Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
