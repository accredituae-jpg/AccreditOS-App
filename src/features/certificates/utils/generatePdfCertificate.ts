import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Certificate } from "../types/certificates.types";
import {
  getCertificateCompletionText,
  formatCertificateFilename,
  CertificateTypeItem,
} from "./generateWordCertificate";

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

export interface PdfCertificateAssets {
  templateBytes: ArrayBuffer;
  corsivaBoldBytes: ArrayBuffer;
  corsivaRegBytes: ArrayBuffer;
  calibriBoldBytes: ArrayBuffer;
}

let cachedAssetsPromise: Promise<PdfCertificateAssets> | null = null;

export async function loadPdfCertificateAssets(): Promise<PdfCertificateAssets> {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = (async () => {
      const [templateRes, corsivaBoldRes, corsivaRegRes, calibriBoldRes] =
        await Promise.all([
          fetch("/assets/SPECIFIC-CERTIFICATE.pdf"),
          fetch("/assets/fonts/Monotype-Corsiva-Bold.ttf"),
          fetch("/assets/fonts/Monotype-Corsiva-Regular.ttf"),
          fetch("/assets/fonts/calibri_bold.ttf"),
        ]);

      if (!templateRes.ok) {
        throw new Error("Failed to load Tatweer PDF certificate template.");
      }
      if (!corsivaBoldRes.ok || !corsivaRegRes.ok || !calibriBoldRes.ok) {
        throw new Error("Failed to load custom font files.");
      }

      const [
        templateBytes,
        corsivaBoldBytes,
        corsivaRegBytes,
        calibriBoldBytes,
      ] = await Promise.all([
        templateRes.arrayBuffer(),
        corsivaBoldRes.arrayBuffer(),
        corsivaRegRes.arrayBuffer(),
        calibriBoldRes.arrayBuffer(),
      ]);

      return {
        templateBytes,
        corsivaBoldBytes,
        corsivaRegBytes,
        calibriBoldBytes,
      };
    })().catch((err) => {
      cachedAssetsPromise = null;
      throw err;
    });
  }
  return cachedAssetsPromise;
}

