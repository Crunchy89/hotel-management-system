"use client";

import { FormEvent, useState } from "react";
import RoomTypeDialog, {
  type RoomTypeFormValues,
} from "@/components/calendar/RoomTypeDialog";
import ComponentCard from "@/components/common/ComponentCard";
import PageHeader from "@/components/common/PageHeader";
import { amenitySummaryLocalized } from "@/components/rooms/roomTypeAmenities";
import { RoomStatusBadge } from "@/components/StatusBadge";
import { Alert, Field, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  PageShell,
  tableBodyCell,
  tableHeaderCell,
} from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/context/LocaleContext";
import { useModal } from "@/hooks/useModal";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/metrics";
import type { Room, RoomTypeRecord } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

const emptyForm = {
  number: "",
  type: "standard",
  floor: 1,
  status: "available",
  rate: 1_000_000,
};

export default function RoomsPage() {
  const t = useT();
  const { rooms, room_types, loading, error, mutate } = useHotelData();
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  const [editingRoomType, setEditingRoomType] = useState<RoomTypeRecord | null>(
    null,
  );
  const roomTypeModal = useModal();

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      type: room_types[0]?.slug ?? "standard",
    });
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

  function openCreateRoomType() {
    setEditingRoomType(null);
    roomTypeModal.openModal();
  }

  function openEditRoomType(type: RoomTypeRecord) {
    setEditingRoomType(type);
    roomTypeModal.openModal();
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

  const onSaveRoomType = (values: RoomTypeFormValues) =>
    mutate(() =>
      editingRoomType
        ? api.updateRoomType({ id: editingRoomType.id, ...values })
        : api.createRoomType(values),
    );

  const onDeleteRoomType = () =>
    editingRoomType
      ? mutate(() => api.deleteRoomType(editingRoomType.id))
      : Promise.resolve(false);

  const typeRecord = (slug: string) =>
    room_types.find((rt) => rt.slug === slug) ?? null;

  const typeLabel = (slug: string) => typeRecord(slug)?.label ?? slug;

  const roomsForType = (slug: string) =>
    rooms.filter((r) => r.type === slug).length;

  const inventoryDescKey =
    rooms.length === 1 ? "rooms.inventoryDesc" : "rooms.inventoryDesc_other";

  return (
    <PageShell>
      <PageHeader
        title={t("rooms.title")}
        description={t("rooms.description")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={openCreateRoomType}>
              {t("rooms.addRoomType")}
            </Button>
            <Button size="sm" onClick={openCreate}>
              {t("rooms.addRoom")}
            </Button>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}

      <ComponentCard
        title={t("rooms.typesTitle")}
        desc={t("rooms.typesDesc")}
      >
        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.type")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("rooms.bedAmenities")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("available.capacity")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.rooms")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.actions")}
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {room_types.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading ? t("common.loading") : t("rooms.noTypes")}
                  </TableCell>
                </TableRow>
              )}
              {room_types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell
                    className={`${tableBodyCell} font-semibold text-gray-800 dark:text-white/90`}
                  >
                    {type.label}
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                      {amenitySummaryLocalized(type, t)}
                    </span>
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <span className="text-theme-sm text-gray-600 dark:text-gray-400">
                      {t("available.capacityHint", {
                        adults: type.max_adults,
                        children: type.max_children,
                        infants: type.max_infants,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className={`${tableBodyCell} tabular-nums`}>
                    {roomsForType(type.slug)}
                  </TableCell>
                  <TableCell className={tableBodyCell}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openEditRoomType(type)}
                    >
                      {t("common.edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      <ComponentCard
        title={t("rooms.inventoryTitle")}
        desc={t(inventoryDescKey, { count: rooms.length })}
      >
        <div className="custom-scrollbar overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.number")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.type")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.floor")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.rate")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.status")}
                </TableCell>
                <TableCell isHeader className={tableHeaderCell}>
                  {t("common.actions")}
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
                    {loading ? t("common.loading") : t("rooms.noRooms")}
                  </TableCell>
                </TableRow>
              )}
              {rooms.map((room) => {
                const type = typeRecord(room.type);
                return (
                  <TableRow key={room.id}>
                    <TableCell
                      className={`${tableBodyCell} font-semibold text-gray-800 dark:text-white/90`}
                    >
                      {room.number}
                    </TableCell>
                    <TableCell className={tableBodyCell}>
                      <div className="flex flex-col gap-0.5">
                        <span>{typeLabel(room.type)}</span>
                        {type && (
                          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                            {amenitySummaryLocalized(type, t)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`${tableBodyCell} tabular-nums`}>
                      {room.floor}
                    </TableCell>
                    <TableCell className={`${tableBodyCell} tabular-nums`}>
                      {formatCurrency(room.rate)}
                    </TableCell>
                    <TableCell className={tableBodyCell}>
                      <RoomStatusBadge status={room.status} />
                    </TableCell>
                    <TableCell className={tableBodyCell}>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => openEdit(room)}
                        >
                          {t("common.edit")}
                        </Button>
                        {room.status === "cleaning" && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void setStatus(room.id, "available")}
                          >
                            {t("rooms.markAvailable")}
                          </Button>
                        )}
                        {room.status === "available" && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              void setStatus(room.id, "maintenance")
                            }
                          >
                            {t("rooms.maintenance")}
                          </Button>
                        )}
                        {room.status === "maintenance" && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void setStatus(room.id, "available")}
                          >
                            {t("rooms.clearMaintenance")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] p-6 lg:p-8"
      >
        <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
          {editing ? t("rooms.editRoom") : t("rooms.addRoomTitle")}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t("rooms.roomFormHint")}
        </p>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("rooms.roomNumber")}>
              <input
                className={inputClass}
                required
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </Field>
            <Field label={t("common.type")}>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {room_types.map((type) => (
                  <option key={type.id} value={type.slug}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            {typeRecord(form.type) && (
              <p className="sm:col-span-2 text-theme-xs text-gray-500 dark:text-gray-400">
                {t("rooms.inherits", {
                  summary: amenitySummaryLocalized(typeRecord(form.type)!, t),
                })}
              </p>
            )}
            <Field label={t("common.floor")}>
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
            <Field label={t("rooms.nightlyRate")}>
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
            <Field label={t("common.status")} className="sm:col-span-2">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="available">{t("status.available")}</option>
                <option value="occupied">{t("status.occupied")}</option>
                <option value="cleaning">{t("status.cleaning")}</option>
                <option value="maintenance">{t("status.maintenance")}</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3 sm:justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("rooms.saveRoom")}
            </Button>
          </div>
        </form>
      </Modal>

      <RoomTypeDialog
        isOpen={roomTypeModal.isOpen}
        onClose={roomTypeModal.closeModal}
        editing={editingRoomType}
        onSave={onSaveRoomType}
        onDelete={editingRoomType ? onDeleteRoomType : undefined}
      />
    </PageShell>
  );
}
