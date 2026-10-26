import * as XLSX from "xlsx";
import type { Certificate } from "../types/certificates.types";

function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "N/A";
  if (typeof dateStr === "string") {
    const trimmed = dateStr.trim();
    if (trimmed === "" || trimmed === "N/A") return "N/A";
    if (trimmed.match(/^\d{2}-[A-Za-z]{3}-\d{2,4}$/)) {
      return trimmed;
    }
    // Handle DD-MM-YYYY or DD/MM/YYYY
    if (trimmed.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
      const parts = trimmed.split(/[-/]/);
      const day = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const yr = parts[2].slice(-2);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = months[mIdx] || parts[1];
      return `${day}-${monthName}-${yr}`;
    }
    // Handle YYYY-MM-DD
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
      const datePart = trimmed.split("T")[0];
      const [year, month, day] = datePart.split("-");
      const mIdx = parseInt(month, 10) - 1;
      const yr = year.slice(-2);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = months[mIdx] || month;
      return `${day}-${monthName}-${yr}`;
    }
  }

  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (!d || isNaN(d.getTime())) return "N/A";

  // Use Intl DateTimeFormat with Asia/Dubai timezone for Date objects or ISO strings
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  return formatter.format(d).replace(/ /g, "-");
}

export function exportCertificatesToExcel(certificates: Certificate[], invoices: any[] = []) {
  const rows = certificates.map((cert) => {
    // Attempt to locate linked invoice from invoices array
    let linkedInvoice: any = null;
    let lineItemPrice = 0;
    let lineItemVat = 0;

    if (invoices && Array.isArray(invoices)) {
      for (const inv of invoices) {
        if (inv.lineItems && Array.isArray(inv.lineItems)) {
          const match = inv.lineItems.find(
            (li: any) =>
              li.certificateId === cert.id ||
              (cert.certificateNumber && li.description?.includes(cert.certificateNumber))
          );
          if (match) {
            linkedInvoice = inv;
            lineItemPrice = Number(match.unitPrice || match.lineSubtotal || 0);
            lineItemVat = Number(match.lineVat || lineItemPrice * 0.05);
            break;
          }
        }
      }
    }

    // Use certificateNumber if present; otherwise fallback to awardingBodyName or "N/A"
    const certNo = cert.certificateNumber || cert.awardingBodyName || "N/A";
    const regDate = formatDate(cert.regDate || cert.trainingRegDate || cert.issueDate);
    const candidate = cert.participantName ? cert.participantName.trim().toUpperCase() : "N/A";
    const client = cert.company || "N/A";
    const course = cert.course || "N/A";
    const mobile =
      cert.participantPhone ||
      (cert as any).participantPhone ||
      (cert as any).phone ||
      (cert as any).mobile ||
      (cert as any).training?.participantPhone ||
      "N/A";
    const issDate = formatDate(cert.issueDate || cert.trainingIssueDate || cert.regDate);
    const expDate = formatDate(cert.expiryDate);

    const invNo = linkedInvoice ? linkedInvoice.invoiceNumber : cert.invoiceIssued ? "INV-GEN" : "N/A";
    const invDate = linkedInvoice ? formatDate(linkedInvoice.date) : "N/A";

    const isShared =
      cert.status === "sent" ||
      cert.status === "distributed" ||
      cert.status === "printed" ||
      cert.invoiceIssued;
    const sharedText = isShared ? "YES" : "NO";

    const amount = lineItemPrice > 0 ? lineItemPrice : Number(cert.awardingBodyFee || 0);
    const vat5Percent = lineItemVat > 0 ? lineItemVat : Number((amount * 0.05).toFixed(2));
    const totalInclVat = Number((amount + vat5Percent).toFixed(2));

    const isPaid = linkedInvoice
      ? linkedInvoice.status === "paid" || Number(linkedInvoice.balance || 0) <= 0
      : false;

    return {
      "CERT. NO": certNo,
      "REG. DATE": regDate,
      CANDIDATE: candidate,
      CLIENT: client,
      COURSE: course,
      MOBILE: mobile,
      "ISS. DATE": issDate,
      "EXP. DATE": expDate,
      "INV. NO": invNo,
      "INV. DATE": invDate,
      SHARED: sharedText,
      "AMOUNT (AED)": amount,
      "VAT 5%": vat5Percent,
      "TOTAL (INC. VAT)": totalInclVat,
      PAID: isPaid ? "TRUE" : "FALSE",
    };
  });

  // Create sheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Apply bold header styles & dark background styling
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:O1");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (worksheet[address]) {
      worksheet[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E293B" } }, // Dark navy header fill
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  }

  // Set column widths for clean presentation
  const colWidths = [
    { wch: 14 }, // CERT. NO / Awarding Body
    { wch: 12 }, // REG. DATE
    { wch: 28 }, // CANDIDATE
    { wch: 20 }, // CLIENT
    { wch: 25 }, // COURSE
    { wch: 14 }, // MOBILE
    { wch: 12 }, // ISS. DATE
    { wch: 12 }, // EXP. DATE
    { wch: 14 }, // INV. NO
    { wch: 12 }, // INV. DATE
    { wch: 10 }, // SHARED
    { wch: 14 }, // AMOUNT
    { wch: 10 }, // VAT 5%
    { wch: 16 }, // TOTAL
    { wch: 8 },  // PAID
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Certificates Report");

  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `Certificates_Report_${todayStr}.xlsx`);
}
