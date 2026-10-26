import type { Invoice, Receipt, Expense } from "../types/billing.types";
import html2canvas from "html2canvas";
export {
  getCourseShortName,
  shortenCourseInDescription,
  COURSE_ABBREVIATION_MAP,
} from "./course-abbreviation";
import { shortenCourseInDescription } from "./course-abbreviation";

export interface InvoiceItem {
  no: number;
  description: string;
  qty: number;
  unitPrice: number;
  grossAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export function convertAmountToWords(amount: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = ["", "Thousand", "Million", "Billion"];

  function convertGroup(num: number): string {
    let result = "";
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      result += ones[num] + " ";
    }
    return result.trim();
  }

  if (amount === 0) return "Zero Only";

  const parts = amount.toFixed(2).split(".");
  const dhs = parseInt(parts[0], 10);
  const fils = parseInt(parts[1], 10);

  let dhsWords = "";
  let tempDhs = dhs;
  let scaleIndex = 0;

  if (dhs === 0) {
    dhsWords = "Zero";
  } else {
    while (tempDhs > 0) {
      const group = tempDhs % 1000;
      if (group > 0) {
        const groupWords = convertGroup(group);
        dhsWords =
          groupWords +
          (scales[scaleIndex] ? " " + scales[scaleIndex] : "") +
          " " +
          dhsWords;
      }
      tempDhs = Math.floor(tempDhs / 1000);
      scaleIndex++;
    }
    dhsWords = dhsWords.trim();
  }

  let filsWords = "";
  if (fils > 0) {
    filsWords = " and Fils " + convertGroup(fils);
  }

  return `${dhsWords}${filsWords} Only`;
}

export const amountToWords = convertAmountToWords;

export function printElement(elementId: string) {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;

  try {
    const printWindow = window.open(
      "",
      "_blank",
      "left=50,top=50,width=900,height=950,toolbar=0,scrollbars=1,status=0",
    );

    if (!printWindow) return;

    // Collect all stylesheets and style tags from current document
    let stylesHtml = "";
    const styleElements = document.querySelectorAll("style, link[rel='stylesheet']");
    styleElements.forEach((el) => {
      stylesHtml += el.outerHTML;
    });

    const clonedNode = printContent.cloneNode(true) as HTMLElement;
    clonedNode.style.boxShadow = "none";
    clonedNode.style.margin = "0 auto";
    clonedNode.style.width = "100%";
    clonedNode.style.minWidth = "0";
    clonedNode.style.maxWidth = "100%";

    // Check if the document fits on a single page (<= 8 table rows)
    const tableRows = clonedNode.querySelectorAll("tbody tr");
    const isSinglePage = tableRows.length <= 8;

    if (isSinglePage) {
      clonedNode.style.height = "100%";
      clonedNode.style.minHeight = "100%";
      clonedNode.style.maxHeight = "100%";
      clonedNode.style.display = "flex";
      clonedNode.style.flexDirection = "column";
      clonedNode.style.justifyContent = "space-between";
      clonedNode.style.overflow = "hidden";
    } else {
      clonedNode.style.height = "auto";
      clonedNode.style.minHeight = "0";
      clonedNode.style.maxHeight = "none";
      clonedNode.classList.remove("justify-between");
      clonedNode.querySelectorAll(".flex-1").forEach((el) => {
        if (el.parentElement === clonedNode || el.classList.contains("flex-col")) {
          el.classList.remove("flex-1");
        }
      });
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en" class="${isSinglePage ? "single-page" : "multi-page"}">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Print Document</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          ${stylesHtml}
          <style>
            @page {
              margin: 8mm 12mm 10mm 12mm;
            }
            *, *:before, *:after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif !important;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            html.single-page,
            html.single-page body {
              height: 100% !important;
              min-height: 100% !important;
              max-height: 100% !important;
              overflow: hidden !important;
            }
            .print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            html.single-page .print-container {
              height: 100% !important;
              min-height: 100% !important;
              max-height: 100% !important;
              overflow: hidden !important;
            }
            #${elementId} {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
            }
            #invoice-print-area,
            #receipt-voucher-print-area {
              border: 2px solid #004ba0 !important;
            }
            #quotation-print-area,
            #client-soa-print-area {
              border: 1px solid #cbd5e1 !important;
            }
            html.single-page #${elementId} {
              height: 100% !important;
              min-height: 100% !important;
              max-height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
            }
            html.single-page #${elementId} > div:first-child {
              flex: 1 1 0% !important;
              display: flex !important;
              flex-direction: column !important;
              min-height: 0 !important;
            }
            html.single-page #${elementId} > div:last-child {
              flex-shrink: 0 !important;
            }
            @media print {
              @page {
                margin: 8mm 12mm 10mm 12mm;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              html.single-page,
              html.single-page body {
                height: 100% !important;
                max-height: 100% !important;
                min-height: 100% !important;
                overflow: hidden !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              html.single-page .print-container {
                height: 100% !important;
                max-height: 100% !important;
                min-height: 100% !important;
                overflow: hidden !important;
              }
              #${elementId} {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 0 !important;
                box-shadow: none !important;
                margin: 0 auto !important;
              }
              #invoice-print-area,
              #receipt-voucher-print-area {
                border: 2px solid #004ba0 !important;
              }
              #quotation-print-area,
              #client-soa-print-area {
                border: 1px solid #cbd5e1 !important;
              }
              html.single-page #${elementId} {
                height: 100% !important;
                max-height: 100% !important;
                min-height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                overflow: hidden !important;
              }
              html.single-page #${elementId} > div:first-child {
                flex: 1 1 0% !important;
                display: flex !important;
                flex-direction: column !important;
                min-height: 0 !important;
              }
              html.single-page #${elementId} > div:last-child {
                flex-shrink: 0 !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              thead {
                display: table-header-group !important;
              }
              tfoot {
                display: table-footer-group !important;
              }
              img {
                max-width: 100% !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${clonedNode.outerHTML}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 350);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error("Print error:", err);
  }
}

