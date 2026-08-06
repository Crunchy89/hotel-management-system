"use client";

import React, { useState } from "react";
import { Field, inputClass } from "@/components/form";
import {
  AMENITY_OPTIONS,
  BED_SIZE_OPTIONS,
  DEFAULT_AMENITIES,
} from "@/components/rooms/roomTypeAmenities";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/context/LocaleContext";
import type {
  BedSize,
  RoomTypeAmenities,
  RoomTypeRecord,
} from "@/lib/types";

export type RoomTypeFormValues = {
  label: string;
  bed_size: BedSize;
  amenities: RoomTypeAmenities;
  max_adults: number;
  max_children: number;
  max_infants: number;
};

interface RoomTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editing: RoomTypeRecord | null;
  onSave: (values: RoomTypeFormValues) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}

function formFrom(editing: RoomTypeRecord | null): RoomTypeFormValues {
  return {
    label: editing?.label ?? "",
    bed_size: editing?.bed_size ?? "queen",
    amenities: editing?.amenities
      ? { ...editing.amenities }
      : { ...DEFAULT_AMENITIES },
    max_adults: editing?.max_adults ?? 2,
    max_children: editing?.max_children ?? 1,
    max_infants: editing?.max_infants ?? 1,
  };
}

const RoomTypeDialog: React.FC<RoomTypeDialogProps> = ({
  isOpen,
  onClose,
  editing,
  onSave,
  onDelete,
}) => {
  const t = useT();
  const [form, setForm] = useState<RoomTypeFormValues>(() => formFrom(editing));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (isOpen) setForm(formFrom(editing));
  }, [isOpen, editing]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    const ok = await onDelete();
    setDeleting(false);
    if (ok) onClose();
  }

  function toggleAmenity(key: keyof RoomTypeAmenities) {
    setForm((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] },
    }));
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] p-6 lg:p-8">
      <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
        {editing ? t("rooms.editType") : t("rooms.addTypeTitle")}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {t("rooms.typeFormHint")}
      </p>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("rooms.displayName")} className="sm:col-span-2">
            <input
              className={inputClass}
              required
              autoFocus
              placeholder={t("rooms.displayNamePlaceholder")}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </Field>

          <Field label={t("rooms.bedSize")} className="sm:col-span-2">
            <select
              className={inputClass}
              value={form.bed_size}
              onChange={(e) =>
                setForm({ ...form, bed_size: e.target.value as BedSize })
              }
            >
              {BED_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("rooms.maxAdults")}>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={20}
              required
              value={form.max_adults}
              onChange={(e) =>
                setForm({ ...form, max_adults: Number(e.target.value) })
              }
            />
          </Field>
          <Field label={t("rooms.maxChildren")}>
            <input
              className={inputClass}
              type="number"
              min={0}
              max={20}
              required
              value={form.max_children}
              onChange={(e) =>
                setForm({ ...form, max_children: Number(e.target.value) })
              }
            />
          </Field>
          <Field label={t("rooms.maxInfants")} className="sm:col-span-2">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={20}
              required
              value={form.max_infants}
              onChange={(e) =>
                setForm({ ...form, max_infants: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("rooms.inRoomAmenities")}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMENITY_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-theme-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  checked={form.amenities[opt.key]}
                  onChange={() => toggleAmenity(opt.key)}
                />
                {t(opt.labelKey)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex items-center gap-3 sm:justify-end">
          {editing && onDelete && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="mr-auto text-error-600 hover:text-error-700 dark:text-error-400"
              disabled={deleting || saving}
              onClick={handleDelete}
            >
              {deleting ? t("common.deleting") : t("common.delete")}
            </Button>
          )}
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button size="sm" type="submit" disabled={saving || deleting}>
            {saving
              ? t("common.saving")
              : editing
                ? t("rooms.saveChanges")
                : t("rooms.addType")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RoomTypeDialog;
