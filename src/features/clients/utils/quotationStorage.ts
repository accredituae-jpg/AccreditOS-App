import type { Quotation } from "../types/quotation.types";

const QUOTATIONS_STORAGE_KEY = "accredit_quotations_v1";
const QUOTATIONS_CHANGE_EVENT = "accredit_quotations_updated";

/**
 * Retrieve all saved quotations from localStorage
 */
export function getStoredQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load quotations from localStorage:", err);
    return [];
  }
}

/**
 * Save or update a quotation in localStorage
 */
export function saveStoredQuotation(quotation: Quotation): void {
  try {
    const existing = getStoredQuotations();
    const index = existing.findIndex((q) => q.id === quotation.id || q.quotationNo === quotation.quotationNo);

    let updated: Quotation[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = quotation;
    } else {
      updated = [quotation, ...existing];
    }

    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(QUOTATIONS_CHANGE_EVENT, { detail: quotation }));
  } catch (err) {
    console.error("Failed to save quotation to localStorage:", err);
  }
}

/**
 * Delete a quotation from localStorage
 */
export function deleteStoredQuotation(id: string): void {
  try {
    const existing = getStoredQuotations();
    const filtered = existing.filter((q) => q.id !== id);
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(QUOTATIONS_CHANGE_EVENT, { detail: { id, deleted: true } }));
  } catch (err) {
    console.error("Failed to delete quotation from localStorage:", err);
  }
}

/**
 * Filter stored quotations for a specific client name
 */
export function getQuotationsForClient(companyName?: string): Quotation[] {
  if (!companyName) return [];
  const normalized = companyName.trim().toLowerCase();
  const all = getStoredQuotations();
  return all.filter((q) => q.companyName.trim().toLowerCase() === normalized);
}

/**
 * Subscribe to storage updates
 */
export function subscribeQuotations(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(QUOTATIONS_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(QUOTATIONS_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
