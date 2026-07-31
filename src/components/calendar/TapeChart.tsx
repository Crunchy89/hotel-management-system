"use client";

import React, { useMemo, useState } from "react";
import {
  addDays,
  coversDate,
  dateRange,
  dayDiff,
  formatDate,
  isActive,
  todayISO,
} from "@/lib/metrics";
import type { Reservation, Room, RoomTypeRecord } from "@/lib/types";
import { ChevronDownIcon, PencilIcon, PlusIcon } from "@/icons";

const ROOM_COL = 260;
const ROW_H = 56;
const GROUP_H = 40;
const UNALLOCATED_H = 48;

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

type BarEntry = {
  reservation: Reservation;
  startIdx: number;
  span: number;
  clippedStart: boolean;
  clippedEnd: boolean;
};

type Row =
  | {
      kind: "group";
      key: string;
      type: RoomTypeRecord;
      count: number;
      expanded: boolean;
    }
  | { kind: "room"; key: string; room: Room; typeSlug: string }
  | { kind: "unallocated"; key: string; typeSlug: string; label: string };

interface TapeChartProps {
  rooms: Room[];
  roomTypes: RoomTypeRecord[];
  reservations: Reservation[];
  start: string;
  days: number;
  onSelectReservation: (reservation: Reservation) => void;
  onSelectCell: (room: Room, date: string) => void;
  onSelectUnallocatedCell: (typeSlug: string, date: string) => void;
  onAddRoomType: () => void;
  onEditRoomType: (type: RoomTypeRecord) => void;
}

function buildBars(
  reservations: Reservation[],
  start: string,
  end: string,
  days: number,
  match: (reservation: Reservation) => boolean,
): BarEntry[] {
  const bars: BarEntry[] = [];

  for (const reservation of reservations) {
    if (!isActive(reservation)) continue;
    if (!match(reservation)) continue;
    if (reservation.check_in >= end || reservation.check_out <= start) continue;

    const rawStart = dayDiff(start, reservation.check_in);
    const rawEnd = dayDiff(start, reservation.check_out);
    const startIdx = Math.max(0, rawStart);
    const span = Math.min(days, rawEnd) - startIdx;
    if (span <= 0) continue;

    bars.push({
      reservation,
      startIdx,
      span,
      clippedStart: rawStart < 0,
      clippedEnd: rawEnd > days,
    });
  }

  return bars;
}

function renderBars(
  bars: BarEntry[],
  gridRow: number,
  onSelectReservation: (reservation: Reservation) => void,
) {
  return bars.map(({ reservation, startIdx, span, clippedStart, clippedEnd }) => (
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
  ));
}

