import type {
  CreateGuestInput,
  CreateReservationInput,
  CreateRoomInput,
  DashboardStats,
  Guest,
  Reservation,
  Room,
  UpdateGuestInput,
  UpdateRoomInput,
} from "@/lib/types";

const STORAGE_KEY = "hms-hotel-data-v2";

type StoreData = {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
};

const ROOM_TYPES = new Set([
  "standard",
  "twin",
  "deluxe",
  "suite",
  "family",
]);
const ROOM_STATUSES = new Set(["available", "occupied", "cleaning", "maintenance"]);

function uid() {
  return crypto.randomUUID();
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

  return { rooms, guests, reservations };
}

const EMPTY_DATA: StoreData = { rooms: [], guests: [], reservations: [] };

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

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      cache = JSON.parse(raw) as StoreData;
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
  return {
    ...reservation,
    guest_name: guest ? `${guest.first_name} ${guest.last_name}` : reservation.guest_name,
    room_number: room?.number ?? reservation.room_number,
  };
}

export function listRooms(): Room[] {
  return [...read().rooms].sort((a, b) => a.number.localeCompare(b.number));
}

export function createRoom(input: CreateRoomInput): Room {
  const number = input.number.trim();
  if (!number) throw new Error("room number is required");
  if (!ROOM_TYPES.has(input.type)) throw new Error(`invalid room type: ${input.type}`);
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
  if (!ROOM_TYPES.has(input.type)) throw new Error(`invalid room type: ${input.type}`);
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
  if (!input.guest_id || !input.room_id) throw new Error("guest and room are required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.check_in)) throw new Error("invalid check-in date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.check_out)) throw new Error("invalid check-out date");
  if (input.check_out <= input.check_in) throw new Error("check-out must be after check-in");

  return withData((data) => {
    if (!data.guests.some((g) => g.id === input.guest_id)) throw new Error("guest not found");
    if (!data.rooms.some((r) => r.id === input.room_id)) throw new Error("room not found");

    const overlap = data.reservations.some(
      (r) =>
        r.room_id === input.room_id &&
        (r.status === "booked" || r.status === "checked_in") &&
        r.check_in < input.check_out &&
        r.check_out > input.check_in,
    );
    if (overlap) throw new Error("room already has a booking overlapping these dates");

    const now = new Date().toISOString();
    const reservation: Reservation = {
      id: uid(),
      guest_id: input.guest_id,
      room_id: input.room_id,
      check_in: input.check_in,
      check_out: input.check_out,
      status: "booked",
      notes: input.notes,
      created_at: now,
      updated_at: now,
    };
    data.reservations.push(reservation);
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
    if (!room) throw new Error("room not found");
    if (room.status === "maintenance") throw new Error("room is under maintenance");

    reservation.status = "checked_in";
    reservation.updated_at = new Date().toISOString();
    room.status = "occupied";
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

    reservation.status = "checked_out";
    reservation.updated_at = new Date().toISOString();
    room.status = "cleaning";
    return enrichReservation(data, reservation);
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
  stats: DashboardStats;
};

const EMPTY_SNAPSHOT: Snapshot = {
  rooms: [],
  guests: [],
  reservations: [],
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
      stats: getDashboardStats(),
    };
    snapshotVersion = version;
  }
  return snapshot;
}

export function getServerSnapshot(): Snapshot {
  return EMPTY_SNAPSHOT;
}
