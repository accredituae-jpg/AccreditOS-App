import { describe, expect, it, vi, beforeEach } from "vitest";
import { saveAs } from "file-saver";
import type { Certificate } from "../features/certificates/types/certificates.types";
import {
  generateBulkCertificates,
  createBulkCertificateZip,
} from "../features/certificates/utils/generateBulkCertificates";

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

// Mock the Word and PDF blob generators
vi.mock("../features/certificates/utils/generateWordCertificate", () => ({
  generateWordCertificateBlob: vi.fn(async (cert: Certificate) => ({
    blob: new Blob(["mock-docx-content"], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    filename: `${cert.certificateNumber}-${cert.participantName}.docx`,
  })),
  loadWordCertificateTemplate: vi.fn(async () => new ArrayBuffer(8)),
  formatCertificateFilename: vi.fn((cert: Certificate, ext: string) => `${cert.certificateNumber}.${ext}`),
  isTatweerCertificate: vi.fn(() => true),
}));

vi.mock("../features/certificates/utils/generatePdfCertificate", () => ({
  generatePdfCertificateBlob: vi.fn(async (cert: Certificate) => ({
    blob: new Blob(["mock-pdf-content"], { type: "application/pdf" }),
    filename: `${cert.certificateNumber}-${cert.participantName}.pdf`,
  })),
  loadPdfCertificateAssets: vi.fn(async () => ({
    templateBytes: new ArrayBuffer(8),
    corsivaBoldBytes: new ArrayBuffer(8),
    corsivaRegBytes: new ArrayBuffer(8),
    calibriBoldBytes: new ArrayBuffer(8),
  })),
}));

const mockCert1: Certificate = {
  id: "cert-1",
  participantName: "Ahmed Ali",
  course: "First Aid & CPR",
  certificateNumber: "TCT-5001-AC",
  issueDate: "10-10-2026",
  expiryDate: "09-10-2028",
  renewalStatus: "valid",
  daysUntilExpiry: 730,
  company: "ADNOC Logistics",
  certificateType: "Specific",
  status: "created",
};

const mockCert2: Certificate = {
  id: "cert-2",
  participantName: "Sara Smith",
  course: "Fire Safety Training",
  certificateNumber: "TCT-5002-AC",
  issueDate: "10-10-2026",
  expiryDate: "09-10-2028",
  renewalStatus: "valid",
  daysUntilExpiry: 730,
  company: "Etihad Airways",
  certificateType: "Specific",
  status: "created",
};

describe("generateBulkCertificates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(16),
    } as any);
  });

  it("creates a ZIP archive containing all certificates", async () => {
    const result = await createBulkCertificateZip([mockCert1, mockCert2], "docx", {
      customWordTemplate: new ArrayBuffer(8),
    });

    expect(result).toBeDefined();
    expect(result.count).toBe(2);
    expect(result.filename).toMatch(/Certificates-DOCX-.*\.zip/);
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("calls saveAs when saveZip is enabled", async () => {
    await generateBulkCertificates([mockCert1, mockCert2], {
      format: "docx",
      saveZip: true,
      customWordTemplate: new ArrayBuffer(8),
    });

    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/\.zip$/));
  });

  it("supports bulk PDF certificate generation", async () => {
    const result = await createBulkCertificateZip([mockCert1, mockCert2], "pdf");

    expect(result).toBeDefined();
    expect(result.count).toBe(2);
    expect(result.filename).toMatch(/Certificates-PDF-.*\.zip/);
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("notifies progress callback during generation", async () => {
    const onProgress = vi.fn();
    await createBulkCertificateZip([mockCert1, mockCert2], "docx", {
      customWordTemplate: new ArrayBuffer(8),
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, "Ahmed Ali");
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, "Sara Smith");
  });

  it("throws an error if certificate list is empty", async () => {
    await expect(createBulkCertificateZip([], "docx")).rejects.toThrow(
      "No certificates provided for bulk generation."
    );
  });
});
