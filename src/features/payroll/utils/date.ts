export function formatPayrollDate(date?: string | null): string {
  if (!date) return "—";

  const dateOnly = date.slice(0, 10);
  const parsed = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
