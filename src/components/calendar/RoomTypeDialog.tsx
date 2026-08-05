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
import type {
  BedSize,
  RoomTypeAmenities,
  RoomTypeRecord,
} from "@/lib/types";

export type RoomTypeFormValues = {
  label: string;
  bed_size: BedSize;
  amenities: RoomTypeAmenities;
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
  };
}

const RoomTypeDialog: React.FC<RoomTypeDialogProps> = ({
  isOpen,
  onClose,
  editing,
  onSave,
  onDelete,
}) => {
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
        {editing ? "Edit room type" : "Add room type"}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Bed size and amenities apply to every room of this type.
      </p>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display name" className="sm:col-span-2">
            <input
              className={inputClass}
              required
              autoFocus
              placeholder="e.g. Double room"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </Field>

          <Field label="Bed size" className="sm:col-span-2">
            <select
              className={inputClass}
              value={form.bed_size}
              onChange={(e) =>
                setForm({ ...form, bed_size: e.target.value as BedSize })
              }
            >
              {BED_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            In-room amenities
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
                {opt.label}
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
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving || deleting}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add type"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RoomTypeDialog;
