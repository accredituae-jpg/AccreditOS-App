export type DateRangePreset =
  | "all"
  | "today"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

export interface DateRangeBounds {
  startDate?: string;
  endDate?: string;
  label: string;
}

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
): DateRangeBounds {
  const now = new Date();

  if (preset === "today") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: "Today",
    };
  }

  if (preset === "this_week") {
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      diffToMon,
      0,
      0,
      0,
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: "This Week",
    };
  }

  if (preset === "last_week") {
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      diffToMon,
      0,
      0,
      0,
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      diffToMon + 6,
      23,
      59,
      59,
    );
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: "Last Week",
    };
  }

  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const monthName = now.toLocaleString("default", { month: "long" });
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: `This Month (${monthName} ${now.getFullYear()})`,
    };
  }

  if (preset === "last_month") {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const monthName = lastMonthDate.toLocaleString("default", {
      month: "long",
    });
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: `Last Month (${monthName} ${lastMonthDate.getFullYear()})`,
    };
  }

  if (preset === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: `This Year (${now.getFullYear()})`,
    };
  }

  if (preset === "last_year") {
    const prevYear = now.getFullYear() - 1;
    const start = new Date(prevYear, 0, 1, 0, 0, 0);
    const end = new Date(prevYear, 11, 31, 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: `Last Year (${prevYear})`,
    };
  }

  if (preset === "custom" && (customStart || customEnd)) {
    const start = customStart ? new Date(`${customStart}T00:00:00`) : undefined;
    const end = customEnd ? new Date(`${customEnd}T23:59:59`) : undefined;
    return {
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
      label: `Custom Range (${customStart || "Start"} to ${customEnd || "End"})`,
    };
  }

  return { label: "All Time" };
}
