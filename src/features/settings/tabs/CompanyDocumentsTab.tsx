import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatTitleCase } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiGetCompanyDocuments, apiSaveCompanyDocuments } from "@/lib/api";
import { getActiveRole } from "@/lib/permissions";
import {
  Building2,
  GraduationCap,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit2,
  FileText,
  Clock,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";

export type DocumentType = "training_material" | "company_document";

export interface CompanyDocument {
  id: string;
  name: string;
  driveLink: string;
  type: DocumentType;
  expiryDate?: string;
  updatedAt?: string;
}

export function CompanyDocumentsTab() {
  const { toast } = useToast();
  const currentRole = getActiveRole();
  const isSales = currentRole === "sales";
  const isTrainer = currentRole === "trainer";
  const isTrainingOnlyRole = isSales;
  const canManage = !isSales;
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & Search State
  const [activeTypeFilter, setActiveTypeFilter] = useState<"all" | DocumentType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CompanyDocument | null>(null);

  // Form state
  const [docType, setDocType] = useState<DocumentType>("training_material");
  const [name, setName] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const fetched = await apiGetCompanyDocuments();
      if (Array.isArray(fetched)) {
        // Ensure every doc has a valid type
        const normalized: CompanyDocument[] = fetched.map((doc: any) => ({
          ...doc,
          type: doc.type === "company_document" ? "company_document" : "training_material",
        }));
        setDocuments(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch company documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingDocTarget, setDeletingDocTarget] = useState<CompanyDocument | null>(null);

  const openAddDialog = () => {
    setName("");
    setDriveLink("");
    setExpiryDate("");
    // Pre-select type based on active filter if not "all", or default to training_material for isTrainingOnlyRole
    setDocType(
      isTrainingOnlyRole
        ? "training_material"
        : activeTypeFilter === "company_document"
          ? "company_document"
          : "training_material",
    );
    setEditingDoc(null);
    setShowAddDialog(true);
  };

  const handleEditClick = (doc: CompanyDocument) => {
    setEditingDoc(doc);
    setName(formatTitleCase(doc.name));
    setDriveLink(doc.driveLink);
    setDocType(isTrainingOnlyRole ? "training_material" : (doc.type || "training_material"));
    setExpiryDate(doc.type === "company_document" ? doc.expiryDate || "" : "");
    setShowAddDialog(true);
  };

  const handleDeleteClick = async (id: string, docName: string) => {
    if (deletingIds.has(id)) return;

    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      const updatedList = documents.filter((d) => d.id !== id);
      await apiSaveCompanyDocuments(updatedList);

      setDocuments(updatedList);

      toast({
        title: isTrainingOnlyRole ? "Material Removed" : "Document Removed",
        description: `"${docName}" was successfully removed.`,
      });
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to remove document.",
        variant: "destructive",
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = formatTitleCase(name);
    if (!formattedName || !driveLink.trim()) return;

    // Expiry date is ONLY allowed for company_document (never training_material)
    const cleanExpiry = docType === "company_document" && expiryDate ? expiryDate : undefined;

    let updatedList: CompanyDocument[];
    if (editingDoc) {
      updatedList = documents.map((d) =>
        d.id === editingDoc.id
          ? {
              ...d,
              name: formattedName,
              driveLink: driveLink.trim(),
              type: docType,
              expiryDate: cleanExpiry,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : d,
      );
    } else {
      const newDoc: CompanyDocument = {
        id: `cdoc-${Date.now()}`,
        name: formattedName,
        driveLink: driveLink.trim(),
        type: docType,
        expiryDate: cleanExpiry,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      updatedList = [newDoc, ...documents];
    }

    setDocuments(updatedList);
    setShowAddDialog(false);

    try {
      await apiSaveCompanyDocuments(updatedList);
      toast({
        title: editingDoc
          ? isTrainingOnlyRole
            ? "Material Saved"
            : "Document Saved"
          : isTrainingOnlyRole
            ? "Material Added"
            : "Document Added",
        description: `"${formattedName}" has been saved.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save document.",
        variant: "destructive",
      });
    }
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast({
      title: "Link Copied",
      description: "Drive link copied to clipboard!",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getExpiryBadge = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return (
        <Badge
          variant="outline"
          className="text-[11px] bg-red-500/10 text-red-500 border-red-500/30 gap-1 px-2 py-0.5 font-semibold w-fit"
        >
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          Expired ({dateStr})
        </Badge>
      );
    }
    if (diffDays <= 30) {
      return (
        <Badge
          variant="outline"
          className="text-[11px] bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1 px-2 py-0.5 font-semibold w-fit"
        >
          <Clock className="w-3 h-3 flex-shrink-0" />
          Expires in {diffDays} days ({dateStr})
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[11px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1 px-2 py-0.5 font-semibold w-fit whitespace-nowrap"
      >
        <Check className="w-3 h-3 flex-shrink-0" />
        Expires {dateStr}
      </Badge>
    );
  };

  // Base list of documents visible to this role
  const roleVisibleDocuments = useMemo(() => {
    if (isTrainingOnlyRole) {
      return documents.filter((d) => d.type === "training_material" || !d.type);
    }
    return documents;
  }, [documents, isTrainingOnlyRole]);

  // Counts
  const trainingCount = useMemo(
    () => roleVisibleDocuments.filter((d) => d.type === "training_material" || !d.type).length,
    [roleVisibleDocuments],
  );
  const companyDocsCount = useMemo(
    () => roleVisibleDocuments.filter((d) => d.type === "company_document").length,
    [roleVisibleDocuments],
  );
  const totalCount = roleVisibleDocuments.length;

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return roleVisibleDocuments.filter((doc) => {
      // Type filter (only applicable for non-training-only roles)
      if (!isTrainingOnlyRole) {
        if (activeTypeFilter === "training_material" && doc.type !== "training_material") {
          return false;
        }
        if (activeTypeFilter === "company_document" && doc.type !== "company_document") {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (doc.name || "").toLowerCase().includes(q);
        const matchesLink = (doc.driveLink || "").toLowerCase().includes(q);
        return matchesName || matchesLink;
      }

      return true;
    });
  }, [roleVisibleDocuments, isTrainingOnlyRole, activeTypeFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 border border-border p-4 sm:p-5 rounded-xl">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            {isTrainingOnlyRole ? (
              <>
                <GraduationCap className="w-5 h-5 text-purple-600 flex-shrink-0" />
                Training Materials
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                Company Documents & Training Materials
              </>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isTrainingOnlyRole
              ? "Access central course slides, notes, syllabus, and official training resources."
              : "Central repository for official company documents and course training materials."}
          </p>
        </div>
        {canManage && (
          <Button
            type="button"
            onClick={openAddDialog}
            className="gap-2 font-semibold shadow-xs w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            {isTrainingOnlyRole ? "Add Material" : "Add Document"}
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border p-2 sm:p-2.5 rounded-xl">
        {/* Type Filter Buttons (Only shown for non-training-only roles; sales and trainer only see training material) */}
        {!isTrainingOnlyRole ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTypeFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTypeFilter === "all"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter("training_material")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTypeFilter === "training_material"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Training Material</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTypeFilter === "training_material"
                    ? "bg-white/20 text-white"
                    : "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                }`}
              >
                {trainingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTypeFilter("company_document")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTypeFilter === "company_document"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Documents</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTypeFilter === "company_document"
                    ? "bg-white/20 text-white"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                }`}
              >
                {companyDocsCount}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1">
            <Badge
              variant="outline"
              className="text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 px-2.5 py-1 gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Training Materials ({filteredDocuments.length})
            </Badge>
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTrainingOnlyRole ? "Search training materials..." : "Search by title or link..."}
            className="pl-8 pr-8 h-8 text-xs bg-background/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border/80 p-4 rounded-xl flex flex-col justify-between gap-3.5 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card/30 space-y-3">
          {activeTypeFilter === "training_material" ? (
            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto" />
          ) : activeTypeFilter === "company_document" ? (
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          ) : (
            <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {searchQuery
                ? "No matching documents found"
                : activeTypeFilter === "training_material"
                  ? "No Training Materials Found"
                  : activeTypeFilter === "company_document"
                    ? "No Company Documents Found"
                    : "No Documents Added Yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No items matched "${searchQuery}". Try clearing search.`
                : canManage
                  ? `Click "+ ${isTrainingOnlyRole ? "Add Material" : "Add Document"}" to add ${isTrainingOnlyRole || activeTypeFilter === "training_material" ? "a training material" : "a company document"}.`
                  : "No documents available in this category."}
            </p>
          </div>
          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs h-8"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const targetUrl = doc.driveLink.startsWith("http") ? doc.driveLink : `https://${doc.driveLink}`;
            const isTraining = doc.type === "training_material";

            return (
              <div
                key={doc.id}
                className="bg-card border border-border/80 hover:border-primary/50 transition-all p-4 rounded-xl flex flex-col justify-between gap-3.5 shadow-xs group"
              >
                <div className="space-y-3">
                  {/* Title & Icon Block */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isTraining
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isTraining ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isTraining ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 px-1.5 py-0"
                          >
                            Training Material
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-1.5 py-0"
                          >
                            Company Document
                          </Badge>
                        )}
                        {/* Expiry badge ONLY for Company Documents */}
                        {!isTraining && doc.expiryDate && getExpiryBadge(doc.expiryDate)}
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug break-words">
                        {formatTitleCase(doc.name)}
                      </h4>
                    </div>
                  </div>

                  {/* Drive Link Box */}
                  <div className="bg-muted/30 p-2.5 rounded-lg border border-border/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">
                      {doc.driveLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyLink(doc.driveLink, doc.id)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === doc.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full h-8 text-xs font-semibold gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                  {canManage && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(doc)}
                        className="h-8 w-8 p-0"
                        title="Edit Document"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingDocTarget(doc)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {isTrainingOnlyRole || docType === "training_material" ? (
                <GraduationCap className="w-5 h-5 text-purple-600" />
              ) : (
                <Building2 className="w-5 h-5 text-blue-600" />
              )}
              {editingDoc
                ? isTrainingOnlyRole
                  ? "Edit Training Material"
                  : "Edit Document"
                : isTrainingOnlyRole
                  ? "Add Training Material"
                  : "Add New Document Link"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {/* Document Type Selector Cards - hidden for trainer/sales */}
            {!isTrainingOnlyRole && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Document Category *</Label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDocType("training_material");
                      setExpiryDate(""); // Clean expiry date when switching to training
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      docType === "training_material"
                        ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-xs font-bold">Training Material</span>
                    </div>
                    <span className="text-[10px] leading-tight opacity-80">
                      Course slides, notes, syllabus & handouts
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocType("company_document")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      docType === "company_document"
                        ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="text-xs font-bold">Company Document</span>
                    </div>
                    <span className="text-[10px] leading-tight opacity-80">
                      Trade license, VAT, accreditations & certificates
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Document Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {docType === "training_material"
                  ? "Training Material Title *"
                  : "Company Document Title *"}
              </Label>
              <Input
                placeholder={
                  docType === "training_material"
                    ? "e.g. Basic First Aid, Boom Loader, Scaffolding Inspector"
                    : "e.g. Trade License, VAT Certificate, ISO Accreditation"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Drive / Share Link */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Google Drive / OneDrive Link *</Label>
              <Input
                placeholder="https://drive.google.com/... or SharePoint link"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            {/* Expiry Date: ONLY for Company Documents, completely hidden for Training Material */}
            {docType === "company_document" && (
              <div className="space-y-1.5 bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Expiry Date (Optional)
                  </Label>
                  {expiryDate && (
                    <button
                      type="button"
                      onClick={() => setExpiryDate("")}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline"
                    >
                      Clear Date
                    </button>
                  )}
                </div>
                <CustomCalendar
                  value={expiryDate ? new Date(expiryDate) : undefined}
                  onChange={(date) =>
                    setExpiryDate(
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                    )
                  }
                  placeholder="Select document expiry date (if any)"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave empty if this company document does not expire.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={`h-9 text-xs font-semibold ${
                  docType === "training_material"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {editingDoc
                  ? "Save Changes"
                  : isTrainingOnlyRole
                    ? "Add Material"
                    : "Add Document"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletingDocTarget}
        onOpenChange={(op) => !op && setDeletingDocTarget(null)}
        title={isTrainingOnlyRole ? "Delete Training Material?" : "Delete Document Link?"}
        description={`Are you sure you want to delete "${formatTitleCase(deletingDocTarget?.name)}"? This ${isTrainingOnlyRole ? "training material" : "document link"} will be removed from the system.`}
        type="destructive"
        confirmText={isTrainingOnlyRole ? "Delete Material" : "Delete Document"}
        cancelText="Cancel"
        onConfirm={async () => {
          if (deletingDocTarget) {
            await handleDeleteClick(deletingDocTarget.id, deletingDocTarget.name);
            setDeletingDocTarget(null);
          }
        }}
      />
    </div>
  );
}

export default CompanyDocumentsTab;
