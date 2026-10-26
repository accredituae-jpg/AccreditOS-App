import { useState } from "react";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, getActiveRole, type UserProfile, type UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiImpersonateUser } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import {
  User,
  LogIn,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Landmark,
  MapPin,
  BriefcaseBusiness,
  GraduationCap,
  Paperclip,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  CalendarDays,
  FileCheck2,
  FileText,
  Heart,
  Globe,
} from "lucide-react";

interface UserDetailsDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const authStore = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const currentUserId = localStorage.getItem("accreditOS_user_id");
  const activeRole = getActiveRole();
  const canImpersonate =
    (activeRole === "super_admin" || !!localStorage.getItem("accreditOS_impersonator_token")) &&
    user.id !== currentUserId;

  const handleImpersonateUser = async () => {
    try {
      setIsImpersonating(true);
      const res = await apiImpersonateUser(user.id);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to switch user account.");
      }

      // Preserve original admin session if this is the first hop
      if (!localStorage.getItem("accreditOS_impersonator_token")) {
        const adminToken = localStorage.getItem("accreditOS_auth_token") || "";
        const adminName = localStorage.getItem("accreditOS_user_name") || "Developer";
        const adminRole = localStorage.getItem("accreditOS_user_role") || "super_admin";
        const adminEmail = localStorage.getItem("accreditOS_user_email") || "";

        localStorage.setItem("accreditOS_impersonator_token", adminToken);
        localStorage.setItem("accreditOS_impersonator_name", adminName);
        localStorage.setItem("accreditOS_impersonator_role", adminRole);
        localStorage.setItem("accreditOS_impersonator_email", adminEmail);
      }

      authStore.login(res.data.token, res.data.user);

      toast({
        title: "Session Switched",
        description: `Logged in as ${user.name} (${ROLE_LABELS[user.role] || user.role}).`,
      });

      onOpenChange(false);

      if (user.role === "sales") {
        navigate("/clients");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Failed to log in as this user.",
        variant: "destructive",
      });
    } finally {
      setIsImpersonating(false);
    }
  };

  const employee = user.employeeProfile;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast({
      title: "Copied to Clipboard",
      description: `${label} (${text}) copied!`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const emergencyContacts = employee?.emergencyContacts?.length
    ? employee.emergencyContacts
    : [];
  const education = employee?.education?.length ? employee.education : [];
  const experience = employee?.workExperience?.length ? employee.workExperience : [];
  const attachments = Array.isArray(user.attachments) ? user.attachments : [];

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={employee?.personalDetails?.name || user.name}
      subtitle={user.email}
      icon={<User className="w-5 h-5 sm:w-6 sm:h-6" />}
      status={{
        label: ROLE_LABELS[user.role],
        variant:
          user.role === "super_admin"
            ? "destructive"
            : user.role === "admin"
              ? "info"
              : user.role === "operation_admin"
                ? "success"
                : "default",
      }}
      actions={
        <div className="flex items-center gap-2">
          {canImpersonate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isImpersonating}
              onClick={handleImpersonateUser}
              className="h-8 px-3 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 transition-colors shadow-xs"
              title={`Switch to ${user.name}'s account`}
            >
              {isImpersonating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Login as User</span>
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-5 text-xs font-semibold shadow-xs"
          >
            Close
          </Button>
        </div>
      }
    >
      {/* Clean Tabbed Navigation */}
      <Tabs defaultValue="personal" className="w-full space-y-3">
        <TabsList className="w-full flex items-center gap-1 overflow-x-auto no-scrollbar bg-muted/40 p-1 rounded-xl justify-start h-auto">
          <TabsTrigger
            value="personal"
            className="text-xs font-semibold gap-1.5 rounded-lg py-1.5 px-3 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            Personal
          </TabsTrigger>
          <TabsTrigger
            value="address"
            className="text-xs font-semibold gap-1.5 rounded-lg py-1.5 px-3 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            Addresses
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="text-xs font-semibold gap-1.5 rounded-lg py-1.5 px-3 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
          >
            <Landmark className="w-3.5 h-3.5" />
            Banking
          </TabsTrigger>
          <TabsTrigger
            value="career"
            className="text-xs font-semibold gap-1.5 rounded-lg py-1.5 px-3 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Career & Edu
          </TabsTrigger>
          {attachments.length > 0 && (
            <TabsTrigger
              value="attachments"
              className="text-xs font-semibold gap-1.5 rounded-lg py-1.5 px-3 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs"
            >
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              Documents ({attachments.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Personal Details */}
        <TabsContent value="personal" className="mt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Email Address with Copy Button */}
            <div className="py-2 border-b border-border/30 space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                {user.email && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(user.email, "Email")}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedField === "Email" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "Email" ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-foreground break-all">{user.email}</p>
            </div>

            {/* Mobile Number with Copy Button */}
            <div className="py-2 border-b border-border/30 space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mobile Number</p>
                {user.mobile && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(user.mobile!, "Mobile")}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedField === "Mobile" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "Mobile" ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-foreground">{user.mobile || "Not provided"}</p>
            </div>

            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Father Name</p>
              <p className="text-xs font-semibold text-foreground">{employee?.personalDetails?.fatherName || "—"}</p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date of Birth</p>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                {employee?.personalDetails?.dateOfBirth || "—"}
              </p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Blood Group</p>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                {employee?.personalDetails?.bloodGroup || "—"}
              </p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gender</p>
              <p className="text-xs font-semibold text-foreground">
                {employee?.personalDetails?.gender === "M"
                  ? "Male"
                  : employee?.personalDetails?.gender === "F"
                    ? "Female"
                    : employee?.personalDetails?.gender || "—"}
              </p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Religion</p>
              <p className="text-xs font-semibold text-foreground">{employee?.personalDetails?.religion || "—"}</p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Marital Status</p>
              <p className="text-xs font-semibold text-foreground">{employee?.personalDetails?.maritalStatus || "—"}</p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Country of Origin</p>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                {employee?.personalDetails?.country || "—"}
              </p>
            </div>
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">State / Province</p>
              <p className="text-xs font-semibold text-foreground">{employee?.personalDetails?.state || "—"}</p>
            </div>
          </div>

          {employee?.declaration && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-start gap-3">
              <FileCheck2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Employee Policy Declaration</p>
                <p className="text-[11px] text-muted-foreground">
                  {employee.declaration.accepted
                    ? `Declared & Signed on ${employee.declaration.signatureDate || "Recorded"}`
                    : "Declaration not yet signed"}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Addresses */}
        <TabsContent value="address" className="mt-0 space-y-3">
          <div className="bg-card border border-border/80 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <MapPin className="w-3.5 h-3.5" />
              <span>Local UAE Address</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground font-medium pl-5 break-words">
              {employee?.localAddress?.address || "No local address recorded."}
            </p>
            {employee?.localAddress?.contactNumber && (
              <p className="text-[11px] text-muted-foreground pl-5 pt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Contact: {employee.localAddress.contactNumber}
              </p>
            )}
          </div>

          <div className="bg-card border border-border/80 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Globe className="w-3.5 h-3.5" />
              <span>Permanent Home Country Address</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground font-medium pl-5 break-words">
              {employee?.permanentAddress?.address || (employee?.permanentAddress as any)?.addressLine1 || "No permanent address recorded."}
            </p>
            <p className="text-[11px] text-muted-foreground pl-5">
              {[
                employee?.permanentAddress?.city,
                employee?.permanentAddress?.state,
                employee?.permanentAddress?.country,
                employee?.permanentAddress?.pinCode ? `PIN: ${employee.permanentAddress.pinCode}` : "",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {employee?.permanentAddress?.contactNumber && (
              <p className="text-[11px] text-muted-foreground pl-5 pt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Contact: {employee.permanentAddress.contactNumber}
              </p>
            )}
          </div>

          {emergencyContacts.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Emergency Contacts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">{contact.name || "Contact"}</span>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                        {contact.relation || "Emergency"}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono font-semibold text-primary flex items-center gap-1 pt-0.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {contact.contactNumber || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Banking */}
        <TabsContent value="bank" className="mt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Bank Name</p>
              <p className="text-xs font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {employee?.bankDetails?.bankName || user.bankName || "Not provided"}
              </p>
            </div>

            <div className="py-2 border-b border-border/30 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Account Holder</p>
              <p className="text-xs font-semibold text-foreground">
                {employee?.bankDetails?.accountHolderName || user.name}
              </p>
            </div>

            <div className="bg-card border border-border/80 p-3 rounded-xl space-y-1 sm:col-span-2">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Account Number</p>
                {employee?.bankDetails?.accountNumber || user.accountNo ? (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(employee?.bankDetails?.accountNumber || user.accountNo!, "Account Number")}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedField === "Account Number" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "Account Number" ? "Copied" : "Copy"}</span>
                  </button>
                ) : null}
              </div>
              <p className="text-xs font-mono font-bold text-foreground flex items-center gap-2 break-all">
                <Landmark className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {employee?.bankDetails?.accountNumber || user.accountNo || "Not provided"}
              </p>
            </div>

            <div className="bg-card border border-border/80 p-3 rounded-xl space-y-1 sm:col-span-2">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">IBAN Number</p>
                {employee?.bankDetails?.iban || user.iban ? (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(employee?.bankDetails?.iban || user.iban!, "IBAN")}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedField === "IBAN" ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "IBAN" ? "Copied" : "Copy"}</span>
                  </button>
                ) : null}
              </div>
              <p className="text-xs font-mono font-bold text-primary flex items-center gap-2 break-all">
                <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {employee?.bankDetails?.iban || user.iban || "Not provided"}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Career & Edu */}
        <TabsContent value="career" className="mt-0 space-y-3">
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              Education Qualifications
            </h4>
            {education.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed">
                No education records listed.
              </p>
            ) : (
              <div className="space-y-2">
                {education.map((edu, idx) => (
                  <div key={idx} className="bg-card border border-border/80 p-3 rounded-xl flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs font-bold text-foreground truncate">{edu.courseName || "Qualification"}</p>
                        {edu.completedYear && (
                          <Badge variant="outline" className="text-[10px] font-mono flex-shrink-0">
                            {edu.completedYear}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{edu.institutionName || "Institution"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BriefcaseBusiness className="w-3.5 h-3.5 text-primary" />
              Work Experience History
            </h4>
            {experience.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed">
                No work experience history recorded.
              </p>
            ) : (
              <div className="space-y-2">
                {experience.map((exp, idx) => (
                  <div key={idx} className="bg-card border border-border/80 p-3 rounded-xl flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      <BriefcaseBusiness className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs font-bold text-foreground truncate">{exp.designation || "Position"}</p>
                        {exp.yearsOfExperience && (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/30 flex-shrink-0">
                            {exp.yearsOfExperience} Yrs Exp
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{exp.companyName || "Company"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Documents */}
        {attachments.length > 0 && (
          <TabsContent value="attachments" className="mt-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {attachments.map((att, idx) => {
                const targetUrl = att.driveLink.startsWith("http")
                  ? att.driveLink
                  : `https://${att.driveLink}`;

                return (
                  <div
                    key={att.id || idx}
                    className="bg-card border border-border/80 hover:border-primary/50 transition-all p-3 rounded-xl flex flex-col justify-between gap-2.5 shadow-xs group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{att.name || `Document #${idx + 1}`}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{att.driveLink}</p>
                      </div>
                    </div>

                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full h-7 text-xs font-semibold gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </DetailDialog>
  );
}

export default UserDetailsDialog;
