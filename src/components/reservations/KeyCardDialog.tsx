"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { Reservation, Room } from "@/lib/types";
import {
  KEY_CARD_STATUS_COPY,
  KeyCardBody,
  useKeyCardEncoder,
} from "./KeyCardPanel";

interface KeyCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  rooms: Room[];
}

function KeyCardDialogInner({
  onClose,
  reservation,
  rooms,
}: {
  onClose: () => void;
  reservation: Reservation;
  rooms: Room[];
}) {
  const encoder = useKeyCardEncoder(reservation);
  const room = rooms.find((r) => r.id === reservation.room_id);
  const copy = KEY_CARD_STATUS_COPY[encoder.status];

  return (
    <div className="flex max-h-[90vh] flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 pr-16 dark:border-gray-800 sm:px-6 sm:pr-20">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Key card
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {reservation.guest_name} ·{" "}
            {room ? `Room ${room.number}` : "Unallocated"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-theme-xs font-medium ${copy.tone}`}
        >
          {copy.label}
        </span>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <KeyCardBody reservation={reservation} room={room} encoder={encoder} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        {encoder.status === "active" ? (
          <button
            type="button"
            disabled={encoder.busy}
            onClick={() => void encoder.revoke()}
            className="text-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-50 dark:text-error-400"
          >
            Revoke key
          </button>
        ) : (
          <span />
        )}
        <div className="ml-auto flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            disabled={!encoder.canEncode}
            onClick={() => void encoder.encode()}
          >
            {encoder.writeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function KeyCardDialog({
  isOpen,
  onClose,
  reservation,
  rooms,
}: KeyCardDialogProps) {
  if (!reservation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-lg overflow-hidden p-0"
    >
      <KeyCardDialogInner
        onClose={onClose}
        reservation={reservation}
        rooms={rooms}
      />
    </Modal>
  );
}
