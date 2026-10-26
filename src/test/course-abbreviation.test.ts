import { describe, it, expect } from "vitest";
import {
  getCourseShortName,
  shortenCourseInDescription,
} from "../features/billing/utils/course-abbreviation";

describe("Course Abbreviation Utility for Invoices", () => {
  it("converts Rigging and Slinging variations to R & S", () => {
    expect(getCourseShortName("Rigging and Slinging")).toBe("R & S");
    expect(getCourseShortName("Rigging & Slinging")).toBe("R & S");
    expect(getCourseShortName("RIGGING & SLINGING")).toBe("R & S");
    expect(getCourseShortName("Rigging & Slinging Level 1")).toBe("R & S L1");
    expect(getCourseShortName("Rigging & Slinging Level 2")).toBe("R & S L2");
    expect(getCourseShortName("Rigging & Slinging Level 3")).toBe("R & S L3");
  });

  it("converts other safety courses to their concise short terms", () => {
    expect(getCourseShortName("Banksman & Flagman")).toBe("B & F");
    expect(getCourseShortName("Banksman and Flagman")).toBe("B & F");
    expect(getCourseShortName("Safe Lifting Supervisor")).toBe("SLS");
    expect(getCourseShortName("Welding Safety")).toBe("WS");
    expect(getCourseShortName("Fire Safety Awareness")).toBe("FSA");
    expect(getCourseShortName("Scaffolding Safety")).toBe("SS");
    expect(getCourseShortName("Scaffolding Erection & Dismantling")).toBe("SE & D");
    expect(getCourseShortName("Work at Height (WAH)")).toBe("WAH");
    expect(getCourseShortName("Lockout - Tagout (LOTO)")).toBe("LOTO");
    expect(getCourseShortName("Permit to Work (PTW)")).toBe("PTW");
    expect(getCourseShortName("First Aid & CPR")).toBe("FA & CPR");
    expect(getCourseShortName("Dump Truck Operator")).toBe("DTO");
    expect(getCourseShortName("Mobile Crane & Heavy Vehicle Operator")).toBe("MC & HVO");
  });

  it("leaves already abbreviated codes unchanged", () => {
    expect(getCourseShortName("R & S")).toBe("R & S");
    expect(getCourseShortName("B & F")).toBe("B & F");
    expect(getCourseShortName("SLS")).toBe("SLS");
    expect(getCourseShortName("LOTO")).toBe("LOTO");
  });

  it("handles unknown or dynamic new courses algorithmically", () => {
    expect(getCourseShortName("Advanced Industrial Welding")).toBe("AIW");
    expect(getCourseShortName("Pipeline Inspection & Testing")).toBe("PI & T");
  });

  it("shortens course in full line item descriptions", () => {
    expect(
      shortenCourseInDescription(
        "5899 - Akhil Kavintekizhakkethil - Rigging and Slinging",
      ),
    ).toBe("5899 - Akhil Kavintekizhakkethil - R & S");

    expect(
      shortenCourseInDescription(
        "5899 - Akhil Kavintekizhakkethil - Rigging & Slinging",
      ),
    ).toBe("5899 - Akhil Kavintekizhakkethil - R & S");

    expect(
      shortenCourseInDescription(
        "5899 - Akhil Kavintekizhakkethil - Rigging & Slinging [Aqua Dynamic]",
      ),
    ).toBe("5899 - Akhil Kavintekizhakkethil - R & S [Aqua Dynamic]");

    expect(
      shortenCourseInDescription(
        "Akhil Kavintekizhakkethil - Safe Lifting Supervisor",
      ),
    ).toBe("Akhil Kavintekizhakkethil - SLS");

    expect(
      shortenCourseInDescription(
        "5899 - Akhil Kavintekizhakkethil - R & S",
      ),
    ).toBe("5899 - Akhil Kavintekizhakkethil - R & S");
  });
});
