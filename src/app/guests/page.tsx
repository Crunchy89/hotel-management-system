"use client";

import { FormEvent, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Field, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import type { Guest } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const headerCell =
  "px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const bodyCell = "px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  id_document: "",
};

export default function GuestsPage() {
  const { guests, loading, error, mutate } = useHotelData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

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
    openModal();
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
    openModal();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await mutate(() =>
      editing
        ? api.updateGuest({ id: editing.id, ...form })
        : api.createGuest(form),
    );
    setSaving(false);
    if (ok) closeModal();
  }

  return (
    <div>
      <PageHeader
        title="Guests"
        description="Guest profiles for bookings and front desk."
        action={
          <Button size="sm" onClick={openCreate}>
            Add guest
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <ComponentCard
        title="Guest directory"
        desc={`${guests.length} guest${guests.length === 1 ? "" : "s"} on file`}
        action={
          <input
            className={`${inputClass} sm:w-72`}
            placeholder="Search name, email, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={headerCell}>
                  Name
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Email
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Phone
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  ID document
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
                    colSpan={5}
                    className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading ? "Loading…" : "No guests found."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className={bodyCell}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold uppercase text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                        {guest.first_name.charAt(0)}
                        {guest.last_name.charAt(0)}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {guest.first_name} {guest.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={bodyCell}>
                    {guest.email || "—"}
                  </TableCell>
                  <TableCell className={bodyCell}>
                    {guest.phone || "—"}
                  </TableCell>
                  <TableCell className={bodyCell}>
                    {guest.id_document || "—"}
                  </TableCell>
                  <TableCell className={bodyCell}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openEdit(guest)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6 lg:p-8">
        <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit guest" : "Add guest"}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Guest details used for reservations and check-in.
        </p>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input
                className={inputClass}
                required
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
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
            <Field label="Email" className="sm:col-span-2">
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
                onChange={(e) =>
                  setForm({ ...form, id_document: e.target.value })
                }
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3 sm:justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save guest"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
