import PizZip from "pizzip";
import { saveAs } from "file-saver";
import type { Certificate } from "../types/certificates.types";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

function numberToWords(num: number): string {
  const words: Record<number, string> = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    14: "fourteen",
    15: "fifteen",
  };
  return words[num] || String(num);
}

function parseCertDate(dStr: string): Date {
  if (!dStr) return new Date();
  if (dStr.includes("-")) {
    const parts = dStr.split("-").map(Number);
    if (parts[0] > 1000) return new Date(parts[0], parts[1] - 1, parts[2]);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  if (dStr.includes("/")) {
    const parts = dStr.split("/").map(Number);
    if (parts[0] > 1000) return new Date(parts[0], parts[1] - 1, parts[2]);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date();
}

function formatDurationDatesList(issueDateStr: string, durationDays: number = 3): string {
  const count = Math.max(1, durationDays || 3);
  const endDate = parseCertDate(issueDateStr);
  const formattedDates: string[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    formattedDates.push(`${dd}/${mm}`);
  }

  if (formattedDates.length === 1) return formattedDates[0];
  if (formattedDates.length === 2) return `${formattedDates[0]} and ${formattedDates[1]}`;

  const lastDate = formattedDates.pop();
  return `${formattedDates.join(", ")}, and ${lastDate}`;
}

export interface CertificateTypeItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  completionTextTemplate?: string;
  isSystemDefault?: boolean;
}

export const DEFAULT_CERTIFICATE_TYPES: CertificateTypeItem[] = [
  {
    id: "cert-type-specific",
    name: "Specific Certificate",
    code: "Specific",
    description: "Standard individual assessment certificate issued upon successful course completion.",
    completionTextTemplate: "has successfully completed the assessment/ training for",
    isSystemDefault: true,
  },
  {
    id: "cert-type-general",
    name: "General Certificate",
    code: "General",
    description: "Safety awareness certificate issued for standard general orientation modules.",
    completionTextTemplate: "has successfully completed the safety awareness training for",
    isSystemDefault: true,
  },
  {
    id: "cert-type-duration",
    name: "Duration Certificate",
    code: "Duration",
    description: "Multi-day training certificate including calculated training dates.",
    completionTextTemplate: "has successfully completed the {duration}-day training course held on {dates}.",
    isSystemDefault: true,
  },
  {
    id: "cert-type-license",
    name: "License Certificate",
    code: "License",
    description: "Driver assessment certificate including driving license number and vehicle category (e.g. LV, HV).",
    completionTextTemplate: "D.Lic# {licenseNo}({licenseType}) has successfully completed the assessment/ training for",
    isSystemDefault: true,
  },
];

export function mergeWithDefaultCertificateTypes(
  types?: CertificateTypeItem[] | null,
): CertificateTypeItem[] {
  if (!Array.isArray(types) || types.length === 0) {
    return DEFAULT_CERTIFICATE_TYPES;
  }
  const merged = [...types];
  for (const def of DEFAULT_CERTIFICATE_TYPES) {
    const exists = merged.some(
      (t) =>
        t.id === def.id ||
        t.code?.toLowerCase() === def.code?.toLowerCase() ||
        t.name?.toLowerCase() === def.name?.toLowerCase()
    );
    if (!exists) {
      merged.push(def);
    }
  }
  return merged;
}

export function getCertificateTypes(): CertificateTypeItem[] {
  const saved = localStorage.getItem("accreditos_certificate_types");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeWithDefaultCertificateTypes(parsed);
      }
    } catch (e) {
      console.error("Failed to parse certificate types from localStorage", e);
    }
  }
  return DEFAULT_CERTIFICATE_TYPES;
}

