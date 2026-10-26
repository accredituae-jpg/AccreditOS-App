/**
 * Safe Date Utilities for AccreditOS Reports Center
 * Guarantees zero `RangeError: Invalid time value` crashes when formatting
 * heterogeneous date strings, invalid timestamps, or nullish date inputs.
 */

export function formatReportDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "N/A";
  if (typeof dateStr === "string") {
    const trimmed = dateStr.trim();
    if (
      trimmed === "" ||
      trimmed === "N/A" ||
      trimmed === "null" ||
      trimmed === "undefined"
    ) {
      return "N/A";
    }
    if (trimmed.match(/^\d{2}-[A-Za-z]{3}-\d{2,4}$/)) {
      return trimmed;
    }
    // Handle DD-MM-YYYY or DD/MM/YYYY
    if (trimmed.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
      const parts = trimmed.split(/[-/]/);
      const day = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const yr = parts[2].slice(-2);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = months[mIdx] || parts[1];
      return `${day}-${monthName}-${yr}`;
    }
    // Handle YYYY-MM-DD
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
      const datePart = trimmed.split("T")[0];
      const [year, month, day] = datePart.split("-");
      const mIdx = parseInt(month, 10) - 1;
      const yr = year.slice(-2);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = months[mIdx] || month;
      return `${day}-${monthName}-${yr}`;
    }
  }

  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (!d || isNaN(d.getTime())) return "N/A";

    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dubai",
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    return formatter.format(d).replace(/ /g, "-");
  } catch {
    return "N/A";
  }
}

export function formatReportISODate(dateStr?: string | Date | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (!d || isNaN(d.getTime())) return "N/A";
    return d.toISOString().split("T")[0];
  } catch {
    return "N/A";
  }
}

/**
 * Formats certificate numbers for display and reporting.
 * Strips organizational prefixes like "TCT-" and suffixes like "-AC",
 * extracting only the core numeric identifier (e.g. "TCT-5748-AC" -> "5748").
 */
export function formatCertificateNumber(certNo?: string | null): string {
  if (!certNo) return "N/A";
  const trimmed = certNo.trim();
  if (
    !trimmed ||
    trimmed === "N/A" ||
    trimmed === "null" ||
    trimmed === "undefined"
  ) {
    return "N/A";
  }

  // Remove common prefixes (TCT-, AC-, CERT-) and suffixes (-AC, -TCT)
  const cleaned = trimmed
    .replace(/^(TCT|AC|CERT)[-\s_]*/i, "")
    .replace(/[-\s_]*(AC|TCT)$/i, "")
    .trim();

  // If there's an embedded number sequence like 5748 in a string with hyphens/letters, extract it
  const numMatch = cleaned.match(/\d+/);
  if (numMatch && /^[A-Za-z\s_-]*\d+[A-Za-z\s_-]*$/.test(trimmed)) {
    return numMatch[0];
  }

  return cleaned || trimmed;
}

/**
 * Safely parses any date input (DD-MM-YYYY, ISO string, Date object)
 * preventing JS Date constructor day/month inversion bugs.
 */
export function parseReportDate(dInput: any): Date | null {
  if (!dInput) return null;
  if (dInput instanceof Date) return isNaN(dInput.getTime()) ? null : dInput;

  if (typeof dInput === "string") {
    const trimmed = dInput.trim();
    if (
      !trimmed ||
      trimmed === "N/A" ||
      trimmed === "null" ||
      trimmed === "undefined"
    )
      return null;

    // Handle DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const parsed = new Date(year, month, day);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Handle YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const parsed = new Date(year, month, day);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}
