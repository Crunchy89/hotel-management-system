import { formatCurrency } from "@/lib/metrics";
import type { BookingActivity, BookingActivityKind } from "@/lib/types";

export type ActivityFilters = {
  dateFrom: string;
  dateTo: string;
  kind: "all" | BookingActivityKind;
  source: string;
  search: string;
};

export const ACTIVITY_KIND_OPTIONS: Array<{
  value: ActivityFilters["kind"];
  label: string;
}> = [
  { value: "all", label: "All events" },
  { value: "booking_created", label: "New booking" },
  { value: "payment_received", label: "Payment received" },
  { value: "booking_cancelled", label: "Booking cancelled" },
  { value: "check_in", label: "Check-in" },
  { value: "check_out", label: "Check-out" },
];

export const ACTIVITY_KIND_LABELS: Record<BookingActivityKind, string> = {
  booking_created: "New booking",
  payment_received: "Payment received",
  booking_cancelled: "Cancelled",
  check_in: "Check-in",
  check_out: "Check-out",
};

export function defaultActivityFilters(today: string): ActivityFilters {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCMonth(from.getUTCMonth() - 1);
  const to = new Date(`${today}T00:00:00Z`);
  to.setUTCMonth(to.getUTCMonth() + 1);

  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
    kind: "all",
    source: "all",
    search: "",
  };
}

export function filterActivities(
  activities: BookingActivity[],
  filters: ActivityFilters,
): BookingActivity[] {
  const search = filters.search.trim().toLowerCase();

  return activities.filter((activity) => {
    const day = activity.created_at.slice(0, 10);
    if (day < filters.dateFrom || day > filters.dateTo) return false;
    if (filters.kind !== "all" && activity.kind !== filters.kind) return false;
    if (
      filters.source !== "all" &&
      (activity.booking_source ?? "Direct") !== filters.source
    ) {
      return false;
    }
    if (!search) return true;

    const haystack = [
      activity.guest_name,
      activity.reference,
      activity.description,
      activity.booking_source,
      ACTIVITY_KIND_LABELS[activity.kind],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

export function formatActivityWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function activityKindTone(
  kind: BookingActivityKind,
): "brand" | "success" | "error" | "neutral" {
  switch (kind) {
    case "booking_created":
      return "brand";
    case "payment_received":
      return "success";
    case "booking_cancelled":
      return "error";
    default:
      return "neutral";
  }
}

export function exportActivitiesCsv(
  rows: BookingActivity[],
  dateFrom: string,
  dateTo: string,
): void {
  const header = [
    "When",
    "Event",
    "Reference",
    "Guest",
    "Source",
    "Amount",
    "Description",
  ];

  const lines = rows.map((row) => [
    formatActivityWhen(row.created_at),
    ACTIVITY_KIND_LABELS[row.kind],
    row.reference ?? "",
    row.guest_name ?? "",
    row.booking_source ?? "Direct",
    row.amount != null ? formatCurrency(row.amount) : "",
    row.description,
  ]);

  const csv = [header, ...lines]
    .map((cols) =>
      cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `booking-activity-${dateFrom}-to-${dateTo}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
