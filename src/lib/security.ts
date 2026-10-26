/**
 * AccreditOS Security & UI Protection Utility
 * Prevents right-click context menu and common browser Developer Tools keyboard shortcuts (F12, Inspect Element, View Source).
 */

export function initSecurityProtection(): void {
  // 1. Disable Right-Click Context Menu
  document.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();
  });

  // 2. Disable DevTools Keyboard Shortcuts
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    // Prevent F12 (DevTools)
    // if (e.key === 'F12' || e.keyCode === 123) {
    //   e.preventDefault();
    //   return false;
    // }

    // Prevent Ctrl+Shift+I (Inspect Element), Ctrl+Shift+J (Console), Ctrl+Shift+C (Selector)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      ["I", "i", "J", "j", "C", "c"].includes(e.key)
    ) {
      e.preventDefault();
      return false;
    }

    // Prevent Ctrl+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
      return false;
    }

    // Prevent Ctrl+S (Prevent browser save webpage dialog)
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      return false;
    }
  });
}