export function getCertificateCompletionText(
  cert: Certificate,
  customTypes?: CertificateTypeItem[]
): string {
  const typeCode = cert.certificateType || "Specific";
  const allTypes = customTypes && customTypes.length > 0 ? customTypes : getCertificateTypes();
  
  const matched = allTypes.find(
    (t) =>
      (t.id && t.id.toLowerCase() === typeCode.toLowerCase()) ||
      (t.code && t.code.toLowerCase() === typeCode.toLowerCase()) ||
      (t.name && t.name.toLowerCase() === typeCode.toLowerCase())
  );

  let rawText = matched?.completionTextTemplate;
  if (!rawText) {
    if (typeCode === "General") {
      rawText = "has successfully completed the safety awareness training for";
    } else if (typeCode === "Duration") {
      const days = cert.durationDays || 3;
      const durationWord = numberToWords(days);
      const datesList = formatDurationDatesList(cert.issueDate, days);
      rawText = `has successfully completed the ${durationWord}-day training course held on ${datesList}.`;
    } else if (typeCode === "License" || typeCode.toLowerCase().includes("licen")) {
      const licNo = cert.drivingLicenseNo || "";
      const licType = cert.drivingLicenseType ? `(${cert.drivingLicenseType})` : "";
      rawText = `D.Lic# ${licNo}${licType} has successfully completed the assessment/ training for`;
    } else {
      rawText = "has successfully completed the assessment/ training for";
    }
  }

  // Clean leading and trailing quotation marks
  let cleanText = rawText.trim().replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, "").trim();

  if (cleanText.includes("{duration}") || cleanText.includes("{dates}")) {
    const days = cert.durationDays || 3;
    const durationWord = numberToWords(days);
    const datesList = formatDurationDatesList(cert.issueDate, days);
    cleanText = cleanText.replace(/{duration}/g, durationWord).replace(/{dates}/g, datesList);
  }

  const licNo = cert.drivingLicenseNo || "";
  const licType = cert.drivingLicenseType || "";

  cleanText = cleanText
    .replace(/{licenseNo}/gi, licNo)
    .replace(/{drivingLicenseNo}/gi, licNo)
    .replace(/{licenseType}/gi, licType)
    .replace(/{drivingLicenseType}/gi, licType);

  if (!licType) {
    cleanText = cleanText.replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ");
  }

  return cleanText;
}

export function formatCertificateFilename(cert: Certificate, extension: "pdf" | "docx"): string {
  // 1. Certificate No part: AMC{certificate-no} (e.g. AMC5745)
  let rawCertNo = cert.certificateNumber || "";
  let digits = rawCertNo.replace(/\D/g, "");
  if (!digits) digits = "5745";
  const certNoPart = `AMC${digits}`;

  // 2. Client part: first two words of company name -> e.g. "Seven Days Manpower" -> "SevenDays"
  let rawClient = cert.customCompany?.trim() || cert.company || "Client";
  let words = rawClient.trim().split(/\s+/).slice(0, 2);
  let cleanClient = words
    .map((w) => w.replace(/\b(L\.?L\.?C\.?|INC\.?|LTD\.?|CO\.?)\b/gi, "").trim())
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
  if (!cleanClient) cleanClient = "Client";

  // 3. Participant First Name part: {ParticipantNameFirstpart} -> e.g. "Roshan Kumar" -> "Roshan"
  let rawName = cert.participantName || "Participant";
  let firstName = rawName.trim().split(/\s+/)[0] || "Participant";
  firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  // 4. Course Name part: Full Course Name -> e.g. "Welding Safety" -> "WeldingSafety"
  let rawCourse = cert.course || "Course";
  let cleanCourse = rawCourse
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
  if (!cleanCourse) cleanCourse = "Course";

  return `${certNoPart}-${cleanClient}-${firstName}-${cleanCourse}.${extension}`;
}

export function isTatweerCertificate(cert: Certificate): boolean {
  if (!cert.awardingBodyName) return true;
  const name = cert.awardingBodyName.toLowerCase();
  if (name.includes("tatweer") || name.includes("tct")) return true;
  return Boolean(cert.certificateNumber && cert.certificateNumber.startsWith("TCT"));
}

let cachedWordTemplatePromise: Promise<ArrayBuffer> | null = null;

export async function loadWordCertificateTemplate(): Promise<ArrayBuffer> {
  if (!cachedWordTemplatePromise) {
    cachedWordTemplatePromise = fetch("/assets/template_certificate.docx")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load Tatweer certificate template document.");
        }
        return res.arrayBuffer();
      })
      .catch((err) => {
        cachedWordTemplatePromise = null;
        throw err;
      });
  }
  return cachedWordTemplatePromise;
}

