import * as XLSX from "xlsx";

export interface NormalizedCertificateReportRow {
  certificateId: string;
  certNo: string;
  regDate: string;
  candidate: string;
  client: string;
  course: string;
  serviceType?: string;
  mobile: string;
  issDate: string;
  expDate: string;
  invNo: string;
  invDate: string;
  shared: string;
  amount: number;
  vat5Percent: number;
  totalInclVat: number;
  paid: string;
  status: string;
  certificateType: string;
  awardingBodyName: string;
}

export function exportCertificatesReportToExcel(
  rows: NormalizedCertificateReportRow[],
  filenamePrefix = "Certificates_Report",
  selectedColumns?: string[]
) {
  // Map normalized certificate rows to full property map matching EXACT table headers
  const fullRows = rows.map((r) => ({
    "CERT. NO": r.certNo || "N/A",
    "REG. DATE": r.regDate || "N/A",
    CANDIDATE: r.candidate || "N/A",
    CLIENT: r.client || "N/A",
    COURSE: r.course || "N/A",
    "SERVICE TYPE": r.serviceType === "inspection" ? "Inspection" : "Training",
    MOBILE: r.mobile || "N/A",
    "ISS. DATE": r.issDate || "N/A",
    "EXP. DATE": r.expDate || "N/A",
    "INV. NO": r.invNo || "N/A",
    "INV. DATE": r.invDate || "N/A",
    SHARED: r.shared || "No",
    "AMOUNT (AED)": Number(r.amount || 0),
    "VAT 5%": Number(r.vat5Percent || 0),
    "TOTAL (AED)": Number(r.totalInclVat || 0),
    PAID: r.paid || "No",
  }));

  const defaultKeys = [
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

  const columnsToExport =
    selectedColumns && selectedColumns.length > 0
      ? selectedColumns
      : defaultKeys;

  exportCustomReportToExcel(
    "Certificates Report",
    fullRows,
    columnsToExport,
    filenamePrefix
  );
}

export function exportCustomReportToExcel(
  sheetName: string,
  rows: Record<string, any>[],
  selectedColumnKeys: string[],
  filenamePrefix: string
) {
  // Filter row keys strictly by selectedColumnKeys in the exact order requested
  const filteredRows = rows.map((row) => {
    const item: Record<string, any> = {};
    for (const key of selectedColumnKeys) {
      item[key] = row[key] !== undefined && row[key] !== null ? row[key] : "";
    }
    return item;
  });

  const worksheet = XLSX.utils.json_to_sheet(filteredRows, {
    header: selectedColumnKeys,
  });

  // Apply high-contrast dark navy header styles
  if (worksheet["!ref"]) {
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
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
  }

  // Calculate dynamic column widths based on header and cell content length
  worksheet["!cols"] = selectedColumnKeys.map((colKey) => {
    let maxLen = colKey.length;
    for (let i = 0; i < Math.min(filteredRows.length, 60); i++) {
      const val = filteredRows[i][colKey];
      const len = val !== null && val !== undefined ? String(val).length : 0;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${todayStr}.xlsx`);
}

export function exportGenericReportToExcel(
  sheetName: string,
  rows: Record<string, any>[],
  filenamePrefix: string
) {
  if (rows.length === 0) return;
  const columnKeys = Object.keys(rows[0] || {});
  exportCustomReportToExcel(sheetName, rows, columnKeys, filenamePrefix);
}

