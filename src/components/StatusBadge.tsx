import Badge, { type BadgeColor } from "@/components/ui/badge/Badge";

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

export function RoomStatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" color={roomColors[status] ?? "light"}>
      <span className="capitalize">{labelize(status)}</span>
    </Badge>
  );
}

export function ReservationStatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" color={reservationColors[status] ?? "light"}>
      <span className="capitalize">{labelize(status)}</span>
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
