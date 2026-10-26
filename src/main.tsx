import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "dirham/css";
import "./dirham-fonts.css";
import "./index.css";
import { initSecurityProtection } from "./lib/security";

// Gracefully handle stale chunk hashes (new deploy landed while tab was open)
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const hasReloaded = sessionStorage.getItem("vite_chunk_reload") === "1";
  if (!hasReloaded) {
    sessionStorage.setItem("vite_chunk_reload", "1");
    console.warn("[app] Stale module chunk detected, reloading page for latest version...");
    window.location.reload();
  }
});

// Clear the guard once the app has loaded cleanly
window.addEventListener("load", () => {
  sessionStorage.removeItem("vite_chunk_reload");
  sessionStorage.removeItem("page-has-been-force-refreshed");
});

// Initialize UI Protection
initSecurityProtection();

createRoot(document.getElementById("root")!).render(<App />);

