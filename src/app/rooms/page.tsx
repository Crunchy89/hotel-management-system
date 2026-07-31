"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Field,
  Modal,
  btnPrimary,
  btnSecondary,
  btnSmall,
  inputClass,
} from "@/components/Modal";
import { RoomStatusBadge } from "@/components/StatusBadge";
import type { Room } from "@/lib/types";
import { api, formatError } from "@/lib/api";

const emptyForm = {
  number: "",
  type: "standard",
  floor: 1,
  status: "available",
  rate: 100,
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRooms(await api.listRooms());
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setForm({
      number: room.number,
      type: room.type,
      floor: room.floor,
      status: room.status,
      rate: room.rate,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateRoom({ id: editing.id, ...form, floor: Number(form.floor), rate: Number(form.rate) });
      } else {
        await api.createRoom({ ...form, floor: Number(form.floor), rate: Number(form.rate) });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setError("");
    try {
      await api.setRoomStatus(id, status);
      await load();
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
          <p className="mt-1 text-sm text-muted">Inventory, rates, and housekeeping status.</p>
        </div>
        <button type="button" onClick={openCreate} className={btnPrimary}>
          Add room
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-bg/80 text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Number</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Floor</th>
              <th className="px-4 py-3 font-semibold">Rate</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {loading ? "Loading…" : "No rooms yet."}
                </td>
              </tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id} className="border-t border-line">
                <td className="px-4 py-3 font-semibold">{room.number}</td>
                <td className="px-4 py-3 capitalize">{room.type}</td>
                <td className="px-4 py-3 tabular-nums">{room.floor}</td>
                <td className="px-4 py-3 tabular-nums">${room.rate.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <RoomStatusBadge status={room.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={btnSmall} onClick={() => openEdit(room)}>
                      Edit
                    </button>
                    {room.status === "cleaning" && (
                      <button
                        type="button"
                        className={btnSmall}
                        onClick={() => void setStatus(room.id, "available")}
                      >
                        Mark available
                      </button>
                    )}
                    {room.status === "available" && (
                      <button
                        type="button"
                        className={btnSmall}
                        onClick={() => void setStatus(room.id, "maintenance")}
                      >
                        Maintenance
                      </button>
                    )}
                    {room.status === "maintenance" && (
                      <button
                        type="button"
                        className={btnSmall}
                        onClick={() => void setStatus(room.id, "available")}
                      >
                        Clear maintenance
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit room" : "Add room"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit}>
          <Field label="Room number">
            <input
              className={inputClass}
              required
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
            </select>
          </Field>
          <Field label="Floor">
            <input
              className={inputClass}
              type="number"
              min={0}
              required
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
            />
          </Field>
          <Field label="Nightly rate">
            <input
              className={inputClass}
              type="number"
              min={0}
              step="0.01"
              required
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