export function formatInvoiceDescription(
  desc: string,
  cert?: any,
  options?: { showAwardingBody?: boolean },
): string {
  if (!desc) return "";
  let result = desc
    // Replace [#TCT-5899-AC] or [TCT-5899-AC] or [#5899] or [5899] with 5899 -
    .replace(/\[#?(?:TCT-)?(\d+)(?:-AC)?\]\s*(?:-\s*)?/gi, "$1 - ")
    // Replace #TCT-5899-AC or TCT-5899-AC with 5899 -
    .replace(/#?TCT-(\d+)-AC\s*(?:-\s*)?/gi, "$1 - ")
    .trim();
  result = result.replace(/\s*-\s*$/, "");

  // If cert details are available:
  const certNum = cert?.certificateNumber
    ? cert.certificateNumber.match(/\d+/)?.[0] || cert.certificateNumber
    : null;

  const body = (
    cert?.awardingBody?.name ||
    cert?.awardingBodyName ||
    cert?.awardingBody ||
    ""
  ).trim();

  // Strip awarding body name if present at the start (e.g., "Arbrit - ", "ICRQ - ")
  if (body && result.toLowerCase().startsWith(`${body.toLowerCase()} - `)) {
    result = result.slice(body.length + 3).trim();
  }

  // Also strip any known awarding body prefixes if stored historically
  result = result.replace(/^(?:arbrit|icrq|highfield|tuv|oshacademy)\s*-\s*/i, "");

  // Only prefix if a certificate number exists and isn't already present
  if (certNum) {
    const hasCertPrefix = result.startsWith(`${certNum} - `) || result.startsWith(`#${certNum}`);
    if (!hasCertPrefix) {
      result = `${certNum} - ${result}`;
    }
  }

  // Shorten course name in description (e.g., "Rigging and Slinging" -> "R & S")
  const courseHint = cert?.course?.name || cert?.courseName || cert?.course;
  result = shortenCourseInDescription(result, courseHint);

  // If user requested to include awarding body (e.g., on PDF preview toggle):
  if (options?.showAwardingBody && body && body.toLowerCase() !== "general") {
    const isTatweer =
      body.toLowerCase().includes("tatweer") || body.toLowerCase().includes("tct");
    // Only prefix awarding body if it's not Tatweer with an already-prefixed cert number
    if (!isTatweer || !certNum) {
      if (!result.toLowerCase().startsWith(`${body.toLowerCase()} - `)) {
        result = `${body} - ${result}`;
      }
    }
  }

  return result;
}

export function getInvoiceClientDisplayName(invoice: Invoice): string {
  if (!invoice) return "";

  const rawClient = invoice.client || invoice.clientName || "";
  const isIndividual =
    !rawClient ||
    rawClient.trim().toLowerCase() === "individual candidate" ||
    rawClient.trim().toLowerCase() === "individual";

  if (!isIndividual) {
    return rawClient;
  }

  // 1. Check invoice.clientName if valid candidate name
  if (
    invoice.clientName &&
    invoice.clientName.trim() &&
    invoice.clientName.trim().toLowerCase() !== "individual candidate"
  ) {
    return invoice.clientName.trim();
  }

  // 2. Check referenceContact
  if (
    invoice.referenceContact &&
    invoice.referenceContact.trim() &&
    invoice.referenceContact.trim().toLowerCase() !== "individual candidate" &&
    invoice.referenceContact.trim().toLowerCase() !== "n/a"
  ) {
    return invoice.referenceContact.trim();
  }

  // 3. Try from line items
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    for (const li of invoice.lineItems) {
      if ((li as any).certificate?.participantName) {
        return (li as any).certificate.participantName.trim();
      }
      if (li.description) {
        const clean = li.description
          .replace(/^\[#?(?:TCT-)?\d+(?:-AC)?\]\s*(?:-\s*)?/i, "")
          .replace(/^#?TCT-\d+-AC\s*(?:-\s*)?/i, "")
          .replace(/^\d+\s*-\s*/, "")
          .trim();
        const parts = clean.split(/\s+-\s+/);
        const candidateName = parts.length >= 3 ? parts[1] : parts[0];
        if (
          candidateName &&
          candidateName.trim() &&
          candidateName.trim().toLowerCase() !== "individual candidate"
        ) {
          return candidateName.trim();
        }
      }
    }
  }

  // 4. Try from invoice description
  if (invoice.description) {
    const clean = invoice.description
      .replace(/^Invoice for (?:Training|Inspection) Services\s*-\s*/i, "")
      .replace(/^\[#?(?:TCT-)?\d+(?:-AC)?\]\s*(?:-\s*)?/i, "")
      .replace(/^#?TCT-\d+-AC\s*(?:-\s*)?/i, "")
      .replace(/^\d+\s*-\s*/, "")
      .trim();
    const parts = clean.split(/\s+-\s+/);
    const candidateName = parts.length >= 3 ? parts[1] : parts[0];
    if (
      candidateName &&
      candidateName.trim() &&
      candidateName.trim().toLowerCase() !== "individual candidate"
    ) {
      return candidateName.trim();
    }
  }

  return rawClient || "Individual Candidate";
}

export type InvoiceItemGrouping = "itemized" | "course" | "participant";

export interface GetInvoiceItemsOptions {
  showAwardingBody?: boolean;
  groupBy?: InvoiceItemGrouping;
}

export interface ParsedLineInfo {
  certNo?: string;
  participantName: string;
  courseName: string;
  awardingBody?: string;
}

export function parseLineItemDescription(
  desc: string,
  certObj?: any,
): ParsedLineInfo {
  const participantFromCert =
    certObj?.participantName || certObj?.candidateName;
  const courseFromCert =
    certObj?.course?.name || certObj?.courseName || certObj?.course;
  const awardingBodyFromCert =
    certObj?.awardingBody?.name ||
    certObj?.awardingBodyName ||
    certObj?.awardingBody;
  const certNoFromCert = certObj?.certificateNumber;

  let cleaned = (desc || "").trim();
  // Strip custom company in brackets if present, e.g. " [Aqua Dynamic]"
  cleaned = cleaned.replace(/\s*\[.*?\]\s*$/, "").trim();

  // Typical formats:
  // "6071 - Akhil Kavintekizhakkethil - Lifting Equipment & Accessories Training"
  // "#TCT-6071-AC Akhil Kavintekizhakkethil - Lifting Equipment & Accessories Training"
  // "Akhil Kavintekizhakkethil - Lifting Equipment & Accessories Training"
  const parts = cleaned
    .split(/\s*-\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  let certNo = certNoFromCert || "";
  let participantName = participantFromCert || "";
  let courseName = courseFromCert || "";

  if (!participantName || !courseName) {
    if (parts.length >= 3) {
      if (!certNo) certNo = parts[0].replace(/^[#\[\]]/g, "");
      if (!participantName) participantName = parts[1];
      if (!courseName) courseName = parts.slice(2).join(" - ");
    } else if (parts.length === 2) {
      if (!participantName) participantName = parts[0];
      if (!courseName) courseName = parts[1];
    } else if (parts.length === 1) {
      if (!courseName) courseName = parts[0];
    }
  }

  return {
    certNo: certNo
      ? String(certNo).match(/\d+/)?.[0] || String(certNo)
      : undefined,
    participantName: participantName || "General Candidate",
    courseName: courseName || "Training Course",
    awardingBody: awardingBodyFromCert || undefined,
  };
}

export function getInvoiceItems(
  invoice: Invoice,
  options?: GetInvoiceItemsOptions,
): InvoiceItem[] {
  const groupBy = options?.groupBy || "itemized";

  if (invoice.lineItems && invoice.lineItems.length > 0) {
    if (groupBy === "course") {
      const map = new Map<
        string,
        {
          courseName: string;
          awardingBody?: string;
          qty: number;
          grossAmount: number;
          vatAmount: number;
          totalAmount: number;
          unitPrice: number;
          delegates: Set<string>;
        }
      >();

      for (const li of invoice.lineItems) {
        const certObj = (li as any).certificate || (li as any).training;
        const parsed = parseLineItemDescription(li.description, certObj);
        const key = parsed.courseName.toLowerCase();

        let group = map.get(key);
        if (!group) {
          group = {
            courseName: parsed.courseName,
            awardingBody: parsed.awardingBody,
            qty: 0,
            grossAmount: 0,
            vatAmount: 0,
            totalAmount: 0,
            unitPrice: Number(li.unitPrice || 0),
            delegates: new Set(),
          };
          map.set(key, group);
        }
        group.qty += Number(li.quantity || 1);
        group.grossAmount += Number(li.lineSubtotal || 0);
        group.vatAmount += Number(li.lineVat || 0);
        group.totalAmount += Number(li.lineTotal || 0);
        if (
          parsed.participantName &&
          parsed.participantName !== "General Candidate"
        ) {
          group.delegates.add(parsed.participantName);
        }
      }

      const result: InvoiceItem[] = [];
      let idx = 1;
      for (const group of map.values()) {
        const delegateCount =
          group.delegates.size > 0 ? group.delegates.size : group.qty;
        let desc = group.courseName;
        if (
          options?.showAwardingBody &&
          group.awardingBody &&
          group.awardingBody.toLowerCase() !== "general"
        ) {
          desc += ` (${group.awardingBody})`;
        }
        if (delegateCount > 1) {
          desc += ` — ${delegateCount} Delegates`;
        }

        result.push({
          no: idx++,
          description: desc,
          qty: group.qty,
          unitPrice:
            group.qty > 0
              ? Number((group.grossAmount / group.qty).toFixed(2))
              : group.unitPrice,
          grossAmount: Number(group.grossAmount.toFixed(2)),
          vatAmount: Number(group.vatAmount.toFixed(2)),
          totalAmount: Number(group.totalAmount.toFixed(2)),
        });
      }
      return result;
    }

    if (groupBy === "participant") {
      const map = new Map<
        string,
        {
          participantName: string;
          courses: Set<string>;
          qty: number;
          grossAmount: number;
          vatAmount: number;
          totalAmount: number;
          unitPrice: number;
        }
      >();

      for (const li of invoice.lineItems) {
        const certObj = (li as any).certificate || (li as any).training;
        const parsed = parseLineItemDescription(li.description, certObj);
        const key = parsed.participantName.toLowerCase();

        let group = map.get(key);
        if (!group) {
          group = {
            participantName: parsed.participantName,
            courses: new Set(),
            qty: 0,
            grossAmount: 0,
            vatAmount: 0,
            totalAmount: 0,
            unitPrice: Number(li.unitPrice || 0),
          };
          map.set(key, group);
        }
        group.qty += Number(li.quantity || 1);
        group.grossAmount += Number(li.lineSubtotal || 0);
        group.vatAmount += Number(li.lineVat || 0);
        group.totalAmount += Number(li.lineTotal || 0);
        if (parsed.courseName) {
          group.courses.add(parsed.courseName);
        }
      }

      const result: InvoiceItem[] = [];
      let idx = 1;
      for (const group of map.values()) {
        const courseCount = group.courses.size;
        const desc =
          courseCount > 1
            ? `${group.participantName} (${courseCount} Courses Training Program)`
            : `${group.participantName} — ${Array.from(group.courses)[0] || "Training"}`;

        result.push({
          no: idx++,
          description: desc,
          qty: group.qty,
          unitPrice:
            group.qty > 0
              ? Number((group.grossAmount / group.qty).toFixed(2))
              : group.unitPrice,
          grossAmount: Number(group.grossAmount.toFixed(2)),
          vatAmount: Number(group.vatAmount.toFixed(2)),
          totalAmount: Number(group.totalAmount.toFixed(2)),
        });
      }
      return result;
    }

    // Default itemized mode
    return invoice.lineItems.map((li, index) => {
      const certObj = (li as any).certificate || (li as any).training;
      return {
        no: index + 1,
        description: formatInvoiceDescription(li.description, certObj, options),
        qty: li.quantity,
        unitPrice: li.unitPrice,
        grossAmount: li.lineSubtotal,
        vatAmount: li.lineVat,
        totalAmount: li.lineTotal,
      };
    });
  }

  const desc = invoice.description || "";
  const segments = desc
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isStructured =
    segments.length > 0 && segments.every((s) => s.startsWith("#"));

  if (!isStructured) {
    return [
      {
        no: 1,
        description: desc || "Training Services",
        qty: 1,
        unitPrice: invoice.subtotal,
        grossAmount: invoice.subtotal,
        vatAmount: invoice.vatAmount,
        totalAmount: invoice.totalAmount,
      },
    ];
  }

  const items: InvoiceItem[] = [];
  let remainingAmount = invoice.subtotal;
  let remainingVat = invoice.vatAmount;

  const parsedSegments = segments.map((seg, idx) => {
    const match = seg.match(/^#([^\s]+)\s+([^(]+)(?:\(([^)]+)\))?/);
    let certNo = "";
    let name = "";
    let course = "";
    if (match) {
      certNo = match[1].trim();
      name = match[2].trim();
      course = match[3] ? match[3].trim() : "";
    } else {
      name = seg.replace(/^#/, "").trim();
    }

    let price = 0;
    const lowerCourse = course.toLowerCase();
    if (lowerCourse.includes("flagman")) {
      price = 85;
    } else if (lowerCourse.includes("lifting supervisor")) {
      price = 145;
    } else if (lowerCourse.includes("first aid")) {
      price = 105;
    }

    return {
      no: idx + 1,
      certNo,
      name,
      course,
      estimatedPrice: price,
      raw: seg,
    };
  });

  const knownSum = parsedSegments.reduce((sum, s) => sum + s.estimatedPrice, 0);
  const unpricedCount = parsedSegments.filter(
    (s) => s.estimatedPrice === 0,
  ).length;

  let basePrice = 0;
  if (unpricedCount > 0) {
    basePrice = Math.max(0, remainingAmount - knownSum) / unpricedCount;
  }

  parsedSegments.forEach((p, idx) => {
    let uPrice = p.estimatedPrice;
    if (uPrice === 0) {
      uPrice = basePrice;
    }

    if (idx === parsedSegments.length - 1) {
      uPrice = remainingAmount;
    } else {
      remainingAmount -= uPrice;
    }

    const vat = Math.round(uPrice * 0.05 * 100) / 100;
    let finalVat = vat;
    if (idx === parsedSegments.length - 1) {
      finalVat = remainingVat;
    } else {
      remainingVat -= finalVat;
    }

    let displayDesc = p.raw;
    if (p.certNo && p.name) {
      const cleanNo = p.certNo.replace(/^#?TCT-/i, "").replace(/-AC$/i, "");
      displayDesc = `${cleanNo} - ${p.name}${p.course ? ` - ${p.course}` : ""}`;
    }

    items.push({
      no: p.no,
      description: formatInvoiceDescription(displayDesc),
      qty: 1,
      unitPrice: Math.round(uPrice * 100) / 100,
      grossAmount: Math.round(uPrice * 100) / 100,
      vatAmount: Math.round(finalVat * 100) / 100,
      totalAmount: Math.round((uPrice + finalVat) * 100) / 100,
    });
  });

  return items;
}

export function formatContact(contactStr: string | null | undefined): string {
  if (!contactStr) return "—";
  try {
    const parsed = JSON.parse(contactStr);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return "—";
      const first = parsed[0];
      if (typeof first === "object" && first !== null) {
        const name = first.name || "";
        const phone = first.phone || "";
        return phone ? `${name} - ${phone}` : name || "—";
      }
      return String(first);
    } else if (typeof parsed === "object" && parsed !== null) {
      const name = parsed.name || "";
      const phone = parsed.phone || "";
      return phone ? `${name} - ${phone}` : name || "—";
    }
  } catch (e) {
    // Fail silently and return original string
  }
  return contactStr;
}

export function formatDateDDMMYYYY(dateStr?: string | Date | null): string {
  if (!dateStr) return "—";
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return "—";
    const dy = String(dateStr.getDate()).padStart(2, "0");
    const mo = String(dateStr.getMonth() + 1).padStart(2, "0");
    const yr = dateStr.getFullYear();
    return `${dy}-${mo}-${yr}`;
  }
  const str = String(dateStr).trim();
  if (!str) return "—";

  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const dy = String(d.getDate()).padStart(2, "0");
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const yr = d.getFullYear();
      return `${dy}-${mo}-${yr}`;
    }
  }

  const parts = str.split(/[-/]/).map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    if (String(parts[0]).length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      const [yr, mo, dy] = parts;
      return `${String(dy).padStart(2, "0")}-${String(mo).padStart(2, "0")}-${yr}`;
    } else {
      // DD-MM-YYYY
      const [dy, mo, yr] = parts;
      return `${String(dy).padStart(2, "0")}-${String(mo).padStart(2, "0")}-${yr}`;
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const dy = String(d.getDate()).padStart(2, "0");
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    return `${dy}-${mo}-${yr}`;
  }
  return str;
}

export function formatDateToDDMMYYYY(date?: Date | null): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  const dy = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const yr = date.getFullYear();
  return `${dy}-${mo}-${yr}`;
}

export function parseDateFromDDMMYYYY(dateStr?: string | Date | null): Date | undefined {
  if (!dateStr) return undefined;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? undefined : dateStr;
  }
  const str = String(dateStr).trim();
  if (!str) return undefined;

  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  const parts = str.split(/[-/]/).map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    if (String(parts[0]).length === 4) {
      // YYYY-MM-DD
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) return d;
    } else if (String(parts[2]).length === 4) {
      // DD-MM-YYYY
      const d = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

export function extractUrlsAndCleanText(text?: string | null): { urls: string[]; cleanText: string } {
  if (!text) return { urls: [], cleanText: "" };
  const raw = String(text);
  const matched = raw.match(/https?:\/\/[^\s]+/g) || [];
  const urls = matched.map((u) => u.replace(/[)\].,;]+$/, ""));
  let cleanText = raw
    .replace(/https?:\/\/[^\s]+/g, "")
    .replace(/^\s*(INVOICE|OFFICIAL INVOICE|RECEIPT|ATTACHED|ATTACHMENT|ATTACHMENTS|LINK|URL|DOC|PROOF|PROOF OF PAYMENT|SLIP|DOCUMENT|REMARKS|NOTES):\s*/i, "")
    .replace(/:\s*$/, "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  return { urls, cleanText };
}

/**
 * Determines whether an expense is editable.
 * Rules:
 * 1. Super Admin can always edit.
 * 2. Reimbursed expenses (status === "returned") are permanently locked to preserve settlement audit trails.
 * 3. Direct company expenses (status === "paid" or paidByType === "company") can only be edited within 24 hours of creation.
 * 4. Employee out-of-pocket expenses (paidByType === "employee") can be edited while pending reimbursement ("not_returned") up to 7 days.
 */
export function isExpenseEditable(
  expense: Expense,
  isSuperAdmin = false,
  graceHours = 24
): { canEdit: boolean; reason?: string } {
  if (isSuperAdmin) {
    return { canEdit: true };
  }

  // Already returned / reimbursed to employee is strictly locked
  if (expense.status === "returned") {
    return {
      canEdit: false,
      reason: "This expense has already been reimbursed and settled. It cannot be edited.",
    };
  }

  // Check creation timestamp or date for time lock
  let createdTime: number | undefined;
  if (expense.createdAt) {
    const t = new Date(expense.createdAt).getTime();
    if (!isNaN(t)) createdTime = t;
  }
  if (!createdTime && expense.date) {
    const parsed = parseDateFromDDMMYYYY(expense.date);
    if (parsed) createdTime = parsed.getTime();
  }

  if (createdTime) {
    const hoursSinceCreation = (Date.now() - createdTime) / (1000 * 60 * 60);

    // Company direct expense: 24h grace window to fix typos
    if (expense.paidByType === "company" || expense.status === "paid") {
      if (hoursSinceCreation > graceHours) {
        return {
          canEdit: false,
          reason: `Direct company expenses are locked after ${graceHours} hours. Contact Super Admin for adjustments.`,
        };
      }
    } else if (expense.paidByType === "employee") {
      // Employee out-of-pocket: allowed up to 7 days while pending reimbursement
      if (hoursSinceCreation > 7 * 24) {
        return {
          canEdit: false,
          reason: "Expense claims older than 7 days are locked. Contact Super Admin for adjustments.",
        };
      }
    }
  }

  return { canEdit: true };
}

