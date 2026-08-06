"use client";

import React, { useMemo, useState } from "react";
import { Alert } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/context/LocaleContext";
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
  const t = useT();
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
    roomTypes.find((rt) => rt.slug === slug)?.label ?? slug;

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
      setError(t("moveRoom.error"));
    }
  }

  const currentRoomLabel = current
    ? t("moveRoom.roomLabel", { number: current.number })
    : t("moveRoom.unallocated");

  let footerHint = t("moveRoom.keyRevoked");
  if (target) {
    if (rateDelta === 0) {
      footerHint = t("moveRoom.movingSame", { number: target.number });
    } else if (rateDelta > 0) {
      footerHint =
        nights === 1
          ? t("moveRoom.movingAdds", {
              number: target.number,
              amount: formatCurrency(Math.abs(rateDelta)),
              nights,
            })
          : t("moveRoom.movingAdds_other", {
              number: target.number,
              amount: formatCurrency(Math.abs(rateDelta)),
              nights,
            });
    } else {
      footerHint =
        nights === 1
          ? t("moveRoom.movingSaves", {
              number: target.number,
              amount: formatCurrency(Math.abs(rateDelta)),
              nights,
            })
          : t("moveRoom.movingSaves_other", {
              number: target.number,
              amount: formatCurrency(Math.abs(rateDelta)),
              nights,
            });
    }
  }

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="border-b border-gray-200 px-5 py-4 pr-16 dark:border-gray-800 sm:px-6 sm:pr-20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          {t("moveRoom.title")}
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
          · {t("moveRoom.currently", { room: currentRoomLabel })}
        </p>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-5 sm:p-6">
        {error && <Alert>{error}</Alert>}

        {candidates.length === 0 ? (
          <p className="py-10 text-center text-theme-sm text-gray-500">
            {t("moveRoom.noRooms")}
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
                    {t("moveRoom.roomLabel", { number: room.number })}
                  </div>
                  <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {t("moveRoom.roomMeta", {
                      type: typeLabel(room.type),
                      floor: room.floor,
                      rate: formatCurrency(room.rate),
                    })}
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
                    ? t("moveRoom.sameRate")
                    : `${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))}`}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {footerHint}
        </span>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!targetId || saving}
            onClick={() => void move()}
          >
            {saving ? t("moveRoom.moving") : t("moveRoom.confirm")}
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
