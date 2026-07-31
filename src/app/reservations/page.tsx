"use client";

import { useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import ReservationDetailDialog, {
  type ReservationAction,
} from "@/components/reservations/ReservationDetailDialog";
import ReservationDialog, {
  type ReservationFormValues,
} from "@/components/reservations/ReservationDialog";
import { Alert, inputClass } from "@/components/form";
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
import { addDays, dayDiff, formatCurrency, todayISO } from "@/lib/metrics";
import type { Reservation } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const headerCell =
  "px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const bodyCell = "px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300";

const filters = ["all", "booked", "checked_in", "checked_out", "cancelled"];

export default function ReservationsPage() {
  const { reservations, guests, rooms, loading, error, mutate } =
    useHotelData();

  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [draft, setDraft] = useState<ReservationFormValues | null>(null);
  const [draftKey, setDraftKey] = useState(0);

  const createModal = useModal();
  const detailModal = useModal();

  const rateById = useMemo(
    () => new Map(rooms.map((r) => [r.id, r.rate])),
    [rooms],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.guest_name ?? ""} ${r.room_number ?? ""} ${r.notes}`
        .toLowerCase()
        .includes(q);
    });
  }, [reservations, statusFilter, query]);

  function openCreate() {
    const today = todayISO();
    setDraft({
      guest_id: guests[0]?.id ?? "",
      room_id:
        rooms.find((r) => r.status === "available")?.id ?? rooms[0]?.id ?? "",
      check_in: today,
      check_out: addDays(today, 1),
      notes: "",
    });
    setDraftKey((k) => k + 1);
    createModal.openModal();
  }

  function openReservation(reservation: Reservation) {
    setSelected(reservation);
    detailModal.openModal();
  }

  const onCreate = (values: ReservationFormValues) =>
    mutate(() => api.createReservation(values));

  const onAction = (action: ReservationAction, id: string) =>
    mutate(() => {
      if (action === "checkin") return api.checkIn(id);
      if (action === "checkout") return api.checkOut(id);
      return api.cancelReservation(id);
    });

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Book stays, check guests in and out, and manage overlaps."
        action={
          <Button size="sm" onClick={openCreate}>
            New reservation
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-4 py-2 text-theme-sm font-medium capitalize transition ${
                statusFilter === s
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              }`}
            >
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        <input
          className={`${inputClass} sm:w-72`}
          placeholder="Search guest, room, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ComponentCard
        title="Booking list"
        desc={`${filtered.length} reservation${filtered.length === 1 ? "" : "s"} in this view`}
      >
        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={headerCell}>
                  Guest
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Room
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Dates
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Nights
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Total
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Status
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading ? "Loading…" : "No reservations in this filter."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => {
                const nights = Math.max(0, dayDiff(r.check_in, r.check_out));
                const total = (rateById.get(r.room_id) ?? 0) * nights;

                return (
                  <TableRow key={r.id}>
                    <TableCell className={bodyCell}>
                      <button
                        type="button"
                        onClick={() => openReservation(r)}
                        className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                      >
                        {r.guest_name}
                      </button>
                    </TableCell>
                    <TableCell className={bodyCell}>{r.room_number}</TableCell>
                    <TableCell className={`${bodyCell} tabular-nums`}>
                      {r.check_in} → {r.check_out}
                    </TableCell>
                    <TableCell className={`${bodyCell} tabular-nums`}>
                      {nights}
                    </TableCell>
                    <TableCell className={`${bodyCell} tabular-nums`}>
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell className={bodyCell}>
                      <ReservationStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className={bodyCell}>
                      <div className="flex flex-wrap gap-2">
                        {r.status === "booked" && (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => void onAction("checkin", r.id)}
                            >
                              Check in
                            </Button>
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => void onAction("cancel", r.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {r.status === "checked_in" && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void onAction("checkout", r.id)}
                          >
                            Check out
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {draft && (
        <ReservationDialog
          key={draftKey}
          isOpen={createModal.isOpen}
          onClose={createModal.closeModal}
          guests={guests}
          rooms={rooms}
          initial={draft}
          onCreate={onCreate}
        />
      )}

      <ReservationDetailDialog
        isOpen={detailModal.isOpen}
        onClose={detailModal.closeModal}
        reservation={selected}
        rooms={rooms}
        onAction={onAction}
      />
    </div>
  );
}
