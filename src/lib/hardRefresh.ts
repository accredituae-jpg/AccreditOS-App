import { toast } from "sonner";

export async function hardRefreshApp(): Promise<void> {
  toast.info("Purging cache and reloading application...", { duration: 2000 });

  try {
    // 1. Clear Cache Storage
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    // 2. Unregister Service Workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch (error) {
    console.error("Failed to clear caches during hard refresh:", error);
  } finally {
    // 3. Force page reload with cache busting query
    setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("_reload", Date.now().toString());
      window.location.href = currentUrl.toString();
    }, 300);
  }
}
