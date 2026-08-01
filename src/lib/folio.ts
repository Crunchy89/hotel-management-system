import { dayDiff } from "@/lib/metrics";
import type { FolioLine, Reservation, Room } from "@/lib/types";

/** Stay subtotal (room + extras − discount) for a reservation. */
export function stayTotal(
  reservation: Reservation,
  room: Room | undefined,
): number {
  const nights = Math.max(0, dayDiff(reservation.check_in, reservation.check_out));
  const roomTotal =
    reservation.room_amount && reservation.room_amount > 0 && !reservation.hold_rate
      ? reservation.room_amount
      : (room?.rate ?? 0) * nights;
  return (
    roomTotal +
    (reservation.extra_person ?? 0) -
    (reservation.discount ?? 0)
  );
}

export function folioCharges(lines: FolioLine[]): number {
  return lines
    .filter((l) => l.type === "charge")
    .reduce((s, l) => s + l.amount, 0);
}

export function folioPaymentsNet(lines: FolioLine[]): number {
  let paid = 0;
  for (const line of lines) {
    if (line.type === "payment") paid += line.amount;
    if (line.type === "refund") paid -= line.amount;
  }
  return paid;
}

export function folioBalance(
  reservation: Reservation,
  room: Room | undefined,
  lines: FolioLine[],
): {
  stay: number;
  charges: number;
  paid: number;
  total: number;
  due: number;
} {
  const stay = stayTotal(reservation, room);
  const charges = folioCharges(lines);
  const paid = folioPaymentsNet(lines);
  const total = stay + charges;
  const due = Math.max(0, Math.round((total - paid) * 100) / 100);
  return { stay, charges, paid, total, due };
}
