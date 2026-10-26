import PizZip from "pizzip";
import { saveAs } from "file-saver";
import type { Certificate } from "../types/certificates.types";
import {
  generateWordCertificateBlob,
  loadWordCertificateTemplate,
  CertificateTypeItem,
} from "./generateWordCertificate";
import {
  generatePdfCertificateBlob,
  loadPdfCertificateAssets,
  PdfCertificateAssets,
} from "./generatePdfCertificate";

export interface BulkDownloadOptions {
  format?: "docx" | "pdf";
  zipFilename?: string;
  saveZip?: boolean;
  onProgress?: (current: number, total: number, currentName: string) => void;
  customTypes?: CertificateTypeItem[];
  customWordTemplate?: ArrayBuffer;
}

export interface BulkCertificateResult {
  blob: Blob;
  filename: string;
  count: number;
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    return await blob.arrayBuffer();
  }
  if (typeof Response !== "undefined") {
    try {
      return await new Response(blob).arrayBuffer();
    } catch {
      // fallback to FileReader
    }
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    } else {
      reject(new Error("Cannot convert Blob to ArrayBuffer in this environment"));
    }
  });
}

/**
 * Creates a ZIP archive containing generated certificate files (Word or PDF).
 */
export async function createBulkCertificateZip(
  certificates: Certificate[],
  format: "docx" | "pdf" = "docx",
  options?: BulkDownloadOptions,
): Promise<{ blob: Blob; filename: string; count: number }> {
  if (!certificates || certificates.length === 0) {
    throw new Error("No certificates provided for bulk generation.");
  }

  const zip = new PizZip();
  const total = certificates.length;
  const usedFilenames = new Map<string, number>();

  // Preload template/assets once to avoid repetitive network requests
  let wordTemplateBytes: ArrayBuffer | undefined = options?.customWordTemplate;
  let pdfAssets: PdfCertificateAssets | undefined;

  if (format === "docx") {
    if (!wordTemplateBytes) {
      wordTemplateBytes = await loadWordCertificateTemplate();
    }
  } else {
    try {
      pdfAssets = await loadPdfCertificateAssets();
    } catch (err: any) {
      console.warn("Could not preload PDF assets:", err);
    }
  }

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];
    options?.onProgress?.(i + 1, total, cert.participantName || `Certificate ${i + 1}`);

    let fileBlob: Blob;
    let baseFilename: string;

    if (format === "docx") {
      const result = await generateWordCertificateBlob(cert, wordTemplateBytes);
      fileBlob = result.blob;
      baseFilename = result.filename;
    } else {
      const result = await generatePdfCertificateBlob(
        cert,
        options?.customTypes,
        pdfAssets,
      );
      fileBlob = result.blob;
      baseFilename = result.filename;
    }

    // Ensure unique filenames inside the zip
    let finalFilename = baseFilename;
    const count = usedFilenames.get(baseFilename) || 0;
    if (count > 0) {
      const dotIndex = baseFilename.lastIndexOf(".");
      if (dotIndex !== -1) {
        finalFilename = `${baseFilename.slice(0, dotIndex)} (${count})${baseFilename.slice(dotIndex)}`;
      } else {
        finalFilename = `${baseFilename} (${count})`;
      }
    }
    usedFilenames.set(baseFilename, count + 1);

    const arrayBuffer = await blobToArrayBuffer(fileBlob);
    zip.file(finalFilename, arrayBuffer, { binary: true });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const defaultZipName = `Certificates-${format.toUpperCase()}-${dateStr}.zip`;
  const zipFilename = options?.zipFilename || defaultZipName;

  const zipBlob = zip.generate({
    type: "blob",
    mimeType: "application/zip",
  });

  return {
    blob: zipBlob,
    filename: zipFilename,
    count: total,
  };
}

/**
 * Generates bulk certificates into a single ZIP file and triggers a browser download by default.
 */
export async function generateBulkCertificates(
  certificates: Certificate[],
  options?: BulkDownloadOptions,
): Promise<BulkCertificateResult> {
  const format = options?.format || "docx";
  const result = await createBulkCertificateZip(certificates, format, options);

  if (options?.saveZip !== false && typeof window !== "undefined") {
    saveAs(result.blob, result.filename);
  }

  return result;
}

export async function generateBulkWordCertificates(
  certificates: Certificate[],
  options?: Omit<BulkDownloadOptions, "format">,
): Promise<BulkCertificateResult> {
  return generateBulkCertificates(certificates, { ...options, format: "docx" });
}

export async function generateBulkPdfCertificates(
  certificates: Certificate[],
  options?: Omit<BulkDownloadOptions, "format">,
): Promise<BulkCertificateResult> {
  return generateBulkCertificates(certificates, { ...options, format: "pdf" });
}
