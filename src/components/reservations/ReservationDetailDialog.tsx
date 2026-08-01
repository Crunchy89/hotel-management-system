"use client";

import React, { useMemo, useState } from "react";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import FolioTab from "@/components/reservations/FolioTab";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { folioBalance } from "@/lib/folio";
import { dayDiff, formatDate } from "@/lib/metrics";
import type { Guest, Reservation, Room, RoomTypeRecord } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";
import {
  type ReservationTab,
  bookingTotals,
  formatCurrency,
  formatStayLength,
  reservationToForm,
} from "./reservationFormUtils";

export type ReservationAction = "checkin" | "checkout" | "cancel";

const TABS: { id: ReservationTab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "guest", label: "Guest" },
  { id: "folio", label: "Folio" },
  { id: "notes", label: "Notes" },
];

interface ReservationDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  guest?: Guest | null;
  rooms: Room[];
  roomTypes: RoomTypeRecord[];
  onAction: (action: ReservationAction, id: string) => Promise<boolean>;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </dd>
    </div>
  );
}

const ReservationDetailDialog: React.FC<ReservationDetailDialogProps> = ({
  isOpen,
  onClose,
  reservation,
  guest,
  rooms,
  roomTypes,
  onAction,
}) => {
  const [tab, setTab] = useState<ReservationTab>("details");
  const { folio_lines, mutate } = useHotelData();

  const form = useMemo(
    () => (reservation ? reservationToForm(reservation, guest ?? undefined) : null),
    [reservation, guest],
  );

  const lines = useMemo(
    () =>
      reservation
        ? folio_lines.filter((l) => l.reservation_id === reservation.id)
        : [],
    [folio_lines, reservation],
  );

  if (!reservation || !form) return null;

  const room = rooms.find((r) => r.id === reservation.room_id);
  const isUnallocated = !reservation.room_id && Boolean(reservation.room_type);
  const nights = Math.max(0, dayDiff(reservation.check_in, reservation.check_out));
  const totals = bookingTotals(form, room, nights);
  const balance = folioBalance(reservation, room, lines);
  const typeLabel =
    roomTypes.find((t) => t.slug === (reservation.room_type ?? room?.type))
      ?.label ?? reservation.room_type;

  async function run(action: ReservationAction) {
    const ok = await onAction(action, reservation!.id);
    if (ok) onClose();
  }

  async function sendPreArrival() {
    await mutate(() =>
      api.sendGuestMessage({
        reservation_id: reservation!.id,
        kind: "pre_arrival",
      }),
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[95vh] max-w-[1120px] overflow-hidden p-0"
    >
      <div className="flex max-h-[95vh] flex-col">
        <div className="flex shrink-0 gap-1 overflow-x-auto bg-brand-500 px-4 py-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                tab === item.id
                  ? "bg-white text-brand-600"
                  : "text-white/90 hover:bg-white/15"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row lg:p-8">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-theme-xl font-semibold text-gray-800 dark:text-white/90">
                  {reservation.guest_name}
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isUnallocated
                    ? reservation.room_number
                    : `Room ${reservation.room_number}${room ? ` · ${typeLabel}` : ""}`}
                </p>
              </div>
              <ReservationStatusBadge status={reservation.status} />
            </div>

            {tab === "details" && (
              <>
                <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                  <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                    <DetailRow
                      label="Check-in"
                      value={formatDate(reservation.check_in, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    />
                    <DetailRow
                      label="Check-out"
                      value={formatDate(reservation.check_out, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    />
                    <DetailRow label="Length of stay" value={formatStayLength(nights)} />
                    <DetailRow label="Room type" value={typeLabel} />
                    <DetailRow
                      label="Room"
                      value={
                        isUnallocated ? "Unallocated" : `Room ${reservation.room_number}`
                      }
                    />
                    <DetailRow label="Adults" value={reservation.adults ?? 1} />
                    <DetailRow label="Children" value={reservation.children ?? 0} />
                    <DetailRow label="Infants" value={reservation.infants ?? 0} />
                    <DetailRow label="Booking source" value={reservation.booking_source} />
                    <DetailRow label="Arrival time" value={reservation.arrival_time} />
                    <DetailRow label="Reference" value={reservation.reference} />
                  </dl>
                </section>
                {reservation.status === "booked" && guest?.email && (
                  <Button size="sm" variant="outline" onClick={() => void sendPreArrival()}>
                    Send pre-arrival email
                  </Button>
                )}
              </>
            )}

            {tab === "guest" && guest && (
              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                  <DetailRow label="Email" value={guest.email} />
                  <DetailRow label="Mobile" value={guest.phone} />
                  <DetailRow label="Organization" value={guest.organization} />
                  <DetailRow label="Address" value={guest.address_line1} />
                  <DetailRow label="" value={guest.address_line2} />
                  <DetailRow
                    label="City / Country"
                    value={[guest.city, guest.country].filter(Boolean).join(", ")}
                  />
                  <DetailRow label="Postal code" value={guest.postal_code} />
                  <DetailRow
                    label="ID document"
                    value={
                      guest.id_document_type
                        ? `${guest.id_document_type}: ${guest.id_document}`
                        : guest.id_document
                    }
                  />
                </dl>
              </section>
            )}

            {tab === "folio" && (
              <FolioTab reservation={reservation} room={room} />
            )}

            {tab === "notes" && (
              <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
                {reservation.notes && (
                  <div className="mb-4">
                    <h6 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      Internal notes
                    </h6>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reservation.notes}
                    </p>
                  </div>
                )}
                {reservation.guest_comments && (
                  <div>
                    <h6 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      Guest comments
                    </h6>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reservation.guest_comments}
                    </p>
                  </div>
                )}
                {!reservation.notes && !reservation.guest_comments && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No notes recorded.
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="w-full shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:w-72">
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Booking summary
            </h5>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Room total</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(totals.roomTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Extra persons</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(form.extra_person || 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Discount</dt>
                <dd className="font-medium tabular-nums">
                  −{formatCurrency(form.discount || 0)}
                </dd>
              </div>
              {balance.charges > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Folio charges</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCurrency(balance.charges)}
                  </dd>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCurrency(balance.total)}
                  </dd>
                </div>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Received</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(balance.paid)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-error-600">Amount due</dt>
                <dd className="font-bold tabular-nums text-error-600">
                  {formatCurrency(balance.due)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 text-xs font-semibold text-brand-600 hover:underline"
              onClick={() => setTab("folio")}
            >
              Manage folio →
            </button>
          </aside>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          {reservation.status === "booked" && (
            <button
              type="button"
              onClick={() => void run("cancel")}
              className="text-sm font-medium text-error-600 hover:text-error-700 dark:text-error-400"
            >
              Cancel booking
            </button>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
            {reservation.status === "booked" && !isUnallocated && (
              <Button size="sm" onClick={() => void run("checkin")}>
                Check in
              </Button>
            )}
            {reservation.status === "checked_in" && (
              <Button size="sm" onClick={() => void run("checkout")}>
                Check out
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReservationDetailDialog;
