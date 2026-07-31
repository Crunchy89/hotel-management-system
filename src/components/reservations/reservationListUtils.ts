import { dayDiff, formatDate } from "@/lib/metrics";
import type { Guest, Reservation, Room } from "@/lib/types";
import { bookingTotals } from "./reservationFormUtils";

export type DateType = "check_in" | "check_out" | "booked";

export type ReservationFilters = {
  lastName: string;
  reference: string;
  invoice: string;
  dateType: DateType;
  status: string;
  dateFrom: string;
  dateTo: string;
  source: string;
};

export type ReservationRow = {
  reservation: Reservation;
  guest?: Guest;
  nights: number;
  total: number;
  amountDue: number;
  displayReference: string;
  displayName: string;
  groupDate: string;
  bookedDate: string;
};

export function defaultFilters(today: string): ReservationFilters {
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCMonth(from.getUTCMonth() - 1);
  const to = new Date(`${today}T00:00:00Z`);
  to.setUTCMonth(to.getUTCMonth() + 1);

  return {
    lastName: "",
    reference: "",
    invoice: "",
    dateType: "check_in",
    status: "all",
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
    source: "all",
  };
}

function reservationDate(reservation: Reservation, dateType: DateType): string {
  if (dateType === "check_out") return reservation.check_out;
  if (dateType === "booked") return reservation.created_at.slice(0, 10);
  return reservation.check_in;
}

function displayReference(reservation: Reservation): string {
  if (reservation.reference?.trim()) return reservation.reference.trim();
  return reservation.id.slice(0, 8).toUpperCase();
}

function displayName(reservation: Reservation, guest?: Guest): string {
  if (guest) return `${guest.last_name}, ${guest.first_name}`;
  const name = reservation.guest_name?.trim();
  if (!name) return "—";
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const last = parts.pop()!;
  return `${last}, ${parts.join(" ")}`;
}

function guestLastName(reservation: Reservation, guest?: Guest): string {
  if (guest) return guest.last_name.toLowerCase();
  const name = reservation.guest_name?.trim();
  if (!name) return "";
  const parts = name.split(/\s+/);
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

export function reservationTotals(
  reservation: Reservation,
  room: Room | undefined,
) {
  const nights = Math.max(0, dayDiff(reservation.check_in, reservation.check_out));
  const formLike = {
    guest_id: reservation.guest_id,
    guest_mode: "existing" as const,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    organization: "",
    address_line1: "",
    address_line2: "",
    city: "",
    country: "",
    postal_code: "",
    id_document_type: "",
    id_document: "",
    room_id: reservation.room_id,
    room_type: reservation.room_type ?? "",
    check_in: reservation.check_in,
    check_out: reservation.check_out,
    hold_rate: reservation.hold_rate ?? true,
    adults: reservation.adults ?? 1,
    children: reservation.children ?? 0,
    infants: reservation.infants ?? 0,
    room_amount: reservation.room_amount ?? 0,
    extra_person: reservation.extra_person ?? 0,
    discount: reservation.discount ?? 0,
    amount_paid: reservation.amount_paid ?? 0,
    booking_source: reservation.booking_source ?? "",
    arrival_time: reservation.arrival_time ?? "",
    reference: reservation.reference ?? "",
    notes: reservation.notes,
    guest_comments: reservation.guest_comments ?? "",
  };

  const totals = bookingTotals(formLike, room, nights);
  return {
    nights,
    total: totals.grandTotal,
    amountDue: totals.amountDue,
  };
}

export function filterReservations(
  reservations: Reservation[],
  guests: Guest[],
  rooms: Room[],
  filters: ReservationFilters,
): ReservationRow[] {
  const guestById = new Map(guests.map((g) => [g.id, g]));
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const lastNameQ = filters.lastName.trim().toLowerCase();
  const referenceQ = filters.reference.trim().toLowerCase();
  const invoiceQ = filters.invoice.trim().toLowerCase();

  const rows: ReservationRow[] = [];

  for (const reservation of reservations) {
    const guest = guestById.get(reservation.guest_id);
    const room = roomById.get(reservation.room_id);
    const ref = displayReference(reservation);

    if (lastNameQ && !guestLastName(reservation, guest).includes(lastNameQ)) {
      continue;
    }
    if (referenceQ && !ref.toLowerCase().includes(referenceQ)) continue;
    if (
      invoiceQ &&
      !ref.toLowerCase().includes(invoiceQ) &&
      !reservation.id.toLowerCase().includes(invoiceQ)
    ) {
      continue;
    }
    if (filters.status !== "all" && reservation.status !== filters.status) {
      continue;
    }
    if (
      filters.source !== "all" &&
      (reservation.booking_source ?? "Direct") !== filters.source
    ) {
      continue;
    }

    const groupDate = reservationDate(reservation, filters.dateType);
    if (filters.dateFrom && groupDate < filters.dateFrom) continue;
    if (filters.dateTo && groupDate > filters.dateTo) continue;

    const { nights, total, amountDue } = reservationTotals(reservation, room);

    rows.push({
      reservation,
      guest,
      nights,
      total,
      amountDue,
      displayReference: ref,
      displayName: displayName(reservation, guest),
      groupDate,
      bookedDate: reservation.created_at.slice(0, 10),
    });
  }

  rows.sort((a, b) => {
    const byDate = b.groupDate.localeCompare(a.groupDate);
    if (byDate !== 0) return byDate;
    return a.displayName.localeCompare(b.displayName);
  });

  return rows;
}

export function groupRowsByDate(
  rows: ReservationRow[],
): Array<{ date: string; label: string; rows: ReservationRow[] }> {
  const groups = new Map<string, ReservationRow[]>();

  for (const row of rows) {
    const list = groups.get(row.groupDate) ?? [];
    list.push(row);
    groups.set(row.groupDate, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupRows]) => ({
      date,
      label: formatDate(date, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      rows: groupRows,
    }));
}

export function formatShortDate(iso: string): string {
  const [y = "", m = "", d = ""] = iso.split("-");
  return `${d}-${m}-${y.slice(2)}`;
}

export function exportReservationsCsv(rows: ReservationRow[]): void {
  const headers = [
    "Status",
    "Name",
    "Reference",
    "Source",
    "Adults",
    "Children",
    "Infants",
    "Check-in",
    "Check-out",
    "Booked",
    "ETA",
    "Room",
    "Total",
    "Amount due",
  ];

  const lines = rows.map(({ reservation, displayName, displayReference, total, amountDue }) => {
    const values = [
      reservation.status,
      displayName,
      displayReference,
      reservation.booking_source ?? "Direct",
      reservation.adults ?? 1,
      reservation.children ?? 0,
      reservation.infants ?? 0,
      reservation.check_in,
      reservation.check_out,
      reservation.created_at.slice(0, 10),
      reservation.arrival_time ?? "",
      reservation.room_number ?? "",
      total.toFixed(2),
      amountDue.toFixed(2),
    ];
    return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
