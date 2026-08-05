import type {
  CreateFolioLineInput,
  CreateGuestInput,
  CreateReservationInput,
  CreateRoomInput,
  CreateRoomTypeInput,
  DashboardStats,
  FolioLine,
  Guest,
  GuestMessage,
  HousekeepingRecord,
  BulkRateUpdateInput,
  BulkChannelRateUpdateInput,
  Channel,
  ChannelRateEntry,
  RateEntry,
  RatePlan,
  Reservation,
  Room,
  RoomTypeRecord,
  SendGuestMessageInput,
  UpdateChannelInput,
  UpsertChannelRateEntryInput,
  UpsertRateEntryInput,
  UpdateGuestInput,
  UpdateHousekeepingInput,
  UpdateRoomInput,
  UpdateRoomTypeInput,
  CreateYieldRuleInput,
  UpdateYieldRuleInput,
  YieldRule,
  BookingActivity,
  BookingActivityKind,
  PaymentCollect,
  UpdateReservationPaymentInput,
  KeyCard,
  MoveReservationRoomInput,
  WriteKeyCardInput,
} from "@/lib/types";
import { folioBalance, folioPaymentsNet, stayTotal } from "@/lib/folio";
import { renderMessageTemplate } from "@/lib/messaging";

const STORAGE_KEY = "hms-hotel-data-v3";

type StoreData = {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  room_types: RoomTypeRecord[];
  housekeeping: HousekeepingRecord[];
  rate_plans: RatePlan[];
  rate_entries: RateEntry[];
  channels: Channel[];
  channel_rate_entries: ChannelRateEntry[];
  yield_rules: YieldRule[];
  folio_lines: FolioLine[];
  guest_messages: GuestMessage[];
  booking_activities: BookingActivity[];
  key_cards: KeyCard[];
};

const PACKAGE_TEMPLATES: Array<{
  slug: string;
  label: string;
  multiplier: number;
  channels: string[];
}> = [
  { slug: "weekend", label: "Weekend package", multiplier: 1.15, channels: ["Booking.com", "Expedia"] },
  { slug: "summer-promo", label: "Summer promo", multiplier: 0.9, channels: ["Booking.com"] },
  { slug: "seasonal", label: "Seasonal promo", multiplier: 1.0, channels: [] },
  { slug: "with-breakfast", label: "Room rate with breakfast", multiplier: 1.25, channels: ["Booking.com", "Expedia"] },
  { slug: "room-only", label: "Room rate only", multiplier: 1.0, channels: ["Direct"] },
  { slug: "agoda-mobile", label: "Agoda mobile rate", multiplier: 0.95, channels: ["Agoda"] },
];

const DEFAULT_ROOM_TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  twin: "Twin",
  deluxe: "Deluxe",
  suite: "Suite",
  family: "Family",
};
const ROOM_STATUSES = new Set(["available", "occupied", "cleaning", "maintenance"]);

