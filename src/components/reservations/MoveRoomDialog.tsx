"use client";

import React, { useMemo, useState } from "react";
import { Alert } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import {
  availableRoomsForDates,
  dayDiff,
  formatCurrency,
  formatDate,
} from "@/lib/metrics";
import type { Reservation, Room, RoomTypeRecord } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

interface MoveRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  rooms: Room[];
  roomTypes: RoomTypeRecord[];
  reservations: Reservation[];
  onMoved?: () => void;
}

type MoveRoomBodyProps = Omit<MoveRoomDialogProps, "isOpen" | "reservation"> & {
  reservation: Reservation;
};

function MoveRoomBody({
  onClose,
  reservation,
  rooms,
  roomTypes,
  reservations,
  onMoved,
}: MoveRoomBodyProps) {
  const { mutate } = useHotelData();
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nights = Math.max(
    0,
    dayDiff(reservation.check_in, reservation.check_out),
  );
  const current = rooms.find((r) => r.id === reservation.room_id);

  const candidates = useMemo(
    () =>
      availableRoomsForDates(
        rooms,
        reservations,
        reservation.check_in,
        reservation.check_out,
      ).filter((room) => room.id !== reservation.room_id),
    [reservation, rooms, reservations],
  );

  const target = candidates.find((r) => r.id === targetId);
  const rateDelta = target ? (target.rate - (current?.rate ?? 0)) * nights : 0;
  const typeLabel = (slug: string) =>
    roomTypes.find((t) => t.slug === slug)?.label ?? slug;

  async function move() {
    if (!targetId) return;
    setSaving(true);
    setError("");
    const ok = await mutate(() =>
      api.moveReservationRoom({ id: reservation.id, room_id: targetId }),
    );
    setSaving(false);
    if (ok) {
      onMoved?.();
      onClose();
    } else {
      setError("That room could not be used. Pick another one.");
    }
  }

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="border-b border-gray-200 px-5 py-4 pr-16 dark:border-gray-800 sm:px-6 sm:pr-20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          Move room
        </h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {reservation.guest_name} ·{" "}
          {formatDate(reservation.check_in, {
            month: "short",
            day: "numeric",
          })}{" "}
          →{" "}
          {formatDate(reservation.check_out, {
            month: "short",
            day: "numeric",
          })}{" "}
          · currently {current ? `Room ${current.number}` : "unallocated"}
        </p>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-5 sm:p-6">
        {error && <Alert>{error}</Alert>}

        {candidates.length === 0 ? (
          <p className="py-10 text-center text-theme-sm text-gray-500">
            No other room is free for these dates.
          </p>
        ) : (
          candidates.map((room) => {
            const selected = room.id === targetId;
            const delta = (room.rate - (current?.rate ?? 0)) * nights;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setTargetId(room.id)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-gray-200 hover:border-brand-300 dark:border-gray-800 dark:hover:border-brand-500/50"
                }`}
              >
                <div>
                  <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                    Room {room.number}
                  </div>
                  <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {typeLabel(room.type)} · floor {room.floor} ·{" "}
                    {formatCurrency(room.rate)}/night
                  </div>
                </div>
                <span
                  className={`text-theme-xs font-semibold tabular-nums ${
                    delta > 0
                      ? "text-error-600"
                      : delta < 0
                        ? "text-success-600"
                        : "text-gray-400"
                  }`}
                >
                  {delta === 0
                    ? "Same rate"
                    : `${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))}`}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {target
            ? rateDelta === 0
              ? `Moving to Room ${target.number} keeps the stay total unchanged.`
              : `Moving to Room ${target.number} ${
                  rateDelta > 0 ? "adds" : "saves"
                } ${formatCurrency(Math.abs(rateDelta))} over ${nights} night${
                  nights === 1 ? "" : "s"
                }.`
            : "Any active key card is revoked after a move."}
        </span>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!targetId || saving}
            onClick={() => void move()}
          >
            {saving ? "Moving…" : "Move room"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MoveRoomDialog({
  isOpen,
  onClose,
  reservation,
  ...rest
}: MoveRoomDialogProps) {
  if (!reservation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-xl overflow-hidden p-0"
    >
      <MoveRoomBody onClose={onClose} reservation={reservation} {...rest} />
    </Modal>
  );
}
