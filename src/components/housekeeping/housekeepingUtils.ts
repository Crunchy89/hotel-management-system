import { coversDate } from "@/lib/metrics";
import type {
  CleaningStatus,
  HousekeepingRecord,
  OccupancyStatus,
  Reservation,
  Room,
  RoomTypeRecord,
} from "@/lib/types";

export type HousekeepingRow = {
  room: Room;
  typeLabel: string;
  occupancy: OccupancyStatus;
  reservation?: Reservation;
  adults: number;
  children: number;
  infants: number;
  cleaningStatus: CleaningStatus;
  note: string;
  record?: HousekeepingRecord;
};

const CLEANING_LABELS: Record<CleaningStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  clean: "Clean",
  inspected: "Inspected",
};

const OCCUPANCY_LABELS: Record<OccupancyStatus, string> = {
  occupied: "Occupied",
  check_in_only: "Check-in only",
  empty: "Vacant",
};

export function cleaningLabel(status: CleaningStatus): string {
  return CLEANING_LABELS[status];
}

export function occupancyLabel(status: OccupancyStatus): string {
  return OCCUPANCY_LABELS[status];
}

function reservationForRoomOnDate(
  reservations: Reservation[],
  roomId: string,
  date: string,
): Reservation | undefined {
  return reservations.find(
    (r) =>
      r.room_id === roomId &&
      (r.status === "booked" || r.status === "checked_in") &&
      coversDate(r, date),
  );
}

function deriveOccupancy(
  reservation: Reservation | undefined,
  date: string,
): OccupancyStatus {
  if (!reservation) return "empty";
  if (reservation.status === "checked_in") return "occupied";
  if (reservation.check_in === date) return "check_in_only";
  if (reservation.check_in < date) return "occupied";
  return "empty";
}

function defaultCleaning(room: Room, record?: HousekeepingRecord): CleaningStatus {
  if (record) return record.cleaning_status;
  if (room.status === "cleaning") return "in_progress";
  if (room.status === "available") return "clean";
  return "pending";
}

export function buildHousekeepingRows(
  rooms: Room[],
  roomTypes: RoomTypeRecord[],
  reservations: Reservation[],
  housekeeping: HousekeepingRecord[],
  date: string,
): HousekeepingRow[] {
  const typeLabel = (slug: string) =>
    roomTypes.find((t) => t.slug === slug)?.label ?? slug;

  const recordMap = new Map(
    housekeeping
      .filter((h) => h.date === date)
      .map((h) => [h.room_id, h]),
  );

  return rooms
    .map((room) => {
      const reservation = reservationForRoomOnDate(
        reservations,
        room.id,
        date,
      );
      const record = recordMap.get(room.id);
      const occupancy = deriveOccupancy(reservation, date);

      return {
        room,
        typeLabel: typeLabel(room.type),
        occupancy,
        reservation,
        adults: reservation?.adults ?? 0,
        children: reservation?.children ?? 0,
        infants: reservation?.infants ?? 0,
        cleaningStatus: defaultCleaning(room, record),
        note: record?.note ?? "",
        record,
      };
    })
    .sort(
      (a, b) =>
        a.room.number.localeCompare(b.room.number, undefined, {
          numeric: true,
        }),
    );
}

export function filterHousekeepingRows(
  rows: HousekeepingRow[],
  typeSlug: string | "all",
  occupancyFilter: string,
  cleaningFilter: string,
): HousekeepingRow[] {
  return rows.filter((row) => {
    if (typeSlug !== "all" && row.room.type !== typeSlug) return false;
    if (occupancyFilter !== "all" && row.occupancy !== occupancyFilter) {
      return false;
    }
    if (cleaningFilter !== "all" && row.cleaningStatus !== cleaningFilter) {
      return false;
    }
    return true;
  });
}

export function summarizeRows(rows: HousekeepingRow[]) {
  return {
    total: rows.length,
    occupied: rows.filter((r) => r.occupancy === "occupied").length,
    arrivals: rows.filter((r) => r.occupancy === "check_in_only").length,
    vacant: rows.filter((r) => r.occupancy === "empty").length,
    needsCleaning: rows.filter(
      (r) => r.cleaningStatus === "pending" || r.cleaningStatus === "in_progress",
    ).length,
  };
}

export const CLEANING_OPTIONS: CleaningStatus[] = [
  "pending",
  "in_progress",
  "clean",
  "inspected",
];

export const OCCUPANCY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "occupied", label: "Occupied" },
  { value: "check_in_only", label: "Check-in only" },
  { value: "empty", label: "Vacant" },
];

export const CLEANING_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All cleaning" },
  ...CLEANING_OPTIONS.map((s) => ({ value: s, label: cleaningLabel(s) })),
];

export function printHousekeepingReport(
  rows: HousekeepingRow[],
  dateLabel: string,
): void {
  const html = `<!DOCTYPE html><html><head><title>Housekeeping ${dateLabel}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#111}
      h1{font-size:20px;margin:0 0 4px}
      p{color:#666;margin:0 0 20px;font-size:13px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f5f5f5}
    </style></head><body>
    <h1>Housekeeping report</h1>
    <p>${dateLabel} · ${rows.length} rooms</p>
    <table>
      <thead><tr>
        <th>Room</th><th>Type</th><th>Status</th><th>Guests</th><th>Cleaning</th><th>Notes</th>
      </tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
              <td>Room ${r.room.number}</td>
              <td>${r.typeLabel}</td>
              <td>${occupancyLabel(r.occupancy)}</td>
              <td>${r.adults}/${r.children}/${r.infants}</td>
              <td>${cleaningLabel(r.cleaningStatus)}</td>
              <td>${r.note || "—"}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <script>window.print();</script>
    </body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