function uid() {
  return crypto.randomUUID();
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultRoomTypes(): RoomTypeRecord[] {
  return Object.entries(DEFAULT_ROOM_TYPE_LABELS).map(
    ([slug, label], sort_order) => ({
      id: uid(),
      slug,
      label,
      sort_order,
    }),
  );
}

function deriveRoomTypes(rooms: Room[]): RoomTypeRecord[] {
  const slugs = [...new Set(rooms.map((r) => r.type))].sort();
  return slugs.map((slug, sort_order) => ({
    id: uid(),
    slug,
    label: DEFAULT_ROOM_TYPE_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    sort_order,
  }));
}

function normalizeData(raw: Partial<StoreData>): StoreData {
  const rooms = raw.rooms ?? [];
  const guests = raw.guests ?? [];
  const reservations = raw.reservations ?? [];
  const room_types =
    raw.room_types && raw.room_types.length > 0
      ? raw.room_types
      : deriveRoomTypes(rooms);

  return {
    rooms,
    guests,
    reservations,
    room_types,
    housekeeping: raw.housekeeping ?? [],
    rate_plans: raw.rate_plans ?? [],
    rate_entries: raw.rate_entries ?? [],
    channels: raw.channels ?? [],
    channel_rate_entries: raw.channel_rate_entries ?? [],
    yield_rules: raw.yield_rules ?? [],
    folio_lines: raw.folio_lines ?? [],
    guest_messages: raw.guest_messages ?? [],
    booking_activities: raw.booking_activities ?? [],
    key_cards: raw.key_cards ?? [],
  };
}

function avgRateForType(rooms: Room[], typeSlug: string): number {
  const typed = rooms.filter((r) => r.type === typeSlug);
  if (typed.length === 0) return 100;
  return Math.round(typed.reduce((s, r) => s + r.rate, 0) / typed.length);
}

function seedRatePlans(rooms: Room[], roomTypes: RoomTypeRecord[]): RatePlan[] {
  const plans: RatePlan[] = [];
  for (const type of roomTypes) {
    const base = avgRateForType(rooms, type.slug);
    PACKAGE_TEMPLATES.forEach((pkg, sort_order) => {
      plans.push({
        id: uid(),
        slug: `${type.slug}-${pkg.slug}`,
        label: pkg.label,
        room_type_slug: type.slug,
        sort_order,
        channels: pkg.channels,
        base_rate: Math.round(base * pkg.multiplier),
      });
    });
  }
  return plans;
}

function ensureRatePlans(data: StoreData): void {
  if (data.rate_plans.length > 0) return;
  data.rate_plans = seedRatePlans(data.rooms, data.room_types);
}

const CONNECTED_CHANNEL_SEED: Array<
  [string, string | undefined, Channel["status"], number, number, boolean?]
> = [
  ["Direct Booking", "Boost direct bookings with your own booking engine.", "active", 730, 12],
  ["Agoda", undefined, "active", 400, 0],
  ["AróSuite", undefined, "inactive", 400, 0, true],
  ["Booking.com", undefined, "active", 545, 12],
  ["Expedia", undefined, "active", 730, 0],
  ["Hotelbeds", undefined, "active", 400, 0],
];

const CATALOG_CHANNEL_NAMES = [
  "Airbnb",
  "Trip.com",
  "Hotels.com",
  "Hostelworld",
  "HRS",
  "Lastminute.com",
  "Traveloka",
  "Tiket.com",
  "MakeMyTrip",
  "Despegar",
  "Ctrip",
  "Priceline",
  "Kayak",
  "Trivago",
  "Google Hotel Ads",
  "TripAdvisor",
  "VRBO",
  "HomeAway",
  "SynXis",
  "SiteMinder",
  "Cloudbeds",
  "RateGain",
  "D-Edge",
  "Mirai",
  "Vertical Booking",
  "Bookassist",
  "Fastbooking",
  "Availpro",
  "Parity Rate",
  "RoomCloud",
];

function seedChannels(): Channel[] {
  const channels: Channel[] = [];
  let order = 0;

  for (const [name, description, status, sync_days, mapped_count, has_warning] of CONNECTED_CHANNEL_SEED) {
    channels.push({
      id: uid(),
      name,
      slug: slugify(name),
      description,
      status,
      sync_days,
      mapped_count,
      is_connected: true,
      sort_order: order++,
      has_warning,
    });
  }

  for (const name of CATALOG_CHANNEL_NAMES) {
    channels.push({
      id: uid(),
      name,
      slug: slugify(name),
      status: "inactive",
      sync_days: 400,
      mapped_count: 0,
      is_connected: false,
      sort_order: order++,
    });
  }

  return channels;
}

function ensureChannelRateEntries(data: StoreData): void {
  if (data.channel_rate_entries.length > 0) return;

  const otaNames = new Set(["Agoda", "Booking.com", "Expedia", "Hotelbeds"]);
  const channels = data.channels.filter(
    (c) => c.is_connected && otaNames.has(c.name),
  );
  if (channels.length === 0 || data.rate_plans.length === 0) return;

  const modifiers: Record<string, number> = {
    Agoda: 0.97,
    "Booking.com": 1,
    Expedia: 1.05,
    Hotelbeds: 0.92,
  };

  const entries: ChannelRateEntry[] = [];
  const now = new Date().toISOString();
  const start = todayISO();

  for (let i = 0; i < 14; i++) {
    const date = addDays(start, i);
    for (const channel of channels) {
      const plans = data.rate_plans.filter((plan) =>
        planMatchesChannel(plan, channel.name),
      );
      for (const plan of plans) {
        const baseEntry = data.rate_entries.find(
          (e) => e.rate_plan_id === plan.id && e.date === date,
        );
        const mod = modifiers[channel.name] ?? 1;
        const rate = Math.round((baseEntry?.rate ?? plan.base_rate) * mod);
        const availability =
          baseEntry?.availability ?? defaultAvailability(data, plan, date);

        entries.push({
          channel_id: channel.id,
          rate_plan_id: plan.id,
          date,
          rate,
          availability,
          sync_status: i % 3 === 0 ? "pending" : "synced",
          updated_at: now,
          last_synced_at: i % 3 === 0 ? undefined : now,
        });
      }
    }
  }

  data.channel_rate_entries = entries;
}

function planMatchesChannel(plan: RatePlan, channelName: string): boolean {
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

function ensureChannels(data: StoreData): void {
  if (data.channels.length > 0) return;
  data.channels = seedChannels();
}

function ensureAll(data: StoreData): void {
  ensureRatePlans(data);
  ensureChannels(data);
  ensureYieldRules(data);
  ensureChannelRateEntries(data);
  ensureReservationPayments(data);
  ensureBookingActivities(data);
}

const OTA_SOURCES = new Set(["Booking.com", "Expedia", "Agoda"]);

function reservationStayAmount(data: StoreData, reservation: Reservation): number {
  const room = data.rooms.find((r) => r.id === reservation.room_id);
  return stayTotal(reservation, room);
}

function ensureReservationPayments(data: StoreData): void {
  if (data.reservations.every((r) => r.payment_collect)) return;

  let seq = 0;
  for (const reservation of data.reservations) {
    if (reservation.status === "cancelled") {
      reservation.payment_collect ??= "property";
      seq += 1;
      continue;
    }

    if (!reservation.booking_source) {
      reservation.booking_source =
        BOOKING_SOURCE_ROTATION[seq % BOOKING_SOURCE_ROTATION.length];
    }

    const hasPayment = data.folio_lines.some(
      (l) => l.reservation_id === reservation.id && l.type === "payment",
    );
    const pattern = seq % 6;
    const source = reservation.booking_source ?? "Direct";

    if (!reservation.payment_collect) {
      if ((pattern === 0 || pattern === 2) && OTA_SOURCES.has(source)) {
        reservation.payment_collect = "channel";
      } else {
        reservation.payment_collect = "property";
      }
    }

    if (!hasPayment) {
      const amount = reservationStayAmount(data, reservation);
      if (amount <= 0) {
        seq += 1;
        continue;
      }

      if (reservation.payment_collect === "channel") {
        data.folio_lines.push({
          id: uid(),
          reservation_id: reservation.id,
          type: "payment",
          description: `Prepaid via ${source}`,
          amount: Math.round(amount * 100) / 100,
          method: "channel",
          created_at: reservation.created_at,
        });
      } else if (pattern === 3) {
        data.folio_lines.push({
          id: uid(),
          reservation_id: reservation.id,
          type: "payment",
          description: "Deposit",
          amount: Math.round(amount * 0.35 * 100) / 100,
          method: "card",
          created_at: reservation.created_at,
        });
      } else if (pattern === 4) {
        data.folio_lines.push({
          id: uid(),
          reservation_id: reservation.id,
          type: "payment",
          description: "Bank transfer received",
          amount: Math.round(amount * 100) / 100,
          method: "transfer",
          created_at: reservation.created_at,
        });
      }
      syncAmountPaid(data, reservation.id);
    }

    seq += 1;
  }
}

const BOOKING_SOURCE_ROTATION = [
  "Direct",
  "Booking.com",
  "Expedia",
  "Agoda",
  "Walk-in",
  "Phone",
];

function activityGuestName(data: StoreData, reservation: Reservation): string {
  const guest = data.guests.find((g) => g.id === reservation.guest_id);
  if (guest) return `${guest.last_name}, ${guest.first_name}`;
  return reservation.guest_name ?? "Guest";
}

function logBookingActivity(
  data: StoreData,
  kind: BookingActivityKind,
  reservation: Reservation,
  opts?: {
    amount?: number;
    description?: string;
    created_at?: string;
  },
): void {
  const defaults: Record<BookingActivityKind, string> = {
    booking_created: "New room booking",
    payment_received: "Payment received",
    booking_cancelled: "Booking cancelled",
    check_in: "Guest checked in",
    check_out: "Guest checked out",
    room_moved: "Guest moved to another room",
    key_written: "Key card encoded",
    key_revoked: "Key card revoked",
  };

  data.booking_activities.push({
    id: uid(),
    kind,
    reservation_id: reservation.id,
    reference: reservation.reference,
    guest_name: activityGuestName(data, reservation),
    booking_source: reservation.booking_source ?? "Direct",
    amount: opts?.amount,
    description: opts?.description ?? defaults[kind],
    created_at: opts?.created_at ?? new Date().toISOString(),
  });
}

function rebuildBookingActivities(data: StoreData): void {
  const activities: BookingActivity[] = [];
  let seq = 0;

  const push = (
    kind: BookingActivityKind,
    reservation: Reservation,
    created_at: string,
    opts?: { amount?: number; description?: string },
  ) => {
    activities.push({
      id: uid(),
      kind,
      reservation_id: reservation.id,
      reference: reservation.reference,
      guest_name: activityGuestName(data, reservation),
      booking_source:
        reservation.booking_source ??
        BOOKING_SOURCE_ROTATION[seq % BOOKING_SOURCE_ROTATION.length],
      amount: opts?.amount,
      description: opts?.description ?? kind.replace(/_/g, " "),
      created_at,
    });
  };

  for (const reservation of data.reservations) {
    const enriched = enrichReservation(data, reservation);
    const source =
      enriched.booking_source ??
      BOOKING_SOURCE_ROTATION[seq % BOOKING_SOURCE_ROTATION.length];
    reservation.booking_source = source;

    const createdAt = new Date(enriched.created_at);
    createdAt.setUTCMinutes(createdAt.getUTCMinutes() - seq * 17);
    const bookedAt = createdAt.toISOString();

    push("booking_created", enriched, bookedAt, {
      description: `New booking · ${enriched.reference ?? enriched.id.slice(0, 8)}`,
    });

    if (enriched.status === "cancelled") {
      const cancelledAt = new Date(bookedAt);
      cancelledAt.setUTCHours(cancelledAt.getUTCHours() + 4 + (seq % 5));
      push("booking_cancelled", enriched, cancelledAt.toISOString(), {
        description: "Booking cancelled by staff",
      });
    }

    if (enriched.status === "checked_in" || enriched.status === "checked_out") {
      const checkInAt = new Date(`${enriched.check_in}T14:00:00.000Z`);
      push("check_in", enriched, checkInAt.toISOString());
    }

    if (enriched.status === "checked_out") {
      const checkOutAt = new Date(`${enriched.check_out}T10:30:00.000Z`);
      push("check_out", enriched, checkOutAt.toISOString());
    }

    seq += 1;
  }

  for (const line of data.folio_lines) {
    if (line.type !== "payment") continue;
    const reservation = data.reservations.find((r) => r.id === line.reservation_id);
    if (!reservation) continue;
    const enriched = enrichReservation(data, reservation);
    push("payment_received", enriched, line.created_at, {
      amount: line.amount,
      description: line.description || "Payment received",
    });
  }

  activities.sort((a, b) => b.created_at.localeCompare(a.created_at));
  data.booking_activities = activities;
}

function ensureBookingActivities(data: StoreData): void {
  if (data.booking_activities.length > 0) return;
  rebuildBookingActivities(data);
}

function seedYieldRules(): YieldRule[] {
  const now = new Date().toISOString();
  const from = todayISO();
  const to = addDays(from, 90);

  return [
    {
      id: uid(),
      name: "Weekend minimum stay",
      rule_type: "min_stay",
      room_type_slug: "deluxe",
      date_from: from,
      date_to: to,
      value: 2,
      status: "active",
      priority: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: uid(),
      name: "High season rate uplift",
      rule_type: "rate_adjustment",
      room_type_slug: "all",
      date_from: from,
      date_to: addDays(from, 30),
      value: 15,
      status: "active",
      priority: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: uid(),
      name: "Suite stop sell",
      rule_type: "stop_sell",
      room_type_slug: "suite",
      date_from: addDays(from, 14),
      date_to: addDays(from, 21),
      value: 1,
      status: "active",
      priority: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: uid(),
      name: "Friday closed to arrival",
      rule_type: "closed_to_arrival",
      room_type_slug: "twin",
      date_from: from,
      date_to: to,
      value: 1,
      status: "inactive",
      priority: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: uid(),
      name: "Family room max stay",
      rule_type: "max_stay",
      room_type_slug: "family",
      date_from: from,
      date_to: to,
      value: 7,
      status: "active",
      priority: 5,
      created_at: now,
      updated_at: now,
    },
  ];
}

function ensureYieldRules(data: StoreData): void {
  if (data.yield_rules.length > 0) return;
  data.yield_rules = seedYieldRules();
}

function roomTypeSlugs(data: StoreData): Set<string> {
  return new Set(data.room_types.map((t) => t.slug));
}

function getRoomTypeLabel(data: StoreData, slug: string): string {
  return data.room_types.find((t) => t.slug === slug)?.label ?? slug;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function offsetDate(days: number): string {
  return addDays(todayISO(), days);
}

const ROOM_SEED: Array<[string, string, number, number, string]> = [
  // number, type, floor, rate, status
  ["101", "standard", 1, 120, "occupied"],
  ["102", "standard", 1, 120, "cleaning"],
  ["103", "standard", 1, 130, "occupied"],
  ["104", "standard", 1, 130, "available"],
  ["105", "twin", 1, 150, "occupied"],
  ["201", "deluxe", 2, 195, "occupied"],
  ["202", "deluxe", 2, 195, "available"],
  ["203", "deluxe", 2, 210, "occupied"],
  ["204", "deluxe", 2, 210, "available"],
  ["205", "family", 2, 260, "occupied"],
  ["301", "suite", 3, 340, "cleaning"],
  ["302", "suite", 3, 380, "maintenance"],
];

const GUEST_SEED: Array<[string, string, string, string]> = [
  ["Ava", "Chen", "ava.chen@example.com", "P1234567"],
  ["Marcus", "Reid", "marcus.reid@example.com", "P7654321"],
  ["Sofia", "Martinez", "sofia.m@example.com", "DL998877"],
  ["Daniel", "Okafor", "d.okafor@example.com", "P4451220"],
  ["Yuki", "Tanaka", "yuki.tanaka@example.com", "JP889201"],
  ["Elena", "Petrova", "elena.p@example.com", "RU553120"],
  ["Liam", "O'Connor", "liam.oc@example.com", "IE223410"],
  ["Priya", "Nair", "priya.nair@example.com", "IN778120"],
  ["Tomas", "Lindqvist", "tomas.l@example.com", "SE119043"],
  ["Grace", "Mwangi", "grace.m@example.com", "KE664301"],
];

/** room number → [start offset in days, nights, status] */
const RESERVATION_SEED: Record<
  string,
  Array<[number, number, string]>
> = {
  "101": [
    [-6, 3, "checked_out"],
    [0, 2, "checked_in"],
    [4, 3, "booked"],
  ],
  "102": [
    [-4, 2, "checked_out"],
    [6, 2, "cancelled"],
  ],
  "103": [
    [0, 5, "checked_in"],
    [7, 2, "booked"],
  ],
  "104": [
    [2, 3, "booked"],
    [8, 4, "booked"],
  ],
  "105": [[-2, 3, "checked_in"]],
  "201": [
    [-5, 2, "checked_out"],
    [0, 4, "checked_in"],
    [6, 2, "booked"],
  ],
  "202": [[3, 5, "booked"]],
  "203": [
    [-1, 3, "checked_in"],
    [5, 3, "booked"],
  ],
  "204": [
    [1, 2, "booked"],
    [9, 3, "booked"],
  ],
  "205": [[0, 7, "checked_in"]],
  "301": [
    [-3, 4, "checked_out"],
    [2, 4, "booked"],
  ],
  "302": [
    [5, 5, "booked"],
    [12, 3, "booked"],
  ],
};

const SEED_NOTES = [
  "",
  "Early arrival requested",
  "Honeymoon — sparkling wine on arrival",
  "Late check-out approved",
  "Allergic to feather pillows",
  "Corporate rate — invoice to company",
  "Travelling with infant, needs cot",
  "",
];

function seedData(): StoreData {
  const now = new Date().toISOString();

  const rooms: Room[] = ROOM_SEED.map(
    ([number, type, floor, rate, status]) => ({
      id: uid(),
      number,
      type,
      floor,
      status,
      rate,
    }),
  );

  const guests: Guest[] = GUEST_SEED.map(
    ([first_name, last_name, email, id_document], i) => ({
      id: uid(),
      first_name,
      last_name,
      email,
      phone: `+1-555-01${String(i + 10).padStart(2, "0")}`,
      id_document,
    }),
  );

  const reservations: Reservation[] = [];
  let seq = 0;

  for (const room of rooms) {
    for (const [startOffset, nights, status] of RESERVATION_SEED[room.number] ??
      []) {
      const guest = guests[seq % guests.length]!;
      reservations.push({
        id: uid(),
        guest_id: guest.id,
        room_id: room.id,
        check_in: offsetDate(startOffset),
        check_out: offsetDate(startOffset + nights),
        status,
        notes: SEED_NOTES[seq % SEED_NOTES.length]!,
        created_at: now,
        updated_at: now,
        guest_name: `${guest.first_name} ${guest.last_name}`,
        room_number: room.number,
      });
      seq += 1;
    }
  }

  const data: StoreData = {
    rooms,
    guests,
    reservations,
    room_types: defaultRoomTypes(),
    housekeeping: [],
    rate_plans: [],
    rate_entries: [],
    channels: [],
    channel_rate_entries: [],
    yield_rules: [],
    folio_lines: [],
    guest_messages: [],
    booking_activities: [],
    key_cards: [],
  };
  ensureAll(data);
  return data;
}

const EMPTY_DATA: StoreData = {
  rooms: [],
  guests: [],
  reservations: [],
  room_types: [],
  housekeeping: [],
  rate_plans: [],
  rate_entries: [],
  channels: [],
  channel_rate_entries: [],
  yield_rules: [],
  folio_lines: [],
  guest_messages: [],
  booking_activities: [],
  key_cards: [],
};

/**
 * Reads go through an in-memory cache so snapshots keep a stable identity
 * between mutations, which `useSyncExternalStore` requires.
 */
let cache: StoreData | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVersion(): number {
  return version;
}

/** Drops the cache so the next read re-parses localStorage. */
export function refresh(): void {
  cache = null;
  version += 1;
  listeners.forEach((listener) => listener());
}

function read(): StoreData {
  if (typeof window === "undefined") return EMPTY_DATA;
  if (cache) return cache;

  let raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    raw = window.localStorage.getItem("hms-hotel-data-v2");
  }
  if (raw) {
    try {
      cache = normalizeData(JSON.parse(raw) as Partial<StoreData>);
      ensureAll(cache);
      persist(cache);
      return cache;
    } catch {
      // fall through to reseed
    }
  }

  cache = seedData();
  persist(cache);
  return cache;
}

function persist(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function write(data: StoreData) {
  cache = data;
  persist(data);
  version += 1;
  listeners.forEach((listener) => listener());
}

function withData<T>(fn: (data: StoreData) => T): T {
  const data = read();
  const result = fn(data);
  write(data);
  return result;
}

function enrichReservation(
  data: StoreData,
  reservation: Reservation,
): Reservation {
  const guest = data.guests.find((g) => g.id === reservation.guest_id);
  const room = data.rooms.find((r) => r.id === reservation.room_id);
  const roomLabel = room
    ? room.number
    : reservation.room_type
      ? `Unallocated · ${getRoomTypeLabel(data, reservation.room_type)}`
      : reservation.room_number;
  return {
    ...reservation,
    guest_name: guest ? `${guest.first_name} ${guest.last_name}` : reservation.guest_name,
    room_number: roomLabel ?? reservation.room_number,
  };
}

export function listRoomTypes(): RoomTypeRecord[] {
  return [...read().room_types].sort(
    (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
  );
}

export function createRoomType(input: CreateRoomTypeInput): RoomTypeRecord {
  const label = input.label.trim();
  if (!label) throw new Error("room type name is required");

  return withData((data) => {
    const baseSlug = slugify(label);
    if (!baseSlug) throw new Error("room type name is invalid");

    let slug = baseSlug;
    let n = 2;
    while (data.room_types.some((t) => t.slug === slug)) {
      slug = `${baseSlug}-${n}`;
      n += 1;
    }

    const sort_order =
      input.sort_order ??
      (data.room_types.length > 0
        ? Math.max(...data.room_types.map((t) => t.sort_order)) + 1
        : 0);

    const record: RoomTypeRecord = { id: uid(), slug, label, sort_order };
    data.room_types.push(record);
    return record;
  });
}

export function updateRoomType(input: UpdateRoomTypeInput): RoomTypeRecord {
  const label = input.label.trim();
  if (!input.id) throw new Error("room type id is required");
  if (!label) throw new Error("room type name is required");

  return withData((data) => {
    const idx = data.room_types.findIndex((t) => t.id === input.id);
    if (idx < 0) throw new Error("room type not found");

    const current = data.room_types[idx]!;
    const record: RoomTypeRecord = {
      ...current,
      label,
      sort_order: input.sort_order ?? current.sort_order,
    };
    data.room_types[idx] = record;
    return record;
  });
}

export function deleteRoomType(id: string): void {
  if (!id) throw new Error("room type id is required");

  withData((data) => {
    const record = data.room_types.find((t) => t.id === id);
    if (!record) throw new Error("room type not found");
    if (data.rooms.some((r) => r.type === record.slug)) {
      throw new Error("cannot delete a room type that still has rooms assigned");
    }
    if (
      data.reservations.some(
        (r) =>
          !r.room_id &&
          r.room_type === record.slug &&
          (r.status === "booked" || r.status === "checked_in"),
      )
    ) {
      throw new Error("cannot delete a room type with active unallocated bookings");
    }
    data.room_types = data.room_types.filter((t) => t.id !== id);
  });
}

export function listRooms(): Room[] {
  return [...read().rooms].sort((a, b) => a.number.localeCompare(b.number));
}

export function createRoom(input: CreateRoomInput): Room {
  const number = input.number.trim();
  if (!number) throw new Error("room number is required");
  if (!roomTypeSlugs(read()).has(input.type)) {
    throw new Error(`invalid room type: ${input.type}`);
  }
  const status = input.status || "available";
  if (!ROOM_STATUSES.has(status)) throw new Error(`invalid room status: ${status}`);
  if (input.rate < 0) throw new Error("rate cannot be negative");

  return withData((data) => {
    if (data.rooms.some((r) => r.number === number)) {
      throw new Error("room number already exists");
    }
    const room: Room = {
      id: uid(),
      number,
      type: input.type,
      floor: input.floor,
      status,
      rate: input.rate,
    };
    data.rooms.push(room);
    return room;
  });
}

export function updateRoom(input: UpdateRoomInput): Room {
  const number = input.number.trim();
  if (!input.id) throw new Error("room id is required");
  if (!number) throw new Error("room number is required");
  if (!roomTypeSlugs(read()).has(input.type)) {
    throw new Error(`invalid room type: ${input.type}`);
  }
  if (!ROOM_STATUSES.has(input.status)) throw new Error(`invalid room status: ${input.status}`);
  if (input.rate < 0) throw new Error("rate cannot be negative");

  return withData((data) => {
    const idx = data.rooms.findIndex((r) => r.id === input.id);
    if (idx < 0) throw new Error("room not found");
    if (data.rooms.some((r) => r.number === number && r.id !== input.id)) {
      throw new Error("room number already exists");
    }
    const room: Room = {
      id: input.id,
      number,
      type: input.type,
      floor: input.floor,
      status: input.status,
      rate: input.rate,
    };
    data.rooms[idx] = room;
    return room;
  });
}

export function setRoomStatus(id: string, status: string): Room {
  if (!id) throw new Error("room id is required");
  if (!ROOM_STATUSES.has(status)) throw new Error(`invalid room status: ${status}`);

  return withData((data) => {
    const room = data.rooms.find((r) => r.id === id);
    if (!room) throw new Error("room not found");
    room.status = status;
    return { ...room };
  });
}

export function listGuests(): Guest[] {
  return [...read().guests].sort((a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`),
  );
}

export function getGuest(id: string): Guest {
  if (!id) throw new Error("guest id is required");
  const guest = read().guests.find((g) => g.id === id);
  if (!guest) throw new Error("guest not found");
  return guest;
}

export function createGuest(input: CreateGuestInput): Guest {
  const first_name = input.first_name.trim();
  const last_name = input.last_name.trim();
  if (!first_name || !last_name) throw new Error("first and last name are required");

  return withData((data) => {
    const guest: Guest = {
      id: uid(),
      first_name,
      last_name,
      email: input.email,
      phone: input.phone,
      id_document: input.id_document,
      organization: input.organization,
      address_line1: input.address_line1,
      address_line2: input.address_line2,
      city: input.city,
      country: input.country,
      postal_code: input.postal_code,
      id_document_type: input.id_document_type,
    };
    data.guests.push(guest);
    return guest;
  });
}

export function updateGuest(input: UpdateGuestInput): Guest {
  const first_name = input.first_name.trim();
  const last_name = input.last_name.trim();
  if (!input.id) throw new Error("guest id is required");
  if (!first_name || !last_name) throw new Error("first and last name are required");

  return withData((data) => {
    const idx = data.guests.findIndex((g) => g.id === input.id);
    if (idx < 0) throw new Error("guest not found");
    const guest: Guest = {
      id: input.id,
      first_name,
      last_name,
      email: input.email,
      phone: input.phone,
      id_document: input.id_document,
      organization: input.organization,
      address_line1: input.address_line1,
      address_line2: input.address_line2,
      city: input.city,
      country: input.country,
      postal_code: input.postal_code,
      id_document_type: input.id_document_type,
    };
    data.guests[idx] = guest;
    data.reservations = data.reservations.map((r) =>
      r.guest_id === guest.id
        ? { ...r, guest_name: `${guest.first_name} ${guest.last_name}` }
        : r,
    );
    return guest;
  });
}

export function listReservations(): Reservation[] {
  const data = read();
  return data.reservations
    .map((r) => enrichReservation(data, r))
    .sort((a, b) => b.check_in.localeCompare(a.check_in) || b.created_at.localeCompare(a.created_at));
}

export function createReservation(input: CreateReservationInput): Reservation {
  const allocated = Boolean(input.room_id);
  const unallocated = Boolean(input.room_type);
  if (!input.guest_id && !input.guest) throw new Error("guest is required");
  if (!allocated && !unallocated) {
    throw new Error("a room or room type is required");
  }
  if (allocated && unallocated) {
    throw new Error("choose either a specific room or an unallocated room type");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.check_in)) throw new Error("invalid check-in date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.check_out)) throw new Error("invalid check-out date");
  if (input.check_out <= input.check_in) throw new Error("check-out must be after check-in");

  return withData((data) => {
    let guest_id = input.guest_id;
    if (!guest_id && input.guest) {
      const first_name = input.guest.first_name.trim();
      const last_name = input.guest.last_name.trim();
      if (!first_name || !last_name) {
        throw new Error("first and last name are required");
      }
      const guest: Guest = {
        id: uid(),
        first_name,
        last_name,
        email: input.guest.email,
        phone: input.guest.phone,
        id_document: input.guest.id_document,
        organization: input.guest.organization,
        address_line1: input.guest.address_line1,
        address_line2: input.guest.address_line2,
        city: input.guest.city,
        country: input.guest.country,
        postal_code: input.guest.postal_code,
        id_document_type: input.guest.id_document_type,
      };
      data.guests.push(guest);
      guest_id = guest.id;
    }

    if (!guest_id || !data.guests.some((g) => g.id === guest_id)) {
      throw new Error("guest not found");
    }

    if (allocated) {
      if (!data.rooms.some((r) => r.id === input.room_id)) throw new Error("room not found");

      const overlap = data.reservations.some(
        (r) =>
          r.room_id === input.room_id &&
          (r.status === "booked" || r.status === "checked_in") &&
          r.check_in < input.check_out &&
          r.check_out > input.check_in,
      );
      if (overlap) throw new Error("room already has a booking overlapping these dates");
    } else if (!roomTypeSlugs(data).has(input.room_type!)) {
      throw new Error(`invalid room type: ${input.room_type}`);
    }

    const now = new Date().toISOString();
    const deposit = input.amount_paid ?? 0;
    const payment_collect: PaymentCollect = input.payment_collect ?? "property";
    const assignedRoom = allocated
      ? data.rooms.find((r) => r.id === input.room_id)
      : undefined;

    const reservation: Reservation = {
      id: uid(),
      guest_id,
      room_id: allocated ? input.room_id : "",
      room_type: unallocated ? input.room_type : undefined,
      check_in: input.check_in,
      check_out: input.check_out,
      status: "booked",
      notes: input.notes,
      guest_comments: input.guest_comments,
      adults: input.adults ?? 1,
      children: input.children ?? 0,
      infants: input.infants ?? 0,
      room_amount: input.room_amount,
      extra_person: input.extra_person ?? 0,
      discount: input.discount ?? 0,
      amount_paid: 0,
      hold_rate: input.hold_rate ?? true,
      booking_source: input.booking_source,
      payment_collect,
      arrival_time: input.arrival_time,
      reference:
        input.reference?.trim() ||
        `HMS-${now.slice(0, 10).replace(/-/g, "")}-${uid().slice(0, 4).toUpperCase()}`,
      created_at: now,
      updated_at: now,
    };
    data.reservations.push(reservation);

    logBookingActivity(data, "booking_created", reservation, {
      description: `New booking · ${reservation.reference ?? reservation.id.slice(0, 8)}`,
      created_at: now,
    });

    const stayAmount = stayTotal(reservation, assignedRoom);
    const paymentMethod =
      payment_collect === "channel" ? ("channel" as const) : ("card" as const);

    if (deposit > 0) {
      data.folio_lines.push({
        id: uid(),
        reservation_id: reservation.id,
        type: "payment",
        description:
          payment_collect === "channel"
            ? `Prepaid via ${input.booking_source ?? "channel"}`
            : "Deposit / prepayment",
        amount: Math.round(deposit * 100) / 100,
        method: paymentMethod,
        created_at: now,
      });
      syncAmountPaid(data, reservation.id);
      logBookingActivity(data, "payment_received", reservation, {
        amount: Math.round(deposit * 100) / 100,
        description: "Deposit / prepayment",
        created_at: now,
      });
    } else if (payment_collect === "channel" && stayAmount > 0) {
      data.folio_lines.push({
        id: uid(),
        reservation_id: reservation.id,
        type: "payment",
        description: `Prepaid via ${input.booking_source ?? "channel"}`,
        amount: Math.round(stayAmount * 100) / 100,
        method: "channel",
        created_at: now,
      });
      syncAmountPaid(data, reservation.id);
      logBookingActivity(data, "payment_received", reservation, {
        amount: Math.round(stayAmount * 100) / 100,
        description: `Prepaid via ${input.booking_source ?? "channel"}`,
        created_at: now,
      });
    }

    const enriched = enrichReservation(data, reservation);
    const guest = data.guests.find((g) => g.id === guest_id);
    if (guest?.email) {
      const rendered = renderMessageTemplate("confirmation", enriched, guest);
      data.guest_messages.push({
        id: uid(),
        reservation_id: reservation.id,
        guest_id: guest_id!,
        kind: "confirmation",
        channel: "email",
        subject: rendered.subject,
        body: rendered.body,
        status: "sent",
        sent_at: now,
        created_at: now,
      });
    }

    return enrichReservation(data, reservation);
  });
}

export function cancelReservation(id: string): Reservation {
  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error("reservation not found");
    if (reservation.status !== "booked") {
      throw new Error("only booked reservations can be cancelled");
    }
    reservation.status = "cancelled";
    reservation.updated_at = new Date().toISOString();
    logBookingActivity(data, "booking_cancelled", reservation, {
      description: "Booking cancelled by staff",
      created_at: reservation.updated_at,
    });
    return enrichReservation(data, reservation);
  });
}

export function updateReservationPayment(
  input: UpdateReservationPaymentInput,
): Reservation {
  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === input.id);
    if (!reservation) throw new Error("reservation not found");
    reservation.payment_collect = input.payment_collect;
    reservation.updated_at = new Date().toISOString();
    return enrichReservation(data, reservation);
  });
}

export function checkIn(id: string): Reservation {
  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error("reservation not found");
    if (reservation.status !== "booked") {
      throw new Error("only booked reservations can be checked in");
    }
    const room = data.rooms.find((r) => r.id === reservation.room_id);
    if (!room) throw new Error("assign a room before checking in");
    if (room.status === "maintenance") throw new Error("room is under maintenance");

    reservation.status = "checked_in";
    reservation.updated_at = new Date().toISOString();
    room.status = "occupied";
    logBookingActivity(data, "check_in", reservation, {
      created_at: reservation.updated_at,
    });
    return enrichReservation(data, reservation);
  });
}

export function checkOut(id: string): Reservation {
  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error("reservation not found");
    if (reservation.status !== "checked_in") {
      throw new Error("only checked-in reservations can be checked out");
    }
    const room = data.rooms.find((r) => r.id === reservation.room_id);
    if (!room) throw new Error("room not found");

    const lines = data.folio_lines.filter((l) => l.reservation_id === id);
    const { due } = folioBalance(reservation, room, lines);
    if (due > 0.009) {
      throw new Error(
        `settle folio before checkout (amount due ${due.toFixed(2)})`,
      );
    }

    reservation.status = "checked_out";
    reservation.updated_at = new Date().toISOString();
    room.status = "cleaning";
    logBookingActivity(data, "check_out", reservation, {
      created_at: reservation.updated_at,
    });
    revokeActiveKeyCards(
      data,
      reservation,
      "Key card revoked at check-out",
      reservation.updated_at,
    );
    return enrichReservation(data, reservation);
  });
}

/** Kills any live card for a stay; the door should stop opening immediately. */
function revokeActiveKeyCards(
  data: StoreData,
  reservation: Reservation,
  description: string,
  at: string,
): void {
  for (const card of data.key_cards) {
    if (card.reservation_id !== reservation.id) continue;
    if (card.status !== "active") continue;

    card.status = "revoked";
    card.revoked_at = at;
    card.updated_at = at;
    logBookingActivity(data, "key_revoked", reservation, {
      description,
      created_at: at,
    });
  }
}

export function moveReservationRoom(
  input: MoveReservationRoomInput,
): Reservation {
  if (!input.room_id) throw new Error("choose a room to move into");

  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === input.id);
    if (!reservation) throw new Error("reservation not found");
    if (reservation.status === "cancelled") {
      throw new Error("cancelled bookings cannot be moved");
    }
    if (reservation.status === "checked_out") {
      throw new Error("checked-out bookings cannot be moved");
    }
    if (reservation.room_id === input.room_id) {
      throw new Error("booking is already in that room");
    }

    const target = data.rooms.find((r) => r.id === input.room_id);
    if (!target) throw new Error("room not found");
    if (target.status === "maintenance") {
      throw new Error("room is under maintenance");
    }

    const overlap = data.reservations.some(
      (r) =>
        r.id !== reservation.id &&
        r.room_id === target.id &&
        (r.status === "booked" || r.status === "checked_in") &&
        r.check_in < reservation.check_out &&
        r.check_out > reservation.check_in,
    );
    if (overlap) {
      throw new Error("target room already has a booking for these dates");
    }

    const previous = data.rooms.find((r) => r.id === reservation.room_id);
    const previousLabel = previous ? `Room ${previous.number}` : "Unallocated";

    if (reservation.status === "checked_in") {
      if (previous) previous.status = "cleaning";
      target.status = "occupied";
    }

    reservation.room_id = target.id;
    reservation.room_type = undefined;
    reservation.updated_at = new Date().toISOString();

    // The key encodes the room, so any live card must be re-written.
    revokeActiveKeyCards(
      data,
      reservation,
      "Key card revoked after room move",
      reservation.updated_at,
    );

    logBookingActivity(data, "room_moved", reservation, {
      description: `Moved from ${previousLabel} to Room ${target.number}`,
      created_at: reservation.updated_at,
    });

    return enrichReservation(data, reservation);
  });
}

function keyCardCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i += 1) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function keyCardPayload(
  data: StoreData,
  reservation: Reservation,
  code: string,
): string {
  const room = data.rooms.find((r) => r.id === reservation.room_id);
  return JSON.stringify({
    ref: reservation.reference ?? reservation.id.slice(0, 8).toUpperCase(),
    room: room?.number ?? "",
    in: reservation.check_in,
    out: reservation.check_out,
    key: code,
  });
}

export function listKeyCards(reservationId?: string): KeyCard[] {
  const cards = read().key_cards;
  const filtered = reservationId
    ? cards.filter((c) => c.reservation_id === reservationId)
    : [...cards];
  return filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function writeKeyCard(input: WriteKeyCardInput): KeyCard {
  return withData((data) => {
    const reservation = data.reservations.find(
      (r) => r.id === input.reservation_id,
    );
    if (!reservation) throw new Error("reservation not found");
    if (reservation.status === "cancelled") {
      throw new Error("cannot encode a key for a cancelled booking");
    }
    if (reservation.status === "checked_out") {
      throw new Error("cannot encode a key for a checked-out booking");
    }
    if (!reservation.room_id) {
      throw new Error("assign a room before encoding a key card");
    }

    const now = new Date().toISOString();
    const code = keyCardCode();
    const qr_payload = keyCardPayload(data, reservation, code);

    let card = data.key_cards.find(
      (c) => c.reservation_id === reservation.id,
    );

    if (card) {
      card.room_id = reservation.room_id;
      card.code = code;
      card.qr_payload = qr_payload;
      card.status = "active";
      card.write_count += 1;
      card.written_at = now;
      card.revoked_at = undefined;
      card.updated_at = now;
    } else {
      card = {
        id: uid(),
        reservation_id: reservation.id,
        room_id: reservation.room_id,
        code,
        qr_payload,
        status: "active",
        write_count: 1,
        written_at: now,
        created_at: now,
        updated_at: now,
      };
      data.key_cards.push(card);
    }

    logBookingActivity(data, "key_written", reservation, {
      description:
        card.write_count > 1
          ? `Key card re-written (write ${card.write_count})`
          : "Key card encoded",
      created_at: now,
    });

    return { ...card };
  });
}

export function revokeKeyCard(id: string): KeyCard {
  return withData((data) => {
    const card = data.key_cards.find((c) => c.id === id);
    if (!card) throw new Error("key card not found");
    if (card.status === "revoked") throw new Error("key card already revoked");

    const now = new Date().toISOString();
    card.status = "revoked";
    card.revoked_at = now;
    card.updated_at = now;

    const reservation = data.reservations.find(
      (r) => r.id === card.reservation_id,
    );
    if (reservation) {
      logBookingActivity(data, "key_revoked", reservation, {
        created_at: now,
      });
    }

    return { ...card };
  });
}

function syncAmountPaid(data: StoreData, reservationId: string) {
  const reservation = data.reservations.find((r) => r.id === reservationId);
  if (!reservation) return;
  const lines = data.folio_lines.filter((l) => l.reservation_id === reservationId);
  reservation.amount_paid = Math.max(0, folioPaymentsNet(lines));
  reservation.updated_at = new Date().toISOString();
}

export function listFolioLines(reservationId?: string): FolioLine[] {
  const lines = read().folio_lines;
  const filtered = reservationId
    ? lines.filter((l) => l.reservation_id === reservationId)
    : [...lines];
  return filtered.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function createFolioLine(input: CreateFolioLineInput): FolioLine {
  const description = input.description.trim();
  if (!description) throw new Error("description is required");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount must be greater than zero");
  }
  if (!["charge", "payment", "refund"].includes(input.type)) {
    throw new Error("invalid folio line type");
  }

  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === input.reservation_id);
    if (!reservation) throw new Error("reservation not found");
    if (reservation.status === "cancelled") {
      throw new Error("cannot post to a cancelled reservation");
    }

    const line: FolioLine = {
      id: uid(),
      reservation_id: input.reservation_id,
      type: input.type,
      description,
      amount: Math.round(input.amount * 100) / 100,
      method: input.type === "charge" ? undefined : input.method ?? "card",
      created_at: new Date().toISOString(),
    };
    data.folio_lines.push(line);
    syncAmountPaid(data, input.reservation_id);
    if (input.type === "payment") {
      logBookingActivity(data, "payment_received", reservation, {
        amount: line.amount,
        description: line.description,
        created_at: line.created_at,
      });
    }
    return line;
  });
}

export function deleteFolioLine(id: string): void {
  withData((data) => {
    const idx = data.folio_lines.findIndex((l) => l.id === id);
    if (idx < 0) throw new Error("folio line not found");
    const reservationId = data.folio_lines[idx]!.reservation_id;
    data.folio_lines.splice(idx, 1);
    syncAmountPaid(data, reservationId);
  });
}

export function listBookingActivities(): BookingActivity[] {
  const data = read();
  return [...data.booking_activities].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

export function listGuestMessages(reservationId?: string): GuestMessage[] {
  const messages = read().guest_messages;
  const filtered = reservationId
    ? messages.filter((m) => m.reservation_id === reservationId)
    : [...messages];
  return filtered.sort((a, b) =>
    (b.sent_at ?? b.created_at).localeCompare(a.sent_at ?? a.created_at),
  );
}

export function sendGuestMessage(input: SendGuestMessageInput): GuestMessage {
  return withData((data) => {
    const reservation = data.reservations.find((r) => r.id === input.reservation_id);
    if (!reservation) throw new Error("reservation not found");
    const guest = data.guests.find((g) => g.id === reservation.guest_id);

    let subject = input.subject?.trim() ?? "";
    let body = input.body?.trim() ?? "";
    if (input.kind !== "custom") {
      const rendered = renderMessageTemplate(input.kind, enrichReservation(data, reservation), guest);
      if (!subject) subject = rendered.subject;
      if (!body) body = rendered.body;
    }
    if (!subject || !body) throw new Error("subject and body are required");

    const now = new Date().toISOString();
    const message: GuestMessage = {
      id: uid(),
      reservation_id: reservation.id,
      guest_id: reservation.guest_id,
      kind: input.kind,
      channel: input.channel ?? "email",
      subject,
      body,
      status: "sent",
      sent_at: now,
      created_at: now,
    };
    data.guest_messages.push(message);
    return message;
  });
}

export function listHousekeeping(date?: string): HousekeepingRecord[] {
  const records = read().housekeeping;
  if (!date) return [...records];
  return records.filter((r) => r.date === date);
}

function defaultCleaningStatus(room: Room): HousekeepingRecord["cleaning_status"] {
  if (room.status === "cleaning") return "in_progress";
  if (room.status === "available") return "clean";
  if (room.status === "maintenance") return "pending";
  return "pending";
}

export function upsertHousekeeping(
  input: UpdateHousekeepingInput,
): HousekeepingRecord {
  if (!input.room_id) throw new Error("room id is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("invalid date");

  return withData((data) => {
    const room = data.rooms.find((r) => r.id === input.room_id);
    if (!room) throw new Error("room not found");

    const idx = data.housekeeping.findIndex(
      (r) => r.room_id === input.room_id && r.date === input.date,
    );
    const now = new Date().toISOString();
    const current = idx >= 0 ? data.housekeeping[idx]! : null;

    const record: HousekeepingRecord = {
      room_id: input.room_id,
      date: input.date,
      cleaning_status:
        input.cleaning_status ??
        current?.cleaning_status ??
        defaultCleaningStatus(room),
      note: input.note ?? current?.note ?? "",
      updated_at: now,
    };

    if (idx >= 0) data.housekeeping[idx] = record;
    else data.housekeeping.push(record);

    if (input.cleaning_status === "clean" || input.cleaning_status === "inspected") {
      if (room.status === "cleaning") room.status = "available";
    }
    if (input.cleaning_status === "in_progress" && room.status === "available") {
      room.status = "cleaning";
    }

    return record;
  });
}

export function listRatePlans(roomTypeSlug?: string): RatePlan[] {
  const plans = read().rate_plans;
  const filtered = roomTypeSlug
    ? plans.filter((p) => p.room_type_slug === roomTypeSlug)
    : plans;
  return [...filtered].sort(
    (a, b) =>
      a.room_type_slug.localeCompare(b.room_type_slug) ||
      a.sort_order - b.sort_order ||
      a.label.localeCompare(b.label),
  );
}

export function listRateEntries(from?: string, to?: string): RateEntry[] {
  const entries = read().rate_entries;
  if (!from && !to) return [...entries];
  return entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });
}

function countBookedRooms(
  data: StoreData,
  roomTypeSlug: string,
  date: string,
): number {
  const roomIds = new Set(
    data.rooms.filter((r) => r.type === roomTypeSlug).map((r) => r.id),
  );
  return data.reservations.filter(
    (r) =>
      roomIds.has(r.room_id) &&
      (r.status === "booked" || r.status === "checked_in") &&
      r.check_in <= date &&
      r.check_out > date,
  ).length;
}

function defaultAvailability(data: StoreData, plan: RatePlan, date: string): number {
  const total = data.rooms.filter((r) => r.type === plan.room_type_slug).length;
  return Math.max(0, total - countBookedRooms(data, plan.room_type_slug, date));
}

export function upsertRateEntry(input: UpsertRateEntryInput): RateEntry {
  if (!input.rate_plan_id) throw new Error("rate plan id is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("invalid date");

  return withData((data) => {
    const plan = data.rate_plans.find((p) => p.id === input.rate_plan_id);
    if (!plan) throw new Error("rate plan not found");

    const idx = data.rate_entries.findIndex(
      (e) => e.rate_plan_id === input.rate_plan_id && e.date === input.date,
    );
    const now = new Date().toISOString();
    const current = idx >= 0 ? data.rate_entries[idx]! : null;

    const record: RateEntry = {
      rate_plan_id: input.rate_plan_id,
      date: input.date,
      rate: input.rate ?? current?.rate ?? plan.base_rate,
      availability:
        input.availability ??
        current?.availability ??
        defaultAvailability(data, plan, input.date),
      updated_at: now,
    };

    if (idx >= 0) data.rate_entries[idx] = record;
    else data.rate_entries.push(record);

    return record;
  });
}

export function bulkUpdateRates(input: BulkRateUpdateInput): number {
  if (!input.rate_plan_ids.length) throw new Error("select at least one package");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_from)) throw new Error("invalid start date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_to)) throw new Error("invalid end date");
  if (input.date_to < input.date_from) throw new Error("end date must be after start date");
  if (input.value < 0) throw new Error("value cannot be negative");

  return withData((data) => {
    let updated = 0;
    const weekdaySet = new Set(input.weekdays);

    for (const planId of input.rate_plan_ids) {
      const plan = data.rate_plans.find((p) => p.id === planId);
      if (!plan) continue;

      let cursor = input.date_from;
      while (cursor <= input.date_to) {
        const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
        if (weekdaySet.size === 0 || weekdaySet.has(weekday)) {
          const patch: UpsertRateEntryInput = {
            rate_plan_id: planId,
            date: cursor,
          };
          if (input.field === "rate") patch.rate = input.value;
          else patch.availability = input.value;

          const idx = data.rate_entries.findIndex(
            (e) => e.rate_plan_id === planId && e.date === cursor,
          );
          const now = new Date().toISOString();
          const current = idx >= 0 ? data.rate_entries[idx]! : null;
          const record: RateEntry = {
            rate_plan_id: planId,
            date: cursor,
            rate:
              patch.rate ?? current?.rate ?? plan.base_rate,
            availability:
              patch.availability ??
              current?.availability ??
              defaultAvailability(data, plan, cursor),
            updated_at: now,
          };
          if (idx >= 0) data.rate_entries[idx] = record;
          else data.rate_entries.push(record);
          updated += 1;
        }
        cursor = addDays(cursor, 1);
      }
    }

    return updated;
  });
}

export function listChannels(): Channel[] {
  return [...read().channels].sort((a, b) => a.sort_order - b.sort_order);
}

export function updateChannel(input: UpdateChannelInput): Channel {
  if (!input.id) throw new Error("channel id is required");

  return withData((data) => {
    const idx = data.channels.findIndex((c) => c.id === input.id);
    if (idx < 0) throw new Error("channel not found");

    const current = data.channels[idx]!;
    const channel: Channel = {
      ...current,
      status: input.status ?? current.status,
      mapped_count: input.mapped_count ?? current.mapped_count,
      is_connected: input.is_connected ?? current.is_connected,
      has_warning:
        input.status === "inactive" ? current.has_warning : false,
    };
    data.channels[idx] = channel;
    return channel;
  });
}

export function reorderChannels(orderedIds: string[]): Channel[] {
  if (!orderedIds.length) throw new Error("channel order is required");

  return withData((data) => {
    const map = new Map(data.channels.map((c) => [c.id, c]));
    orderedIds.forEach((id, sort_order) => {
      const channel = map.get(id);
      if (channel) channel.sort_order = sort_order;
    });
    return [...data.channels].sort((a, b) => a.sort_order - b.sort_order);
  });
}

export function listChannelRateEntries(
  channelId?: string,
  from?: string,
  to?: string,
): ChannelRateEntry[] {
  let entries = read().channel_rate_entries;
  if (channelId) entries = entries.filter((e) => e.channel_id === channelId);
  if (from || to) {
    entries = entries.filter((e) => {
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      return true;
    });
  }
  return [...entries];
}

export function upsertChannelRateEntry(
  input: UpsertChannelRateEntryInput,
): ChannelRateEntry {
  if (!input.channel_id) throw new Error("channel id is required");
  if (!input.rate_plan_id) throw new Error("rate plan id is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("invalid date");

  return withData((data) => {
    const channel = data.channels.find((c) => c.id === input.channel_id);
    if (!channel) throw new Error("channel not found");

    const plan = data.rate_plans.find((p) => p.id === input.rate_plan_id);
    if (!plan) throw new Error("rate plan not found");

    const idx = data.channel_rate_entries.findIndex(
      (e) =>
        e.channel_id === input.channel_id &&
        e.rate_plan_id === input.rate_plan_id &&
        e.date === input.date,
    );

    const baseEntry = data.rate_entries.find(
      (e) => e.rate_plan_id === input.rate_plan_id && e.date === input.date,
    );
    const now = new Date().toISOString();
    const current = idx >= 0 ? data.channel_rate_entries[idx]! : null;

    const record: ChannelRateEntry = {
      channel_id: input.channel_id,
      rate_plan_id: input.rate_plan_id,
      date: input.date,
      rate: input.rate ?? current?.rate ?? baseEntry?.rate ?? plan.base_rate,
      availability:
        input.availability ??
        current?.availability ??
        baseEntry?.availability ??
        defaultAvailability(data, plan, input.date),
      sync_status: "pending",
      updated_at: now,
      last_synced_at: current?.last_synced_at,
    };

    if (idx >= 0) data.channel_rate_entries[idx] = record;
    else data.channel_rate_entries.push(record);

    return record;
  });
}

export function bulkUpdateChannelRates(input: BulkChannelRateUpdateInput): number {
  if (!input.channel_id) throw new Error("channel id is required");
  if (!input.rate_plan_ids.length) throw new Error("select at least one rate plan");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_from)) throw new Error("invalid start date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_to)) throw new Error("invalid end date");
  if (input.date_to < input.date_from) throw new Error("end date must be after start date");
  if (input.value < 0) throw new Error("value cannot be negative");

  return withData((data) => {
    const channel = data.channels.find((c) => c.id === input.channel_id);
    if (!channel) throw new Error("channel not found");

    let updated = 0;
    let cursor = input.date_from;

    while (cursor <= input.date_to) {
      const weekday = new Date(`${cursor}T00:00:00`).getUTCDay();
      if (input.weekdays.includes(weekday)) {
        for (const planId of input.rate_plan_ids) {
          const plan = data.rate_plans.find((p) => p.id === planId);
          if (!plan) continue;

          const idx = data.channel_rate_entries.findIndex(
            (e) =>
              e.channel_id === input.channel_id &&
              e.rate_plan_id === planId &&
              e.date === cursor,
          );
          const now = new Date().toISOString();
          const baseEntry = data.rate_entries.find(
            (e) => e.rate_plan_id === planId && e.date === cursor,
          );
          const current = idx >= 0 ? data.channel_rate_entries[idx]! : null;

          const record: ChannelRateEntry = {
            channel_id: input.channel_id,
            rate_plan_id: planId,
            date: cursor,
            rate:
              input.field === "rate"
                ? input.value
                : (current?.rate ?? baseEntry?.rate ?? plan.base_rate),
            availability:
              input.field === "availability"
                ? input.value
                : (current?.availability ??
                  baseEntry?.availability ??
                  defaultAvailability(data, plan, cursor)),
            sync_status: "pending",
            updated_at: now,
            last_synced_at: current?.last_synced_at,
          };

          if (idx >= 0) data.channel_rate_entries[idx] = record;
          else data.channel_rate_entries.push(record);
          updated += 1;
        }
      }
      cursor = addDays(cursor, 1);
    }

    return updated;
  });
}

export function syncChannelRates(channelId: string): number {
  if (!channelId) throw new Error("channel id is required");

  return withData((data) => {
    const channelIdx = data.channels.findIndex((c) => c.id === channelId);
    if (channelIdx < 0) throw new Error("channel not found");

    const now = new Date().toISOString();
    let synced = 0;

    for (const entry of data.channel_rate_entries) {
      if (entry.channel_id !== channelId) continue;
      if (entry.sync_status === "pending") {
        entry.sync_status = "synced";
        entry.last_synced_at = now;
        synced += 1;
      }
    }

    data.channels[channelIdx] = {
      ...data.channels[channelIdx]!,
      last_synced_at: now,
      has_warning: false,
    };

    return synced;
  });
}

const YIELD_RULE_TYPES = new Set([
  "min_stay",
  "max_stay",
  "stop_sell",
  "closed_to_arrival",
  "closed_to_departure",
  "rate_adjustment",
]);

export function listYieldRules(): YieldRule[] {
  return [...read().yield_rules].sort(
    (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
  );
}

export function createYieldRule(input: CreateYieldRuleInput): YieldRule {
  const name = input.name.trim();
  if (!name) throw new Error("rule name is required");
  if (!YIELD_RULE_TYPES.has(input.rule_type)) throw new Error("invalid rule type");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_from)) throw new Error("invalid start date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_to)) throw new Error("invalid end date");
  if (input.date_to < input.date_from) throw new Error("end date must be after start date");
  if (input.value < 0) throw new Error("value cannot be negative");

  return withData((data) => {
    if (
      input.room_type_slug !== "all" &&
      !roomTypeSlugs(data).has(input.room_type_slug)
    ) {
      throw new Error(`invalid room type: ${input.room_type_slug}`);
    }

    const now = new Date().toISOString();
    const rule: YieldRule = {
      id: uid(),
      name,
      rule_type: input.rule_type,
      room_type_slug: input.room_type_slug,
      date_from: input.date_from,
      date_to: input.date_to,
      value: input.value,
      status: input.status ?? "active",
      priority:
        input.priority ??
        (data.yield_rules.length > 0
          ? Math.max(...data.yield_rules.map((r) => r.priority)) + 1
          : 1),
      created_at: now,
      updated_at: now,
    };
    data.yield_rules.push(rule);
    return rule;
  });
}

export function updateYieldRule(input: UpdateYieldRuleInput): YieldRule {
  const name = input.name.trim();
  if (!input.id) throw new Error("rule id is required");
  if (!name) throw new Error("rule name is required");
  if (!YIELD_RULE_TYPES.has(input.rule_type)) throw new Error("invalid rule type");
  if (input.date_to < input.date_from) throw new Error("end date must be after start date");

  return withData((data) => {
    const idx = data.yield_rules.findIndex((r) => r.id === input.id);
    if (idx < 0) throw new Error("yield rule not found");

    const rule: YieldRule = {
      ...data.yield_rules[idx]!,
      name,
      rule_type: input.rule_type,
      room_type_slug: input.room_type_slug,
      date_from: input.date_from,
      date_to: input.date_to,
      value: input.value,
      status: input.status ?? data.yield_rules[idx]!.status,
      priority: input.priority ?? data.yield_rules[idx]!.priority,
      updated_at: new Date().toISOString(),
    };
    data.yield_rules[idx] = rule;
    return rule;
  });
}

export function deleteYieldRule(id: string): void {
  if (!id) throw new Error("rule id is required");
  withData((data) => {
    if (!data.yield_rules.some((r) => r.id === id)) {
      throw new Error("yield rule not found");
    }
    data.yield_rules = data.yield_rules.filter((r) => r.id !== id);
  });
}

export function toggleYieldRule(id: string): YieldRule {
  return withData((data) => {
    const rule = data.yield_rules.find((r) => r.id === id);
    if (!rule) throw new Error("yield rule not found");
    rule.status = rule.status === "active" ? "inactive" : "active";
    rule.updated_at = new Date().toISOString();
    return { ...rule };
  });
}

export function getDashboardStats(): DashboardStats {
  const data = read();
  const today = todayISO();
  return {
    available_rooms: data.rooms.filter((r) => r.status === "available").length,
    occupied_rooms: data.rooms.filter((r) => r.status === "occupied").length,
    total_guests: data.guests.length,
    arrivals_today: data.reservations.filter(
      (r) => r.check_in === today && r.status === "booked",
    ).length,
    departures_today: data.reservations.filter(
      (r) => r.check_out === today && r.status === "checked_in",
    ).length,
    booked_active: data.reservations.filter((r) => r.status === "booked").length,
  };
}

/**
 * Version-keyed snapshot cache. `useSyncExternalStore` compares snapshots by
 * identity, so each derived list is rebuilt only when the store changes.
 */
type Snapshot = {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  room_types: RoomTypeRecord[];
  housekeeping: HousekeepingRecord[];
  rate_plans: RatePlan[];
  rate_entries: RateEntry[];
  channels: Channel[];
  channel_rate_entries: ChannelRateEntry[];
  yield_rules: YieldRule[];
  folio_lines: FolioLine[];
  guest_messages: GuestMessage[];
  booking_activities: BookingActivity[];
  key_cards: KeyCard[];
  stats: DashboardStats;
};

const EMPTY_SNAPSHOT: Snapshot = {
  rooms: [],
  guests: [],
  reservations: [],
  room_types: [],
  housekeeping: [],
  rate_plans: [],
  rate_entries: [],
  channels: [],
  channel_rate_entries: [],
  yield_rules: [],
  folio_lines: [],
  guest_messages: [],
  booking_activities: [],
  key_cards: [],
  stats: {
    available_rooms: 0,
    occupied_rooms: 0,
    total_guests: 0,
    arrivals_today: 0,
    departures_today: 0,
    booked_active: 0,
  },
};

let snapshot: Snapshot = EMPTY_SNAPSHOT;
let snapshotVersion = -1;

export function getSnapshot(): Snapshot {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  read();
  if (snapshotVersion !== version) {
    snapshot = {
      rooms: listRooms(),
      guests: listGuests(),
      reservations: listReservations(),
      room_types: listRoomTypes(),
      housekeeping: listHousekeeping(),
      rate_plans: listRatePlans(),
      rate_entries: listRateEntries(),
      channels: listChannels(),
      channel_rate_entries: listChannelRateEntries(),
      yield_rules: listYieldRules(),
      folio_lines: listFolioLines(),
      guest_messages: listGuestMessages(),
      booking_activities: listBookingActivities(),
      key_cards: listKeyCards(),
      stats: getDashboardStats(),
    };
    snapshotVersion = version;
  }
  return snapshot;
}

export function getServerSnapshot(): Snapshot {
  return EMPTY_SNAPSHOT;
}
