import { z } from "zod";

export const clientFormSchema = z.object({
  companyName: z
    .string()
    .min(3, "Company name must be at least 3 characters")
    .max(100, "Company name must be under 100 characters"),
  phone: z.string().min(6, "Phone number must be at least 6 digits"),
  email: z.string().email("Invalid email format"),
  location: z.string().min(1, "Location/Address is required"),
  status: z.enum(["active", "archived"]),
  trnNo: z.string().optional(),
  poBox: z.string().optional(),
  fax: z.string().optional(),
  notes: z.string().optional(),
  courseRates: z.any().optional(),
});
