"use client";

import React, { useState } from "react";
import { Field, inputClass, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { dayDiff, formatCurrency } from "@/lib/metrics";
import type { Guest, Room } from "@/lib/types";

export type ReservationFormValues = {
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  notes: string;
};

interface ReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  rooms: Room[];
  initial: ReservationFormValues;
  /** Resolves true when the booking was created. */
  onCreate: (values: ReservationFormValues) => Promise<boolean>;
}

/**
 * Remount this with a fresh `key` to reset the form for a new booking.
 */
const ReservationDialog: React.FC<ReservationDialogProps> = ({
  isOpen,
  onClose,
  guests,
  rooms,
  initial,
  onCreate,
}) => {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const room = rooms.find((r) => r.id === form.room_id);
  const nights = Math.max(0, dayDiff(form.check_in, form.check_out));
  const total = room ? room.rate * nights : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onCreate(form);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-6 lg:p-8">
      <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
        New reservation
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Overlapping stays for the same room are rejected automatically.
      </p>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Guest" className="sm:col-span-2">
            <select
              className={inputClass}
              required
              value={form.guest_id}
              onChange={(e) => setForm({ ...form, guest_id: e.target.value })}
            >
              <option value="" disabled>
                Select guest
              </option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.first_name} {g.last_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Room" className="sm:col-span-2">
            <select
              className={inputClass}
              required
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
            >
              <option value="" disabled>
                Select room
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} · {r.type} · ${r.rate}/night
                </option>
              ))}
            </select>
          </Field>

          <Field label="Check-in">
            <input
              className={inputClass}
              type="date"
              required
              value={form.check_in}
              onChange={(e) => setForm({ ...form, check_in: e.target.value })}
            />
          </Field>

          <Field label="Check-out">
            <input
              className={inputClass}
              type="date"
              required
              value={form.check_out}
              onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            />
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            <textarea
              className={textareaClass}
              rows={3}
              placeholder="Requests, arrival time, preferences…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
        </div>

        {nights > 0 && room && (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {nights} night{nights === 1 ? "" : "s"} · Room {room.number}
            </span>
            <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
              {formatCurrency(total)}
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 sm:justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create booking"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReservationDialog;