export async function generateWordCertificateBlob(
  cert: Certificate,
  customTemplateContent?: ArrayBuffer,
): Promise<{ blob: Blob; filename: string }> {
  try {
    // 1. Fetch template from public assets if not provided (cached in memory)
    const content = customTemplateContent || (await loadWordCertificateTemplate());

    // 2. Load zip buffer with PizZip
    const zip = new PizZip(content);

    // 3. Extract document.xml text
    let docXml = zip.files["word/document.xml"].asText();

    // Values formatted according to user specifications:
    const customComp = cert.customCompany?.trim();
    const hasCustomCompany = Boolean(customComp);
    const isIndividual =
      (!cert.company ||
        cert.company === "Individual Candidate" ||
        cert.company === "Individual" ||
        cert.company === "N/A") &&
      !hasCustomCompany;
    const rawCandidateName = toTitleCase(
      cert.participantName || "Participant Name",
    );
    const rawCourseTitle = cert.course || "Training Course";
    const rawCompanyName = isIndividual
      ? ""
      : (hasCustomCompany ? customComp! : cert.company || "").toUpperCase();
    const rawCertNumber = cert.certificateNumber || "TCT-5005-AC";
    const rawIssueDate = cert.issueDate || "01-07-2026";
    const rawExpiryDate = cert.expiryDate || "30-06-2027";
    const rawCompletionText = getCertificateCompletionText(cert);

    const candidateName = escapeXml(rawCandidateName);
    const courseTitle = escapeXml(rawCourseTitle);
    const companyName = escapeXml(rawCompanyName);
    const certNumber = escapeXml(rawCertNumber);
    const issueDate = escapeXml(rawIssueDate);
    const expiryDate = escapeXml(rawExpiryDate);
    const completionText = escapeXml(rawCompletionText);

    // A. Replace Participant Name, Course Name, Company Name & Dynamic Completion Text
    docXml = docXml
      .replace(/Participant Name/gi, candidateName)
      .replace(/Course Name/gi, courseTitle)
      .replace(
        /Company:\s*COMPANY NAME/gi,
        isIndividual ? "" : `Company: ${companyName}`,
      )
      .replace(/COMPANY NAME/gi, companyName)
      .replace(
        /has successfully completed the assessment\/training for/gi,
        completionText,
      );

    docXml = docXml.replace(
      /<w:t[^>]*>TCT-<\/w:t>[\s\S]*?<w:t[^>]*>\*{4}<\/w:t>[\s\S]*?<w:t[^>]*>-<\/w:t>[\s\S]*?<w:t[^>]*>AC<\/w:t>/gi,
      `<w:t>${certNumber}</w:t>`,
    );
    docXml = docXml
      .replace(/TCT-5738-AC/gi, certNumber)
      .replace(/TCT-5005-AC/gi, certNumber);

    const valIndex = docXml.indexOf("Certificate Validity:");
    if (valIndex !== -1) {
      let part1 = docXml.substring(0, valIndex);
      let part2 = docXml.substring(valIndex);

      part1 = part1.replace(
        /<w:t[^>]*>00<\/w:t>[\s\S]*?<w:t[^>]*>-<\/w:t>[\s\S]*?<w:t[^>]*>0<\/w:t>[\s\S]*?<w:t[^>]*>0<\/w:t>[\s\S]*?<w:t[^>]*>-<\/w:t>[\s\S]*?<w:t[^>]*>00<\/w:t>/gi,
        `<w:t>${issueDate}</w:t>`,
      );
      part1 = part1.replace(/22-07-2026/g, issueDate);

      part2 = part2.replace(
        /<w:t[^>]*>00<\/w:t>[\s\S]*?<w:t[^>]*>-<\/w:t>[\s\S]*?<w:t[^>]*>00<\/w:t>[\s\S]*?<w:t[^>]*>-<\/w:t>[\s\S]*?<w:t[^>]*>00<\/w:t>/gi,
        `<w:t>${expiryDate}</w:t>`,
      );
      part2 = part2.replace(/21-07-2027/g, expiryDate);

      docXml = part1 + part2;
    } else {
      docXml = docXml
        .replace(/22-07-2026/g, issueDate)
        .replace(/21-07-2027/g, expiryDate);
    }

    zip.file("word/document.xml", docXml);

    const outBlob = zip.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const filename = formatCertificateFilename(cert, "docx");
    return { blob: outBlob, filename };
  } catch (err: any) {
    console.error("Error generating Word certificate blob:", err);
    throw err;
  }
}

export async function generateWordCertificate(
  cert: Certificate,
): Promise<void> {
  const { blob, filename } = await generateWordCertificateBlob(cert);
  saveAs(blob, filename);
}

