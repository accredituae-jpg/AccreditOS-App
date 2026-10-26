import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  HelpCircle,
  BookOpen,
  ShieldCheck,
  FileText,
  Award,
  Download,
  Search,
  Users,
  ExternalLink,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HelpCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCenterDialog({ open, onOpenChange }: HelpCenterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border border-border shadow-2xl rounded-xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Help Center & User Manual
                <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">
                  v1.0.0
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Official guide for AccreditOS ERP features, certificate generation, and administration.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="user-guide" className="w-full mt-2">
          <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1">
            <TabsTrigger value="user-guide" className="text-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              User Guide
            </TabsTrigger>
            <TabsTrigger value="admin-guide" className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Guide
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Resources & Docs
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: User Guide */}
          <TabsContent value="user-guide" className="space-y-4 pt-3 text-sm">
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <Award className="w-4 h-4" />
                Certificate Management & Generation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AccreditOS supports dynamic certificate generation for internal Tatweer courses.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>
                  <strong className="text-foreground">Word (.docx) Download:</strong> Downloads an editable Word document with populated student, duration, and course parameters.
                </li>
                <li>
                  <strong className="text-foreground">Vector PDF Download:</strong> Generates a high-resolution vector PDF certificate with custom Monotype Corsiva & Calibri typography.
                </li>
                <li>
                  <strong className="text-foreground">External Certificates:</strong> Third-party certificates issued by outside awarding bodies cannot be generated using internal Tatweer templates.
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <Search className="w-4 h-4" />
                Search & Filter Records
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the top search bar across modules to quickly filter by Participant Name, Certificate Number, or Client Company. Filter status tags (`Active`, `Expired`, `Revoked`) to manage record lifecycles.
              </p>
            </div>
          </TabsContent>

          {/* Tab 2: Admin Guide */}
          <TabsContent value="admin-guide" className="space-y-4 pt-3 text-sm">
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <Users className="w-4 h-4" />
                Role-Based Access Control (RBAC)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                System permissions are divided into roles:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong className="text-foreground">Super Admin / Developer:</strong> Full system control, template setup, permissions management.</li>
                <li><strong className="text-foreground">Manager:</strong> Read/Write access to certificates, clients, and financial logs.</li>
                <li><strong className="text-foreground">Operator / Trainer:</strong> Operational entry and view permissions.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <ShieldCheck className="w-4 h-4" />
                Settings & Permissions Grid
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                System administrators can navigate to <strong className="text-foreground">Settings -&gt; Permissions Grid</strong> to toggle Read, Create, Edit, and Delete access per module for each role.
              </p>
            </div>
          </TabsContent>

          {/* Tab 3: Resources & Docs */}
          <TabsContent value="resources" className="space-y-3 pt-3 text-sm">
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-primary">
                Project Documentation Hub
              </h4>
              <p className="text-xs text-muted-foreground">
                Detailed technical documentation is available inside the project repository under the <code className="bg-muted px-1 py-0.5 rounded text-foreground">docs/</code> directory:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded bg-background border border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">CERTIFICATE_GENERATION_GUIDE.md</span>
                </div>
                <div className="p-2 rounded bg-background border border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">PERFORMANCE_PLAYBOOK.md</span>
                </div>
                <div className="p-2 rounded bg-background border border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">DEVELOPER_GUIDE.md</span>
                </div>
                <div className="p-2 rounded bg-background border border-border flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">SYSTEM_ARCHITECTURE.md</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default HelpCenterDialog;
