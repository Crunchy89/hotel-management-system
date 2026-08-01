"use client";

import { FormEvent, Fragment, useMemo, useState } from "react";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import AvailabilitySearch from "@/components/reservations/AvailabilitySearch";
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
import { Alert, inputClass, selectClass } from "@/components/form";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import {
  FilterField,
  FilterPanel,
  PageShell,
  SegmentTabs,
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
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { addDays, dayDiff, formatCurrency, todayISO } from "@/lib/metrics";
import type { Reservation, Room } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

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
  childCount,
  infants,
}: {
  adults: number;
  childCount: number;
  infants: number;
}) {
  return (
    <div className="flex items-center gap-2 text-theme-xs text-gray-600 dark:text-gray-400">
      <span title="Adults">👤 {adults}</span>
      {childCount > 0 && <span title="Children">🧒 {childCount}</span>}
      {infants > 0 && <span title="Infants">👶 {infants}</span>}
    </div>
  );
}

export default function ReservationsPage() {
  const { reservations, guests, rooms, room_types, loading, error, mutate } =
    useHotelData();

  const today = todayISO();
  const [view, setView] = useState<"available" | "bookings">("available");
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
      filterReservations(reservations, guests, rooms, appliedFilters),
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

  function openReserve(room: Room, checkIn: string, checkOut: string) {
    const nights = Math.max(0, dayDiff(checkIn, checkOut));
    setDraft(
      defaultReservationForm({
        guest_id: guests[0]?.id ?? "",
        guest_mode: guests[0] ? "existing" : "new",
        room_id: room.id,
        room_type: room.type,
        check_in: checkIn,
        check_out: checkOut,
        room_amount: room.rate * nights,
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
    <PageShell>
      <PageHeader
        title="Reservations"
        description="Find open rooms for tonight, or search existing bookings."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentTabs
              tabs={[
                { id: "available" as const, label: "Available rooms" },
                { id: "bookings" as const, label: "Bookings" },
              ]}
              value={view}
              onChange={setView}
            />
            <Button size="sm" onClick={openCreate}>
              + Create reservation
            </Button>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      {view === "available" ? (
        <AvailabilitySearch
          rooms={rooms}
          reservations={reservations}
          roomTypes={room_types}
          loading={loading}
          onReserve={openReserve}
        />
      ) : (
        <>
          <FilterPanel
            onSubmit={onSearch}
            action={
              <Button size="sm" type="submit">
                Search
              </Button>
            }
          >
            <FilterField label="Guest last name">
              <input
                className={inputClass}
                placeholder="e.g. Davis"
                value={draftFilters.lastName}
                onChange={(e) => patchDraft({ lastName: e.target.value })}
              />
            </FilterField>
            <FilterField label="Booking reference">
              <input
                className={inputClass}
                placeholder="Reference code"
                value={draftFilters.reference}
                onChange={(e) => patchDraft({ reference: e.target.value })}
              />
            </FilterField>
            <FilterField label="Invoice number">
              <input
                className={inputClass}
                placeholder="Invoice or ID"
                value={draftFilters.invoice}
                onChange={(e) => patchDraft({ invoice: e.target.value })}
              />
            </FilterField>
            <FilterField label="Date type">
              <select
                className={selectClass}
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
                className={selectClass}
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
                className={inputClass}
                type="date"
                value={draftFilters.dateFrom}
                onChange={(e) => patchDraft({ dateFrom: e.target.value })}
              />
            </FilterField>
            <FilterField label="Date to">
              <input
                className={inputClass}
                type="date"
                value={draftFilters.dateTo}
                onChange={(e) => patchDraft({ dateTo: e.target.value })}
              />
            </FilterField>
            <FilterField label="Source">
              <select
                className={selectClass}
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
          </FilterPanel>

          <SurfaceCard className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
              <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                <span className="text-brand-600 dark:text-brand-400">
                  {filteredRows.length}
                </span>{" "}
                reservation{filteredRows.length === 1 ? "" : "s"} found
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => exportReservationsCsv(filteredRows)}
                  disabled={filteredRows.length === 0}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
                  <TableRow>
                    <TableCell isHeader className={tableHeaderCell}>
                      Status
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Name
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Reference
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Source
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Occupants
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Check-in
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Check-out
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Booked
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      ETA
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Room
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Total
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
                      Amount due
                    </TableCell>
                    <TableCell isHeader className={tableHeaderCell}>
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
                            <TableCell className={tableBodyCell}>
                              <ReservationStatusBadge status={r.status} />
                            </TableCell>
                            <TableCell className={tableBodyCell}>
                              <button
                                type="button"
                                onClick={() => openReservation(r)}
                                className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                              >
                                {displayName}
                              </button>
                            </TableCell>
                            <TableCell className={tableBodyCell}>
                              <button
                                type="button"
                                onClick={() => openReservation(r)}
                                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                              >
                                {displayReference}
                              </button>
                            </TableCell>
                            <TableCell className={tableBodyCell}>
                              {r.booking_source ?? "Direct"}
                            </TableCell>
                            <TableCell className={tableBodyCell}>
                              <Occupants
                                adults={r.adults ?? 1}
                                childCount={r.children ?? 0}
                                infants={r.infants ?? 0}
                              />
                            </TableCell>
                            <TableCell
                              className={`${tableBodyCell} tabular-nums`}
                            >
                              {formatShortDate(r.check_in)}
                            </TableCell>
                            <TableCell
                              className={`${tableBodyCell} tabular-nums`}
                            >
                              {formatShortDate(r.check_out)}
                            </TableCell>
                            <TableCell
                              className={`${tableBodyCell} tabular-nums`}
                            >
                              {formatShortDate(r.created_at.slice(0, 10))}
                            </TableCell>
                            <TableCell
                              className={`${tableBodyCell} tabular-nums`}
                            >
                              {r.arrival_time || "—"}
                            </TableCell>
                            <TableCell className={tableBodyCell}>
                              {r.room_number ?? "—"}
                            </TableCell>
                            <TableCell
                              className={`${tableBodyCell} tabular-nums`}
                            >
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell
                              className={`${tableBodyCell} tabular-nums font-semibold text-error-600 dark:text-error-400`}
                            >
                              {formatCurrency(amountDue)}
                            </TableCell>
                            <TableCell className={tableBodyCell}>
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
          </SurfaceCard>
        </>
      )}

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
    </PageShell>
  );
}