const TapeChart: React.FC<TapeChartProps> = ({
  rooms,
  roomTypes,
  reservations,
  start,
  days,
  onSelectReservation,
  onSelectCell,
  onSelectUnallocatedCell,
  onAddRoomType,
  onEditRoomType,
}) => {
  const today = todayISO();
  const dates = useMemo(() => dateRange(start, days), [start, days]);
  const end = addDays(start, days);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const roomsByType = useMemo(() => {
    const map = new Map<string, Room[]>();
    for (const room of rooms) {
      const list = map.get(room.type) ?? [];
      list.push(room);
      map.set(room.type, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.number.localeCompare(b.number));
    }
    return map;
  }, [rooms]);

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];

    for (const type of roomTypes) {
      const list = roomsByType.get(type.slug) ?? [];
      const expanded = !collapsed.has(type.slug);

      result.push({
        kind: "group",
        key: `group-${type.slug}`,
        type,
        count: list.length,
        expanded,
      });

      if (!expanded) continue;

      for (const room of list) {
        result.push({
          kind: "room",
          key: room.id,
          room,
          typeSlug: type.slug,
        });
      }

      result.push({
        kind: "unallocated",
        key: `unallocated-${type.slug}`,
        typeSlug: type.slug,
        label: type.label,
      });
    }

    return result;
  }, [roomTypes, roomsByType, collapsed]);

  const barsByRoom = useMemo(() => {
    const map = new Map<string, BarEntry[]>();
    for (const reservation of reservations) {
      if (!reservation.room_id) continue;
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

  const barsByUnallocated = useMemo(() => {
    const map = new Map<string, BarEntry[]>();
    for (const type of roomTypes) {
      map.set(
        type.slug,
        buildBars(
          reservations,
          start,
          end,
          days,
          (r) => !r.room_id && r.room_type === type.slug,
        ),
      );
    }
    return map;
  }, [reservations, roomTypes, start, end, days]);

  function toggleGroup(slug: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const gridTemplateColumns = `${ROOM_COL}px repeat(${days}, ${dayWidth(days)}px)`;

  function rowHeight(row: Row): number {
    if (row.kind === "group") return GROUP_H;
    if (row.kind === "unallocated") return UNALLOCATED_H;
    return ROW_H;
  }

  return (
    <div className="custom-scrollbar overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className="grid w-max"
        style={{
          gridTemplateColumns,
          gridTemplateRows: `48px ${rows.map(rowHeight).join(" ")}px`,
        }}
      >
        {/* Sticky corner */}
        <div
          className="sticky left-0 z-30 flex items-center justify-between gap-2 border-b border-r border-gray-200 bg-gray-50 px-4 dark:border-gray-800 dark:bg-gray-900"
          style={{ gridColumn: 1, gridRow: 1 }}
        >
          <span className="text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            Room type
          </span>
          <button
            type="button"
            onClick={onAddRoomType}
            aria-label="Add room type"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-200 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
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
                  className="sticky left-0 z-30 flex items-center gap-1.5 border-b border-r border-gray-200 bg-gray-100 px-3 dark:border-gray-800 dark:bg-gray-900"
                  style={{ gridColumn: 1, gridRow }}
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(row.type.slug)}
                    aria-expanded={row.expanded}
                    aria-label={`${row.expanded ? "Collapse" : "Expand"} ${row.type.label}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 transition-transform ${
                        row.expanded ? "" : "-rotate-90"
                      }`}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-theme-xs font-semibold text-gray-700 dark:text-gray-200">
                      {row.type.label}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {row.count} room{row.count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditRoomType(row.type)}
                    aria-label={`Edit ${row.type.label}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-200 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
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

          if (row.kind === "unallocated") {
            const bars = barsByUnallocated.get(row.typeSlug) ?? [];

            return (
              <React.Fragment key={row.key}>
                <div
                  className="sticky left-0 z-30 flex items-center border-b border-r border-gray-200 bg-gray-50 px-4 pl-10 dark:border-gray-800 dark:bg-gray-900/80"
                  style={{ gridColumn: 1, gridRow }}
                >
                  <div>
                    <div className="text-theme-xs font-medium italic text-gray-500 dark:text-gray-400">
                      Unallocated
                    </div>
                    <div className="text-[10px] text-gray-400">{row.label}</div>
                  </div>
                </div>

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
                      onClick={() => onSelectUnallocatedCell(row.typeSlug, date)}
                      aria-label={`Book unallocated ${row.label} on ${date}`}
                      className={`group border-b border-r border-gray-200 transition-colors dark:border-gray-800 ${
                        isToday ? "bg-brand-50/40 dark:bg-brand-500/10" : "bg-gray-50/60 dark:bg-white/[0.02]"
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

                {renderBars(bars, gridRow, onSelectReservation)}
              </React.Fragment>
            );
          }

          const { room } = row;
          const bars = barsByRoom.get(room.id) ?? [];

          return (
            <React.Fragment key={row.key}>
              <div
                className="sticky left-0 z-30 flex items-center justify-between gap-3 border-b border-r border-gray-200 bg-white px-4 pl-10 dark:border-gray-800 dark:bg-gray-900"
                style={{ gridColumn: 1, gridRow }}
              >
                <div>
                  <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                    Room {room.number}
                  </div>
                  <div className="text-theme-xs capitalize text-gray-400">
                    {room.status.replaceAll("_", " ")}
                  </div>
                </div>
                <span className="text-theme-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
                  ${room.rate}
                </span>
              </div>

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

              {renderBars(bars, gridRow, onSelectReservation)}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TapeChart;
