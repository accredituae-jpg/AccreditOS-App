import { lazy, ComponentType } from "react";

/**
 * A wrapper around React.lazy that automatically retries importing the component
 * and reloads the page once if a chunk fails to load due to a new deployment.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page-has-been-force-refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Assume that the user's browser cached an old version of the chunk.
        // Force a page refresh to get the latest assets from the new deployment.
        console.warn("[lazyWithRetry] Stale chunk detected, refreshing page to fetch latest version...");
        window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
        window.location.reload();
        // Return a dummy promise to keep React from crashing with a white screen before the page reloads
        return new Promise(() => {}) as any;
      }

      // If we already tried refreshing once and it still failed, throw the error
      console.error("[lazyWithRetry] Failed to load chunk after refresh:", error);
      throw error;
    }
  });
}
