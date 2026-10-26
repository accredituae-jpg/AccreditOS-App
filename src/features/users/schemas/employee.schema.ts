import { z } from "zod";

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Emergency contact name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  relation: z.string().min(1, "Relation is required"),
  country: z.string().min(1, "Country is required"),
});

export const educationEntrySchema = z.object({
  courseName: z.string().min(1, "Course name is required"),
  institutionName: z.string().min(1, "Institution name is required"),
  completedYear: z.union([
    z.number().int().min(1900).max(new Date().getFullYear() + 10),
    z.string().transform((value) => Number(value)).refine((value) => !Number.isNaN(value)),
  ]),
});

export const workExperienceEntrySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  designation: z.string().min(1, "Designation is required"),
  yearsOfExperience: z.union([
    z.number().int().min(0).max(80),
    z.string().transform((value) => Number(value)).refine((value) => !Number.isNaN(value)),
  ]),
});

export const employeeFormSchema = z.object({
  personalDetails: z.object({
    name: z.string().min(1, "Name is required"),
    fatherName: z.string().min(1, "Father's name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    bloodGroup: z.string().min(1, "Blood group is required"),
    gender: z.enum(["M", "F", "Other"]),
    religion: z.string().min(1, "Religion is required"),
    email: z.string().email("Enter a valid email address"),
    maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
  }),
  permanentAddress: z.object({
    address: z.string().min(1, "Permanent address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    pinCode: z.string().min(1, "PIN code is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
  }),
  localAddress: z.object({
    address: z.string().min(1, "Local address is required"),
    contactNumber: z.string().min(1, "Local contact number is required"),
  }),
  emergencyContacts: z.array(emergencyContactSchema).min(1, "At least one emergency contact is required"),
  bankDetails: z.object({
    bankName: z.string().min(1, "Bank name is required"),
    accountHolderName: z.string().min(1, "Account holder name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    iban: z.string().min(1, "IBAN is required"),
  }),
  education: z.array(educationEntrySchema),
  workExperience: z.array(workExperienceEntrySchema),
  declaration: z.object({
    accepted: z.boolean().refine((value) => value === true, {
      message: "You must accept the declaration to submit the form",
    }),
    signatureDate: z.string().optional(),
  }),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
