export function buildSuggestedPassword(email: string): string {
  const normalized = email.trim().toLowerCase();
  const localPart = normalized.split("@")[0] ?? "";
  const prefix = localPart.replace(/[^a-z0-9]/g, "").slice(0, 3);

  return `${prefix || "dev"}123`;
}
