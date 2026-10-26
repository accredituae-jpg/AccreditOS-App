/**
 * Course Abbreviation Engine for Invoicing
 *
 * Converts full course names into concise standard abbreviations for invoice line items.
 * Example:
 * - "Rigging & Slinging" -> "R & S"
 * - "Rigging and Slinging" -> "R & S"
 * - "Banksman & Flagman" -> "B & F"
 * - "Safe Lifting Supervisor" -> "SLS"
 * - "Welding Safety" -> "WS"
 * - "Work at Height (WAH)" -> "WAH"
 * - "Lockout - Tagout (LOTO)" -> "LOTO"
 */

export const COURSE_ABBREVIATION_MAP: Record<string, string> = {
  // Rigging & Slinging variations
  "rigging & slinging": "R & S",
  "rigging and slinging": "R & S",
  "rigging & slinging level 1": "R & S L1",
  "rigging and slinging level 1": "R & S L1",
  "rigging & slinging level 2": "R & S L2",
  "rigging and slinging level 2": "R & S L2",
  "rigging & slinging level 3": "R & S L3",
  "rigging and slinging level 3": "R & S L3",
  "rigging & slinging - level 1": "R & S L1",
  "rigging & slinging - level 2": "R & S L2",
  "rigging & slinging - level 3": "R & S L3",

  // Banksman & Flagman
  "banksman & flagman": "B & F",
  "banksman and flagman": "B & F",

  // Lifting & Rigging
  "safe lifting supervisor": "SLS",
  "lifting supervisor awareness": "LSA",
  "safe rigging foreman": "SRF",
  "lifting equipment & accessories training": "LE & AT",
  "lifting equipment and accessories training": "LE & AT",

  // Safety & Awareness
  "welding safety": "WS",
  "electrofusion welding safety": "EWS",
  "fire safety awareness": "FSA",
  "advanced fire safety": "AFS",
  "safe fire watcher": "SFW",
  "fire watcher": "FW",
  "safe fire warden": "SFW",
  "electrical safety": "ES",
  "hot work safety": "HWS",
  "excavation safety": "ES",
  "confined space entry": "CSE",
  "chainman safety": "CS",
  "safe operational course": "SOC",
  "chemical handling": "CH",
  "h2s safety awareness": "H2S",
  "incident reporting and investigation awareness": "IRIA",
  "incident reporting & investigation awareness": "IRIA",

  // Height & Scaffolding
  "scaffolding safety": "SS",
  "scaffolding erection & dismantling": "SE & D",
  "scaffolding erection and dismantling": "SE & D",
  "safe scaffolding inspector": "SSI",
  "scaffolding inspector": "SSI",
  "safe work at height": "SWAH",
  "work at height": "WAH",
  "work at height (wah)": "WAH",
  "wah rescue": "WAH Rescue",

  // Equipment & Operators
  "safe forklift operator": "SFO",
  "forklift operator safety": "FOS",
  "safe wheel loader operator": "SWLO",
  "safe boom loader operator": "SBLO",
  "safe scissor lift operator": "SSLO",
  "safe manlift operator": "SMO",
  "safe winch operator": "SWO",
  "safe power tools operator": "SPTO",
  "power tool operator": "PTO",
  "jcb operator": "JCB",
  "safe telehandler operator": "STO",
  "safe bulldozer operator": "SBO",
  "safe dozer operator": "SDO",
  "safe mobile crane operator": "SMCO",
  "crane operator safety": "COS",
  "mobile crane & heavy vehicle operator": "MC & HVO",
  "mobile crane and heavy vehicle operator": "MC & HVO",
  "dump truck operator": "DTO",
  "safe pump operator": "SPO",
  "safe barge master": "SBM",
  "safe pipe fitter": "SPF",
  "hand grinder operator": "HGO",
  "safe steel fabrication": "SSF",
  "safe defensive driving": "SDD",
  "defensive driving": "DD",

  // First Aid
  "basic first aid": "BFA",
  "first aid": "FA",
  "first aid & cpr": "FA & CPR",
  "first aid and cpr": "FA & CPR",

  // Standards / Technical
  "lockout - tagout (loto)": "LOTO",
  "lockout tagout": "LOTO",
  "permit to work (ptw)": "PTW",
  "permit to work": "PTW",
  "hira & emergency response": "HIRA & ER",
  "hira and emergency response": "HIRA & ER",
  "simops internal ade training": "SIMOPS",
  "efst": "EFST",
  "ipaf": "IPAF",
  "inspection": "Inspection",
  "threads": "Threads",
  "temporary stell staircase": "TSS",
  "jb": "JB",
};

/**
 * Returns a short abbreviation for a course name.
 * If the course is already an abbreviation, returns it.
 * If found in known courses map, returns the mapped abbreviation.
 * Otherwise, generates an abbreviation from the words, levels, and '&'.
 */
