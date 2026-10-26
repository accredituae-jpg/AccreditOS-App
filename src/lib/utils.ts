import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DIRHAM_UNICODE } from "dirham";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DIRHAM_SYMBOL = DIRHAM_UNICODE; // U+20C3 (Unicode 18.0 UAE Dirham Sign)

/**
 * Format a number as UAE Dirham currency.
 * Uses the official Unicode 18.0 Dirham symbol (U+20C3: ⃃).
 * Supports full and compact notation, with optional fallback to "AED".
 * e.g. 1500 → "⃃ 1,500", 1200000 → "⃃ 1.2M"
 */
export function formatAED(
  amount: number | string | null | undefined,
  full = true,
  useSymbol = true,
): string {
  const numericAmount =
    typeof amount === "number" ? amount : Number(amount ?? 0);

  const prefix = useSymbol ? `${DIRHAM_SYMBOL} ` : "AED ";

  if (!Number.isFinite(numericAmount)) {
    return `${prefix}0`;
  }

  const abs = Math.abs(numericAmount);
  const sign = numericAmount < 0 ? "-" : "";

  if (full) {
    const hasDecimals = abs % 1 !== 0;
    return `${sign}${prefix}${abs.toLocaleString("en-US", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }

  if (abs >= 1_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${prefix}${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
  }
  return `${sign}${prefix}${abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)}`;
}

const COMMON_ACRONYMS = new Set([
  "ISO",
  "VAT",
  "TRN",
  "UAE",
  "CPR",
  "AED",
  "HSE",
  "OSHA",
  "HABC",
  "IOSH",
  "NEBOSH",
  "BLS",
  "LLC",
  "FZE",
  "FZCO",
  "PJSC",
  "ID",
  "PO",
  "P.O.",
]);

/**
 * Standardize text into consistent Title Case.
 * Capitalizes each word while preserving standard acronyms (ISO, VAT, OSHA, CPR, etc.).
 * e.g. "tRaDe LiCeNsE" -> "Trade License", "iso 9001" -> "ISO 9001"
 */
export function formatTitleCase(str?: string | null): string {
  if (!str) return "";
  const trimmed = str.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\s+/)
    .map((word) => {
      // Extract alphanumeric core to check against acronyms
      const core = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
      if (COMMON_ACRONYMS.has(core.toUpperCase())) {
        return word.replace(new RegExp(core, "i"), core.toUpperCase());
      }

      // Handle hyphens e.g. "first-aid" -> "First-Aid"
      if (word.includes("-")) {
        return word
          .split("-")
          .map((part) =>
            part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""
          )
          .join("-");
      }

      // Handle slashes e.g. "license/registration" -> "License/Registration"
      if (word.includes("/")) {
        return word
          .split("/")
          .map((part) =>
            part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""
          )
          .join("/");
      }

      // Standard capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

