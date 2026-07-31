"use client";

import { FormEvent, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import { RoomStatusBadge } from "@/components/StatusBadge";
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
import type { Room } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const headerCell =
  "px-5 py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400";
const bodyCell = "px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300";

const emptyForm = {
  number: "",
  type: "standard",
  floor: 1,
  status: "available",
  rate: 100,
};

export default function RoomsPage() {
  const { rooms, loading, error, mutate } = useHotelData();
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    openModal();
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
    openModal();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      floor: Number(form.floor),
      rate: Number(form.rate),
    };
    const ok = await mutate(() =>
      editing
        ? api.updateRoom({ id: editing.id, ...payload })
        : api.createRoom(payload),
    );
    setSaving(false);
    if (ok) closeModal();
  }

  async function setStatus(id: string, status: string) {
    await mutate(() => api.setRoomStatus(id, status));
  }

  return (
    <div>
      <PageHeader
        title="Rooms"
        description="Inventory, rates, and housekeeping status."
        action={
          <Button size="sm" onClick={openCreate}>
            Add room
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      <ComponentCard
        title="Room inventory"
        desc={`${rooms.length} room${rooms.length === 1 ? "" : "s"} configured`}
      >
        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={headerCell}>
                  Number
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Type
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Floor
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Rate
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Status
                </TableCell>
                <TableCell isHeader className={headerCell}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rooms.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading ? "Loading…" : "No rooms yet."}
                  </TableCell>
                </TableRow>
              )}
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell
                    className={`${bodyCell} font-semibold text-gray-800 dark:text-white/90`}
                  >
                    {room.number}
                  </TableCell>
                  <TableCell className={`${bodyCell} capitalize`}>
                    {room.type}
                  </TableCell>
                  <TableCell className={`${bodyCell} tabular-nums`}>
                    {room.floor}
                  </TableCell>
                  <TableCell className={`${bodyCell} tabular-nums`}>
                    ${room.rate.toFixed(2)}
                  </TableCell>
                  <TableCell className={bodyCell}>
                    <RoomStatusBadge status={room.status} />
                  </TableCell>
                  <TableCell className={bodyCell}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => openEdit(room)}
                      >
                        Edit
                      </Button>
                      {room.status === "cleaning" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => void setStatus(room.id, "available")}
                        >
                          Mark available
                        </Button>
                      )}
                      {room.status === "available" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => void setStatus(room.id, "maintenance")}
                        >
                          Maintenance
                        </Button>
                      )}
                      {room.status === "maintenance" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => void setStatus(room.id, "available")}
                        >
                          Clear maintenance
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6 lg:p-8">
        <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Edit room" : "Add room"}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Configure the room number, type, rate, and housekeeping status.
        </p>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <option value="twin">Twin</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="family">Family</option>
              </select>
            </Field>
            <Field label="Floor">
              <input
                className={inputClass}
                type="number"
                min={0}
                required
                value={form.floor}
                onChange={(e) =>
                  setForm({ ...form, floor: Number(e.target.value) })
                }
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
                onChange={(e) =>
                  setForm({ ...form, rate: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Status" className="sm:col-span-2">
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
          </div>

          <div className="mt-6 flex items-center gap-3 sm:justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save room"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
