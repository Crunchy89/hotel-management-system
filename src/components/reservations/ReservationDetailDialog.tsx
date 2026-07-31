"use client";

import React from "react";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { dayDiff, formatCurrency, formatDate } from "@/lib/metrics";
import type { Reservation, Room } from "@/lib/types";

export type ReservationAction = "checkin" | "checkout" | "cancel";

interface ReservationDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  rooms: Room[];
  onAction: (action: ReservationAction, id: string) => Promise<boolean>;
}

const ReservationDetailDialog: React.FC<ReservationDetailDialogProps> = ({
  isOpen,
  onClose,
  reservation,
  rooms,
  onAction,
}) => {
  if (!reservation) return null;

  const room = rooms.find((r) => r.id === reservation.room_id);
  const nights = Math.max(
    0,
    dayDiff(reservation.check_in, reservation.check_out),
  );
  const total = room ? room.rate * nights : 0;

  async function run(action: ReservationAction) {
    const ok = await onAction(action, reservation!.id);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4 pr-12">
        <div>
          <h4 className="text-theme-xl font-semibold text-gray-800 dark:text-white/90">
            {reservation.guest_name}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Room {reservation.room_number}
            {room ? ` · ${room.type}` : ""}
          </p>
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <dl className="divide-y divide-gray-100 dark:divide-gray-800">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">Check-in</dt>
          <dd className="text-sm font-medium text-gray-800 dark:text-white/90">
            {formatDate(reservation.check_in, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">Check-out</dt>
          <dd className="text-sm font-medium text-gray-800 dark:text-white/90">
            {formatDate(reservation.check_out, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">Nights</dt>
          <dd className="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
            {nights}
          </dd>
        </div>
        {room && (
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-gray-500 dark:text-gray-400">
              Total · {formatCurrency(room.rate)}/night
            </dt>
            <dd className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {formatCurrency(total)}
            </dd>
          </div>
        )}
        {reservation.notes && (
          <div className="py-3">
            <dt className="mb-1 text-sm text-gray-500 dark:text-gray-400">
              Notes
            </dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300">
              {reservation.notes}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-7 flex flex-wrap items-center gap-3 sm:justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
        {reservation.status === "booked" && (
          <>
            <Button size="sm" variant="danger" onClick={() => void run("cancel")}>
              Cancel booking
            </Button>
            <Button size="sm" onClick={() => void run("checkin")}>
              Check in
            </Button>
          </>
        )}
        {reservation.status === "checked_in" && (
          <Button size="sm" onClick={() => void run("checkout")}>
            Check out
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ReservationDetailDialog;
