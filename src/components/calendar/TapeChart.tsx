"use client";

import React, { useMemo } from "react";
import {
  addDays,
  coversDate,
  dateRange,
  dayDiff,
  formatDate,
  isActive,
  todayISO,
} from "@/lib/metrics";
import type { Reservation, Room } from "@/lib/types";

const ROOM_COL = 232;
const ROW_H = 56;
const GROUP_H = 36;

/** Wider columns for short ranges so the chart fills the page at every zoom. */
function dayWidth(days: number): number {
  if (days <= 7) return 132;
  if (days <= 14) return 92;
  return 60;
}

const barStyles: Record<string, string> = {
  booked:
    "bg-brand-500 text-white ring-brand-600/20 hover:bg-brand-600",
  checked_in:
    "bg-success-500 text-white ring-success-600/20 hover:bg-success-600",
  checked_out:
    "bg-gray-200 text-gray-600 ring-gray-300/40 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
};

type Row =
  | { kind: "group"; key: string; label: string; count: number }
  | { kind: "room"; key: string; room: Room };

interface TapeChartProps {
  rooms: Room[];
  reservations: Reservation[];
  start: string;
  days: number;
  onSelectReservation: (reservation: Reservation) => void;
  onSelectCell: (room: Room, date: string) => void;
}

