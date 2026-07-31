"use client";

import React, { useState } from "react";
import { Field, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { RoomTypeRecord } from "@/lib/types";

interface RoomTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editing: RoomTypeRecord | null;
  onSave: (values: { label: string }) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}

const RoomTypeDialog: React.FC<RoomTypeDialogProps> = ({
  isOpen,
  onClose,
  editing,
  onSave,
  onDelete,
}) => {
  const [label, setLabel] = useState(editing?.label ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (isOpen) setLabel(editing?.label ?? "");
  }, [isOpen, editing]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave({ label });
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[420px] p-6 lg:p-8">
      <h4 className="mb-1 text-theme-xl font-semibold text-gray-800 dark:text-white/90">
        {editing ? "Edit room type" : "Add room type"}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Room types group rooms in the calendar sidebar.
      </p>

      <form onSubmit={onSubmit}>
        <Field label="Display name">
          <input
            className={inputClass}
            required
            autoFocus
            placeholder="e.g. Double room"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>

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
