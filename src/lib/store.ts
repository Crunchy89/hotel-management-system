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

const STORAGE_KEY = "hms-hotel-data-v1";

type StoreData = {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
};

const ROOM_TYPES = new Set(["standard", "deluxe", "suite"]);
const ROOM_STATUSES = new Set(["available", "occupied", "cleaning", "maintenance"]);

function uid() {
  return crypto.randomUUID();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function seedData(): StoreData {
  const rooms: Room[] = [
    { id: uid(), number: "101", type: "standard", floor: 1, status: "available", rate: 120 },
    { id: uid(), number: "102", type: "standard", floor: 1, status: "available", rate: 120 },
    { id: uid(), number: "201", type: "deluxe", floor: 2, status: "available", rate: 180 },
    { id: uid(), number: "202", type: "deluxe", floor: 2, status: "cleaning", rate: 180 },
    { id: uid(), number: "301", type: "suite", floor: 3, status: "available", rate: 320 },
  ];

  const guests: Guest[] = [
    {
      id: uid(),
      first_name: "Ava",
      last_name: "Chen",
      email: "ava.chen@example.com",
      phone: "+1-555-0101",
      id_document: "P1234567",
    },
    {
      id: uid(),
      first_name: "Marcus",
      last_name: "Reid",
      email: "marcus.reid@example.com",
      phone: "+1-555-0102",
      id_document: "P7654321",
    },
    {
      id: uid(),
      first_name: "Sofia",
      last_name: "Martinez",
      email: "sofia.m@example.com",
      phone: "+1-555-0103",
      id_document: "DL998877",
    },
  ];

  const today = todayISO();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const inThree = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const reservations: Reservation[] = [
    {
      id: uid(),
      guest_id: guests[0]!.id,
      room_id: rooms[0]!.id,
      check_in: today,
      check_out: tomorrow,
      status: "booked",
      notes: "Early arrival requested",
      created_at: now,
      updated_at: now,
      guest_name: `${guests[0]!.first_name} ${guests[0]!.last_name}`,
      room_number: rooms[0]!.number,
    },
    {
      id: uid(),
      guest_id: guests[1]!.id,
      room_id: rooms[2]!.id,
      check_in: tomorrow,
      check_out: inThree,
      status: "booked",
      notes: "",
      created_at: now,
      updated_at: now,
      guest_name: `${guests[1]!.first_name} ${guests[1]!.last_name}`,
      room_number: rooms[2]!.number,
    },
  ];

  return { rooms, guests, reservations };
}

function read(): StoreData {
  if (typeof window === "undefined") {
    return { rooms: [], guests: [], reservations: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedData();
    write(seeded);
    return seeded;
  }
  try {
    return JSON.parse(raw) as StoreData;
  } catch {
    const seeded = seedData();
    write(seeded);
    return seeded;
  }
}

function write(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
