"use client";

import React, { useMemo } from "react";
import { RoomStatusBadge } from "@/components/StatusBadge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tableBodyCell, tableHeaderCell } from "@/components/ui/layout";
import { selectClass } from "@/components/form";
import DateRangeInput from "@/components/form/DateRangeInput";
import {
  availableRoomsForDates,
  dayDiff,
  formatCurrency,
  formatDate,
} from "@/lib/metrics";
import type { Reservation, Room, RoomTypeRecord } from "@/lib/types";

interface AvailableRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  reservations: Reservation[];
  roomTypes: RoomTypeRecord[];
  checkIn: string;
  checkOut: string;
  roomType?: string;
  onChange: (values: {
    from?: string;
    to?: string;
    roomType?: string;
  }) => void;
  onReserve: (room: Room, checkIn: string, checkOut: string) => void;
}

export default function AvailableRoomsModal({
  isOpen,
  onClose,
  rooms,
  reservations,
  roomTypes,
  checkIn,
  checkOut,
  roomType,
  onChange,
  onReserve,
}: AvailableRoomsModalProps) {
  const nights = Math.max(0, dayDiff(checkIn, checkOut));
  const available = useMemo(
    () =>
      availableRoomsForDates(
        rooms,
        reservations,
        checkIn,
        checkOut,
        roomType || undefined,
      ),
    [rooms, reservations, checkIn, checkOut, roomType],
  );

  const typeLabel = (slug: string) =>
    roomTypes.find((t) => t.slug === slug)?.label ?? slug;

  const datesValid = Boolean(checkIn && checkOut && checkOut > checkIn);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-4xl overflow-hidden p-0"
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="shrink-0 border-b border-gray-200 px-5 py-4 pr-16 dark:border-gray-800 sm:px-6 sm:pr-20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Find available rooms
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Pick the stay dates, then reserve straight from the list.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Stay dates
              </label>
              <DateRangeInput
                from={checkIn}
                to={checkOut}
                placeholder="Date from – date to"
                onChange={(from, to) => onChange({ from, to })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Room type
              </label>
              <select
                className={selectClass}
                value={roomType ?? ""}
                onChange={(e) => onChange({ roomType: e.target.value })}
              >
                <option value="">Any room type</option>
                {roomTypes.map((type) => (
                  <option key={type.slug} value={type.slug}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {datesValid && (
            <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">
              {formatDate(checkIn, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              →{" "}
              {formatDate(checkOut, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              · {nights} night{nights === 1 ? "" : "s"} · {available.length} room
              {available.length === 1 ? "" : "s"} free
            </p>
          )}
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {!datesValid ? (
            <p className="px-5 py-10 text-center text-theme-sm text-gray-500">
              Date to must be after date from.
            </p>
          ) : available.length === 0 ? (
            <p className="px-5 py-10 text-center text-theme-sm text-gray-500">
              No rooms available for these dates.
            </p>
          ) : (
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
                    Nightly
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    Stay total
                  </TableCell>
                  <TableCell isHeader className={tableHeaderCell}>
                    Status
                  </TableCell>
                  <TableCell isHeader className={`${tableHeaderCell} text-right`}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {available.map((room) => {
                  const stayTotal = room.rate * nights;
                  return (
                    <TableRow
                      key={room.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <TableCell
                        className={`${tableBodyCell} font-medium text-gray-800 dark:text-white/90`}
                      >
                        Room {room.number}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        {typeLabel(room.type)}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        {room.floor}
                      </TableCell>
                      <TableCell className={`${tableBodyCell} tabular-nums`}>
                        {formatCurrency(room.rate)}
                      </TableCell>
                      <TableCell
                        className={`${tableBodyCell} font-semibold tabular-nums`}
                      >
                        {formatCurrency(stayTotal)}
                      </TableCell>
                      <TableCell className={tableBodyCell}>
                        <RoomStatusBadge status={room.status} />
                      </TableCell>
                      <TableCell className={`${tableBodyCell} text-right`}>
                        <Button
                          size="sm"
                          onClick={() => onReserve(room, checkIn, checkOut)}
                        >
                          Reserve
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
