import { NormalizedCertificateReportRow } from "./exportReportExcel";

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCertificatesReportToCsv(
  rows: NormalizedCertificateReportRow[],
  filenamePrefix = "Certificates_Report",
  selectedColumns?: string[]
) {
  const columnMap: Record<string, (r: NormalizedCertificateReportRow) => any> = {
    "CERT. NO": (r) => r.certNo,
    "REG. DATE": (r) => r.regDate,
    CANDIDATE: (r) => r.candidate,
    CLIENT: (r) => r.client,
    COURSE: (r) => r.course,
    "SERVICE TYPE": (r) => (r.serviceType === "inspection" ? "Inspection" : "Training"),
    MOBILE: (r) => r.mobile,
    "ISS. DATE": (r) => r.issDate,
    "EXP. DATE": (r) => r.expDate,
    "INV. NO": (r) => r.invNo,
    "INV. DATE": (r) => r.invDate,
    SHARED: (r) => r.shared,
    "AMOUNT (AED)": (r) => r.amount,
    "VAT 5%": (r) => r.vat5Percent,
    "TOTAL (AED)": (r) => r.totalInclVat,
    PAID: (r) => r.paid,
  };

  const defaultHeaders = [
    "CERT. NO",
    "REG. DATE",
    "CANDIDATE",
    "CLIENT",
    "COURSE",
    "SERVICE TYPE",
    "MOBILE",
    "ISS. DATE",
    "EXP. DATE",
    "INV. NO",
    "INV. DATE",
    "SHARED",
    "AMOUNT (AED)",
    "VAT 5%",
    "TOTAL (AED)",
    "PAID",
  ];

  const headers =
    selectedColumns && selectedColumns.length > 0
      ? selectedColumns
      : defaultHeaders;

  const csvRows: string[] = [];
  csvRows.push(headers.join(","));

  for (const r of rows) {
    const rowValues = headers.map((h) => {
      const getter = columnMap[h];
      const val = getter ? getter(r) : (r as any)[h];
      return escapeCsvValue(val);
    });
    csvRows.push(rowValues.join(","));
  }


  // Prepend UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const todayStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `${filenamePrefix}_${todayStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportGenericReportToCsv(
  headers: string[],
  rows: Record<string, any>[],
  filenamePrefix: string
) {
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));

  for (const row of rows) {
    const line = headers.map((h) => escapeCsvValue(row[h])).join(",");
    csvRows.push(line);
  }

  const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const todayStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `${filenamePrefix}_${todayStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
