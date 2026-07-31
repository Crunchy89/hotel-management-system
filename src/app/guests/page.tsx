"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Field,
  Modal,
  btnPrimary,
  btnSecondary,
  btnSmall,
  inputClass,
} from "@/components/Modal";
import type { Guest } from "@/lib/types";
import { api, formatError } from "@/lib/api";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  id_document: "",
};

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setGuests(await api.listGuests());
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
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) =>
      [g.first_name, g.last_name, g.email, g.phone, g.id_document]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [guests, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditing(guest);
    setForm({
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      id_document: guest.id_document,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateGuest({ id: editing.id, ...form });
      } else {
        await api.createGuest(form);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="mt-1 text-sm text-muted">Guest profiles for bookings and front desk.</p>
        </div>
        <button type="button" onClick={openCreate} className={btnPrimary}>
          Add guest
        </button>
      </header>

      <div className="mb-4">
        <input
          className={`${inputClass} max-w-md`}
          placeholder="Search name, email, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">ID document</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {loading ? "Loading…" : "No guests found."}
                </td>
              </tr>
            )}
            {filtered.map((guest) => (
              <tr key={guest.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">
                  {guest.first_name} {guest.last_name}
                </td>
                <td className="px-4 py-3">{guest.email || "—"}</td>
                <td className="px-4 py-3">{guest.phone || "—"}</td>
                <td className="px-4 py-3">{guest.id_document || "—"}</td>
                <td className="px-4 py-3">
                  <button type="button" className={btnSmall} onClick={() => openEdit(guest)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit guest" : "Add guest"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit}>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
            <Field label="First name">
              <input
                className={inputClass}
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Field>
            <Field label="Last name">
              <input
                className={inputClass}
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="ID document">
            <input
              className={inputClass}
              value={form.id_document}
              onChange={(e) => setForm({ ...form, id_document: e.target.value })}
            />
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
