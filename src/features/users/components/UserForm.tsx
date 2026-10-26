import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  MapPin,
  Paperclip,
  Plus,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { FormSectionHeader } from "@/components/ui/form-dialog-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  UserRole,
  UserProfile,
  CurrentUser,
  type EmployeeProfileData,
  type UserAttachment,
} from "@/lib/permissions";

export interface UserFormSubmitData {
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  password?: string;
  bankName: string;
  accountNo: string;
  iban: string;
  attachments: UserAttachment[];
  employeeProfile: EmployeeProfileData;
}

export interface UserFormProps {
  mode: "create" | "edit" | "profile" | "employee";
  initialUser?: UserProfile | CurrentUser | null;
  activeRole?: UserRole;
  isSubmitting?: boolean;
  onSubmit: (data: UserFormSubmitData) => Promise<void> | void;
  onCancel: () => void;
}

const createEmptyEmergencyContact = () => ({
  name: "",
  contactNumber: "",
  relation: "",
  country: "",
});

const createEmptyEducationRow = () => ({
  courseName: "",
  institutionName: "",
  completedYear: "",
});

const createEmptyWorkRow = () => ({
  companyName: "",
  designation: "",
  yearsOfExperience: "",
});

const createEmptyAttachment = (): UserAttachment => ({
  id: "att_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
  name: "",
  driveLink: "",
});

const createDefaultEmployeeProfile = (): EmployeeProfileData => ({
  personalDetails: {
    name: "",
    fatherName: "",
    dateOfBirth: "",
    bloodGroup: "",
    gender: "M",
    religion: "",
    email: "",
    maritalStatus: "Single",
    country: "",
    state: "",
  },
  permanentAddress: {
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    contactNumber: "",
  },
  localAddress: {
    address: "",
    contactNumber: "",
  },
  emergencyContacts: [createEmptyEmergencyContact(), createEmptyEmergencyContact()],
  bankDetails: {
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    iban: "",
  },
  education: [createEmptyEducationRow()],
  workExperience: [createEmptyWorkRow()],
  declaration: {
    accepted: false,
    signatureDate: "",
  },
});

