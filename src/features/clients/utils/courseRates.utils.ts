import type { ClientCourseRates, AwardingBodyRateTier } from "@/lib/clients";

/**
 * Checks if a course is categorized as Inspection or Supervisor.
 * Covers serviceType === 'inspection' as well as keywords like 'supervisor', 'inspector', etc.
 */
export function isInspectionOrSupervisorCourse(
  courseName: string,
  serviceType?: string
): boolean {
  if (serviceType === "inspection") return true;
  const lower = (courseName || "").toLowerCase();
  return (
    lower.includes("supervisor") ||
    lower.includes("supervision") ||
    lower.includes("inspect") ||
    lower.includes("auditor") ||
    lower.includes("audit")
  );
}

/**
 * Normalize client course rates with sensible defaults for Tatweer and Arbrit
 */
export function normalizeClientCourseRates(
  rawRates?: any
): ClientCourseRates {
  const rates: ClientCourseRates = {};

  // Standard keys
  const standardBodies = ["tatweer", "arbrit"];
  standardBodies.forEach((body) => {
    rates[body] = { normal: "", inspection: "" };
  });

  if (rawRates && typeof rawRates === "object") {
    Object.entries(rawRates).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase().trim();
      const tier = val as AwardingBodyRateTier;
      rates[lowerKey] = {
        normal: tier?.normal !== undefined && tier?.normal !== null ? String(tier.normal) : "",
        inspection: tier?.inspection !== undefined && tier?.inspection !== null ? String(tier.inspection) : "",
      };
    });
  }

  return rates;
}

/**
 * Lookup the agreed rate for a client given the awarding body and course.
 * Matches Tatweer, Arbrit, and any other configured awarding bodies.
 * Returns null if not configured so the user can enter manually.
 */
export function getClientCourseRate(
  clientRates: ClientCourseRates | undefined | null,
  awardingBody: string,
  courseName: string,
  serviceType?: string
): number | null {
  if (!clientRates || typeof clientRates !== "object") return null;

  const bodyLower = (awardingBody || "").toLowerCase().trim();

  // Find matching awarding body key in clientRates
  let matchedTier: AwardingBodyRateTier | undefined;
  for (const [key, tier] of Object.entries(clientRates)) {
    const kLower = key.toLowerCase().trim();
    if (
      kLower === bodyLower ||
      bodyLower.includes(kLower) ||
      (kLower === "tatweer" && (bodyLower.includes("tatweer") || bodyLower.includes("tct"))) ||
      (kLower === "arbrit" && bodyLower.includes("arbrit"))
    ) {
      matchedTier = tier;
      break;
    }
  }

  if (!matchedTier) return null;

  const isInspection = isInspectionOrSupervisorCourse(courseName, serviceType);
  const targetVal = isInspection ? matchedTier.inspection : matchedTier.normal;

  if (
    targetVal !== undefined &&
    targetVal !== null &&
    targetVal !== "" &&
    !isNaN(Number(targetVal)) &&
    Number(targetVal) > 0
  ) {
    return Number(targetVal);
  }

  return null;
}
