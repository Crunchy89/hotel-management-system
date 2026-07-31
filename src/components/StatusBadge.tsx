const roomStyles: Record<string, string> = {
  available: "bg-emerald-50 text-ok",
  occupied: "bg-blue-50 text-info",
  cleaning: "bg-amber-50 text-warn",
  maintenance: "bg-rose-50 text-danger",
};

const resStyles: Record<string, string> = {
  booked: "bg-blue-50 text-info",
  checked_in: "bg-emerald-50 text-ok",
  checked_out: "bg-slate-100 text-muted",
  cancelled: "bg-rose-50 text-danger",
};

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

export function RoomStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize ${
        roomStyles[status] ?? "bg-slate-100 text-muted"
      }`}
    >
      {labelize(status)}
    </span>
  );
}

export function ReservationStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize ${
        resStyles[status] ?? "bg-slate-100 text-muted"
      }`}
    >
      {labelize(status)}
    </span>
  );
}
