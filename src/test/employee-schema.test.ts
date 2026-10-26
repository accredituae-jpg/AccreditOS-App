import { describe, expect, it } from "vitest";
import { employeeFormSchema } from "../features/users/schemas/employee.schema";

describe("employeeFormSchema", () => {
  it("accepts a valid employee details payload", () => {
    const result = employeeFormSchema.safeParse({
      personalDetails: {
        name: "Mohamed Khamarudheen P",
        fatherName: "Sirajudheen P",
        dateOfBirth: "1999-04-07",
        bloodGroup: "O+",
        gender: "M",
        religion: "Islam",
        email: "mohamed@example.com",
        maritalStatus: "Single",
        country: "India",
        state: "Kerala",
      },
      permanentAddress: {
        address: "Polakulath (H), Valakkulam (PO)",
        city: "Kozhikode",
        state: "Kerala",
        country: "India",
        pinCode: "673xxx",
        contactNumber: "+91 00000 00000",
      },
      localAddress: {
        address: "Dubai",
        contactNumber: "+971 500000000",
      },
      emergencyContacts: [
        {
          name: "Emergency Contact 1",
          contactNumber: "+971 500000001",
          relation: "Brother",
          country: "UAE",
        },
      ],
      bankDetails: {
        bankName: "Emirates NBD",
        accountHolderName: "Mohamed Khamarudheen",
        accountNumber: "123456789",
        iban: "AE123456789012345678901",
      },
      education: [
        {
          courseName: "B.Tech",
          institutionName: "Calicut University",
          completedYear: 2021,
        },
      ],
      workExperience: [
        {
          companyName: "Sample Company",
          designation: "Engineer",
          yearsOfExperience: 3,
        },
      ],
      declaration: {
        accepted: true,
        signatureDate: "2026-08-13",
      },
    });

    expect(result.success).toBe(true);
  });

  it("requires declaration acceptance", () => {
    const result = employeeFormSchema.safeParse({
      personalDetails: {
        name: "Mohamed",
        fatherName: "Siraj",
        dateOfBirth: "1999-04-07",
        bloodGroup: "O+",
        gender: "M",
        religion: "Islam",
        email: "mohamed@example.com",
        maritalStatus: "Single",
        country: "India",
        state: "Kerala",
      },
      permanentAddress: {
        address: "Address 1, Address 2",
        city: "Kozhikode",
        state: "Kerala",
        country: "India",
        pinCode: "673000",
        contactNumber: "+91 12345 67890",
      },
      localAddress: {
        address: "Dubai",
        contactNumber: "+971 500000000",
      },
      emergencyContacts: [
        {
          name: "Emergency Contact",
          contactNumber: "+971 500000001",
          relation: "Brother",
          country: "UAE",
        },
      ],
      bankDetails: {
        bankName: "Emirates NBD",
        accountHolderName: "Mohamed Khamarudheen",
        accountNumber: "123456789",
        iban: "AE123456789012345678901",
      },
      education: [],
      workExperience: [],
      declaration: {
        accepted: false,
      },
    });

    expect(result.success).toBe(false);
  });
});
