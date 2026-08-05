"use client";

import React from "react";
import { ReservationStatusBadge } from "@/components/StatusBadge";
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
import { inputClass } from "@/components/form";
import { formatDate } from "@/lib/metrics";
import type { Reservation } from "@/lib/types";
import type { ReservationRow } from "./reservationListUtils";

export type BookingQuery = {
  reference: string;
  lastName: string;
};

interface FindBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: BookingQuery;
  onChange: (values: Partial<BookingQuery>) => void;
  onSearch: () => void;
  onReset: () => void;
  rows: ReservationRow[];
  searched: boolean;
  /** Shown before any search so staff can see what a result looks like. */
  exampleRow?: ReservationRow;
  onSelect: (reservation: Reservation) => void;
}

function ResultsTable({
  rows,
  onSelect,
}: {
  rows: ReservationRow[];
  onSelect: (reservation: Reservation) => void;
}) {
  return (
    <Table>
      <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
        <TableRow>
          <TableCell isHeader className={tableHeaderCell}>
            Guest
          </TableCell>
          <TableCell isHeader className={tableHeaderCell}>
            Code
          </TableCell>
          <TableCell isHeader className={tableHeaderCell}>
            Room
          </TableCell>
          <TableCell isHeader className={tableHeaderCell}>
            Stay
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
        {rows.map((row) => (
          <TableRow
            key={row.reservation.id}
            className="border-b border-gray-100 dark:border-gray-800"
          >
            <TableCell
              className={`${tableBodyCell} font-medium text-gray-800 dark:text-white/90`}
            >
              {row.displayName}
            </TableCell>
            <TableCell className={tableBodyCell}>
              {row.displayReference}
            </TableCell>
            <TableCell className={tableBodyCell}>
              {row.reservation.room_number ?? "Unallocated"}
            </TableCell>
            <TableCell className={tableBodyCell}>
              {formatDate(row.reservation.check_in)} →{" "}
              {formatDate(row.reservation.check_out)}
            </TableCell>
            <TableCell className={tableBodyCell}>
              <ReservationStatusBadge status={row.reservation.status} />
            </TableCell>
            <TableCell className={`${tableBodyCell} text-right`}>
              <Button size="sm" onClick={() => onSelect(row.reservation)}>
                Open
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function FindBookingModal({
  isOpen,
  onClose,
  query,
  onChange,
  onSearch,
  onReset,
  rows,
  searched,
  exampleRow,
  onSelect,
}: FindBookingModalProps) {
  const canSearch = Boolean(query.reference.trim() || query.lastName.trim());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-3xl overflow-hidden p-0"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSearch) onSearch();
        }}
        className="flex max-h-[90vh] flex-col"
      >
        <div className="shrink-0 border-b border-gray-200 px-5 py-4 pr-16 dark:border-gray-800 sm:px-6 sm:pr-20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Find a booking
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Search every booked room by booking code or guest last name.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Booking code
              </label>
              <input
                className={inputClass}
                placeholder="e.g. BK-1042"
                value={query.reference}
                onChange={(e) => onChange({ reference: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Guest last name
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Davis"
                value={query.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <Button size="sm" variant="outline" type="button" onClick={onReset}>
              Reset
            </Button>
            <Button size="sm" type="submit" disabled={!canSearch}>
              Find booking
            </Button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {!searched ? (
            exampleRow ? (
              <>
                <p className="px-5 pt-4 text-theme-xs text-gray-500 sm:px-6">
                  Example result — open it to see the guest, cancel the stay, or
                  generate a room key.
                </p>
                <ResultsTable rows={[exampleRow]} onSelect={onSelect} />
              </>
            ) : (
              <p className="px-5 py-10 text-center text-theme-sm text-gray-500">
                Enter a booking code or guest last name, then press Find booking.
              </p>
            )
          ) : rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-theme-sm text-gray-500">
              No booking matches this search.
            </p>
          ) : (
            <ResultsTable rows={rows} onSelect={onSelect} />
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {searched
              ? `${rows.length} booking${rows.length === 1 ? "" : "s"} found`
              : "Searches all dates, including past and cancelled stays."}
          </span>
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </form>
    </Modal>
  );
}
