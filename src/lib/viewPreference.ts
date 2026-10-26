export type ViewMode = "grid" | "list";

const STORAGE_KEY = "accreditos_preferred_view";
const EVENT_NAME = "accreditos_view_preference_change";

/**
 * Reads global view preference from localStorage.
 * Defaults to "grid" across all feature pages.
 */
export function getStoredViewPreference(): ViewMode {
  if (typeof window === "undefined") return "grid";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "list" || stored === "grid") return stored;
  return "grid";
}

/**
 * Saves global view preference to localStorage and broadcasts change to all pages.
 */
export function setStoredViewPreference(mode: ViewMode): void {
  if (typeof window === "undefined") return;
  const current = localStorage.getItem(STORAGE_KEY);
  if (current === mode) return;
  localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: mode }));
}

/**
 * Subscribes to view preference changes across tabs and pages.
 */
export function subscribeViewPreference(callback: (mode: ViewMode) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const customEv = e as CustomEvent<ViewMode>;
    if (customEv.detail) {
      callback(customEv.detail);
    } else {
      callback(getStoredViewPreference());
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