export function getCourseShortName(courseName?: string | null): string {
  if (!courseName || !courseName.trim()) return "";
  const cleaned = courseName.trim();

  // 1. If parenthesized acronym exists, e.g. "Work at Height (WAH)" -> "WAH"
  const parenMatch = cleaned.match(/\(([A-Z0-9\s/&-]+)\)/i);
  if (parenMatch && parenMatch[1].length >= 2 && parenMatch[1].length <= 8) {
    return parenMatch[1].trim().toUpperCase();
  }

  // 2. Check normalized key in lookup map
  const normalizedKey = cleaned.toLowerCase().replace(/\s+/g, " ");
  if (COURSE_ABBREVIATION_MAP[normalizedKey]) {
    return COURSE_ABBREVIATION_MAP[normalizedKey];
  }

  // 3. If already very short and formatted as abbreviation (e.g. "R & S", "B & F", "WAH", "LOTO", "JB", "H2S")
  if (/^[A-Z0-9 &/-]{1,7}$/.test(cleaned)) {
    return cleaned;
  }

  // 4. Algorithmic fallback
  const processed = cleaned
    .replace(/\blevel\s*(\d+)\b/gi, "L$1")
    .replace(/\b(and)\b/gi, "&")
    .replace(/[-–—/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = processed.split(" ").filter(Boolean);

  if (tokens.length === 1) {
    return tokens[0];
  }

  const parts: string[] = [];
  let currentWordChunk = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "&") {
      if (currentWordChunk) {
        parts.push(currentWordChunk);
        currentWordChunk = "";
      }
      parts.push("&");
    } else if (/^L\d+$/i.test(token)) {
      if (currentWordChunk) {
        parts.push(currentWordChunk);
        currentWordChunk = "";
      }
      parts.push(token.toUpperCase());
    } else if (/^[A-Z0-9]{2,5}$/.test(token)) {
      if (currentWordChunk) {
        parts.push(currentWordChunk);
        currentWordChunk = "";
      }
      parts.push(token);
    } else {
      currentWordChunk += token.charAt(0).toUpperCase();
    }
  }

  if (currentWordChunk) {
    parts.push(currentWordChunk);
  }

  let result = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "&") {
      result += " & ";
    } else if (result.endsWith(" & ") || result === "") {
      result += part;
    } else {
      result += " " + part;
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Replaces the course name segment in a line item description
 * with its abbreviated short form.
 *
 * Supported formats:
 * - "5899 - Akhil Kavintekizhakkethil - Rigging and Slinging" -> "5899 - Akhil Kavintekizhakkethil - R & S"
 * - "Akhil Kavintekizhakkethil - Rigging & Slinging [Aqua Dynamic]" -> "Akhil Kavintekizhakkethil - R & S [Aqua Dynamic]"
 * - "5899 - Akhil Kavintekizhakkethil - R & S" -> "5899 - Akhil Kavintekizhakkethil - R & S"
 */
export function shortenCourseInDescription(
  desc: string,
  courseHint?: string,
): string {
  if (!desc) return "";

  // Extract trailing company bracket if present e.g. " [Aqua Dynamic]"
  let trailingComp = "";
  let coreDesc = desc.trim();
  const compMatch = coreDesc.match(/\s*\[(.*?)\]\s*$/);
  if (compMatch) {
    trailingComp = ` [${compMatch[1].trim()}]`;
    coreDesc = coreDesc.slice(0, compMatch.index).trim();
  }

  // If a known courseHint is supplied, check if description ends with it
  if (courseHint) {
    const trimmedHint = courseHint.trim();
    const shortCourse = getCourseShortName(trimmedHint);
    const lowerCore = coreDesc.toLowerCase();
    const lowerHint = trimmedHint.toLowerCase();

    if (lowerCore.endsWith(` - ${lowerHint}`)) {
      const idx = coreDesc.length - (trimmedHint.length + 3);
      return `${coreDesc.slice(0, idx)} - ${shortCourse}${trailingComp}`;
    } else if (lowerCore.endsWith(lowerHint)) {
      const idx = coreDesc.length - trimmedHint.length;
      return `${coreDesc.slice(0, idx)}${shortCourse}${trailingComp}`;
    }
  }

  // Parse by " - " delimiters
  const parts = coreDesc.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    // If 3+ parts: parts[0] = cert#, parts[1] = candidateName, parts[2...] = courseName
    // If 2 parts: parts[0] = candidateName, parts[1] = courseName
    const coursePart = parts.length >= 3 ? parts.slice(2).join(" - ") : parts[1];
    const shortCourse = getCourseShortName(coursePart);

    if (parts.length >= 3) {
      return `${parts[0]} - ${parts[1]} - ${shortCourse}${trailingComp}`;
    } else {
      return `${parts[0]} - ${shortCourse}${trailingComp}`;
    }
  }

  return desc;
}