export async function generatePdfCertificateBlob(
  cert: Certificate,
  customTypes?: CertificateTypeItem[],
  preloadedAssets?: PdfCertificateAssets,
): Promise<{ blob: Blob; filename: string }> {
  // 1. Fetch official PDF template & Monotype Corsiva fonts from public assets or cache
  const assets = preloadedAssets || (await loadPdfCertificateAssets());

  // 2. Load PDFDocument with pdf-lib and register fontkit
  const pdfDoc = await PDFDocument.load(assets.templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width } = firstPage.getSize();

  // Embed Custom Monotype Corsiva & Standard Helvetica fonts
  const corsivaBoldFont = await pdfDoc.embedFont(assets.corsivaBoldBytes);
  const corsivaRegularFont = await pdfDoc.embedFont(assets.corsivaRegBytes);
  const calibriBoldFont = await pdfDoc.embedFont(assets.calibriBoldBytes);
  const italicBoldFont = await pdfDoc.embedFont(assets.corsivaBoldBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaObliqueFont = await pdfDoc.embedFont(
    StandardFonts.HelveticaOblique,
  );

  // 3. Format Dynamic Values
  const candidateName = toTitleCase(cert.participantName || "Participant Name");
  const completionText = getCertificateCompletionText(cert, customTypes);
  const courseTitle = cert.course || "Training Course";
  const customComp = cert.customCompany?.trim();
  const hasCustomCompany = Boolean(customComp);
  const isIndividual = (!cert.company || cert.company === "Individual Candidate" || cert.company === "Individual" || cert.company === "N/A") && !hasCustomCompany;
  const companyName = (hasCustomCompany ? customComp! : (cert.company || "CLIENT COMPANY L.L.C")).toUpperCase();
  const certNumber = cert.certificateNumber || "TCT-5005-AC";
  const issueDate = cert.issueDate || "01-07-2026";
  const expiryDate = cert.expiryDate || "30-06-2027";

  // Color Definitions matching Word Template
  const navyTextColor = rgb(0.08, 0.12, 0.25);
  const blueCompletionColor = rgb(0.08, 0.42, 0.68);
  const darkGrayColor = rgb(0.1, 0.1, 0.1);
  const whiteColor = rgb(1, 1, 1);
  const blackColor = rgb(0, 0, 0);

  // 4. Whiteout Background Patching over Template Placeholders
  // A. Candidate Name Patch (covers "Participant Name" placeholder area)
  firstPage.drawRectangle({
    x: 150,
    y: 280,
    width: width - 300,
    height: 30,
    color: whiteColor,
  });

  // B. Completion Text Patch (covers "has successfully completed..." placeholder area)
  firstPage.drawRectangle({
    x: 100,
    y: 250,
    width: width - 200,
    height: 30,
    color: whiteColor,
  });

  // C. Course Title Patch (covers "Course Name" placeholder area)
  firstPage.drawRectangle({
    x: 120,
    y: 210,
    width: width - 240,
    height: 30,
    color: whiteColor,
  });

  // D. Company Name Patch (covers "Company: COMPANY NAME" area)
  firstPage.drawRectangle({
    x: 70,
    y: 175,
    width: width - 140,
    height: 35,
    color: whiteColor,
  });

  // E. Cert No Patch (covers "Certificate No: TCT-****-AC" area)
  firstPage.drawRectangle({
    x: 70,
    y: 140,
    width: 250,
    height: 32,
    color: whiteColor,
  });

  // F. Course Date Patch (covers "Course Date: 00-00-00" area)
  firstPage.drawRectangle({
    x: 345,
    y: 140,
    width: 180,
    height: 32,
    color: whiteColor,
  });

  // G. Certificate Validity Patch (covers "Certificate Validity: 00-00-00" area)
  firstPage.drawRectangle({
    x: 545,
    y: 140,
    width: 230,
    height: 32,
    color: whiteColor,
  });

  // 5. Draw Dynamic Text Elements

  // A. Participant Name (Monotype Corsiva Bold, Title Case, Centered)
  const nameFontSize = 28;
  const nameWidth = corsivaBoldFont.widthOfTextAtSize(
    candidateName,
    nameFontSize,
  );

  firstPage.drawText(candidateName, {
    x: width / 2 - nameWidth / 2,
    y: 280,
    size: nameFontSize,
    font: corsivaBoldFont,
    color: blackColor,
  });

  // B. Dynamic Completion Text (Monotype Corsiva Regular, Centered at Y = 298)
  const compFontSize = 15;
  const compWidth = corsivaRegularFont.widthOfTextAtSize(
    completionText,
    compFontSize,
  );
  firstPage.drawText(completionText, {
    x: width / 2 - compWidth / 2,
    y: 253,
    size: compFontSize,
    font: corsivaRegularFont,
    color: blueCompletionColor,
  });

  // C. Course Name (Monotype Corsiva Bold, Title Case, Centered at Y = 248)
  const courseFontSize = 24;
  const courseWidth = corsivaBoldFont.widthOfTextAtSize(
    courseTitle,
    courseFontSize,
  );
  firstPage.drawText(courseTitle, {
    x: width / 2 - courseWidth / 2,
    y: 222,
    size: courseFontSize,
    font: italicBoldFont,
    color: blackColor,
  });

  // Underline for Course Name
  firstPage.drawLine({
    start: { x: width / 2 - courseWidth / 2 - 2, y: 215 },
    end: { x: width / 2 + courseWidth / 2 + 2, y: 215 },
    thickness: 1.5,
    color: blackColor,
  });

  // D. Company Name ("Company: [FULL COMPANY NAME]", Left Aligned at X = 75, Y = 182)
  if (!isIndividual) {
    const companyFullText = `Company: ${companyName}`;
    const companyFontSize = 14;
    firstPage.drawText(companyFullText, {
      x: 75,
      y: 182,
      size: companyFontSize,
      font: calibriBoldFont,
      color: blackColor,
    });
  }

  // E. Certificate Number ("Certificate No: TCT-5005-AC", Left Aligned at X = 75, Y = 148)
  const certNoFontSize = 14;
  const part1 = "Certi";
  const part2 = `ficate No: ${certNumber}`;
  const part1Width = calibriBoldFont.widthOfTextAtSize(part1, certNoFontSize);

  firstPage.drawText(part1, {
    x: 75,
    y: 148,
    size: certNoFontSize,
    font: calibriBoldFont,
    color: blackColor,
  });

  firstPage.drawText(part2, {
    x: 75 + part1Width,
    y: 148,
    size: certNoFontSize,
    font: calibriBoldFont,
    color: blackColor,
  });

  // F. Course Date ("Course Date: 16-07-2026", Positioned at X = 350, Y = 148)
  const dateFontSize = 15;
  const courseDateFullText = `Course Date:  ${issueDate}`;
  firstPage.drawText(courseDateFullText, {
    x: 350,
    y: 148,
    size: dateFontSize,
    font: corsivaBoldFont,
    color: blackColor,
  });

  // Underline for Course Date
  const issueDateWidth = corsivaBoldFont.widthOfTextAtSize(
    issueDate,
    dateFontSize,
  );
  const dateLabelWidth = corsivaBoldFont.widthOfTextAtSize(
    "Course Date:  ",
    dateFontSize,
  );
  firstPage.drawLine({
    start: { x: 350 + dateLabelWidth, y: 145 },
    end: { x: 350 + dateLabelWidth + issueDateWidth, y: 145 },
    thickness: 1,
    color: blackColor,
  });

  // G. Certificate Validity ("Certificate Validity: 15-07-2027", Positioned at X = 550, Y = 148)
  const validityFullText = `Certificate Validity:  ${expiryDate}`;
  firstPage.drawText(validityFullText, {
    x: 550,
    y: 148,
    size: dateFontSize,
    font: corsivaBoldFont,
    color: blackColor,
  });

  // Underline for Expiry Date
  const expiryDateWidth = corsivaBoldFont.widthOfTextAtSize(
    expiryDate,
    dateFontSize,
  );
  const valLabelWidth = corsivaBoldFont.widthOfTextAtSize(
    "Certificate Validity:  ",
    dateFontSize,
  );
  firstPage.drawLine({
    start: { x: 550 + valLabelWidth, y: 145 },
    end: { x: 550 + valLabelWidth + expiryDateWidth, y: 145 },
    thickness: 1,
    color: blackColor,
  });

  // 6. Save modified PDF and return blob & filename
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], {
    type: "application/pdf",
  });
  const filename = formatCertificateFilename(cert, "pdf");

  return { blob, filename };
}

export async function generatePdfCertificate(
  cert: Certificate,
  customTypes?: CertificateTypeItem[],
): Promise<void> {
  const { blob, filename } = await generatePdfCertificateBlob(cert, customTypes);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}
