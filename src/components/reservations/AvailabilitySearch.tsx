"use client";

import { FormEvent, useMemo, useState } from "react";
import { RoomStatusBadge } from "@/components/StatusBadge";
import { inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  FilterField,
  FilterPanel,
  SurfaceCard,
  tableBodyCell,
  tableHeaderCell,
} from "@/components/ui/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addDays,
  availableRoomsForDates,
  dayDiff,
  formatCurrency,
  formatDate,
  todayISO,
} from "@/lib/metrics";
import type { Reservation, Room, RoomTypeRecord } from "@/lib/types";

interface AvailabilitySearchProps {
  rooms: Room[];
  reservations: Reservation[];
  roomTypes: RoomTypeRecord[];
  loading?: boolean;
  onReserve: (room: Room, checkIn: string, checkOut: string) => void;
}

/**
 * Defaults to tonight (today → tomorrow) so available rooms for this day show
 * immediately. From / To can be adjusted and re-searched.
 */
export default function AvailabilitySearch({
  rooms,
  reservations,
  roomTypes,
  loading = false,
  onReserve,
}: AvailabilitySearchProps) {
  const today = todayISO();
  const defaultTo = addDays(today, 1);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(defaultTo);
  const [typeFilter, setTypeFilter] = useState("");
  const [applied, setApplied] = useState({
    from: today,
    to: defaultTo,
    type: "",
  });

  const nights = Math.max(0, dayDiff(applied.from, applied.to));

  const available = useMemo(
    () =>
      availableRoomsForDates(
        rooms,
        reservations,
        applied.from,
        applied.to,
        applied.type || undefined,
      ),
    [rooms, reservations, applied],
  );

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!fromDate || !toDate || toDate <= fromDate) return;
    setApplied({ from: fromDate, to: toDate, type: typeFilter });
  }

  function showToday() {
    const nextFrom = todayISO();
    const nextTo = addDays(nextFrom, 1);
    setFromDate(nextFrom);
    setToDate(nextTo);
    setTypeFilter("");
    setApplied({ from: nextFrom, to: nextTo, type: "" });
  }

  const typeLabel = (slug: string) =>
    roomTypes.find((t) => t.slug === slug)?.label ?? slug;

  const isTonight =
    applied.from === todayISO() && applied.to === addDays(todayISO(), 1);

  return (
    <>
      <FilterPanel
        onSubmit={onSearch}
        action={
          <div className="flex flex-wrap gap-2">
            {!isTonight && (
              <Button size="sm" variant="outline" type="button" onClick={showToday}>
                Tonight
              </Button>
            )}
            <Button size="sm" type="submit">
              Search availability
            </Button>
          </div>
        }
      >
        <FilterField label="From date">
          <input
            className={inputClass}
            type="date"
            required
            value={fromDate}
            onChange={(e) => {
              const next = e.target.value;
              setFromDate(next);
              if (toDate <= next) setToDate(addDays(next, 1));
            }}
          />
        </FilterField>
        <FilterField label="To date">
          <input
            className={inputClass}
            type="date"
            required
            min={addDays(fromDate, 1)}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </FilterField>
        <FilterField label="Room type">
          <select
            className={inputClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {roomTypes.map((type) => (
              <option key={type.id} value={type.slug}>
                {type.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Stay length">
          <div
            className={`${inputClass} flex items-center text-gray-600 dark:text-gray-300`}
          >
            {Math.max(0, dayDiff(fromDate, toDate))} night
            {dayDiff(fromDate, toDate) === 1 ? "" : "s"}
          </div>
        </FilterField>
      </FilterPanel>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div>
            <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              <span className="text-brand-600 dark:text-brand-400">
                {available.length}
              </span>{" "}
              room{available.length === 1 ? "" : "s"} available
            </p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {isTonight ? "Tonight · " : ""}
              {formatDate(applied.from)} → {formatDate(applied.to)} · {nights}{" "}
              night{nights === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
              <TableRow>
                <TableCell isHeader className={tableHeaderCell}>
                  Room
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  Type
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  Floor
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  Nightly rate
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  Stay total
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  Housekeeping
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {available.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading
                      ? "Loading…"
                      : "No rooms available for these dates."}
                  </TableCell>
                </TableRow>
              )}
              {available.map((room) => (
                <TableRow
                  key={room.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
                >
                  <TableCell
                    className={`${tableBodyCell} font-semibold text-gray-800 dark:text-white/90`}
                  >
                    {room.number}
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    {typeLabel(room.type)}
                  </TableCell>
                  <TableCell className={`${tableBodyCell} tabular-nums`}>
                    {room.floor}
                  </TableCell>
                  <TableCell className={`${tableBodyCell} tabular-nums`}>
                    {formatCurrency(room.rate)}
                  </TableCell>
                  <TableCell
                    className={`${tableBodyCell} font-medium tabular-nums text-gray-800 dark:text-white/90`}
                  >
                    {formatCurrency(room.rate * nights)}
                    <span className="ml-1 text-theme-xs font-normal text-gray-400">
                      · {nights}n
                    </span>
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <RoomStatusBadge status={room.status} />
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <Button
                      size="xs"
                      onClick={() =>
                        onReserve(room, applied.from, applied.to)
                      }
                    >
                      Reserve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SurfaceCard>
    </>
  );
}
