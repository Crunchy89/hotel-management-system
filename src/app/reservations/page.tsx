"use client";

import { FormEvent, Fragment, useMemo, useState } from "react";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import ReservationDetailDialog, {
  type ReservationAction,
} from "@/components/reservations/ReservationDetailDialog";
import ReservationDialog, {
  defaultReservationForm,
} from "@/components/reservations/ReservationDialog";
import {
  BOOKING_SOURCES,
  formToCreateInput,
} from "@/components/reservations/reservationFormUtils";
import {
  defaultFilters,
  exportReservationsCsv,
  filterReservations,
  formatShortDate,
  groupRowsByDate,
  type ReservationFilters,
} from "@/components/reservations/reservationListUtils";
import { Alert } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, formatCurrency, todayISO } from "@/lib/metrics";
import type { Reservation } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const filterInputClass =
  "h-10 w-full rounded-md border border-gray-600 bg-gray-700 px-3 text-sm text-white placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
const filterSelectClass = filterInputClass;
const headerCell =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";
const bodyCell =
  "whitespace-nowrap px-3 py-2.5 text-theme-xs text-gray-700 dark:text-gray-300";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "booked", label: "Confirmed" },
  { value: "checked_in", label: "Check-in" },
  { value: "checked_out", label: "Checked out" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_TYPE_OPTIONS = [
  { value: "check_in", label: "Check-in" },
  { value: "check_out", label: "Check-out" },
  { value: "booked", label: "Booked date" },
];

function Occupants({
  adults,
  children,
  infants,
}: {
  adults: number;
  children: number;
  infants: number;
}) {
  return (
    <div className="flex items-center gap-2 text-theme-xs text-gray-600 dark:text-gray-400">
      <span title="Adults">👤 {adults}</span>
      {children > 0 && <span title="Children">🧒 {children}</span>}
      {infants > 0 && <span title="Infants">👶 {infants}</span>}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ReservationsPage() {
  const { reservations, guests, rooms, room_types, loading, error, mutate } =
    useHotelData();

  const today = todayISO();
  const [draftFilters, setDraftFilters] = useState<ReservationFilters>(() =>
    defaultFilters(today),
  );
  const [appliedFilters, setAppliedFilters] = useState<ReservationFilters>(() =>
    defaultFilters(today),
  );
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [draft, setDraft] = useState<ReturnType<
    typeof defaultReservationForm
  > | null>(null);
  const [draftKey, setDraftKey] = useState(0);

  const createModal = useModal();
  const detailModal = useModal();

  const filteredRows = useMemo(
    () =>
      filterReservations(
        reservations,
        guests,
        rooms,
        appliedFilters,
      ),
    [reservations, guests, rooms, appliedFilters],
  );

  const grouped = useMemo(
    () => groupRowsByDate(filteredRows),
    [filteredRows],
  );

  function patchDraft(values: Partial<ReservationFilters>) {
    setDraftFilters((prev) => ({ ...prev, ...values }));
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setAppliedFilters({ ...draftFilters });
  }

  function openCreate() {
    const fallbackRoom =
      rooms.find((r) => r.status === "available") ?? rooms[0];
    setDraft(
      defaultReservationForm({
        guest_id: guests[0]?.id ?? "",
        guest_mode: guests[0] ? "existing" : "new",
        room_id: fallbackRoom?.id ?? "",
        room_type: fallbackRoom?.type ?? "",
        check_in: today,
        check_out: addDays(today, 1),
      }),
    );
    setDraftKey((k) => k + 1);
    createModal.openModal();
  }

  function openReservation(reservation: Reservation) {
    setSelected(reservation);
    detailModal.openModal();
  }

  const onCreate = (values: ReturnType<typeof defaultReservationForm>) =>
    mutate(() => api.createReservation(formToCreateInput(values)));

  const onAction = (action: ReservationAction, id: string) =>
    mutate(() => {
      if (action === "checkin") return api.checkIn(id);
      if (action === "checkout") return api.checkOut(id);
      return api.cancelReservation(id);
    });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">
          Reservations
        </h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Search and manage bookings across all channels.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Filter panel */}
      <form
        onSubmit={onSearch}
        className="mb-0 rounded-t-2xl bg-gray-800 px-5 py-5 dark:bg-gray-900"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Guest last name">
            <input
              className={filterInputClass}
              placeholder="e.g. Davis"
              value={draftFilters.lastName}
              onChange={(e) => patchDraft({ lastName: e.target.value })}
            />
          </FilterField>
          <FilterField label="Booking reference">
            <input
              className={filterInputClass}
              placeholder="Reference code"
              value={draftFilters.reference}
              onChange={(e) => patchDraft({ reference: e.target.value })}
            />
          </FilterField>
          <FilterField label="Invoice number">
            <input
              className={filterInputClass}
              placeholder="Invoice or ID"
              value={draftFilters.invoice}
              onChange={(e) => patchDraft({ invoice: e.target.value })}
            />
          </FilterField>
          <FilterField label="Date type">
            <select
              className={filterSelectClass}
              value={draftFilters.dateType}
              onChange={(e) =>
                patchDraft({
                  dateType: e.target.value as ReservationFilters["dateType"],
                })
              }
            >
              {DATE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Status">
            <select
              className={filterSelectClass}
              value={draftFilters.status}
              onChange={(e) => patchDraft({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Date from">
            <input
              className={filterInputClass}
              type="date"
              value={draftFilters.dateFrom}
              onChange={(e) => patchDraft({ dateFrom: e.target.value })}
            />
          </FilterField>
          <FilterField label="Date to">
            <input
              className={filterInputClass}
              type="date"
              value={draftFilters.dateTo}
              onChange={(e) => patchDraft({ dateTo: e.target.value })}
            />
          </FilterField>
          <FilterField label="Source">
            <select
              className={filterSelectClass}
              value={draftFilters.source}
              onChange={(e) => patchDraft({ source: e.target.value })}
            >
              <option value="all">All</option>
              {BOOKING_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" type="submit">
            Search
          </Button>
        </div>
      </form>

      {/* Results */}
      <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {filteredRows.length} reservation
            {filteredRows.length === 1 ? "" : "s"} found
          </p>
          <div className="flex items-center gap-4 text-theme-sm">
            <button
              type="button"
              onClick={openCreate}
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              + Create reservation
            </button>
            <button
              type="button"
              onClick={() => exportReservationsCsv(filteredRows)}
              disabled={filteredRows.length === 0}
              className="font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Export
            </button>
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
              <TableRow>
                <TableCell isHeader className={headerCell}>
                  Status
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Name
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Reference
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Source
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Occupants
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Check-in
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Check-out
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Booked
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  ETA
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Room
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Total
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Amount due
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Invoice
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="px-5 py-10 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading
                      ? "Loading…"
                      : "No reservations match your search criteria."}
                  </TableCell>
                </TableRow>
              )}

              {grouped.map((group) => (
                <Fragment key={group.date}>
                  <TableRow className="bg-brand-50/70 dark:bg-brand-500/10">
                    <TableCell
                      colSpan={13}
                      className="px-3 py-2 text-theme-xs font-semibold text-brand-700 dark:text-brand-300"
                    >
                      {group.label}
                    </TableCell>
                  </TableRow>
                  {group.rows.map(
                    ({
                      reservation: r,
                      displayName,
                      displayReference,
                      total,
                      amountDue,
                    }) => (
                      <TableRow
                        key={r.id}
                        className="border-b border-gray-100 hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                      >
                        <TableCell className={bodyCell}>
                          <ReservationStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className={bodyCell}>
                          <button
                            type="button"
                            onClick={() => openReservation(r)}
                            className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                          >
                            {displayName}
                          </button>
                        </TableCell>
                        <TableCell className={bodyCell}>
                          <button
                            type="button"
                            onClick={() => openReservation(r)}
                            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {displayReference}
                          </button>
                        </TableCell>
                        <TableCell className={bodyCell}>
                          {r.booking_source ?? "Direct"}
                        </TableCell>
                        <TableCell className={bodyCell}>
                          <Occupants
                            adults={r.adults ?? 1}
                            children={r.children ?? 0}
                            infants={r.infants ?? 0}
                          />
                        </TableCell>
                        <TableCell className={`${bodyCell} tabular-nums`}>
                          {formatShortDate(r.check_in)}
                        </TableCell>
                        <TableCell className={`${bodyCell} tabular-nums`}>
                          {formatShortDate(r.check_out)}
                        </TableCell>
                        <TableCell className={`${bodyCell} tabular-nums`}>
                          {formatShortDate(r.created_at.slice(0, 10))}
                        </TableCell>
                        <TableCell className={`${bodyCell} tabular-nums`}>
                          {r.arrival_time || "—"}
                        </TableCell>
                        <TableCell className={bodyCell}>
                          {r.room_number ?? "—"}
                        </TableCell>
                        <TableCell className={`${bodyCell} tabular-nums`}>
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell
                          className={`${bodyCell} tabular-nums font-semibold text-error-600 dark:text-error-400`}
                        >
                          {formatCurrency(amountDue)}
                        </TableCell>
                        <TableCell className={bodyCell}>
                          {r.amount_paid && r.amount_paid > 0 ? (
                            <span className="text-brand-600 dark:text-brand-400">
                              Paid
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {draft && (
        <ReservationDialog
          key={draftKey}
          isOpen={createModal.isOpen}
          onClose={createModal.closeModal}
          guests={guests}
          rooms={rooms}
          roomTypes={room_types}
          initial={draft}
          onCreate={onCreate}
        />
      )}

      <ReservationDetailDialog
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        reservation={selected}
        guest={guests.find((g) => g.id === selected?.guest_id) ?? null}
        rooms={rooms}
        roomTypes={room_types}
        onAction={onAction}
      />
    </div>
  );
}
