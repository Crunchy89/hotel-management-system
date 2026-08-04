import type { Guest, Reservation } from "@/lib/types";

export type ClientChatMessage = {
  id: string;
  reservation_id: string;
  guest_id: string;
  guest_name: string;
  sender: "staff" | "guest";
  body: string;
  created_at: string;
};

const STORAGE_KEY = "hms-client-chat-v1";

let messages: ClientChatMessage[] = [];
const listeners = new Set<() => void>();

function uid() {
  return crypto.randomUUID();
}

function readMessages(): ClientChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClientChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(next: ClientChatMessage[]) {
  messages = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  messages = readMessages();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): ClientChatMessage[] {
  return messages;
}

export function getServerSnapshot(): ClientChatMessage[] {
  return [];
}

export function listClientChatMessages(): ClientChatMessage[] {
  return [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function messagesForReservation(reservationId: string): ClientChatMessage[] {
  return listClientChatMessages().filter((m) => m.reservation_id === reservationId);
}

export type ClientChatThread = {
  reservation_id: string;
  guest_id: string;
  guest_name: string;
  last_message: string;
  last_at: string;
  unread_from_guest: number;
};

export function listClientChatThreads(): ClientChatThread[] {
  const all = listClientChatMessages();
  const map = new Map<string, ClientChatThread>();

  for (const msg of all) {
    const existing = map.get(msg.reservation_id);
    if (!existing || msg.created_at > existing.last_at) {
      map.set(msg.reservation_id, {
        reservation_id: msg.reservation_id,
        guest_id: msg.guest_id,
        guest_name: msg.guest_name,
        last_message: msg.body,
        last_at: msg.created_at,
        unread_from_guest: msg.sender === "guest" ? 1 : 0,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
}

export function seedClientChat(
  reservations: Reservation[],
  guests: Guest[],
): void {
  if (messages.length > 0) return;

  const active = reservations.filter(
    (r) =>
      r.status === "booked" ||
      r.status === "checked_in" ||
      r.status === "checked_out",
  );

  const seeds: Array<[number, string, "staff" | "guest"]> = [
    [0, "Hi, we arrive around 3pm. Is early check-in possible?", "guest"],
    [0, "Hello! We can note an early arrival — check-in from 2pm if the room is ready.", "staff"],
    [1, "Could we get a quiet room away from the elevator?", "guest"],
    [1, "Absolutely, I've added that to your reservation.", "staff"],
    [2, "Do you offer airport transfer?", "guest"],
  ];

  const seeded: ClientChatMessage[] = [];
  const now = Date.now();

  seeds.forEach(([index, body, sender], i) => {
    const reservation = active[index % Math.max(active.length, 1)];
    if (!reservation) return;
    const guest = guests.find((g) => g.id === reservation.guest_id);
    const guestName =
      reservation.guest_name ??
      (guest ? `${guest.first_name} ${guest.last_name}` : "Guest");

    seeded.push({
      id: uid(),
      reservation_id: reservation.id,
      guest_id: reservation.guest_id,
      guest_name: guestName,
      sender,
      body,
      created_at: new Date(now - (seeds.length - i) * 3600000).toISOString(),
    });
  });

  if (seeded.length > 0) persist(seeded);
}

export function sendClientChatMessage(input: {
  reservation_id: string;
  guest_id: string;
  guest_name: string;
  body: string;
  sender?: "staff" | "guest";
}): ClientChatMessage {
  const trimmed = input.body.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  const message: ClientChatMessage = {
    id: uid(),
    reservation_id: input.reservation_id,
    guest_id: input.guest_id,
    guest_name: input.guest_name,
    sender: input.sender ?? "staff",
    body: trimmed,
    created_at: new Date().toISOString(),
  };

  persist([...messages, message]);
  return message;
}
