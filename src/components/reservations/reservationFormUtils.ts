import { addDays, dayDiff, formatCurrency, todayISO } from "@/lib/metrics";
import type {
  CreateReservationInput,
  Guest,
  PaymentCollect,
  Reservation,
  Room,
} from "@/lib/types";
import { PAYMENT_COLLECT_OPTIONS } from "@/lib/paymentStatus";

export { PAYMENT_COLLECT_OPTIONS };

export type ReservationTab = "details" | "guest" | "folio" | "notes";

export type ReservationFormValues = {
  guest_id: string;
  guest_mode: "existing" | "new";
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
  postal_code: string;
  id_document_type: string;
  id_document: string;
  room_id: string;
  room_type: string;
  check_in: string;
  check_out: string;
  hold_rate: boolean;
  adults: number;
  children: number;
  infants: number;
  room_amount: number;
  extra_person: number;
  discount: number;
  amount_paid: number;
  booking_source: string;
  payment_collect: PaymentCollect;
  arrival_time: string;
  reference: string;
  notes: string;
  guest_comments: string;
};

export const TAX_RATE = 0.115;

export const BOOKING_SOURCES = [
  "Direct",
  "Booking.com",
  "Expedia",
  "Agoda",
  "Walk-in",
  "Phone",
];

export const ARRIVAL_TIMES = [
  "",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export const ID_DOCUMENT_TYPES = [
  "",
  "Passport",
  "National ID",
  "Driver license",
];

export function defaultReservationForm(
  partial?: Partial<ReservationFormValues>,
): ReservationFormValues {
  const today = todayISO();
  return {
    guest_id: "",
    guest_mode: "existing",
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
    room_id: "",
    room_type: "",
    check_in: today,
    check_out: addDays(today, 1),
    hold_rate: true,
    adults: 1,
    children: 0,
    infants: 0,
    room_amount: 0,
    extra_person: 0,
    discount: 0,
    amount_paid: 0,
    booking_source: "Direct",
    payment_collect: "property",
    arrival_time: "",
    reference: "",
    notes: "",
    guest_comments: "",
    ...partial,
  };
}

export function guestToFormFields(guest: Guest): Partial<ReservationFormValues> {
  return {
    guest_id: guest.id,
    first_name: guest.first_name,
    last_name: guest.last_name,
    email: guest.email,
    phone: guest.phone,
    organization: guest.organization ?? "",
    address_line1: guest.address_line1 ?? "",
    address_line2: guest.address_line2 ?? "",
    city: guest.city ?? "",
    country: guest.country ?? "",
    postal_code: guest.postal_code ?? "",
    id_document_type: guest.id_document_type ?? "",
    id_document: guest.id_document,
  };
}

export function reservationToForm(
  reservation: Reservation,
  guest?: Guest,
): ReservationFormValues {
  return defaultReservationForm({
    guest_id: reservation.guest_id,
    guest_mode: "existing",
    ...(guest ? guestToFormFields(guest) : {}),
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
    booking_source: reservation.booking_source ?? "Direct",
    payment_collect: reservation.payment_collect ?? "property",
    arrival_time: reservation.arrival_time ?? "",
    reference: reservation.reference ?? "",
    notes: reservation.notes,
    guest_comments: reservation.guest_comments ?? "",
  });
}

export function roomsForType(rooms: Room[], typeSlug: string): Room[] {
  if (!typeSlug) return rooms;
  return rooms.filter((r) => r.type === typeSlug);
}

export function computedRoomTotal(
  form: ReservationFormValues,
  room: Room | undefined,
  nights: number,
): number {
  if (form.room_amount > 0 && !form.hold_rate) return form.room_amount;
  const nightly = room?.rate ?? 0;
  return nightly * nights;
}

export function bookingTotals(
  form: ReservationFormValues,
  room: Room | undefined,
  nights: number,
) {
  const roomTotal = computedRoomTotal(form, room, nights);
  const subtotal =
    roomTotal + (form.extra_person || 0) - (form.discount || 0);
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal;
  const amountDue = Math.max(0, grandTotal - (form.amount_paid || 0));

  return {
    nights,
    roomTotal,
    subtotal,
    tax,
    grandTotal,
    amountDue,
  };
}

export function formToCreateInput(
  form: ReservationFormValues,
): CreateReservationInput {
  const base = {
    room_id: form.room_id,
    room_type: form.room_type || undefined,
    check_in: form.check_in,
    check_out: form.check_out,
    notes: form.notes,
    guest_comments: form.guest_comments,
    adults: form.adults,
    children: form.children,
    infants: form.infants,
    room_amount: form.room_amount || undefined,
    extra_person: form.extra_person,
    discount: form.discount,
    amount_paid: form.amount_paid,
    hold_rate: form.hold_rate,
    booking_source: form.booking_source,
    payment_collect: form.payment_collect,
    arrival_time: form.arrival_time,
    reference: form.reference,
  };

  if (form.guest_mode === "new" || !form.guest_id) {
    return {
      ...base,
      guest: {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        id_document: form.id_document,
        organization: form.organization,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        country: form.country,
        postal_code: form.postal_code,
        id_document_type: form.id_document_type,
      },
    };
  }

  return {
    ...base,
    guest_id: form.guest_id,
  };
}

export function formatStayLength(nights: number): string {
  return `${nights} night${nights === 1 ? "" : "s"}`;
}

export { formatCurrency };