const TapeChart: React.FC<TapeChartProps> = ({
  rooms,
  reservations,
  start,
  days,
  onSelectReservation,
  onSelectCell,
}) => {
  const today = todayISO();
  const dates = useMemo(() => dateRange(start, days), [start, days]);
  const end = addDays(start, days);

  const rows = useMemo<Row[]>(() => {
    const byType = new Map<string, Room[]>();
    for (const room of rooms) {
      const list = byType.get(room.type) ?? [];
      list.push(room);
      byType.set(room.type, list);
    }

    const result: Row[] = [];
    for (const [type, list] of [...byType.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      result.push({
        kind: "group",
        key: `group-${type}`,
        label: type,
        count: list.length,
      });
      for (const room of list) {
        result.push({ kind: "room", key: room.id, room });
      }
    }
    return result;
  }, [rooms]);

  /** Reservations clipped to the visible window, keyed by room. */
  const barsByRoom = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        reservation: Reservation;
        startIdx: number;
        span: number;
        clippedStart: boolean;
        clippedEnd: boolean;
      }>
    >();

    for (const reservation of reservations) {
      if (!isActive(reservation)) continue;
      if (reservation.check_in >= end || reservation.check_out <= start) continue;

      const rawStart = dayDiff(start, reservation.check_in);
      const rawEnd = dayDiff(start, reservation.check_out);
      const startIdx = Math.max(0, rawStart);
      const span = Math.min(days, rawEnd) - startIdx;
      if (span <= 0) continue;

      const list = map.get(reservation.room_id) ?? [];
      list.push({
        reservation,
        startIdx,
        span,
        clippedStart: rawStart < 0,
        clippedEnd: rawEnd > days,
      });
      map.set(reservation.room_id, list);
    }

    return map;
  }, [reservations, start, end, days]);

  const gridTemplateColumns = `${ROOM_COL}px repeat(${days}, ${dayWidth(days)}px)`;

  return (
    <div className="custom-scrollbar overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className="grid w-max"
        style={{
          gridTemplateColumns,
          gridTemplateRows: `48px ${rows
            .map((r) => (r.kind === "group" ? `${GROUP_H}px` : `${ROW_H}px`))
            .join(" ")}`,
        }}
      >
        {/* Sticky corner */}
        <div
          className="sticky left-0 z-30 flex items-center border-b border-r border-gray-200 bg-gray-50 px-5 text-theme-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
          style={{ gridColumn: 1, gridRow: 1 }}
        >
          Room
        </div>

        {/* Date headers */}
        {dates.map((date, i) => {
          const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
          const isWeekend = weekday === 0 || weekday === 6;
          const isToday = date === today;

          return (
            <div
              key={date}
              className={`flex flex-col items-center justify-center border-b border-r border-gray-200 text-center dark:border-gray-800 ${
                isToday
                  ? "bg-brand-500 text-white"
                  : isWeekend
                    ? "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                    : "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              }`}
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              <span className="text-[10px] font-medium uppercase leading-tight">
                {formatDate(date, { weekday: "short" })}
              </span>
              <span
                className={`text-theme-sm font-semibold leading-tight ${
                  isToday ? "text-white" : "text-gray-800 dark:text-white/90"
                }`}
              >
                {formatDate(date, { day: "numeric" })}
              </span>
            </div>
          );
        })}

        {/* Body */}
        {rows.map((row, rowIdx) => {
          const gridRow = rowIdx + 2;

          if (row.kind === "group") {
            return (
              <React.Fragment key={row.key}>
                <div
                  className="sticky left-0 z-30 flex items-center gap-2 border-b border-r border-gray-200 bg-gray-100 px-5 dark:border-gray-800 dark:bg-gray-900"
                  style={{ gridColumn: 1, gridRow }}
                >
                  <span className="text-theme-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {row.label}
                  </span>
                  <span className="text-theme-xs text-gray-400">
                    {row.count}
                  </span>
                </div>
                <div
                  className="border-b border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900"
                  style={{
                    gridColumn: `2 / span ${days}`,
                    gridRow,
                  }}
                />
              </React.Fragment>
            );
          }

          const { room } = row;
          const bars = barsByRoom.get(room.id) ?? [];

          return (
            <React.Fragment key={row.key}>
              <div
                className="sticky left-0 z-30 flex items-center justify-between gap-3 border-b border-r border-gray-200 bg-white px-5 dark:border-gray-800 dark:bg-gray-900"
                style={{ gridColumn: 1, gridRow }}
              >
                <div>
                  <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                    {room.number}
                  </div>
                  <div className="text-theme-xs capitalize text-gray-400">
                    {room.status.replaceAll("_", " ")}
                  </div>
                </div>
                <span className="text-theme-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
                  ${room.rate}
                </span>
              </div>

              {/* Background cells double as "create booking" targets */}
              {dates.map((date, i) => {
                const isToday = date === today;
                const taken = bars.some((b) =>
                  coversDate(b.reservation, date),
                );

                return (
                  <button
                    key={date}
                    type="button"
                    disabled={taken}
                    onClick={() => onSelectCell(room, date)}
                    aria-label={`Book room ${room.number} on ${date}`}
                    className={`group border-b border-r border-gray-200 transition-colors dark:border-gray-800 ${
                      isToday ? "bg-brand-50/60 dark:bg-brand-500/10" : ""
                    } ${
                      taken
                        ? "cursor-default"
                        : "hover:bg-brand-50 dark:hover:bg-brand-500/15"
                    }`}
                    style={{ gridColumn: i + 2, gridRow }}
                  >
                    {!taken && (
                      <span className="text-lg leading-none text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
                        +
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Booking bars overlay the cells in the same grid row */}
              {bars.map(({ reservation, startIdx, span, clippedStart, clippedEnd }) => (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() => onSelectReservation(reservation)}
                  title={`${reservation.guest_name} · ${reservation.check_in} → ${reservation.check_out}`}
                  className={`pointer-events-auto z-10 m-2 flex items-center overflow-hidden px-3 text-left shadow-theme-xs ring-1 transition-colors ${
                    barStyles[reservation.status] ?? barStyles.booked
                  } ${clippedStart ? "rounded-l-none" : "rounded-l-full"} ${
                    clippedEnd ? "rounded-r-none" : "rounded-r-full"
                  }`}
                  style={{
                    gridColumn: `${startIdx + 2} / span ${span}`,
                    gridRow,
                  }}
                >
                  <span className="truncate text-theme-xs font-semibold">
                    {reservation.guest_name}
                  </span>
                </button>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TapeChart;
