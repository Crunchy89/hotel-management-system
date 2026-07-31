"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Field,
  Modal,
  btnDanger,
  btnPrimary,
  btnSecondary,
  btnSmall,
  inputClass,
} from "@/components/Modal";
import { ReservationStatusBadge } from "@/components/StatusBadge";
import type { Guest, Reservation, Room } from "@/lib/types";
import { api, formatError } from "@/lib/api";

const emptyForm = {
  guest_id: "",
  room_id: "",
  check_in: "",
  check_out: "",
  notes: "",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, g, r] = await Promise.all([
        api.listReservations(),
        api.listGuests(),
        api.listRooms(),
      ]);
      setReservations(res);
      setGuests(g);
      setRooms(r);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return reservations;
    return reservations.filter((r) => r.status === statusFilter);
  }, [reservations, statusFilter]);

  function openCreate() {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setForm({
      guest_id: guests[0]?.id ?? "",
      room_id: rooms.find((r) => r.status === "available")?.id ?? rooms[0]?.id ?? "",
      check_in: today,
      check_out: tomorrow,
      notes: "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createReservation(form);
      setOpen(false);
      await load();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function act(kind: "checkin" | "checkout" | "cancel", id: string) {
    setError("");
    try {
      if (kind === "checkin") await api.checkIn(id);
      if (kind === "checkout") await api.checkOut(id);
      if (kind === "cancel") await api.cancelReservation(id);
      await load();
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
          <p className="mt-1 text-sm text-muted">
            Book stays, check guests in and out, and manage overlaps.
          </p>
        </div>
        <button type="button" onClick={openCreate} className={btnPrimary}>
          New reservation
        </button>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "booked", "checked_in", "checked_out", "cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
              statusFilter === s
                ? "bg-brand text-white"
                : "border border-line bg-white text-ink hover:bg-bg"
            }`}
          >
            {s.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-bg/80 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="px-4 py-3 font-semibold">Dates</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {loading ? "Loading…" : "No reservations in this filter."}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                <td className="px-4 py-3">{r.room_number}</td>
                <td className="px-4 py-3 tabular-nums">
                  {r.check_in} → {r.check_out}
                </td>
                <td className="px-4 py-3">
                  <ReservationStatusBadge status={r.status} />
                </td>
                <td className="max-w-[12rem] truncate px-4 py-3 text-muted">
                  {r.notes || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {r.status === "booked" && (
                      <>
                        <button
                          type="button"
                          className={btnSmall}
                          onClick={() => void act("checkin", r.id)}
                        >
                          Check in
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => void act("cancel", r.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {r.status === "checked_in" && (
                      <button
                        type="button"
                        className={btnSmall}
                        onClick={() => void act("checkout", r.id)}
                      >
                        Check out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="New reservation" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit}>
          <Field label="Guest">
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
          <Field label="Room">
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
                  {r.number} · {r.type} · {r.status}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
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
          </div>
          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Create booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
