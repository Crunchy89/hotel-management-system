import { addDays, dateRange, formatDate } from "@/lib/metrics";
import type {
  RateEntry,
  RatePlan,
  Reservation,
  Room,
  RoomTypeRecord,
} from "@/lib/types";

export type RateGridRow = {
  plan: RatePlan;
  typeLabel: string;
  rate: number;
  availability: number;
  entry?: RateEntry;
};

export type RateGroup = {
  typeSlug: string;
  typeLabel: string;
  rows: RateGridRow[];
};

export const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function bookedCount(
  rooms: Room[],
  reservations: Reservation[],
  typeSlug: string,
  date: string,
): number {
  const roomIds = new Set(
    rooms.filter((r) => r.type === typeSlug).map((r) => r.id),
  );
  return reservations.filter(
    (r) =>
      roomIds.has(r.room_id) &&
      (r.status === "booked" || r.status === "checked_in") &&
      r.check_in <= date &&
      r.check_out > date,
  ).length;
}

function defaultAvailability(
  rooms: Room[],
  reservations: Reservation[],
  plan: RatePlan,
  date: string,
): number {
  const total = rooms.filter((r) => r.type === plan.room_type_slug).length;
  return Math.max(0, total - bookedCount(rooms, reservations, plan.room_type_slug, date));
}

export function resolveRateCell(
  plan: RatePlan,
  date: string,
  entries: RateEntry[],
  rooms: Room[],
  reservations: Reservation[],
): { rate: number; availability: number; entry?: RateEntry } {
  const entry = entries.find(
    (e) => e.rate_plan_id === plan.id && e.date === date,
  );
  return {
    rate: entry?.rate ?? plan.base_rate,
    availability:
      entry?.availability ??
      defaultAvailability(rooms, reservations, plan, date),
    entry,
  };
}

export function buildRateGroups(
  roomTypes: RoomTypeRecord[],
  ratePlans: RatePlan[],
  entries: RateEntry[],
  rooms: Room[],
  reservations: Reservation[],
  date: string,
  typeFilter: string,
  packageFilter: string,
): RateGroup[] {
  const types =
    typeFilter === "all"
      ? roomTypes
      : roomTypes.filter((t) => t.slug === typeFilter);

  return types
    .map((type) => {
      const plans = ratePlans
        .filter((p) => p.room_type_slug === type.slug)
        .filter((p) => packageFilter === "all" || p.id === packageFilter)
        .sort((a, b) => a.sort_order - b.sort_order);

      return {
        typeSlug: type.slug,
        typeLabel: type.label,
        rows: plans.map((plan) => {
          const cell = resolveRateCell(
            plan,
            date,
            entries,
            rooms,
            reservations,
          );
          return {
            plan,
            typeLabel: type.label,
            ...cell,
          };
        }),
      };
    })
    .filter((g) => g.rows.length > 0);
}

export function packageOptionsForType(
  ratePlans: RatePlan[],
  typeSlug: string,
): RatePlan[] {
  if (typeSlug === "all") return ratePlans;
  return ratePlans.filter((p) => p.room_type_slug === typeSlug);
}

export function datesInRange(from: string, days: number): string[] {
  return dateRange(from, days);
}

export function formatRateDate(iso: string): string {
  return formatDate(iso, { day: "numeric", month: "short", year: "numeric" });
}

export function channelLabel(channels: string[]): string {
  if (channels.length === 0) return "Direct only";
  if (channels.length === 1) return channels[0]!;
  return `${channels.length} channels`;
}

export { addDays };
