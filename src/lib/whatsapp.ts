/**
 * Clean phone number into WhatsApp international format.
 * Converts e.g. "+971 50 123 4567" or "050 123 4567" into "971501234567".
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return "";

  // UAE local number starting with 05x or 04x -> 9715x / 9714x
  if (cleaned.startsWith("0")) {
    cleaned = "971" + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Generate a WhatsApp chat URL with optional pre-filled message.
 */
export function getWhatsAppUrl(phone: string, defaultText = "Hello! Contacting you from AccreditOS."): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  if (!cleanPhone) return "#";
  const encodedText = encodeURIComponent(defaultText);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Open WhatsApp directly in a new tab.
 */
export function openWhatsApp(phone: string, defaultText = "Hello! Contacting you from AccreditOS.", e?: React.MouseEvent) {
  if (e) {
    e.stopPropagation();
  }
  const url = getWhatsAppUrl(phone, defaultText);
  if (url !== "#") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