export function UserForm({
  mode,
  initialUser,
  activeRole = "super_admin",
  isSubmitting = false,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<UserRole>("trainer");
  const [password, setPassword] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [iban, setIban] = useState("");
  const [attachments, setAttachments] = useState<UserAttachment[]>([]);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfileData>(createDefaultEmployeeProfile);

  useEffect(() => {
    if (initialUser) {
      const prof = initialUser.employeeProfile || createDefaultEmployeeProfile();
      setName(initialUser.name || "");
      setEmail(initialUser.email || "");
      setMobile(initialUser.mobile || prof.permanentAddress?.contactNumber || prof.localAddress?.contactNumber || "");
      setRole(initialUser.role || "trainer");
      setPassword("");
      setBankName(initialUser.bankName || prof.bankDetails?.bankName || "");
      setAccountNo(initialUser.accountNo || prof.bankDetails?.accountNumber || "");
      setIban(initialUser.iban || prof.bankDetails?.iban || "");
      setAttachments(Array.isArray((initialUser as any).attachments) ? (initialUser as any).attachments : []);
      setEmployeeProfile({
        ...createDefaultEmployeeProfile(),
        ...prof,
        personalDetails: {
          ...createDefaultEmployeeProfile().personalDetails,
          ...prof.personalDetails,
          name: prof.personalDetails?.name || initialUser.name || "",
          email: prof.personalDetails?.email || initialUser.email || "",
        },
        bankDetails: {
          ...createDefaultEmployeeProfile().bankDetails,
          ...prof.bankDetails,
          bankName: prof.bankDetails?.bankName || initialUser.bankName || "",
          accountNumber: prof.bankDetails?.accountNumber || initialUser.accountNo || "",
          iban: prof.bankDetails?.iban || initialUser.iban || "",
        },
        permanentAddress: {
          ...createDefaultEmployeeProfile().permanentAddress,
          ...prof.permanentAddress,
          contactNumber: prof.permanentAddress?.contactNumber || initialUser.mobile || "",
        },
      });
    } else {
      setName("");
      setEmail("");
      setMobile("");
      setRole("trainer");
      setPassword("");
      setBankName("");
      setAccountNo("");
      setIban("");
      setAttachments([]);
      setEmployeeProfile(createDefaultEmployeeProfile());
    }
  }, [initialUser, mode]);

  // Two-way synchronization helpers
  const handleNameChange = (val: string) => {
    setName(val);
    setEmployeeProfile((prev) => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, name: val },
    }));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmployeeProfile((prev) => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, email: val },
    }));
  };

  const handleMobileChange = (val: string) => {
    setMobile(val);
    setEmployeeProfile((prev) => ({
      ...prev,
      permanentAddress: { ...prev.permanentAddress, contactNumber: val },
    }));
  };

  const updatePersonalDetails = <K extends keyof EmployeeProfileData["personalDetails"]>(
    key: K,
    value: EmployeeProfileData["personalDetails"][K],
  ) => {
    if (key === "name") setName(value as string);
    if (key === "email") setEmail(value as string);
    setEmployeeProfile((prev) => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, [key]: value },
    }));
  };

  const updatePermanentAddress = <K extends keyof EmployeeProfileData["permanentAddress"]>(
    key: K,
    value: EmployeeProfileData["permanentAddress"][K],
  ) => {
    if (key === "contactNumber" && !mobile) setMobile(value as string);
    setEmployeeProfile((prev) => ({
      ...prev,
      permanentAddress: { ...prev.permanentAddress, [key]: value },
    }));
  };

  const updateLocalAddress = <K extends keyof EmployeeProfileData["localAddress"]>(
    key: K,
    value: EmployeeProfileData["localAddress"][K],
  ) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      localAddress: { ...prev.localAddress, [key]: value },
    }));
  };

  const updateBankDetails = <K extends keyof EmployeeProfileData["bankDetails"]>(
    key: K,
    value: EmployeeProfileData["bankDetails"][K],
  ) => {
    if (key === "bankName") setBankName(value as string);
    if (key === "accountNumber") setAccountNo(value as string);
    if (key === "iban") setIban(value as string);
    setEmployeeProfile((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [key]: value },
    }));
  };

  // Emergency contacts
  const updateEmergencyContact = (
    index: number,
    key: keyof ReturnType<typeof createEmptyEmergencyContact>,
    value: string,
  ) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, idx) =>
        idx === index ? { ...contact, [key]: value } : contact,
      ),
    }));
  };

  const addEmergencyContact = () => {
    setEmployeeProfile((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, createEmptyEmergencyContact()],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      emergencyContacts:
        prev.emergencyContacts.length > 1
          ? prev.emergencyContacts.filter((_, idx) => idx !== index)
          : prev.emergencyContacts,
    }));
  };

  // Education
  const updateEducationRow = (
    index: number,
    key: keyof ReturnType<typeof createEmptyEducationRow>,
    value: string,
  ) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      education: prev.education.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)),
    }));
  };

  const addEducationRow = () => {
    setEmployeeProfile((prev) => ({
      ...prev,
      education: [...prev.education, createEmptyEducationRow()],
    }));
  };

  const removeEducationRow = (index: number) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      education:
        prev.education.length > 1
          ? prev.education.filter((_, idx) => idx !== index)
          : prev.education,
    }));
  };

  // Work experience
  const updateWorkRow = (
    index: number,
    key: keyof ReturnType<typeof createEmptyWorkRow>,
    value: string,
  ) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((row, idx) =>
        idx === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const addWorkRow = () => {
    setEmployeeProfile((prev) => ({
      ...prev,
      workExperience: [...prev.workExperience, createEmptyWorkRow()],
    }));
  };

  const removeWorkRow = (index: number) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      workExperience:
        prev.workExperience.length > 1
          ? prev.workExperience.filter((_, idx) => idx !== index)
          : prev.workExperience,
    }));
  };

  // Attachments
  const addAttachmentRow = () => {
    setAttachments((prev) => [...prev, createEmptyAttachment()]);
  };

  const updateAttachmentRow = (id: string, field: "name" | "driveLink", value: string) => {
    setAttachments((prev) =>
      prev.map((att) => (att.id === id ? { ...att, [field]: value } : att)),
    );
  };

  const removeAttachmentRow = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const dateOfBirthValue = employeeProfile.personalDetails.dateOfBirth
    ? (() => {
        const parts = employeeProfile.personalDetails.dateOfBirth.split("-").map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          if (!isNaN(d.getTime())) return d;
        }
        return undefined;
      })()
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || employeeProfile.personalDetails.name.trim();
    const finalEmail = email.trim() || employeeProfile.personalDetails.email.trim();
    const finalMobile = mobile.trim() || employeeProfile.permanentAddress.contactNumber.trim() || employeeProfile.localAddress.contactNumber.trim();
    const finalBankName = bankName.trim() || employeeProfile.bankDetails.bankName.trim();
    const finalAccountNo = accountNo.trim() || employeeProfile.bankDetails.accountNumber.trim();
    const finalIban = iban.trim() || employeeProfile.bankDetails.iban.trim();

    if (mode !== "profile" && (!finalName || !finalEmail)) return;

    const finalProfile: EmployeeProfileData = {
      ...employeeProfile,
      personalDetails: {
        ...employeeProfile.personalDetails,
        name: finalName,
        email: finalEmail,
      },
      permanentAddress: {
        ...employeeProfile.permanentAddress,
        contactNumber: finalMobile || employeeProfile.permanentAddress.contactNumber,
      },
      bankDetails: {
        ...employeeProfile.bankDetails,
        bankName: finalBankName,
        accountNumber: finalAccountNo,
        iban: finalIban,
      },
      declaration: {
        ...employeeProfile.declaration,
        accepted: employeeProfile.declaration.accepted,
        signatureDate: employeeProfile.declaration.accepted
          ? employeeProfile.declaration.signatureDate || new Date().toISOString().slice(0, 10)
          : undefined,
      },
    };

    onSubmit({
      name: finalName,
      email: finalEmail,
      mobile: finalMobile,
      role,
      password: password.trim() || undefined,
      bankName: finalBankName,
      accountNo: finalAccountNo,
      iban: finalIban,
      attachments: attachments.filter((a) => a.name.trim() || a.driveLink.trim()),
      employeeProfile: finalProfile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Info Section (for Create / Edit / Employee modes) */}
      {mode !== "profile" && (
        <div>
          <FormSectionHeader
            icon={UserRound}
            title="User Identity & Role"
            description="Login email, contact, role permissions, and access password."
          />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="user-name">Full Name *</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Mohamed Khamarudheen P"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email Address *</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-mobile">Mobile Number</Label>
              <Input
                id="user-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                placeholder="e.g. 0501234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Role Assignment *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  {(activeRole === "super_admin" || initialUser?.role === "super_admin") && (
                    <SelectItem value="super_admin">Developer</SelectItem>
                  )}
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="operation_admin">Operator</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">
                {mode === "create" ? "Password (optional)" : "New Password (leave blank to keep unchanged)"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "create" ? "Auto-generated if empty" : "Enter new password..."}
              />
            </div>
          </div>
        </div>
      )}

      {/* Account Info Section for Profile Mode */}
      {mode === "profile" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile-email">Email Address</Label>
            <Input id="profile-email" type="email" value={email} disabled className="bg-muted" />
            <p className="text-[10px] text-muted-foreground">Email address cannot be changed.</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile-name">Full Name *</Label>
            <Input id="profile-name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="profile-mobile">Mobile Number</Label>
            <Input
              id="profile-mobile"
              type="tel"
              placeholder="e.g. 0501234567"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Employee Personal Details */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={UserRound}
          title="Employee Personal Details"
          description="Basic employee profile details"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Full Name *</Label>
            <Input
              value={employeeProfile.personalDetails.name}
              onChange={(e) => updatePersonalDetails("name", e.target.value)}
              placeholder="Mohamed Khamarudheen P"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Father's Name *</Label>
            <Input
              value={employeeProfile.personalDetails.fatherName}
              onChange={(e) => updatePersonalDetails("fatherName", e.target.value)}
              placeholder="Sirajudheen P"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date of Birth *</Label>
            <CustomCalendar
              value={dateOfBirthValue}
              onChange={(date) =>
                updatePersonalDetails(
                  "dateOfBirth",
                  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                )
              }
              placeholder="Date of birth"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Blood Group *</Label>
            <Input
              value={employeeProfile.personalDetails.bloodGroup}
              onChange={(e) => updatePersonalDetails("bloodGroup", e.target.value)}
              placeholder="O+"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gender *</Label>
            <Select
              value={employeeProfile.personalDetails.gender}
              onValueChange={(value) =>
                updatePersonalDetails(
                  "gender",
                  value as EmployeeProfileData["personalDetails"]["gender"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Religion *</Label>
            <Input
              value={employeeProfile.personalDetails.religion}
              onChange={(e) => updatePersonalDetails("religion", e.target.value)}
              placeholder="Islam"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input
              type="email"
              value={employeeProfile.personalDetails.email}
              onChange={(e) => updatePersonalDetails("email", e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Marital Status *</Label>
            <Select
              value={employeeProfile.personalDetails.maritalStatus}
              onValueChange={(value) =>
                updatePersonalDetails(
                  "maritalStatus",
                  value as EmployeeProfileData["personalDetails"]["maritalStatus"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Country *</Label>
            <Input
              value={employeeProfile.personalDetails.country}
              onChange={(e) => updatePersonalDetails("country", e.target.value)}
              placeholder="India"
            />
          </div>
          <div className="space-y-1.5">
            <Label>State *</Label>
            <Input
              value={employeeProfile.personalDetails.state}
              onChange={(e) => updatePersonalDetails("state", e.target.value)}
              placeholder="Kerala"
            />
          </div>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={MapPin}
          title="Permanent Address"
          description="Home country address details"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Address *</Label>
            <Textarea
              value={employeeProfile.permanentAddress.address}
              onChange={(e) => updatePermanentAddress("address", e.target.value)}
              placeholder="Full permanent address"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>City *</Label>
            <Input
              value={employeeProfile.permanentAddress.city}
              onChange={(e) => updatePermanentAddress("city", e.target.value)}
              placeholder="Kozhikode"
            />
          </div>
          <div className="space-y-1.5">
            <Label>State *</Label>
            <Input
              value={employeeProfile.permanentAddress.state}
              onChange={(e) => updatePermanentAddress("state", e.target.value)}
              placeholder="Kerala"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country *</Label>
            <Input
              value={employeeProfile.permanentAddress.country}
              onChange={(e) => updatePermanentAddress("country", e.target.value)}
              placeholder="India"
            />
          </div>
          <div className="space-y-1.5">
            <Label>PIN Code *</Label>
            <Input
              value={employeeProfile.permanentAddress.pinCode}
              onChange={(e) => updatePermanentAddress("pinCode", e.target.value)}
              placeholder="673xxx"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Contact Number *</Label>
            <Input
              value={employeeProfile.permanentAddress.contactNumber}
              onChange={(e) => updatePermanentAddress("contactNumber", e.target.value)}
              placeholder="Home contact number"
            />
          </div>
        </div>
      </div>

      {/* Local Address */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={MapPin}
          title="Local Address"
          description="Resident address in UAE"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Address *</Label>
            <Textarea
              value={employeeProfile.localAddress.address}
              onChange={(e) => updateLocalAddress("address", e.target.value)}
              placeholder="Local address in UAE"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Contact Number *</Label>
            <Input
              value={employeeProfile.localAddress.contactNumber}
              onChange={(e) => updateLocalAddress("contactNumber", e.target.value)}
              placeholder="UAE contact number"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={ShieldAlert}
          title="Emergency Contact"
          description="One or more contacts to alert in case of emergency"
        />
        <div className="mt-4 space-y-4">
          {employeeProfile.emergencyContacts.map((contact, index) => (
            <div key={index} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Contact {index + 1}
                </p>
                {employeeProfile.emergencyContacts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmergencyContact(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(index, "name", e.target.value)}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Number *</Label>
                  <Input
                    value={contact.contactNumber}
                    onChange={(e) => updateEmergencyContact(index, "contactNumber", e.target.value)}
                    placeholder="+971 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Relation *</Label>
                  <Input
                    value={contact.relation}
                    onChange={(e) => updateEmergencyContact(index, "relation", e.target.value)}
                    placeholder="Brother / Spouse"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Country *</Label>
                  <Input
                    value={contact.country}
                    onChange={(e) => updateEmergencyContact(index, "country", e.target.value)}
                    placeholder="UAE"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addEmergencyContact} className="gap-2">
            <Plus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={Building2}
          title="Bank Account Details"
          description="Employee banking and account information"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Bank Name *</Label>
            <Input
              value={employeeProfile.bankDetails.bankName}
              onChange={(e) => updateBankDetails("bankName", e.target.value)}
              placeholder="Emirates NBD"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account Holder Name *</Label>
            <Input
              value={employeeProfile.bankDetails.accountHolderName}
              onChange={(e) => updateBankDetails("accountHolderName", e.target.value)}
              placeholder="Employee name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account Number *</Label>
            <Input
              value={employeeProfile.bankDetails.accountNumber}
              onChange={(e) => updateBankDetails("accountNumber", e.target.value)}
              placeholder="123456789"
            />
          </div>
          <div className="space-y-1.5">
            <Label>IBAN *</Label>
            <Input
              value={employeeProfile.bankDetails.iban}
              onChange={(e) => updateBankDetails("iban", e.target.value)}
              placeholder="AE123456789012345678901"
            />
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={Paperclip}
          title="Document Attachments (Drive Links)"
          description="Attach Google Drive or cloud document links (Name & Drive Link)"
        />
        <div className="mt-4 space-y-3">
          {attachments.map((att, idx) => (
            <div
              key={att.id || idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-muted/30 p-3 rounded-xl border border-border"
            >
              <div className="md:col-span-5 space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Attachment Name *
                </Label>
                <Input
                  placeholder="e.g. Emirates ID / Passport / Visa"
                  value={att.name}
                  onChange={(e) => updateAttachmentRow(att.id, "name", e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="md:col-span-6 space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Drive Link / Document URL *
                </Label>
                <Input
                  placeholder="https://drive.google.com/file/d/..."
                  value={att.driveLink}
                  onChange={(e) => updateAttachmentRow(att.id, "driveLink", e.target.value)}
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-end pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAttachmentRow(att.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addAttachmentRow} className="gap-2">
            <Plus className="h-4 w-4" /> Add Attachment
          </Button>
        </div>
      </div>

      {/* Education */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={GraduationCap}
          title="Educational Qualification"
          description="Repeatable academic entries"
        />
        <div className="mt-4 space-y-4">
          {employeeProfile.education.map((row, index) => (
            <div key={index} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Qualification {index + 1}
                </p>
                {employeeProfile.education.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducationRow(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Course Name *</Label>
                  <Input
                    value={row.courseName}
                    onChange={(e) => updateEducationRow(index, "courseName", e.target.value)}
                    placeholder="B.Tech"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>University / Institution *</Label>
                  <Input
                    value={row.institutionName}
                    onChange={(e) => updateEducationRow(index, "institutionName", e.target.value)}
                    placeholder="Calicut University"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Completed Year *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={row.completedYear}
                    onChange={(e) => updateEducationRow(index, "completedYear", e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="2021"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addEducationRow} className="gap-2">
            <Plus className="h-4 w-4" /> Add Education
          </Button>
        </div>
      </div>

      {/* Work Experience */}
      <div className="pt-4 border-t border-border">
        <FormSectionHeader
          icon={BriefcaseBusiness}
          title="Previous Work Experience"
          description="Repeatable professional entries"
        />
        <div className="mt-4 space-y-4">
          {employeeProfile.workExperience.map((row, index) => (
            <div key={index} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Experience {index + 1}
                </p>
                {employeeProfile.workExperience.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkRow(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input
                    value={row.companyName}
                    onChange={(e) => updateWorkRow(index, "companyName", e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation *</Label>
                  <Input
                    value={row.designation}
                    onChange={(e) => updateWorkRow(index, "designation", e.target.value)}
                    placeholder="Engineer"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Years of Experience *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={row.yearsOfExperience}
                    onChange={(e) => updateWorkRow(index, "yearsOfExperience", e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="3"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addWorkRow} className="gap-2">
            <Plus className="h-4 w-4" /> Add Experience
          </Button>
        </div>
      </div>

      {/* Declaration */}
      <div className="pt-4 border-t border-border">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="declaration-check"
              checked={employeeProfile.declaration.accepted}
              onCheckedChange={(checked) =>
                setEmployeeProfile((prev) => ({
                  ...prev,
                  declaration: {
                    ...prev.declaration,
                    accepted: checked === true,
                    signatureDate:
                      checked === true
                        ? prev.declaration.signatureDate || new Date().toISOString().slice(0, 10)
                        : "",
                  },
                }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="declaration-check" className="text-sm font-medium leading-relaxed">
                I hereby declare that the information provided is true and complete.
              </Label>
              <p className="text-xs text-muted-foreground">
                Submission date: {employeeProfile.declaration.signatureDate || "Not yet signed"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create" || mode === "employee"
              ? "Creating..."
              : "Saving..."
            : mode === "create" || mode === "employee"
              ? "Create Account"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
