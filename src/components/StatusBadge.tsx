"use client";

import Badge, { type BadgeColor } from "@/components/ui/badge/Badge";
import { useT } from "@/context/LocaleContext";

const roomColors: Record<string, BadgeColor> = {
  available: "success",
  occupied: "primary",
  cleaning: "warning",
  maintenance: "error",
};

const reservationColors: Record<string, BadgeColor> = {
  booked: "primary",
  checked_in: "success",
  checked_out: "light",
  cancelled: "error",
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function statusLabel(t: (key: string) => string, status: string) {
  const key = `status.${status}`;
  const translated = t(key);
  return translated === key ? labelize(status) : translated;
}

export function RoomStatusBadge({ status }: { status: string }) {
  const t = useT();
  return (
    <Badge size="sm" color={roomColors[status] ?? "light"}>
      <span className="capitalize">{statusLabel(t, status)}</span>
    </Badge>
  );
}

export function ReservationStatusBadge({ status }: { status: string }) {
  const t = useT();
  return (
    <Badge size="sm" color={reservationColors[status] ?? "light"}>
      <span className="capitalize">{statusLabel(t, status)}</span>
    </Badge>
  );
}

const sourceColors: Record<string, BadgeColor> = {
  direct: "primary",
  "direct booking": "primary",
  offline: "dark",
  "walk-in": "dark",
  phone: "dark",
  "booking.com": "info",
  expedia: "warning",
  agoda: "success",
};

export function BookingSourceBadge({ source }: { source?: string }) {
  const value = source?.trim() || "Direct";
  return (
    <Badge size="sm" color={sourceColors[value.toLowerCase()] ?? "light"}>
      {value}
    </Badge>
  );
}
