import { formatDate } from "@/lib/metrics";
import type {
  Channel,
  ChannelRateEntry,
  RateEntry,
  RatePlan,
  Reservation,
  Room,
  RoomTypeRecord,
} from "@/lib/types";

export type ChannelGridRow = {
  plan: RatePlan;
  typeLabel: string;
  rate: number;
  availability: number;
  sync_status: ChannelRateEntry["sync_status"];
  entry?: ChannelRateEntry;
};

export type ChannelRateGroup = {
  typeSlug: string;
  typeLabel: string;
  rows: ChannelGridRow[];
};

export function planMatchesChannel(plan: RatePlan, channelName: string): boolean {
  if (channelName === "Direct Booking") {
    return plan.channels.includes("Direct") || plan.channels.length === 0;
  }
  if (plan.channels.includes("Direct") && plan.channels.length === 1) {
    return false;
  }
  return (
    plan.channels.length === 0 ||
    plan.channels.includes(channelName) ||
    plan.channels.some((c) => c !== "Direct")
  );
}

export function otaChannels(channels: Channel[]): Channel[] {
  return channels.filter(
    (c) =>
      c.is_connected &&
      c.status === "active" &&
      c.name !== "Direct Booking" &&
      c.name !== "AróSuite",
  );
}

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
  return Math.max(
    0,
    total - bookedCount(rooms, reservations, plan.room_type_slug, date),
  );
}

export function resolveChannelRateCell(
  channelId: string,
  plan: RatePlan,
  date: string,
  channelEntries: ChannelRateEntry[],
  baseEntries: RateEntry[],
  rooms: Room[],
  reservations: Reservation[],
): Omit<ChannelGridRow, "plan" | "typeLabel"> {
  const entry = channelEntries.find(
    (e) =>
      e.channel_id === channelId &&
      e.rate_plan_id === plan.id &&
      e.date === date,
  );
  const baseEntry = baseEntries.find(
    (e) => e.rate_plan_id === plan.id && e.date === date,
  );

  return {
    rate: entry?.rate ?? baseEntry?.rate ?? plan.base_rate,
    availability:
      entry?.availability ??
      baseEntry?.availability ??
      defaultAvailability(rooms, reservations, plan, date),
    sync_status: entry?.sync_status ?? "synced",
    entry,
  };
}

export function buildChannelRateGroups(
  channel: Channel,
  roomTypes: RoomTypeRecord[],
  ratePlans: RatePlan[],
  channelEntries: ChannelRateEntry[],
  baseEntries: RateEntry[],
  rooms: Room[],
  reservations: Reservation[],
  date: string,
  typeFilter: string,
): ChannelRateGroup[] {
  const types =
    typeFilter === "all"
      ? roomTypes
      : roomTypes.filter((t) => t.slug === typeFilter);

  return types
    .map((type) => {
      const plans = ratePlans
        .filter((p) => p.room_type_slug === type.slug)
        .filter((p) => planMatchesChannel(p, channel.name))
        .sort((a, b) => a.sort_order - b.sort_order);

      return {
        typeSlug: type.slug,
        typeLabel: type.label,
        rows: plans.map((plan) => ({
          plan,
          typeLabel: type.label,
          ...resolveChannelRateCell(
            channel.id,
            plan,
            date,
            channelEntries,
            baseEntries,
            rooms,
            reservations,
          ),
        })),
      };
    })
    .filter((g) => g.rows.length > 0);
}

export function countPendingSync(
  channelId: string,
  entries: ChannelRateEntry[],
): number {
  return entries.filter(
    (e) => e.channel_id === channelId && e.sync_status === "pending",
  ).length;
}

export function formatRateDate(iso: string): string {
  return formatDate(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatSyncTime(iso?: string): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const CHANNEL_MARKUP_HINT: Record<string, string> = {
  Agoda: "Typically 3% below BAR",
  "Booking.com": "BAR parity",
  Expedia: "+5% premium",
  Hotelbeds: "Wholesale −8%",
};
