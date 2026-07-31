import type { Reservation, Room } from "@/lib/types";

/** Statuses that physically occupy a room. */
const ACTIVE_STATUSES = new Set(["booked", "checked_in", "checked_out"]);

export function isActive(reservation: Reservation): boolean {
  return ACTIVE_STATUSES.has(reservation.status);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayDiff(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function nights(reservation: Reservation): number {
  return Math.max(0, dayDiff(reservation.check_in, reservation.check_out));
}

/** Builds a contiguous list of ISO dates starting at `start`. */
export function dateRange(start: string, length: number): string[] {
  return Array.from({ length }, (_, i) => addDays(start, i));
}

/** A stay covers a date when it starts on or before it and ends after it. */
export function coversDate(reservation: Reservation, date: string): boolean {
  return reservation.check_in <= date && reservation.check_out > date;
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(
    undefined,
    opts ?? { month: "short", day: "numeric" },
  );
}

export function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export type DayMetrics = {
  date: string;
  occupied: number;
  arrivals: number;
  departures: number;
  revenue: number;
  occupancyRate: number;
};

/**
 * Per-night operating metrics. Revenue is the sum of nightly rates for every
 * room occupied that night.
 */
export function dailyMetrics(
  dates: string[],
  reservations: Reservation[],
  rooms: Room[],
): DayMetrics[] {
  const rateById = new Map(rooms.map((r) => [r.id, r.rate]));
  const active = reservations.filter(isActive);

  return dates.map((date) => {
    const staying = active.filter((r) => coversDate(r, date));
    const revenue = staying.reduce(
      (sum, r) => sum + (rateById.get(r.room_id) ?? 0),
      0,
    );

    return {
      date,
      occupied: staying.length,
      arrivals: active.filter((r) => r.check_in === date).length,
      departures: active.filter((r) => r.check_out === date).length,
      revenue,
      occupancyRate: rooms.length ? staying.length / rooms.length : 0,
    };
  });
}

export type PerformanceSummary = {
  roomNights: number;
  availableRoomNights: number;
  revenue: number;
  occupancyRate: number;
  /** Average daily rate: revenue per occupied room-night. */
  adr: number;
  /** Revenue per available room. */
  revpar: number;
};

export function summarize(days: DayMetrics[], roomCount: number): PerformanceSummary {
  const roomNights = days.reduce((sum, d) => sum + d.occupied, 0);
  const revenue = days.reduce((sum, d) => sum + d.revenue, 0);
  const availableRoomNights = roomCount * days.length;

  return {
    roomNights,
    availableRoomNights,
    revenue,
    occupancyRate: availableRoomNights ? roomNights / availableRoomNights : 0,
    adr: roomNights ? revenue / roomNights : 0,
    revpar: availableRoomNights ? revenue / availableRoomNights : 0,
  };
}

/** Room-night revenue grouped by room type over a date window. */
export function revenueByRoomType(
  dates: string[],
  reservations: Reservation[],
  rooms: Room[],
): Array<{ type: string; revenue: number; roomNights: number }> {
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const totals = new Map<string, { revenue: number; roomNights: number }>();

  for (const room of rooms) {
    if (!totals.has(room.type)) totals.set(room.type, { revenue: 0, roomNights: 0 });
  }

  for (const reservation of reservations.filter(isActive)) {
    const room = roomById.get(reservation.room_id);
    if (!room) continue;
    const entry = totals.get(room.type);
    if (!entry) continue;

    for (const date of dates) {
      if (coversDate(reservation, date)) {
        entry.revenue += room.rate;
        entry.roomNights += 1;
      }
    }
  }

  return [...totals.entries()]
    .map(([type, v]) => ({ type, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}
